import logoG from '../../assets/logo-g.svg';

/* Loader animado con el logo G girando + glow.
   Reemplaza spinners de pantalla completa para mantener identidad de marca. */

export default function GLoader({ size = 'md', message, fullscreen = false }) {
  const px = size === 'xl' ? 88 : size === 'lg' ? 64 : size === 'sm' ? 32 : 48;

  const inner = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: px, height: px }}>
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-[glowPulse_2s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.6), transparent 70%)' }}
        />
        <img
          src={logoG}
          alt="Cargando"
          className="relative w-full h-full animate-[wheelSpin_1.6s_cubic-bezier(0.6,-0.05,0.2,1.05)_infinite] drop-shadow-[0_0_18px_rgba(16,185,129,0.55)]"
        />
      </div>
      {message && (
        <p className="text-sm text-text-2 font-medium animate-[pulseSoft_2s_ease-in-out_infinite]">
          {message}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm">
        {inner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {inner}
    </div>
  );
}
