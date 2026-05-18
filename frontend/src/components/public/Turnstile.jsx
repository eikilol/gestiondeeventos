import { useEffect, useRef } from 'react';

/* Cloudflare Turnstile. Si VITE_TURNSTILE_SITE_KEY no está definida, no renderiza
   nada (captcha opcional / dev). Llama onToken(token) cuando el usuario pasa. */

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
let scriptPromise = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.defer = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function Turnstile({ onToken }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: 'dark',
        callback: (token) => onToken?.(token),
        'expired-callback': () => onToken?.(null),
        'error-callback': () => onToken?.(null),
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
      try { if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current); } catch { /* noop */ }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="my-2" />;
}

export const turnstileActivo = Boolean(SITE_KEY);
