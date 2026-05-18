import { useEffect, useMemo, useState } from 'react';
import { confirmDialog } from '../../../components/ui/Confirm.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { agendaApi } from '../../../api/agenda.js';
import ImagePicker from '../../../components/ui/ImagePicker.jsx';
import GLoader from '../../../components/ui/GLoader.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';

/* Tab Agenda — sesiones + speakers.
   Sesiones tienen 3 vistas: Lista / Semana / Mes. */

const DOW_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIA_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

export default function AgendaTab({ evento }) {
  const { usuario } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState('sessions'); // sessions | speakers
  const [subView,  setSubView]  = useState('lista');    // lista | semana | mes
  const [cursor,   setCursor]   = useState(() => startOfMonth(new Date()));
  const [creating, setCreating] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);
  const [editing,  setEditing]  = useState(null);
  const { success, error: toastErr } = useToast();

  const reload = async () => {
    setLoading(true);
    try {
      const [s, sp] = await Promise.all([
        agendaApi.sessions(evento.id),
        agendaApi.speakers(evento.id),
      ]);
      setSessions(s.sessions || []);
      setSpeakers(sp.speakers || []);
    } catch (e) { toastErr(e.message); }
    finally    { setLoading(false); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [evento.id]);

  /* Index de sesiones por día para Mes/Semana */
  const sessionsByDay = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!s.inicio) continue;
      const k = ymd(new Date(s.inicio));
      (map[k] = map[k] || []).push(s);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    }
    return map;
  }, [sessions]);

  const nudge = (delta) => {
    const d = new Date(cursor);
    if (subView === 'mes') { d.setMonth(d.getMonth() + delta); setCursor(startOfMonth(d)); }
    else if (subView === 'dia') { d.setDate(d.getDate() + delta); setCursor(startOfDay(d)); }
    else { d.setDate(d.getDate() + delta * 7); setCursor(startOfWeek(d)); }
  };
  const goHoy = () => setCursor(
    subView === 'mes' ? startOfMonth(new Date())
    : subView === 'dia' ? startOfDay(new Date())
    : startOfWeek(new Date())
  );

  const openCreate = (date = null) => {
    setPrefillDate(date);
    setEditing(null);
    setCreating(true);
  };

  if (loading) return <GLoader message="Cargando agenda..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Agenda</h2>
          <p className="text-sm text-text-2 mt-1">Sesiones del evento y speakers asignados.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-xl p-1">
            {[['sessions', 'Sesiones'], ['speakers', 'Speakers']].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === k ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => openCreate()} className="btn-gradient btn-sm">
            <PlusIcon className="w-3.5 h-3.5" />
            {view === 'sessions' ? 'Nueva sesión' : 'Nuevo speaker'}
          </button>
        </div>
      </div>

      {/* Switcher de vista (solo en sesiones) */}
      {view === 'sessions' && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-xl p-1">
            {[['lista', 'Lista'], ['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map(([k, l]) => (
              <button key={k}
                onClick={() => {
                  setSubView(k);
                  if (k === 'mes') setCursor(startOfMonth(cursor));
                  else if (k === 'semana') setCursor(startOfWeek(cursor));
                  else if (k === 'dia') setCursor(startOfDay(new Date()));
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${subView === k ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}>
                {l}
              </button>
            ))}
          </div>

          {subView !== 'lista' && (
            <div className="flex items-center gap-2">
              <button onClick={() => nudge(-1)} aria-label="Anterior"
                className="w-8 h-8 rounded-lg text-text-2 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center transition-colors">
                <ChevL />
              </button>
              <h3 className="text-base font-bold font-display tracking-tight text-text-1 min-w-[180px] text-center" key={cursor.toISOString()}>
                {subView === 'mes'
                  ? `${MES_LARGO[cursor.getMonth()]} ${cursor.getFullYear()}`
                  : subView === 'dia'
                  ? `${DIA_SEMANA[(cursor.getDay()+6)%7]} ${cursor.getDate()} ${MES_LARGO[cursor.getMonth()].toLowerCase()}`
                  : `${dmy(cursor)} — ${dmy(addDays(cursor, 6))}`}
              </h3>
              <button onClick={() => nudge(1)} aria-label="Siguiente"
                className="w-8 h-8 rounded-lg text-text-2 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center transition-colors">
                <ChevR />
              </button>
              <button onClick={goHoy} className="ml-1 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-2 hover:border-border-2 text-sm font-medium transition-all">
                Hoy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form de creación */}
      {creating && view === 'sessions' && (
        <SessionForm
          speakers={speakers}
          prefillDate={prefillDate}
          onCancel={() => { setCreating(false); setPrefillDate(null); }}
          onSave={async (payload) => {
            try {
              await agendaApi.crearSession(evento.id, payload);
              success('Sesión creada.');
              setCreating(false);
              setPrefillDate(null);
              reload();
            } catch (e) { toastErr(e.message); }
          }}
        />
      )}

      {creating && view === 'speakers' && (
        <SpeakerForm
          ownerId={usuario?.id}
          onCancel={() => setCreating(false)}
          onSave={async (payload) => {
            try {
              await agendaApi.crearSpeaker(evento.id, payload);
              success('Speaker agregado.');
              setCreating(false);
              reload();
            } catch (e) { toastErr(e.message); }
          }}
        />
      )}

      {/* Sesiones — vistas */}
      {view === 'sessions' && subView === 'lista' && (
        sessions.length === 0
          ? <EmptyState title="Sin sesiones" desc="Crea tu primera sesión con título, hora y opcionalmente un speaker." />
          : <SessionsList
              sessions={sessions}
              editing={editing}
              speakers={speakers}
              onEdit={setEditing}
              onSave={async (id, payload) => {
                try { await agendaApi.editarSession(evento.id, id, payload); success('Sesión actualizada.'); setEditing(null); reload(); }
                catch (e) { toastErr(e.message); }
              }}
              onDelete={async (s) => {
                if (!(await confirmDialog({ message:(`¿Borrar "${s.titulo}"?`), danger:true }))) return;
                try { await agendaApi.borrarSession(evento.id, s.id); success('Sesión borrada.'); reload(); }
                catch (e) { toastErr(e.message); }
              }}
            />
      )}

      {view === 'sessions' && subView === 'dia' && (
        <DiaTimeline
          cursor={cursor}
          sesiones={sessionsByDay[ymd(cursor)] || []}
          onCrearAt={(date) => openCreate(date)}
          onEditar={(s) => { setSubView('lista'); setEditing(s.id); }}
          onDelete={async (s) => {
            if (!(await confirmDialog({ message:(`¿Borrar "${s.titulo}"?`), danger:true }))) return;
            try { await agendaApi.borrarSession(evento.id, s.id); success('Sesión borrada.'); reload(); }
            catch (e) { toastErr(e.message); }
          }}
        />
      )}

      {view === 'sessions' && subView === 'semana' && (
        <SemanaGrid cursor={cursor} sessionsByDay={sessionsByDay} onPickDay={openCreate} />
      )}

      {view === 'sessions' && subView === 'mes' && (
        <MesGrid cursor={cursor} sessionsByDay={sessionsByDay} onPickDay={openCreate} />
      )}

      {/* Speakers */}
      {view === 'speakers' && (
        speakers.length === 0
          ? <EmptyState title="Sin speakers" desc="Agrega speakers para luego asignarlos a sesiones." />
          : <SpeakersList
              speakers={speakers}
              ownerId={usuario?.id}
              editing={editing}
              onEdit={setEditing}
              onSave={async (id, payload) => {
                try { await agendaApi.editarSpeaker(evento.id, id, payload); success('Speaker actualizado.'); setEditing(null); reload(); }
                catch (e) { toastErr(e.message); }
              }}
              onDelete={async (s) => {
                if (!(await confirmDialog({ message:(`¿Borrar a "${s.nombre}"?`), danger:true }))) return;
                try { await agendaApi.borrarSpeaker(evento.id, s.id); success('Speaker borrado.'); reload(); }
                catch (e) { toastErr(e.message); }
              }}
            />
      )}
    </div>
  );
}

/* ─────────── Vista Lista ─────────── */

function SessionsList({ sessions, editing, speakers, onEdit, onSave, onDelete }) {
  const grupos = sessions.reduce((acc, s) => {
    const d = new Date(s.inicio).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    (acc[d] = acc[d] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grupos).map(([dia, items]) => (
        <div key={dia}>
          <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-3">{dia}</p>
          <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
            {items.map((s, i) => editing === s.id
              ? <SessionForm key={s.id} initial={s} speakers={speakers} onCancel={() => onEdit(null)} onSave={(p) => onSave(s.id, p)} />
              : <SessionRow key={s.id} session={s} onEdit={() => onEdit(s.id)} onDelete={() => onDelete(s)} isLast={i === items.length - 1} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionRow({ session, onEdit, onDelete, isLast }) {
  const hi = new Date(session.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const hf = session.fin ? new Date(session.fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <div className={`flex items-start gap-4 px-5 py-4 ${!isLast ? 'border-b border-border' : ''} hover:bg-surface-2/30 transition-colors group`}>
      <div className="text-text-1 font-display font-bold tabular-nums text-base w-20 flex-shrink-0 leading-tight">
        {hi}
        {hf && <span className="block text-xs text-text-3 font-sans font-normal mt-0.5">— {hf}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-text-1">{session.titulo}</h3>
          {session.track && session.track !== 'principal' && (
            <span className="text-xs uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{session.track}</span>
          )}
        </div>
        {session.descripcion && <p className="text-sm text-text-2 mt-1 leading-relaxed">{session.descripcion}</p>}
        <div className="flex items-center gap-3 mt-2 text-sm text-text-3 flex-wrap">
          {session.ubicacion && <span className="inline-flex items-center gap-1">📍 {session.ubicacion}</span>}
          {session.speaker && (
            <span className="inline-flex items-center gap-2">
              {session.speaker.foto_url
                ? <img src={session.speaker.foto_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                : <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold">{session.speaker.nombre.charAt(0)}</span>}
              <span>{session.speaker.nombre}{session.speaker.empresa ? ` · ${session.speaker.empresa}` : ''}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} aria-label="Editar"
          className="w-8 h-8 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
          <EditIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} aria-label="Borrar"
          className="w-8 h-8 rounded-lg text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─────────── Vista Mes ─────────── */

function MesGrid({ cursor, sessionsByDay, onPickDay }) {
  const first  = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start  = addDays(first, -offset);
  const days   = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const today  = ymd(new Date());

  return (
    <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden animate-[fadeUp_0.35s_ease_both]">
      <div className="grid grid-cols-7 border-b border-border bg-surface-2/30">
        {DOW_SHORT.map(d => (
          <div key={d} className="px-3 py-2 text-xs uppercase tracking-widest text-text-3 font-semibold text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((d) => {
          const key = ymd(d);
          const items = sessionsByDay[key] || [];
          const isOther = d.getMonth() !== cursor.getMonth();
          const isToday = key === today;
          return (
            <button key={key} onClick={() => onPickDay(d)}
              className={`min-h-[110px] flex flex-col items-stretch text-left p-2 border-r border-b border-border last:border-r-0 transition-all hover:bg-surface-2/40 group
                ${isOther ? 'opacity-40' : ''}`}>
              <span className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full mb-1 mr-auto transition-all
                ${isToday ? 'bg-text-1 text-bg shadow-glow-sm' : 'text-text-1'}`}>
                {d.getDate()}
              </span>
              <div className="space-y-1 flex-1 overflow-hidden">
                {items.slice(0, 3).map(s => <SessionChip key={s.id} session={s} />)}
                {items.length > 3 && (
                  <span className="text-xs text-text-3 px-1.5">+{items.length - 3} más</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Vista Semana ─────────── */

function SemanaGrid({ cursor, sessionsByDay, onPickDay }) {
  const days  = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
  const today = ymd(new Date());
  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 animate-[fadeUp_0.35s_ease_both]">
      {days.map(d => {
        const key = ymd(d);
        const items = sessionsByDay[key] || [];
        const isToday = key === today;
        return (
          <button key={key} onClick={() => onPickDay(d)}
            className={`rounded-3xl border bg-surface/40 hover:bg-surface/60 transition-all min-h-[200px] flex flex-col text-left p-3 group
              ${isToday ? 'border-primary/50 shadow-glow-sm' : 'border-border hover:border-border-2'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-text-3 font-semibold">{DOW_SHORT[(d.getDay()+6)%7]}</span>
              <span className={`text-2xl font-bold font-display tabular-nums ${isToday ? 'text-primary-light' : 'text-text-1'}`}>{d.getDate()}</span>
            </div>
            <div className="space-y-1 flex-1 overflow-hidden">
              {items.length === 0
                ? <span className="text-xs text-text-3">Sin sesiones</span>
                : items.slice(0, 5).map(s => <SessionChip key={s.id} session={s} detailed />)}
              {items.length > 5 && (
                <span className="text-xs text-text-3 px-1.5">+{items.length - 5} más</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* Vista DÍA — timeline por horas para planear el desarrollo del evento. */
function DiaTimeline({ cursor, sesiones, onCrearAt, onEditar, onDelete }) {
  const horas = sesiones
    .map(s => new Date(s.inicio).getHours())
    .filter(h => Number.isFinite(h));
  const minH = Math.min(8, ...(horas.length ? horas : [8]));
  const maxFin = sesiones
    .map(s => new Date(s.fin || s.inicio).getHours() + (s.fin ? 1 : 1))
    .filter(h => Number.isFinite(h));
  const maxH = Math.max(20, ...(maxFin.length ? maxFin : [20]));
  const rango = [];
  for (let h = minH; h <= Math.min(23, maxH); h++) rango.push(h);

  const porHora = {};
  for (const s of sesiones) {
    const h = new Date(s.inicio).getHours();
    (porHora[h] = porHora[h] || []).push(s);
  }
  const ahora = new Date();
  const esHoy = ymd(ahora) === ymd(cursor);

  return (
    <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <p className="text-sm font-semibold text-text-1">
          {DIA_SEMANA[(cursor.getDay()+6)%7]} {cursor.getDate()} de {MES_LARGO[cursor.getMonth()].toLowerCase()}
        </p>
        <span className="text-xs text-text-3">
          {sesiones.length} {sesiones.length === 1 ? 'sesión' : 'sesiones'}
        </span>
      </div>

      <div className="divide-y divide-border">
        {rango.map(h => {
          const items = (porHora[h] || []).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
          const esHoraActual = esHoy && ahora.getHours() === h;
          return (
            <div key={h} className="flex group/h">
              <div className={`w-16 flex-shrink-0 px-3 py-3 text-right text-xs font-mono tabular-nums
                ${esHoraActual ? 'text-primary-light font-bold' : 'text-text-3'}`}>
                {pad(h)}:00
              </div>
              <div className="flex-1 border-l border-border px-3 py-2 min-h-[3.25rem] relative">
                {esHoraActual && (
                  <span className="absolute -left-px top-0 bottom-0 w-0.5 bg-primary" />
                )}
                {items.length === 0 ? (
                  <button
                    onClick={() => onCrearAt(withDefaultTime(cursor, h, 0))}
                    className="opacity-0 group-hover/h:opacity-100 transition-opacity
                               text-xs text-text-3 hover:text-primary-light flex items-center gap-1 py-1.5"
                  >
                    <PlusIcon className="w-3 h-3" /> Agregar a las {pad(h)}:00
                  </button>
                ) : (
                  <div className="space-y-2">
                    {items.map(s => {
                      const ini = new Date(s.inicio);
                      const fin = s.fin ? new Date(s.fin) : null;
                      const rango2 = ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                        + (fin ? ` – ${fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : '');
                      return (
                        <div key={s.id}
                          className="group/s rounded-xl border border-primary/25 bg-primary/10
                                     px-3.5 py-2.5 flex items-start gap-3 hover:border-primary/45 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono tabular-nums text-primary-light">{rango2}</span>
                              {s.track && s.track !== 'principal' && (
                                <span className="text-[10px] uppercase tracking-wide text-text-3
                                                 bg-surface-2 border border-border rounded px-1.5 py-0.5">
                                  {s.track}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-text-1 mt-0.5 truncate">{s.titulo}</p>
                            {(s.speaker?.nombre || s.ubicacion) && (
                              <p className="text-xs text-text-3 mt-0.5 truncate">
                                {s.speaker?.nombre}{s.speaker?.nombre && s.ubicacion ? ' · ' : ''}{s.ubicacion}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/s:opacity-100 transition-opacity">
                            <button onClick={() => onEditar(s)} aria-label="Editar"
                              className="w-7 h-7 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2
                                         flex items-center justify-center">
                              <EditIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDelete(s)} aria-label="Borrar"
                              className="w-7 h-7 rounded-lg text-text-3 hover:text-danger hover:bg-danger/10
                                         flex items-center justify-center">
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionChip({ session, detailed }) {
  const hi = new Date(session.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return (
    <span className="block truncate rounded-md bg-primary/15 border border-primary/20 text-primary-light text-xs px-1.5 py-0.5 hover:bg-primary/25 transition-colors">
      <span className="font-mono mr-1 opacity-70">{hi}</span>
      {session.titulo}
      {detailed && session.ubicacion && <span className="opacity-60"> · {session.ubicacion}</span>}
    </span>
  );
}

/* ─────────── Form sesión ─────────── */

function SessionForm({ initial, speakers, prefillDate, onSave, onCancel }) {
  const [form, setForm] = useState({
    titulo     : initial?.titulo || '',
    descripcion: initial?.descripcion || '',
    inicio     : initial?.inicio ? toLocalInput(initial.inicio) : (prefillDate ? toLocalInput(withDefaultTime(prefillDate, 9, 0)) : ''),
    fin        : initial?.fin    ? toLocalInput(initial.fin)    : '',
    track      : initial?.track || 'principal',
    ubicacion  : initial?.ubicacion || '',
    speaker_id : initial?.speaker_id || '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.inicio) return;
    setSaving(true);
    await onSave({
      titulo     : form.titulo,
      descripcion: form.descripcion || null,
      inicio     : new Date(form.inicio).toISOString(),
      fin        : form.fin ? new Date(form.fin).toISOString() : null,
      track      : form.track,
      ubicacion  : form.ubicacion || null,
      speaker_id : form.speaker_id || null,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-primary/25 bg-surface/40 p-5 space-y-3 animate-[fadeUp_0.3s_ease_both]">
      <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">{initial ? 'Editar sesión' : 'Nueva sesión'}</p>
      <input value={form.titulo} onChange={e => setForm(f => ({...f, titulo: e.target.value}))}
        placeholder="Título" required autoFocus
        className="input rounded-2xl py-3 text-base font-medium" />
      <textarea value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))}
        placeholder="Descripción (opcional)" rows={2}
        className="input rounded-2xl py-3 text-base resize-none" />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="field">
          <label className="label">Inicio *</label>
          <input type="datetime-local" value={form.inicio} onChange={e => setForm(f => ({...f, inicio: e.target.value}))}
            required className="input bg-surface-2 rounded-2xl py-3 text-base" />
        </div>
        <div className="field">
          <label className="label">Fin (opcional)</label>
          <input type="datetime-local" value={form.fin} onChange={e => setForm(f => ({...f, fin: e.target.value}))}
            className="input bg-surface-2 rounded-2xl py-3 text-base" />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="field">
          <label className="label">Track</label>
          <input value={form.track} onChange={e => setForm(f => ({...f, track: e.target.value}))}
            placeholder="principal" className="input rounded-2xl py-3 text-base" />
        </div>
        <div className="field">
          <label className="label">Ubicación / sala</label>
          <input value={form.ubicacion} onChange={e => setForm(f => ({...f, ubicacion: e.target.value}))}
            placeholder="Auditorio A" className="input rounded-2xl py-3 text-base" />
        </div>
        <div className="field">
          <label className="label">Speaker</label>
          <select value={form.speaker_id} onChange={e => setForm(f => ({...f, speaker_id: e.target.value}))}
            className="input bg-surface-2 rounded-2xl py-3 text-base">
            <option value="">Sin speaker</option>
            {speakers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost btn-sm">Cancelar</button>
        <button type="submit" disabled={saving || !form.titulo.trim() || !form.inicio} className="btn-primary btn-sm">
          {saving ? <><Spinner size="sm" /> Guardando...</> : (initial ? 'Guardar' : 'Crear sesión')}
        </button>
      </div>
    </form>
  );
}

/* ─────────── Speakers ─────────── */

function SpeakersList({ speakers, ownerId, editing, onEdit, onSave, onDelete }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {speakers.map(s => editing === s.id
        ? <div key={s.id} className="sm:col-span-2"><SpeakerForm ownerId={ownerId} initial={s} onCancel={() => onEdit(null)} onSave={(p) => onSave(s.id, p)} /></div>
        : <SpeakerCard key={s.id} speaker={s} onEdit={() => onEdit(s.id)} onDelete={() => onDelete(s)} />
      )}
    </div>
  );
}

function SpeakerCard({ speaker, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 flex items-start gap-4 group hover:border-border-2 transition-all">
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
        {speaker.foto_url
          ? <img src={speaker.foto_url} alt={speaker.nombre} className="w-full h-full object-cover" />
          : <span className="text-white font-bold text-base">{speaker.nombre.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-text-1 truncate">{speaker.nombre}</p>
        {speaker.empresa && <p className="text-xs text-text-3 truncate mt-0.5">{speaker.empresa}</p>}
        {speaker.bio && <p className="text-sm text-text-2 mt-1.5 leading-relaxed line-clamp-3">{speaker.bio}</p>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} aria-label="Editar"
          className="w-7 h-7 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
          <EditIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} aria-label="Borrar"
          className="w-7 h-7 rounded-lg text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function SpeakerForm({ initial, ownerId, onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre  : initial?.nombre  || '',
    empresa : initial?.empresa || '',
    bio     : initial?.bio     || '',
    foto_url: initial?.foto_url || '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-primary/25 bg-surface/40 p-5 space-y-3 animate-[fadeUp_0.3s_ease_both]">
      <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">{initial ? 'Editar speaker' : 'Nuevo speaker'}</p>
      <div className="field">
        <label className="label">Foto</label>
        <ImagePicker value={form.foto_url} onChange={url => setForm(f => ({...f, foto_url: url}))} ownerId={ownerId} placeholder="URL o subir foto" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
          placeholder="Nombre completo" required autoFocus
          className="input rounded-2xl py-3 text-base font-medium" />
        <input value={form.empresa} onChange={e => setForm(f => ({...f, empresa: e.target.value}))}
          placeholder="Cargo / empresa (opcional)" className="input rounded-2xl py-3 text-base" />
      </div>
      <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))}
        placeholder="Bio breve" rows={3} className="input rounded-2xl py-3 text-base resize-none" />
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost btn-sm">Cancelar</button>
        <button type="submit" disabled={saving || !form.nombre.trim()} className="btn-primary btn-sm">
          {saving ? 'Guardando...' : (initial ? 'Guardar' : 'Crear speaker')}
        </button>
      </div>
    </form>
  );
}

function EmptyState({ title, desc }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <h2 className="text-xl font-bold font-display text-text-1 mb-2">{title}</h2>
      <p className="text-sm text-text-2 max-w-sm mx-auto">{desc}</p>
    </div>
  );
}

/* ─────────── helpers ─────────── */
function toLocalInput(iso) {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function withDefaultTime(date, h, m) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}
function startOfDay(d)   { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfWeek(d)  { const x = new Date(d); const off = (x.getDay()+6)%7; x.setDate(x.getDate()-off); x.setHours(0,0,0,0); return x; }
function addDays(d, n)   { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function pad(n) { return String(n).padStart(2,'0'); }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function dmy(d) { return `${pad(d.getDate())} ${MES_LARGO[d.getMonth()].slice(0,3).toLowerCase()}`; }

function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function EditIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function TrashIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function ChevL() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>; }
function ChevR() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>; }
