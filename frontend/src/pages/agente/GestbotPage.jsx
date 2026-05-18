/* Gestbot — sección dedicada del asistente.
   Robot grande que interactúa (gestos, saluda, y "saca su PC" cuando
   está trabajando) + chat conversacional con formularios estructurados. */

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

const ESTADO_TXT = {
  idle: 'listo para ayudarte',
  thinking: 'trabajando en eso…',
  talking: 'respondiendo',
  happy: '¡hecho!',
  error: 'ups, algo pasó',
};

export default function GestbotPage() {
  const [disponible, setDisp]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [mensajes, setMensajes] = useState([SALUDO]);
  const [input, setInput]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [mood, setMood]         = useState('idle');
  const [formActivo, setForm]   = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    agenteApi.estado()
      .then(r => { setDisp(!!r.disponible); setProvider(r.provider || null); })
      .catch(() => setDisp(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes, cargando]);

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
      const navAccion = (r.acciones || []).find(
        a => a.ok && ['crear_evento', 'publicar_evento', 'editar_evento', 'duplicar_evento', 'cambiar_estado_evento'].includes(a.tool)
      );
      if (navAccion) window.dispatchEvent(new CustomEvent('gestek:refrescar-eventos'));
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

  if (disponible === false) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center space-y-4">
        <Criatura mood="error" size={140} />
        <h1 className="text-2xl font-display font-bold text-text-1">Gestbot no está activo</h1>
        <p className="text-text-2">
          Falta configurar una API key de IA en el servidor (Groq o Gemini son gratis).
          Define <code className="text-primary">GROQ_API_KEY</code> en el <code>.env</code> y reinicia el backend.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-7rem)]">

        {/* ── Escena del robot ── */}
        <div className="lg:w-[320px] flex-shrink-0 rounded-3xl border border-border-2
                        bg-gradient-to-b from-surface-2 to-surface flex flex-col items-center
                        justify-center p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full
                          bg-primary/15 blur-3xl" />
          <div className="relative">
            <Criatura mood={moodActual} size={220} />
          </div>
          <h2 className="relative mt-4 text-2xl font-display font-bold text-text-1">Gestbot</h2>
          <p className="relative text-sm text-text-2 mt-1">
            {ESTADO_TXT[moodActual] || 'tu asistente de eventos'}
          </p>
          {provider && (
            <span className="relative mt-3 text-[10px] uppercase tracking-widest text-text-3
                             border border-border rounded-full px-2.5 py-1">
              motor: {provider}
            </span>
          )}
        </div>

        {/* ── Chat ── */}
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
      </div>
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
