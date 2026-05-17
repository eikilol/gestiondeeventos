import client from './client.js';

export const waitlistApi = {
  list: (eventoId, params = {}) =>
    client.get(`/eventos/${eventoId}/waitlist`, { params }).then(r => r.data),

  join: (slug, body) =>
    client.post(`/eventos/publicos/slug/${slug}/waitlist`, body).then(r => r.data),

  updateEstado: (eventoId, waitlistId, estado) =>
    client.patch(`/eventos/${eventoId}/waitlist/${waitlistId}`, { estado }).then(r => r.data),

  notify: (eventoId, waitlistId) =>
    client.post(`/eventos/${eventoId}/waitlist/${waitlistId}/notify`).then(r => r.data),

  remove: (eventoId, waitlistId) =>
    client.delete(`/eventos/${eventoId}/waitlist/${waitlistId}`).then(r => r.data),
};
