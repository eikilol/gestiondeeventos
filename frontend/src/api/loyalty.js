import client from './client.js';

export const loyaltyApi = {
  cliente      : ()                 => client.get('/me/loyalty/cliente').then(r => r.data),
  empleado     : ()                 => client.get('/me/loyalty/empleado').then(r => r.data),
  badges       : ()                 => client.get('/me/loyalty/badges').then(r => r.data),
  canjear      : (recompensa_id)    => client.post('/me/loyalty/canjear', { recompensa_id }).then(r => r.data),
  rankingEvento: (eventoId)         => client.get(`/eventos/${eventoId}/ranking-equipo`).then(r => r.data),
};

export const recompensasApi = {
  list  : (audiencia)        => client.get('/me/recompensas', { params: audiencia ? { audiencia } : {} }).then(r => r.data),
  crear : (body)             => client.post('/me/recompensas', body).then(r => r.data),
  editar: (id, body)         => client.patch(`/me/recompensas/${id}`, body).then(r => r.data),
  borrar: (id)               => client.delete(`/me/recompensas/${id}`).then(r => r.data),
  canjes: ()                 => client.get('/me/canjes').then(r => r.data),
  marcarCanje: (id, estado)  => client.patch(`/me/canjes/${id}`, { estado }).then(r => r.data),
};
