import { useState, useEffect } from 'react';
import { confirmDialog } from '../../components/ui/Confirm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usuariosApi } from '../../api/usuarios.js';
import { RolBadge } from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const ROLES = ['admin_global', 'organizador', 'asistente'];

export default function UsersPage() {
  const { hasPermiso, usuario: me } = useAuth();
  const { success, error }          = useToast();
  const [usuarios,  setUsuarios]    = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [editingId, setEditingId]   = useState(null);
  const [newRol,    setNewRol]      = useState('');
  const [deleting,  setDeleting]    = useState(null);

  useEffect(() => {
    if (!hasPermiso('usuarios:ver')) { setLoading(false); return; }
    usuariosApi.list()
      .then(data => setUsuarios(data.usuarios || []))
      .catch(e   => error(e.message))
      .finally(()=> setLoading(false));
  }, []);

  const handleRolChange = async (id) => {
    if (!newRol) return;
    try {
      const data = await usuariosApi.updateRol(id, newRol);
      setUsuarios(us => us.map(u => u.id === id ? { ...u, rol: data.usuario.rol } : u));
      success(`Rol actualizado a "${newRol}".`);
    } catch (e) {
      error(e.message);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!(await confirmDialog({ message:(`¿Eliminar a "${nombre}"?`), danger:true }))) return;
    setDeleting(id);
    try {
      await usuariosApi.delete(id);
      setUsuarios(us => us.filter(u => u.id !== id));
      success('Usuario eliminado.');
    } catch (e) {
      error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  if (!hasPermiso('usuarios:ver')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-4">
            <LockIcon className="w-7 h-7 text-danger" />
          </div>
          <p className="text-base font-semibold text-text-1">Acceso restringido</p>
          <p className="text-sm text-text-2 mt-1">No tienes permiso para ver esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-[fadeUp_0.4s_ease_both]">
      <div>
        <h1 className="text-xl font-bold font-display text-text-1">Usuarios</h1>
        <p className="text-sm text-text-2 mt-0.5">
          {loading ? 'Cargando...' : `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} registrados`}
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : usuarios.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Sin usuarios" description="Aún no hay usuarios registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Usuario</th>
                  <th className="th">Rol</th>
                  <th className="th hidden md:table-cell">Permisos</th>
                  <th className="th hidden lg:table-cell">Registrado</th>
                  {hasPermiso('usuarios:editar') && <th className="th text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-semibold font-display">
                            {u.nombre?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-1">
                            {u.nombre}
                            {String(u.id) === String(me?.id) && (
                              <span className="ml-1.5 text-[10px] badge-gray">tú</span>
                            )}
                          </p>
                          <p className="text-xs text-text-3">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="input text-xs py-1 w-36 bg-surface-2"
                            value={newRol}
                            onChange={e => setNewRol(e.target.value)}
                            autoFocus
                          >
                            <option value="">Seleccionar...</option>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => handleRolChange(u.id)} className="text-xs text-success font-medium hover:underline">
                            Guardar
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-text-3 hover:underline">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <RolBadge rol={u.rol} />
                      )}
                    </td>
                    <td className="td hidden md:table-cell">
                      <span className="text-xs text-text-3">
                        {(u.permisos_efectivos || u.permisos || []).length} permisos
                      </span>
                    </td>
                    <td className="td hidden lg:table-cell text-text-3 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '—'}
                    </td>
                    {hasPermiso('usuarios:editar') && (
                      <td className="td text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermiso('usuarios:asignar_rol') && String(u.id) !== String(me?.id) && (
                            <button
                              onClick={() => { setEditingId(u.id); setNewRol(u.rol); }}
                              className="btn btn-ghost btn-sm"
                            >
                              Cambiar rol
                            </button>
                          )}
                          {hasPermiso('usuarios:eliminar') && String(u.id) !== String(me?.id) && (
                            <button
                              onClick={() => handleDelete(u.id, u.nombre)}
                              disabled={deleting === u.id}
                              className="btn btn-ghost btn-sm text-danger"
                            >
                              {deleting === u.id ? <Spinner size="sm" /> : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function LockIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
}
