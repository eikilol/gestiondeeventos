import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logoG from '../assets/logo-g.svg';
import { InlineLoader } from '../components/ui/PageLoader.jsx';

export default function RecuperarPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const res = await resetPassword(email);
    setLoading(false);
    if (res.ok) setSent(true);
    else setErr(res.error);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-bg text-text-1 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/15 blur-[160px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <Link
        to="/login"
        className="fixed top-5 left-5 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/80 backdrop-blur-md text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface transition-all group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al login
      </Link>

      <div className="relative w-full max-w-md animate-[authCardIn_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-center gap-3 mb-8">
          <img src={logoG} alt="GESTEK" className="h-12 w-12 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
          <span className="text-2xl font-bold font-display tracking-tight">GESTEK</span>
        </div>

        {!sent && (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2">
              Recuperar contraseña
            </h1>
            <p className="text-base text-text-2 mb-8">
              Ingresa el email asociado a tu cuenta y te enviaremos un enlace para restablecerla.
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              {err && (
                <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>
              )}

              <div className="field">
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setErr(''); setEmail(e.target.value); }}
                  className="input rounded-2xl py-3.5 text-base"
                  placeholder="tu@empresa.com"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all shadow-[0_0_30px_rgba(241,245,249,0.18)] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <InlineLoader message="Enviando enlace..." /> : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <p className="text-center text-sm text-text-2 mt-8">
              ¿Recordaste tu contraseña?{' '}
              <Link to="/login" className="text-primary-light hover:text-primary font-semibold transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </>
        )}

        {sent && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/15 border border-success/30 mb-6">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight mb-3">
              Revisa tu correo
            </h1>
            <p className="text-base text-text-2 mb-8">
              Te enviamos un enlace a <span className="text-text-1 font-semibold">{email}</span> para
              restablecer tu contraseña. Si no llega en 2 minutos, revisa la carpeta de spam.
            </p>
            <Link to="/login" className="inline-block px-6 py-3 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold transition-colors">
              Volver al login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
