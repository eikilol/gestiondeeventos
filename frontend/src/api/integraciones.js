import client from './client.js';

export const integracionesApi = {
  /* tokens */
  listTokens : ()      => client.get('/me/integraciones/tokens').then(r => r.data),
  crearToken : (nombre)=> client.post('/me/integraciones/tokens', { nombre }).then(r => r.data),
  revocarToken:(id)    => client.delete(`/me/integraciones/tokens/${id}`).then(r => r.data),

  /* webhooks */
  listWebhooks: ()             => client.get('/me/integraciones/webhooks').then(r => r.data),
  crearWebhook: (url, eventos) => client.post('/me/integraciones/webhooks', { url, eventos }).then(r => r.data),
  editarWebhook:(id, body)     => client.patch(`/me/integraciones/webhooks/${id}`, body).then(r => r.data),
  borrarWebhook:(id)           => client.delete(`/me/integraciones/webhooks/${id}`).then(r => r.data),
  deliveries  : (id)           => client.get(`/me/integraciones/webhooks/${id}/deliveries`).then(r => r.data),
};
