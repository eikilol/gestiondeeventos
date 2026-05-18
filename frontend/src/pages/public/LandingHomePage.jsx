import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Criatura from '../../components/agente/Criatura.jsx';

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* Cuenta numérica suave hasta `to` cuando entra al viewport */
function CountUp({ to, suffix = '', duration = 1400 }) {
  const [n, setN] = useState(0);
  const [ref, visible] = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, to, duration]);
  return <span ref={ref}>{n.toLocaleString('es-CO')}{suffix}</span>;
}

export default function LandingHomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <AIPro />
      <FreeIntro />
      <Stats />
      <Pillars />
      <FeatureSplit
        side="left"
        kicker="QR + Gamificación · Gratis"
        title="Asistencia con QR y misiones para tus asistentes"
        desc="Genera un QR único por inscrito. Escanea para check-in y check-out. Premia con puntos, badges y ranking para subir la participación de tus eventos."
        bullets={[
          'QR único de check-in y check-out',
          'Puntos por asistencia, participación y referidos',
          'Badges desbloqueables y ranking en tiempo real',
          'Misiones por evento personalizables',
        ]}
        visual={<QRMockup />}
      />
      <FeatureSplit
        side="right"
        kicker="Pagos BRE-B · Gratis"
        title="Cobra tus boletas con BRE-B en menos de un minuto"
        desc="Pega tu llave BRE-B o sube tu código QR — el dinero va directo a tu cuenta. GESTEK no toca ese flujo en el plan gratis y no cobra comisión por encima."
        bullets={[
          'Llave o QR del organizador (tu cobras, tu recibes)',
          'Pago en línea desde la página pública del evento',
          'Recibos automáticos por email al asistente',
          'Gestión manual de reembolsos desde el panel',
        ]}
        visual={<PayMockup />}
      />
      <FeatureSplit
        side="left"
        kicker="Equipo y comunicación · Gratis"
        title="Tu equipo, con roles, tareas y voz propia"
        desc="Define roles con permisos granulares por evento. Cada miembro entra a su vista 'Mi trabajo', ve sus tareas, chatea por canales y te envía sugerencias o solicitudes que tú gestionas."
        bullets={[
          'Roles con permisos por evento (tickets, check-in, clientes…)',
          'Vista de empleado "Mi trabajo": sus eventos y tareas',
          'Chat del equipo por canales (general / staff)',
          'Sugerencias, solicitudes y reportes del equipo → al organizador',
          'Tareas tipo Kanban + recordatorios in-app (T-7d, T-1d, T-1h)',
        ]}
        visual={<TeamMockup />}
      />
      <FeatureSplit
        side="right"
        kicker="Agenda, fidelidad y analítica · Gratis"
        title="Programa el evento y premia a tu gente"
        desc="Arma la agenda con vistas Lista, Día (timeline por horas), Semana y Mes, con speakers y patrocinadores. Suma un programa de puntos y recompensas, ranking del equipo y analítica real."
        bullets={[
          'Agenda con vista Día (timeline), Semana y Mes',
          'Speakers, patrocinadores y bloques de sesión',
          'Fidelidad: puntos, recompensas y canjes (clientes y staff)',
          'Ranking del equipo por evento',
          'Analítica: visitas, conversión, ingresos por tipo',
        ]}
        visual={<QRMockup />}
      />
      <FeatureSplit
        side="left"
        kicker="White-label · Todos los planes"
        title="Tu marca, no la nuestra"
        desc="Personaliza el panel y las páginas públicas: logo, nombre, colores, fondo, tipografía, radio de bordes, tagline y redes. En Pro, además quitas la marca GESTEK y pones tu footer."
        bullets={[
          'Logo, colores, fondo y tipografía propios',
          'Se aplica en el panel y en las páginas públicas del evento',
          'Tagline + enlaces (web, Instagram, WhatsApp)',
          'En Pro: sin "Powered by GESTEK" y footer propio',
        ]}
        visual={<BrandMock />}
      />
      <FeatureSplit
        side="right"
        kicker="API + Webhooks · Plan Pro"
        title="Conecta GESTEK con todo tu stack"
        desc="El plan Pro incluye API REST con API key (HMAC), webhooks que disparan en cada inscripción, pago o check-in, y auditoría de todas las acciones del equipo."
        bullets={[
          'API key por organización con firma HMAC',
          'Webhooks: registro, pago, check-in, cancelación + reintentos',
          'Auditoría de acciones del equipo (quién hizo qué y cuándo)',
          'Rate limit y tokens revocables',
        ]}
        visual={<CodeMockup />}
      />
      <PricingTeaser />
      <FAQTeaser />
      <CTASection />
    </>
  );
}

/* ─────────── HERO ─────────── */
function Hero() {
  const [ref, visible] = useReveal(0);
  return (
    <section className="relative px-5 sm:px-8 pt-12 sm:pt-20 pb-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        transform: 'translateZ(0)',
        backgroundImage:
          'radial-gradient(48rem 30rem at 50% 0%, rgba(59,130,246,0.12), transparent 60%),'
          + 'radial-gradient(26rem 26rem at 12% 35%, rgba(139,92,246,0.08), transparent 60%),'
          + 'radial-gradient(20rem 20rem at 88% 25%, rgba(59,130,246,0.08), transparent 60%)',
      }} />

      {/* Decorative orbits */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-border/40 animate-[spin-slow_60s_linear_infinite]" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-border/25 animate-[spin-slow_90s_linear_infinite_reverse]" />
        <div className="absolute w-[1000px] h-[1000px] rounded-full border border-border/15" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center" ref={ref}>
        <h1 className={`text-7xl sm:text-8xl lg:text-[8.5rem] font-bold font-display tracking-tight leading-none text-text-1 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="bg-gradient-to-br from-text-1 via-primary-light to-accent-light bg-clip-text text-transparent animate-[shimmer_8s_linear_infinite]" style={{ backgroundSize: '200% 100%', animationDirection: 'reverse' }}>
            GESTEK
          </span>
        </h1>

        <p className={`mt-4 text-base sm:text-lg text-primary-light font-semibold tracking-[0.3em] uppercase transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Manage · Automate · Scale
        </p>

        <div className={`mt-6 flex justify-center transition-all duration-700 delay-250 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/40
                           bg-accent/10 text-accent-light text-xs sm:text-sm font-semibold">
Primera plataforma de gestión de eventos con IA integrada para automatizarlos
          </span>
        </div>

        <p className={`mt-8 text-lg sm:text-2xl text-text-2 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          La plataforma de gestión de eventos que reemplaza tu stack actual.
          Creación, ventas, asistencia, pagos y comunidad. Empieza gratis y
          sube a Pro cuando lo necesites — 14 días de prueba.
        </p>

        <div className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold text-bg bg-text-1 hover:bg-white transition-all shadow-[0_0_40px_rgba(241,245,249,0.2)] hover:shadow-[0_0_60px_rgba(241,245,249,0.35)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Empezar gratis
          </Link>
          <Link
            to="/como-funciona"
            className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-medium text-text-1 border border-border-2 hover:bg-surface-2 hover:border-text-3 transition-all"
          >
            Ver cómo funciona
          </Link>
        </div>

        <p className={`mt-6 text-sm text-text-3 transition-all duration-700 delay-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          Sin tarjeta de crédito · Todo lo principal incluido en el plan gratis
        </p>
      </div>
    </section>
  );
}

/* ─────────── MARQUEE infinito ─────────── */
function Marquee() {
  const items = [
    'CREAR EVENTOS',
    'QR DE ASISTENCIA',
    'RECORDATORIOS EMAIL',
    'GAMIFICACIÓN',
    'PAGOS BRE-B',
    'API + WEBHOOKS',
    'PÁGINA PÚBLICA',
    'MULTI-TENANT',
    'NOTIFICACIONES',
    'ANALYTICS',
    'INSCRIPCIONES',
    'CHECK-IN',
  ];
  return (
    <div className="relative border-y border-border py-7 overflow-hidden bg-gradient-to-r from-bg via-surface/40 to-bg">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
      <div className="flex items-center gap-14 animate-marquee" style={{ width: 'max-content', animationDirection: 'reverse' }}>
        {[...items, ...items].map((t, i) => (
          <div key={i} className="flex items-center gap-14 flex-shrink-0">
            <span className="text-sm font-semibold tracking-[0.25em] text-text-2 whitespace-nowrap hover:text-text-1 transition-colors">
              {t}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── VALUE PROPS ─────────── */
function Stats() {
  const props = [
    {
      kicker: 'Velocidad',
      title: 'Eventos grandes',
      highlight: '< 15 min',
      desc: 'Wizard de 4 pasos. Sin curva de aprendizaje, sin onboarding obligatorio.',
    },
    {
      kicker: 'Cero comisiones',
      title: 'Cobra boletas',
      highlight: 'directo a ti',
      desc: 'Pasarela BRE-B con tu llave o QR. El dinero entra a tu cuenta, no a la nuestra.',
    },
    {
      kicker: 'Sin trucos',
      title: 'Empieza',
      highlight: 'gratis',
      desc: 'Crea y vende sin tarjeta. Pro suma IA, API, white-label y más — con 14 días de prueba.',
    },
    {
      kicker: 'Escala',
      title: 'API y agente IA',
      highlight: 'cuando los necesites',
      desc: 'Si tu volumen crece, Pro suma agente IA, white-label y API. No antes.',
    },
  ];
  return (
    <section className="relative px-5 sm:px-8 py-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-primary/6 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-accent/6 blur-[120px] rounded-full" />
      </div>
      <div className="relative max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {props.map((p, i) => (
          <div
            key={p.title}
            className="group relative p-6 rounded-3xl border border-border bg-surface/40 hover:bg-surface/70 hover:border-border-2 hover:-translate-y-1 transition-all overflow-hidden"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/8 rounded-full blur-2xl group-hover:bg-primary/15 transition-colors" />
            <p className="relative text-[10px] uppercase tracking-widest text-primary-light font-bold mb-4">{p.kicker}</p>
            <h3 className="relative text-xl font-bold font-display text-text-1 leading-tight mb-1">{p.title}</h3>
            <p className="relative text-2xl font-bold font-display bg-gradient-to-br from-primary-light to-accent-light bg-clip-text text-transparent mb-3">
              {p.highlight}
            </p>
            <p className="relative text-sm text-text-2 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────── PILLARS ─────────── */
function FreeIntro() {
  const [ref, visible] = useReveal();
  return (
    <section className="px-5 sm:px-8 pt-24 pb-6">
      <div ref={ref} className={`max-w-3xl mx-auto text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <p className="text-xs uppercase tracking-widest text-primary-light font-bold mb-4">
          Plan gratuito
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold font-display text-text-1 tracking-tight leading-tight mb-5">
          El plan gratuito incluye lo esencial para operar tus eventos.
        </h2>
        <p className="text-base sm:text-lg text-text-2 leading-relaxed">
          Eventos y asistentes ilimitados, QR de check-in, agenda con vista por día,
          equipo con roles y chat, programa de fidelidad con puntos y ranking, pagos
          BRE-B sin comisión y página pública con tu marca. Sin costo.
        </p>
      </div>
    </section>
  );
}

function Pillars() {
  const [ref, visible] = useReveal();
  const items = [
    { title: 'Gratis para empezar', desc: 'Eventos y asistentes ilimitados, QR de check-in, agenda, equipo con roles, fidelidad, chat y página pública. Lo esencial sin pagar.' },
    { title: 'Pagos sin fricción', desc: 'Conecta tu llave o QR de BRE-B y vende boletas. El dinero va directo a tu cuenta — GESTEK no se queda con comisión.' },
    { title: 'Pro cuando escalas', desc: 'Gestbot (IA que opera el evento), API + Webhooks y auditoría. 14 días de prueba gratis, luego US$ 19.99/mes.' },
  ];
  return (
    <section className="px-5 sm:px-8 py-24 sm:py-28">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-sm uppercase tracking-widest text-primary-light font-semibold mb-4">Por qué GESTEK</p>
          <h2 className="text-4xl sm:text-5xl font-bold font-display text-text-1 tracking-tight leading-tight">
            Lo principal, en gratis.<br />Lo cómodo, en Pro.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <div
              key={it.title}
              style={{ transitionDelay: `${i * 120}ms` }}
              className={`group relative p-7 rounded-3xl border border-border bg-surface/40 hover:bg-surface/70 hover:border-border-2 hover:-translate-y-1 transition-all duration-700
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 mb-5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-primary-light text-lg font-bold">{i + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-text-1 mb-3">{it.title}</h3>
                <p className="text-base text-text-2 leading-relaxed">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── FEATURE SPLIT (reutilizable) ─────────── */
function FeatureSplit({ side, kicker, title, desc, bullets, visual }) {
  const [ref, visible] = useReveal();
  const isLeft = side === 'left';
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-24">
      <div ref={ref} className={`max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center`}>
        <div className={`${isLeft ? 'lg:order-1' : 'lg:order-2'} transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : `opacity-0 ${isLeft ? '-translate-x-6' : 'translate-x-6'}`}`}>
          <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mb-4">{kicker}</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-text-1 tracking-tight leading-tight mb-5">{title}</h2>
          <p className="text-base sm:text-lg text-text-2 leading-relaxed mb-7">{desc}</p>
          <ul className="space-y-3">
            {bullets.map(b => (
              <li key={b} className="flex items-start gap-3 text-base text-text-1">
                <svg className="w-5 h-5 mt-0.5 text-primary-light flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${isLeft ? 'lg:order-2' : 'lg:order-1'} transition-all duration-700 delay-150 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {visual}
        </div>
      </div>
    </section>
  );
}

function QRMockup() {
  return (
    <div className="rounded-3xl border border-border-2 bg-surface/60 backdrop-blur p-7">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs uppercase tracking-widest text-text-3">Check-in</span>
        <span className="px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-semibold">En vivo</span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-5 items-center mb-5">
        <div className="w-28 h-28 rounded-2xl bg-text-1 p-2.5">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {[...Array(8)].map((_, r) =>
              [...Array(8)].map((__, c) => {
                const k = (r * 7 + c * 3) % 5;
                return <rect key={`${r}-${c}`} x={c * 12 + 2} y={r * 12 + 2} width="10" height="10" fill={k < 2 ? '#070C18' : 'transparent'} />;
              })
            )}
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-text-1">Juan Medina</p>
          <p className="text-xs text-text-2 mt-1">juan@empresa.com</p>
          <p className="text-xs text-text-3 mt-2 font-mono">TICKET-A7K-302</p>
        </div>
      </div>
      <div className="space-y-2 pt-4 border-t border-border">
        {[
          ['Asistencia', '120 pts'],
          ['Networking', '30 pts'],
          ['Talleres', '50 pts'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span className="text-text-2">{k}</span>
            <span className="text-primary-light font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayMockup() {
  return (
    <div className="rounded-3xl border border-border-2 bg-surface/60 backdrop-blur p-7">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs uppercase tracking-widest text-text-3">Boleta · Pago</span>
        <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary-light text-xs font-semibold">BRE-B</span>
      </div>
      <p className="text-3xl font-bold font-display text-text-1 mb-1">$ 80.000</p>
      <p className="text-xs text-text-3 mb-5">UX Workshop Bogotá · 22 Sep 2026</p>

      <div className="rounded-2xl bg-bg/60 border border-border p-4 mb-4 grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="w-16 h-16 rounded-xl bg-text-1 p-1.5">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {[...Array(6)].map((_, r) =>
              [...Array(6)].map((__, c) => {
                const k = (r * 5 + c * 7) % 4;
                return <rect key={`${r}-${c}`} x={c * 16 + 2} y={r * 16 + 2} width="14" height="14" fill={k < 2 ? '#070C18' : 'transparent'} />;
              })
            )}
          </svg>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-3 mb-1">Llave BRE-B del organizador</p>
          <p className="text-sm font-mono text-text-1 truncate">@gestek-events</p>
        </div>
      </div>

      <button className="w-full py-3 rounded-2xl bg-text-1 text-bg text-sm font-semibold">Pagar con BRE-B</button>
    </div>
  );
}

function TeamMockup() {
  const team = [
    { name: 'Juan Medina',    role: 'Admin',  color: 'from-primary to-accent' },
    { name: 'Laura Sánchez',  role: 'Editor', color: 'from-accent to-success' },
    { name: 'Diego Restrepo', role: 'Editor', color: 'from-success to-primary' },
    { name: 'María Torres',   role: 'Lector', color: 'from-primary-light to-accent-light' },
  ];
  return (
    <div className="rounded-3xl border border-border-2 bg-surface/60 backdrop-blur p-7">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs uppercase tracking-widest text-text-3">Equipo del evento</span>
        <span className="px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-semibold">4 activos</span>
      </div>
      <div className="space-y-3">
        {team.map(m => (
          <div key={m.name} className="flex items-center gap-3 p-3 rounded-2xl bg-bg/40 border border-border hover:bg-bg/60 transition-colors">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-bg font-bold text-sm`}>
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-1 truncate">{m.name}</p>
              <p className="text-xs text-text-3">{m.role}</p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-primary-light font-semibold">
              {m.role === 'Admin' ? 'Total' : m.role === 'Editor' ? 'Edita' : 'Lee'}
            </span>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full py-2.5 rounded-2xl text-xs font-semibold text-text-2 border border-dashed border-border-2 hover:border-text-3 hover:text-text-1 transition-colors">
        + Invitar miembro
      </button>
    </div>
  );
}

function BrandMock() {
  return (
    <div className="rounded-3xl border border-border-2 overflow-hidden"
         style={{ background: '#0E1630', fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="px-5 py-3 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FCEFA1] to-[#A6731B]" />
        <div>
          <span className="block text-sm font-bold text-white">Tu Empresa</span>
          <span className="block text-[11px] text-white/60">Experiencias inolvidables</span>
        </div>
        <div className="ml-auto flex gap-1.5">
          <span className="w-7 h-7 rounded-lg border border-white/15" />
          <span className="w-7 h-7 rounded-lg border border-white/15" />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/40 to-accent/25" />
        <p className="text-base font-semibold text-white">Tu evento, con tu marca</p>
        <p className="text-sm text-white/60">Colores, tipografía y fondo propios — sin “GESTEK”.</p>
        <span className="inline-flex h-8 px-4 items-center rounded-full text-xs font-semibold text-white bg-primary">
          Reservar
        </span>
      </div>
    </div>
  );
}

function CodeMockup() {
  return (
    <div className="rounded-3xl border border-border-2 bg-bg/80 backdrop-blur overflow-hidden">
      <div className="flex items-center gap-1.5 px-5 py-3 border-b border-border bg-surface/60">
        <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
        <span className="ml-3 text-xs text-text-3 font-mono">POST /api/v1/eventos</span>
      </div>
      <pre className="px-5 py-4 text-xs leading-relaxed font-mono text-text-2 overflow-x-auto">
{`curl -X POST https://api.gestek.io/v1/eventos \\
  -H "Authorization: Bearer $GESTEK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nombre": "Summit Tech 2026",
    "fecha": "2026-08-15",
    "modalidad": "hibrido",
    "capacidad": 200,
    "webhooks": ["https://crm.com/hook"]
  }'

`}<span className="text-success">{`{
  "ok": true,
  "id": "evt_2A7K9P",
  "url_publica": "gestek.io/explorar/summit-tech-2026"
}`}</span>
      </pre>
    </div>
  );
}

/* ─────────── AI Pro callout ─────────── */
function AIPro() {
  const [ref, visible] = useReveal();
  const MOODS = ['idle', 'thinking', 'talking', 'happy'];
  const [mi, setMi] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMi(i => (i + 1) % MOODS.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="px-5 sm:px-8 py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        transform: 'translateZ(0)',
        backgroundImage:
          'radial-gradient(42rem 30rem at 50% 50%, rgba(139,92,246,0.12), transparent 62%),'
          + 'radial-gradient(22rem 22rem at 75% 30%, rgba(59,130,246,0.10), transparent 60%)',
      }} />

      <div ref={ref} className={`relative max-w-6xl mx-auto transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Claim de protagonismo */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent-light text-xs font-semibold uppercase tracking-widest mb-6">
            Asistente de IA integrado
          </span>
          <h2 className="text-4xl sm:text-6xl font-bold font-display tracking-tight text-text-1 leading-[1.05] mb-5">
            <span className="bg-gradient-to-br from-primary-light to-accent-light bg-clip-text text-transparent">Gestbot</span>, el asistente que opera tu evento
          </h2>
          <p className="text-base sm:text-xl text-text-2 max-w-2xl mx-auto leading-relaxed">
            Gestbot no se limita a sugerir: <strong className="text-text-1">ejecuta</strong>. Crea y
            publica eventos, arma boletas, registra check-ins, envía recordatorios y gestiona el
            equipo — <strong className="text-text-1">más de 50 acciones reales</strong>. Solicita
            los datos faltantes mediante formularios y puede analizar un PDF o imágenes para crear
            el evento.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* El robot, protagonista */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
            <div className="relative">
              <Criatura mood={MOODS[mi]} size={300} />
            </div>
            <div className="absolute bottom-2 px-4 py-1.5 rounded-full bg-surface/80 backdrop-blur
                            border border-border-2 text-xs text-text-2">
              {MOODS[mi] === 'thinking' ? 'Procesando' : MOODS[mi] === 'happy' ? 'Listo' : 'Disponible'}
            </div>
          </div>

          {/* Conversación */}
          <div className="rounded-3xl border border-accent/25 bg-surface/60 backdrop-blur p-6 sm:p-7 text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-text-1/90 flex-shrink-0" />
              <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-bg/60 border border-border text-sm text-text-1">
                Crea un summit de tecnología para 200 personas el 15 de agosto en Ibagué, híbrido, entrada gratis.
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold">G</div>
              <div className="flex-1 px-4 py-3 rounded-2xl rounded-tr-sm bg-accent/10 border border-accent/20 text-sm text-text-1">
                Listo. Creé <span className="font-semibold">Summit Tech Ibagué 2026</span> (200 cupos, 15 ago,
                híbrido), agenda base, página pública y QR. ¿Lo publico?
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-text-1/90 flex-shrink-0" />
              <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-bg/60 border border-border text-sm text-text-1">
                Publícalo y crea una boleta VIP a 50.000.
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold">G</div>
              <div className="flex-1 px-4 py-3 rounded-2xl rounded-tr-sm bg-accent/10 border border-accent/20 text-sm text-text-1">
                Hecho. Evento publicado y boleta <span className="font-semibold">VIP · $50.000</span> creada.
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/register?plan=pro"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-primary to-accent
                       text-white text-sm font-semibold hover:opacity-90 transition-all shadow-glow-accent">
            Probar Gestbot 14 días gratis
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
          <p className="text-xs text-text-3 mt-3">Función Pro · sin tarjeta · cancela cuando quieras</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Pricing teaser ─────────── */
function PricingTeaser() {
  const [ref, visible] = useReveal();
  return (
    <section className="px-5 sm:px-8 py-24">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-sm uppercase tracking-widest text-primary-light font-semibold mb-4">Planes</p>
          <h2 className="text-4xl sm:text-5xl font-bold font-display text-text-1 tracking-tight leading-tight mb-4">
            Empieza gratis. Sube cuando quieras.
          </h2>
          <p className="text-base sm:text-lg text-text-2 max-w-xl mx-auto">
            Empieza gratis con lo esencial. Pro suma IA, API, white-label y soporte — pruébalo 14 días sin tarjeta.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="p-7 rounded-3xl border border-border bg-surface/40 hover:bg-surface/60 transition-all">
            <h3 className="text-2xl font-bold font-display text-text-1 mb-2">Free</h3>
            <p className="text-sm text-text-2 mb-5">Lo esencial para empezar, sin tarjeta.</p>
            <p className="text-4xl font-bold font-display text-text-1 mb-6">$0</p>
            <ul className="space-y-2.5 text-sm text-text-1 mb-7">
              {[
                'Eventos y asistentes ilimitados',
                'QR de check-in / check-out',
                'Agenda (Día/Semana/Mes), speakers y patrocinadores',
                'Equipo con roles + chat + sugerencias',
                'Fidelidad: puntos, recompensas y ranking',
                'Pasarela BRE-B sin comisiones',
                'White-label básico + página pública',
              ].map(f => (
                <li key={f} className="flex items-start gap-2"><span className="text-primary-light mt-0.5">✓</span> {f}</li>
              ))}
            </ul>
            <Link to="/register" className="block text-center py-3 rounded-full border border-border-2 hover:bg-surface-2 text-sm font-semibold text-text-1 transition-colors">
              Crear cuenta gratis
            </Link>
          </div>

          <div className="relative p-7 rounded-3xl border border-primary/40 bg-surface/80 shadow-[0_0_60px_rgba(59,130,246,0.12)] hover:shadow-[0_0_80px_rgba(59,130,246,0.2)] transition-all">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-primary text-white">Recomendado</span>
            <h3 className="text-2xl font-bold font-display text-text-1 mb-2">Pro</h3>
            <p className="text-sm text-text-2 mb-5">IA, API, white-label y soporte. 14 días de prueba gratis.</p>
            <p className="text-4xl font-bold font-display text-text-1 mb-1">$19.99 <span className="text-base text-text-3 font-medium">USD/mes</span></p>
            <p className="text-xs text-primary-light mb-5">14 días gratis · sin tarjeta · cancela cuando quieras</p>
            <ul className="space-y-2.5 text-sm text-text-1 mb-7">
              {[
                'Todo lo del Free',
                'Gestbot — asistente IA que opera tu evento',
                'API REST + Webhooks con HMAC',
                'White-label sin marca GESTEK',
                'Auditoría de acciones del equipo',
                'Analytics avanzados',
                'Soporte prioritario',
              ].map(f => (
                <li key={f} className="flex items-start gap-2"><span className="text-primary-light mt-0.5">✓</span> {f}</li>
              ))}
            </ul>
            <Link to="/register?plan=pro" className="block text-center py-3 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold transition-colors">
              Probar Pro
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-text-3 mt-8">
          <Link to="/planes" className="underline underline-offset-2 hover:text-text-1 transition-colors">
            Ver comparativa completa
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ─────────── FAQ teaser ─────────── */
function FAQTeaser() {
  const items = [
    { q: '¿El plan gratis tiene límite de eventos o asistentes?', a: 'No. El plan gratis cubre eventos y asistentes ilimitados. Lo principal está incluido sin trampa.' },
    { q: '¿Cobran comisión por las ventas con BRE-B?', a: 'No en el plan gratis. El dinero va directo del asistente a tu cuenta vía BRE-B. GESTEK no toca ese flujo.' },
    { q: '¿Qué pasa si cancelo el plan Pro?', a: 'Vuelves al plan gratis sin perder eventos ni datos. Solo se desactivan las funciones Pro (IA, branding, etc).' },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="px-5 sm:px-8 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-widest text-primary-light font-semibold mb-4">Preguntas frecuentes</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-text-1 tracking-tight">
            Lo que más nos preguntan
          </h2>
        </div>
        <div className="space-y-3">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
                <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface/60 transition-colors">
                  <span className="text-base font-medium text-text-1">{f.q}</span>
                  <svg className={`w-4 h-4 text-text-2 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                  <p className="px-5 pb-5 text-base text-text-2 leading-relaxed">{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-text-3 mt-6">
          <Link to="/faq" className="underline underline-offset-2 hover:text-text-1 transition-colors">Ver todas las preguntas</Link>
        </p>
      </div>
    </section>
  );
}

/* ─────────── CTA final ─────────── */
function CTASection() {
  return (
    <section className="px-5 sm:px-8 py-28">
      <div className="relative max-w-3xl mx-auto text-center rounded-3xl border border-border-2 bg-gradient-to-br from-surface/80 to-surface/30 p-12 sm:p-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/15 blur-[120px] rounded-full" />
        </div>
        <h2 className="relative text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-1 leading-tight mb-5">
          Tu próximo evento empieza hoy
        </h2>
        <p className="relative text-base sm:text-lg text-text-2 max-w-lg mx-auto mb-10">
          Crea tu cuenta en menos de un minuto. Empieza gratis; Pro con 14 días de prueba.
        </p>
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold text-bg bg-text-1 hover:bg-white transition-all shadow-[0_0_40px_rgba(241,245,249,0.2)] hover:scale-[1.02]">
            Crear cuenta gratis
          </Link>
          <Link to="/planes" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-medium text-text-1 border border-border-2 hover:bg-surface-2 transition-colors">
            Ver planes
          </Link>
        </div>
      </div>
    </section>
  );
}
