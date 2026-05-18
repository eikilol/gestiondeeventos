/* Mi trabajo — vista del miembro del equipo.
   Eventos donde soy parte del equipo + mis tareas pendientes + enviar
   sugerencias/solicitudes/mensajes al organizador y ver su estado. */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitudesApi } from '../../api/solicitudes.js';
import { tareasApi } from '../../api/tareas.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import GLoader from '../../components/ui/GLoader.jsx';

const TIPOS = [
  { v: 'sugerencia', l: 'Sugerencia' },
  { v: 'solicitud',  l: 'Solicitud' },
  { v: 'mensaje',    l: 'Mensaje' },
  { v: 'reporte',    l: 'Reporte' },
];
const EST = {
  abierta:     { l: 'Abierta',     c: 'border-warning/40 text-warning' },
  en_revision: { l: 'En revisión', c: 'border-primary/40 text-primary-light' },
  resuelta:    { l: 'Resuelta',    c: 'border-success/40 text-success' },
  descartada:  { l: 'Descartada',  c: 'border-border-2 text-text-3' },
};

export default function MiTrabajoPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel]         = useState(null);
  const { error: toastErr }   = useToast();

  useEffect(() => {
    solicitudesApi.misEventos()
      .then(d => { setEventos(d.eventos || []); if ((d.eventos || []).length) setSel(d.eventos[0]); })
      .catch(e => toastErr(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return <GLoader message="Cargando tu trabajo..." />;

  if (eventos.length === 0) return (
    <div className="max-w-lg mx-auto mt-16 text-center space-y-3">
      <h1 className="text-2xl font-display font-bold text-text-1">Aún no estás en ningún equipo</h1>
      <p className="text-text-2">Cuando un organizador te invite a un evento, aquí verás tu trabajo,
        tus tareas y podrás enviarle sugerencias.</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-7rem)] flex gap-4">
      {/* Eventos donde soy equipo */}
      <aside className="w-[280px] flex-shrink-0 flex flex-col rounded-3xl border border-border-2
                        bg-surface/70 overflow-hidden">
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-lg font-display font-bold text-text-1">Mi trabajo</h1>
          <p className="text-xs text-text-3 mt-0.5">Eventos de tu equipo</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {eventos.map(ev => (
            <button key={ev.id} onClick={() => setSel(ev)}
              className={`w-full text-left rounded-xl px-3 py-2.5 transition border
                ${sel?.id === ev.id ? 'bg-surface-2 border-primary/40' : 'border-transparent hover:bg-surface-2'}`}>
              <p className="text-sm font-medium text-text-1 truncate">{ev.titulo}</p>
              <p className="text-[11px] text-text-3 mt-0.5">
                {ev.mi_rol || 'Miembro'}
                {ev.tareas_pendientes > 0 && <> · <span className="text-warning">{ev.tareas_pendientes} tarea(s)</span></>}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Detalle del evento seleccionado */}
      <div className="flex-1 min-w-0 rounded-3xl border border-border-2 bg-surface/70 overflow-y-auto">
        {sel ? <EventoTrabajo ev={sel} /> : null}
      </div>
    </div>
  );
}

function EventoTrabajo({ ev }) {
  const [mias, setMias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [tipo, setTipo] = useState('sugerencia');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { success, error: toastErr } = useToast();
  const { usuario } = useAuth();

  const reload = () => {
    solicitudesApi.list(ev.id).then(d => setMias(d.solicitudes || [])).catch(() => {});
    tareasApi.list(ev.id).then(d => {
      const mine = (d.tareas || []).filter(t =>
        ['pendiente', 'en_curso'].includes(t.estado) &&
        (t.asignado_user_id === usuario?.id || ev.mi_rol === 'Organizador'));
      mine.sort((a, b) => (a.vence_at || '9999').localeCompare(b.vence_at || '9999'));
      setTareas(mine);
    }).catch(() => setTareas([]));
  };
  useEffect(() => { reload(); setTitulo(''); setContenido(''); /* eslint-disable-next-line */ }, [ev.id]);

  const marcarHecha = async (t) => {
    try { await tareasApi.editar(ev.id, t.id, { estado: 'hecho' }); success('Tarea completada.'); reload(); }
    catch (e) { toastErr(e.message); }
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    setEnviando(true);
    try {
      await solicitudesApi.crear(ev.id, { tipo, titulo, contenido });
      success('Enviado al organizador.');
      setTitulo(''); setContenido('');
      reload();
    } catch (err) { toastErr(err.message); }
    finally { setEnviando(false); }
  };

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-text-1">{ev.titulo}</h2>
        <p className="text-sm text-text-3">
          Tu rol: <span className="text-text-1">{ev.mi_rol || 'Miembro'}</span>
          {' · '}
          <Link to={`/eventos/${ev.id}`} className="text-primary hover:underline">Abrir evento</Link>
        </p>
      </div>

      {/* Tus tareas pendientes */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-2">
          Tus tareas pendientes {tareas.length > 0 && <span className="text-warning">({tareas.length})</span>}
        </p>
        {tareas.length === 0 ? (
          <p className="text-sm text-text-3">No tienes tareas pendientes en este evento. 🎉</p>
        ) : tareas.map(t => (
          <div key={t.id} className="rounded-xl border border-border bg-surface/40 p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-1 truncate">{t.titulo}</p>
              <p className="text-[11px] text-text-3 mt-0.5">
                {t.prioridad && <span className="uppercase tracking-wide">{t.prioridad}</span>}
                {t.vence_at && <> · vence {new Date(t.vence_at).toLocaleDateString('es')}</>}
                {' · '}{t.estado}
              </p>
            </div>
            <button onClick={() => marcarHecha(t)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-success/40 text-success
                         hover:bg-success/10 transition flex-shrink-0">
              Marcar hecha
            </button>
          </div>
        ))}
      </div>

      {/* Enviar al organizador */}
      <form onSubmit={enviar} className="rounded-2xl border border-primary/30 bg-surface-2/60 p-4 space-y-3">
        <p className="font-display font-semibold text-text-1">Enviar al organizador</p>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map(t => (
            <button type="button" key={t.v} onClick={() => setTipo(t.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                ${tipo === t.v ? 'bg-gradient-primary text-white border-transparent'
                  : 'border-border text-text-3 hover:text-text-1'}`}>
              {t.l}
            </button>
          ))}
        </div>
        <input value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Título (opcional)"
          className="input rounded-xl py-2.5 text-sm" />
        <textarea rows={3} value={contenido} onChange={e => setContenido(e.target.value)}
          placeholder="Escribe tu sugerencia, solicitud o mensaje…"
          className="input rounded-xl py-2.5 text-sm resize-none" />
        <div className="flex justify-end">
          <button type="submit" disabled={enviando || !contenido.trim()}
            className="btn-gradient btn-sm">{enviando ? 'Enviando…' : 'Enviar'}</button>
        </div>
      </form>

      {/* Mis envíos */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-text-2">Mis envíos</p>
        {mias.length === 0 ? (
          <p className="text-sm text-text-3">Todavía no enviaste nada para este evento.</p>
        ) : mias.map(it => {
          const e = EST[it.estado] || EST.abierta;
          return (
            <div key={it.id} className="rounded-2xl border border-border bg-surface/40 p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-text-3
                                 bg-surface-2 border border-border rounded px-2 py-0.5">{it.tipo}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${e.c}`}>{e.l}</span>
                <span className="text-[11px] text-text-3 ml-auto">{new Date(it.created_at).toLocaleDateString('es')}</span>
              </div>
              {it.titulo && <p className="font-semibold text-text-1 mt-2">{it.titulo}</p>}
              <p className="text-sm text-text-2 mt-1 whitespace-pre-wrap">{it.contenido}</p>
              {it.respuesta && (
                <div className="mt-3 rounded-xl bg-surface-2 border border-border px-3 py-2">
                  <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">Respuesta del organizador</p>
                  <p className="text-sm text-text-1 mt-1 whitespace-pre-wrap">{it.respuesta}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
