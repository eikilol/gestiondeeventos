/* Estado real del plan (lee /me/plan, no la metadata stale de Auth).
   Se refresca al montar y cuando alguien dispara 'gestek:plan-actualizado'
   (ej. tras activar/renovar Pro en Configuración). */

import { useEffect, useState, useCallback } from 'react';
import { pagosApi } from '../api/pagos.js';

export const PLAN_EVENT = 'gestek:plan-actualizado';
export function notificarPlanCambiado() {
  window.dispatchEvent(new Event(PLAN_EVENT));
}

export function usePlan() {
  const [estado, setEstado] = useState({ plan: 'free', loading: true, devOn: false, expira: null });

  const refrescar = useCallback(() => {
    pagosApi.planEstado()
      .then(d => setEstado({
        plan: d.plan === 'pro' ? 'pro' : 'free',
        loading: false,
        devOn: !!d.dev_activation,
        expira: d.expires_at || null,
      }))
      .catch(() => setEstado(s => ({ ...s, loading: false })));
  }, []);

  useEffect(() => {
    refrescar();
    const h = () => refrescar();
    window.addEventListener(PLAN_EVENT, h);
    return () => window.removeEventListener(PLAN_EVENT, h);
  }, [refrescar]);

  return { ...estado, esPro: estado.plan === 'pro', refrescar };
}
