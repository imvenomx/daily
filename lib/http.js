// Small helpers shared by the API functions.

function readBody(req) {
  // Vercel's Node runtime usually pre-parses JSON into req.body, but be robust.
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') {
      try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); }
    }
    return Promise.resolve(req.body);
  }
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function query(req, name) {
  if (req.query && req.query[name] != null) return req.query[name];
  try {
    return new URL(req.url, 'http://localhost').searchParams.get(name);
  } catch (e) {
    return null;
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Access-code check. The expected code comes from the APP_PIN env var, falling
// back to a default so the app works out of the box. `provided` lets callers
// pass a code from a request body (used by /api/auth); otherwise we read the
// `x-pin` request header.
function pinOk(req, provided) {
  const expected = process.env.APP_PIN || '200467';
  let got = provided;
  if (got == null && req && req.headers) got = req.headers['x-pin'];
  return String(got == null ? '' : got) === String(expected);
}

module.exports = { readBody, query, DATE_RE, pinOk };
