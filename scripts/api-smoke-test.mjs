const base = process.env.BASE_URL || 'http://localhost:3000';

const checks = [];
async function check(name, fn) {
  try { await fn(); checks.push([name, true]); console.log(`✓ ${name}`); }
  catch (error) { checks.push([name, false]); console.error(`✗ ${name}: ${error.message}`); }
}
async function json(path, options) {
  const res = await fetch(`${base}${path}`, { redirect: 'manual', ...options });
  let body = null;
  try { body = await res.json(); } catch {}
  return { res, body };
}

await check('public gallery API responds', async () => {
  const { res, body } = await json('/api/gallery');
  if (!res.ok || !Array.isArray(body?.countries)) throw new Error(`HTTP ${res.status}`);
});

await check('public gallery contains published Norway content', async () => {
  const { body } = await json('/api/gallery');
  const norway = (body.countries || []).find(country => String(country.slug || '').toLowerCase() === 'norway');
  if (!norway || !Array.isArray(norway.images) || norway.images.length === 0) throw new Error('Norway gallery data missing');
});

await check('public gallery has no legacy empty-country fallback', async () => {
  const { body } = await json('/api/gallery');
  const names = (body.countries || []).map(c => String(c.name || '').toLowerCase());
  if (names.includes('portugal') || names.includes('arabien')) throw new Error('legacy Portugal/Arabien data returned');
});

for (const path of [
  '/api/admin/gallery',
  '/api/admin/posts',
  '/api/admin/about',
  '/api/admin/newsletter',
  '/api/admin/homepage',
  '/api/admin/analytics',
]) {
  await check(`unauthenticated access to ${path} is rejected`, async () => {
    const { res } = await json(path);
    if (res.status !== 401) throw new Error(`expected HTTP 401, got HTTP ${res.status}`);
  });
}

await check('blob upload endpoint rejects unauthenticated requests', async () => {
  const { res } = await json('/api/admin/blob-upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (res.status !== 401) throw new Error(`expected HTTP 401, got HTTP ${res.status}`);
});

await check('newsletter rejects invalid email', async () => {
  const { res } = await json('/api/newsletter', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'not-an-email' }) });
  if (res.status !== 400) throw new Error(`expected HTTP 400, got HTTP ${res.status}`);
});

await check('public routes respond', async () => {
  for (const path of ['/', '/blog', '/blog/stories-from-the-past', '/map', '/gallery', '/about', '/login', '/privacy']) {
    const response = await fetch(`${base}${path}`, { redirect: 'manual' });
    if (response.status >= 400) throw new Error(`${path} returned HTTP ${response.status}`);
  }
});

const failed = checks.filter(([, ok]) => !ok).length;
console.log(`\n${checks.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
