import client from './client.js';

export const agenteApi = {
  estado: () => client.get('/me/agente/estado').then(r => r.data),
  chat: (mensajes, archivos) =>
    client.post('/me/agente/chat', { mensajes, archivos }, { timeout: 120000 }).then(r => r.data),
};
