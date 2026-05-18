/* Branding del organizador en páginas públicas (para TODOS los planes):
   colores, fondo, tipografía, radio de bordes, modo claro/oscuro,
   header con tagline + redes, y footer. */

import { t } from '../../lib/i18n.js';

const FONTS = {
  sans   : "'Inter', system-ui, sans-serif",
  display: "'Space Grotesk', 'Inter', sans-serif",
  serif  : "Georgia, 'Times New Roman', serif",
  mono   : "'JetBrains Mono', 'Fira Code', monospace",
};
const RADIUS = { none: '0px', sm: '6px', md: '12px', lg: '18px', xl: '26px' };

/* Estilos scoped para que el modo claro afecte de verdad a la página */
const STYLE_ID = 'gestek-brand-css';
const CSS = `
.brand-scope{transition:background .25s}
.brand-scope[style*="--brand-radius"] .rounded-2xl,
.brand-scope[style*="--brand-radius"] .rounded-3xl,
.brand-scope[style*="--brand-radius"] .rounded-xl,
.brand-scope[style*="--brand-radius"] .rounded-lg{border-radius:var(--brand-radius)!important}
.brand-scope[style*="--brand-radius"] .rounded-full{border-radius:9999px!important}
`;
function injectCss() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID; el.textContent = CSS;
  document.head.appendChild(el);
}

export function BrandingProvider({ organizador, children }) {
  injectCss();
  const b = organizador?.branding || {};
  const primary = b.primary || '#3B82F6';
  const accent  = b.accent  || '#8B5CF6';
  const bg      = b.bg || '#070C18';
  const font    = FONTS[b.font] || null;
  const radius  = RADIUS[b.radius];

  return (
    <div
      className="brand-scope min-h-screen"
      style={{
        '--brand-primary': primary,
        '--brand-accent' : accent,
        '--brand-glow'   : `${primary}30`,
        ...(radius ? { '--brand-radius': radius } : {}),
        background: bg,
        ...(font ? { fontFamily: font } : {}),
      }}
    >
      {children}
    </div>
  );
}

function SocialLinks({ b }) {
  const items = [
    b.web && { href: b.web, label: 'Sitio web', icon: 'M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18M3 12a9 9 0 1018 0 9 9 0 00-18 0z' },
    b.instagram && { href: b.instagram, label: 'Instagram', icon: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm5.5-.5h.01' },
    b.whatsapp && { href: `https://wa.me/${String(b.whatsapp).replace(/[^0-9]/g, '')}`, label: 'WhatsApp', icon: 'M12 2a10 10 0 00-8.7 15l-1.3 5 5.1-1.3A10 10 0 1012 2z' },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <a key={i} href={it.href} target="_blank" rel="noreferrer" title={it.label}
           className="w-8 h-8 rounded-lg flex items-center justify-center border border-border
                      text-text-2 hover:text-text-1 hover:bg-surface-2 transition">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={it.icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ))}
    </div>
  );
}

export function BrandHeader({ organizador }) {
  if (!organizador) return null;
  const b = organizador.branding || {};
  const logo       = organizador.empresa_logo_url;
  const plataforma = b.plataforma || organizador.empresa;
  const tagline    = b.tagline;
  if (!logo && !plataforma && !b.web && !b.instagram && !b.whatsapp) return null;

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-border
                    bg-surface/40 backdrop-blur-md w-fit">
      {logo
        ? <img src={logo} alt={plataforma || ''} className="w-10 h-10 rounded-lg object-cover" />
        : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base"
               style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-accent))` }}>
            {plataforma?.charAt(0)?.toUpperCase() || 'O'}
          </div>
        )}
      {plataforma && (
        <div className="mr-1">
          <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold leading-none">{t('brand.presenta')}</p>
          <p className="text-base font-bold text-text-1 leading-tight mt-0.5">{plataforma}</p>
          {tagline && <p className="text-xs text-text-2 leading-tight mt-0.5">{tagline}</p>}
        </div>
      )}
      <SocialLinks b={b} />
    </div>
  );
}

export function PoweredBy({ organizador }) {
  const b = organizador?.branding || {};
  const isPro = organizador?.plan === 'pro';
  if (isPro) {
    return b.footer
      ? <p className="text-xs text-text-3 mt-6 text-center">{b.footer}</p>
      : null;
  }
  return (
    <p className="text-xs text-text-3 mt-6 text-center">
      {b.footer ? <span className="block mb-1">{b.footer}</span> : null}
      Eventos gestionados con <a href="/" className="text-text-2 hover:text-text-1 underline">GESTEK</a>
    </p>
  );
}
