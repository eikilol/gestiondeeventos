const express = require('express');
const supabase = require('../lib/supabase.js');
const { verifySupabaseJWT } = require('../middleware/auth.js');
const { notificar } = require('../lib/notificar.js');

/* Se monta en /eventos. Los paths internos incluyen :eventoId.
   Esto evita issues con path-to-regexp v6 al usar param en mount path. */
const router = express.Router();
router.use(verifySupabaseJWT);

/* Helper: verifica que el usuario sea owner del evento */
async function assertOwner(eventoId, userId) {
  const { data, error } = await supabase
    .from('eventos').select('id, owner_id').eq('id', eventoId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Evento no encontrado.');
  if (data.owner_id !== userId) throw new Error('No autorizado.');
  return data;
}

/* GET /eventos/:eventoId/equipo — listar miembros + el owner */
router.get('/:eventoId/equipo', async (req, res) => {
  const eventoId = req.params.eventoId;
  try {
    const evento = await assertOwner(eventoId, req.user.id);

    /* Trae miembros con su perfil + detalle del rol */
    const { data: miembros, error } = await supabase
      .from('event_members')
      .select(`
        id, email, nombre_invitado, rol, rol_id, custom_permissions, status, invited_at, accepted_at,
        profile:profiles!user_id(id, nombre, avatar_url, email),
        rol_detail:event_roles!rol_id(id, nombre, descripcion)
      `)
      .eq('evento_id', eventoId)
      .neq('status', 'removed')
      .order('invited_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    const { data: owner } = await supabase
      .from('profiles').select('id, nombre, avatar_url, email').eq('id', evento.owner_id).maybeSingle();

    res.json({ owner, miembros: miembros || [] });
  } catch (e) {
    res.status(e.message === 'No autorizado.' ? 403 : 400).json({ error: e.message });
  }
});

/* POST /eventos/:eventoId/equipo — invitar */
router.post('/:eventoId/equipo', async (req, res) => {
  const eventoId = req.params.eventoId;
  const { email, rol_id, nombre_invitado } = req.body;

  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email requerido.' });
  if (!rol_id)                        return res.status(400).json({ error: 'Selecciona un rol primero.' });

  try {
    await assertOwner(eventoId, req.user.id);

    /* Verifica que el rol pertenezca al evento */
    const { data: rol } = await supabase
      .from('event_roles').select('id, nombre').eq('id', rol_id).eq('evento_id', eventoId).maybeSingle();
    if (!rol) return res.status(400).json({ error: 'Rol inválido para este evento.' });

    /* Busca si el email ya tiene perfil */
    const { data: existingProfile } = await supabase
      .from('profiles').select('id').ilike('email', email).maybeSingle();

    const payload = {
      evento_id      : eventoId,
      email          : email.toLowerCase(),
      nombre_invitado: nombre_invitado || null,
      rol            : rol.nombre,
      rol_id         : rol.id,
      invited_by     : req.user.id,
      user_id        : existingProfile?.id || null,
      status         : existingProfile ? 'active' : 'invited',
      accepted_at    : existingProfile ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('event_members')
      .insert(payload)
      .select(`*, profile:profiles!user_id(id, nombre, avatar_url, email), rol_detail:event_roles!rol_id(id, nombre, descripcion)`)
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Ese email ya está en el equipo.' });
      return res.status(500).json({ error: error.message });
    }

    /* Si el invitado ya tiene cuenta, le notificamos in-app */
    if (existingProfile?.id) {
      const { data: ev } = await supabase
        .from('eventos').select('titulo').eq('id', eventoId).maybeSingle();
      notificar({
        userId : existingProfile.id,
        tipo   : 'equipo',
        titulo : 'Te sumaron a un equipo',
        cuerpo : `Ahora sos ${rol.nombre} en ${ev?.titulo || 'un evento'}.`,
        link   : `/eventos/${eventoId}`,
        eventoId,
      });
    }

    res.status(201).json({ miembro: data });
  } catch (e) {
    res.status(e.message === 'No autorizado.' ? 403 : 400).json({ error: e.message });
  }
});

/* PATCH /eventos/:eventoId/equipo/:miembroId — cambiar rol */
router.patch('/:eventoId/equipo/:miembroId', async (req, res) => {
  const { eventoId, miembroId } = req.params;
  const { rol_id } = req.body;
  if (!rol_id) return res.status(400).json({ error: 'rol_id requerido.' });

  try {
    await assertOwner(eventoId, req.user.id);
    const { data: rol } = await supabase
      .from('event_roles').select('id, nombre').eq('id', rol_id).eq('evento_id', eventoId).maybeSingle();
    if (!rol) return res.status(400).json({ error: 'Rol inválido para este evento.' });

    const { data, error } = await supabase
      .from('event_members')
      .update({ rol_id: rol.id, rol: rol.nombre })
      .eq('id', miembroId)
      .eq('evento_id', eventoId)
      .select(`*, profile:profiles!user_id(id, nombre, avatar_url, email), rol_detail:event_roles!rol_id(id, nombre, descripcion)`)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ miembro: data });
  } catch (e) {
    res.status(e.message === 'No autorizado.' ? 403 : 400).json({ error: e.message });
  }
});

/* DELETE /eventos/:eventoId/equipo/:miembroId — sacar del equipo (soft) */
router.delete('/:eventoId/equipo/:miembroId', async (req, res) => {
  const { eventoId, miembroId } = req.params;
  try {
    await assertOwner(eventoId, req.user.id);
    const { error } = await supabase
      .from('event_members')
      .update({ status: 'removed' })
      .eq('id', miembroId)
      .eq('evento_id', eventoId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) {
    res.status(e.message === 'No autorizado.' ? 403 : 400).json({ error: e.message });
  }
});

module.exports = router;
