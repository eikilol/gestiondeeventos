/* Gestbot — sección dedicada.
   Arriba: el robot grande (mismo tamaño que el área de abajo) con fases
   de trabajo. Abajo: chat ancho a la izquierda + vista previa del evento
   que se está creando a la derecha. */

import { useState, useRef, useEffect, useCallback } from 'react';
import Criatura from '../../components/agente/Criatura.jsx';
import { agenteApi } from '../../api/agente.js';

const SUGERENCIAS = [
  '¿Qué eventos tengo?',
  'Crea un evento llamado "Demo" para el próximo viernes 7pm',
  '¿Cómo va mi último evento?',
  'Muéstrame mis recordatorios',
];

const SALUDO = {
  role: 'assistant',
  content: '¡Hola! Soy Gestbot 🤖 Tu asistente de eventos. Puedo crear y publicar eventos, armar boletas, ver ventas, gestionar tu equipo y mucho más. ¿En qué trabajamos?',
};

/* Fases que muestra el robot mientras "trabaja" */
const FASES = [
  'Interpretando la información…',
  'Desarrollando el modelo…',
  'Programándolo…',
  'Afinando los detalles…',
];

const TOOLS_EVENTO = ['crear_evento', 'editar_evento', 'duplicar_evento', 'cambiar_estado_evento', 'publicar_evento'];

export default function GestbotPage() {
  const [disponible, setDisp]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [mensajes, setMensajes] = useState([SALUDO]);
  const [input, setInput]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [mood, setMood]         = useState('idle');
  const [formActivo, setForm]   = useState(null);
  const [faseIdx, setFaseIdx]   = useState(0);
  const [evPrev, setEvPrev]     = useState(null);   // vista previa del evento
  const scrollRef = useRef(null);

  useEffect(() => {
    agenteApi.estado()
      .then(r => { setDisp(!!r.disponible); setProvider(r.provider || null); })
      .catch(() => setDisp(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes, cargando]);

  /* Cicla las fases mientras está cargando */
  useEffect(() => {
    if (!cargando) { setFaseIdx(0); return; }
    const id = setInterval(() => setFaseIdx(i => (i + 1) % FASES.length), 1500);
    return () => clearInterval(id);
  }, [cargando]);

  const enviar = useCallback(async (texto) => {
    const msg = (texto ?? input).trim();
    if (!msg || cargando) return;
    setInput('');
    setForm(null);
    const histo = [...mensajes, { role: 'user', content: msg }];
    setMensajes(histo);
    setCargando(true);
    setMood('thinking');
    try {
      const r = await agenteApi.chat(
        histo.filter(m => m.role === 'user' || m.role === 'assistant')
      );
      setMensajes(m => [...m, { role: 'assistant', content: r.reply, acciones: r.acciones }]);
      setMood(r.mood || 'talking');
      setForm(r.formulario && Array.isArray(r.formulario.campos) && r.formulario.campos.length
        ? r.formulario : null);

      /* Vista previa: tomamos el input del último tool de evento */
      const evAccion = [...(r.acciones || [])].reverse()
        .find(a => TOOLS_EVENTO.includes(a.tool) && a.input);
      if (evAccion) {
        setEvPrev(prev => ({ ...(prev || {}), ...evAccion.input, _ok: evAccion.ok, _tool: evAccion.tool }));
      }
      if ((r.acciones || []).some(a => a.ok && ['crear_evento', 'publicar_evento', 'editar_evento', 'duplicar_evento', 'cambiar_estado_evento'].includes(a.tool))) {
        window.dispatchEvent(new CustomEvent('gestek:refrescar-eventos'));
      }
      setTimeout(() => setMood('idle'), 4500);
    } catch (e) {
      setMensajes(m => [...m, { role: 'assistant', content: e.message || 'Ups, algo falló. Intenta de nuevo.' }]);
      setMood('error');
      setTimeout(() => setMood('idle'), 3000);
    } finally {
      setCargando(false);
    }
  }, [input, mensajes, cargando]);

  const enviarFormulario = useCallback((valores) => {
    const f = formActivo;
    if (!f) return;
    const lineas = f.campos.map(c => {
      const v = valores[c.clave];
      return `- ${c.etiqueta}: ${v == null || v === '' ? '(sin dato)' : v}`;
    });
    setForm(null);
    enviar(`Datos de "${f.titulo}":\n${lineas.join('\n')}`);
  }, [formActivo, enviar]);

  const moodActual = cargando ? 'thinking' : mood;
  const estadoTxt = cargando
    ? FASES[faseIdx]
    : mood === 'happy' ? '¡Listo! Resultado correcto ✓'
    : mood === 'error' ? 'Hubo un problema con la solicitud'
    : mood === 'talking' ? 'Respondiendo…'
    : 'Listo para ayudarte';

  if (disponible === false) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center space-y-4">
        <div className="flex justify-center"><Criatura mood="error" size={150} /></div>
        <h1 className="text-2xl font-display font-bold text-text-1">Gestbot no está activo</h1>
        <p className="text-text-2">
          Falta una API key de IA en el servidor (Groq o Gemini son gratis).
          Define <code className="text-primary">GROQ_API_KEY</code> en el <code>.env</code> y reinicia el backend.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 h-[calc(100vh-7rem)]">

      {/* ── ARRIBA: el robot ── */}
      <div className="flex-1 min-h-[240px] rounded-3xl border border-border-2
                      bg-gradient-to-b from-surface-2 to-surface relative overflow-hidden
                      flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem]
                        rounded-full bg-primary/15 blur-[100px]" />
        <div className="relative flex items-center gap-6">
          <Criatura mood={moodActual} size={210} />
          <div className="hidden sm:block text-left max-w-xs">
            <h2 className="text-3xl font-display font-bold text-text-1">Gestbot</h2>
            <p className={`mt-1 text-sm font-medium transition-colors ${
              cargando ? 'text-primary-light'
              : mood === 'error' ? 'text-danger'
              : mood === 'happy' ? 'text-success' : 'text-text-2'}`}>
              {estadoTxt}
            </p>
            {cargando && (
              <div className="mt-3 space-y-1.5">
                {FASES.map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs transition-opacity
                    ${i <= faseIdx ? 'opacity-100' : 'opacity-35'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${i <= faseIdx ? 'bg-primary' : 'bg-text-3'}`} />
                    <span className={i === faseIdx ? 'text-text-1' : 'text-text-3'}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {provider && !cargando && (
              <span className="inline-block mt-3 text-[10px] uppercase tracking-widest text-text-3
                               border border-border rounded-full px-2.5 py-1">
                motor: {provider}
              </span>
            )}
          </div>
        </div>
        <p className="sm:hidden relative mt-2 text-sm text-text-2">{estadoTxt}</p>
      </div>

      {/* ── ABAJO: chat + vista previa ── */}
      <div className="flex-1 min-h-[260px] flex gap-5">

        {/* Chat (ancho) */}
        <div className="flex-1 flex flex-col rounded-3xl border border-border-2 bg-surface/70 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap
                  ${m.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-surface-2 text-text-1 border border-border rounded-bl-sm'}`}>
                  {m.content}
                  {Array.isArray(m.acciones) && m.acciones.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.acciones.map((a, j) => (
                        <span key={j}
                          className={`text-[10px] px-2 py-0.5 rounded-full border
                            ${a.ok ? 'border-success/40 text-success' : 'border-danger/40 text-danger'}`}>
                          {a.ok ? '✓' : '✕'} {a.tool}
                        </span>
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
                               text-text-2 hover:text-text-1 hover:border-primary/50 transition">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); enviar(); }}
            className="flex items-end gap-2 p-3 sm:p-4 border-t border-border bg-surface-2/50"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Escríbele a Gestbot…"
              disabled={cargando}
              className="flex-1 resize-none max-h-32 rounded-xl bg-surface border border-border
                         px-3.5 py-3 text-[15px] text-text-1 placeholder:text-text-3
                         focus:outline-none focus:border-primary/60 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={cargando || !input.trim()}
              aria-label="Enviar"
              className="shrink-0 rounded-xl bg-gradient-primary p-3 text-white
                         disabled:opacity-40 hover:opacity-90 active:scale-95 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>

        {/* Vista previa del evento (al lado del chat) */}
        <div className="hidden lg:flex w-[300px] flex-shrink-0 flex-col rounded-3xl
                        border border-border-2 bg-surface/70 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-display font-semibold text-text-1 text-sm">Vista previa del evento</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {evPrev ? <EventoPreview ev={evPrev} /> : (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-3 gap-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
                </svg>
                <p className="text-sm">Cuando crees o edites un evento con Gestbot, aquí verás la vista previa.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventoPreview({ ev }) {
  const fecha = ev.fecha_inicio || ev.nueva_fecha_inicio;
  const fechaTxt = fecha ? new Date(fecha).toLocaleString('es', {
    dateStyle: 'medium', timeStyle: 'short',
  }) : null;
  const titulo = ev.titulo || ev.nuevo_titulo || '(sin título)';
  const okColor = ev._ok ? 'border-success/40 text-success' : 'border-warning/40 text-warning';

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="h-28 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20
                      border border-border flex items-center justify-center">
        <span className="text-3xl font-display font-bold text-white/80">
          {titulo.slice(0, 1).toUpperCase()}
        </span>
      </div>
      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${okColor}`}>
        {ev._ok ? 'creado/actualizado ✓' : 'en proceso'}
      </span>
      <h3 className="text-lg font-display font-bold text-text-1 leading-tight">{titulo}</h3>
      {ev.descripcion && <p className="text-sm text-text-2 line-clamp-4">{ev.descripcion}</p>}
      <dl className="text-sm space-y-1.5">
        {fechaTxt && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-3">Inicio</dt><dd className="text-text-1 text-right">{fechaTxt}</dd>
          </div>
        )}
        {ev.modalidad && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-3">Modalidad</dt><dd className="text-text-1 capitalize">{ev.modalidad}</dd>
          </div>
        )}
        {ev.location_nombre && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-3">Lugar</dt><dd className="text-text-1 text-right">{ev.location_nombre}</dd>
          </div>
        )}
        {ev.estado && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-3">Estado</dt><dd className="text-text-1 capitalize">{ev.estado}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/* ── Formulario estructurado ── */
const TIPO_INPUT = {
  texto: 'text', numero: 'number', email: 'email',
  telefono: 'tel', fecha: 'date', fechahora: 'datetime-local',
};

function FormAgente({ form, onSubmit, onCancel }) {
  const [vals, setVals] = useState({});
  const set = (k, v) => setVals(s => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const faltan = (form.campos || [])
      .filter(c => c.requerido !== false &&
        (vals[c.clave] == null || String(vals[c.clave]).trim() === ''));
    if (faltan.length) {
      set('__err', `Completa: ${faltan.map(c => c.etiqueta).join(', ')}`);
      return;
    }
    onSubmit(vals);
  };

  return (
    <form onSubmit={submit}
      className="rounded-2xl border border-primary/40 bg-surface-2/80 p-4 space-y-3 animate-scale-in">
      <div>
        <p className="font-display font-semibold text-text-1">{form.titulo}</p>
        {form.descripcion && <p className="text-sm text-text-2 mt-0.5">{form.descripcion}</p>}
      </div>

      {(form.campos || []).map((c, i) => (
        <div key={c.clave || i} className="space-y-1">
          <label className="block text-sm font-medium text-text-2">
            {i + 1}. {c.etiqueta}
            {c.requerido !== false && <span className="text-danger"> *</span>}
          </label>
          {c.tipo === 'textarea' ? (
            <textarea rows={2} placeholder={c.placeholder || ''}
              value={vals[c.clave] || ''} onChange={(e) => set(c.clave, e.target.value)}
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
            <input type={TIPO_INPUT[c.tipo] || 'text'} placeholder={c.placeholder || ''}
              value={vals[c.clave] || ''} onChange={(e) => set(c.clave, e.target.value)}
              className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm
                         text-text-1 placeholder:text-text-3 focus:outline-none focus:border-primary/60" />
          )}
        </div>
      ))}

      {vals.__err && <p className="text-sm text-danger">{vals.__err}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit"
          className="flex-1 rounded-lg bg-gradient-primary py-2.5 text-sm font-semibold text-white
                     hover:opacity-90 active:scale-95 transition">
          Enviar a Gestbot
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-2
                     hover:text-text-1 hover:border-border-2 transition">
          Cancelar
        </button>
      </div>
    </form>
  );
}
