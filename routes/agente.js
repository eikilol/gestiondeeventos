const express = require('express');
const { verifySupabaseJWT } = require('../middleware/auth.js');
const agente = require('../lib/agente.js');

const router = express.Router();
router.use(verifySupabaseJWT);

/* GET /me/agente/estado — ¿está disponible el asistente IA? */
router.get('/me/agente/estado', (_req, res) => {
  res.json({ disponible: agente.disponible, provider: agente.provider || null });
});

/* POST /me/agente/chat — { mensajes: [{role, content}] } → { reply, mood, acciones } */
router.post('/me/agente/chat', async (req, res) => {
  if (!agente.disponible) {
    return res.status(503).json({
      error: 'El asistente IA no está habilitado en este servidor.',
      mood: 'error',
    });
  }

  const { mensajes } = req.body || {};
  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    return res.status(400).json({ error: 'mensajes requerido.' });
  }

  try {
    const out = await agente.chat(req.user.id, mensajes);
    res.json(out);
  } catch (e) {
    console.warn('[agente] chat error:', e.message);
    res.status(500).json({
      reply: 'Algo se me cruzó. Intenta de nuevo.',
      mood: 'error',
      acciones: [],
    });
  }
});

module.exports = router;
