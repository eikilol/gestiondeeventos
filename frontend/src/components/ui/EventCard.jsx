import { Link } from 'react-router-dom';
import { EstadoBadge, ModalidadBadge } from './Badge.jsx';

export default function EventCard({ evento, onPublicar, onDelete, canEdit, canDelete, style }) {
  const pct = evento.aforo_total > 0
    ? Math.min(100, Math.round((evento.aforo_vendido || 0) / evento.aforo_total * 100))
    : 0;

  const barColor = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success';

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <article
      style={style}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_60px_-20px_rgba(59,130,246,0.4)] animate-[fadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
    >
      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/0 via-transparent to-accent/0 opacity-0 group-hover:from-primary/10 group-hover:to-accent/10 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Cover */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {evento.cover_url
          ? <img src={evento.cover_url} alt={evento.titulo} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          : <PlaceholderCover nombre={evento.titulo} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <EstadoBadge estado={evento.estado} />
          <ModalidadBadge modalidad={evento.modalidad} />
        </div>

        {/* Fecha como overlay grande estilo Apple */}
        {evento.fecha_inicio && (
          <div className="absolute bottom-3 right-3 bg-bg/80 backdrop-blur-md border border-border-2 rounded-xl px-3 py-1.5 text-right">
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold leading-none">
              {new Date(evento.fecha_inicio).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}
            </p>
            <p className="text-xl font-bold font-display text-text-1 tabular-nums leading-tight">
              {new Date(evento.fecha_inicio).getDate()}
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 gap-3 relative">
        <div className="flex-1 min-h-0">
          <Link to={`/eventos/${evento.id}`} className="text-lg font-bold font-display text-text-1 hover:text-primary-light transition-colors line-clamp-2 leading-tight tracking-tight">
            {evento.titulo}
          </Link>
          {evento.descripcion && (
            <p className="text-sm text-text-2 mt-1.5 line-clamp-2 leading-relaxed">{evento.descripcion}</p>
          )}
        </div>

        {/* Meta */}
        <div className="space-y-1.5 text-sm text-text-2">
          {fmt(evento.fecha_inicio) && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 flex-shrink-0 text-text-3" />
              <span>{fmt(evento.fecha_inicio)}</span>
            </div>
          )}
          {evento.location_nombre && (
            <div className="flex items-center gap-2">
              <LocationIcon className="w-4 h-4 flex-shrink-0 text-text-3" />
              <span className="truncate">{evento.location_nombre}</span>
            </div>
          )}
        </div>

        {/* Capacity */}
        {evento.aforo_total > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-2 tabular-nums">{evento.aforo_vendido || 0} asistentes</span>
              <span className="text-text-3 tabular-nums">{pct}% · {evento.aforo_total} cap.</span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-text-3 tabular-nums">{evento.aforo_vendido || 0} asistentes · sin tope</div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Link to={`/eventos/${evento.id}`} className="btn btn-secondary btn-sm flex-1 justify-center">
            Administrar
          </Link>
          {canEdit && evento.estado === 'borrador' && onPublicar && (
            <button onClick={() => onPublicar(evento.id)} className="btn btn-gradient btn-sm flex-1 justify-center">
              Publicar
            </button>
          )}
          {canDelete && onDelete && (
            <button onClick={() => onDelete(evento.id, evento.titulo)} aria-label="Borrar"
              className="btn btn-ghost btn-sm text-danger/70 hover:text-danger px-2.5">
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function PlaceholderCover({ nombre }) {
  const hue = nombre ? (nombre.charCodeAt(0) * 7) % 360 : 220;
  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, hsl(${hue},50%,18%), hsl(${(hue + 60) % 360},55%,22%))` }}
    >
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: `radial-gradient(circle at 20% 30%, hsla(${hue},80%,60%,0.4), transparent 50%), radial-gradient(circle at 80% 70%, hsla(${(hue + 80) % 360},70%,60%,0.3), transparent 50%)` }} />
      <span className="relative text-6xl font-bold font-display opacity-25 select-none text-white">
        {nombre?.charAt(0)?.toUpperCase() || '?'}
      </span>
    </div>
  );
}

function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function LocationIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function TrashIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
