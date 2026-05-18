/* Templates pre-armados para el PageBuilder.
   Cada template define `pages` con bloques listos. El usuario los puede pegar
   sobre su página actual. Usamos los mismos tipos de bloque que BLOCKS. */

let _uid = 0;
const id = (p = 'b') => `${p}_t${++_uid}_${Math.random().toString(36).slice(2, 8)}`;

/* Helper: bloques de sistema en el orden estándar */
const sistemaCompleto = () => [
  { id: id(), type: 'portada',       data: {} },
  { id: id(), type: 'titulo',        data: {} },
  { id: id(), type: 'descripcion',   data: {} },
  { id: id(), type: 'info',          data: {} },
  { id: id(), type: 'direccion',     data: {} },
  { id: id(), type: 'galeria_evento',data: {} },
  { id: id(), type: 'tickets',       data: {} },
  { id: id(), type: 'links',         data: {} },
];

export const TEMPLATES = [
  {
    key: 'conferencia',
    nombre: 'Conferencia profesional',
    desc: 'Hero + speakers + agenda detallada + sponsors + FAQ. Ideal para eventos B2B, summits y congresos.',
    accent: 'from-primary/30 to-accent/20',
    preview: ['Hero impactante', 'Lineup de speakers', 'Patrocinadores', 'Preguntas frecuentes'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'El futuro empieza acá', subtitulo: 'Una conferencia para profesionales que quieren liderar la próxima década.', imagen: '', cta_texto: 'Reservá tu lugar', cta_url: '#tickets' } },
          { id: id(), type: 'portada',     data: {} },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'countdown',   data: { titulo: 'Faltan', fecha: null } },
          { id: id(), type: 'speakers',    data: { titulo: 'Speakers confirmados', items: [
            { nombre: 'Speaker 1', cargo: 'CEO', empresa: 'Empresa', foto: '', bio: 'Breve descripción del background.' },
            { nombre: 'Speaker 2', cargo: 'CTO', empresa: 'Empresa', foto: '', bio: 'Breve descripción del background.' },
            { nombre: 'Speaker 3', cargo: 'Head of Product', empresa: 'Empresa', foto: '', bio: 'Breve descripción del background.' },
          ]}},
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'direccion',   data: {} },
          { id: id(), type: 'mapa',        data: { titulo: 'Cómo llegar', direccion: '' } },
          { id: id(), type: 'sponsors',    data: { titulo: 'Hacen posible este evento', items: [] } },
          { id: id(), type: 'faq',         data: { titulo: 'Preguntas frecuentes', items: [
            { q: '¿Habrá grabación disponible después?', a: 'Sí, todos los asistentes reciben acceso a las grabaciones por 90 días.' },
            { q: '¿Incluye comida?',                     a: 'Coffee breaks y almuerzo incluidos en el ticket.' },
            { q: '¿Hay descuentos por grupo?',           a: 'Escribinos para grupos de 5+ personas.' },
          ]}},
          { id: id(), type: 'redes',       data: { titulo: 'Seguinos', items: [
            { tipo: 'instagram', url: '' },
            { tipo: 'twitter',   url: '' },
            { tipo: 'linkedin',  url: '' },
          ]}},
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },

  {
    key: 'workshop',
    nombre: 'Workshop práctico',
    desc: 'Foco en qué vas a aprender, cupos limitados, instructor único. Para talleres, masterclasses y bootcamps.',
    accent: 'from-warning/30 to-warning/10',
    preview: ['Promesa clara', '¿Qué vas a aprender?', 'Sobre el instructor', 'Cupos limitados'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'Aprendé haciendo, en un solo día', subtitulo: 'Workshop práctico, sin teoría innecesaria. Te vas con un proyecto terminado.', imagen: '', cta_texto: 'Asegurá tu cupo', cta_url: '#tickets' } },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'texto', data: {
            titulo: '¿Qué vas a aprender?',
            texto: '• Fundamentos aplicados a tu día a día.\n• Herramientas concretas que vas a usar al día siguiente.\n• Un proyecto real construido durante la sesión.\n• Q&A en vivo con el instructor.',
          }},
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'speakers', data: { titulo: 'Tu instructor', items: [
            { nombre: 'Nombre del instructor', cargo: 'Cargo', empresa: 'Empresa', foto: '', bio: 'Background, experiencia y por qué está en condiciones de enseñar esto.' },
          ]}},
          { id: id(), type: 'texto', data: {
            titulo: 'Cupo limitado',
            texto: 'Trabajamos con grupos pequeños para que cada participante reciba atención personalizada. Si te interesa, asegurá tu lugar pronto.',
          }},
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'countdown',   data: { titulo: 'Cierre de inscripciones en', fecha: null } },
          { id: id(), type: 'direccion',   data: {} },
          { id: id(), type: 'faq',         data: { titulo: 'Dudas frecuentes', items: [
            { q: '¿Necesito experiencia previa?', a: 'Te pedimos un nivel mínimo que aclaramos al inscribirte. Si tenés dudas, escribinos.' },
            { q: '¿Qué tengo que llevar?',         a: 'Tu laptop y ganas. Lo demás lo ponemos nosotros.' },
            { q: '¿Hay material posterior?',       a: 'Sí, te enviamos el material y la grabación tras el workshop.' },
          ]}},
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },

  {
    key: 'fiesta',
    nombre: 'Fiesta / experiencia',
    desc: 'Visual, vibra, galería de ediciones pasadas. Para shows, eventos sociales, lanzamientos y after-parties.',
    accent: 'from-accent/40 to-primary/20',
    preview: ['Hero visual', 'Galería de fotos', 'Line-up', 'Locación + cómo llegar'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'La noche que estabas esperando', subtitulo: 'Una experiencia única. Música, comunidad y energía hasta el amanecer.', imagen: '', cta_texto: 'Conseguí tu entrada', cta_url: '#tickets' } },
          { id: id(), type: 'galeria',     data: { titulo: 'Ediciones pasadas', urls: [] } },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'countdown',   data: { titulo: 'Faltan', fecha: null } },
          { id: id(), type: 'speakers', data: { titulo: 'Line-up', items: [
            { nombre: 'Artista 1', cargo: 'Headliner', empresa: '', foto: '', bio: '' },
            { nombre: 'Artista 2', cargo: 'Live set', empresa: '', foto: '', bio: '' },
            { nombre: 'Artista 3', cargo: 'Opening', empresa: '', foto: '', bio: '' },
          ]}},
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'direccion',   data: {} },
          { id: id(), type: 'mapa',        data: { titulo: 'Locación', direccion: '' } },
          { id: id(), type: 'video',       data: { titulo: 'Aftermovie de la última edición', url: '' } },
          { id: id(), type: 'redes',       data: { titulo: 'Seguinos', items: [
            { tipo: 'instagram', url: '' },
            { tipo: 'tiktok',    url: '' },
          ]}},
          { id: id(), type: 'cita',        data: { texto: 'La mejor fiesta del año, sin discusión.', autor: '— Asistente edición anterior' } },
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },

  {
    key: 'webinar',
    nombre: 'Webinar / evento virtual',
    desc: 'Online-first: foco en el acceso virtual, agenda y speakers. Para charlas remotas, demos y clases en vivo.',
    accent: 'from-primary/30 to-primary/10',
    preview: ['Hero claro', 'Cómo conectarse', 'Agenda en vivo', 'Speakers'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'Sumate desde donde estés', subtitulo: 'Un evento 100% online. Te mandamos el link de acceso al registrarte.', imagen: '', cta_texto: 'Registrarme gratis', cta_url: '#tickets' } },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'countdown',   data: { titulo: 'Empieza en', fecha: null } },
          { id: id(), type: 'texto', data: {
            titulo: '¿Cómo me conecto?',
            texto: '1. Registrate con tu email.\n2. Recibís el link de acceso por correo (revisá spam).\n3. Te llega un recordatorio 1 hora antes.\n4. Entrás desde cualquier dispositivo, sin instalar nada.',
          }},
          { id: id(), type: 'speakers', data: { titulo: 'Quién expone', items: [
            { nombre: 'Speaker 1', cargo: 'Cargo', empresa: 'Empresa', foto: '', bio: '' },
            { nombre: 'Speaker 2', cargo: 'Cargo', empresa: 'Empresa', foto: '', bio: '' },
          ]}},
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'faq', data: { titulo: 'Preguntas frecuentes', items: [
            { q: '¿Queda grabado?', a: 'Sí, los registrados reciben la grabación por 30 días.' },
            { q: '¿Necesito cámara?', a: 'No, solo escuchás y participás por chat si querés.' },
            { q: '¿Tiene costo?', a: 'Indicado en la sección de inscripción.' },
          ]}},
          { id: id(), type: 'redes', data: { titulo: 'Seguinos', items: [{ tipo: 'linkedin', url: '' }, { tipo: 'youtube', url: '' }] } },
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },

  {
    key: 'networking',
    nombre: 'Networking / meetup',
    desc: 'Comunidad y contactos. Agenda liviana, quién asiste, ubicación clara. Para meetups, afterworks y encuentros.',
    accent: 'from-success/30 to-primary/10',
    preview: ['Hero cálido', 'Para quién es', 'Agenda simple', 'Cómo llegar'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'Conectá con gente de tu área', subtitulo: 'Una noche para conocer colegas, compartir ideas y ampliar tu red.', imagen: '', cta_texto: 'Reservar mi lugar', cta_url: '#tickets' } },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'texto', data: {
            titulo: '¿Para quién es?',
            texto: 'Profesionales, emprendedores y curiosos que quieran ampliar su red en un ambiente relajado. Sin pitch agresivo: charla real.',
          }},
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'texto', data: {
            titulo: 'Cómo es la dinámica',
            texto: '• 19:00 — Recepción y bienvenida.\n• 19:30 — Ronda de presentaciones rápidas.\n• 20:00 — Networking libre + bebida.\n• 21:30 — Cierre.',
          }},
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'direccion',   data: {} },
          { id: id(), type: 'mapa',        data: { titulo: 'Cómo llegar', direccion: '' } },
          { id: id(), type: 'redes',       data: { titulo: 'Seguinos', items: [{ tipo: 'instagram', url: '' }, { tipo: 'linkedin', url: '' }] } },
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },

  {
    key: 'gala',
    nombre: 'Gala / cena benéfica',
    desc: 'Elegante y formal. Causa, patrocinadores destacados, programa de la noche. Para galas, cenas y recaudaciones.',
    accent: 'from-warning/30 to-accent/15',
    preview: ['Hero sobrio', 'La causa', 'Programa', 'Patrocinadores'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'Una noche con propósito', subtitulo: 'Acompañanos en una velada para celebrar y apoyar una causa que importa.', imagen: '', cta_texto: 'Reservar lugar / mesa', cta_url: '#tickets' } },
          { id: id(), type: 'portada',     data: {} },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'texto', data: {
            titulo: 'La causa',
            texto: 'Lo recaudado se destina a [describir la causa / organización beneficiada]. Cada lugar reservado es un aporte directo.',
          }},
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'texto', data: {
            titulo: 'Programa de la noche',
            texto: '• Cóctel de recepción.\n• Cena de gala.\n• Palabras y reconocimiento.\n• Subasta / sorteo a beneficio.\n• Música y cierre.',
          }},
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'direccion',   data: {} },
          { id: id(), type: 'sponsors',    data: { titulo: 'Gracias a quienes hacen posible esta noche', items: [] } },
          { id: id(), type: 'cita',        data: { texto: 'Juntos podemos lograr un impacto real.', autor: '— Comité organizador' } },
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },

  {
    key: 'lanzamiento',
    nombre: 'Lanzamiento de producto',
    desc: 'Expectativa y conversión. Hero fuerte, countdown, video, CTA claro. Para launches, releases y reveals.',
    accent: 'from-accent/30 to-primary/20',
    preview: ['Hero impactante', 'Countdown', 'Video teaser', 'Qué vas a ver'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'Algo nuevo está por llegar', subtitulo: 'Sé de los primeros en verlo. Registrate y te avisamos antes que a nadie.', imagen: '', cta_texto: 'Quiero estar', cta_url: '#tickets' } },
          { id: id(), type: 'countdown',   data: { titulo: 'Revelación en', fecha: null } },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'video',       data: { titulo: 'Teaser', url: '' } },
          { id: id(), type: 'texto', data: {
            titulo: 'Qué vas a ver',
            texto: '• La presentación oficial del producto.\n• Demo en vivo.\n• Preguntas y respuestas con el equipo.\n• Beneficio exclusivo para los que asistan.',
          }},
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'cta',         data: { texto: 'Reservar mi acceso', url: '#tickets', estilo: 'primary' } },
          { id: id(), type: 'redes',       data: { titulo: 'Seguí el lanzamiento', items: [{ tipo: 'instagram', url: '' }, { tipo: 'twitter', url: '' }] } },
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },

  {
    key: 'curso',
    nombre: 'Curso / formación',
    desc: 'Multi-sesión y temario. Agenda detallada, instructor, qué te llevás. Para cursos, diplomados y formaciones.',
    accent: 'from-primary/25 to-success/15',
    preview: ['Hero formativo', 'Temario', 'Instructor', 'Certificado'],
    pages: [
      {
        id: id('p'),
        nombre: 'Inicio',
        blocks: [
          { id: id(), type: 'hero', data: { titulo: 'Formate con un programa serio', subtitulo: 'Varias sesiones, contenido aplicado y acompañamiento. Cupos limitados.', imagen: '', cta_texto: 'Inscribirme', cta_url: '#tickets' } },
          { id: id(), type: 'titulo',      data: {} },
          { id: id(), type: 'descripcion', data: {} },
          { id: id(), type: 'texto', data: {
            titulo: 'Temario',
            texto: '• Módulo 1 — Fundamentos.\n• Módulo 2 — Práctica guiada.\n• Módulo 3 — Casos reales.\n• Módulo 4 — Proyecto final + feedback.',
          }},
          { id: id(), type: 'info',        data: {} },
          { id: id(), type: 'speakers', data: { titulo: 'Tu instructor', items: [
            { nombre: 'Nombre del instructor', cargo: 'Cargo', empresa: 'Empresa', foto: '', bio: 'Experiencia y por qué está calificado para enseñar esto.' },
          ]}},
          { id: id(), type: 'texto', data: {
            titulo: '¿Qué te llevás?',
            texto: '• Certificado de finalización.\n• Material descargable.\n• Acceso a la comunidad de egresados.\n• Grabaciones de cada sesión.',
          }},
          { id: id(), type: 'tickets',     data: {} },
          { id: id(), type: 'faq', data: { titulo: 'Preguntas frecuentes', items: [
            { q: '¿Necesito conocimientos previos?', a: 'Se aclara el nivel requerido al inscribirte.' },
            { q: '¿Las sesiones quedan grabadas?', a: 'Sí, tenés acceso a las grabaciones.' },
            { q: '¿Dan certificado?', a: 'Sí, al completar el programa.' },
          ]}},
          { id: id(), type: 'links',       data: {} },
        ],
      },
    ],
  },
];

export function TemplatesPicker({ onPick, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bg/70 backdrop-blur-md animate-[fadeIn_0.2s_ease_both]" onClick={onCancel}>
      <div className="relative w-full max-w-3xl rounded-t-3xl sm:rounded-3xl border-t sm:border border-border-2 bg-surface shadow-2xl max-h-[88vh] overflow-y-auto animate-[authCardIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-surface px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">Plantillas</p>
            <h2 className="text-xl font-bold font-display tracking-tight text-text-1">Empezá con una base</h2>
          </div>
          <button onClick={onCancel} aria-label="Cerrar"
            className="w-9 h-9 rounded-xl text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-text-2 leading-relaxed">
            Las plantillas reemplazan los bloques actuales de tu página. Tu información (título, fecha, ubicación, tickets) se mantiene — los bloques de sistema se rellenan automáticamente.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {TEMPLATES.map(t => (
              <button key={t.key} onClick={() => onPick(t)}
                className="group text-left rounded-3xl border border-border bg-surface/40 hover:border-primary/40 hover:bg-surface/60 transition-all p-5 overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${t.accent} opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none`} />
                <div className="relative">
                  <h3 className="text-lg font-bold font-display text-text-1 tracking-tight mb-1">{t.nombre}</h3>
                  <p className="text-sm text-text-2 mb-4 leading-relaxed">{t.desc}</p>
                  <ul className="space-y-1.5">
                    {t.preview.map(p => (
                      <li key={p} className="text-xs text-text-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-text-3" /> {p}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs uppercase tracking-widest text-primary-light font-semibold mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Usar esta plantilla →
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper: regenera ids únicos al aplicar el template (evita choques) */
export function instanciarTemplate(template) {
  return template.pages.map(p => ({
    ...p,
    id: id('p'),
    blocks: p.blocks.map(b => ({ ...b, id: id() })),
  }));
}
