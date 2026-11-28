#!/usr/bin/env node
/* CallAssist — tiny LeadConnector calendar-ID resolver (read-only).
 *
 * Why this exists: a LeadConnector booking *slug* can only be turned into a
 * calendar *ID* by an endpoint the provider locks to its own origins, and the
 * booking page HTML sends no CORS headers. A third-party page (localhost or
 * Cloudflare) therefore cannot resolve the slug itself. This helper runs on
 * your own machine, makes the request server-side (no browser Origin), and
 * hands the ID back to the desk. The desk then reads live open times straight
 * from the provider's CORS-open free-slots API — this script never parses or
 * proxies slots, and never books anything.
 *
 * Run:   node tools/cal-resolver.mjs            (listens on 127.0.0.1:8788)
 *        PORT=9000 node tools/cal-resolver.mjs
 * Then in the desk: Qualifiers ▸ Calendar ▸ set Resolver URL to
 *        http://127.0.0.1:8788  and press "Resolve from link".
 *
 * Endpoints (GET only):
 *   /health            -> { ok: true }
 *   /resolve?url=<...> -> { ok, calendarId, timezone, name } or { ok:false, error }
 *
 * No dependencies. Node 18+ (global fetch). No credentials are stored or sent.
 */
import http from 'node:http';

const PORT = Number(process.env.PORT || 8788);
const HOST = process.env.HOST || '127.0.0.1';
const PROVIDER = 'https://backend.leadconnectorhq.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function slugFromUrl(u) {
  const m = /leadconnectorhq\.com\/widget\/bookings\/([^/?#]+)/i.exec(String(u || ''));
  return m ? m[1] : '';
}

async function resolve(slug) {
  const url = `${PROVIDER}/calendars/bookings/get-widget-data?slug=${encodeURIComponent(slug)}&eventId=`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    // Server-side request: no browser Origin header, so the provider's origin
    // lock does not apply. These are the same public widget headers the page uses.
    const r = await fetch(url, {
      method: 'GET',
      headers: { channel: 'APP', source: 'WEB_USER', version: '2021-04-15', accept: 'application/json' },
      signal: ctl.signal,
    });
    if (!r.ok) return { ok: false, error: `provider returned HTTP ${r.status}` };
    const j = await r.json();
    const id = j && Object.keys(j).find((k) => /^[A-Za-z0-9]{12,40}$/.test(k) && j[k] && j[k].calendar);
    if (!id) return { ok: false, error: 'no calendar found for that slug (the link may be inactive)' };
    const cal = j[id].calendar || {};
    return { ok: true, calendarId: id, timezone: String(j[id].timezone || cal.timezone || ''), name: String(cal.name || '') };
  } catch (e) {
    const timed = /abort/i.test(String(e && e.name || ''));
    return { ok: false, error: timed ? 'provider did not reply within 9 seconds' : String(e && e.message || 'request failed') };
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'GET only' });
  const u = new URL(req.url, `http://${HOST}:${PORT}`);
  if (u.pathname === '/health') return send(res, 200, { ok: true });
  if (u.pathname === '/resolve') {
    const target = u.searchParams.get('url') || '';
    const slug = slugFromUrl(target);
    if (!slug) return send(res, 400, { ok: false, error: 'url must be a LeadConnector booking link (…/widget/bookings/…)' });
    return send(res, 200, await resolve(slug));
  }
  return send(res, 404, { ok: false, error: 'unknown path' });
});

server.listen(PORT, HOST, () => {
  console.log(`CallAssist calendar resolver listening on http://${HOST}:${PORT}`);
  console.log('Set the desk Resolver URL to this address, then press "Resolve from link". Read-only; no bookings.');
});