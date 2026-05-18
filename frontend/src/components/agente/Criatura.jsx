/* Gestek — la criatura asistente.
   Un SVG expresivo con estados de ánimo: idle | thinking | talking | happy | error.
   Las animaciones son CSS keyframes inyectadas una sola vez (sin tocar
   tailwind.config). El "mood" cambia ojos, boca, color y movimiento. */

import { useEffect } from 'react';

const STYLE_ID = 'gestek-criatura-anim';
const CSS = `
@keyframes gk-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7%)} }
@keyframes gk-bob     { 0%,100%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-4%) rotate(-3deg)} 75%{transform:translateY(-4%) rotate(3deg)} }
@keyframes gk-bounce  { 0%,100%{transform:translateY(0) scale(1,1)} 30%{transform:translateY(-14%) scale(.96,1.05)} 60%{transform:translateY(0) scale(1.05,.94)} }
@keyframes gk-shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6%)} 40%{transform:translateX(6%)} 60%{transform:translateX(-4%)} 80%{transform:translateX(4%)} }
@keyframes gk-blink   { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(.1)} }
@keyframes gk-think   { 0%,100%{opacity:.25;transform:translateY(0)} 50%{opacity:1;transform:translateY(-22%)} }
@keyframes gk-spark   { 0%{opacity:0;transform:scale(.4)} 50%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(.4)} }
@keyframes gk-talk    { 0%,100%{transform:scaleY(.6)} 50%{transform:scaleY(1.15)} }
@keyframes gk-glow    { 0%,100%{opacity:.5} 50%{opacity:.9} }
.gk-wrap{will-change:transform}
.gk-idle    .gk-body{animation:gk-float 3.4s ease-in-out infinite}
.gk-thinking.gk-body, .gk-thinking .gk-body{animation:gk-bob 1.6s ease-in-out infinite}
.gk-talking .gk-body{animation:gk-float 1s ease-in-out infinite}
.gk-happy   .gk-body{animation:gk-bounce 0.7s ease-in-out infinite}
.gk-error   .gk-body{animation:gk-shake 0.5s ease-in-out infinite}
.gk-eyelid{transform-box:fill-box;transform-origin:center;animation:gk-blink 5.5s ease-in-out infinite}
.gk-thinking .gk-eyelid{animation:none}
.gk-dot{transform-box:fill-box;transform-origin:center;animation:gk-think 1.2s ease-in-out infinite}
.gk-dot2{animation-delay:.18s}
.gk-dot3{animation-delay:.36s}
.gk-spark{transform-box:fill-box;transform-origin:center;animation:gk-spark 1s ease-in-out infinite}
.gk-spark2{animation-delay:.35s}
.gk-mouthtalk{transform-box:fill-box;transform-origin:center;animation:gk-talk .28s ease-in-out infinite}
.gk-aura{animation:gk-glow 3s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){
  .gk-body,.gk-eyelid,.gk-dot,.gk-spark,.gk-mouthtalk,.gk-aura{animation:none!important}
}
`;

function useInjectCss() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

const AURA = {
  idle    : '#8B5CF6',
  thinking: '#3B82F6',
  talking : '#60A5FA',
  happy   : '#10B981',
  error   : '#EF4444',
};

export default function Criatura({ mood = 'idle', size = 96 }) {
  useInjectCss();
  const m = AURA[mood] ? mood : 'idle';
  const aura = AURA[m];

  return (
    <div className={`gk-wrap gk-${m}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id="gk-bodyg" cx="40%" cy="35%" r="75%">
            <stop offset="0%"  stopColor="#A78BFA" />
            <stop offset="55%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4C1D95" />
          </radialGradient>
          <filter id="gk-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* aura */}
        <ellipse className="gk-aura" cx="60" cy="64" rx="46" ry="46"
          fill={aura} opacity="0.5" filter="url(#gk-soft)" />

        {/* sombra */}
        <ellipse cx="60" cy="108" rx="26" ry="6" fill="#000" opacity="0.28" />

        <g className="gk-body">
          {/* cuerpo: gota redondeada */}
          <path d="M60 16
                   C 86 16 100 38 100 64
                   C 100 90 82 104 60 104
                   C 38 104 20 90 20 64
                   C 20 38 34 16 60 16 Z"
                fill="url(#gk-bodyg)" />
          {/* brillo */}
          <ellipse cx="46" cy="40" rx="14" ry="9" fill="#fff" opacity="0.18" />

          {/* antena */}
          <line x1="60" y1="16" x2="60" y2="4" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="3" r="4" fill={aura}>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* mejillas */}
          <ellipse cx="38" cy="70" rx="7" ry="4" fill="#F472B6" opacity="0.45" />
          <ellipse cx="82" cy="70" rx="7" ry="4" fill="#F472B6" opacity="0.45" />

          {/* ojos */}
          {m === 'happy' ? (
            <>
              <path d="M40 56 q6 -8 12 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M68 56 q6 -8 12 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : m === 'error' ? (
            <>
              <line x1="40" y1="52" x2="52" y2="60" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <line x1="52" y1="52" x2="40" y2="60" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <line x1="68" y1="52" x2="80" y2="60" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <line x1="80" y1="52" x2="68" y2="60" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <g>
                <ellipse className="gk-eyelid" cx="46" cy="57" rx="6.5" ry="8" fill="#fff" />
                <circle cx={m === 'thinking' ? 48 : 47} cy={m === 'thinking' ? 54 : 58} r="3.2" fill="#1E1B4B" />
              </g>
              <g>
                <ellipse className="gk-eyelid" cx="74" cy="57" rx="6.5" ry="8" fill="#fff" />
                <circle cx={m === 'thinking' ? 76 : 75} cy={m === 'thinking' ? 54 : 58} r="3.2" fill="#1E1B4B" />
              </g>
            </>
          )}

          {/* boca */}
          {m === 'talking' ? (
            <ellipse className="gk-mouthtalk" cx="60" cy="78" rx="7" ry="6" fill="#2E1065" />
          ) : m === 'happy' ? (
            <path d="M50 76 q10 12 20 0" stroke="#2E1065" strokeWidth="4" fill="none" strokeLinecap="round" />
          ) : m === 'error' ? (
            <path d="M51 80 q9 -8 18 0" stroke="#2E1065" strokeWidth="4" fill="none" strokeLinecap="round" />
          ) : m === 'thinking' ? (
            <ellipse cx="60" cy="79" rx="4" ry="3" fill="#2E1065" />
          ) : (
            <path d="M52 77 q8 7 16 0" stroke="#2E1065" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
        </g>

        {/* thinking dots */}
        {m === 'thinking' && (
          <g>
            <circle className="gk-dot"  cx="96"  cy="34" r="3.4" fill="#60A5FA" />
            <circle className="gk-dot gk-dot2" cx="104" cy="26" r="2.8" fill="#60A5FA" />
            <circle className="gk-dot gk-dot3" cx="110" cy="20" r="2.2" fill="#60A5FA" />
          </g>
        )}

        {/* happy sparkles */}
        {m === 'happy' && (
          <g fill="#FCD34D">
            <path className="gk-spark"  d="M22 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
            <path className="gk-spark gk-spark2" d="M98 44 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" />
          </g>
        )}
      </svg>
    </div>
  );
}
