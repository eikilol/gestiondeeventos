/* Modal de confirmación estilizado, global.

   Uso (en cualquier parte, dentro o fuera de hooks):
     import { confirmDialog } from '../components/ui/Confirm.jsx';
     if (!(await confirmDialog({ message: '¿Borrar?', danger: true }))) return;

   Montar <ConfirmHost /> una sola vez (en App, junto a los providers). */

import { useEffect, useState, useCallback } from 'react';

let _open = null; // setter registrado por el host

export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    if (!_open) { // fallback si el host no está montado
      resolve(typeof window !== 'undefined' ? window.confirm(opts.message || '¿Confirmar?') : false);
      return;
    }
    _open({
      title: opts.title || (opts.okOnly ? 'Aviso' : 'Confirmar'),
      message: opts.message || '',
      confirmLabel: opts.confirmLabel || (opts.okOnly ? 'Entendido' : 'Aceptar'),
      cancelLabel: opts.cancelLabel || 'Cancelar',
      danger: !!opts.danger,
      okOnly: !!opts.okOnly,
      resolve,
    });
  });
}

/* Atajo para reemplazar alert(): muestra solo botón "Entendido". */
export function alertDialog(message, title) {
  return confirmDialog({ message, title, okOnly: true });
}

export function ConfirmHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    _open = (s) => setState(s);
    return () => { _open = null; };
  }, []);

  const close = useCallback((val) => {
    setState((s) => { s?.resolve?.(val); return null; });
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter')  close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  if (!state) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm animate-fade-in"
           onClick={() => close(false)} />
      <div className="relative w-full max-w-md rounded-3xl border border-border-2 bg-surface
                      shadow-card-hover p-6 animate-scale-in">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
            ${state.danger ? 'bg-danger/15 text-danger' : 'bg-primary/15 text-primary-light'}`}>
            {state.danger ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-text-1">{state.title}</h3>
            {state.message && (
              <p className="text-sm text-text-2 mt-1.5 leading-relaxed whitespace-pre-wrap">{state.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {!state.okOnly && (
            <button onClick={() => close(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-2 border border-border
                         hover:text-text-1 hover:border-border-2 transition">
              {state.cancelLabel}
            </button>
          )}
          <button onClick={() => close(true)} autoFocus
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-95
              ${state.danger ? 'bg-danger hover:opacity-90' : 'bg-gradient-primary hover:opacity-90'}`}>
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
