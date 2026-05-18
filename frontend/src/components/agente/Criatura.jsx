/* Gestbot — robot asistente (blanco/azul, sin morados).
   Estados de ánimo: idle | thinking | talking | happy | error.
   - idle: flota suave, parpadea y saluda con la mano de vez en cuando
   - thinking: saca un portátil y "trabaja" (teclea, pantalla con líneas)
   - talking: boca animada + leve bob
   - happy: ojos felices, saluda rápido y rebota
   - error: visor rojizo, ojos en X, se sacude
   Animaciones por CSS keyframes inyectadas una sola vez. */

import { useEffect } from 'react';

const STYLE_ID = 'gestbot-anim';
const CSS = `
@keyframes gb-float  {0%,100%{transform:translateY(0)}50%{transform:translateY(-6%)}}
@keyframes gb-bob    {0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3%) rotate(1.5deg)}}
@keyframes gb-bounce {0%,100%{transform:translateY(0) scale(1,1)}30%{transform:translateY(-10%) scale(.97,1.04)}60%{transform:translateY(0) scale(1.03,.96)}}
@keyframes gb-shake  {0%,100%{transform:translateX(0)}20%{transform:translateX(-5%)}40%{transform:translateX(5%)}60%{transform:translateX(-3%)}80%{transform:translateX(3%)}}
@keyframes gb-blink  {0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}
@keyframes gb-wave   {0%,100%{transform:rotate(8deg)}50%{transform:rotate(-22deg)}}
@keyframes gb-wavefast{0%,100%{transform:rotate(10deg)}50%{transform:rotate(-32deg)}}
@keyframes gb-type   {0%,100%{transform:translateY(0)}50%{transform:translateY(8%)}}
@keyframes gb-scan   {0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}
@keyframes gb-ping   {0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}
@keyframes gb-aura   {0%,100%{opacity:.4}50%{opacity:.8}}
.gb-wrap{will-change:transform}
.gb-idle .gb-body{animation:gb-float 3.4s ease-in-out infinite}
.gb-talking .gb-body{animation:gb-bob 1s ease-in-out infinite}
.gb-happy .gb-body{animation:gb-bounce .7s ease-in-out infinite}
.gb-error .gb-body{animation:gb-shake .5s ease-in-out infinite}
.gb-thinking .gb-body{animation:gb-bob 2s ease-in-out infinite}
.gb-eyelid{transform-box:fill-box;transform-origin:center;animation:gb-blink 5s ease-in-out infinite}
.gb-thinking .gb-eyelid{animation:none}
.gb-armR{transform-box:fill-box;transform-origin:78px 92px}
.gb-idle .gb-armR{animation:gb-wave 2.6s ease-in-out infinite}
.gb-happy .gb-armR{animation:gb-wavefast .5s ease-in-out infinite}
.gb-type{transform-box:fill-box;transform-origin:center;animation:gb-type .5s ease-in-out infinite}
.gb-scan{animation:gb-scan 1.1s ease-in-out infinite}
.gb-scan2{animation-delay:.25s}
.gb-scan3{animation-delay:.5s}
.gb-ping{transform-box:fill-box;transform-origin:center;animation:gb-ping 1.8s ease-in-out infinite}
.gb-aura{animation:gb-aura 3s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.gb-body,.gb-eyelid,.gb-armR,.gb-type,.gb-scan,.gb-ping,.gb-aura{animation:none!important}}
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
  happy: '#34D399', error: '#EF4444',
};

export default function Criatura({ mood = 'idle', size = 96 }) {
  useInjectCss();
  const m = AURA[mood] ? mood : 'idle';
  const aura = AURA[m];
  const visor = m === 'error' ? '#7F1D1D' : '#0B1220';
  const eye = m === 'error' ? '#FCA5A5' : '#7DD3FC';

  return (
    <div className={`gb-wrap gb-${m}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 130" width={size} height={size * (130 / 120)} aria-hidden="true">
        <defs>
          <linearGradient id="gb-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E8EEF6" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <radialGradient id="gb-screen" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor={m === 'error' ? '#991B1B' : '#16335C'} />
            <stop offset="100%" stopColor={visor} />
          </radialGradient>
        </defs>

        {/* aura */}
        <ellipse className="gb-aura" cx="60" cy="60" rx="46" ry="46" fill={aura} opacity="0.4" />
        {/* sombra */}
        <ellipse cx="60" cy="123" rx="30" ry="6" fill="#000" opacity="0.28" />

        <g className="gb-body">
          {/* antena */}
          <line x1="60" y1="20" x2="60" y2="9" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <circle className="gb-ping" cx="60" cy="7" r="5" fill={aura} />

          {/* brazo izquierdo */}
          <rect x="14" y="74" width="12" height="30" rx="6" fill="url(#gb-metal)" stroke="#CBD5E1" />
          {/* brazo derecho (saluda) */}
          <g className="gb-armR">
            <rect x="94" y="62" width="12" height="32" rx="6" fill="url(#gb-metal)" stroke="#CBD5E1" />
            <circle cx="100" cy="60" r="7" fill="#FFFFFF" stroke="#CBD5E1" />
          </g>

          {/* torso */}
          <rect x="34" y="84" width="52" height="34" rx="14" fill="url(#gb-metal)" stroke="#CBD5E1" />
          <circle cx="60" cy="101" r="6" fill={aura} opacity="0.85" />

          {/* cabeza */}
          <rect x="26" y="22" width="68" height="58" rx="20" fill="url(#gb-metal)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* orejas */}
          <rect x="20" y="42" width="8" height="18" rx="4" fill="#CBD5E1" />
          <rect x="92" y="42" width="8" height="18" rx="4" fill="#CBD5E1" />

          {/* visor */}
          <rect x="34" y="32" width="52" height="38" rx="15" fill="url(#gb-screen)" />

          {/* ojos */}
          {m === 'happy' ? (
            <>
              <path d="M44 50 q5 -7 10 0" stroke={eye} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M66 50 q5 -7 10 0" stroke={eye} strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : m === 'error' ? (
            <>
              <line x1="44" y1="46" x2="54" y2="56" stroke={eye} strokeWidth="4" strokeLinecap="round" />
              <line x1="54" y1="46" x2="44" y2="56" stroke={eye} strokeWidth="4" strokeLinecap="round" />
              <line x1="66" y1="46" x2="76" y2="56" stroke={eye} strokeWidth="4" strokeLinecap="round" />
              <line x1="76" y1="46" x2="66" y2="56" stroke={eye} strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <g>
                <ellipse className="gb-eyelid" cx="49" cy={m === 'thinking' ? 53 : 50} rx="5.5" ry="7" fill={eye} />
                <circle cx="49" cy={m === 'thinking' ? 53 : 50} r="2.4" fill="#0B1220" opacity="0.35" />
              </g>
              <g>
                <ellipse className="gb-eyelid" cx="71" cy={m === 'thinking' ? 53 : 50} rx="5.5" ry="7" fill={eye} />
                <circle cx="71" cy={m === 'thinking' ? 53 : 50} r="2.4" fill="#0B1220" opacity="0.35" />
              </g>
            </>
          )}

          {/* boca */}
          {m === 'talking' ? (
            <rect x="52" y="60" width="16" height="6" rx="3" fill={eye}>
              <animate attributeName="height" values="3;7;3" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="y" values="61;59;61" dur="0.3s" repeatCount="indefinite" />
            </rect>
          ) : m === 'happy' ? (
            <path d="M50 60 q10 8 20 0" stroke={eye} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : (
            <rect x="53" y="61" width="14" height="3.5" rx="1.75" fill={eye} opacity="0.8" />
          )}
        </g>

        {/* MODO TRABAJANDO: portátil al frente + manos tecleando */}
        {m === 'thinking' && (
          <g>
            {/* base del portátil */}
            <path d="M30 118 L90 118 L96 128 L24 128 Z" fill="#CBD5E1" stroke="#94A3B8" />
            {/* pantalla */}
            <rect x="38" y="92" width="44" height="28" rx="3" fill="#0B1220" stroke="#94A3B8" />
            <rect className="gb-scan"  x="43" y="98"  width="30" height="3" rx="1.5" fill="#34D399" />
            <rect className="gb-scan gb-scan2" x="43" y="104" width="22" height="3" rx="1.5" fill="#60A5FA" />
            <rect className="gb-scan gb-scan3" x="43" y="110" width="26" height="3" rx="1.5" fill="#60A5FA" />
            {/* manos tecleando */}
            <g className="gb-type">
              <circle cx="44" cy="120" r="6" fill="#FFFFFF" stroke="#CBD5E1" />
              <circle cx="76" cy="120" r="6" fill="#FFFFFF" stroke="#CBD5E1" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
