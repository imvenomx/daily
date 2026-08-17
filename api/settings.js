// GET  /api/settings          -> { data: <settings|null>, backend }
// POST /api/settings { data } -> { ok: true, backend }
const store = require('../lib/store');
const { readBody, pinOk } = require('../lib/http');

module.exports = async (req, res) => {
  try {
    if (!pinOk(req)) return res.status(401).json({ error: 'unauthorized' });
    if (req.method === 'GET') {
      const data = await store.get('settings');
      return res.status(200).json({ data: data || null, backend: store.backend() });
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await readBody(req);
      await store.set('settings', (body && body.data) || {});
      return res.status(200).json({ ok: true, backend: store.backend() });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
