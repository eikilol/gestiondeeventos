import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logoG from '../../assets/logo-g.svg';

const NAV_LINKS = [
  { to: '/',              label: 'Inicio'        },
  { to: '/como-funciona', label: 'Cómo funciona' },
  { to: '/producto',      label: 'Producto'      },
  { to: '/explorar',      label: 'Explorar'      },
  { to: '/planes',        label: 'Planes'        },
  { to: '/faq',           label: 'FAQ'           },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const spinG = (e) => { e?.stopPropagation(); setSpinKey(k => k + 1); };

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4">
      <nav
        className={`mx-auto max-w-6xl flex items-center justify-between gap-3 rounded-full pl-3 pr-2 py-2.5
          transition-all duration-300 ${scrolled
            ? 'bg-surface/85 backdrop-blur-xl border border-border-2 shadow-card'
            : 'bg-surface/60 backdrop-blur-md border border-border'}`}
      >
        {/* Logo G */}
        <Link
          to="/"
          onClick={spinG}
          className="flex items-center gap-2 group flex-shrink-0"
          aria-label="Inicio"
        >
          <span
            key={spinKey}
            className="inline-flex items-center justify-center animate-wheel-spin"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <img
              src={logoG}
              alt="GESTEK"
              className="h-12 sm:h-14 w-12 sm:w-14 transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)]"
            />
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(l => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-full text-base font-medium transition-colors
                   ${isActive ? 'text-text-1 bg-surface-2' : 'text-text-2 hover:text-text-1 hover:bg-surface-2/60'}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side: auth */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <Link to="/login" className="px-4 py-2.5 text-base text-text-2 hover:text-text-1 transition-colors rounded-full">
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 text-base font-semibold text-bg bg-text-1 hover:bg-white rounded-full transition-all shadow-[0_0_24px_rgba(241,245,249,0.15)] hover:shadow-[0_0_32px_rgba(241,245,249,0.25)]"
          >
            Registrarse
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className="lg:hidden p-2 rounded-full hover:bg-surface-2 transition-colors"
        >
          <div className="w-5 h-4 flex flex-col justify-between items-end">
            <span className={`h-0.5 bg-text-1 transition-all ${open ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5'}`} />
            <span className={`h-0.5 bg-text-1 transition-all ${open ? 'opacity-0 w-3' : 'w-3.5'}`} />
            <span className={`h-0.5 bg-text-1 transition-all ${open ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-4'}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden mx-auto max-w-6xl mt-2 overflow-hidden transition-all duration-300
          ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="bg-surface/95 backdrop-blur-xl border border-border-2 rounded-3xl p-3 shadow-card">
          <ul className="space-y-1">
            {NAV_LINKS.map(l => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-2xl text-base font-medium transition-colors
                     ${isActive ? 'text-text-1 bg-surface-2' : 'text-text-2 hover:text-text-1 hover:bg-surface-2/60'}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="border-t border-border my-3" />
          <div className="flex flex-col gap-2 px-1 pb-1">
            <Link to="/login" className="block w-full text-center py-3 rounded-2xl text-base text-text-2 hover:bg-surface-2 transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/register" className="block w-full text-center py-3 rounded-2xl text-base font-semibold text-bg bg-text-1 hover:bg-white transition-colors">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
