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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
