/* Tab Ranking — clasificación del equipo del evento por puntos. */

import { useEffect, useState } from 'react';
import { loyaltyApi } from '../../../api/loyalty.js';
import GLoader from '../../../components/ui/GLoader.jsx';

export default function RankingTab({ evento }) {
  const [ranking, setRanking] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    loyaltyApi.rankingEvento(evento.id)
      .then(d => setRanking(d.ranking || []))
      .catch(e => setErr(e.message));
  }, [evento.id]);

  if (err) return (
    <div className="rounded-3xl border border-border bg-surface/40 px-6 py-12 text-center text-text-2">{err}</div>
  );
  if (ranking === null) return <GLoader message="Cargando ranking..." />;

  const medalla = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Ranking del equipo</h2>
        <p className="text-sm text-text-2 mt-1">
          Puntos que tu equipo acumula en este evento (tareas, check-ins, gestión).
        </p>
      </div>

      {ranking.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface/40 px-6 py-14 text-center">
          <p className="text-text-2">Todavía no hay puntos. A medida que el equipo complete tareas y
            haga check-ins, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface/40 divide-y divide-border">
          {ranking.map((r, i) => (
            <div key={r.user_id}
              className={`flex items-center gap-3 px-4 py-3 ${r.es_yo ? 'bg-primary/10' : ''}`}>
              <span className="w-9 text-center text-sm font-bold text-text-2">{medalla(i)}</span>
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-primary flex items-center
                              justify-center flex-shrink-0">
                {r.avatar_url
                  ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-white text-sm font-semibold">
                      {(r.nombre || 'U').charAt(0).toUpperCase()}
                    </span>}
              </div>
              <span className="flex-1 min-w-0 truncate text-sm text-text-1">
                {r.nombre}{r.es_yo && <span className="text-xs text-primary-light ml-1.5">(vos)</span>}
              </span>
              <span className="text-lg font-bold font-display text-primary-light tabular-nums">
                {Number(r.puntos || 0).toLocaleString('es-CO')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
