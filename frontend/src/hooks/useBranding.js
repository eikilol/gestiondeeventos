/* Branding del organizador para aplicarlo en el PANEL de administración.
   Se guarda en localStorage al guardar en White-label (aplica al instante,
   sin depender del refresh de Auth) con fallback a la metadata de Auth.
   Evento 'gestek:branding-actualizado' fuerza re-lectura. */

import { useEffect, useState } from 'react';

const KEY = 'gestek:branding';
const EVT = 'gestek:branding-actualizado';

export function guardarBrandingLocal(b) {
  try { localStorage.setItem(KEY, JSON.stringify(b || {})); } catch { /* noop */ }
  window.dispatchEvent(new Event(EVT));
}

function leer() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch { /* noop */ }
  return null;
}

export function useBranding(fallback) {
  const [b, setB] = useState(() => leer() || fallback || {});

  useEffect(() => {
    const h = () => setB(leer() || fallback || {});
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, [fallback]);

  /* Si llega el fallback (Auth cargó) y aún no hay nada local, úsalo */
  useEffect(() => {
    if (!leer() && fallback) setB(fallback);
  }, [fallback]);

  return b || {};
}
