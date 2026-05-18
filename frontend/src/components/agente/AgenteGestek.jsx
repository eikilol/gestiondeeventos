/* Gestek — launcher flotante + panel de chat con la criatura asistente.
   Se monta una vez en AppLayout (área privada). Conversa con el backend
   /me/agente/chat y la criatura reacciona con animaciones según el "mood". */

import { useState, useRef, useEffect, useCallback } from 'react';
import Criatura from './Criatura.jsx';
import { agenteApi } from '../../api/agente.js';

const SUGERENCIAS = [
  '¿Qué eventos tengo?',
  'Crea un evento llamado "Demo" para el próximo viernes 7pm',
  '¿Cómo va mi último evento?',
];

const SALUDO = {
  role: 'assistant',
  content: '¡Hola! Soy Gestek 🪄 Puedo crear y publicar eventos, armar boletas o contarte cómo van tus ventas. ¿Qué hacemos?',
};

export default function AgenteGestek() {
  const [open, setOpen]         = useState(false);
  const [disponible, setDisp]   = useState(null);   // null=desconocido
  const [mensajes, setMensajes] = useState([SALUDO]);
  const [input, setInput]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [mood, setMood]         = useState('idle');
  const scrollRef = useRef(null);

  useEffect(() => {
    agenteApi.estado()
      .then(r => setDisp(!!r.disponible))
      .catch(() => setDisp(false));
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, open, cargando]);

  const enviar = useCallback(async (texto) => {
    const msg = (texto ?? input).trim();
    if (!msg || cargando) return;
    setInput('');
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
      /* Si creó/publicó un evento, ofrecemos navegar */
      const navAccion = (r.acciones || []).find(
        a => a.ok && ['crear_evento', 'publicar_evento', 'editar_evento'].includes(a.tool)
      );
      if (navAccion) window.dispatchEvent(new CustomEvent('gestek:refrescar-eventos'));
      setTimeout(() => setMood('idle'), 4200);
    } catch (e) {
      setMensajes(m => [...m, { role: 'assistant', content: e.message || 'Ups, algo falló. Intenta de nuevo.' }]);
      setMood('error');
      setTimeout(() => setMood('idle'), 3000);
    } finally {
      setCargando(false);
    }
  }, [input, mensajes, cargando]);

  if (disponible === false) return null;   // servidor sin IA → no estorbar

  return (
    <>
      {/* Launcher flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente Gestek"
          className="fixed bottom-5 right-5 z-50 group flex items-center gap-2 rounded-full
                     bg-surface-2/90 backdrop-blur border border-border-2 shadow-glow-accent
                     pl-2 pr-4 py-2 hover:scale-105 active:scale-95 transition-transform"
        >
          <Criatura mood="idle" size={48} />
          <span className="hidden sm:block text-sm font-display font-semibold text-text-1">
            Pregúntale a Gestek
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(94vw,400px)] h-[min(78vh,620px)]
                        flex flex-col rounded-3xl overflow-hidden
                        bg-surface/95 backdrop-blur-xl border border-border-2 shadow-card-hover
                        animate-scale-in">
          {/* Header */}
          <div className="relative flex items-center gap-3 px-4 py-3
                          bg-gradient-to-br from-accent-dark/40 to-primary-dark/30 border-b border-border">
            <Criatura mood={cargando ? 'thinking' : mood} size={56} />
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-text-1 leading-tight">Gestek</p>
              <p className="text-xs text-text-2">
                {cargando ? 'pensando…' : 'tu asistente de eventos'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-text-2 hover:text-text-1 rounded-lg p-1.5 hover:bg-white/5 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
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
                    <span className="w-2 h-2 rounded-full bg-text-2 animate-pulse-soft" />
                    <span className="w-2 h-2 rounded-full bg-text-2 animate-pulse-soft" style={{ animationDelay: '.2s' }} />
                    <span className="w-2 h-2 rounded-full bg-text-2 animate-pulse-soft" style={{ animationDelay: '.4s' }} />
                  </div>
                </div>
              </div>
            )}

            {mensajes.length === 1 && !cargando && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGERENCIAS.map((s, i) => (
                  <button key={i} onClick={() => enviar(s)}
                    className="text-xs text-left px-3 py-2 rounded-xl bg-surface-2 border border-border
                               text-text-2 hover:text-text-1 hover:border-border-2 transition">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); enviar(); }}
            className="flex items-end gap-2 p-3 border-t border-border bg-surface-2/50"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
              }}
              placeholder="Escríbele a Gestek…"
              disabled={cargando}
              className="flex-1 resize-none max-h-28 rounded-xl bg-surface border border-border
                         px-3 py-2.5 text-sm text-text-1 placeholder:text-text-3
                         focus:outline-none focus:border-primary/60 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={cargando || !input.trim()}
              aria-label="Enviar"
              className="shrink-0 rounded-xl bg-gradient-primary p-2.5 text-white
                         disabled:opacity-40 hover:opacity-90 active:scale-95 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
