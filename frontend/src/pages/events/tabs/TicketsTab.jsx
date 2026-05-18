import { useEffect, useState } from 'react';
import { confirmDialog } from '../../../components/ui/Confirm.jsx';
import { ticketsApi } from '../../../api/tickets.js';
import { useToast } from '../../../context/ToastContext.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import GLoader from '../../../components/ui/GLoader.jsx';

/* Tab Tickets — tipos de boleta del evento. Minimalista Apple. */

export default function TicketsTab({ evento }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const { success, error: toastErr } = useToast();

  const reload = async () => {
    setLoading(true);
    try {
      const d = await ticketsApi.list(evento.id);
      setTickets(d.tickets || []);
    } catch (e) { toastErr(e.message); }
    finally    { setLoading(false); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [evento.id]);

  const onCrear = async (payload) => {
    try {
      await ticketsApi.crear(evento.id, payload);
      success('Ticket creado.');
      setCreating(false);
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const onEditar = async (id, payload) => {
    try {
      await ticketsApi.editar(evento.id, id, payload);
      success('Ticket actualizado.');
      setEditing(null);
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const onBorrar = async (t) => {
    if (!(await confirmDialog({ message:(`¿Borrar "${t.nombre}"?${t.vendidos > 0 ? ' (Tiene ventas — se archivará en vez de borrar)' : ''}`), danger:true }))) return;
    try {
      await ticketsApi.borrar(evento.id, t.id);
      success('Ticket eliminado.');
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const toggleActivo = async (t) => {
    try {
      await ticketsApi.editar(evento.id, t.id, { activo: !t.activo });
      reload();
    } catch (e) { toastErr(e.message); }
  };

  if (loading) return (
    <GLoader message="Cargando tickets..." />
  );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Tipos de ticket</h2>
          <p className="text-sm text-text-2 mt-1">
            Define las boletas que vendes. Precios, cupos, Early Bird, zonas de acceso.
          </p>
        </div>
        <button onClick={() => setCreating(v => !v)} className="btn-gradient btn-sm">
          <PlusIcon className="w-3.5 h-3.5" />
          Nuevo ticket
        </button>
      </div>

      {creating && (
        <TicketForm
          currency={evento.currency || 'COP'}
          onSubmit={onCrear}
          onCancel={() => setCreating(false)}
        />
      )}

      {tickets.length === 0 && !creating ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {tickets.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              isEditing={editing === t.id}
              onStartEdit={() => setEditing(t.id)}
              onCancelEdit={() => setEditing(null)}
              onSave={(p) => onEditar(t.id, p)}
              onDelete={() => onBorrar(t)}
              onToggleActivo={() => toggleActivo(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── Card individual ─────────── */

function TicketCard({ ticket, isEditing, onStartEdit, onCancelEdit, onSave, onDelete, onToggleActivo }) {
  if (isEditing) {
    return (
      <div className="sm:col-span-2">
        <TicketForm
          initial={ticket}
          currency={ticket.currency}
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  const isFree     = Number(ticket.precio) === 0;
  const hasEarly   = ticket.early_bird_precio && ticket.early_bird_hasta && new Date(ticket.early_bird_hasta) > new Date();
  const ventaCerr  = ticket.venta_hasta && new Date(ticket.venta_hasta) < new Date();
  const cupoPct    = ticket.cupo ? Math.min(100, Math.round((ticket.vendidos || 0) / ticket.cupo * 100)) : 0;

  return (
    <div className={`rounded-3xl border bg-surface/40 p-5 group transition-all hover:border-border-2
      ${ticket.activo ? 'border-border' : 'border-border/40 opacity-60'}
    `}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-text-1 truncate">{ticket.nombre}</h3>
            {hasEarly  && <span className="text-[10px] uppercase tracking-widest font-semibold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">Early</span>}
            {!ticket.activo && <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">Pausado</span>}
            {ventaCerr && <span className="text-[10px] uppercase tracking-widest text-danger font-semibold">Cerrado</span>}
          </div>
          {ticket.descripcion && <p className="text-xs text-text-3 mt-1 line-clamp-2">{ticket.descripcion}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onToggleActivo} aria-label={ticket.activo ? 'Pausar' : 'Activar'} title={ticket.activo ? 'Pausar' : 'Activar'}
            className="w-8 h-8 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
            {ticket.activo ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          </button>
          <button onClick={onStartEdit} aria-label="Editar"
            className="w-8 h-8 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
            <EditIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} aria-label="Borrar"
            className="w-8 h-8 rounded-lg text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Precio */}
      <div className="mb-4">
        {isFree ? (
          <p className="text-3xl font-bold font-display text-text-1 tracking-tight">Gratis</p>
        ) : hasEarly ? (
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold font-display text-text-1 tracking-tight tabular-nums">
                {formatPrice(ticket.early_bird_precio)}
              </p>
              <span className="text-xs text-text-3">{ticket.currency}</span>
            </div>
            <p className="text-xs text-text-3 mt-1 line-through tabular-nums">
              {formatPrice(ticket.precio)} {ticket.currency} · normal
            </p>
            <p className="text-[11px] text-warning mt-0.5">
              Early Bird hasta {new Date(ticket.early_bird_hasta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold font-display text-text-1 tracking-tight tabular-nums">{formatPrice(ticket.precio)}</p>
            <span className="text-xs text-text-3">{ticket.currency}</span>
          </div>
        )}
      </div>

      {/* Cupo */}
      {ticket.cupo ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-2">{ticket.vendidos || 0} / {ticket.cupo} vendidos</span>
            <span className="text-text-3 tabular-nums">{cupoPct}%</span>
          </div>
          <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-text-1 rounded-full transition-all duration-500" style={{ width: `${cupoPct}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-3">{ticket.vendidos || 0} vendidos · cupo ilimitado</p>
      )}

      {ticket.venta_hasta && !ventaCerr && (
        <p className="text-[11px] text-text-3 mt-3">
          Venta cierra {new Date(ticket.venta_hasta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

/* ─────────── Form crear/editar ─────────── */

function TicketForm({ initial, currency, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    nombre           : initial?.nombre || '',
    descripcion      : initial?.descripcion || '',
    precio           : initial?.precio ?? 0,
    currency         : initial?.currency || currency || 'COP',
    cupo             : initial?.cupo ?? '',
    early_bird_precio: initial?.early_bird_precio ?? '',
    early_bird_hasta : toLocalInput(initial?.early_bird_hasta),
    venta_hasta      : toLocalInput(initial?.venta_hasta),
  });
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(initial?.early_bird_precio || initial?.early_bird_hasta || initial?.venta_hasta)
  );

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    const payload = {
      nombre           : form.nombre,
      descripcion      : form.descripcion || null,
      precio           : Number(form.precio) || 0,
      currency         : form.currency,
      cupo             : form.cupo === '' ? null : Number(form.cupo),
      early_bird_precio: form.early_bird_precio === '' ? null : Number(form.early_bird_precio),
      early_bird_hasta : form.early_bird_hasta ? new Date(form.early_bird_hasta).toISOString() : null,
      venta_hasta      : form.venta_hasta      ? new Date(form.venta_hasta).toISOString()      : null,
    };
    await onSubmit(payload);
    setSaving(false);
  };

  return (
    <form onSubmit={submit}
      className="rounded-3xl border border-primary/25 bg-surface/40 p-5 animate-[fadeUp_0.3s_ease_both] space-y-4"
    >
      <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">
        {initial ? 'Editar ticket' : 'Nuevo tipo de ticket'}
      </p>

      <div className="grid sm:grid-cols-[1.4fr_1fr] gap-3">
        <div className="field">
          <label className="label">Nombre *</label>
          <input
            value={form.nombre} onChange={e => update('nombre', e.target.value)}
            placeholder="Ej: General, VIP, Early Bird"
            className="input rounded-2xl py-3 text-base" required autoFocus
          />
        </div>
        <div className="field">
          <label className="label">Precio</label>
          <div className="grid grid-cols-[1fr_82px] gap-2">
            <input
              type="number" min="0" step="0.01"
              value={form.precio} onChange={e => update('precio', e.target.value)}
              className="input rounded-2xl py-3 text-base tabular-nums" placeholder="0"
            />
            <select
              value={form.currency} onChange={e => update('currency', e.target.value)}
              className="input bg-surface-2 rounded-2xl py-3 text-sm"
            >
              <option value="COP">COP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
            </select>
          </div>
          <p className="text-[11px] text-text-3 mt-1.5">Pon 0 para boleta gratis.</p>
        </div>
      </div>

      <div className="field">
        <label className="label">Descripción</label>
        <input
          value={form.descripcion} onChange={e => update('descripcion', e.target.value)}
          placeholder="Acceso general · 1 bebida incluida · etc."
          className="input rounded-2xl py-3 text-base"
        />
      </div>

      <div className="field">
        <label className="label">Cupo</label>
        <input
          type="number" min="0"
          value={form.cupo} onChange={e => update('cupo', e.target.value)}
          placeholder="Vacío = ilimitado"
          className="input rounded-2xl py-3 text-base tabular-nums"
        />
      </div>

      {/* Avanzado */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="text-xs text-text-2 hover:text-text-1 transition-colors flex items-center gap-1.5"
      >
        <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>›</span>
        Opciones avanzadas (Early Bird, fecha límite de venta)
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1 animate-[fadeUp_0.2s_ease_both]">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Precio Early Bird</label>
              <input
                type="number" min="0" step="0.01"
                value={form.early_bird_precio} onChange={e => update('early_bird_precio', e.target.value)}
                placeholder="Precio descuento"
                className="input rounded-2xl py-3 text-base tabular-nums"
              />
            </div>
            <div className="field">
              <label className="label">Early Bird hasta</label>
              <input
                type="datetime-local"
                value={form.early_bird_hasta} onChange={e => update('early_bird_hasta', e.target.value)}
                className="input rounded-2xl py-3 text-base bg-surface-2"
              />
            </div>
          </div>
          <div className="field">
            <label className="label">Fecha límite de venta</label>
            <input
              type="datetime-local"
              value={form.venta_hasta} onChange={e => update('venta_hasta', e.target.value)}
              className="input rounded-2xl py-3 text-base bg-surface-2"
            />
            <p className="text-[11px] text-text-3 mt-1.5">Después de esta fecha no se podrán comprar más boletas de este tipo.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost btn-sm">Cancelar</button>
        <button type="submit" disabled={saving || !form.nombre.trim()} className="btn-primary btn-sm">
          {saving ? <><Spinner size="sm" /> Guardando...</> : (initial ? 'Guardar cambios' : 'Crear ticket')}
        </button>
      </div>
    </form>
  );
}

/* ─────────── Vacío ─────────── */

function EmptyState({ onCreate }) {
  return (
    <div className="rounded-3xl border border-border bg-surface/40 px-6 py-16 text-center max-w-xl mx-auto">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border mb-5">
        <TicketIcon className="w-6 h-6 text-text-2" />
      </div>
      <h2 className="text-xl font-bold font-display text-text-1 tracking-tight mb-2">Sin tickets aún</h2>
      <p className="text-sm text-text-2 leading-relaxed max-w-sm mx-auto mb-5">
        Crea tu primer tipo de boleta. Puedes hacer varios con precios, cupos y zonas distintas.
      </p>
      <button onClick={onCreate} className="btn-gradient">
        <PlusIcon className="w-4 h-4" /> Crear primer ticket
      </button>
    </div>
  );
}

/* ─────────── Helpers ─────────── */

function formatPrice(n) {
  return Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─────────── Icons ─────────── */

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function EditIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function TrashIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function PauseIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function PlayIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function TicketIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
}
