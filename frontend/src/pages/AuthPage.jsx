import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import logoG from '../assets/logo-g.svg';
import { InlineLoader } from '../components/ui/PageLoader.jsx';
import AvatarUploader, { uploadAvatarFile } from '../components/ui/AvatarUploader.jsx';
import { supabase } from '../lib/supabase.js';

const PARTICIPANTES = ['Menos de 50', '50 – 200', '200 – 1.000', 'Más de 1.000'];
const DUR_OUT = 420;
const DUR_IN  = 520;

/* Helper para entrada en cascada (stagger). Acepta delay en ms. */
const stagger = (i = 0) => ({
  className: 'animate-[fadeUp_0.55s_cubic-bezier(0.16,1,0.3,1)_both]',
  style: { animationDelay: `${i * 70}ms` },
});

export default function AuthPage() {
  const { pathname } = useLocation();
  const mode = pathname.startsWith('/register') ? 'register' : 'login';

  const [displayMode, setDisplayMode] = useState(mode);
  const [phase, setPhase] = useState('idle'); // idle | out | in

  useEffect(() => {
    if (mode === displayMode) return;
    setPhase('out');
    const t1 = setTimeout(() => {
      setDisplayMode(mode);
      setPhase('in');
      const t2 = setTimeout(() => setPhase('idle'), DUR_IN);
      return () => clearTimeout(t2);
    }, DUR_OUT);
    return () => clearTimeout(t1);
  }, [mode, displayMode]);

  const isLogin = displayMode === 'login';

  /* Animations:
     Login: form izquierda, texto derecha
     Register: form derecha, texto izquierda
     OUT: cada lado se desplaza hacia el centro y desaparece
     IN: nuevo contenido aparece desde el centro hacia su lado final  */
  const formAnim =
    phase === 'out'
      ? (isLogin ? 'animate-auth-out-right' : 'animate-auth-out-left')
      : phase === 'in'
      ? (isLogin ? 'animate-auth-in-right' : 'animate-auth-in-left')
      : '';
  const textAnim =
    phase === 'out'
      ? (isLogin ? 'animate-auth-out-left' : 'animate-auth-out-right')
      : phase === 'in'
      ? (isLogin ? 'animate-auth-in-left' : 'animate-auth-in-right')
      : '';

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg text-text-1 overflow-hidden px-4 sm:px-8 py-12 animate-[fadeIn_0.4s_ease_both]">
      <BackgroundGlows isLogin={isLogin} />

      {/* Back button — top left of viewport, always visible */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/80 backdrop-blur-md text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface transition-all group animate-[fadeUp_0.5s_ease_both]"
        style={{ animationDelay: '40ms' }}
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </Link>

      <div className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* FORM panel */}
        <div className={`${isLogin ? 'lg:order-1' : 'lg:order-2'} ${formAnim} will-change-transform`}>
          <div className="w-full max-w-md mx-auto">
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>

        {/* TEXT panel */}
        <div className={`${isLogin ? 'lg:order-2' : 'lg:order-1'} ${textAnim} will-change-transform hidden lg:block`}>
          <div className="max-w-md mx-auto">
            {isLogin ? <LoginText /> : <RegisterText />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Background ─────────── */
function BackgroundGlows({ isLogin }) {
  return (
    <div className="fixed inset-0 pointer-events-none -z-0">
      <div className={`absolute w-[700px] h-[700px] rounded-full blur-[160px] transition-all duration-1000 animate-[glowPulse_8s_ease-in-out_infinite] ${isLogin ? 'top-1/3 left-0 bg-primary/15' : 'top-1/3 right-0 bg-accent/15'}`} />
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-1000 animate-[glowPulse_10s_ease-in-out_infinite] ${isLogin ? 'bottom-0 right-1/4 bg-accent/10' : 'bottom-0 left-1/4 bg-primary/10'}`} style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
    </div>
  );
}

/* ─────────── LOGIN ─────────── */
function LoginText() {
  return (
    <div className="space-y-6">
      <Link to="/" {...stagger(0)} className={`${stagger(0).className} inline-flex items-center gap-3 group`}>
        <img src={logoG} alt="GESTEK" className="h-12 w-12 transition-transform group-hover:scale-110 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)] animate-[float_5s_ease-in-out_infinite]" />
        <span className="text-2xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>
      <h2 {...stagger(1)} className={`${stagger(1).className} text-4xl xl:text-5xl font-bold font-display tracking-tight leading-[1.05]`}>
        Bienvenido de vuelta.
      </h2>
      <p {...stagger(2)} className={`${stagger(2).className} text-lg text-text-2 leading-relaxed`}>
        Tu plataforma de eventos te está esperando. Gestiona inscripciones,
        asistencia, pagos y comunidad desde un solo lugar.
      </p>
      <div {...stagger(3)} className={`${stagger(3).className} flex items-center gap-3 pt-4 border-t border-border-2`}>
        <div className="flex -space-x-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-9 h-9 rounded-full border-2 border-bg bg-gradient-to-br ${
              i === 0 ? 'from-primary to-accent' : i === 1 ? 'from-accent to-success' : 'from-success to-primary'
            }`} />
          ))}
        </div>
        <p className="text-sm text-text-2">Únete a los organizadores que ya usan GESTEK</p>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login, signInWithGoogle } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    if (!res.ok) { toastError(res.error); setGoogleLoading(false); }
    /* Si OK, Supabase hace redirect — no necesitamos hacer nada más */
  };

  const onChange = e => { setErr(''); setForm(f => ({ ...f, [e.target.name]: e.target.value })); };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.ok) navigate('/dashboard');
    else { setErr(res.error); toastError(res.error); }
  };

  return (
    <div>
      <Link to="/" {...stagger(0)} className={`${stagger(0).className} lg:hidden inline-flex items-center gap-2 mb-8`}>
        <img src={logoG} alt="GESTEK" className="h-10 w-10" />
        <span className="text-xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>

      <h1 {...stagger(0)} className={`${stagger(0).className} text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1 mb-2`}>
        Iniciar sesión
      </h1>
      <p {...stagger(1)} className={`${stagger(1).className} text-base text-text-2 mb-8`}>
        ¿Aún no tienes cuenta?{' '}
        <Link to="/register" className="text-primary-light hover:text-primary font-semibold transition-colors">
          Crear una gratis
        </Link>
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        {...stagger(2)}
        className={`${stagger(2).className} w-full mb-5 py-3.5 rounded-2xl border border-border-2 bg-surface hover:bg-surface-2 text-text-1 font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01] hover:border-text-3 active:scale-[0.99] disabled:opacity-60`}
      >
        <GoogleIcon className="w-5 h-5" />
        {googleLoading ? 'Conectando…' : 'Continuar con Google'}
      </button>

      <div {...stagger(3)} className={`${stagger(3).className} flex items-center gap-3 mb-5`}>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] uppercase tracking-widest text-text-3">o con email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={onSubmit} {...stagger(4)} className={`${stagger(4).className} space-y-5`}>
        {err && (
          <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>
        )}

        <div className="field">
          <label className="label">Email</label>
          <input
            type="email" name="email" value={form.email} onChange={onChange}
            className="input rounded-2xl py-3.5 text-base" placeholder="tu@empresa.com"
            required autoFocus autoComplete="email"
          />
        </div>

        <div className="field">
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">Contraseña</label>
            <Link to="/recuperar" className="text-xs text-text-2 hover:text-primary-light transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} name="password"
              value={form.password} onChange={onChange}
              className="input rounded-2xl py-3.5 pr-12 text-base" placeholder="••••••••"
              required autoComplete="current-password"
            />
            <button
              type="button" onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? 'Ocultar' : 'Mostrar'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2"
            >
              {showPwd
                ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-3.42M9.88 4.24A10.07 10.07 0 0112 4c5 0 9 4 10 8a13.43 13.43 0 01-2.6 3.94M6.6 6.6A13.43 13.43 0 002 12c1 4 5 8 10 8 1.59 0 3.07-.39 4.36-1.06"/></svg>
                : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_30px_rgba(241,245,249,0.18)] hover:shadow-[0_0_40px_rgba(241,245,249,0.28)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? <InlineLoader message="Iniciando sesión..." /> : 'Iniciar sesión'}
        </button>
      </form>

      <p {...stagger(5)} className={`${stagger(5).className} text-center text-xs text-text-3 mt-8`}>
        Al iniciar sesión aceptas nuestros términos de uso y política de privacidad.
      </p>
    </div>
  );
}

/* ─────────── REGISTER ─────────── */
function RegisterText() {
  return (
    <div className="space-y-6">
      <Link to="/" {...stagger(0)} className={`${stagger(0).className} inline-flex items-center gap-3 group`}>
        <img src={logoG} alt="GESTEK" className="h-12 w-12 transition-transform group-hover:scale-110 drop-shadow-[0_0_18px_rgba(6,182,212,0.45)] animate-[float_5s_ease-in-out_infinite]" />
        <span className="text-2xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>
      <p {...stagger(1)} className={`${stagger(1).className} text-xs uppercase tracking-widest text-accent-light font-semibold`}>
        Plataforma todo-en-uno · Gratis para siempre
      </p>
      <h2 {...stagger(2)} className={`${stagger(2).className} text-4xl xl:text-5xl font-bold font-display tracking-tight leading-[1.05]`}>
        Crea tu cuenta y monta tu primer evento hoy.
      </h2>
      <p {...stagger(3)} className={`${stagger(3).className} text-lg text-text-2 leading-relaxed`}>
        Cuéntanos lo básico y preparamos tu entorno de trabajo. Si tienes Pro,
        el agente IA propone bloques iniciales según tu contexto.
      </p>
      <div {...stagger(4)} className={`${stagger(4).className} grid grid-cols-2 gap-3 pt-4 border-t border-border-2`}>
        {[
          ['Eventos ilimitados', 'Sin caducidad'],
          ['Pagos BRE-B', 'Sin comisión'],
          ['QR + Gamificación', 'Incluido'],
          ['Multi-usuario', 'Roles granulares'],
        ].map(([k, v], i) => (
          <div
            key={k}
            className="rounded-2xl border border-border bg-surface/40 p-3 transition-all duration-200 hover:border-border-2 hover:bg-surface/60 hover:-translate-y-0.5 animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ animationDelay: `${350 + i * 60}ms` }}
          >
            <p className="text-sm font-semibold text-text-1">{k}</p>
            <p className="text-xs text-text-3 mt-0.5">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterForm() {
  const { register, resendConfirmation, signInWithGoogle } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 | 2 | 'sent'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState('');

  const [paso1, setPaso1] = useState({
    nombre: '', email: '', telefono: '', participantes: '', contexto: '', password: '',
  });
  const [paso2, setPaso2] = useState({
    fotoFile: null, ocupacion: '', empresa: '', ciudad: '', aceptar: false,
  });

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    if (!res.ok) { toastError(res.error); setGoogleLoading(false); }
  };

  const onChange1 = e => { setErr(''); setPaso1(f => ({ ...f, [e.target.name]: e.target.value })); };
  const onChange2 = e => { setErr(''); setPaso2(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); };

  const submitPaso1 = e => {
    e.preventDefault();
    if (paso1.password.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return; }
    setStep(2);
  };

  const submitFinal = async e => {
    e.preventDefault();
    if (!paso2.aceptar) { setErr('Debes aceptar los términos para continuar.'); return; }
    setLoading(true);
    setErr('');
    const res = await register({
      nombre: paso1.nombre,
      email: paso1.email,
      password: paso1.password,
      rol: 'organizador',
      telefono: paso1.telefono,
      participantes: paso1.participantes,
      contexto: paso1.contexto,
      ocupacion: paso2.ocupacion,
      empresa: paso2.empresa,
      ciudad: paso2.ciudad,
    });

    /* Si hay foto pendiente, intentamos subirla con el id recién creado.
       Si falla no rompemos el registro — la cuenta queda creada igual. */
    if (res.ok && paso2.fotoFile && res.data?.user?.id) {
      try {
        const url = await uploadAvatarFile(paso2.fotoFile, res.data.user.id);
        await supabase.auth.updateUser({ data: { foto: url } });
      } catch (e) {
        console.warn('[register] upload avatar falló (no crítico):', e.message);
      }
    }

    setLoading(false);
    if (res.ok) {
      if (res.requiresConfirmation) {
        setStep('sent');
      } else {
        success('Cuenta creada exitosamente.');
        setTimeout(() => navigate('/dashboard'), 800);
      }
    } else {
      setErr(res.error);
      toastError(res.error);
    }
  };

  const onResend = async () => {
    setLoading(true);
    const res = await resendConfirmation(paso1.email);
    setLoading(false);
    if (res.ok) success('Correo reenviado.');
    else toastError(res.error);
  };

  return (
    <div>
      <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6">
        <img src={logoG} alt="GESTEK" className="h-10 w-10" />
        <span className="text-xl font-bold font-display tracking-tight">GESTEK</span>
      </Link>

      {step !== 'sent' && (
      <div {...stagger(0)} className={`${stagger(0).className} flex items-center gap-3 mb-7`}>
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              step >= n ? 'bg-text-1 text-bg scale-100' : 'bg-surface-2 text-text-3 border border-border scale-95'
            }`}>{n}</span>
            <span className={`text-xs font-medium transition-colors duration-300 ${step >= n ? 'text-text-1' : 'text-text-3'}`}>
              {n === 1 ? 'Acceso gratis' : 'Perfil del organizador'}
            </span>
            {n === 1 && <span className={`flex-1 h-px transition-colors duration-500 ${step >= 2 ? 'bg-text-1' : 'bg-border'}`} />}
          </div>
        ))}
      </div>
      )}

      {step === 'sent' && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/15 border border-success/30 mb-6">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-3">Revisa tu correo</h1>
          <p className="text-base text-text-2 mb-2">
            Te enviamos un enlace de confirmación a
          </p>
          <p className="text-base text-text-1 font-semibold mb-6">{paso1.email}</p>
          <p className="text-sm text-text-3 mb-8">
            Haz click en el enlace para activar tu cuenta. Si no llega en 2 minutos, revisa la carpeta de spam.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onResend}
              disabled={loading}
              className="px-5 py-2.5 rounded-full border border-border-2 text-text-1 hover:bg-surface-2 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? 'Reenviando...' : 'Reenviar correo'}
            </button>
            <Link to="/login" className="px-5 py-2.5 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold transition-colors">
              Ir al login
            </Link>
          </div>
        </div>
      )}

      {step === 1 && (
        <div key="step1" className="animate-[fadeUp_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
          <h1 {...stagger(1)} className={`${stagger(1).className} text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2`}>Acceder gratis</h1>
          <p {...stagger(2)} className={`${stagger(2).className} text-base text-text-2 mb-6`}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-light hover:text-primary font-semibold transition-colors">Iniciar sesión</Link>
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            {...stagger(3)}
            className={`${stagger(3).className} w-full mb-5 py-3.5 rounded-2xl border border-border-2 bg-surface hover:bg-surface-2 text-text-1 font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01] hover:border-text-3 active:scale-[0.99] disabled:opacity-60`}
          >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading ? 'Conectando…' : 'Registrarme con Google'}
          </button>

          <div {...stagger(4)} className={`${stagger(4).className} flex items-center gap-3 mb-5`}>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] uppercase tracking-widest text-text-3">o con email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submitPaso1} {...stagger(5)} className={`${stagger(5).className} space-y-4`}>
            {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Nombre</label>
                <input name="nombre" value={paso1.nombre} onChange={onChange1}
                  className="input rounded-2xl py-3 text-base" placeholder="Juan Pérez" required autoFocus />
              </div>
              <div className="field">
                <label className="label">Email empresarial</label>
                <input type="email" name="email" value={paso1.email} onChange={onChange1}
                  className="input rounded-2xl py-3 text-base" placeholder="juan@empresa.com" required />
              </div>
            </div>

            <div className="field">
              <label className="label">Teléfono</label>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <select className="input rounded-2xl py-3"><option>+57 CO</option><option>+1 US</option><option>+34 ES</option><option>+52 MX</option></select>
                <input name="telefono" value={paso1.telefono} onChange={onChange1}
                  className="input rounded-2xl py-3 text-base" placeholder="300 000 0000" />
              </div>
            </div>

            <div className="field">
              <label className="label">Número esperado de participantes</label>
              <select name="participantes" value={paso1.participantes} onChange={onChange1} className="input rounded-2xl py-3 text-base" required>
                <option value="">Seleccionar...</option>
                {PARTICIPANTES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label">Para preparar tu entorno de trabajo</label>
              <textarea
                name="contexto" value={paso1.contexto} onChange={onChange1} rows={2}
                className="input rounded-2xl py-3 text-base resize-none"
                placeholder="Qué eventos organizas, frecuencia e industria. El agente IA usará esto."
              />
            </div>

            <div className="field">
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} name="password" value={paso1.password} onChange={onChange1}
                  className="input rounded-2xl py-3 pr-12 text-base" placeholder="Mínimo 8 caracteres" minLength={8} required />
                <button
                  type="button" onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2"
                >
                  {showPwd
                    ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-3.42M9.88 4.24A10.07 10.07 0 0112 4c5 0 9 4 10 8a13.43 13.43 0 01-2.6 3.94M6.6 6.6A13.43 13.43 0 002 12c1 4 5 8 10 8 1.59 0 3.07-.39 4.36-1.06"/></svg>
                    : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-text-3 leading-relaxed">
              Al continuar aceptas nuestros{' '}
              <a className="underline text-text-2 hover:text-text-1" href="#">términos</a> y{' '}
              <a className="underline text-text-2 hover:text-text-1" href="#">política de privacidad</a>.
            </p>

            <button type="submit" className="w-full py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_0_40px_rgba(241,245,249,0.25)]">
              Continuar
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div key="step2" className="animate-[fadeUp_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2">Perfil del organizador</h1>
          <p className="text-base text-text-2 mb-6">
            Estos datos aparecen en tu página pública y en los correos a tus asistentes.
          </p>

          <form onSubmit={submitFinal} className="space-y-4">
            {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <AvatarUploader
                value={paso2.fotoFile}
                onChange={file => setPaso2(p => ({ ...p, fotoFile: file }))}
                initials={paso1.nombre?.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || 'U'}
                size={80}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Ocupación</label>
                <input name="ocupacion" value={paso2.ocupacion} onChange={onChange2}
                  className="input rounded-2xl py-3 text-base" placeholder="Productor de eventos" />
              </div>
              <div className="field">
                <label className="label">Empresa <span className="text-text-3 lowercase tracking-normal font-normal">(opcional)</span></label>
                <input name="empresa" value={paso2.empresa} onChange={onChange2}
                  className="input rounded-2xl py-3 text-base" placeholder="Tu empresa" />
              </div>
            </div>

            <div className="field">
              <label className="label">Ciudad</label>
              <input name="ciudad" value={paso2.ciudad} onChange={onChange2}
                className="input rounded-2xl py-3 text-base" placeholder="Ibagué, Colombia" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="aceptar" checked={paso2.aceptar} onChange={onChange2}
                className="mt-1 w-4 h-4 rounded border-border bg-surface-2 accent-primary" />
              <span className="text-xs text-text-2 leading-relaxed">
                Acepto recibir comunicaciones por correo de GESTEK. Puedo darme de baja cuando quiera.
              </span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-2xl text-base font-medium text-text-1 border border-border-2 hover:bg-surface-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
                Atrás
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_0_40px_rgba(241,245,249,0.25)] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {loading ? <InlineLoader message="Creando cuenta..." /> : 'Registrarme'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
