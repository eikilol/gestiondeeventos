import client from './client.js';

export const auditoriaApi = {
  list: (eventoId, limit = 100) =>
    client.get(`/eventos/${eventoId}/auditoria`, { params: { limit } }).then(r => r.data),
};
