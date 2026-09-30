// Captures README screenshots from a running preview server.
// Usage: npm run build && npx vite preview --port 4173 & node scripts/screenshots.mjs [outDir] [route...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL ?? 'http://localhost:4173';
const out = process.argv[2] ?? 'docs/screenshots';
const only = process.argv.slice(3);
mkdirSync(out, { recursive: true });

const shots = [
  { name: 'home', path: '/' },
  { name: 'home-light', path: '/', theme: 'light' },
  { name: 'smart-contracts', path: '/smart-contracts?t=2026-10-12T11:00' },
  { name: 'repatriation', path: '/repatriation?t=2026-10-10T21:00' },
  { name: 'sweep', path: '/sweep' },
  { name: 'put-to-work', path: '/put-to-work?t=2026-10-07T21:30' },
  { name: 'pre-validation', path: '/pre-validation?t=2026-10-12T11:00' },
  { name: 'just-in-time', path: '/just-in-time?preset=tokyo&t=2026-10-10T21:00' },
  { name: 'tms', path: '/tms' },
  { name: 'business-case', path: '/business-case' },
  { name: 'incidents', path: '/incidents' },
  { name: 'approvals', path: '/approvals' },
  { name: 'hood', path: '/week?t=2026-10-10T22:00', hood: true },
  { name: 'minute', path: '/minute#group-day' },
].filter((s) => only.length === 0 || only.includes(s.name));

const browser = await chromium.launch();
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await ctx.addInitScript((theme) => {
    localStorage.setItem('tcm.banner', 'true');
    localStorage.setItem('tcm.theme', JSON.stringify(theme));
  }, s.theme ?? 'dark');
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error(`[${s.name}] page error:`, e.message));
  page.on(
    'console',
    (m) => m.type() === 'error' && console.error(`[${s.name}] console:`, m.text()),
  );
  await page.goto(base + s.path, { waitUntil: 'networkidle' });
  if (s.hood) await page.getByTestId('hood-toggle').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${s.name}.png`, fullPage: !!process.env.FULL });
  await ctx.close();
  console.log('shot', s.name);
}
await browser.close();
