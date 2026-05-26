import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import logoG from '../assets/logo-g.svg';
import { InlineLoader } from '../components/ui/PageLoader.jsx';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [pwd, setPwd]     = useState('');
  const [pwd2, setPwd2]   = useState('');
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');
  const [done, setDone]   = useState(false);

  /* Supabase usa flow PKCE: la URL trae un token que getSession() recoge
     automaticamente cuando detectSessionInUrl=true. Aqui solo confirmamos que
     hay sesion recovery valida. */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setErr('El enlace de recuperación es inválido o expiró. Solicita uno nuevo.');
    });
  }, []);

  const onSubmit = async e => {
    e.preventDefault();
    if (pwd.length < 8) { setErr('Mínimo 8 caracteres.'); return; }
    if (pwd !== pwd2)   { setErr('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    setErr('');
    const res = await updatePassword(pwd);
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-bg text-text-1 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-accent/15 blur-[160px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <Link
        to="/login"
        className="fixed top-5 left-5 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/80 backdrop-blur-md text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </Link>

      <div className="relative w-full max-w-md animate-[authCardIn_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-center gap-3 mb-8">
          <img src={logoG} alt="GESTEK" className="h-12 w-12 drop-shadow-[0_0_18px_rgba(6,182,212,0.45)]" />
          <span className="text-2xl font-bold font-display tracking-tight">GESTEK</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/15 border border-success/30 mb-6">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight mb-3">
              Contraseña actualizada
            </h1>
            <p className="text-base text-text-2">Redirigiendo al dashboard...</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2">
              Nueva contraseña
            </h1>
            <p className="text-base text-text-2 mb-8">
              Elige una contraseña segura de al menos 8 caracteres.
            </p>

            {!ready && err && (
              <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm mb-5">
                {err}
                <p className="mt-3">
                  <Link to="/recuperar" className="underline font-semibold">Solicitar enlace nuevo</Link>
                </p>
              </div>
            )}

            {ready && (
              <form onSubmit={onSubmit} className="space-y-5">
                {err && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger-light text-sm">{err}</div>}

                <div className="field">
                  <label className="label">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={pwd}
                      onChange={e => { setErr(''); setPwd(e.target.value); }}
                      className="input rounded-2xl py-3.5 pr-12 text-base"
                      placeholder="••••••••"
                      minLength={8}
                      required
                      autoFocus
                    />
                    <button
                      type="button" onClick={() => setShow(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-3 hover:text-text-1"
                      aria-label={show ? 'Ocultar' : 'Mostrar'}
                    >
                      {show
                        ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-3.42M9.88 4.24A10.07 10.07 0 0112 4c5 0 9 4 10 8a13.43 13.43 0 01-2.6 3.94M6.6 6.6A13.43 13.43 0 002 12c1 4 5 8 10 8 1.59 0 3.07-.39 4.36-1.06"/></svg>
                        : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label className="label">Confirmar contraseña</label>
                  <input
                    type={show ? 'text' : 'password'}
                    value={pwd2}
                    onChange={e => { setErr(''); setPwd2(e.target.value); }}
                    className="input rounded-2xl py-3.5 text-base"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-base font-semibold bg-text-1 text-bg hover:bg-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <InlineLoader message="Guardando..." /> : 'Actualizar contraseña'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
