/* Gestbot — sección dedicada.
   3 columnas: historial (izq) · bot+chat en un mismo recuadro (centro) ·
   vista previa grande (der). Persistencia de conversaciones en
   localStorage. Adjuntar PDFs/imágenes para que el bot los analice. */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Criatura from '../../components/agente/Criatura.jsx';
import { agenteApi } from '../../api/agente.js';
import { usePlan } from '../../hooks/usePlan.js';
import { alertDialog } from '../../components/ui/Confirm.jsx';

const LS_KEY = 'gestbot:convs';
const SALUDO = {
  role: 'assistant',
  content: '¡Hola! Soy Gestbot 🤖 Puedo crear y publicar eventos, armar boletas, ver ventas, gestionar tu equipo y hasta leer un PDF o fotos para armar el evento. ¿En qué trabajamos?',
};
const SUGERENCIAS = [
  '¿Qué eventos tengo?',
  'Crea un evento llamado "Demo" para el próximo viernes 7pm',
  'Analiza este PDF y crea el evento',
  'Muéstrame mis recordatorios',
];
const FASES = [
  'Interpretando la información…',
  'Desarrollando el modelo…',
  'Programándolo…',
  'Afinando los detalles…',
];
const TOOLS_EVENTO = ['crear_evento', 'editar_evento', 'duplicar_evento', 'cambiar_estado_evento', 'publicar_evento'];

const nuevaConv = () => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  titulo: 'Nueva conversación',
  mensajes: [SALUDO],
  evPrev: null,
  ts: Date.now(),
});

function cargarConvs() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch { /* noop */ }
  return [nuevaConv()];
}

export default function GestbotPage() {
  const [disponible, setDisp]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [convs, setConvs]       = useState(cargarConvs);
  const [activa, setActiva]     = useState(() => cargarConvs()[0].id);
  const [input, setInput]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [mood, setMood]         = useState('idle');
  const [formActivo, setForm]   = useState(null);
  const [faseIdx, setFaseIdx]   = useState(0);
  const [adjuntos, setAdjuntos] = useState([]);
  const scrollRef = useRef(null);
  const fileRef   = useRef(null);
  const { esPro, loading: planLoading } = usePlan();

  const conv = convs.find(c => c.id === activa) || convs[0];
  const mensajes = conv.mensajes;
  const evPrev = conv.evPrev;

  useEffect(() => {
    agenteApi.estado()
      .then(r => { setDisp(!!r.disponible); setProvider(r.provider || null); })
      .catch(() => setDisp(false));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(convs.slice(0, 30))); } catch { /* noop */ }
  }, [convs]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes, cargando, activa]);

  useEffect(() => {
    if (!cargando) { setFaseIdx(0); return; }
    const id = setInterval(() => setFaseIdx(i => (i + 1) % FASES.length), 1500);
    return () => clearInterval(id);
  }, [cargando]);

  const patchConv = useCallback((id, patch) => {
    setConvs(cs => cs.map(c => c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c));
  }, []);

  const enviar = useCallback(async (texto) => {
    const msg = (texto ?? input).trim();
    if ((!msg && adjuntos.length === 0) || cargando) return;
    setInput('');
    setForm(null);
    const archivos = adjuntos.map(a => ({ nombre: a.nombre, tipo: a.tipo, datos: a.datos }));
    setAdjuntos([]);
    const userMsg = {
      role: 'user',
      content: msg || '(archivo adjunto para analizar)',
      adjuntos: archivos.map(a => a.nombre),
    };
    const histo = [...mensajes, userMsg];
    patchConv(activa, c => ({
      mensajes: histo,
      titulo: c.titulo === 'Nueva conversación' && msg ? msg.slice(0, 40) : c.titulo,
    }));
    setCargando(true);
    setMood('thinking');
    try {
      const r = await agenteApi.chat(
        histo.filter(m => m.role === 'user' || m.role === 'assistant')
              .map(m => ({ role: m.role, content: m.content })),
        archivos.length ? archivos : undefined
      );
      const evAccion = [...(r.acciones || [])].reverse()
        .find(a => TOOLS_EVENTO.includes(a.tool) && a.input);
      patchConv(activa, c => ({
        mensajes: [...c.mensajes, { role: 'assistant', content: r.reply, acciones: r.acciones }],
        evPrev: evAccion ? { ...(c.evPrev || {}), ...evAccion.input, _ok: evAccion.ok, _tool: evAccion.tool } : c.evPrev,
      }));
      setMood(r.mood || 'talking');
      setForm(r.formulario && Array.isArray(r.formulario.campos) && r.formulario.campos.length ? r.formulario : null);
      if ((r.acciones || []).some(a => a.ok && TOOLS_EVENTO.includes(a.tool))) {
        window.dispatchEvent(new CustomEvent('gestek:refrescar-eventos'));
      }
      setTimeout(() => setMood('idle'), 4500);
    } catch (e) {
      patchConv(activa, c => ({ mensajes: [...c.mensajes, { role: 'assistant', content: e.message || 'Ups, algo falló.' }] }));
      setMood('error');
      setTimeout(() => setMood('idle'), 3000);
    } finally {
      setCargando(false);
    }
  }, [input, mensajes, cargando, adjuntos, activa, patchConv]);

  const enviarFormulario = useCallback((valores) => {
    if (!formActivo) return;
    const lineas = formActivo.campos.map(c => {
      const v = valores[c.clave];
      return `- ${c.etiqueta}: ${v == null || v === '' ? '(sin dato)' : v}`;
    });
    const t = formActivo.titulo;
    setForm(null);
    enviar(`Datos de "${t}":\n${lineas.join('\n')}`);
  }, [formActivo, enviar]);

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    const leidos = await Promise.all(files.slice(0, 5).map(f => new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res({ nombre: f.name, tipo: f.type || 'application/octet-stream', datos: fr.result, size: f.size });
      fr.onerror = () => res(null);
      fr.readAsDataURL(f);
    })));
    const ok = leidos.filter(Boolean);
    const total = ok.reduce((s, a) => s + a.size, 0);
    if (total > 7 * 1024 * 1024) { alertDialog('Los adjuntos superan 7 MB. Sube archivos más livianos.'); return; }
    setAdjuntos(a => [...a, ...ok].slice(0, 5));
  };

  const crearConv = () => { const n = nuevaConv(); setConvs(cs => [n, ...cs]); setActiva(n.id); setForm(null); };
  const borrarConv = (id) => {
    setConvs(cs => {
      const r = cs.filter(c => c.id !== id);
      const f = r.length ? r : [nuevaConv()];
      if (id === activa) setActiva(f[0].id);
      return f;
    });
  };

  const moodActual = cargando ? 'thinking' : mood;
  const estadoTxt = cargando ? FASES[faseIdx]
    : mood === 'happy' ? '¡Listo! Resultado correcto ✓'
    : mood === 'error' ? 'Hubo un problema con la solicitud'
    : mood === 'talking' ? 'Respondiendo…' : 'Listo para ayudarte';

  if (!planLoading && !esPro) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-5">
        <div className="flex justify-center"><Criatura mood="happy" size={170} /></div>
        <span className="inline-block text-[11px] uppercase tracking-widest text-accent-light
                         border border-accent/40 rounded-full px-3 py-1">Función Pro</span>
        <h1 className="text-2xl font-display font-bold text-text-1">Gestbot es parte del plan Pro</h1>
        <p className="text-text-2">
          Tu asistente de eventos con IA — crea y publica eventos, arma boletas,
          analiza PDFs y más, hablando en lenguaje natural. Disponible al activar Pro.
        </p>
        <Link to="/configuracion"
          className="inline-block rounded-xl bg-gradient-primary px-6 py-3 text-white font-semibold
                     hover:opacity-90 active:scale-95 transition">
          Activar Pro
        </Link>
      </div>
    );
  }

  if (disponible === false) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center space-y-4">
        <div className="flex justify-center"><Criatura mood="error" size={150} /></div>
        <h1 className="text-2xl font-display font-bold text-text-1">Gestbot no está activo</h1>
        <p className="text-text-2">Falta una API key de IA (Groq o Gemini son gratis). Define
          <code className="text-primary"> GROQ_API_KEY</code> en el <code>.env</code> y reinicia el backend.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── IZQUIERDA: historial ── */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col rounded-3xl
                        border border-border-2 bg-surface/70 overflow-hidden">
        <div className="p-3 border-b border-border">
          <button onClick={crearConv}
            className="w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-white
                       hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            Nueva
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-text-3">Historial</p>
          {convs.map(c => (
            <div key={c.id}
              className={`group flex items-center gap-1 rounded-xl px-2.5 py-2 cursor-pointer transition
                ${c.id === activa ? 'bg-surface-2 border border-primary/40' : 'hover:bg-surface-2 border border-transparent'}`}
              onClick={() => { setActiva(c.id); setForm(null); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   className="text-text-3 flex-shrink-0">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" /></svg>
              <span className="flex-1 min-w-0 truncate text-sm text-text-1">{c.titulo}</span>
              <button onClick={(e) => { e.stopPropagation(); borrarConv(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-danger transition"
                aria-label="Borrar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── CENTRO: bot + chat (mismo recuadro) ── */}
      <div className="flex-1 flex flex-col rounded-3xl border border-border-2 bg-surface/70 overflow-hidden">
        {/* Cabecera robot */}
        <div className="relative flex items-center gap-4 px-5 py-4 border-b border-border
                        bg-gradient-to-br from-surface-2 to-surface overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-25" />
          <Criatura mood={moodActual} size={92} />
          <div className="relative flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-text-1">Gestbot</h2>
            <p className={`text-sm font-medium ${cargando ? 'text-primary-light'
              : mood === 'error' ? 'text-danger' : mood === 'happy' ? 'text-success' : 'text-text-2'}`}>
              {estadoTxt}
            </p>
            {cargando && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {FASES.map((f, i) => (
                  <span key={i} className={`text-[11px] ${i === faseIdx ? 'text-text-1' : i < faseIdx ? 'text-primary' : 'text-text-3'}`}>
                    {i < faseIdx ? '✓ ' : i === faseIdx ? '• ' : '○ '}{f.replace('…', '')}
                  </span>
                ))}
              </div>
            )}
          </div>
          {provider && (
            <span className="relative text-[10px] uppercase tracking-widest text-text-3
                             border border-border rounded-full px-2.5 py-1">{provider}</span>
          )}
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3">
          {mensajes.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap
                ${m.role === 'user' ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-surface-2 text-text-1 border border-border rounded-bl-sm'}`}>
                {m.content}
                {Array.isArray(m.adjuntos) && m.adjuntos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.adjuntos.map((n, j) => (
                      <span key={j} className="text-[10px] bg-white/15 rounded px-2 py-0.5">📎 {n}</span>
                    ))}
                  </div>
                )}
                {Array.isArray(m.acciones) && m.acciones.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {m.acciones.map((a, j) => (
                        <span key={j} className={`text-[10px] px-2 py-0.5 rounded-full border
                          ${a.ok ? 'border-success/40 text-success' : 'border-danger/40 text-danger'}`}>
                          {a.ok ? '✓' : '✕'} {a.tool}
                        </span>
                      ))}
                    </div>
                    {m.acciones.filter(a => a.ok && a.resultado).map((a, j) => (
                      <ResultadoView key={j} resultado={a.resultado} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {cargando && (
            <div className="flex justify-start">
              <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-light animate-pulse-soft" />
                  <span className="w-2 h-2 rounded-full bg-primary-light animate-pulse-soft" style={{ animationDelay: '.2s' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-light animate-pulse-soft" style={{ animationDelay: '.4s' }} />
                </div>
              </div>
            </div>
          )}

          {formActivo && !cargando && (
            <FormAgente form={formActivo} onSubmit={enviarFormulario} onCancel={() => setForm(null)} />
          )}

          {mensajes.length === 1 && !cargando && !formActivo && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGERENCIAS.map((s, i) => (
                <button key={i} onClick={() => enviar(s)}
                  className="text-sm text-left px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border
                             text-text-2 hover:text-text-1 hover:border-primary/50 transition">{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* Adjuntos pendientes */}
        {adjuntos.length > 0 && (
          <div className="px-4 pt-2 flex flex-wrap gap-2">
            {adjuntos.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs bg-surface-2 border border-border
                                       rounded-lg px-2.5 py-1.5 text-text-2">
                📎 {a.nombre.slice(0, 22)}
                <button onClick={() => setAdjuntos(x => x.filter((_, j) => j !== i))}
                  className="text-text-3 hover:text-danger" aria-label="Quitar">✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); enviar(); }}
          className="flex items-end gap-2 p-3 sm:p-4 border-t border-border bg-surface-2/50">
          <input ref={fileRef} type="file" multiple accept="image/*,application/pdf"
                 onChange={onFiles} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={cargando}
            aria-label="Adjuntar PDF o foto"
            className="shrink-0 rounded-xl border border-border p-3 text-text-2 hover:text-text-1
                       hover:border-primary/50 disabled:opacity-40 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                    strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder="Escríbele a Gestbot…  (o adjunta un PDF/foto)"
            disabled={cargando}
            className="flex-1 resize-none max-h-32 rounded-xl bg-surface border border-border
                       px-3.5 py-3 text-[15px] text-text-1 placeholder:text-text-3
                       focus:outline-none focus:border-primary/60 disabled:opacity-60" />
          <button type="submit" disabled={cargando || (!input.trim() && adjuntos.length === 0)}
            aria-label="Enviar"
            className="shrink-0 rounded-xl bg-gradient-primary p-3 text-white
                       disabled:opacity-40 hover:opacity-90 active:scale-95 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
      </div>

      {/* ── DERECHA: vista previa grande ── */}
      <aside className="hidden xl:flex w-[380px] flex-shrink-0 flex-col rounded-3xl
                        border border-border-2 bg-surface/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="font-display font-semibold text-text-1">Vista previa del evento</p>
          <p className="text-xs text-text-3 mt-0.5">Se actualiza cuando creas o editas con Gestbot</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {evPrev ? <EventoPreview ev={evPrev} /> : (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-3 gap-3">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.4" className="text-text-3/60">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M3 9h18M8 2v4M16 2v4M8 14h5" strokeLinecap="round" />
              </svg>
              <p className="text-sm max-w-[220px]">Pídele a Gestbot crear un evento (o súbele un PDF/foto)
                y aquí verás la vista previa en grande.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* Render genérico del resultado de una herramienta de lectura */
function ResultadoView({ resultado }) {
  if (!resultado || typeof resultado !== 'object' || resultado.error) return null;
  const arrKey = Object.keys(resultado).find(k => Array.isArray(resultado[k]) && resultado[k].length);
  if (arrKey) {
    const items = resultado[arrKey];
    return (
      <div className="rounded-xl border border-border bg-surface/60 divide-y divide-border">
        {items.slice(0, 8).map((it, i) => (
          <div key={i} className="px-3 py-2 text-[13px]">
            {typeof it === 'object' && it ? (
              <>
                <p className="text-text-1 font-medium truncate">
                  {it.titulo || it.nombre || it.evento || it.codigo || it.recompensa || `#${i + 1}`}
                </p>
                <p className="text-text-3 truncate">
                  {[it.estado, it.fecha_inicio || it.fecha || it.vence, it.email, it.puntos != null ? it.puntos + ' pts' : null,
                    it.precio != null ? '$' + it.precio : null]
                    .filter(Boolean).join(' · ')}
                </p>
              </>
            ) : <span className="text-text-2">{String(it)}</span>}
          </div>
        ))}
        {items.length > 8 && <div className="px-3 py-1.5 text-[11px] text-text-3">+{items.length - 8} más</div>}
      </div>
    );
  }
  const pares = Object.entries(resultado).filter(([k, v]) =>
    k !== 'ok' && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'));
  if (!pares.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-3 py-2 text-[13px] space-y-0.5">
      {pares.slice(0, 8).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <span className="text-text-3 capitalize">{k.replace(/_/g, ' ')}</span>
          <span className="text-text-1 text-right truncate">{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function EventoPreview({ ev }) {
  const fecha = ev.fecha_inicio || ev.nueva_fecha_inicio;
  const fechaTxt = fecha ? new Date(fecha).toLocaleString('es', { dateStyle: 'full', timeStyle: 'short' }) : null;
  const titulo = ev.titulo || ev.nuevo_titulo || '(sin título)';
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-44 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20
                      border border-border flex items-center justify-center">
        <span className="text-5xl font-display font-bold text-white/80">{titulo.slice(0, 1).toUpperCase()}</span>
      </div>
      <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full border
        ${ev._ok ? 'border-success/40 text-success' : 'border-warning/40 text-warning'}`}>
        {ev._ok ? 'guardado en GESTEK ✓' : 'en proceso'}
      </span>
      <h3 className="text-2xl font-display font-bold text-text-1 leading-tight">{titulo}</h3>
      {ev.descripcion && <p className="text-sm text-text-2">{ev.descripcion}</p>}
      <dl className="text-sm space-y-2 border-t border-border pt-3">
        {fechaTxt && <Row k="Inicio" v={fechaTxt} />}
        {ev.fecha_fin && <Row k="Fin" v={new Date(ev.fecha_fin).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })} />}
        {ev.modalidad && <Row k="Modalidad" v={ev.modalidad} cap />}
        {ev.location_nombre && <Row k="Lugar" v={ev.location_nombre} />}
        {ev.url_virtual && <Row k="Enlace" v={ev.url_virtual} />}
        {ev.estado && <Row k="Estado" v={ev.estado} cap />}
      </dl>
    </div>
  );
}
function Row({ k, v, cap }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-3">{k}</dt>
      <dd className={`text-text-1 text-right ${cap ? 'capitalize' : ''}`}>{v}</dd>
    </div>
  );
}

/* ── Formulario estructurado ── */
const TIPO_INPUT = { texto: 'text', numero: 'number', email: 'email', telefono: 'tel', fecha: 'date', fechahora: 'datetime-local' };

function FormAgente({ form, onSubmit, onCancel }) {
  const [vals, setVals] = useState({});
  const set = (k, v) => setVals(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const faltan = (form.campos || []).filter(c => c.requerido !== false &&
      (vals[c.clave] == null || String(vals[c.clave]).trim() === ''));
    if (faltan.length) { set('__err', `Completa: ${faltan.map(c => c.etiqueta).join(', ')}`); return; }
    onSubmit(vals);
  };
  return (
    <form onSubmit={submit} className="rounded-2xl border border-primary/40 bg-surface-2/80 p-4 space-y-3 animate-scale-in">
      <div>
        <p className="font-display font-semibold text-text-1">{form.titulo}</p>
        {form.descripcion && <p className="text-sm text-text-2 mt-0.5">{form.descripcion}</p>}
      </div>
      {(form.campos || []).map((c, i) => (
        <div key={c.clave || i} className="space-y-1">
          <label className="block text-sm font-medium text-text-2">
            {i + 1}. {c.etiqueta}{c.requerido !== false && <span className="text-danger"> *</span>}
          </label>
          {c.tipo === 'textarea' ? (
            <textarea rows={2} placeholder={c.placeholder || ''} value={vals[c.clave] || ''}
              onChange={(e) => set(c.clave, e.target.value)}
              className="w-full resize-none rounded-lg bg-surface border border-border px-3 py-2 text-sm
                         text-text-1 placeholder:text-text-3 focus:outline-none focus:border-primary/60" />
          ) : c.tipo === 'opcion' ? (
            <select value={vals[c.clave] || ''} onChange={(e) => set(c.clave, e.target.value)}
              className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm
                         text-text-1 focus:outline-none focus:border-primary/60">
              <option value="">— elegir —</option>
              {(c.opciones || []).map((o, j) => <option key={j} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={TIPO_INPUT[c.tipo] || 'text'} placeholder={c.placeholder || ''} value={vals[c.clave] || ''}
              onChange={(e) => set(c.clave, e.target.value)}
              className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm
                         text-text-1 placeholder:text-text-3 focus:outline-none focus:border-primary/60" />
          )}
        </div>
      ))}
      {vals.__err && <p className="text-sm text-danger">{vals.__err}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-lg bg-gradient-primary py-2.5 text-sm font-semibold text-white
                                          hover:opacity-90 active:scale-95 transition">Enviar a Gestbot</button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-2
                     hover:text-text-1 hover:border-border-2 transition">Cancelar</button>
      </div>
    </form>
  );
}
