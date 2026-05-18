import client from './client.js';

export const solicitudesApi = {
  misEventos : ()                 => client.get('/me/equipo/eventos').then(r => r.data),
  misSolicitudes : ()             => client.get('/me/solicitudes').then(r => r.data),
  list       : (eventoId)         => client.get(`/eventos/${eventoId}/solicitudes`).then(r => r.data),
  crear      : (eventoId, body)   => client.post(`/eventos/${eventoId}/solicitudes`, body).then(r => r.data),
  actualizar : (eventoId, id, b)  => client.patch(`/eventos/${eventoId}/solicitudes/${id}`, b).then(r => r.data),
};
