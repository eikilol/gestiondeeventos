import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventosApi } from '../../api/eventos.js';

export default function ExplorarPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    eventosApi.publicos({ limit: 24 })
      .then(d => setEventos(d.eventos || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <section className="px-5 sm:px-8 py-12 max-w-6xl mx-auto">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-3">Explorar</p>
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 mb-3">
          Eventos públicos
        </h1>
        <p className="text-base text-text-2 max-w-xl">
          Descubre qué se está organizando con GESTEK ahora mismo. Reserva tu cupo o compra tu boleta
          desde la página pública de cada evento.
        </p>
      </header>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 rounded-3xl border border-border bg-surface/40 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-sm text-danger py-12">{error}</p>
      ) : eventos.length === 0 ? (
        <p className="mt-10 text-center text-sm text-text-3">
          Aún no hay eventos públicos. Vuelve pronto.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map(ev => (
            <Link
              key={ev.id}
              to={`/explorar/${ev.slug}`}
              className="group rounded-3xl border border-border bg-surface/40 hover:bg-surface/60 hover:border-border-2 transition-all overflow-hidden flex flex-col"
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-bg flex items-center justify-center border-b border-border overflow-hidden">
                {(ev.cover_url || ev.gallery?.[0])
                  ? <img src={ev.cover_url || ev.gallery[0]} alt={ev.titulo} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  : <span className="text-xs font-medium text-text-3 uppercase tracking-widest">{ev.categoria?.nombre || 'Evento'}</span>}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-base font-semibold text-text-1 mb-2 group-hover:text-primary-light transition-colors line-clamp-2">
                  {ev.titulo}
                </h3>
                <p className="text-xs text-text-2 mb-4">
                  {fmt(ev.fecha_inicio)}{ev.location_nombre ? ` · ${ev.location_nombre}` : ''}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-text-3">
                    {ev.organizador?.empresa || ev.organizador?.nombre || '—'}
                  </span>
                  <span className="text-xs text-primary-light group-hover:translate-x-0.5 transition-transform">Ver →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
