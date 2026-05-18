/* Marca GESTEK — lettermark "G".
   - Free: gradiente de marca (azul→violeta).
   - Pro : gradiente DORADO + glow (destacable). */

export default function GestekMark({ size = 42, pro = false }) {
  const grad = pro ? 'gk-g-gold' : 'gk-g-brand';
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64" aria-label="GESTEK"
      style={pro ? { filter: 'drop-shadow(0 0 11px rgba(233,178,60,0.55))' } : undefined}
    >
      <defs>
        <linearGradient id="gk-g-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#60A5FA" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="gk-g-gold" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%"  stopColor="#FCEFA1" />
          <stop offset="45%" stopColor="#E9B23C" />
          <stop offset="100%" stopColor="#A6731B" />
        </linearGradient>
        <radialGradient id="gk-sheen" cx="32%" cy="26%" r="72%">
          <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* tile redondeado con gradiente */}
      <rect x="4" y="4" width="56" height="56" rx="16"
            fill={`url(#${grad})`}
            stroke={pro ? '#7A5212' : '#1E3A8A'} strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#gk-sheen)" />

      {/* "G" geométrica */}
      <path d="M44 23
               A 14 14 0 1 0 44 41
               L 44 33 L 33 33"
            fill="none" stroke="#FFFFFF" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
