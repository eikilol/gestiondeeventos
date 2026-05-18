import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { eventosApi } from '../api/eventos.js';
import { solicitudesApi } from '../api/solicitudes.js';
import { EstadoBadge, ModalidadBadge } from '../components/ui/Badge.jsx';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ total: 0, publicados: 0, borradores: 0, asistentes: 0 });
  const [sugerencias, setSugerencias] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    solicitudesApi.misSolicitudes()
      .then(d => {
        const map = (r) => ({
          titulo: r.titulo || r.contenido?.slice(0, 60) || '(sin texto)',
          subtitulo: `${r.evento_titulo} · ${r.autor?.nombre || 'Miembro'} · ${r.estado}`,
        });
        const all = d.solicitudes || [];
        setSugerencias(all.filter(r => r.tipo === 'sugerencia').slice(0, 6).map(map));
        setSolicitudes(all.filter(r => r.tipo !== 'sugerencia').slice(0, 6).map(map));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    eventosApi.list({ limit: 50 })
      .then(data => {
        const list = data.eventos || [];
        setEventos(list.slice(0, 6));
        setStats({
          total      : data.total || list.length,
          publicados : list.filter(e => e.estado === 'publicado').length,
          borradores : list.filter(e => e.estado === 'borrador').length,
          asistentes : list.reduce((s, e) => s + (e.aforo_vendido || 0), 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hora    = new Date().getHours();
  const saludo  = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const nombre  = usuario?.nombre?.split(' ')[0] || 'Usuario';

  return (
    <div className="space-y-10 animate-[fadeUp_0.4s_ease_both]">
      {/* SALUDO */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-text-2 text-base mb-1.5">{saludo},</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-text-1 tracking-tight leading-[1.05]">{nombre}.</h1>
          <p className="text-base text-text-2 mt-3 max-w-md leading-relaxed">
            Aquí está el resumen de tus eventos.
          </p>
        </div>
        <Link to="/eventos/nuevo" className="btn-gradient hidden sm:inline-flex">
          <PlusIcon className="w-4 h-4" />
          Crear evento
        </Link>
      </header>

      {/* TABLERO: izquierda (eventos) + derecha (stats 2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* IZQUIERDA — Registro de eventos */}
        <section className="lg:col-span-8 rounded-3xl border border-border bg-surface/40 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">Registro</p>
              <h2 className="text-xl font-bold font-display text-text-1 mt-0.5">Eventos recientes</h2>
            </div>
            <Link to="/eventos" className="text-sm text-text-2 hover:text-text-1 transition-colors">Ver todos →</Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-2 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-44 bg-surface-2 rounded animate-pulse" />
                    <div className="h-2.5 w-28 bg-surface-2 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : eventos.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="text-base text-text-2 mb-4">Aún no hay eventos.</p>
              <Link to="/eventos/nuevo" className="btn-primary inline-flex">Crear primero</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {eventos.map((ev, i) => (
                <Link
                  key={ev.id}
                  to={`/eventos/${ev.id}`}
                  className="flex items-center gap-3.5 px-6 py-4 hover:bg-surface-2/40 transition-colors group animate-[fadeUp_0.35s_ease_both]"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-surface-2 border border-border flex items-center justify-center">
                    {(ev.cover_url || ev.gallery?.[0])
                      ? <img src={ev.cover_url || ev.gallery[0]} alt="" className="w-full h-full object-cover" />
                      : <span className="text-base font-semibold text-text-2 font-display">{ev.titulo?.charAt(0)?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-text-1 truncate group-hover:text-primary-light transition-colors">{ev.titulo}</p>
                    <p className="text-xs text-text-3 mt-0.5">
                      {ev.fecha_inicio
                        ? new Date(ev.fecha_inicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Sin fecha'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ModalidadBadge modalidad={ev.modalidad} />
                    <EstadoBadge estado={ev.estado} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* DERECHA — Stats compactas 2x2 */}
        <section className="lg:col-span-4 grid grid-cols-2 gap-3 self-start">
          <StatCard label="Total"       value={stats.total}      loading={loading} hint="eventos" />
          <StatCard label="Publicados"  value={stats.publicados} loading={loading} accent />
          <StatCard label="Borradores"  value={stats.borradores} loading={loading} muted />
          <StatCard label="Asistentes"  value={stats.asistentes} loading={loading} hint="acumulado" />
        </section>
      </div>

      {/* SUGERENCIAS + SOLICITUDES + STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <FeedSection
          className="lg:col-span-5"
          eyebrow="Tu staff"
          title="Sugerencias del equipo"
          empty="Cuando tu staff agregue sugerencias en sus eventos, aparecerán aquí."
          icon={LightbulbIcon}
          items={sugerencias}
        />
        <FeedSection
          className="lg:col-span-5"
          eyebrow="Tus asistentes"
          title="Solicitudes y mensajes"
          empty="Aquí llegan solicitudes, mensajes y reportes de tu equipo."
          icon={InboxIcon}
          items={solicitudes}
        />
        <section className="lg:col-span-2 rounded-3xl border border-border bg-surface/40 px-5 py-5 flex flex-col">
          <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-3">Estado</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <p className="text-sm font-semibold text-text-1">Operativo</p>
          </div>
          <div className="space-y-2 text-sm mt-auto">
            <SystemDot label="API"  ok />
            <SystemDot label="DB"   ok />
            <SystemDot label="Auth" ok />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading, hint, accent, muted }) {
  return (
    <div className={`rounded-2xl border bg-surface/40 px-5 py-5 flex flex-col gap-3 transition-all duration-200 hover:bg-surface/60 hover:-translate-y-0.5 hover:border-border-2
      ${accent ? 'border-primary/25' : 'border-border'}
    `}>
      <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">{label}</p>
      {loading
        ? <div className="h-9 w-16 bg-surface-2 rounded animate-pulse" />
        : <p className={`text-4xl font-bold font-display tabular-nums leading-none ${muted ? 'text-text-2' : 'text-text-1'}`}>{value}</p>
      }
      {hint && <p className="text-[11px] text-text-3 lowercase tracking-wide">{hint}</p>}
    </div>
  );
}

function FeedSection({ className, eyebrow, title, empty, icon: Icon, items = [] }) {
  return (
    <section className={`rounded-3xl border border-border bg-surface/40 overflow-hidden flex flex-col ${className}`}>
      <div className="px-6 py-5 border-b border-border">
        <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">{eyebrow}</p>
        <h2 className="text-xl font-bold font-display text-text-1 mt-0.5">{title}</h2>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 px-6 py-10 flex flex-col items-center justify-center text-center min-h-[180px]">
          <div className="w-11 h-11 rounded-2xl bg-surface border border-border flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-text-3" />
          </div>
          <p className="text-sm text-text-2 leading-relaxed max-w-xs">{empty}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it, i) => (
            <li key={i} className="px-6 py-4 hover:bg-surface-2/40 transition-colors">
              <p className="text-sm text-text-1 font-medium">{it.titulo}</p>
              <p className="text-xs text-text-3 mt-0.5">{it.subtitulo}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SystemDot({ label, ok }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-2 text-sm">{label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-success' : 'bg-danger'}`} />
    </div>
  );
}

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function LightbulbIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}
function InboxIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 007.586 13H4" /></svg>;
}
