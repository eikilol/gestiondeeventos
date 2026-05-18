/* Tab Sugerencias — el organizador ve y gestiona lo que envía el equipo. */

import { useEffect, useState } from 'react';
import { solicitudesApi } from '../../../api/solicitudes.js';
import { useToast } from '../../../context/ToastContext.jsx';
import GLoader from '../../../components/ui/GLoader.jsx';

const ESTADOS = [
  { v: 'abierta',     l: 'Abierta',      c: 'border-warning/40 text-warning' },
  { v: 'en_revision', l: 'En revisión',  c: 'border-primary/40 text-primary-light' },
  { v: 'resuelta',    l: 'Resuelta',     c: 'border-success/40 text-success' },
  { v: 'descartada',  l: 'Descartada',   c: 'border-border-2 text-text-3' },
];
const TIPO_LABEL = { sugerencia: 'Sugerencia', solicitud: 'Solicitud', mensaje: 'Mensaje', reporte: 'Reporte' };

export default function SolicitudesTab({ evento }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const { success, error: toastErr } = useToast();

  const reload = async () => {
    setLoading(true);
    try { setItems((await solicitudesApi.list(evento.id)).solicitudes || []); }
    catch (e) { toastErr(e.message); }
    finally   { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [evento.id]);

  const cambiar = async (it, patch) => {
    try {
      await solicitudesApi.actualizar(evento.id, it.id, patch);
      success('Actualizada.');
      reload();
    } catch (e) { toastErr(e.message); }
  };

  if (loading) return <GLoader message="Cargando sugerencias..." />;

  const vis = filtro === 'todas' ? items : items.filter(i => i.estado === filtro);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Sugerencias del equipo</h2>
          <p className="text-sm text-text-2 mt-1">Lo que tu equipo te envía: ideas, solicitudes, reportes y mensajes.</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {['todas', ...ESTADOS.map(e => e.v)].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                ${filtro === f ? 'bg-surface-2 border-primary/40 text-text-1'
                  : 'border-border text-text-3 hover:text-text-1'}`}>
              {f === 'todas' ? 'Todas' : ESTADOS.find(e => e.v === f)?.l}
            </button>
          ))}
        </div>
      </div>

      {vis.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface/40 px-6 py-14 text-center">
          <p className="text-text-2">Nada por aquí todavía. Cuando tu equipo envíe sugerencias o solicitudes, aparecerán acá.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vis.map(it => {
            const est = ESTADOS.find(e => e.v === it.estado) || ESTADOS[0];
            return (
              <div key={it.id} className="rounded-2xl border border-border bg-surface/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-text-3
                                       bg-surface-2 border border-border rounded px-2 py-0.5">
                        {TIPO_LABEL[it.tipo] || it.tipo}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${est.c}`}>{est.l}</span>
                    </div>
                    {it.titulo && <p className="font-semibold text-text-1 mt-2">{it.titulo}</p>}
                    <p className="text-sm text-text-2 mt-1 whitespace-pre-wrap">{it.contenido}</p>
                    <p className="text-[11px] text-text-3 mt-2">
                      {it.autor?.nombre || 'Miembro'} · {new Date(it.created_at).toLocaleString('es')}
                    </p>
                  </div>
                  <select
                    value={it.estado}
                    onChange={e => cambiar(it, { estado: e.target.value })}
                    className="input bg-surface-2 rounded-lg py-1.5 text-xs w-auto"
                  >
                    {ESTADOS.map(e => <option key={e.v} value={e.v}>{e.l}</option>)}
                  </select>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer text-text-3 hover:text-text-1 text-xs">
                    {it.respuesta ? 'Editar respuesta' : 'Responder al autor'}
                  </summary>
                  <RespForm initial={it.respuesta || ''} onSave={(r) => cambiar(it, { respuesta: r })} />
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RespForm({ initial, onSave }) {
  const [v, setV] = useState(initial);
  return (
    <div className="mt-2 flex gap-2">
      <textarea rows={2} value={v} onChange={e => setV(e.target.value)}
        placeholder="Tu respuesta para el autor…"
        className="input rounded-xl py-2 text-sm flex-1" />
      <button onClick={() => onSave(v)} className="btn-primary btn-sm self-start">Guardar</button>
    </div>
  );
}
