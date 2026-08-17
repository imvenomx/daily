// GET /api/days?from=YYYY-MM-DD&to=YYYY-MM-DD
//   -> { data: { "YYYY-MM-DD": <blob>, ... }, backend }
// Only days that have stored data are included. Range is capped to keep the
// batch reasonable.
const store = require('../lib/store');
const { query, DATE_RE } = require('../lib/http');

const MAX_DAYS = 400;

function enumerate(from, to) {
  const p = from.split('-'), q = to.split('-');
  let d = new Date(+p[0], +p[1] - 1, +p[2]);
  const end = new Date(+q[0], +q[1] - 1, +q[2]);
  const keys = [];
  while (d <= end && keys.length < MAX_DAYS) {
    keys.push(
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
    );
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }
  return keys;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'method not allowed' });
    }
    const from = query(req, 'from');
    const to = query(req, 'to');
    if (!DATE_RE.test(from || '') || !DATE_RE.test(to || '')) {
      return res.status(400).json({ error: 'bad range' });
    }
    const dates = enumerate(from, to);
    const values = await store.mget(dates.map((d) => 'day:' + d));
    const data = {};
    dates.forEach((d, i) => { if (values[i] != null) data[d] = values[i]; });
    return res.status(200).json({ data, backend: store.backend() });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
