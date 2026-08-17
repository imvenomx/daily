// Shared storage layer for the API functions, backed by Vercel Blob (free tier).
//
// Vercel Blob is object storage, not a key-value DB, so the whole dataset lives
// in ONE JSON document (days + settings). We read it on load and do a
// read-modify-write on save. For a single user this is simple and fast.
//
// If BLOB_READ_WRITE_TOKEN is absent (no store attached / local dev), we fall
// back to per-instance memory; the frontend additionally mirrors to
// localStorage, so a missing store just means "this device only".

const { put, list } = require('@vercel/blob');

const PATH = 'tracker/data.json';
const TTL_MS = 4000; // bound cross-instance staleness on reads

let cache = null;      // { days: {...}, settings: <obj|null> }
let loadedAt = 0;

function token() { return process.env.BLOB_READ_WRITE_TOKEN || null; }
function backend() { return token() ? 'blob' : 'memory'; }
function empty() { return { days: {}, settings: null }; }

// Load the dataset. `force` skips the TTL cache (used before writes so we never
// clobber a change made by another serverless instance).
async function ensure(force) {
  const t = token();
  if (!t) { if (!cache) cache = empty(); return cache; }
  if (cache && !force && Date.now() - loadedAt < TTL_MS) return cache;
  try {
    const { blobs } = await list({ prefix: PATH, limit: 100, token: t });
    const b = blobs.find((x) => x.pathname === PATH);
    if (b) {
      // ?ts=<uploadedAt> busts the CDN cache whenever the content changes.
      const r = await fetch(b.url + '?ts=' + encodeURIComponent(b.uploadedAt), { cache: 'no-store' });
      if (r.ok) cache = await r.json();
    }
  } catch (e) { /* fall through to whatever we have */ }
  if (!cache) cache = empty();
  loadedAt = Date.now();
  return cache;
}

async function persist() {
  const t = token();
  if (!t) return;
  await put(PATH, JSON.stringify(cache), {
    access: 'public',
    token: t,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0
  });
  loadedAt = Date.now();
}

function keyGet(all, key) {
  if (key === 'settings') return all.settings != null ? all.settings : null;
  if (key.indexOf('day:') === 0) { const d = all.days[key.slice(4)]; return d != null ? d : null; }
  return null;
}

async function get(key) {
  const all = await ensure(false);
  return keyGet(all, key);
}

async function set(key, value) {
  const all = await ensure(true); // freshest copy before read-modify-write
  if (key === 'settings') all.settings = value;
  else if (key.indexOf('day:') === 0) all.days[key.slice(4)] = value;
  await persist();
}

async function mget(keys) {
  if (!keys || !keys.length) return [];
  const all = await ensure(false);
  return keys.map((k) => keyGet(all, k));
}

module.exports = { get, set, mget, backend };
