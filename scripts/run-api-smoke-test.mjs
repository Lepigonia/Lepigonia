import { spawn } from 'node:child_process';
import { once } from 'node:events';

const port = process.env.TEST_PORT || '3100';
const child = spawn('npx', ['next', 'dev', '-p', port], { stdio: 'inherit', shell: process.platform === 'win32' });
const base = `http://localhost:${port}`;

let ready = false;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`${base}/api/gallery`); if (r.ok) { ready = true; break; } } catch {}
  await new Promise(r => setTimeout(r, 1000));
}
if (!ready) { child.kill(); throw new Error('Next.js test server did not become ready'); }

const test = spawn(process.execPath, ['scripts/api-smoke-test.mjs'], { env: { ...process.env, BASE_URL: base }, stdio: 'inherit' });
const [result] = await once(test, 'exit');
child.kill();
process.exit(result ?? 1);
