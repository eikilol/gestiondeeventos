import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { eventosApi } from '../../api/eventos.js';
import { pagosApi }   from '../../api/pagos.js';
import { BLOCKS } from '../events/editor/blocks.jsx';
import { BrandingProvider, BrandHeader, PoweredBy } from '../../components/public/Branding.jsx';
import Turnstile, { turnstileActivo } from '../../components/public/Turnstile.jsx';
import { useT } from '../../lib/i18n.js';

/* Página pública de un evento.
   Renderiza los bloques de page_json.pages[N].blocks dinámicamente.
   Navegación entre páginas con tabs al final. */

export default function EventoPublicoPage() {
  const { slug } = useParams();
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const [evento,  setEvento]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [reservaTipo, setReservaTipo] = useState(null);
  const [reservaOk,   setReservaOk]   = useState(null);
  const [waitlistTipo, setWaitlistTipo] = useState(null);

  useEffect(() => {
    setLoading(true);
    eventosApi.publicoBySlug(slug)
      .then(d => setEvento(d.evento))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const pages = useMemo(() => {
    if (!evento) return [];
    const pj = evento.page_json;
    if (pj?.pages?.length) return pj.pages;
    if (Array.isArray(pj?.blocks)) return [{ id: 'inicio', nombre: 'Inicio', blocks: pj.blocks }];
    return [{ id: 'inicio', nombre: 'Inicio', blocks: [] }];
  }, [evento]);

  const pageIdx = (() => {
    const p = Number(params.get('p') || 1);
    return Math.max(1, Math.min(pages.length, p));
  })();
  const activePage = pages[pageIdx - 1];

  if (loading) return (
    <section className="px-5 sm:px-8 py-12 max-w-5xl mx-auto">
      <div className="h-64 rounded-3xl bg-surface/40 border border-border animate-pulse" />
    </section>
  );

  if (error || !evento) return (
    <section className="px-5 sm:px-8 py-20 max-w-3xl mx-auto text-center">
      <p className="text-xs uppercase tracking-widest text-danger mb-3">Evento no encontrado</p>
      <h1 className="text-3xl font-bold font-display tracking-tight text-text-1 mb-4">
        {t('evento.no_encontrado_titulo')}
      </h1>
      <Link to="/explorar" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-2 text-sm hover:bg-surface">
        {t('evento.volver_explorar')}
      </Link>
    </section>
  );

  return (
    <BrandingProvider organizador={evento.organizador}>
    <section className="px-5 sm:px-8 py-8 sm:py-12 max-w-5xl mx-auto">
      {/* Barra superior: volver + marca del organizador */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <Link to="/explorar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border
                     text-sm text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Explorar eventos
        </Link>
        <BrandHeader organizador={evento.organizador} />
      </div>

      {/* Bloques */}
      <div className="space-y-8 max-w-3xl mx-auto" key={activePage?.id}>
        {(activePage?.blocks || []).map(block => {
          if (block.data?.oculto) return null;
          const B = BLOCKS[block.type];
          if (!B) return null;
          const Preview = B.Preview;
          return (
            <div key={block.id} className="animate-[fadeUp_0.4s_ease_both]">
              <Preview data={block.data || {}} evento={evento} onReservar={setReservaTipo} onWaitlist={setWaitlistTipo} />
            </div>
          );
        })}
      </div>

      {/* Page tabs al final */}
      {pages.length > 1 && (
        <nav className="mt-16 pt-8 border-t border-border flex items-center justify-center gap-1.5">
          {pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setParams(prev => { const x = new URLSearchParams(prev); x.set('p', String(i + 1)); return x; })}
              className={`min-w-[40px] h-10 px-4 rounded-full text-sm font-medium transition-all
                ${pageIdx === i + 1
                  ? 'bg-text-1 text-bg'
                  : 'border border-border text-text-2 hover:text-text-1 hover:bg-surface-2'}
              `}
              aria-current={pageIdx === i + 1 ? 'page' : undefined}
            >
              <span className="hidden sm:inline mr-1.5">{i + 1}.</span>
              {p.nombre}
            </button>
          ))}
        </nav>
      )}

      {/* Volver a explorar */}
      <div className="mt-12 text-center">
        <Link to="/explorar" className="text-xs text-text-3 hover:text-text-1 transition-colors">
          ← Volver a explorar
        </Link>
        <PoweredBy organizador={evento.organizador} />
      </div>

      {/* Modales */}
      {reservaTipo && (
        <ReservaModal
          tipo={reservaTipo}
          slug={slug}
          currency={evento.currency}
          evento={evento}
          onClose={() => setReservaTipo(null)}
          onSuccess={(t) => { setReservaTipo(null); setReservaOk(t); }}
        />
      )}
      {reservaOk && (
        <ConfirmacionModal ticket={reservaOk} onClose={() => setReservaOk(null)} />
      )}
      {waitlistTipo && (
        <WaitlistModal
          tipo={waitlistTipo}
          slug={slug}
          onClose={() => setWaitlistTipo(null)}
        />
      )}
    </section>
    </BrandingProvider>
  );
}

/* ─────────── Modal lista de espera ─────────── */

function WaitlistModal({ tipo, slug, onClose }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' });
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(null); // { posicion }
  const [err, setErr] = useState('');
  const [captcha, setCaptcha] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (turnstileActivo && !captcha) { setErr('Completá la verificación anti-bot.'); return; }
    setWorking(true); setErr('');
    try {
      const { waitlistApi } = await import('../../api/waitlist.js');
      const r = await waitlistApi.join(slug, {
        ticket_type_id: tipo.id,
        nombre: form.nombre, email: form.email,
        captcha_token: captcha,
      });
      setDone({ posicion: r.entry?.posicion });
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally { setWorking(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      {done ? (
        <div className="text-center py-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warning/15 border border-warning/30 mb-5">
            <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight mb-2">¡Estás en la lista!</h2>
          <p className="text-sm text-text-2 mb-5 leading-relaxed max-w-sm mx-auto">
            Sos el <strong className="text-text-1">#{done.posicion}</strong> en la lista de espera de <strong className="text-text-1">{tipo.nombre}</strong>. Si se libera un cupo, el organizador te contactará por email.
          </p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold transition-all">
            Entendido
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-2">Lista de espera</p>
            <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">{tipo.nombre}</h2>
            <p className="text-sm text-text-2 mt-2 leading-relaxed">
              Este tipo de boleta está agotado. Anotate y te avisamos si se libera un cupo.
            </p>
          </div>
          {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}
          <div className="field">
            <label className="label">Nombre completo *</label>
            <input required value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
              className="input rounded-2xl py-3 text-base" placeholder="Tu nombre" autoFocus />
          </div>
          <div className="field">
            <label className="label">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
              className="input rounded-2xl py-3 text-base" placeholder="tu@email.com" />
          </div>
          <div className="field">
            <label className="label">Teléfono <span className="lowercase tracking-normal font-normal text-text-3">(opcional)</span></label>
            <input value={form.telefono} onChange={e => setForm(f => ({...f, telefono: e.target.value}))}
              className="input rounded-2xl py-3 text-base" placeholder="300 000 0000" />
          </div>
          <Turnstile onToken={setCaptcha} />
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-full text-sm text-text-2 hover:text-text-1">Cancelar</button>
            <button type="submit" disabled={working}
              className="px-5 py-2.5 rounded-full bg-warning/90 text-bg hover:bg-warning text-sm font-semibold disabled:opacity-60 transition-all">
              {working ? 'Anotando...' : 'Anotarme en la lista'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

/* ─────────── Modales de reserva (sin cambios) ─────────── */

function ReservaModal({ tipo, slug, currency, evento, onClose, onSuccess }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' });
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState('');
  const [captcha, setCaptcha] = useState(null);

  const hasEarly = tipo.early_bird_precio != null && tipo.early_bird_hasta && new Date(tipo.early_bird_hasta) > new Date();
  const precio = hasEarly ? Number(tipo.early_bird_precio) : Number(tipo.precio);
  const isFree = precio === 0;
  const tienePagoSimple = Boolean(evento?.pago_llave || evento?.pago_qr_url);

  const submit = async (e) => {
    e.preventDefault();
    if (turnstileActivo && !captcha) { setErr('Completá la verificación anti-bot.'); return; }
    setWorking(true); setErr('');
    try {
      if (isFree || tienePagoSimple) {
        const res = await eventosApi.reservar(slug, {
          ticket_type_id: tipo.id,
          nombre: form.nombre, email: form.email, telefono: form.telefono,
          captcha_token: captcha,
        });
        onSuccess({ ...res.ticket, requierePago: !isFree, tipo, pagoSimple: tienePagoSimple && !isFree });
      } else {
        const res = await pagosApi.comprar(slug, {
          ticket_type_id: tipo.id,
          nombre: form.nombre, email: form.email, telefono: form.telefono,
          captcha_token: captcha,
        });
        const url = res.checkout?.init_point || res.checkout?.sandbox_init_point;
        if (!url) throw new Error('Mercado Pago no devolvió el link de pago.');
        window.location.href = url;
      }
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally    { setWorking(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-3 font-semibold mb-2">
            {isFree ? 'Reserva tu cupo' : 'Compra tu boleta'}
          </p>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">{tipo.nombre}</h2>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold font-display text-text-1 tabular-nums">
              {isFree ? 'Gratis' : `$${precio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
            </p>
            {!isFree && <span className="text-xs text-text-3">{tipo.currency || currency}</span>}
          </div>
        </div>
        {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}
        <div className="field">
          <label className="label">Nombre completo *</label>
          <input required value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
            className="input rounded-2xl py-3 text-base" placeholder="Tu nombre" autoFocus />
        </div>
        <div className="field">
          <label className="label">Email *</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
            className="input rounded-2xl py-3 text-base" placeholder="tu@email.com" />
        </div>
        <div className="field">
          <label className="label">Teléfono <span className="lowercase tracking-normal font-normal text-text-3">(opcional)</span></label>
          <input value={form.telefono} onChange={e => setForm(f => ({...f, telefono: e.target.value}))}
            className="input rounded-2xl py-3 text-base" placeholder="300 000 0000" />
        </div>
        {!isFree && tienePagoSimple && (
          <div className="rounded-2xl bg-warning/10 border border-warning/25 px-4 py-3 text-xs text-text-2 leading-relaxed space-y-2">
            <p className="font-semibold text-warning-light">Pago manual vía Mercado Pago</p>
            {evento.pago_llave && (
              <p>Pagá <strong className="text-text-1">${precio.toLocaleString('es-CO')} {tipo.currency || currency}</strong> a la llave/alias <span className="font-mono text-text-1">{evento.pago_llave}</span> en tu app de MP.</p>
            )}
            {evento.pago_qr_url && (
              <div className="mt-2">
                <p className="mb-2">Escaneá este QR desde tu app de MP:</p>
                <img src={evento.pago_qr_url} alt="QR Mercado Pago" className="w-40 h-40 rounded-xl bg-white object-contain mx-auto p-2" />
              </div>
            )}
            {evento.pago_instrucciones && (
              <p className="text-text-3 mt-1">{evento.pago_instrucciones}</p>
            )}
            <p className="text-text-3 mt-2 pt-2 border-t border-warning/15">
              Al continuar, tu boleta queda <strong className="text-text-1">reservada</strong> pero pendiente de confirmación. El organizador la valida cuando reciba el pago.
            </p>
          </div>
        )}
        {!isFree && !tienePagoSimple && (
          <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3 text-xs text-text-2 leading-relaxed">
            Al continuar serás redirigido a <strong className="text-text-1">Mercado Pago</strong> para completar el pago de forma segura. Al volver verás tu boleta con QR.
          </div>
        )}
        <Turnstile onToken={setCaptcha} />
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-full text-sm text-text-2 hover:text-text-1">Cancelar</button>
          <button type="submit" disabled={working}
            className="px-5 py-2.5 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold disabled:opacity-60 transition-all">
            {working
              ? (isFree ? 'Reservando...' : (tienePagoSimple ? 'Reservando...' : 'Redirigiendo a MP...'))
              : (isFree ? 'Confirmar reserva' : (tienePagoSimple ? 'Apartar boleta' : 'Pagar con Mercado Pago'))}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmacionModal({ ticket, onClose }) {
  const qrValue = ticket.qr_token || ticket.codigo;
  return (
    <ModalShell onClose={onClose}>
      <div className="text-center py-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/15 border border-success/30 mb-5">
          <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight mb-2">
          {ticket.requierePago ? '¡Boleta apartada!' : '¡Reserva confirmada!'}
        </h2>
        <p className="text-sm text-text-2 mb-5 leading-relaxed max-w-sm mx-auto">
          Muestra este QR en la entrada del evento. También puedes mostrar el código.
        </p>

        {/* QR */}
        <div className="bg-white rounded-2xl p-4 inline-block mb-4">
          <QRCodeSVG value={qrValue} size={180} level="M" includeMargin={false} />
        </div>

        <div className="rounded-2xl border border-border-2 bg-surface px-4 py-3 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold mb-1">Código alternativo</p>
          <p className="font-mono text-xl font-bold text-text-1 tabular-nums tracking-widest">{ticket.codigo}</p>
        </div>

        <p className="text-xs text-text-3 mb-5">
          Guarda este link para volver a verlo: <br/>
          <a href={`/mi-ticket/${ticket.codigo}`} className="text-primary-light hover:underline">
            {window.location.origin}/mi-ticket/{ticket.codigo}
          </a>
        </p>

        <button onClick={onClose} className="px-6 py-3 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold transition-all">
          Listo
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-[fadeIn_0.2s_ease_both]" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl border border-border-2 bg-surface shadow-2xl p-6 animate-[authCardIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Cerrar"
          className="absolute top-3 right-3 w-9 h-9 rounded-xl text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
