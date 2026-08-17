// GET  /api/day?date=YYYY-MM-DD        -> { data: <blob|null>, backend }
// POST /api/day  { date, data }        -> { ok: true, backend }
const store = require('../lib/store');
const { readBody, query, DATE_RE } = require('../lib/http');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const date = query(req, 'date');
      if (!DATE_RE.test(date || '')) return res.status(400).json({ error: 'bad date' });
      const data = await store.get('day:' + date);
      return res.status(200).json({ data: data || null, backend: store.backend() });
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await readBody(req);
      const date = body && body.date;
      if (!DATE_RE.test(date || '')) return res.status(400).json({ error: 'bad date' });
      await store.set('day:' + date, body.data || {});
      return res.status(200).json({ ok: true, backend: store.backend() });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
