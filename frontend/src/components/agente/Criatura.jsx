/* Gestbot — robot asistente (blanco/azul, sin morados).
   Brazos con pivote correcto (transform-box: view-box) → siempre
   pegados al hombro y CON manos visibles en todos los estados.

   Estados: idle | thinking | talking | happy | error
   - idle    : flota, parpadea y saluda con la mano derecha
   - thinking: baja ambos brazos a un portátil y teclea ("trabajando")
   - talking : boca animada + leve bob
   - happy   : ojos felices, saludo rápido + rebote
   - error   : visor rojizo, ojos en X, se sacude */

import { useEffect } from 'react';

const STYLE_ID = 'gestbot-anim-v3';
const CSS = `
@keyframes gb-float  {0%,100%{transform:translateY(0)}50%{transform:translateY(-5%)}}
@keyframes gb-bob    {0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2.4%) rotate(1deg)}}
@keyframes gb-bounce {0%,100%{transform:translateY(0) scale(1,1)}28%{transform:translateY(-9%) scale(.98,1.03)}58%{transform:translateY(0) scale(1.03,.97)}}
@keyframes gb-shake  {0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-4%) rotate(-2deg)}40%{transform:translateX(4%) rotate(2deg)}60%{transform:translateX(-3%) rotate(-1deg)}80%{transform:translateX(3%) rotate(1deg)}}
@keyframes gb-blink  {0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes gb-wave   {0%,100%{transform:rotate(8deg)}50%{transform:rotate(-24deg)}}
@keyframes gb-wavef  {0%,100%{transform:rotate(10deg)}50%{transform:rotate(-32deg)}}
@keyframes gb-sway   {0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}
@keyframes gb-typeA  {0%,100%{transform:translateY(0)}50%{transform:translateY(6%)}}
@keyframes gb-typeB  {0%,100%{transform:translateY(6%)}50%{transform:translateY(0)}}
@keyframes gb-scan   {0%{opacity:.25}50%{opacity:1}100%{opacity:.25}}
@keyframes gb-ping   {0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
@keyframes gb-aura   {0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.7;transform:scale(1.06)}}
.gb-wrap{will-change:transform}
.gb-idle    .gb-body{animation:gb-float 3.6s ease-in-out infinite}
.gb-talking .gb-body{animation:gb-bob 1s ease-in-out infinite}
.gb-happy   .gb-body{animation:gb-bounce .7s ease-in-out infinite}
.gb-error   .gb-body{animation:gb-shake .5s ease-in-out infinite}
.gb-thinking .gb-body{animation:gb-bob 2.2s ease-in-out infinite}
.gb-eyelid{transform-box:fill-box;transform-origin:center;animation:gb-blink 5s ease-in-out infinite}
.gb-armR{transform-box:view-box;transform-origin:96px 96px}
.gb-armL{transform-box:view-box;transform-origin:44px 98px}
.gb-idle    .gb-armR{animation:gb-wave 2.4s ease-in-out infinite}
.gb-talking .gb-armR{animation:gb-wave 3s ease-in-out infinite}
.gb-happy   .gb-armR{animation:gb-wavef .5s ease-in-out infinite}
.gb-idle    .gb-armL{animation:gb-sway 4s ease-in-out infinite}
.gb-talking .gb-armL{animation:gb-sway 5s ease-in-out infinite}
.gb-handA{transform-box:fill-box;transform-origin:center;animation:gb-typeA .42s ease-in-out infinite}
.gb-handB{transform-box:fill-box;transform-origin:center;animation:gb-typeB .42s ease-in-out infinite}
.gb-scanl{animation:gb-scan 1.1s ease-in-out infinite}
.gb-scanl2{animation-delay:.22s}
.gb-scanl3{animation-delay:.44s}
.gb-ping{transform-box:fill-box;transform-origin:center;animation:gb-ping 1.7s ease-in-out infinite}
.gb-aura{animation:gb-aura 3.2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.gb-wrap *{animation:none!important}}
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
  idle: '#60A5FA', thinking: '#3B82F6', talking: '#60A5FA',
  happy: '#34D399', error: '#F87171',
};

export default function Criatura({ mood = 'idle', size = 96 }) {
  useInjectCss();
  const m = AURA[mood] ? mood : 'idle';
  const aura = AURA[m];
  const working = m === 'thinking';
  const eye = m === 'error' ? '#FCA5A5' : '#7DD3FC';
  const eyeY = working ? 56 : 53;

  return (
    <div className={`gb-wrap gb-${m}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 150" width={size} height={size * (150 / 140)} aria-hidden="true">
        <defs>
          <linearGradient id="gb-shell" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#EAF0F8" />
            <stop offset="100%" stopColor="#C7D3E3" />
          </linearGradient>
          <linearGradient id="gb-accent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5BA8F5" />
            <stop offset="100%" stopColor="#2F6FD0" />
          </linearGradient>
          <radialGradient id="gb-visor" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor={m === 'error' ? '#7F1D1D' : '#1E3A66'} />
            <stop offset="70%" stopColor={m === 'error' ? '#3F1212' : '#0C1A30'} />
            <stop offset="100%" stopColor="#070E1C" />
          </radialGradient>
        </defs>

        {/* aura + sombra */}
        <ellipse className="gb-aura" cx="70" cy="68" rx="52" ry="52" fill={aura} opacity="0.4" />
        <ellipse cx="70" cy="142" rx="30" ry="6.5" fill="#000" opacity="0.25" />

        <g className="gb-body">
          {/* antena */}
          <path d="M70 24 Q72 16 69 11" stroke="#9FB2C9" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle className="gb-ping" cx="68" cy="9" r="5" fill={aura} />

          {/* ── Brazo izquierdo (pivote hombro 44,98) ── */}
          {working ? (
            <g>
              <path d="M48 100 Q40 112 56 120" stroke="url(#gb-shell)" strokeWidth="13"
                    fill="none" strokeLinecap="round" />
              <circle className="gb-handA" cx="58" cy="121" r="9"
                      fill="url(#gb-shell)" stroke="#C7D3E3" strokeWidth="1.2" />
            </g>
          ) : (
            <g className="gb-armL">
              <path d="M46 99 Q36 112 39 124" stroke="url(#gb-shell)" strokeWidth="13"
                    fill="none" strokeLinecap="round" />
              <circle cx="40" cy="126" r="8.5" fill="url(#gb-shell)" stroke="#C7D3E3" strokeWidth="1.2" />
            </g>
          )}

          {/* ── Brazo derecho (pivote hombro 96,96) ── */}
          {working ? (
            <g>
              <path d="M92 100 Q100 112 84 120" stroke="url(#gb-shell)" strokeWidth="13"
                    fill="none" strokeLinecap="round" />
              <circle className="gb-handB" cx="82" cy="121" r="9"
                      fill="url(#gb-shell)" stroke="#C7D3E3" strokeWidth="1.2" />
            </g>
          ) : (
            <g className="gb-armR">
              <path d="M94 96 Q108 80 110 60" stroke="url(#gb-shell)" strokeWidth="13"
                    fill="none" strokeLinecap="round" />
              <circle cx="110" cy="54" r="9" fill="url(#gb-shell)" stroke="#C7D3E3" strokeWidth="1.2" />
            </g>
          )}

          {/* cuerpo (cubre los hombros → brazos pegados) */}
          <path d="M44 96 Q44 132 70 132 Q96 132 96 96 Z"
                fill="url(#gb-shell)" stroke="#C7D3E3" strokeWidth="1.2" />
          <ellipse cx="70" cy="112" rx="11" ry="7" fill="url(#gb-accent)" opacity="0.85" />
          <circle cx="70" cy="112" r="3" fill={aura} />

          {/* cuello */}
          <rect x="62" y="86" width="16" height="12" rx="4" fill="#D7E0EC" />

          {/* cabeza */}
          <rect x="30" y="26" width="80" height="66" rx="26"
                fill="url(#gb-shell)" stroke="#C7D3E3" strokeWidth="1.4" />
          {/* orejas */}
          <rect x="22" y="48" width="11" height="22" rx="5.5" fill="url(#gb-accent)" />
          <rect x="107" y="48" width="11" height="22" rx="5.5" fill="url(#gb-accent)" />

          {/* visor */}
          <rect x="40" y="36" width="60" height="46" rx="20" fill="url(#gb-visor)" />
          <rect x="40" y="36" width="60" height="46" rx="20" fill="none" stroke="#0A1424" strokeWidth="2" />
          <ellipse cx="56" cy="48" rx="11" ry="6" fill="#FFFFFF" opacity="0.10" />

          {/* ojos */}
          {m === 'happy' ? (
            <>
              <path d="M52 58 q6 -8 12 0" stroke={eye} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M76 58 q6 -8 12 0" stroke={eye} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </>
          ) : m === 'error' ? (
            <>
              <line x1="52" y1="52" x2="62" y2="62" stroke={eye} strokeWidth="4.5" strokeLinecap="round" />
              <line x1="62" y1="52" x2="52" y2="62" stroke={eye} strokeWidth="4.5" strokeLinecap="round" />
              <line x1="78" y1="52" x2="88" y2="62" stroke={eye} strokeWidth="4.5" strokeLinecap="round" />
              <line x1="88" y1="52" x2="78" y2="62" stroke={eye} strokeWidth="4.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <g>
                <ellipse className="gb-eyelid" cx="58" cy={eyeY} rx="6" ry="8" fill={eye} />
                <circle cx="60" cy={eyeY - 2} r="2" fill="#fff" opacity="0.9" />
              </g>
              <g>
                <ellipse className="gb-eyelid" cx="82" cy={eyeY} rx="6" ry="8" fill={eye} />
                <circle cx="84" cy={eyeY - 2} r="2" fill="#fff" opacity="0.9" />
              </g>
            </>
          )}

          {/* boca */}
          {m === 'talking' ? (
            <rect x="62" y="68" width="16" height="6" rx="3" fill={eye}>
              <animate attributeName="height" values="3;8;3" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="y" values="69;66;69" dur="0.3s" repeatCount="indefinite" />
            </rect>
          ) : m === 'error' ? (
            <path d="M60 74 q10 -7 20 0" stroke={eye} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : (
            <path d={m === 'happy' ? 'M58 68 q12 11 24 0' : 'M60 69 q10 7 20 0'}
              stroke={eye} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          )}
        </g>

        {/* MODO TRABAJANDO: portátil */}
        {working && (
          <g>
            <path d="M40 132 L100 132 L108 144 L32 144 Z" fill="#D7E0EC" stroke="#9FB2C9" strokeWidth="1.2" />
            <rect x="46" y="104" width="48" height="30" rx="4" fill="#0C1A30" stroke="#9FB2C9" strokeWidth="1.2" />
            <rect className="gb-scanl"  x="52" y="110" width="22" height="3.5" rx="1.75" fill="#34D399" />
            <rect className="gb-scanl gb-scanl2" x="52" y="117" width="30" height="3.5" rx="1.75" fill="#60A5FA" />
            <rect className="gb-scanl gb-scanl3" x="52" y="124" width="26" height="3.5" rx="1.75" fill="#60A5FA" />
          </g>
        )}
      </svg>
    </div>
  );
}
