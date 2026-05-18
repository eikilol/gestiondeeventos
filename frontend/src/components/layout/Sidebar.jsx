import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePlan } from '../../hooks/usePlan.js';
import GestekMark from './GestekMark.jsx';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard',  icon: HomeIcon,     label: 'Dashboard' },
      { to: '/eventos',    icon: CalendarIcon, label: 'Eventos'   },
      { to: '/mi-trabajo', icon: BriefcaseIcon, label: 'Mi trabajo' },
    ],
  },
  {
    label: 'Asistente',
    items: [
      { to: '/gestbot',   icon: RobotIcon, label: 'Gestbot', pro: true },
      { to: '/chat',      icon: ChatIcon,  label: 'Chat'  },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { to: '/pagos',          icon: WalletIcon, label: 'Pagos' },
      { to: '/notificaciones', icon: BellIcon,   label: 'Notificaciones' },
      { to: '/recompensas',    icon: GiftIcon,   label: 'Recompensas' },
      { to: '/white-label',    icon: PaintIcon,  label: 'White-label' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/usuarios',      icon: UsersIcon,    label: 'Usuarios', permiso: 'usuarios:ver' },
      { to: '/configuracion', icon: SettingsIcon, label: 'Ajustes' },
    ],
  },
];

export default function Sidebar({ mobile = false, onClose }) {
  const { usuario, logout, hasPermiso } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = usuario?.nombre
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'U';

  /* Plan real (lee /me/plan). */
  const { esPro } = usePlan();

  return (
    <aside className={`${mobile ? 'w-full' : 'w-[var(--sidebar-w)]'} h-full flex-shrink-0 bg-surface border-r border-border flex flex-col`}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border flex items-center justify-between gap-2">
        <NavLink to="/dashboard" className="flex items-center gap-3 group flex-1 min-w-0">
          <div className="flex-shrink-0 transition-transform group-hover:scale-110
                          animate-[float_5s_ease-in-out_infinite]">
            <GestekMark size={42} pro={esPro} />
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold text-text-1 text-base tracking-tight block leading-tight">GESTEK</span>
            {esPro ? (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full
                               text-[10px] font-bold uppercase tracking-widest text-[#3a2a08]
                               bg-gradient-to-r from-[#FCEFA1] via-[#E9B23C] to-[#C8881F]
                               shadow-[0_0_12px_rgba(233,178,60,0.5)]">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                </svg>
                Pro
              </span>
            ) : (
              <p className="text-[11px] leading-none mt-0.5 font-semibold uppercase tracking-widest text-text-3">
                Free
              </p>
            )}
          </div>
        </NavLink>
        {mobile && (
          <button onClick={onClose} aria-label="Cerrar"
            className="w-9 h-9 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="nav-section">{section.label}</p>
            {section.items.map(({ to, icon: Icon, label, permiso, pro }) => {
              if (permiso && !hasPermiso(permiso)) return null;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {pro && !esPro && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-accent-light
                                     bg-accent/15 border border-accent/30 rounded px-1.5 py-0.5">
                      Pro
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-2 pb-3 pt-2 border-t border-border space-y-1">
        <NavLink to="/configuracion" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-2 transition-colors">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-primary flex items-center justify-center">
            {usuario?.foto
              ? <img src={usuario.foto} alt={usuario.nombre} className="w-full h-full object-cover" />
              : <span className="text-white font-semibold text-base">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-text-1 truncate leading-tight">{usuario?.nombre}</p>
            <p className="text-xs text-text-3 truncate mt-0.5">{usuario?.email}</p>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-danger/80 hover:text-danger hover:bg-danger/10 transition-all">
          <LogoutIcon className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

function HomeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function RobotIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m-5 3h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2zm2 5h.01M14 14h.01M9 17h6M4 12H3m18 0h-1" /><circle cx="12" cy="3" r="1" /></svg>;
}
function ChatIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
}
function WalletIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h.01M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>;
}
function BellIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function BriefcaseIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6V5a2 2 0 012-2h2a2 2 0 012 2v1m4 0H5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zM3 13v5a2 2 0 002 2h14a2 2 0 002-2v-5M12 12v2" /></svg>;
}
function PaintIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-7a2 2 0 00-2 2v2a4 4 0 01-4 4z" /></svg>;
}
function GiftIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13a4 4 0 10-4-4 4 4 0 004 4zm0 0a4 4 0 114-4 4 4 0 01-4 4zM5 8h14a1 1 0 011 1v3H4V9a1 1 0 011-1zm0 4h14v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8z" /></svg>;
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function SettingsIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function LogoutIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
}
