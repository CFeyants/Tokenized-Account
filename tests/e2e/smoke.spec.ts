import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('tcm.banner', 'true'));
});

test('play the week: counters move and stay non-zero', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Treasury, counted in minutes.' })).toBeVisible();
  await page.getByRole('radio', { name: '8×' }).click();
  await page.getByTestId('play').click();
  // Monday 09:00 → past Monday night's sweep at 8× speed takes a few seconds.
  await page.waitForTimeout(6000);
  await page.getByTestId('play').click();
  const strip = page.locator('header [aria-live="polite"]').first();
  const text = await strip.innerText();
  const amounts = [...text.matchAll(/EUR\s([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));
  expect(amounts[0]).toBeGreaterThan(0); // with the ledger
  expect(amounts.some((a) => a > 0)).toBe(true);
});

test('stepping reaches the last event of the week', async ({ page }) => {
  await page.goto('/?t=2026-10-12T10:00');
  for (let i = 0; i < 6; i++) await page.getByTestId('step').click();
  await expect(page.locator('header')).toContainText('Mon 2');
});

test('night payment to a non-client is not available, with the SCT Inst fallback', async ({
  page,
}) => {
  await page.goto('/payments?t=2026-10-12T20:00&tab=ledger');
  await page.getByTestId('pay-non-client').click();
  const alert = page.getByTestId('not-available');
  await expect(alert).toContainText('interbank ledger, 2028');
  await expect(alert.getByRole('button', { name: /SCT Inst/ })).toBeEnabled();
});

test('the USD receipt is pending cover until Tuesday 10:30', async ({ page }) => {
  await page.goto('/accounts?t=2026-10-06T10:29');
  await expect(page.getByText('Pending cover').first()).toBeVisible();
  await page.goto('/accounts?t=2026-10-06T10:31');
  await expect(page.getByText('Pending cover')).toHaveCount(0);
});

test('under the hood opens with its tabs', async ({ page }) => {
  await page.goto('/?t=2026-10-10T22:00');
  await page.getByTestId('hood-toggle').click();
  const panel = page.getByTestId('hood-panel');
  for (const tab of ['Ledger', 'Orchestration', 'Accrual', 'ALM', 'Intragroup', 'Not yet']) {
    await panel.getByRole('tab', { name: tab }).click();
  }
  await panel.getByRole('tab', { name: 'Intragroup' }).click();
  await expect(panel).toContainText('BNP Paribas Singapore');
});
