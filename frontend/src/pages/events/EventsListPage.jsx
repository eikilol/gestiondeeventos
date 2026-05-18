import { useState, useEffect, useCallback } from 'react';
import { confirmDialog } from '../../components/ui/Confirm.jsx';
import { Link } from 'react-router-dom';
import { eventosApi } from '../../api/eventos.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { EstadoBadge, ModalidadBadge } from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import EventCard from '../../components/ui/EventCard.jsx';

const MODALIDADES = [
  { value: '',        label: 'Modalidad' },
  { value: 'fisico',  label: 'Físico'    },
  { value: 'virtual', label: 'Virtual'   },
  { value: 'hibrido', label: 'Híbrido'  },
];
const ESTADOS = [
  { value: '',          label: 'Estado'    },
  { value: 'borrador',  label: 'Borrador'  },
  { value: 'publicado', label: 'Publicado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function EventsListPage() {
  const { hasPermiso }         = useAuth();
  const { success, error: err } = useToast();
  const [eventos,  setEventos]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState('grid');
  const [filters,  setFilters]  = useState({ q: '', modalidad: '', estado: '', page: 1 });
  const [deleting, setDeleting] = useState(null);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20, page: filters.page };
      if (filters.q)         params.q        = filters.q;
      if (filters.modalidad) params.modalidad = filters.modalidad;
      if (filters.estado)    params.estado    = filters.estado;
      const data = await eventosApi.list(params);
      setEventos(data.eventos || []);
      setTotal(data.total || 0);
    } catch (e) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);

  const handleFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  const handleDelete = async (id, nombre) => {
    if (!(await confirmDialog({ message:(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`), danger:true }))) return;
    setDeleting(id);
    try {
      await eventosApi.delete(id);
      setEventos(ev => ev.filter(e => e.id !== id));
      success(`Evento "${nombre}" eliminado.`);
    } catch (e) {
      err(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handlePublicar = async (id) => {
    try {
      await eventosApi.publicar(id);
      setEventos(ev => ev.map(e => e.id === id ? { ...e, estado: 'publicado' } : e));
      success('Evento publicado correctamente.');
    } catch (e) {
      err(e.message);
    }
  };

  const hasActiveFilter = filters.q || filters.modalidad || filters.estado;

  return (
    <div className="space-y-5 animate-[fadeUp_0.4s_ease_both]">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-text-1 tracking-tight">Eventos</h1>
          <p className="text-base text-text-2 mt-1">
            {loading ? 'Cargando...' : `${total} evento${total !== 1 ? 's' : ''} en total`}
          </p>
        </div>
        {hasPermiso('eventos:crear') && (
          <Link to="/eventos/nuevo" className="btn-gradient">
            <PlusIcon className="w-4 h-4" />
            Crear evento
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar eventos..."
            value={filters.q}
            onChange={e => handleFilter('q', e.target.value)}
          />
        </div>
        <select className="input w-auto bg-surface-2" value={filters.modalidad} onChange={e => handleFilter('modalidad', e.target.value)}>
          {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="input w-auto bg-surface-2" value={filters.estado} onChange={e => handleFilter('estado', e.target.value)}>
          {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {hasActiveFilter && (
          <button
            onClick={() => setFilters({ q: '', modalidad: '', estado: '', page: 1 })}
            className="btn-ghost btn-sm text-text-3"
          >
            Limpiar
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 bg-surface-2 border border-border rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}
          >
            <GridIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-48 rounded" />
                  <div className="skeleton h-2 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : eventos.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title={hasActiveFilter ? 'Sin resultados' : 'Sin eventos'}
          description={hasActiveFilter
            ? 'Ningún evento coincide con los filtros actuales.'
            : 'Crea tu primer evento y empieza a gestionar asistentes.'}
          action={!hasActiveFilter && hasPermiso('eventos:crear') && (
            <Link to="/eventos/nuevo" className="btn-gradient">
              <PlusIcon className="w-4 h-4" />
              Crear primer evento
            </Link>
          )}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {eventos.map((ev, i) => (
            <EventCard
              key={ev.id}
              evento={ev}
              onPublicar={hasPermiso('eventos:publicar') ? handlePublicar : null}
              onDelete={hasPermiso('eventos:eliminar') ? handleDelete : null}
              canEdit={hasPermiso('eventos:editar')}
              canDelete={hasPermiso('eventos:eliminar')}
              style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Nombre</th>
                  <th className="th hidden md:table-cell">Fecha</th>
                  <th className="th hidden lg:table-cell">Modalidad</th>
                  <th className="th">Estado</th>
                  <th className="th hidden lg:table-cell">Asistentes</th>
                  <th className="th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map(ev => (
                  <tr key={ev.id} className="tr">
                    <td className="td">
                      <Link to={`/eventos/${ev.id}`} className="font-medium text-text-1 hover:text-primary transition-colors">
                        {ev.titulo}
                      </Link>
                      {ev.descripcion && (
                        <p className="text-xs text-text-3 mt-0.5 line-clamp-1">{ev.descripcion}</p>
                      )}
                    </td>
                    <td className="td hidden md:table-cell text-text-2 text-xs">
                      {ev.fecha_inicio
                        ? new Date(ev.fecha_inicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="td hidden lg:table-cell"><ModalidadBadge modalidad={ev.modalidad} /></td>
                    <td className="td"><EstadoBadge estado={ev.estado} /></td>
                    <td className="td hidden lg:table-cell text-text-2 text-sm">
                      {ev.aforo_vendido || 0}{ev.aforo_total ? ` / ${ev.aforo_total}` : ''}
                    </td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/eventos/${ev.id}`} className="btn btn-ghost btn-sm">Administrar</Link>
                        {hasPermiso('eventos:publicar') && ev.estado === 'borrador' && (
                          <button onClick={() => handlePublicar(ev.id)} className="btn btn-ghost btn-sm text-success">
                            Publicar
                          </button>
                        )}
                        {hasPermiso('eventos:eliminar') && (
                          <button
                            onClick={() => handleDelete(ev.id, ev.titulo)}
                            disabled={deleting === ev.id}
                            className="btn btn-ghost btn-sm text-danger"
                          >
                            {deleting === ev.id ? <Spinner size="sm" /> : 'Eliminar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="card-footer flex items-center justify-between">
              <p className="text-xs text-text-2">Página {filters.page} · {total} resultados</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                  disabled={filters.page === 1}
                  className="btn-secondary btn-sm"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  disabled={filters.page * 20 >= total}
                  className="btn-secondary btn-sm"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function SearchIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function GridIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
}
function ListIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
}
