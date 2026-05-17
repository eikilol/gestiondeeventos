const express = require('express');
const supabase = require('../lib/supabase.js');
const { verifySupabaseJWT } = require('../middleware/auth.js');
const { slugify, uniqueEventoSlug } = require('../lib/slug.js');
const { otorgarBadge } = require('../lib/gamificacion.js');

const router = express.Router();
router.use(verifySupabaseJWT);

const CAMPOS_EDITABLES = [
  'titulo', 'descripcion', 'cover_url', 'modalidad',
  'fecha_inicio', 'fecha_fin', 'timezone',
  'location_nombre', 'location_direccion', 'lat', 'lng', 'url_virtual',
  'links', 'gallery',
  'currency', 'edad_minima', 'aforo_total',
  'categoria_id', 'page_json', 'email_reminders',
  'pago_llave', 'pago_qr_url', 'pago_instrucciones',
];

const ESTADOS_VALIDOS = ['borrador', 'publicado', 'cancelado', 'finalizado'];

/* GET /eventos — lista de mis eventos (con filtros básicos) */
router.get('/', async (req, res) => {
  const { q, estado, modalidad, page = 1, limit = 20 } = req.query;
  const desde = (Number(page) - 1) * Number(limit);
  const hasta = desde + Number(limit) - 1;

  let query = supabase
    .from('eventos')
    .select('*, categoria:categorias(slug, nombre)', { count: 'exact' })
    .eq('owner_id', req.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(desde, hasta);

  if (q)         query = query.ilike('titulo', `%${q}%`);
  if (estado)    query = query.eq('estado', estado);
  if (modalidad) query = query.eq('modalidad', modalidad);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ eventos: data, total: count ?? 0 });
});

/* GET /eventos/:id — un evento mío */
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*, categoria:categorias(slug, nombre)')
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Evento no encontrado.' });
  res.json({ evento: data });
});

/* POST /eventos — crear */
router.post('/', async (req, res) => {
  const { titulo, fecha_inicio } = req.body;
  if (!titulo)       return res.status(400).json({ error: 'titulo requerido.' });
  if (!fecha_inicio) return res.status(400).json({ error: 'fecha_inicio requerida.' });

  const insert = { owner_id: req.user.id, estado: 'borrador' };
  for (const k of CAMPOS_EDITABLES) {
    if (k in req.body) insert[k] = req.body[k];
  }
  insert.slug = await uniqueEventoSlug(supabase, req.body.slug || titulo);

  const { data, error } = await supabase
    .from('eventos')
    .insert(insert)
    .select('*, categoria:categorias(slug, nombre)')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  /* Badges plataforma: primer evento / organizador pro (best-effort) */
  supabase.from('eventos').select('id', { count: 'exact', head: true })
    .eq('owner_id', req.user.id).is('deleted_at', null)
    .then(({ count }) => {
      if ((count || 0) >= 1) otorgarBadge(req.user.id, 'primer_evento');
      if ((count || 0) >= 5) otorgarBadge(req.user.id, 'organizador_pro');
    });

  res.status(201).json({ evento: data });
});

/* PATCH /eventos/:id — editar */
router.patch('/:id', async (req, res) => {
  /* Verifica propiedad */
  const { data: actual, error: e1 } = await supabase
    .from('eventos')
    .select('id, owner_id, slug, titulo')
    .eq('id', req.params.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (e1) return res.status(500).json({ error: e1.message });
  if (!actual) return res.status(404).json({ error: 'Evento no encontrado.' });
  if (actual.owner_id !== req.user.id) return res.status(403).json({ error: 'No autorizado.' });

  const updates = {};
  for (const k of CAMPOS_EDITABLES) {
    if (k in req.body) updates[k] = req.body[k];
  }

  /* Permitir cambiar slug si lo mandan, asegurando unicidad */
  if (req.body.slug && req.body.slug !== actual.slug) {
    updates.slug = await uniqueEventoSlug(supabase, req.body.slug);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Sin cambios.' });
  }

  const { data, error } = await supabase
    .from('eventos')
    .update(updates)
    .eq('id', req.params.id)
    .select('*, categoria:categorias(slug, nombre)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ evento: data });
});

/* DELETE /eventos/:id — soft delete */
router.delete('/:id', async (req, res) => {
  const { data: actual } = await supabase
    .from('eventos').select('owner_id').eq('id', req.params.id).maybeSingle();
  if (!actual) return res.status(404).json({ error: 'Evento no encontrado.' });
  if (actual.owner_id !== req.user.id) return res.status(403).json({ error: 'No autorizado.' });

  const { error } = await supabase
    .from('eventos')
    .update({ deleted_at: new Date().toISOString(), estado: 'cancelado' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

/* POST /eventos/:id/estado — cambiar estado (publicar / cancelar / finalizar) */
router.post('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Usa: ${ESTADOS_VALIDOS.join(', ')}.` });
  }

  const { data: actual } = await supabase
    .from('eventos').select('owner_id').eq('id', req.params.id).maybeSingle();
  if (!actual) return res.status(404).json({ error: 'Evento no encontrado.' });
  if (actual.owner_id !== req.user.id) return res.status(403).json({ error: 'No autorizado.' });

  const updates = { estado };
  if (estado === 'publicado') updates.published_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('eventos').update(updates).eq('id', req.params.id)
    .select('*, categoria:categorias(slug, nombre)').single();
  if (error) return res.status(500).json({ error: error.message });

  res.json({ evento: data });
});

module.exports = router;
