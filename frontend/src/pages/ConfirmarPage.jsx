import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import logoG from '../assets/logo-g.svg';

export default function ConfirmarPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    /* Supabase detectSessionInUrl procesa el hash automaticamente.
       Solo verificamos si la sesion fue creada satisfactoriamente. */
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }
      if (data.session?.user) {
        setStatus('success');
        setMessage(data.session.user.email);
        /* Si el usuario llego aqui por el link del email de confirmacion,
           ya tiene sesion activa. Lo mandamos al dashboard. */
        setTimeout(() => navigate('/dashboard'), 2200);
      } else {
        setStatus('error');
        setMessage('El enlace de confirmación es inválido o expiró.');
      }
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-bg text-text-1 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-success/15 blur-[160px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <div className="relative w-full max-w-md text-center animate-[authCardIn_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src={logoG} alt="GESTEK" className="h-14 w-14 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
          <span className="text-2xl font-bold font-display tracking-tight">GESTEK</span>
        </div>

        {status === 'checking' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 border border-border mb-6">
              <div className="w-7 h-7 rounded-full border-2 border-border border-t-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight mb-3">Confirmando tu cuenta...</h1>
            <p className="text-base text-text-2">Un momento por favor.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/15 border border-success/30 mb-6">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight mb-3">Cuenta confirmada</h1>
            <p className="text-base text-text-2 mb-2">
              <span className="text-text-1 font-semibold">{message}</span>
            </p>
            <p className="text-sm text-text-3">Redirigiendo al dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-danger/15 border border-danger/30 mb-6">
              <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight mb-3">No pudimos confirmar tu cuenta</h1>
            <p className="text-base text-text-2 mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="px-6 py-3 rounded-full bg-text-1 text-bg hover:bg-white text-sm font-semibold transition-colors">
                Crear cuenta nueva
              </Link>
              <Link to="/login" className="px-6 py-3 rounded-full border border-border-2 text-text-1 hover:bg-surface-2 text-sm font-medium transition-colors">
                Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
