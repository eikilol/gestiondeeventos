import { useEffect, useState } from 'react';
import { analyticsApi } from '../../../api/analytics.js';
import { useToast } from '../../../context/ToastContext.jsx';
import GLoader from '../../../components/ui/GLoader.jsx';

const RANGOS = [
  { dias: 7,   label: '7 días' },
  { dias: 30,  label: '30 días' },
  { dias: 90,  label: '90 días' },
];

const SOURCE_LABEL = {
  direct: 'Directo',
  search: 'Buscadores',
  social: 'Social',
  email : 'Email',
  otro  : 'Otro',
};

const SOURCE_COLOR = {
  direct: '#64748b',
  search: '#10B981',
  social: '#a855f7',
  email : '#10b981',
  otro  : '#f59e0b',
};

export default function AnalyticsTab({ evento }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(30);
  const { error: toastErr } = useToast();

  useEffect(() => {
    setLoading(true);
    analyticsApi.get(evento.id, dias)
      .then(setData)
      .catch(e => toastErr(e.message))
      .finally(() => setLoading(false));
    /* eslint-disable-next-line */
  }, [evento.id, dias]);

  if (loading) return <GLoader message="Calculando..." />;
  if (!data) return null;

  const r = data.resumen;
  const currency = evento.currency || 'COP';

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Analytics</h2>
          <p className="text-sm text-text-2 mt-1">Visitas a la página pública, conversión y ventas.</p>
        </div>
        <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-xl p-1">
          {RANGOS.map(opt => (
            <button key={opt.dias} onClick={() => setDias(opt.dias)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${dias === opt.dias ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Visitas"            value={r.visitas} hint={`${r.visitantes_unicos} únicos`} />
        <KpiCard label="Conversión"         value={`${r.conversion}%`} hint={`${r.tickets_total} tickets / ${r.visitantes_unicos} visitantes`} />
        <KpiCard label="Ingresos"           value={`$${Math.round(r.ingresos).toLocaleString('es-CO')}`} hint={currency} accent="success" />
        <KpiCard label="Tasa de asistencia" value={`${r.tasa_asistencia}%`} hint={`${r.asistencias} de ${r.tickets_pagados} pagados`} />
      </div>

      {/* Time series */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base font-semibold text-text-1">Visitas y tickets por día</h3>
          <p className="text-xs text-text-3">Últimos {dias} días</p>
        </div>
        <div className="card-body">
          <TimeSeries daily={data.daily} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Origen del tráfico */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold text-text-1">Origen del tráfico</h3>
            <p className="text-xs text-text-3">De dónde llegan los visitantes</p>
          </div>
          <div className="card-body">
            {data.sources.length === 0 ? (
              <Empty desc="Sin tráfico todavía en este rango." />
            ) : (
              <SourceBars sources={data.sources} />
            )}
          </div>
        </div>

        {/* Ventas por tipo */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold text-text-1">Ventas por tipo de boleta</h3>
            <p className="text-xs text-text-3">Distribución y revenue por tipo</p>
          </div>
          <div className="card-body">
            {data.ventas_por_tipo.length === 0 ? (
              <Empty desc="Sin ventas todavía." />
            ) : (
              <div className="space-y-2">
                {data.ventas_por_tipo.map(t => (
                  <div key={t.nombre} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-surface-2/40 border border-border">
                    <span className="text-sm text-text-1 truncate flex-1">{t.nombre}</span>
                    <span className="text-xs text-text-3 tabular-nums">{t.vendidos}</span>
                    <span className="text-sm font-semibold text-text-1 tabular-nums">${Math.round(t.ingresos).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top referrers */}
      {data.top_referrers.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold text-text-1">Top referrers</h3>
            <p className="text-xs text-text-3">Sitios que más tráfico envían</p>
          </div>
          <div className="card-body">
            <div className="space-y-1.5">
              {data.top_referrers.map(r => (
                <div key={r.host} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-surface-2/40 transition-colors">
                  <span className="text-sm text-text-2 truncate">{r.host}</span>
                  <span className="text-xs text-text-3 tabular-nums">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, hint, accent }) {
  return (
    <div className={`rounded-2xl border px-4 py-3.5 transition-all
      ${accent === 'success' ? 'border-success/30 bg-success/5' : 'border-border bg-surface/40'}`}>
      <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">{label}</p>
      <p className={`text-2xl font-bold font-display tabular-nums mt-1 leading-none ${accent === 'success' ? 'text-success-light' : 'text-text-1'}`}>{value}</p>
      {hint && <p className="text-[11px] text-text-3 mt-1.5">{hint}</p>}
    </div>
  );
}

function TimeSeries({ daily }) {
  const max = Math.max(1, ...daily.map(d => Math.max(d.visitas, d.tickets)));
  const points = daily.length;
  if (points === 0) return <Empty desc="Sin datos en el rango." />;

  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {daily.map((d, i) => {
          const hViews   = (d.visitas / max) * 100;
          const hTickets = (d.tickets / max) * 100;
          return (
            <div key={d.fecha} className="flex-1 flex flex-col-reverse items-center justify-end gap-0.5 group relative min-w-0">
              <div className="w-full flex items-end gap-0.5 h-full">
                <div className="flex-1 rounded-t-sm bg-primary/60 hover:bg-primary transition-all"
                  style={{ height: `${hViews}%`, minHeight: d.visitas > 0 ? '2px' : 0 }}
                  title={`${d.fecha}: ${d.visitas} visitas`}
                />
                <div className="flex-1 rounded-t-sm bg-success/60 hover:bg-success transition-all"
                  style={{ height: `${hTickets}%`, minHeight: d.tickets > 0 ? '2px' : 0 }}
                  title={`${d.fecha}: ${d.tickets} tickets`}
                />
              </div>
              {/* Tooltip simple */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-bg border border-border rounded-lg px-2 py-1 text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                <p className="text-text-3">{d.fecha}</p>
                <p className="text-primary-light">{d.visitas} visitas</p>
                <p className="text-success">{d.tickets} tickets</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-text-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary/60" /> Visitas
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-success/60" /> Tickets
          </span>
        </div>
        <div className="text-text-3 tabular-nums">
          {daily[0]?.fecha} → {daily[daily.length - 1]?.fecha}
        </div>
      </div>
    </div>
  );
}

function SourceBars({ sources }) {
  const total = sources.reduce((sum, s) => sum + s.count, 0);
  return (
    <div className="space-y-2.5">
      {sources.map(s => {
        const pct = (s.count / total) * 100;
        return (
          <div key={s.source}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-1">{SOURCE_LABEL[s.source] || s.source}</span>
              <span className="text-xs text-text-3 tabular-nums">{s.count} · {pct.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: SOURCE_COLOR[s.source] || '#64748b' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Empty({ desc }) {
  return <p className="text-sm text-text-3 text-center py-6">{desc}</p>;
}
