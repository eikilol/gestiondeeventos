/* Aplica el branding del organizador (colores + logo) en las páginas públicas
   de un evento. Inyecta CSS variables como --brand-primary / --brand-accent al
   scope del componente, que los bloques pueden usar para tematizar accent. */

export function BrandingProvider({ organizador, children }) {
  const primary = organizador?.branding?.primary || '#3B82F6';
  const accent  = organizador?.branding?.accent  || '#8B5CF6';

  return (
    <div
      style={{
        '--brand-primary': primary,
        '--brand-accent' : accent,
        '--brand-glow'   : `${primary}30`,
      }}
    >
      {children}
    </div>
  );
}

/* Header de marca del organizador. Se muestra arriba del cover en páginas
   públicas. Si no tiene logo ni "plataforma", no renderiza nada (no agregamos
   ruido a quienes no configuraron branding). */
export function BrandHeader({ organizador }) {
  if (!organizador) return null;
  const logo       = organizador.empresa_logo_url;
  const plataforma = organizador.branding?.plataforma || organizador.empresa;
  if (!logo && !plataforma) return null;

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-border bg-surface/40 backdrop-blur-md w-fit">
      {logo
        ? <img src={logo} alt={plataforma || ''} className="w-9 h-9 rounded-lg object-cover" />
        : (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base"
            style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-accent))` }}
          >
            {plataforma?.charAt(0)?.toUpperCase() || 'O'}
          </div>
        )}
      {plataforma && (
        <div>
          <p className="text-xs uppercase tracking-widest text-text-3 font-semibold leading-none">Presenta</p>
          <p className="text-base font-bold text-text-1 leading-tight mt-0.5">{plataforma}</p>
        </div>
      )}
    </div>
  );
}

/* Footer "Powered by GESTEK" — solo se muestra en plan Free.
   En Pro queda hidden (white-label completo). */
export function PoweredBy({ organizador }) {
  const isPro = organizador?.plan === 'pro';
  if (isPro) return null;
  return (
    <p className="text-xs text-text-3 mt-6 text-center">
      Eventos gestionados con <a href="/" className="text-text-2 hover:text-text-1 underline">GESTEK</a>
    </p>
  );
}
