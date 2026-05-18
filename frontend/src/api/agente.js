import client from './client.js';

export const agenteApi = {
  estado: () => client.get('/me/agente/estado').then(r => r.data),
  chat: (mensajes) =>
    client.post('/me/agente/chat', { mensajes }, { timeout: 90000 }).then(r => r.data),
};
