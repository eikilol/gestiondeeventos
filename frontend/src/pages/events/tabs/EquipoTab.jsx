import { useEffect, useState } from 'react';
import { equipoApi } from '../../../api/equipo.js';
import { rolesApi }  from '../../../api/roles.js';
import { useToast }  from '../../../context/ToastContext.jsx';
import Spinner       from '../../../components/ui/Spinner.jsx';
import GLoader       from '../../../components/ui/GLoader.jsx';
import { permisosPorGrupo, labelFor } from '../../../lib/permisos.js';

/* Tab Equipo y roles — flujo en dos pasos:
   1. Definir los roles del evento (vienen 6 defaults, puedes editar/crear/borrar)
   2. Invitar gente asignándolos a un rol existente */

export default function EquipoTab({ evento }) {
  const [equipo,  setEquipo]  = useState(null);
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { error: toastErr } = useToast();

  const reload = async () => {
    setLoading(true);
    try {
      const [eq, rs] = await Promise.all([equipoApi.list(evento.id), rolesApi.list(evento.id)]);
      setEquipo(eq);
      setRoles(rs.roles || []);
    } catch (e) {
      toastErr(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [evento.id]);

  if (loading) return (
    <GLoader message="Cargando equipo..." />
  );

  return (
    <div className="space-y-7">
      <RolesSection
        eventoId={evento.id}
        roles={roles}
        onChange={reload}
      />

      <MiembrosSection
        eventoId={evento.id}
        equipo={equipo}
        roles={roles}
        onChange={reload}
      />

      <RankingEquipoSection eventoId={evento.id} />
    </div>
  );
}

/* ─────────── RANKING DE EQUIPO (gamificación por evento) ─────────── */
function RankingEquipoSection({ eventoId }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    import('../../../api/loyalty.js')
      .then(m => m.loyaltyApi.rankingEvento(eventoId))
      .then(d => { if (activo) setRanking(d.ranking || []); })
      .catch(() => {})
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [eventoId]);

  return (
    <section>
      <div className="mb-3">
        <h3 className="text-lg font-bold font-display text-text-1 tracking-tight">Ranking del equipo</h3>
        <p className="text-sm text-text-2 mt-0.5">Puntos ganados por tareas completadas y check-ins operados en este evento.</p>
      </div>
      <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
        {loading ? (
          <div className="p-6"><Spinner size="md" /></div>
        ) : ranking.length === 0 ? (
          <p className="text-sm text-text-3 text-center py-10">
            Todavía nadie sumó puntos en este evento. Completar tareas u operar check-ins otorga puntos al equipo.
          </p>
        ) : (
          ranking.map(r => (
            <div key={r.user_id}
              className={`flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 ${r.es_yo ? 'bg-primary/10' : ''}`}>
              <span className={`w-7 text-center text-sm font-bold font-display tabular-nums ${r.posicion <= 3 ? 'text-warning' : 'text-text-3'}`}>
                {r.posicion}
              </span>
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : (r.nombre?.[0] || 'U').toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium text-text-1 truncate">
                {r.nombre}{r.es_yo && <span className="text-xs text-primary-light ml-1.5">(vos)</span>}
              </span>
              <span className="text-sm font-bold text-text-1 tabular-nums">{r.puntos.toLocaleString('es-CO')} pts</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ─────────── ROLES ─────────── */

function RolesSection({ eventoId, roles, onChange }) {
  const [creating, setCreating] = useState(false);
  const [working, setWorking]   = useState(false);
  const [draft, setDraft]       = useState({ nombre: '', descripcion: '', permissions: [] });
  const [editing, setEditing]   = useState(null); // id del rol en edición
  const { success, error: toastErr } = useToast();

  const onCrear = async (e) => {
    e.preventDefault();
    if (!draft.nombre.trim()) return;
    setWorking(true);
    try {
      await rolesApi.crear(eventoId, draft);
      success('Rol creado.');
      setDraft({ nombre: '', descripcion: '', permissions: [] });
      setCreating(false);
      onChange();
    } catch (e) { toastErr(e.message); }
    finally    { setWorking(false); }
  };

  const onBorrar = async (rol) => {
    if (!window.confirm(`¿Borrar el rol "${rol.nombre}"?`)) return;
    try {
      await rolesApi.borrar(eventoId, rol.id);
      success('Rol borrado.');
      onChange();
    } catch (e) { toastErr(e.message); }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">Paso 1</p>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight mt-0.5">Roles del evento</h2>
          <p className="text-sm text-text-2 mt-1">
            Define qué roles necesita tu equipo. Después invitas y asignas.
          </p>
        </div>
        <button onClick={() => setCreating(v => !v)} className="btn-secondary btn-sm">
          <PlusIcon className="w-3.5 h-3.5" />
          Nuevo rol
        </button>
      </div>

      {creating && (
        <form onSubmit={onCrear}
          className="rounded-2xl border border-border bg-surface/40 p-5 animate-[fadeUp_0.3s_ease_both] space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Nombre *</label>
              <input
                value={draft.nombre}
                onChange={e => setDraft(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Encargado de música"
                className="input rounded-2xl py-3 text-base"
                required autoFocus
              />
            </div>
            <div className="field">
              <label className="label">Descripción (opcional)</label>
              <input
                value={draft.descripcion}
                onChange={e => setDraft(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Qué hace este rol"
                className="input rounded-2xl py-3 text-base"
              />
            </div>
          </div>

          <PermisosSelector
            value={draft.permissions}
            onChange={v => setDraft(p => ({ ...p, permissions: v }))}
          />

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost btn-sm">Cancelar</button>
            <button type="submit" disabled={working} className="btn-primary btn-sm">
              {working ? <><Spinner size="sm" /> Creando...</> : 'Crear rol'}
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {roles.map(r => (
          <RolCard
            key={r.id}
            rol={r}
            eventoId={eventoId}
            isEditing={editing === r.id}
            onStartEdit={() => setEditing(r.id)}
            onCancelEdit={() => setEditing(null)}
            onSaved={() => { setEditing(null); onChange(); }}
            onDelete={() => onBorrar(r)}
          />
        ))}
      </div>
    </section>
  );
}

function RolCard({ rol, eventoId, isEditing, onStartEdit, onCancelEdit, onSaved, onDelete }) {
  const [draft, setDraft] = useState({
    nombre: rol.nombre,
    descripcion: rol.descripcion || '',
    permissions: rol.permissions || [],
  });
  const [saving, setSaving] = useState(false);
  const { success, error: toastErr } = useToast();

  const save = async () => {
    if (!draft.nombre.trim()) return;
    setSaving(true);
    try {
      await rolesApi.editar(eventoId, rol.id, draft);
      success('Rol actualizado.');
      onSaved();
    } catch (e) { toastErr(e.message); }
    finally    { setSaving(false); }
  };

  if (isEditing) {
    return (
      <div className="sm:col-span-2 rounded-2xl border border-primary/30 bg-surface/40 p-5 space-y-4 animate-[fadeUp_0.2s_ease_both]">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={draft.nombre}
            onChange={e => setDraft(p => ({ ...p, nombre: e.target.value }))}
            className="input rounded-2xl py-3 text-base font-medium"
            autoFocus
          />
          <input
            value={draft.descripcion}
            onChange={e => setDraft(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción"
            className="input rounded-2xl py-3 text-base"
          />
        </div>
        <PermisosSelector
          value={draft.permissions}
          onChange={v => setDraft(p => ({ ...p, permissions: v }))}
        />
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancelEdit} className="btn-ghost btn-sm">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  const numPerms = (rol.permissions || []).length;

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 group hover:border-border-2 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-text-1">{rol.nombre}</p>
            {rol.is_system && (
              <span className="text-[9px] uppercase tracking-widest text-text-3 font-medium">default</span>
            )}
          </div>
          {rol.descripcion && <p className="text-xs text-text-2 mt-1 leading-relaxed">{rol.descripcion}</p>}
          <p className="text-[11px] text-text-3 mt-2">
            {numPerms === 0 ? 'Sin permisos asignados' : `${numPerms} ${numPerms === 1 ? 'permiso' : 'permisos'}`}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onStartEdit} aria-label="Editar"
            className="w-7 h-7 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
            <EditIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} aria-label="Borrar"
            className="w-7 h-7 rounded-lg text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── PermisosSelector ─────────── */

function PermisosSelector({ value = [], onChange }) {
  const grupos = permisosPorGrupo();
  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter(p => p !== id) : [...value, id]);
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">Permisos</p>
      <div className="rounded-2xl border border-border bg-surface/40 p-4 space-y-4 max-h-80 overflow-y-auto">
        {grupos.map(([grupo, perms]) => (
          <div key={grupo}>
            <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold mb-2">{grupo}</p>
            <div className="space-y-1.5">
              {perms.map(p => {
                const checked = value.includes(p.id);
                return (
                  <label key={p.id}
                    className={`flex items-start gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors
                      ${checked ? 'bg-primary/10 border border-primary/20' : 'border border-transparent hover:bg-surface-2/60'}`}>
                    <input
                      type="checkbox" checked={checked} onChange={() => toggle(p.id)}
                      className="mt-0.5 w-4 h-4 rounded border-border bg-surface-2 accent-primary flex-shrink-0"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="text-sm text-text-1 font-medium block">{p.label}</span>
                      <span className="text-xs text-text-3 block mt-0.5">{p.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-text-3 mt-2">
        {value.length === 0 ? 'Sin permisos seleccionados' : `${value.length} permiso(s) seleccionado(s)`}
      </p>
    </div>
  );
}

/* ─────────── MIEMBROS ─────────── */

function MiembrosSection({ eventoId, equipo, roles, onChange }) {
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: '', nombre_invitado: '', rol_id: '' });
  const [working, setWorking] = useState(false);
  const { success, error: toastErr } = useToast();

  const miembros = equipo?.miembros || [];

  const onInvitar = async (e) => {
    e.preventDefault();
    if (!invite.email.trim()) return toastErr('Email requerido.');
    if (!invite.rol_id)        return toastErr('Selecciona un rol.');
    setWorking(true);
    try {
      await equipoApi.invitar(eventoId, invite);
      success('Invitación enviada.');
      setInvite({ email: '', nombre_invitado: '', rol_id: '' });
      setShowInvite(false);
      onChange();
    } catch (e) { toastErr(e.message); }
    finally    { setWorking(false); }
  };

  const onCambiarRol = async (miembroId, rol_id) => {
    try {
      await equipoApi.cambiarRol(eventoId, miembroId, rol_id);
      success('Rol actualizado.');
      onChange();
    } catch (e) { toastErr(e.message); }
  };

  const onRemover = async (miembroId, label) => {
    if (!window.confirm(`Quitar a ${label} del equipo?`)) return;
    try {
      await equipoApi.remover(eventoId, miembroId);
      success('Miembro removido.');
      onChange();
    } catch (e) { toastErr(e.message); }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">Paso 2</p>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight mt-0.5">Miembros</h2>
          <p className="text-sm text-text-2 mt-1">
            {miembros.length + 1} {miembros.length + 1 === 1 ? 'persona con acceso' : 'personas con acceso'}.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(v => !v)}
          disabled={roles.length === 0}
          className="btn-gradient btn-sm disabled:opacity-50"
          title={roles.length === 0 ? 'Primero crea o conserva al menos un rol' : ''}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Invitar a alguien
        </button>
      </div>

      {showInvite && (
        <form onSubmit={onInvitar}
          className="rounded-2xl border border-border bg-surface/40 p-5 animate-[fadeUp_0.3s_ease_both]"
        >
          <div className="grid sm:grid-cols-[2fr_2fr_1.5fr] gap-3">
            <div className="field">
              <label className="label">Email *</label>
              <input
                type="email" required
                value={invite.email}
                onChange={e => setInvite(p => ({ ...p, email: e.target.value }))}
                placeholder="alguien@empresa.com"
                className="input rounded-2xl py-3 text-base"
              />
            </div>
            <div className="field">
              <label className="label">Nombre (opcional)</label>
              <input
                value={invite.nombre_invitado}
                onChange={e => setInvite(p => ({ ...p, nombre_invitado: e.target.value }))}
                placeholder="Cómo lo llamas"
                className="input rounded-2xl py-3 text-base"
              />
            </div>
            <div className="field">
              <label className="label">Rol *</label>
              <select
                required
                value={invite.rol_id}
                onChange={e => setInvite(p => ({ ...p, rol_id: e.target.value }))}
                className="input bg-surface-2 rounded-2xl py-3 text-base"
              >
                <option value="">Seleccionar...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-text-3 mt-3 leading-relaxed">
            Si la persona no tiene cuenta GESTEK aún, queda invitada y se activa cuando se registre con ese email.
          </p>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowInvite(false)} className="btn-ghost btn-sm">Cancelar</button>
            <button type="submit" disabled={working} className="btn-primary btn-sm">
              {working ? <><Spinner size="sm" /> Enviando...</> : 'Enviar invitación'}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
        {equipo?.owner && (
          <MiembroRow
            avatarUrl={equipo.owner.avatar_url}
            nombre={equipo.owner.nombre || 'Tú'}
            email={equipo.owner.email}
            rolLabel="Owner"
            isOwner
          />
        )}
        {miembros.map(m => (
          <MiembroRow
            key={m.id}
            avatarUrl={m.profile?.avatar_url}
            nombre={m.profile?.nombre || m.nombre_invitado || m.email}
            email={m.email}
            rolId={m.rol_id}
            rolLabel={m.rol_detail?.nombre || m.rol}
            status={m.status}
            invitedAt={m.invited_at}
            roles={roles}
            onChangeRol={r => onCambiarRol(m.id, r)}
            onRemove={() => onRemover(m.id, m.profile?.nombre || m.email)}
          />
        ))}
      </div>
    </section>
  );
}

function MiembroRow({ avatarUrl, nombre, email, rolId, rolLabel, status, invitedAt, isOwner, roles = [], onChangeRol, onRemove }) {
  const initials = (nombre || email || 'U').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-surface-2/30 transition-colors group">
      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-medium text-text-1 truncate">{nombre}</p>
          {status === 'invited' && (
            <span className="text-[10px] uppercase tracking-widest text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full font-semibold">
              Pendiente
            </span>
          )}
        </div>
        <p className="text-xs text-text-3 truncate mt-0.5">
          {email}
          {invitedAt && status === 'invited' && ` · invitado ${new Date(invitedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`}
        </p>
      </div>

      {isOwner ? (
        <span className="text-xs uppercase tracking-widest text-text-3 font-semibold px-3 py-1 rounded-full border border-border">
          {rolLabel}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={rolId || ''}
            onChange={e => onChangeRol(e.target.value)}
            className="text-sm bg-surface-2 border border-border rounded-xl px-3 py-1.5 text-text-1 hover:border-border-2 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          >
            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <button
            onClick={onRemove}
            aria-label="Quitar del equipo"
            className="w-9 h-9 rounded-xl text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function EditIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function TrashIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
