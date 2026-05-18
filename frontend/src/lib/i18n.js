/* GESTEK — i18n mínimo y extensible.
   - Idioma por defecto: 'es'. Persistido en localStorage.
   - t('clave', { var }) busca en el diccionario del idioma activo;
     si falta, cae al español; si tampoco, devuelve la clave.
   - useT() re-renderiza cuando cambia el idioma.

   Migración incremental: ir reemplazando textos por t('...') y
   sumando entradas a DICT. Sin esto, la app sigue 100% funcional. */

import { useEffect, useState } from 'react';

const KEY = 'gestek:lang';
const EVT = 'gestek:lang-changed';

export const IDIOMAS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const DICT = {
  es: {
    'evento.no_encontrado_titulo': 'Este evento no existe o no está publicado.',
    'evento.volver_explorar': '← Volver a explorar',
    'comun.cargando': 'Cargando…',
    'comun.reservar': 'Reservar',
    'comun.idioma': 'Idioma',
    'brand.presenta': 'Presenta',
  },
  en: {
    'evento.no_encontrado_titulo': 'This event does not exist or is not published.',
    'evento.volver_explorar': '← Back to explore',
    'comun.cargando': 'Loading…',
    'comun.reservar': 'Book',
    'comun.idioma': 'Language',
    'brand.presenta': 'Presents',
  },
};

export function getLang() {
  try { return localStorage.getItem(KEY) || 'es'; } catch { return 'es'; }
}

export function setLang(code) {
  try { localStorage.setItem(KEY, code); } catch { /* noop */ }
  window.dispatchEvent(new Event(EVT));
}

export function t(clave, vars) {
  const lang = getLang();
  let s = (DICT[lang] && DICT[lang][clave]) || DICT.es[clave] || clave;
  if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, String(vars[k]));
  return s;
}

export function useT() {
  const [, force] = useState(0);
  useEffect(() => {
    const h = () => force(n => n + 1);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return { t, lang: getLang(), setLang };
}
