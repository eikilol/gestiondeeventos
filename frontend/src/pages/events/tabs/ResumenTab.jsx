import { useState, useEffect } from 'react';
import { eventosApi } from '../../../api/eventos.js';
import { tareasApi } from '../../../api/tareas.js';
import { useToast } from '../../../context/ToastContext.jsx';

/* Tab Resumen — info general + equipo + recordatorios. */

export default function ResumenTab({ evento }) {
  const fmt = (d) => d
    ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const pct = evento.aforo_total > 0
    ? Math.min(100, Math.round((evento.aforo_vendido || 0) / evento.aforo_total * 100))
    : 0;

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* IZQUIERDA — Info (2/3) */}
      <div className="lg:col-span-2 space-y-5">
        <Card title="Información">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Item label="Inicio"     value={fmt(evento.fecha_inicio)} />
            <Item label="Fin"        value={fmt(evento.fecha_fin)} />
            {evento.categoria?.nombre && <Item label="Categoría" value={evento.categoria.nombre} />}
            {evento.location_nombre  && <Item label="Lugar"     value={evento.location_nombre} />}
            {evento.location_direccion && <Item label="Dirección" value={evento.location_direccion} className="col-span-2" />}
          </div>
        </Card>

        {Array.isArray(evento.links) && evento.links.length > 0 && (
          <Card title="Links del evento">
            <div className="flex flex-wrap gap-2">
              {evento.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-2 hover:border-border-2 text-xs text-text-1 transition-all">
                  <span className="uppercase tracking-wider text-text-3 text-[10px]">{l.tipo}</span>
                  <span className="truncate max-w-[180px]">{l.label || l.url.replace(/^https?:\/\//, '')}</span>
                </a>
              ))}
            </div>
          </Card>
        )}

        <Card title="Aforo">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold font-display tabular-nums text-text-1">
                {evento.aforo_vendido || 0}
                {evento.aforo_total ? <span className="text-text-3 text-xl"> / {evento.aforo_total}</span> : null}
              </p>
              <p className="text-xs text-text-3 mt-1">inscritos</p>
            </div>
            {evento.aforo_total > 0 && (
              <p className="text-sm text-text-2 tabular-nums">{pct}%</p>
            )}
          </div>
          {evento.aforo_total > 0 && (
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-text-1 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          )}
        </Card>
      </div>

      {/* DERECHA — Equipo (1/3) */}
      <aside className="space-y-5">
        <Card title="Equipo del evento">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              O
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-1 font-medium truncate">Tú (organizador)</p>
              <p className="text-xs text-text-3">Owner · acceso total</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-3 leading-relaxed">
              Invita gente y asigna roles desde la tab <span className="text-text-2 font-medium">Equipo y roles</span>.
            </p>
          </div>
        </Card>

        <RecordatoriosCard evento={evento} />

        <ProximasTareasCard eventoId={evento.id} />
      </aside>
    </div>
  );
}

function RecordatoriosCard({ evento }) {
  const { success, error } = useToast();
  const [enabled, setEnabled] = useState(evento.email_reminders !== false);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    try {
      await eventosApi.update(evento.id, { email_reminders: next });
      setEnabled(next);
      success(next ? 'Recordatorios activados.' : 'Recordatorios desactivados.');
    } catch (e) { error(e.message); }
    finally    { setSaving(false); }
  };

  return (
    <Card title="Recordatorios email">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-1 font-medium">Envío automático</p>
          <p className="text-xs text-text-3 leading-relaxed mt-1">
            Asistentes pagados reciben emails 7 días, 1 día y 1 hora antes del evento.
          </p>
        </div>
        <button onClick={toggle} disabled={saving}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${enabled ? 'bg-success' : 'bg-surface-3'} disabled:opacity-50`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </Card>
  );
}

function ProximasTareasCard({ eventoId }) {
  const [tareas, setTareas] = useState(null);
  useEffect(() => {
    tareasApi.list(eventoId)
      .then(d => {
        const p = (d.tareas || [])
          .filter(t => ['pendiente', 'en_curso'].includes(t.estado))
          .sort((a, b) => (a.vence_at || '9999').localeCompare(b.vence_at || '9999'))
          .slice(0, 5);
        setTareas(p);
      })
      .catch(() => setTareas([]));
  }, [eventoId]);

  return (
    <Card title="Próximas tareas">
      {tareas === null ? (
        <p className="text-xs text-text-3">Cargando…</p>
      ) : tareas.length === 0 ? (
        <p className="text-xs text-text-3 leading-relaxed">
          No hay tareas pendientes. Crea tareas en la pestaña <span className="text-text-2 font-medium">Tareas</span>.
        </p>
      ) : (
        <ul className="space-y-2">
          {tareas.map(t => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                t.prioridad === 'urgente' || t.prioridad === 'alta' ? 'bg-danger' : 'bg-primary'}`} />
              <span className="flex-1 min-w-0 truncate text-text-1">{t.titulo}</span>
              {t.vence_at && (
                <span className="text-[11px] text-text-3 flex-shrink-0">
                  {new Date(t.vence_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Card({ title, children, muted }) {
  return (
    <div className={`rounded-3xl border border-border bg-surface/40 p-6 ${muted ? 'opacity-70' : ''}`}>
      <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-4">{title}</p>
      {children}
    </div>
  );
}

function Item({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold mb-1">{label}</p>
      <p className="text-sm text-text-1">{value}</p>
    </div>
  );
}
