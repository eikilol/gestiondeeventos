import { useEffect, useState, useMemo } from 'react';
import { confirmDialog } from '../../../components/ui/Confirm.jsx';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { tareasApi } from '../../../api/tareas.js';
import { equipoApi } from '../../../api/equipo.js';
import { rolesApi } from '../../../api/roles.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import GLoader from '../../../components/ui/GLoader.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';

/* Tab Tareas — vista Lista o Kanban (tipo Trello).
   Tareas asignables a usuarios o roles, con prioridad, vencimiento y log. */

const ESTADOS = [
  { id: 'pendiente', label: 'Por hacer',   dot: 'bg-text-3' },
  { id: 'en_curso',  label: 'En curso',    dot: 'bg-primary' },
  { id: 'hecho',     label: 'Hecho',       dot: 'bg-success' },
  { id: 'cancelada', label: 'Cancelada',   dot: 'bg-danger/50' },
];
const ESTADO_BY_ID = Object.fromEntries(ESTADOS.map(e => [e.id, e]));

const PRIORIDAD_INFO = {
  baja    : { label: 'Baja',     cls: 'text-text-3 bg-surface-2' },
  normal  : { label: 'Normal',   cls: 'text-text-2 bg-surface-2' },
  alta    : { label: 'Alta',     cls: 'text-warning bg-warning/10' },
  urgente : { label: 'Urgente',  cls: 'text-danger  bg-danger/10' },
};

export default function TareasTab({ evento }) {
  const { usuario } = useAuth();
  const [view, setView]         = useState('kanban'); // kanban | lista
  const [tareas, setTareas]     = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [roles, setRoles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId]     = useState(null);
  const { success, error: toastErr } = useToast();

  const reload = async () => {
    try {
      const [t, e, r] = await Promise.all([
        tareasApi.list(evento.id),
        equipoApi.list(evento.id).catch(() => ({ miembros: [], owner: null })),
        rolesApi.list(evento.id).catch(() => ({ roles: [] })),
      ]);
      setTareas(t.tareas || []);
      /* Miembros = owner + miembros activos */
      const mList = [];
      if (e.owner) mList.push({ id: e.owner.id, nombre: e.owner.nombre, avatar_url: e.owner.avatar_url, email: e.owner.email, isOwner: true });
      for (const m of (e.miembros || [])) {
        if (m.profile?.id) mList.push({ id: m.profile.id, nombre: m.profile.nombre, avatar_url: m.profile.avatar_url, email: m.profile.email });
      }
      setMiembros(mList);
      setRoles(r.roles || []);
    } catch (e) { toastErr(e.message); }
    finally    { setLoading(false); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [evento.id]);

  const onCrear = async (payload) => {
    try {
      await tareasApi.crear(evento.id, payload);
      success('Tarea creada.');
      setCreating(false);
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const onMover = async (tareaId, nuevoEstado) => {
    /* Optimistic update */
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado } : t));
    try {
      await tareasApi.editar(evento.id, tareaId, { estado: nuevoEstado });
    } catch (e) {
      toastErr(e.message);
      reload();
    }
  };

  const onBorrar = async (t) => {
    if (!(await confirmDialog({ message:(`¿Borrar "${t.titulo}"?`), danger:true }))) return;
    try { await tareasApi.borrar(evento.id, t.id); success('Tarea borrada.'); reload(); }
    catch (e) { toastErr(e.message); }
  };

  /* Stats arriba */
  const stats = ESTADOS.reduce((acc, e) => {
    acc[e.id] = tareas.filter(t => t.estado === e.id).length;
    return acc;
  }, {});

  if (loading) return <GLoader message="Cargando tareas..." />;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Tareas</h2>
          <p className="text-sm text-text-2 mt-1">
            {tareas.length} tarea{tareas.length !== 1 ? 's' : ''} · Trazabilidad y asignación por persona o rol.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-xl p-1">
            {[['kanban', 'Kanban'], ['lista', 'Lista']].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === k ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => setCreating(true)} className="btn-gradient btn-sm">
            <PlusIcon className="w-3.5 h-3.5" /> Nueva tarea
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {ESTADOS.map(e => (
          <div key={e.id} className="rounded-2xl border border-border bg-surface/40 px-4 py-3 transition-all hover:bg-surface/60">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${e.dot}`} />
              <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">{e.label}</p>
            </div>
            <p className="text-2xl font-bold font-display text-text-1 tabular-nums leading-none">{stats[e.id] || 0}</p>
          </div>
        ))}
      </div>

      {creating && (
        <TareaForm
          miembros={miembros}
          roles={roles}
          onCancel={() => setCreating(false)}
          onSave={onCrear}
        />
      )}

      {tareas.length === 0 && !creating ? (
        <Empty onCreate={() => setCreating(true)} />
      ) : view === 'kanban'
        ? <KanbanView tareas={tareas} onMover={onMover} onOpen={setOpenId} />
        : <ListaView tareas={tareas} onOpen={setOpenId} onMover={onMover} />}

      {openId && (
        <TareaModal
          eventoId={evento.id}
          tarea={tareas.find(t => t.id === openId)}
          miembros={miembros}
          roles={roles}
          onClose={() => setOpenId(null)}
          onSaved={() => { setOpenId(null); reload(); }}
          onDelete={() => { const t = tareas.find(x => x.id === openId); if (t) { setOpenId(null); onBorrar(t); } }}
        />
      )}
    </div>
  );
}

/* ─────────── Kanban con dnd-kit ─────────── */

function KanbanView({ tareas, onMover, onOpen }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState(null);
  const active = tareas.find(t => t.id === activeId);

  const onDragEnd = (e) => {
    setActiveId(null);
    const overId = e.over?.id;
    const activeId = e.active.id;
    if (!overId) return;
    /* over.id es el id de columna (estado) o de tarea (sortable, no usado aquí) */
    const destEstado = ESTADOS.find(s => s.id === overId)?.id;
    if (!destEstado) return;
    const tarea = tareas.find(t => t.id === activeId);
    if (tarea && tarea.estado !== destEstado) onMover(activeId, destEstado);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={e => setActiveId(e.active.id)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ESTADOS.map(estado => (
          <KanbanColumn
            key={estado.id}
            estado={estado}
            tareas={tareas.filter(t => t.estado === estado.id)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <TareaCard tarea={active} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ estado, tareas, onOpen }) {
  const { isOver, setNodeRef } = useDroppable({ id: estado.id });
  return (
    <div ref={setNodeRef}
      className={`rounded-3xl border bg-surface/40 transition-all min-h-[300px]
        ${isOver ? 'border-primary/50 bg-surface/60' : 'border-border'}
      `}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${estado.dot}`} />
          <p className="text-sm font-semibold text-text-1">{estado.label}</p>
        </div>
        <span className="text-xs text-text-3 tabular-nums">{tareas.length}</span>
      </div>
      <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
        {tareas.length === 0 ? (
          <p className="text-xs text-text-3 text-center py-6">Arrastra tareas aquí</p>
        ) : tareas.map(t => (
          <DraggableTarea key={t.id} tarea={t} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function DraggableTarea({ tarea, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarea.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : { opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => !isDragging && onOpen(tarea.id)}>
      <TareaCard tarea={tarea} />
    </div>
  );
}

function TareaCard({ tarea, dragging }) {
  const prioridad = PRIORIDAD_INFO[tarea.prioridad] || PRIORIDAD_INFO.normal;
  const vence = tarea.vence_at ? new Date(tarea.vence_at) : null;
  const vencido = vence && vence < new Date() && tarea.estado !== 'hecho' && tarea.estado !== 'cancelada';
  return (
    <div className={`rounded-2xl border bg-surface px-3.5 py-3 cursor-grab active:cursor-grabbing transition-all
      ${dragging ? 'border-primary shadow-2xl rotate-1' : 'border-border hover:border-border-2 hover:-translate-y-0.5'}
      animate-[fadeUp_0.25s_ease_both]
    `}>
      <div className="flex items-start gap-2 mb-2">
        <p className="text-sm font-medium text-text-1 leading-snug flex-1 line-clamp-3">{tarea.titulo}</p>
        {tarea.prioridad !== 'normal' && (
          <span className={`text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-full ${prioridad.cls}`}>
            {prioridad.label}
          </span>
        )}
      </div>
      {tarea.descripcion && <p className="text-xs text-text-3 line-clamp-2 mb-2">{tarea.descripcion}</p>}
      <div className="flex items-center gap-2 justify-between">
        <Asignacion tarea={tarea} compact />
        {vence && (
          <span className={`text-xs tabular-nums ${vencido ? 'text-danger' : 'text-text-3'}`}>
            {vence.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  );
}

function Asignacion({ tarea, compact }) {
  if (tarea.asignado_user) {
    const u = tarea.asignado_user;
    const initials = (u.nombre || u.email || 'U').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          {u.avatar_url
            ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-white text-[10px] font-bold">{initials}</span>}
        </div>
        {!compact && <span className="text-xs text-text-2 truncate">{u.nombre}</span>}
      </div>
    );
  }
  if (tarea.asignado_rol) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary-light min-w-0">
        <RoleIcon className="w-3 h-3" />
        <span className="truncate">{tarea.asignado_rol.nombre}</span>
      </div>
    );
  }
  return <span className="text-xs text-text-3 italic">Sin asignar</span>;
}

/* ─────────── Lista ─────────── */

function ListaView({ tareas, onOpen, onMover }) {
  return (
    <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
      {tareas.map((t, i) => (
        <ListaRow key={t.id} tarea={t} onOpen={onOpen} onToggleHecho={() => onMover(t.id, t.estado === 'hecho' ? 'pendiente' : 'hecho')} isLast={i === tareas.length - 1} />
      ))}
    </div>
  );
}

function ListaRow({ tarea, onOpen, onToggleHecho, isLast }) {
  const estado = ESTADO_BY_ID[tarea.estado];
  const prioridad = PRIORIDAD_INFO[tarea.prioridad] || PRIORIDAD_INFO.normal;
  const isDone = tarea.estado === 'hecho';
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${!isLast ? 'border-b border-border' : ''} hover:bg-surface-2/30 transition-colors group cursor-pointer`}
      onClick={() => onOpen(tarea.id)}>
      <button onClick={(e) => { e.stopPropagation(); onToggleHecho(); }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${isDone ? 'border-success bg-success' : 'border-border hover:border-text-2'}
        `}>
        {isDone && <CheckIcon className="w-3 h-3 text-bg" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-base ${isDone ? 'text-text-3 line-through' : 'text-text-1'} font-medium truncate`}>{tarea.titulo}</p>
        {tarea.descripcion && <p className="text-xs text-text-3 truncate mt-0.5">{tarea.descripcion}</p>}
      </div>
      <span className={`text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${prioridad.cls}`}>{prioridad.label}</span>
      <div className="hidden sm:flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${estado.dot}`} />
        <span className="text-xs text-text-2">{estado.label}</span>
      </div>
      <div className="w-32 hidden md:block"><Asignacion tarea={tarea} /></div>
      {tarea.vence_at && (
        <span className="text-xs text-text-3 tabular-nums hidden sm:inline">
          {new Date(tarea.vence_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
        </span>
      )}
    </div>
  );
}

/* ─────────── Form crear/editar ─────────── */

function TareaForm({ initial, miembros, roles, onSave, onCancel }) {
  const [form, setForm] = useState({
    titulo          : initial?.titulo || '',
    descripcion     : initial?.descripcion || '',
    prioridad       : initial?.prioridad || 'normal',
    asignado_tipo   : initial?.asignado_user_id ? 'usuario' : initial?.asignado_rol_id ? 'rol' : 'sin',
    asignado_user_id: initial?.asignado_user_id || '',
    asignado_rol_id : initial?.asignado_rol_id || '',
    vence_at        : initial?.vence_at ? toLocalInput(initial.vence_at) : '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSaving(true);
    await onSave({
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      prioridad: form.prioridad,
      asignado_user_id: form.asignado_tipo === 'usuario' ? form.asignado_user_id || null : null,
      asignado_rol_id : form.asignado_tipo === 'rol'     ? form.asignado_rol_id  || null : null,
      vence_at: form.vence_at ? new Date(form.vence_at).toISOString() : null,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-primary/25 bg-surface/40 p-5 space-y-3 animate-[fadeUp_0.3s_ease_both]">
      <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">{initial ? 'Editar tarea' : 'Nueva tarea'}</p>
      <input value={form.titulo} onChange={e => setForm(f => ({...f, titulo: e.target.value}))}
        placeholder="¿Qué hay que hacer?" required autoFocus
        className="input rounded-2xl py-3 text-base font-medium" />
      <textarea value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))}
        placeholder="Detalles (opcional)" rows={2}
        className="input rounded-2xl py-3 text-base resize-none" />

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="field">
          <label className="label">Prioridad</label>
          <select value={form.prioridad} onChange={e => setForm(f => ({...f, prioridad: e.target.value}))}
            className="input bg-surface-2 rounded-2xl py-3">
            {Object.entries(PRIORIDAD_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Asignar a</label>
          <select value={form.asignado_tipo} onChange={e => setForm(f => ({...f, asignado_tipo: e.target.value}))}
            className="input bg-surface-2 rounded-2xl py-3">
            <option value="sin">Sin asignar</option>
            <option value="usuario">Persona específica</option>
            <option value="rol">Todo un rol</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Vence</label>
          <input type="datetime-local" value={form.vence_at} onChange={e => setForm(f => ({...f, vence_at: e.target.value}))}
            className="input bg-surface-2 rounded-2xl py-3" />
        </div>
      </div>

      {form.asignado_tipo === 'usuario' && (
        <div className="field animate-[fadeUp_0.2s_ease_both]">
          <label className="label">Persona</label>
          <select value={form.asignado_user_id} onChange={e => setForm(f => ({...f, asignado_user_id: e.target.value}))}
            className="input bg-surface-2 rounded-2xl py-3">
            <option value="">Selecciona persona...</option>
            {miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}{m.isOwner ? ' (Owner)' : ''}</option>)}
          </select>
        </div>
      )}
      {form.asignado_tipo === 'rol' && (
        <div className="field animate-[fadeUp_0.2s_ease_both]">
          <label className="label">Rol</label>
          <select value={form.asignado_rol_id} onChange={e => setForm(f => ({...f, asignado_rol_id: e.target.value}))}
            className="input bg-surface-2 rounded-2xl py-3">
            <option value="">Selecciona rol...</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost btn-sm">Cancelar</button>
        <button type="submit" disabled={saving || !form.titulo.trim()} className="btn-primary btn-sm">
          {saving ? <><Spinner size="sm" /> Guardando...</> : (initial ? 'Guardar' : 'Crear tarea')}
        </button>
      </div>
    </form>
  );
}

/* ─────────── Modal con detalle + log + comentarios ─────────── */

function TareaModal({ eventoId, tarea, miembros, roles, onClose, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [log, setLog] = useState([]);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const { error: toastErr } = useToast();

  useEffect(() => {
    tareasApi.log(eventoId, tarea.id).then(d => setLog(d.log || [])).catch(() => {});
  }, [eventoId, tarea.id]);

  const cambiarEstado = async (nuevo) => {
    setLoading(true);
    try {
      await tareasApi.editar(eventoId, tarea.id, { estado: nuevo });
      onSaved();
    } catch (e) { toastErr(e.message); }
    finally    { setLoading(false); }
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    try {
      await tareasApi.comentar(eventoId, tarea.id, comentario);
      setComentario('');
      const d = await tareasApi.log(eventoId, tarea.id);
      setLog(d.log || []);
    } catch (e) { toastErr(e.message); }
  };

  if (editing) {
    return (
      <ModalShell onClose={onClose} wide>
        <TareaForm
          initial={tarea}
          miembros={miembros}
          roles={roles}
          onCancel={() => setEditing(false)}
          onSave={async (payload) => {
            try { await tareasApi.editar(eventoId, tarea.id, payload); onSaved(); }
            catch (e) { toastErr(e.message); }
          }}
        />
      </ModalShell>
    );
  }

  const estado = ESTADO_BY_ID[tarea.estado];
  const prioridad = PRIORIDAD_INFO[tarea.prioridad] || PRIORIDAD_INFO.normal;

  return (
    <ModalShell onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${estado.dot}`} />
              <span className="text-xs uppercase tracking-widest text-text-3 font-semibold">{estado.label}</span>
              <span className={`text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${prioridad.cls}`}>{prioridad.label}</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">{tarea.titulo}</h2>
            {tarea.descripcion && <p className="text-base text-text-2 mt-2 leading-relaxed">{tarea.descripcion}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="btn-ghost btn-sm">Editar</button>
            <button onClick={onDelete} className="btn-ghost btn-sm text-danger/80 hover:text-danger">Borrar</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-border bg-surface/40">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-1.5">Asignado a</p>
            <Asignacion tarea={tarea} />
          </div>
          {tarea.vence_at && (
            <div>
              <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-1.5">Vence</p>
              <p className="text-sm text-text-1 tabular-nums">{new Date(tarea.vence_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}
        </div>

        {/* Estado actions */}
        <div className="flex flex-wrap gap-2">
          {ESTADOS.filter(e => e.id !== tarea.estado).map(e => (
            <button key={e.id} disabled={loading} onClick={() => cambiarEstado(e.id)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-2 hover:border-border-2 text-sm transition-all">
              <span className={`w-2 h-2 rounded-full ${e.dot}`} />
              Mover a {e.label}
            </button>
          ))}
        </div>

        {/* Comentar */}
        <form onSubmit={enviarComentario} className="flex items-center gap-2">
          <input value={comentario} onChange={e => setComentario(e.target.value)}
            placeholder="Comentar en esta tarea..."
            className="input rounded-2xl py-2.5 flex-1" />
          <button type="submit" disabled={!comentario.trim()}
            className="px-4 py-2.5 rounded-2xl bg-text-1 text-bg hover:bg-white text-sm font-semibold disabled:opacity-50">
            Comentar
          </button>
        </form>

        {/* Log */}
        {log.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-3">Historial</p>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {log.map(entry => <LogEntry key={entry.id} entry={entry} miembros={miembros} roles={roles} />)}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function LogEntry({ entry, miembros, roles }) {
  const fecha = new Date(entry.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const nombre = entry.user?.nombre || 'Alguien';
  let desc = '';
  if (entry.tipo === 'created') desc = `${nombre} creó la tarea`;
  else if (entry.tipo === 'estado') desc = `${nombre} cambió a ${ESTADO_BY_ID[entry.contenido?.a]?.label || entry.contenido?.a}`;
  else if (entry.tipo === 'asignacion') {
    if (entry.contenido?.tipo === 'usuario') {
      const m = miembros.find(x => x.id === entry.contenido.user_id);
      desc = `${nombre} asignó a ${m?.nombre || 'alguien'}`;
    } else {
      const r = roles.find(x => x.id === entry.contenido.rol_id);
      desc = `${nombre} asignó al rol ${r?.nombre || 'X'}`;
    }
  }
  else if (entry.tipo === 'comentario') desc = `${nombre}: ${entry.contenido?.texto || ''}`;
  else desc = `${nombre} ${entry.tipo}`;

  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
        {entry.user?.avatar_url
          ? <img src={entry.user.avatar_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-white text-xs font-bold">{nombre.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-1 break-words">{desc}</p>
        <p className="text-xs text-text-3 tabular-nums mt-0.5">{fecha}</p>
      </div>
    </div>
  );
}

function Empty({ onCreate }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center animate-[fadeUp_0.4s_ease_both]">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border mb-4">
        <CheckIcon className="w-6 h-6 text-text-2" />
      </div>
      <h2 className="text-xl font-bold font-display text-text-1 mb-2">Sin tareas aún</h2>
      <p className="text-sm text-text-2 max-w-sm mx-auto mb-5">Crea tu primera tarea y asígnala a alguien del equipo o a un rol completo.</p>
      <button onClick={onCreate} className="btn-gradient">
        <PlusIcon className="w-4 h-4" /> Crear tarea
      </button>
    </div>
  );
}

function ModalShell({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-[fadeIn_0.2s_ease_both]"
      onClick={onClose}>
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-3xl border border-border-2 bg-surface shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-[authCardIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]`}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Cerrar"
          className="absolute top-3 right-3 w-9 h-9 rounded-xl text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center z-10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function CheckIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}
function RoleIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
