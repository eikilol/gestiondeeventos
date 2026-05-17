/* Catálogo de bloques.
   - SYSTEM blocks: contenido viene del evento (data solo guarda ajustes como oculto)
   - CUSTOM blocks: contenido vive en data del bloque
   Cada uno expone: label, icon, defaults, Editor, Preview, category. */

import { useState, useEffect } from 'react';
import ImagePicker from '../../../components/ui/ImagePicker.jsx';

/* ─────────── helpers ─────────── */

function Section({ title, children }) {
  return <div className="text-text-3 text-xs italic">[{title}]</div>;
}

function HiddenNotice({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/20 px-4 py-3 text-xs text-text-3 text-center">
      Bloque oculto: <strong>{label}</strong> · activa &quot;Mostrar&quot; para que aparezca en la página pública.
    </div>
  );
}

function VisibilityToggle({ data, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-text-2 cursor-pointer select-none">
      <input
        type="checkbox" checked={!data.oculto}
        onChange={e => onChange({ ...data, oculto: !e.target.checked })}
        className="w-3.5 h-3.5 rounded border-border bg-surface-2 accent-primary"
      />
      Mostrar en página pública
    </label>
  );
}

function fmtFecha(d, opts) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-CO', opts || { day: '2-digit', month: 'long', year: 'numeric' });
}
function fmtHora(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/* ============================================================
   SYSTEM BLOCKS — content from evento
   ============================================================ */

/* PORTADA — cover + galería en visor */
function PortadaPreview({ data, evento, isEditor }) {
  const urls = [];
  if (evento.cover_url) urls.push(evento.cover_url);
  for (const u of (evento.gallery || [])) if (!urls.includes(u)) urls.push(u);

  const [active, setActive] = useState(0);

  if (urls.length === 0) {
    if (!isEditor) return null;
    return (
      <div className="aspect-video rounded-3xl border border-dashed border-border bg-surface/20 flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-text-3">Sin portada · sube una desde Editar info administrativa</span>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-video rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-accent/10 to-bg overflow-hidden">
        <img src={urls[active]} alt={evento.titulo} className="w-full h-full object-cover" />
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {urls.map((u, i) => (
            <button key={u + i} onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all
                ${i === active ? 'border-primary scale-100 ring-2 ring-primary/30' : 'border-border opacity-70 hover:opacity-100 scale-95 hover:scale-100'}
              `}>
              <img src={u} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* TITULO — categoria + titulo grande */
function TituloPreview({ data, evento }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-2">
        {evento.categoria?.nombre || 'Evento'}
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1">{evento.titulo}</h1>
    </div>
  );
}

/* DESCRIPCION */
function DescripcionPreview({ data, evento, isEditor }) {
  if (!evento.descripcion) {
    if (!isEditor) return null;
    return <p className="text-sm text-text-3 italic">Sin descripción · agrégala en Editar info administrativa.</p>;
  }
  return <p className="text-base text-text-2 leading-relaxed">{evento.descripcion}</p>;
}

/* INFO — grid */
function InfoPreview({ data, evento }) {
  const fecha = evento.fecha_fin
    ? `${fmtFecha(evento.fecha_inicio)} — ${fmtFecha(evento.fecha_fin)}`
    : `${fmtFecha(evento.fecha_inicio)} · ${fmtHora(evento.fecha_inicio)}`;
  const modalidad = { fisico: 'Físico', virtual: 'Virtual', hibrido: 'Híbrido' }[evento.modalidad] || evento.modalidad;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {evento.fecha_inicio  && <InfoCell label="Fecha"     value={fecha} />}
      {evento.location_nombre && <InfoCell label="Lugar"   value={evento.location_nombre} />}
      <InfoCell label="Modalidad" value={modalidad} />
      {evento.organizador?.nombre && <InfoCell label="Organiza" value={evento.organizador.empresa || evento.organizador.nombre} />}
    </div>
  );
}
function InfoCell({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-text-3 mb-1">{label}</p>
      <p className="text-sm text-text-1 font-medium">{value}</p>
    </div>
  );
}

/* DIRECCION */
function DireccionPreview({ data, evento, isEditor }) {
  if (!evento.location_direccion) {
    if (!isEditor) return null;
    return <p className="text-sm text-text-3 italic">Sin dirección configurada.</p>;
  }
  return <p className="text-sm text-text-3">{evento.location_direccion}</p>;
}

/* LINKS */
function LinksPreview({ data, evento, isEditor }) {
  const links = evento.links || [];
  if (links.length === 0) {
    if (!isEditor) return null;
    return <p className="text-sm text-text-3 italic">Sin links configurados.</p>;
  }
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-3">Links del evento</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l, i) => (
          <a key={i} href={l.url} target="_blank" rel="noreferrer noopener"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-surface/40 hover:bg-surface hover:border-border-2 text-sm text-text-1 transition-all">
            <span className="text-xs uppercase tracking-wider text-text-3">{l.tipo}</span>
            <span className="truncate max-w-[200px]">{l.label || l.url.replace(/^https?:\/\//, '')}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* GALERIA DEL EVENTO — solo el gallery (sin cover) en grid */
function GaleriaEventoPreview({ data, evento, isEditor }) {
  const urls = evento.gallery || [];
  if (urls.length === 0) {
    if (!isEditor) return null;
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/20 px-4 py-6 text-center">
        <p className="text-sm text-text-2 font-medium">Sin galería configurada</p>
        <p className="text-xs text-text-3 mt-1">Sube imágenes desde Editar info administrativa → Imágenes.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-3">Galería del evento</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {urls.map((u, i) => (
          <a key={i} href={u} target="_blank" rel="noreferrer noopener"
            className="aspect-square rounded-2xl overflow-hidden border border-border hover:border-border-2 transition-all hover:scale-[1.02]">
            <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* TICKETS */
function TicketsPreview({ data, evento, onReservar, onWaitlist, isEditor }) {
  const tickets = (evento.tipos_ticket || []).filter(t => t.activo);
  if (tickets.length === 0) {
    if (!isEditor) return null;
    return (
      <div className="rounded-3xl border border-dashed border-border bg-surface/20 p-5">
        <p className="text-xs uppercase tracking-widest text-text-3 mb-2">Boletas</p>
        <p className="text-base font-medium text-text-2">Sin tipos de ticket configurados</p>
        <p className="text-xs text-text-3 mt-1">Crea tipos de boleta desde la tab Tickets.</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-border-2 bg-surface/60 p-5 space-y-3">
      <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">Boletas disponibles</p>
      {tickets.map(t => {
        const hasEarly = t.early_bird_precio != null && t.early_bird_hasta && new Date(t.early_bird_hasta) > new Date();
        const precio = hasEarly ? Number(t.early_bird_precio) : Number(t.precio);
        const isFree = precio === 0;
        const ventaCerr = t.venta_hasta && new Date(t.venta_hasta) < new Date();
        const agotado  = t.cupo != null && t.vendidos >= t.cupo;
        return (
          <div key={t.id} className="rounded-2xl border border-border bg-surface/50 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-text-1">{t.nombre}</p>
                  {hasEarly && !ventaCerr && <span className="text-[9px] uppercase tracking-widest text-warning font-semibold">Early</span>}
                </div>
                {t.descripcion && <p className="text-[11px] text-text-3 mt-0.5">{t.descripcion}</p>}
              </div>
            </div>
            <div className="flex items-end justify-between gap-3 mt-2">
              <div>
                {isFree
                  ? <p className="text-xl font-bold font-display text-text-1">Gratis</p>
                  : (
                    <div>
                      <p className="text-xl font-bold font-display text-text-1 tabular-nums leading-none">${precio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                      {hasEarly && <p className="text-[10px] text-text-3 line-through mt-0.5">${Number(t.precio).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>}
                      <p className="text-[10px] text-text-3 mt-0.5">{t.currency}</p>
                    </div>
                  )}
              </div>
              {agotado && !ventaCerr && onWaitlist ? (
                <button
                  onClick={() => onWaitlist(t)}
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 transition-all"
                >
                  Anotarme en lista
                </button>
              ) : (
                <button
                  disabled={agotado || ventaCerr}
                  onClick={onReservar ? () => onReservar(t) : undefined}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-text-1 text-bg hover:bg-white transition-all disabled:bg-surface-3 disabled:text-text-3 disabled:cursor-not-allowed"
                >
                  {agotado ? 'Agotado' : ventaCerr ? 'Cerrado' : isFree ? 'Reservar' : 'Comprar'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Editor genérico para bloques sistema: solo toggle de visibilidad + preview WYSIWYG */
function SystemEditor({ data, onChange, evento, Preview, label }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">Vista previa</p>
        <VisibilityToggle data={data} onChange={onChange} />
      </div>
      {data.oculto
        ? <HiddenNotice label={label} />
        : <div className="rounded-2xl border border-border bg-surface/20 p-5 pointer-events-none select-none opacity-90">
            <Preview data={data} evento={evento} isEditor />
          </div>}
    </div>
  );
}

/* ============================================================
   CUSTOM BLOCKS
   ============================================================ */

function TextoEditor({ data, onChange }) {
  return (
    <div>
      <input
        value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Título (opcional)"
        className="w-full bg-transparent text-2xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none mb-3"
      />
      <textarea
        value={data.texto || ''} onChange={e => onChange({ ...data, texto: e.target.value })}
        placeholder="Escribe tu contenido aquí. Párrafos separados por línea en blanco."
        rows={4}
        className="w-full bg-transparent text-base text-text-1 placeholder:text-text-3 outline-none resize-none leading-relaxed"
      />
    </div>
  );
}
function TextoPreview({ data }) {
  if (!data.titulo && !data.texto) return null;
  const ps = (data.texto || '').split(/\n\s*\n/).filter(Boolean);
  return (
    <div>
      {data.titulo && <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-1 mb-4">{data.titulo}</h2>}
      {ps.map((p, i) => <p key={i} className="text-base text-text-2 leading-relaxed mb-3">{p}</p>)}
    </div>
  );
}

function GaleriaEditor({ data, onChange, evento }) {
  const urls = Array.isArray(data.urls) ? data.urls : [];
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Título (opcional)"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      {urls.map((u, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">
            <ImagePicker
              value={u}
              onChange={v => onChange({ ...data, urls: urls.map((x, idx) => idx === i ? v : x) })}
              ownerId={evento?.owner_id}
              placeholder="URL o subir"
            />
          </div>
          <button onClick={() => onChange({ ...data, urls: urls.filter((_, idx) => idx !== i) })}
            className="w-9 h-9 rounded-xl text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">×</button>
        </div>
      ))}
      <button onClick={() => onChange({ ...data, urls: [...urls, ''] })}
        className="text-xs text-text-2 hover:text-text-1">+ Agregar imagen</button>
    </div>
  );
}
function GaleriaPreview({ data }) {
  const urls = (data.urls || []).filter(Boolean);
  if (urls.length === 0) return null;
  return (
    <div>
      {data.titulo && <h2 className="text-2xl font-bold font-display tracking-tight text-text-1 mb-4">{data.titulo}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {urls.map((u, i) => (
          <a key={i} href={u} target="_blank" rel="noreferrer noopener"
            className="aspect-square rounded-2xl overflow-hidden border border-border hover:border-border-2 transition-all hover:scale-[1.02]">
            <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
          </a>
        ))}
      </div>
    </div>
  );
}

function VideoEditor({ data, onChange }) {
  const embed = getEmbed(data.url);
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Título (opcional)"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      <input value={data.url || ''} onChange={e => onChange({ ...data, url: e.target.value })}
        placeholder="URL de YouTube o Vimeo" className="input rounded-xl py-2.5 text-sm" />
      {embed && <div className="aspect-video rounded-2xl overflow-hidden border border-border"><iframe src={embed} className="w-full h-full" allowFullScreen /></div>}
    </div>
  );
}
function VideoPreview({ data }) {
  const embed = getEmbed(data.url);
  if (!embed) return null;
  return (
    <div>
      {data.titulo && <h2 className="text-2xl font-bold font-display tracking-tight text-text-1 mb-4">{data.titulo}</h2>}
      <div className="aspect-video rounded-3xl overflow-hidden border border-border"><iframe src={embed} className="w-full h-full" allowFullScreen /></div>
    </div>
  );
}
function getEmbed(url) {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

function FAQEditor({ data, onChange }) {
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Preguntas frecuentes"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface/40 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <input value={it.q || ''} onChange={e => onChange({ ...data, items: items.map((x, idx) => idx === i ? { ...x, q: e.target.value } : x) })}
              placeholder="Pregunta" className="input rounded-xl py-2 text-sm font-medium flex-1" />
            <button onClick={() => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })}
              className="w-9 h-9 rounded-xl text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">×</button>
          </div>
          <textarea value={it.a || ''} onChange={e => onChange({ ...data, items: items.map((x, idx) => idx === i ? { ...x, a: e.target.value } : x) })}
            placeholder="Respuesta" rows={2} className="input rounded-xl py-2 text-sm resize-none" />
        </div>
      ))}
      <button onClick={() => onChange({ ...data, items: [...items, { q: '', a: '' }] })}
        className="text-xs text-text-2 hover:text-text-1">+ Agregar pregunta</button>
    </div>
  );
}
function FAQPreview({ data }) {
  const items = (data.items || []).filter(it => it.q?.trim());
  if (items.length === 0) return null;
  return (
    <div>
      {data.titulo && <h2 className="text-2xl font-bold font-display tracking-tight text-text-1 mb-4">{data.titulo}</h2>}
      <div className="space-y-2">
        {items.map((it, i) => <FAQItem key={i} q={it.q} a={it.a} />)}
      </div>
    </div>
  );
}
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full px-5 py-4 flex items-center justify-between text-left">
        <span className="text-sm font-medium text-text-1">{q}</span>
        <span className={`text-text-3 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      {open && a && <div className="px-5 pb-4 text-sm text-text-2 leading-relaxed animate-[fadeUp_0.2s_ease_both]">{a}</div>}
    </div>
  );
}

/* ============================================================
   ICONS
   ============================================================ */

const Ico = (path) => () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>;

const IconCover    = Ico('M4 16l4-4a3 3 0 014 0l4 4m0 0l2-2a3 3 0 014 0l2 2M14 7h.01M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z');
const IconTitulo   = Ico('M7 8h10M7 12h6M7 16h10');
const IconDesc     = Ico('M4 6h16M4 12h16M4 18h10');
const IconInfo     = Ico('M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
const IconDir      = Ico('M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z');
const IconLinks    = Ico('M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1');
const IconTickets  = Ico('M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z');
const IconTexto    = Ico('M4 6h16M4 12h16M4 18h10');
const IconGaleria  = Ico('M4 16l4-4a3 3 0 014 0l4 4m-2-2l1-1a3 3 0 014 0l2 2M14 7h.01M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z');
const IconVideo    = Ico('M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
const IconFAQ      = Ico('M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093V14m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
const IconHero     = Ico('M4 5a2 2 0 012-2h12a2 2 0 012 2v5H4V5zM4 13h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z');
const IconSpeakers = Ico('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z');
const IconSponsors = Ico('M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L23 12l-6.857 2.143L14 21l-2.143-6.857L5 12l6.857-2.143L14 3z');
const IconMapa     = Ico('M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7');
const IconCount    = Ico('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z');
const IconRedes    = Ico('M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z');
const IconCTA      = Ico('M9 5l7 7-7 7');
const IconSep      = Ico('M5 12h14');
const IconCita     = Ico('M7 8h10M7 12h10M7 16h6');

/* ============================================================
   CUSTOM BLOCKS — extra
   ============================================================ */

/* ─── HERO ─── */
function HeroEditor({ data, onChange, evento }) {
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Título grande del hero"
        className="w-full bg-transparent text-3xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      <input value={data.subtitulo || ''} onChange={e => onChange({ ...data, subtitulo: e.target.value })}
        placeholder="Subtítulo o claim"
        className="w-full bg-transparent text-base text-text-2 placeholder:text-text-3 outline-none" />
      <ImagePicker
        value={data.imagen}
        onChange={v => onChange({ ...data, imagen: v })}
        ownerId={evento?.owner_id}
        placeholder="URL imagen de fondo o sube una"
      />
      <div className="grid grid-cols-2 gap-2">
        <input value={data.cta_texto || ''} onChange={e => onChange({ ...data, cta_texto: e.target.value })}
          placeholder="Texto del botón (opcional)"
          className="input rounded-xl py-2 text-sm" />
        <input value={data.cta_url || ''} onChange={e => onChange({ ...data, cta_url: e.target.value })}
          placeholder="URL del botón"
          className="input rounded-xl py-2 text-sm" />
      </div>
    </div>
  );
}
function HeroPreview({ data }) {
  if (!data.titulo) return null;
  return (
    <div className="relative rounded-3xl overflow-hidden border border-border min-h-[320px] flex items-center px-8 py-12">
      {data.imagen && (
        <>
          <img src={data.imagen} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/70 to-transparent" />
        </>
      )}
      {!data.imagen && <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-bg" />}
      <div className="relative max-w-2xl">
        <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 leading-[1.05] mb-3">{data.titulo}</h2>
        {data.subtitulo && <p className="text-base sm:text-lg text-text-2 leading-relaxed mb-5">{data.subtitulo}</p>}
        {data.cta_texto && data.cta_url && (
          <a href={data.cta_url} target="_blank" rel="noreferrer noopener"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold transition-all hover:scale-[1.02]">
            {data.cta_texto} →
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── SPEAKERS ─── */
function SpeakersEditor({ data, onChange, evento }) {
  const items = Array.isArray(data.items) ? data.items : [];
  const update = (i, key, val) => onChange({ ...data, items: items.map((x, idx) => idx === i ? { ...x, [key]: val } : x) });
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Speakers"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface/40 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <ImagePicker value={it.foto} onChange={v => update(i, 'foto', v)} ownerId={evento?.owner_id} placeholder="Foto del speaker" />
            </div>
            <button onClick={() => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })}
              className="w-9 h-9 rounded-xl text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">×</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={it.nombre || ''} onChange={e => update(i, 'nombre', e.target.value)} placeholder="Nombre" className="input rounded-xl py-2 text-sm" />
            <input value={it.cargo || ''}  onChange={e => update(i, 'cargo', e.target.value)}  placeholder="Cargo / título" className="input rounded-xl py-2 text-sm" />
          </div>
          <input value={it.empresa || ''} onChange={e => update(i, 'empresa', e.target.value)} placeholder="Empresa (opcional)" className="input rounded-xl py-2 text-sm" />
          <textarea value={it.bio || ''} onChange={e => update(i, 'bio', e.target.value)} placeholder="Bio breve" rows={2} className="input rounded-xl py-2 text-sm resize-none" />
        </div>
      ))}
      <button onClick={() => onChange({ ...data, items: [...items, { nombre: '', cargo: '', empresa: '', foto: '', bio: '' }] })}
        className="text-xs text-text-2 hover:text-text-1">+ Agregar speaker</button>
    </div>
  );
}
function SpeakersPreview({ data }) {
  const items = (data.items || []).filter(it => it.nombre?.trim());
  if (items.length === 0) return null;
  return (
    <div>
      {data.titulo && <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-1 mb-5">{data.titulo}</h2>}
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((s, i) => (
          <div key={i} className="rounded-3xl border border-border bg-surface/40 p-5 flex items-start gap-4 hover:border-border-2 transition-all">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              {s.foto
                ? <img src={s.foto} alt={s.nombre} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-lg">{s.nombre?.charAt(0)?.toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text-1 truncate">{s.nombre}</p>
              {(s.cargo || s.empresa) && (
                <p className="text-xs text-text-3 mt-0.5 truncate">
                  {s.cargo}{s.cargo && s.empresa ? ' · ' : ''}{s.empresa}
                </p>
              )}
              {s.bio && <p className="text-xs text-text-2 mt-2 leading-relaxed line-clamp-3">{s.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PATROCINADORES ─── */
const TIERS = [
  { id: 'gold',   label: 'Gold',   className: 'h-20' },
  { id: 'silver', label: 'Silver', className: 'h-14' },
  { id: 'bronze', label: 'Bronze', className: 'h-10' },
];
function SponsorsEditor({ data, onChange, evento }) {
  const items = Array.isArray(data.items) ? data.items : [];
  const update = (i, key, val) => onChange({ ...data, items: items.map((x, idx) => idx === i ? { ...x, [key]: val } : x) });
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Patrocinadores"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface/40 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ImagePicker value={it.logo} onChange={v => update(i, 'logo', v)} ownerId={evento?.owner_id} placeholder="Logo del patrocinador" />
            </div>
            <button onClick={() => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })}
              className="w-9 h-9 rounded-xl text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">×</button>
          </div>
          <div className="grid grid-cols-[1fr_120px_1fr] gap-2">
            <input value={it.nombre || ''} onChange={e => update(i, 'nombre', e.target.value)} placeholder="Nombre" className="input rounded-xl py-2 text-sm" />
            <select value={it.tier || 'silver'} onChange={e => update(i, 'tier', e.target.value)} className="input bg-surface-2 rounded-xl py-2 text-sm">
              {TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input value={it.url || ''} onChange={e => update(i, 'url', e.target.value)} placeholder="URL (opcional)" className="input rounded-xl py-2 text-sm" />
          </div>
        </div>
      ))}
      <button onClick={() => onChange({ ...data, items: [...items, { nombre: '', logo: '', tier: 'silver', url: '' }] })}
        className="text-xs text-text-2 hover:text-text-1">+ Agregar patrocinador</button>
    </div>
  );
}
function SponsorsPreview({ data }) {
  const items = (data.items || []).filter(it => it.logo || it.nombre);
  if (items.length === 0) return null;
  const grouped = TIERS.map(t => ({ ...t, items: items.filter(it => (it.tier || 'silver') === t.id) })).filter(g => g.items.length > 0);
  return (
    <div>
      {data.titulo && <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-1 mb-5 text-center">{data.titulo}</h2>}
      <div className="space-y-6">
        {grouped.map(g => (
          <div key={g.id}>
            <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold text-center mb-3">{g.label}</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {g.items.map((s, i) => {
                const inner = s.logo
                  ? <img src={s.logo} alt={s.nombre} className={`${g.className} max-w-[160px] object-contain opacity-80 hover:opacity-100 transition-opacity`} />
                  : <span className="text-sm text-text-2">{s.nombre}</span>;
                return s.url
                  ? <a key={i} href={s.url} target="_blank" rel="noreferrer noopener">{inner}</a>
                  : <div key={i}>{inner}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAPA ─── */
function MapaEditor({ data, onChange, evento }) {
  const direccion = data.direccion || evento?.location_direccion || evento?.location_nombre || '';
  const embedSrc = direccion ? `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed` : null;
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Cómo llegar"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      <input value={data.direccion || ''} onChange={e => onChange({ ...data, direccion: e.target.value })}
        placeholder={`Dirección o lugar (default: ${evento?.location_direccion || evento?.location_nombre || 'sin dirección'})`}
        className="input rounded-xl py-2 text-sm" />
      {embedSrc && (
        <div className="aspect-video rounded-2xl overflow-hidden border border-border">
          <iframe src={embedSrc} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      )}
    </div>
  );
}
function MapaPreview({ data, evento }) {
  const direccion = data.direccion || evento?.location_direccion || evento?.location_nombre;
  if (!direccion) return null;
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;
  const linkSrc  = `https://www.google.com/maps?q=${encodeURIComponent(direccion)}`;
  return (
    <div>
      {data.titulo && <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-1 mb-4">{data.titulo}</h2>}
      <div className="rounded-3xl overflow-hidden border border-border mb-3 aspect-video">
        <iframe src={embedSrc} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mapa" />
      </div>
      <a href={linkSrc} target="_blank" rel="noreferrer noopener"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/40 hover:bg-surface text-sm text-text-1 transition-all">
        Cómo llegar →
      </a>
    </div>
  );
}

/* ─── COUNTDOWN ─── */
function CountdownEditor({ data, onChange, evento }) {
  const target = data.fecha || evento?.fecha_inicio || '';
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Faltan..."
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      <div className="text-xs text-text-3">
        {data.fecha
          ? <>Fecha personalizada: <span className="font-mono">{new Date(data.fecha).toLocaleString('es-CO')}</span></>
          : <>Cuenta atrás hacia la fecha del evento: <span className="font-mono">{evento?.fecha_inicio ? new Date(evento.fecha_inicio).toLocaleString('es-CO') : 'sin fecha'}</span></>}
      </div>
      <input
        type="datetime-local"
        value={data.fecha ? toLocalInput(data.fecha) : ''}
        onChange={e => onChange({ ...data, fecha: e.target.value ? new Date(e.target.value).toISOString() : null })}
        placeholder="Sobrescribir fecha (opcional)"
        className="input bg-surface-2 rounded-xl py-2 text-sm"
      />
      {data.fecha && (
        <button type="button" onClick={() => onChange({ ...data, fecha: null })} className="text-xs text-text-3 hover:text-text-1">Volver a usar la fecha del evento</button>
      )}
      {target && <CountdownDisplay target={target} />}
    </div>
  );
}
function CountdownPreview({ data, evento }) {
  const target = data.fecha || evento?.fecha_inicio;
  if (!target) return null;
  return (
    <div className="text-center py-4">
      {data.titulo && <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-3">{data.titulo}</p>}
      <CountdownDisplay target={target} large />
    </div>
  );
}
function CountdownDisplay({ target, large }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const cells = [
    { label: 'días', value: d },
    { label: 'h', value: h },
    { label: 'min', value: m },
    { label: 'seg', value: s },
  ];
  if (diff === 0) return <p className="text-2xl font-bold font-display text-text-1">¡Ahora!</p>;
  return (
    <div className={`inline-flex items-center gap-2 ${large ? 'sm:gap-4' : ''}`}>
      {cells.map(c => (
        <div key={c.label} className={`rounded-2xl border border-border bg-surface/40 ${large ? 'min-w-[80px] sm:min-w-[110px] py-4' : 'min-w-[60px] py-3'}`}>
          <p className={`font-bold font-display text-text-1 tabular-nums leading-none ${large ? 'text-4xl sm:text-5xl' : 'text-2xl'}`}>{String(c.value).padStart(2, '0')}</p>
          <p className="text-[10px] uppercase tracking-widest text-text-3 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─── REDES (custom) ─── */
const RED_PRESETS = [
  ['instagram','Instagram'], ['tiktok','TikTok'], ['x','X / Twitter'],
  ['facebook','Facebook'], ['youtube','YouTube'], ['linkedin','LinkedIn'],
  ['web','Web'], ['whatsapp','WhatsApp'], ['custom','Otro'],
];
function RedesEditor({ data, onChange }) {
  const items = Array.isArray(data.items) ? data.items : [];
  const update = (i, key, val) => onChange({ ...data, items: items.map((x, idx) => idx === i ? { ...x, [key]: val } : x) });
  return (
    <div className="space-y-3">
      <input value={data.titulo || ''} onChange={e => onChange({ ...data, titulo: e.target.value })}
        placeholder="Síguenos en redes"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
          <select value={it.tipo || 'instagram'} onChange={e => update(i, 'tipo', e.target.value)}
            className="input bg-surface-2 rounded-xl py-2 text-sm">
            {RED_PRESETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input value={it.url || ''} onChange={e => update(i, 'url', e.target.value)}
            placeholder="https://..." className="input rounded-xl py-2 text-sm" />
          <button onClick={() => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })}
            className="w-9 h-9 rounded-xl text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">×</button>
        </div>
      ))}
      <button onClick={() => onChange({ ...data, items: [...items, { tipo: 'instagram', url: '' }] })}
        className="text-xs text-text-2 hover:text-text-1">+ Agregar red social</button>
    </div>
  );
}
function RedesPreview({ data }) {
  const items = (data.items || []).filter(it => it.url?.trim());
  if (items.length === 0) return null;
  return (
    <div className="text-center">
      {data.titulo && <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-1 mb-5">{data.titulo}</h2>}
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((l, i) => (
          <a key={i} href={l.url} target="_blank" rel="noreferrer noopener"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-surface/40 hover:bg-surface hover:border-border-2 text-sm text-text-1 transition-all hover:scale-[1.02]">
            <span className="text-xs uppercase tracking-wider text-text-3">{l.tipo}</span>
            <span className="truncate max-w-[200px]">{l.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── CTA ─── */
function CTAEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <input value={data.texto || ''} onChange={e => onChange({ ...data, texto: e.target.value })}
        placeholder="Texto del botón"
        className="w-full bg-transparent text-xl font-bold font-display text-text-1 placeholder:text-text-3 outline-none" />
      <input value={data.url || ''} onChange={e => onChange({ ...data, url: e.target.value })}
        placeholder="URL destino"
        className="input rounded-xl py-2 text-sm" />
      <select value={data.estilo || 'primary'} onChange={e => onChange({ ...data, estilo: e.target.value })}
        className="input bg-surface-2 rounded-xl py-2 text-sm w-auto">
        <option value="primary">Principal (sólido)</option>
        <option value="secondary">Secundario (borde)</option>
        <option value="ghost">Discreto (texto)</option>
      </select>
    </div>
  );
}
function CTAPreview({ data }) {
  if (!data.texto || !data.url) return null;
  const cls = data.estilo === 'secondary'
    ? 'border border-border-2 text-text-1 hover:bg-surface-2'
    : data.estilo === 'ghost'
      ? 'text-text-1 hover:text-primary-light'
      : 'bg-text-1 text-bg hover:bg-white shadow-[0_0_30px_rgba(241,245,249,0.2)]';
  return (
    <div className="text-center py-2">
      <a href={data.url} target="_blank" rel="noreferrer noopener"
        className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${cls}`}>
        {data.texto} →
      </a>
    </div>
  );
}

/* ─── SEPARADOR ─── */
function SeparadorEditor({ data, onChange }) {
  return (
    <div className="space-y-2">
      <select value={data.estilo || 'linea'} onChange={e => onChange({ ...data, estilo: e.target.value })}
        className="input bg-surface-2 rounded-xl py-2 text-sm w-auto">
        <option value="linea">Línea fina</option>
        <option value="puntos">Puntos centrados</option>
        <option value="espacio">Espacio en blanco</option>
      </select>
      <div className="py-6"><SeparadorPreview data={data} /></div>
    </div>
  );
}
function SeparadorPreview({ data }) {
  const e = data.estilo || 'linea';
  if (e === 'puntos') return <div className="text-center text-text-3 tracking-widest text-2xl">· · ·</div>;
  if (e === 'espacio') return <div className="h-12" />;
  return <div className="h-px bg-border max-w-md mx-auto" />;
}

/* ─── CITA ─── */
function CitaEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <textarea value={data.texto || ''} onChange={e => onChange({ ...data, texto: e.target.value })}
        placeholder="Una cita inspiradora, testimonio, o destacado..."
        rows={3}
        className="w-full bg-transparent text-xl font-display text-text-1 placeholder:text-text-3 outline-none resize-none italic leading-snug" />
      <input value={data.autor || ''} onChange={e => onChange({ ...data, autor: e.target.value })}
        placeholder="— Autor"
        className="w-full bg-transparent text-sm text-text-2 placeholder:text-text-3 outline-none" />
    </div>
  );
}
function CitaPreview({ data }) {
  if (!data.texto?.trim()) return null;
  return (
    <blockquote className="border-l-2 border-text-1 pl-6 py-2 max-w-2xl mx-auto">
      <p className="text-xl sm:text-2xl font-display text-text-1 italic leading-snug mb-3">"{data.texto}"</p>
      {data.autor && <footer className="text-sm text-text-3">— {data.autor}</footer>}
    </blockquote>
  );
}

/* ============================================================
   REGISTRY
   ============================================================ */

export const BLOCKS = {
  /* SYSTEM */
  portada: {
    label: 'Portada', category: 'sistema', icon: IconCover,
    defaults: {},
    Preview: PortadaPreview,
    Editor: (props) => <SystemEditor {...props} Preview={PortadaPreview} label="Portada" />,
  },
  galeria_evento: {
    label: 'Galería del evento', category: 'sistema', icon: IconGaleria,
    defaults: {},
    Preview: GaleriaEventoPreview,
    Editor: (props) => <SystemEditor {...props} Preview={GaleriaEventoPreview} label="Galería del evento" />,
  },
  titulo: {
    label: 'Título del evento', category: 'sistema', icon: IconTitulo,
    defaults: {},
    Preview: TituloPreview,
    Editor: (props) => <SystemEditor {...props} Preview={TituloPreview} label="Título" />,
  },
  descripcion: {
    label: 'Descripción', category: 'sistema', icon: IconDesc,
    defaults: {},
    Preview: DescripcionPreview,
    Editor: (props) => <SystemEditor {...props} Preview={DescripcionPreview} label="Descripción" />,
  },
  info: {
    label: 'Información (fecha, lugar...)', category: 'sistema', icon: IconInfo,
    defaults: {},
    Preview: InfoPreview,
    Editor: (props) => <SystemEditor {...props} Preview={InfoPreview} label="Info" />,
  },
  direccion: {
    label: 'Dirección', category: 'sistema', icon: IconDir,
    defaults: {},
    Preview: DireccionPreview,
    Editor: (props) => <SystemEditor {...props} Preview={DireccionPreview} label="Dirección" />,
  },
  links: {
    label: 'Links / redes sociales', category: 'sistema', icon: IconLinks,
    defaults: {},
    Preview: LinksPreview,
    Editor: (props) => <SystemEditor {...props} Preview={LinksPreview} label="Links" />,
  },
  tickets: {
    label: 'Boletas / tickets', category: 'sistema', icon: IconTickets,
    defaults: {},
    Preview: TicketsPreview,
    Editor: (props) => <SystemEditor {...props} Preview={TicketsPreview} label="Tickets" />,
  },

  /* CUSTOM */
  hero: {
    label: 'Hero / banner', category: 'custom', icon: IconHero,
    defaults: { titulo: 'Bienvenido al evento', subtitulo: '', imagen: '', cta_texto: '', cta_url: '' },
    Editor: HeroEditor, Preview: HeroPreview,
  },
  texto: {
    label: 'Texto', category: 'custom', icon: IconTexto,
    defaults: { titulo: '', texto: '' },
    Editor: TextoEditor, Preview: TextoPreview,
  },
  speakers: {
    label: 'Speakers / ponentes', category: 'custom', icon: IconSpeakers,
    defaults: { titulo: 'Speakers', items: [{ nombre: '', cargo: '', empresa: '', foto: '', bio: '' }] },
    Editor: SpeakersEditor, Preview: SpeakersPreview,
  },
  sponsors: {
    label: 'Patrocinadores', category: 'custom', icon: IconSponsors,
    defaults: { titulo: 'Patrocinadores', items: [] },
    Editor: SponsorsEditor, Preview: SponsorsPreview,
  },
  mapa: {
    label: 'Mapa', category: 'custom', icon: IconMapa,
    defaults: { titulo: 'Cómo llegar', direccion: '' },
    Editor: MapaEditor, Preview: MapaPreview,
  },
  countdown: {
    label: 'Countdown', category: 'custom', icon: IconCount,
    defaults: { titulo: 'Faltan', fecha: null },
    Editor: CountdownEditor, Preview: CountdownPreview,
  },
  galeria: {
    label: 'Galería custom', category: 'custom', icon: IconGaleria,
    defaults: { titulo: '', urls: [] },
    Editor: GaleriaEditor, Preview: GaleriaPreview,
  },
  video: {
    label: 'Video', category: 'custom', icon: IconVideo,
    defaults: { titulo: '', url: '' },
    Editor: VideoEditor, Preview: VideoPreview,
  },
  redes: {
    label: 'Redes sociales', category: 'custom', icon: IconRedes,
    defaults: { titulo: 'Síguenos', items: [{ tipo: 'instagram', url: '' }] },
    Editor: RedesEditor, Preview: RedesPreview,
  },
  faq: {
    label: 'FAQ', category: 'custom', icon: IconFAQ,
    defaults: { titulo: 'Preguntas frecuentes', items: [{ q: '', a: '' }] },
    Editor: FAQEditor, Preview: FAQPreview,
  },
  cta: {
    label: 'Botón CTA', category: 'custom', icon: IconCTA,
    defaults: { texto: 'Inscríbete', url: '', estilo: 'primary' },
    Editor: CTAEditor, Preview: CTAPreview,
  },
  cita: {
    label: 'Cita / testimonio', category: 'custom', icon: IconCita,
    defaults: { texto: '', autor: '' },
    Editor: CitaEditor, Preview: CitaPreview,
  },
  separador: {
    label: 'Separador', category: 'custom', icon: IconSep,
    defaults: { estilo: 'linea' },
    Editor: SeparadorEditor, Preview: SeparadorPreview,
  },
};

export const BLOCK_TYPES_SISTEMA = Object.keys(BLOCKS).filter(k => BLOCKS[k].category === 'sistema');
export const BLOCK_TYPES_CUSTOM  = Object.keys(BLOCKS).filter(k => BLOCKS[k].category === 'custom');
