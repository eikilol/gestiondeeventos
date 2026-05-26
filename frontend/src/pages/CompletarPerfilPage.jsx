import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { supabase } from '../lib/supabase.js';
import logoG from '../assets/logo-g.svg';
import { InlineLoader } from '../components/ui/PageLoader.jsx';
import AvatarUploader from '../components/ui/AvatarUploader.jsx';

const PARTICIPANTES = ['Menos de 50', '50 – 200', '200 – 1.000', 'Más de 1.000'];

/* Stagger helper compartido con AuthPage */
const stagger = (i = 0) => ({
  className: 'animate-[fadeUp_0.55s_cubic-bezier(0.16,1,0.3,1)_both]',
  style: { animationDelay: `${i * 70}ms` },
});

export default function CompletarPerfilPage() {
  const { usuario, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre       : usuario?.nombre        || '',
    avatar_url   : usuario?.foto          || '',
    telefono     : usuario?.telefono      || '',
    empresa      : usuario?.empresa       || '',
    ocupacion    : usuario?.ocupacion     || '',
    ciudad       : usuario?.ciudad        || '',
    participantes: usuario?.participantes || '',
    contexto     : usuario?.contexto      || '',
    aceptar      : false,
  });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const change = (k, v) => { setErr(''); setForm(f => ({ ...f, [k]: v })); };

  const initials = form.nombre?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';

  const handleVolver = async () => {
    await logout();
    navigate('/login');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.aceptar)            { setErr('Debes aceptar los términos para continuar.'); return; }
    if (!form.telefono.trim())    { setErr('Tu teléfono nos ayuda a contactarte sobre tus eventos.'); return; }
    if (!form.nombre.trim())      { setErr('Tu nombre es obligatorio.'); return; }

    setLoading(true);
    try {
      const { error: e1 } = await supabase.auth.updateUser({
        data: {
          nombre        : form.nombre,
          foto          : form.avatar_url,
          telefono      : form.telefono,
          empresa       : form.empresa,
          ocupacion     : form.ocupacion,
          ciudad        : form.ciudad,
          participantes : form.participantes,
          contexto      : form.contexto,
          perfil_completo: true,
        },
      });
      if (e1) throw new Error(e1.message);

      const { error: e2 } = await supabase
        .from('profiles')
        .update({
          nombre    : form.nombre,
          avatar_url: form.avatar_url || null,
          telefono  : form.telefono,
          empresa   : form.empresa,
          ocupacion : form.ocupacion,
          ciudad    : form.ciudad,
        })
        .eq('id', usuario.id);
      if (e2) throw new Error(e2.message);

      success('Bienvenido a GESTEK.');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErr(e.message);
      toastError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg text-text-1 overflow-hidden px-4 py-12 animate-[fadeIn_0.4s_ease_both]">
      {/* Fondos con glow respirando */}
      <div className="fixed inset-0 pointer-events-none -z-0">
        <div className="absolute top-1/4 left-0 w-[700px] h-[700px] rounded-full bg-primary/15 blur-[160px] animate-[glowPulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[140px] animate-[glowPulse_10s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* Volver — top-left */}
      <button
        onClick={handleVolver}
        className="fixed top-5 left-5 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/80 backdrop-blur-md text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface transition-all group animate-[fadeUp_0.5s_ease_both]"
        style={{ animationDelay: '40ms' }}
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Salir y volver al login
      </button>

      <div className="relative w-full max-w-xl">
        {/* Header */}
        <div {...stagger(0)} className={`${stagger(0).className} flex items-center gap-3 mb-3`}>
          <img src={logoG} alt="GESTEK" className="w-9 h-9 drop-shadow-[0_0_14px_rgba(16,185,129,0.45)] animate-[float_5s_ease-in-out_infinite]" />
          <span className="font-display font-bold text-xl tracking-tight">GESTEK</span>
        </div>

        <p {...stagger(1)} className={`${stagger(1).className} text-xs uppercase tracking-widest text-primary-light font-semibold mb-3`}>
          Casi listo
        </p>
        <h1 {...stagger(2)} className={`${stagger(2).className} text-4xl sm:text-5xl font-bold font-display tracking-tight leading-[1.05] mb-3`}>
          Completa tu perfil.
        </h1>
        <p {...stagger(3)} className={`${stagger(3).className} text-base text-text-2 leading-relaxed mb-10`}>
          Conectaste con <span className="text-text-1 font-medium">{usuario?.email}</span>. Solo necesitamos unos datos más para preparar tu entorno de trabajo.
        </p>

        <form onSubmit={onSubmit} className="space-y-7">
          {err && (
            <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm animate-[fadeUp_0.3s_ease_both]">
              {err}
            </div>
          )}

          {/* SECCIÓN 1 — Foto y nombre */}
          <div {...stagger(4)} className={`${stagger(4).className} rounded-3xl border border-border bg-surface/40 p-6`}>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-4">Tu identidad</p>

            <AvatarUploader
              value={form.avatar_url}
              onChange={url => change('avatar_url', url)}
              userId={usuario?.id}
              initials={initials}
              size={88}
            />

            <div className="field mt-5">
              <label className="label">Tu nombre</label>
              <input
                name="nombre" value={form.nombre} onChange={e => change('nombre', e.target.value)}
                className="input rounded-2xl py-3 text-base" required autoFocus
                placeholder="Como quieres que te vean"
              />
            </div>
          </div>

          {/* SECCIÓN 2 — Contacto y ubicación */}
          <div {...stagger(5)} className={`${stagger(5).className} rounded-3xl border border-border bg-surface/40 p-6 space-y-4`}>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">Contacto</p>

            <div className="field">
              <label className="label">Teléfono *</label>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <select className="input rounded-2xl py-3">
                  <option>+57 CO</option><option>+1 US</option><option>+34 ES</option><option>+52 MX</option>
                </select>
                <input
                  value={form.telefono} onChange={e => change('telefono', e.target.value)}
                  className="input rounded-2xl py-3 text-base" placeholder="300 000 0000" required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Empresa</label>
                <input
                  value={form.empresa} onChange={e => change('empresa', e.target.value)}
                  className="input rounded-2xl py-3 text-base" placeholder="Tu empresa"
                />
              </div>
              <div className="field">
                <label className="label">Ocupación</label>
                <input
                  value={form.ocupacion} onChange={e => change('ocupacion', e.target.value)}
                  className="input rounded-2xl py-3 text-base" placeholder="Productor de eventos"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Ciudad</label>
              <input
                value={form.ciudad} onChange={e => change('ciudad', e.target.value)}
                className="input rounded-2xl py-3 text-base" placeholder="Ibagué, Colombia"
              />
            </div>
          </div>

          {/* SECCIÓN 3 — Sobre tus eventos */}
          <div {...stagger(6)} className={`${stagger(6).className} rounded-3xl border border-border bg-surface/40 p-6 space-y-4`}>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">Sobre tus eventos</p>

            <div className="field">
              <label className="label">Tamaño típico</label>
              <select
                value={form.participantes} onChange={e => change('participantes', e.target.value)}
                className="input rounded-2xl py-3 text-base"
              >
                <option value="">Seleccionar...</option>
                {PARTICIPANTES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label">Cuéntanos un poco más</label>
              <textarea
                rows={2}
                value={form.contexto} onChange={e => change('contexto', e.target.value)}
                className="input rounded-2xl py-3 text-base resize-none"
                placeholder="Qué eventos organizas, frecuencia e industria. Sirve para personalizar tu experiencia."
              />
            </div>
          </div>

          {/* Aceptar términos */}
          <label {...stagger(7)} className={`${stagger(7).className} flex items-start gap-3 cursor-pointer`}>
            <input
              type="checkbox" checked={form.aceptar}
              onChange={e => change('aceptar', e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border bg-surface-2 accent-primary"
            />
            <span className="text-xs text-text-2 leading-relaxed">
              Acepto los <a className="underline text-text-1 hover:text-primary-light" href="#">términos</a> y la <a className="underline text-text-1 hover:text-primary-light" href="#">política de privacidad</a>. Acepto recibir comunicaciones de GESTEK.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            {...stagger(8)}
            className={`${stagger(8).className} w-full py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_30px_rgba(241,245,249,0.18)] hover:shadow-[0_0_40px_rgba(241,245,249,0.28)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
          >
            {loading ? <InlineLoader message="Guardando..." /> : 'Completar y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
