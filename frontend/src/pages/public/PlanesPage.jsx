import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { pagosApi } from '../../api/pagos.js';

const PLANS = [
  {
    name: 'Free',
    tagline: 'Todo lo esencial para operar eventos profesionales. Sin tarjeta de crédito, sin límite artificial.',
    price: { monthly: 0, annual: 0 },
    cta: { label: 'Empezar gratis', to: '/register', primary: true },
    badge: null,
    features: [
      'Eventos ilimitados',
      'Asistentes ilimitados',
      'Página pública por evento (subpath gestek.io/tu-marca)',
      'QR de check-in y check-out',
      'Recordatorios por email (T-7d, T-1d, T-1h)',
      'Notificaciones de eventos in-app',
      'Gamificación: puntos, badges, ranking',
      'Pasarela BRE-B (tu llave o QR, sin comisión)',
      'Inscripciones e invitaciones',
      'Multi-usuario y roles granulares',
      'Exportar asistentes a CSV',
      'Listas de espera automáticas',
    ],
  },
  {
    name: 'Pro',
    tagline: 'Gestbot IA, API, white-label y soporte. Para equipos que quieren escalar y mantener su marca.',
    price: { monthly: 19.99, annual: 19.99 },
    highlight: true,
    badge: 'Recomendado',
    cta: { label: 'Probar Pro 14 días gratis', to: '/register?plan=pro' },
    features: [
      'Todo lo del plan Free',
      'API REST + Webhooks con HMAC y reintentos',
      'Gestbot — asistente IA que opera tu evento',
      'White-label: sin marca GESTEK',
      'Auditoría de acciones del equipo',
      'Personalización completa (colores, tipografía, logo)',
      'Analytics avanzados (cohortes, fuente, retención)',
      'Web push notifications',
      'Plantillas pro de página pública',
      'Soporte prioritario con SLA de 4h',
      'Onboarding 1:1 con nuestro equipo',
      'Auditoría completa de acciones del equipo',
    ],
  },
];

const COMPARE = [
  { section: 'Eventos', rows: [
    ['Eventos activos',                'Ilimitados', 'Ilimitados'],
    ['Asistentes por evento',          'Ilimitados', 'Ilimitados'],
    ['Página pública del evento',      true,         true],
    ['Modalidades (presencial/virtual/híbrido)', true, true],
    ['Wizard de creación 4 pasos',     true,         true],
    ['Plantillas pro de página pública', false,      true],
  ]},
  { section: 'Asistencia y boletas', rows: [
    ['QR único por inscrito',          true, true],
    ['Check-in y check-out',           true, true],
    ['Múltiples estaciones de acceso', true, true],
    ['Cupos limitados + lista de espera', true, true],
    ['Importar asistentes desde CSV',  true, true],
    ['Exportar asistentes a CSV',      true, true],
  ]},
  { section: 'Pagos (BRE-B)', rows: [
    ['Llave o QR del organizador',     true, true],
    ['Cobro directo al organizador',   true, true],
    ['Comisión adicional GESTEK',      'Sin comisión', 'Sin comisión'],
    ['Recibos automáticos por email',  true, true],
    ['Gestión de reembolsos manual',   true, true],
  ]},
  { section: 'Comunicación', rows: [
    ['Recordatorios automáticos email', true, true],
    ['Confirmación de inscripción',    true, true],
    ['Notificaciones in-app',          true, true],
    ['Notificaciones de eventos',      true, true],
    ['Web push notifications',         false, true],
    ['Personalizar plantillas email',  false, true],
  ]},
  { section: 'Gamificación', rows: [
    ['Puntos por asistencia',          true, true],
    ['Badges desbloqueables',          true, true],
    ['Ranking de asistentes',          true, true],
    ['Misiones por evento',            true, true],
    ['Recompensas personalizadas',     false, true],
  ]},
  { section: 'Datos y analítica', rows: [
    ['Asistencia y ocupación',         true, true],
    ['Analytics avanzados (cohortes)', false, true],
    ['Atribución (fuente de inscripción)', false, true],
    ['Export programado a Google Sheets', false, true],
  ]},
  { section: 'API y webhooks', rows: [
    ['API REST con API key',           false, true],
    ['Webhooks (inscripción, pago, check-in)', false, true],
    ['Webhooks con reintentos y HMAC', false, true],
    ['Rate limit',                     '—', '600 req/min'],
    ['OpenAPI / Postman',              false, true],
  ]},
  { section: 'Branding', rows: [
    ['Página pública',                 'gestek.io/tu-marca', 'gestek.io/tu-marca'],
    ['Logo GESTEK visible',            'Sí (siempre)', 'Removible'],
    ['Subir tu propio logo',           false, true],
    ['Colores personalizados',         false, true],
    ['Tipografía personalizada',       false, true],
    ['Dominio personalizado real',     false, true],
  ]},
  { section: 'Cuenta y equipo', rows: [
    ['Usuarios incluidos',             'Ilimitado', 'Ilimitado'],
    ['Roles granulares (admin/editor/lector)', true, true],
    ['Asignar permisos por evento',    true, true],
    ['Auditoría de acciones del equipo', false, true],
    ['Onboarding 1:1',                 false, true],
  ]},
  { section: 'IA (Pro)', rows: [
    ['Agente IA para crear eventos',   false, true],
    ['Sugerencia de agenda y copy',    false, true],
    ['Análisis de feedback post-evento', false, true],
  ]},
  { section: 'Soporte', rows: [
    ['Documentación pública',          true, true],
    ['Email de contacto',              true, true],
    ['Soporte prioritario (SLA 4h)',   false, true],
    ['Onboarding 1:1',                 false, true],
  ]},
];

const FAQ = [
  { q: '¿Hay realmente todo lo principal en el plan gratis?', a: 'Sí. Eventos y asistentes ilimitados, QR, recordatorios, gamificación, API + webhooks, pasarela BRE-B y página pública. No hay limitaciones encubiertas — el plan Pro es para comodidad y branding, no para desbloquear funcionalidad esencial.' },
  { q: '¿Cobran comisión sobre las ventas?', a: 'No en el plan Free ni en Pro. El dinero va directo del asistente a tu cuenta vía BRE-B usando tu llave o QR. GESTEK no toca ese flujo ni se queda con un porcentaje.' },
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Subes a Pro cuando quieras desde el panel. Cancelas también cuando quieras y vuelves al plan Free sin perder eventos, asistentes, configuración ni datos.' },
  { q: '¿Cómo funciona la prueba gratis de Pro?', a: '14 días con todas las funciones Pro activas. Necesitas pasarela de pago configurada solo si decides continuar al día 15 — no te cobramos antes ni automáticamente sin avisarte.' },
  { q: '¿Hay descuento por pago anual?', a: 'Sí, 35% sobre el plan Pro pagando anual. Equivale a 4 meses gratis al año.' },
  { q: '¿Qué pasa con mis datos si cancelo?', a: 'Conservas acceso completo a todo en el plan gratis. Si decides borrar tu cuenta, exportamos un dump completo en JSON + CSV y eliminamos todo en 30 días.' },
  { q: '¿Tienen plan Enterprise?', a: 'No por ahora. El plan Pro cubre necesidades de equipos hasta 10 personas. Para volúmenes mayores, escríbenos y conversamos un acuerdo a medida.' },
  { q: '¿Cómo manejan el GDPR / Habeas Data?', a: 'Cumplimos con Habeas Data (Ley 1581 de Colombia) y proporcionamos DPA bajo solicitud. Tus asistentes pueden ejercer derechos ARCO desde la página pública del evento.' },
];

export default function PlanesPage() {
  const [annual, setAnnual] = useState(false);
  const { usuario } = useAuth();
  const { error: toastErr } = useToast();
  const navigate = useNavigate();
  const [planEstado, setPlanEstado] = useState(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!usuario) { setPlanEstado(null); return; }
    pagosApi.planEstado().then(setPlanEstado).catch(() => {});
  }, [usuario?.id]);

  const irAPro = async () => {
    if (!usuario) { navigate('/register?plan=pro'); return; }
    if (planEstado?.plan === 'pro') return;
    setWorking(true);
    try {
      const r = await pagosApi.comprarPro();
      const url = r.checkout?.init_point || r.checkout?.sandbox_init_point;
      if (!url) throw new Error('Mercado Pago no devolvió el link de pago.');
      window.location.href = url;
    } catch (e) {
      toastErr(e.response?.data?.error || e.message);
      setWorking(false);
    }
  };

  return (
    <>
      <section className="px-5 sm:px-8 py-10 max-w-5xl mx-auto">
        <header className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-sm uppercase tracking-widest text-primary-light font-semibold mb-4">Planes</p>
          <h1 className="text-5xl sm:text-6xl font-bold font-display tracking-tight text-text-1 leading-[1.05] mb-5">
            Empieza gratis.<br />Sube a Pro cuando quieras.
          </h1>
          <p className="text-lg text-text-2">
            Lo principal va siempre incluido en el plan gratuito. Pro existe para hacerte la vida más fácil
            — no para desbloquear lo básico.
          </p>

          <p className="mt-6 text-sm text-text-3">Pago único de <strong className="text-text-1">USD $19.99</strong> por 30 días de Pro. Sin renovación automática.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          {PLANS.map(p => {
            const price = p.price[annual ? 'annual' : 'monthly'];
            return (
              <div
                key={p.name}
                className={`relative rounded-3xl p-8 flex flex-col transition-all hover:-translate-y-1 ${p.highlight
                  ? 'border border-primary/40 bg-surface/80 shadow-[0_0_60px_rgba(59,130,246,0.12)] hover:shadow-[0_0_80px_rgba(59,130,246,0.22)]'
                  : 'border border-border bg-surface/40 hover:bg-surface/60 hover:border-border-2'}`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-primary text-white">
                    {p.badge}
                  </span>
                )}
                <h3 className="text-3xl font-bold font-display text-text-1">{p.name}</h3>
                <p className="text-base text-text-2 mt-2 mb-7 leading-relaxed">{p.tagline}</p>
                <div className="flex items-end gap-1.5 mb-7">
                  <span className="text-5xl font-bold font-display text-text-1">
                    {price === 0 ? 'Gratis' : `$${price}`}
                  </span>
                  {price > 0 && <span className="text-base text-text-3 mb-2">USD / 30 días</span>}
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-base text-text-1">
                      <svg className="w-5 h-5 mt-0.5 text-primary-light flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.highlight ? (
                  planEstado?.plan === 'pro' ? (
                    <div className="w-full text-center py-3.5 rounded-full text-base font-semibold border border-success/40 text-success bg-success/10">
                      Plan activo {planEstado.expires_at && `· hasta ${new Date(planEstado.expires_at).toLocaleDateString()}`}
                    </div>
                  ) : (
                    <button
                      onClick={irAPro}
                      disabled={working}
                      className="w-full text-center py-3.5 rounded-full text-base font-semibold transition-all bg-text-1 text-bg hover:bg-white disabled:opacity-60"
                    >
                      {working ? 'Redirigiendo a Mercado Pago...' : (usuario ? 'Pagar y activar Pro' : p.cta.label)}
                    </button>
                  )
                ) : (
                  <Link
                    to={p.cta.to}
                    className={`w-full text-center py-3.5 rounded-full text-base font-semibold transition-all ${
                      p.cta.primary
                        ? 'bg-text-1 text-bg hover:bg-white'
                        : 'border border-border-2 text-text-1 hover:bg-surface-2'
                    }`}
                  >
                    {p.cta.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Garantías */}
      <section className="px-5 sm:px-8 py-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Sin tarjeta para empezar', desc: 'El plan gratis no requiere medio de pago. Te registras y entras directo.' },
            { title: 'Cancela cuando quieras', desc: 'Sin contratos ni penalizaciones. Bajas a Free y sigues operando.' },
            { title: 'Tus datos son tuyos', desc: 'Export en JSON y CSV en cualquier momento. Cumplimos Habeas Data.' },
          ].map(g => (
            <div key={g.title} className="p-6 rounded-3xl border border-border bg-surface/30">
              <p className="text-base font-semibold text-text-1 mb-2">{g.title}</p>
              <p className="text-sm text-text-2 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabla comparativa */}
      <section className="px-5 sm:px-8 py-20 max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-primary-light font-semibold mb-4">Comparativa detallada</p>
          <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 leading-tight">
            Lo que viene en cada plan
          </h2>
        </header>

        <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] px-5 sm:px-7 py-4 border-b border-border bg-surface/60 sticky top-20 backdrop-blur-md z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-3">Función</span>
            <span className="text-center text-base font-bold text-text-1">Free</span>
            <span className="text-center text-base font-bold text-primary-light">Pro</span>
          </div>

          {COMPARE.map(grp => (
            <div key={grp.section}>
              <div className="px-5 sm:px-7 py-3 bg-bg/40 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary-light">{grp.section}</span>
              </div>
              {grp.rows.map((row, i) => (
                <div key={`${grp.section}-${i}`} className="grid grid-cols-[1.5fr_1fr_1fr] px-5 sm:px-7 py-3.5 border-b border-border last:border-0 hover:bg-surface/30 transition-colors">
                  <span className="text-sm text-text-1">{row[0]}</span>
                  <span className="text-center text-sm">{renderCell(row[1])}</span>
                  <span className="text-center text-sm">{renderCell(row[2])}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 sm:px-8 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-text-1 text-center mb-10">
          Preguntas sobre planes
        </h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => <FAQItem key={f.q} item={f} initialOpen={i === 0} />)}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 sm:px-8 pb-24">
        <div className="relative max-w-3xl mx-auto text-center rounded-3xl border border-border-2 bg-gradient-to-br from-surface/80 to-surface/30 p-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/15 blur-[120px] rounded-full" />
          </div>
          <h2 className="relative text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1 mb-4">
            Empieza gratis hoy
          </h2>
          <p className="relative text-base sm:text-lg text-text-2 max-w-lg mx-auto mb-8">
            Crea tu cuenta en menos de un minuto y prueba el plan Pro 14 días sin tarjeta.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="px-8 py-4 rounded-full text-base font-semibold text-bg bg-text-1 hover:bg-white transition-all">
              Crear cuenta gratis
            </Link>
            <Link to="/como-funciona" className="px-8 py-4 rounded-full text-base font-medium text-text-1 border border-border-2 hover:bg-surface-2 transition-colors">
              Ver cómo funciona
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function renderCell(v) {
  if (v === true) {
    return (
      <svg className="inline w-5 h-5 text-primary-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (v === false) {
    return <span className="text-text-3">—</span>;
  }
  return <span className="text-text-1">{v}</span>;
}

function FAQItem({ item, initialOpen }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface/60 transition-colors">
        <span className="text-base font-medium text-text-1">{item.q}</span>
        <svg className={`w-4 h-4 text-text-2 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}>
        <p className="px-5 pb-5 text-base text-text-2 leading-relaxed">{item.a}</p>
      </div>
    </div>
  );
}
