import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('tcm.banner', 'true');
    localStorage.removeItem('tcm.demo');
  });
});

/** Maker / checker: submit, then give the second signature (allowed in the demo). */
async function approve(page: Page) {
  await page.getByRole('button', { name: 'Submit for second signature' }).click();
  await page.getByRole('button', { name: /^Approve as / }).click();
}

test('cockpit opens on Monday 08:30 with value, alerts and approvals — without Play', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Group cash position' })).toBeVisible();
  await expect(page.locator('header')).toContainText('Mon 08:30');
  await expect(page.getByText('Local buffers released')).toBeVisible();
  await expect(
    page.getByText('Tokyo needs JPY 1.37bn on Mon 12 Oct, 09:00 Tokyo time'),
  ).toBeVisible();
  await expect(page.getByText('Waiting for your approval')).toBeVisible();
  const total = await page.getByText('Total value, a year').locator('..').innerText();
  expect(total).toMatch(/EUR [1-9]/);
});

test('approving a request from a subsidiary executes it and writes the audit trail', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  await page.getByRole('link', { name: /^Approvals/ }).click();
  await expect(page.getByText(/Approved \(second signature\)/).first()).toBeVisible();
});

test('demo mode: play the week, counters move', async ({ page }) => {
  await page.goto('/week');
  await page.getByTestId('demo-toggle').click();
  await page.getByRole('radio', { name: '8×' }).click();
  await page.getByTestId('play').click();
  await page.waitForTimeout(6000);
  await page.getByTestId('play').click();
  const strip = page.locator('header [aria-live="polite"]').first();
  const amounts = [...(await strip.innerText()).matchAll(/EUR\s([\d,]+)/g)].map((m) =>
    Number(m[1].replace(/,/g, '')),
  );
  expect(amounts[0]).toBeGreaterThan(0);
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

test('under the hood opens with its tabs and links to the business case', async ({ page }) => {
  await page.goto('/week?t=2026-10-10T22:00');
  await page.getByTestId('hood-toggle').click();
  const panel = page.getByTestId('hood-panel');
  for (const tab of [
    'Ledger',
    'Orchestration',
    'Accrual',
    'Asset-liability management',
    'Bank view',
    'Intragroup',
    'Not yet',
  ]) {
    await panel.getByRole('tab', { name: tab }).click();
  }
  await panel.getByRole('tab', { name: 'Intragroup' }).click();
  await expect(panel).toContainText('Norvane Bank Singapore');
  await panel.getByRole('link', { name: /business case/ }).click();
  await expect(page.getByRole('heading', { name: 'Business case' })).toBeVisible();
});

test('smart contracts: cascade pays three suppliers after the challenge window', async ({
  page,
}) => {
  await page.goto('/smart-contracts?t=2026-10-12T11:00');
  await page.getByRole('button', { name: /Deploy — earmark/ }).click();
  await approve(page);
  await page.getByRole('button', { name: /Send signed event: Site acceptance/ }).click();
  await expect(page.getByText(/pays at 12:00 unless contested/)).toBeVisible();
  await page.getByTestId('demo-toggle').click();
  await page.getByTestId('step').click();
  await expect(page.getByText('Elektro-Mazowsze (electrical subcontractor)').last()).toBeVisible();
  await expect(page.getByText(/Paid EUR 9.50m/)).toBeVisible();
});

test('just in time: Tokyo preset from the cockpit alert, scheduled through maker / checker', async ({
  page,
}) => {
  await page.goto('/?t=2026-10-10T21:00');
  await page.getByRole('link', { name: /Schedule just in time/ }).click();
  await expect(page.getByText('Local buffers you no longer need')).toBeVisible();
  await page.getByRole('button', { name: /Schedule at the minute of need/ }).click();
  await approve(page);
  await expect(page.getByRole('button', { name: /Approved and executed/ }).first()).toBeVisible();
});

test('Brazil: the rate cannot be locked before the flow is qualified', async ({ page }) => {
  await page.goto('/repatriation?t=2026-10-10T21:00');
  const lock = page.getByRole('button', { name: 'Lock the rate and repatriate' });
  await expect(lock).toBeDisabled();
  for (const box of await page.locator('ul input[type=checkbox]').all()) await box.check();
  await page.getByRole('button', { name: 'Qualify this framework, once' }).click();
  await expect(lock).toBeEnabled();
  await lock.click();
  await approve(page);
  await page.getByTestId('demo-toggle').click();
  for (let i = 0; i < 5; i++) await page.getByTestId('step').click();
  await expect(page.getByText(/Earning to the minute from this moment/)).toBeVisible();
});

test('incidents, TMS and sweep pages render', async ({ page }) => {
  await page.goto('/incidents');
  await expect(page.getByText('Tokyo — night foreign exchange limit reached')).toBeVisible();
  await page.goto('/tms');
  await expect(page.getByText('The statement line your team reconciles')).toBeVisible();
  await page.goto('/sweep');
  await expect(page.getByText('If this rule had run last week')).toBeVisible();
});

test('guided tour: eleven steps, the presenter advances, each step on its page', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('tour-start').click();
  const expected = [
    '/',
    '/',
    '/repatriation',
    '/put-to-work',
    '/pre-validation',
    '/put-to-work',
    '/us-surplus',
    '/incidents',
    '/just-in-time',
    '/just-in-time',
    '/tour-recap',
  ];
  for (let i = 0; i < expected.length; i++) {
    await expect(page.getByTestId('tour-panel')).toContainText(`Step ${i + 1} of 11`);
    await expect.poll(() => new URL(page.url()).pathname).toBe(expected[i]);
    await expect(page.getByText('This step is on another page.')).toHaveCount(0);
    if (i < expected.length - 1) await page.getByTestId('tour-next').click();
  }
  await expect(page.getByText('This week so far')).toBeVisible();
  await page.getByTestId('tour-finish').click();
  await expect(page.getByRole('heading', { name: 'Business case' })).toBeVisible();
});

test('brief of 30/09: stablecoin pre-validation, just-in-time foreign exchange cost, USD sweep, committed, group day', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Committed, not gone').first()).toBeVisible();

  await page.goto('/pre-validation');
  await expect(page.getByText('Inbound stablecoin — Brazil repatriation')).toBeVisible();
  await expect(page.getByText('Checked automatically, at each transfer')).toBeVisible();

  await page.goto('/just-in-time?preset=riyadh');
  await expect(page.getByText('What the conversion costs you')).toBeVisible();
  await page.getByRole('radio', { name: /Lock the rate on Friday/ }).click();
  await expect(page.getByText('Where the dollars come from, in order')).toBeVisible();

  await page.goto('/sweep');
  await page.getByRole('tab', { name: 'Dollar — Lefèvre Inc (United States)' }).click();
  await expect(page.getByRole('link', { name: /Keep it working with us/ })).toBeVisible();

  await page.goto('/minute#group-day');
  await expect(page.getByText('A multi-time-zone day')).toBeVisible();
  await expect(page.getByText('Lefèvre Singapore', { exact: true })).toBeVisible();
});

test('US surplus: alert, rule, fund settlement step by step, bank view', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Keep it working with us/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Keep the US surplus working — with us' }),
  ).toBeVisible();
  await expect(page.getByText('Who holds the cash leg keeps the flows')).toBeVisible();
  await page.getByRole('link', { name: /How the fund order settles/ }).click();
  await expect(page.getByText('Step 1 of 5')).toBeVisible();
  await page.getByTestId('settle-next').click();
  await expect(page.getByText('Step 2 of 5')).toBeVisible();
  await expect(
    page.getByText('Tokenisation moves the register, not the other five clocks.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sunday 10:00' }).click();
  await expect(page.getByText(/Fund closed: in both paths/)).toBeVisible();

  await page.goto('/just-in-time?preset=tokyo&source=fund');
  await expect(page.getByRole('radio', { name: /USD fund redemption/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByText('Where the dollars come from, in order')).toBeVisible();
});
