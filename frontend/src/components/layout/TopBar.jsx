import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { RolBadge } from '../ui/Badge.jsx';
import { notificacionesApi } from '../../api/notificaciones.js';
import { supabase } from '../../lib/supabase.js';

const ROOT_PATHS = new Set(['/dashboard', '/eventos', '/usuarios', '/configuracion']);

const CRUMBS = {
  '/dashboard'    : [{ label: 'Dashboard' }],
  '/eventos'      : [{ label: 'Eventos' }],
  '/eventos/nuevo': [{ to: '/eventos', label: 'Eventos' }, { label: 'Nuevo evento' }],
  '/usuarios'     : [{ label: 'Usuarios' }],
  '/configuracion': [{ label: 'Configuración' }],
};

function tiempoRelativo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return 'ahora';
  if (diff < 3600)   return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400)  return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export default function TopBar({ onMenu }) {
  const { pathname }  = useLocation();
  const { usuario }   = useAuth();
  const navigate      = useNavigate();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const [unread,      setUnread]      = useState(0);
  const loadedRef     = useRef(false);

  const crumbs  = CRUMBS[pathname] || (pathname.startsWith('/eventos/') ? [{ to: '/eventos', label: 'Eventos' }, { label: 'Detalle' }] : [{ label: 'GESTEK' }]);

  const cargar = useCallback(async () => {
    try {
      const d = await notificacionesApi.list(30);
      setNotifs(d.notificaciones || []);
      setUnread(d.no_leidas || 0);
    } catch { /* silencioso: no rompemos el topbar si falla */ }
  }, []);

  /* Carga inicial */
  useEffect(() => {
    if (!usuario?.id || loadedRef.current) return;
    loadedRef.current = true;
    cargar();
  }, [usuario?.id, cargar]);

  /* Realtime: nuevas notificaciones para este usuario */
  useEffect(() => {
    if (!usuario?.id) return;
    const channel = supabase
      .channel(`notif:${usuario.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${usuario.id}`,
      }, (payload) => {
        setNotifs(prev => [payload.new, ...prev].slice(0, 30));
        setUnread(u => u + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [usuario?.id]);

  const markAllRead = async () => {
    setNotifs(n => n.map(x => ({ ...x, leida: true })));
    setUnread(0);
    try { await notificacionesApi.leerTodas(); } catch { cargar(); }
  };

  const onClickNotif = async (n) => {
    if (!n.leida) {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
      setUnread(u => Math.max(0, u - 1));
      try { await notificacionesApi.leer(n.id); } catch { /* noop */ }
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  const showBack = !ROOT_PATHS.has(pathname);

  return (
    <header className="h-14 flex-shrink-0 bg-surface border-b border-border flex items-center gap-3 px-4 sm:px-6 relative z-10">
      {/* Hamburger mobile */}
      <button
        onClick={onMenu}
        aria-label="Abrir menú"
        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors flex-shrink-0"
      >
        <MenuIcon className="w-5 h-5" />
      </button>
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors flex-shrink-0"
        >
          <BackIcon className="w-4 h-4" />
        </button>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronIcon className="w-3 h-3 text-text-3 flex-shrink-0" />}
            {c.to
              ? <Link to={c.to} className="text-text-2 hover:text-text-1 transition-colors truncate">{c.label}</Link>
              : <span className="text-text-1 font-medium truncate">{c.label}</span>
            }
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="btn-icon btn-ghost relative"
          >
            <BellIcon className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-glow-sm" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-80 card-glass rounded-2xl overflow-hidden animate-[scaleIn_0.15s_ease_both] origin-top-right">
                <div className="card-header">
                  <h3 className="text-sm font-semibold text-text-1">Notificaciones</h3>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto no-scrollbar">
                  {notifs.map(n => (
                    <button
                      key={n.id}
                      onClick={() => onClickNotif(n)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-2/50 ${n.leida ? 'opacity-55' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.leida && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                        <div className={`flex-1 min-w-0 ${n.leida ? 'pl-4' : ''}`}>
                          <p className="text-sm text-text-1 font-medium leading-snug">{n.titulo}</p>
                          {n.cuerpo && <p className="text-xs text-text-2 leading-relaxed mt-0.5">{n.cuerpo}</p>}
                          <p className="text-[10px] text-text-3 mt-1">{tiempoRelativo(n.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {notifs.length === 0 && (
                  <p className="text-sm text-text-2 text-center py-10">Sin notificaciones</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Role badge */}
        <RolBadge rol={usuario?.rol} />
      </div>
    </header>
  );
}

function MenuIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
}
function BellIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function BackIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}
function ChevronIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}
