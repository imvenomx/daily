// POST /api/auth { pin } -> 200 { ok:true } if the code is correct, else 401.
// Used by the lock screen to validate the access code before entering the app.
const { readBody, pinOk } = require('../lib/http');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'method not allowed' });
    }
    const body = await readBody(req);
    if (pinOk(req, body && body.pin)) return res.status(200).json({ ok: true });
    return res.status(401).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
