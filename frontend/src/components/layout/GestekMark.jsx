/* Marca GESTEK — criatura dorada (topo/gema). Reemplaza el logo plano.
   `glow` resalta más cuando el plan es Pro. */

export default function GestekMark({ size = 40, glow = false }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64" aria-label="GESTEK"
      style={glow ? { filter: 'drop-shadow(0 0 10px rgba(245,200,90,0.55))' } : undefined}
    >
      <defs>
        <linearGradient id="gk-gold" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%"  stopColor="#FCEFA1" />
          <stop offset="45%" stopColor="#E9B23C" />
          <stop offset="100%" stopColor="#A6731B" />
        </linearGradient>
        <radialGradient id="gk-gold-sheen" cx="35%" cy="28%" r="70%">
          <stop offset="0%"  stopColor="#FFF6D6" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#FFF6D6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* cuerpo redondeado de la criatura */}
      <path d="M32 6
               C 46 6 56 17 56 32
               C 56 47 47 58 32 58
               C 17 58 8 47 8 32
               C 8 17 18 6 32 6 Z"
            fill="url(#gk-gold)" stroke="#7A5212" strokeWidth="1.5" />
      <path d="M32 6 C 46 6 56 17 56 32 C 56 47 47 58 32 58 C 17 58 8 47 8 32 C 8 17 18 6 32 6 Z"
            fill="url(#gk-gold-sheen)" />

      {/* hocico / nariz del topo */}
      <ellipse cx="32" cy="40" rx="9" ry="7" fill="#5C3D0E" opacity="0.85" />
      <circle cx="32" cy="38" r="3.4" fill="#2E1F07" />

      {/* ojitos */}
      <circle cx="24" cy="29" r="3.2" fill="#2E1F07" />
      <circle cx="40" cy="29" r="3.2" fill="#2E1F07" />
      <circle cx="25.1" cy="27.9" r="1" fill="#FFF6D6" />
      <circle cx="41.1" cy="27.9" r="1" fill="#FFF6D6" />

      {/* garritas (toque "topo") */}
      <path d="M19 49 l3 -6 M24 51 l2 -6 M40 51 l2 -6 M45 49 l3 -6"
            stroke="#7A5212" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
