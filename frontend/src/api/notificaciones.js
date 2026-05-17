import client from './client.js';

export const notificacionesApi = {
  list      : (limit = 30) => client.get('/me/notificaciones', { params: { limit } }).then(r => r.data),
  leer      : (id)         => client.patch(`/me/notificaciones/${id}/leer`).then(r => r.data),
  leerTodas : ()           => client.post('/me/notificaciones/leer-todas').then(r => r.data),
  borrar    : (id)         => client.delete(`/me/notificaciones/${id}`).then(r => r.data),
};
