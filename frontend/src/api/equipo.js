import client from './client.js';

export const equipoApi = {
  list      : (eventoId)                  => client.get(`/eventos/${eventoId}/equipo`).then(r => r.data),
  invitar   : (eventoId, body)            => client.post(`/eventos/${eventoId}/equipo`, body).then(r => r.data),
  cambiarRol: (eventoId, miembroId, rol_id) => client.patch(`/eventos/${eventoId}/equipo/${miembroId}`, { rol_id }).then(r => r.data),
  remover   : (eventoId, miembroId)       => client.delete(`/eventos/${eventoId}/equipo/${miembroId}`).then(r => r.data),
};
