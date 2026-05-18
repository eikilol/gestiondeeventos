import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  /* Cerrar drawer al navegar */
  useEffect(() => { setOpen(false); }, [pathname]);

  /* Bloquear scroll del body cuando el drawer está abierto en mobile */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Drawer mobile */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-bg/70 backdrop-blur-md" onClick={() => setOpen(false)} />
        <div className={`absolute top-0 left-0 h-full w-[280px] max-w-[85vw] transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar mobile onClose={() => setOpen(false)} />
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onMenu={() => setOpen(true)} />
        <main className="relative flex-1 overflow-y-auto">
          {/* Fondo decorativo (no interactivo) */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.4]" />
            <div className="absolute inset-0 bg-gradient-glow" />
            <div className="absolute -top-32 -right-24 w-[34rem] h-[34rem] rounded-full
                            bg-primary/10 blur-[110px] animate-float" />
            <div className="absolute top-1/3 -left-32 w-[30rem] h-[30rem] rounded-full
                            bg-primary-light/10 blur-[120px] animate-float"
                 style={{ animationDuration: '7s', animationDelay: '1s' }} />
            <div className="absolute -bottom-40 right-1/4 w-[28rem] h-[28rem] rounded-full
                            bg-accent/10 blur-[120px] animate-float"
                 style={{ animationDuration: '9s', animationDelay: '2s' }} />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r
                            from-transparent via-primary/40 to-transparent" />
          </div>

          <div className="relative z-10 p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
