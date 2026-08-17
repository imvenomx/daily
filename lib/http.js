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

module.exports = { readBody, query, DATE_RE };
