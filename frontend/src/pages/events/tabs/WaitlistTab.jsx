import { useEffect, useState } from 'react';
import { waitlistApi } from '../../../api/waitlist.js';
import { useToast } from '../../../context/ToastContext.jsx';
import GLoader from '../../../components/ui/GLoader.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';

const ESTADO_LABEL = {
  active   : 'En espera',
  contacted: 'Notificado',
  purchased: 'Compró',
  cancelled: 'Cancelado',
};

const ESTADO_CLS = {
  active   : 'bg-warning/10 text-warning border-warning/20',
  contacted: 'bg-primary/10 text-primary-light border-primary/20',
  purchased: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-text-3/10 text-text-2 border-border',
};

export default function WaitlistTab({ evento }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const { success, error: toastErr } = useToast();

  const reload = async () => {
    setLoading(true);
    try {
      const d = await waitlistApi.list(evento.id, {
        ...(q ? { q } : {}),
        ...(estadoFilter ? { estado: estadoFilter } : {}),
      });
      setData(d);
    } catch (e) { toastErr(e.message); }
    finally    { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(reload, q ? 300 : 0);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [evento.id, q, estadoFilter]);

  const cambiarEstado = async (waitlistId, estado) => {
    try {
      await waitlistApi.updateEstado(evento.id, waitlistId, estado);
      success('Estado actualizado.');
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const notificar = async (waitlistId) => {
    try {
      const r = await waitlistApi.notify(evento.id, waitlistId);
      success(r.pushSent > 0 ? 'Notificación enviada.' : 'Estado actualizado (sin push activo).');
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const eliminar = async (waitlistId) => {
    if (!window.confirm('¿Quitar esta persona de la lista de espera?')) return;
    try {
      await waitlistApi.remove(evento.id, waitlistId);
      success('Entrada eliminada.');
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const lista = data?.waitlist || [];
  const stats = data?.stats || { total: 0, active: 0, contacted: 0, purchased: 0, cancelled: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Lista de espera</h2>
          <p className="text-sm text-text-2 mt-1">Personas que quieren asistir cuando se libere un cupo.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="En espera"  value={stats.active}    />
        <StatBox label="Notificados" value={stats.contacted} />
        <StatBox label="Compraron"  value={stats.purchased} />
        <StatBox label="Cancelados" value={stats.cancelled} />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="input rounded-2xl py-2.5 pl-10 text-sm"
          />
        </div>
        <select
          value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
          className="input bg-surface-2 rounded-2xl py-2.5 text-sm w-auto"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <GLoader message="Cargando lista de espera..." />
      ) : lista.length === 0 ? (
        <EmptyState hasFilter={Boolean(q || estadoFilter)} />
      ) : (
        <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
          {lista.map((entry, i) => (
            <WaitlistRow
              key={entry.id}
              entry={entry}
              style={{ animationDelay: `${i * 25}ms` }}
              onCambiarEstado={(estado) => cambiarEstado(entry.id, estado)}
              onNotificar={() => notificar(entry.id)}
              onEliminar={() => eliminar(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 px-4 py-3.5">
      <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">{label}</p>
      <p className="text-2xl font-bold font-display text-text-1 tabular-nums mt-1 leading-none">{value}</p>
    </div>
  );
}

function WaitlistRow({ entry, style, onCambiarEstado, onNotificar, onEliminar }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const nombre   = entry.guest_nombre || entry.guest_email;
  const email    = entry.guest_email;
  const initials = (nombre || 'U').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const fecha    = new Date(entry.added_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleNotify = async () => {
    setNotifying(true);
    await onNotificar();
    setNotifying(false);
  };

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-2/30 transition-colors animate-[fadeUp_0.3s_ease_both] group"
      style={style}
    >
      {/* Avatar + posición */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold text-xs">
          {initials}
        </div>
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface-2 border border-border text-[10px] font-bold text-text-2 flex items-center justify-center tabular-nums">
          {entry.posicion}
        </span>
      </div>

      {/* Nombre + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-1 truncate">{nombre}</p>
        <p className="text-xs text-text-3 truncate">{email}</p>
      </div>

      {/* Tipo de boleta */}
      <div className="hidden md:block text-right">
        <p className="text-xs font-medium text-text-1">{entry.tipo?.nombre || '—'}</p>
        <p className="text-[11px] text-text-3">Tipo de boleta</p>
      </div>

      {/* Fecha */}
      <div className="hidden sm:block text-right text-[11px] text-text-3 tabular-nums w-20">{fecha}</div>

      {/* Badge estado */}
      <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${ESTADO_CLS[entry.estado] || ESTADO_CLS.active}`}>
        {ESTADO_LABEL[entry.estado] || entry.estado}
      </span>

      {/* Acciones */}
      <div className="relative flex items-center gap-1">
        {/* Botón de notificación rápida */}
        {['active', 'contacted'].includes(entry.estado) && (
          <button
            onClick={handleNotify}
            disabled={notifying}
            title="Notificar a esta persona"
            className="w-8 h-8 rounded-lg text-text-3 hover:text-primary-light hover:bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {notifying ? <Spinner size="sm" /> : <BellIcon className="w-4 h-4" />}
          </button>
        )}

        {/* Menú de acciones */}
        <button
          onClick={() => setOpenMenu(v => !v)}
          aria-label="Más acciones"
          className="w-8 h-8 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DotsIcon className="w-4 h-4" />
        </button>

        {openMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(false)} />
            <div className="absolute right-0 top-9 z-20 w-48 rounded-2xl border border-border-2 bg-surface shadow-2xl py-1 animate-[scaleIn_0.15s_ease_both] origin-top-right">
              <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-text-3 font-semibold border-b border-border mb-1">
                Cambiar estado
              </p>
              {Object.entries(ESTADO_LABEL).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => { onCambiarEstado(k); setOpenMenu(false); }}
                  disabled={entry.estado === k}
                  className="w-full px-3 py-2 text-left text-sm text-text-2 hover:text-text-1 hover:bg-surface-2 disabled:text-text-3 disabled:bg-surface-2/50 transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => { onEliminar(); setOpenMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-danger/80 hover:text-danger hover:bg-danger/5 transition-colors"
                >
                  Quitar de la lista
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasFilter }) {
  return (
    <div className="rounded-3xl border border-border bg-surface/40 px-6 py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border mb-4">
        <QueueIcon className="w-6 h-6 text-text-2" />
      </div>
      <h2 className="text-lg font-bold font-display text-text-1 tracking-tight mb-1">
        {hasFilter ? 'Sin resultados' : 'Lista de espera vacía'}
      </h2>
      <p className="text-sm text-text-2 leading-relaxed max-w-sm mx-auto">
        {hasFilter
          ? 'Ninguna entrada coincide con los filtros.'
          : 'Cuando el evento se llene y alguien quiera unirse a la espera, aparecerá aquí automáticamente.'}
      </p>
    </div>
  );
}

function SearchIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function BellIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function DotsIcon({ className }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
}
function QueueIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h6" /></svg>;
}
