# Assumptions

Where the brief was silent or ambiguous, these are the choices made. Each keeps the doctrine
intact and shows the traditional tool honestly. No clarifying questions were asked before
building.

## Scenario

- **A-1 · Rules run every business night.** The brief spells out Monday and Friday. Tuesday,
  Wednesday and Thursday nights run the same rules (sweep above EUR 20m at 18:30, overnight unit,
  night sweep at 19:10, return at 07:00). Each morning's return restores the daytime position, so
  every row of the §3.1 table is unchanged. This is also what makes row 8's "inside the overnight
  unit at night" true.
- **A-2 · Other-bank surplus.** HSBC holds EUR 60m and needs EUR 45m tomorrow; Deutsche Bank holds
  EUR 45m and needs EUR 36m. The sweep takes the difference: EUR 15m and EUR 9m. On Friday the
  night sweep is folded into row 12 at 18:30, as the table does.
- **A-3 · Row 15 does not balance as written.** After row 14 the bank holds 5 (current) + 70.5
  (units, incl. the released 15) = 75.5 on the relevant drawers; row 15 needs 65 + 30.5 = 95.5 on
  those drawers *after* returning EUR 24m to HSBC and Deutsche Bank. The gap is EUR 44m. An extra
  event **x4 (Sun 16:00)** brings EUR 44m of weekend instant collections, final at once and placed
  in a weekend unit that minute — which also illustrates "late cash earns" on a Sunday.
- **A-4 · Friday threshold.** Row 12 leaves EUR 5m on the current account, so the sweep threshold
  on Friday (weekend) is EUR 5m instead of EUR 20m.
- **A-5 · Just-in-time funding.** No headline event uses intraday credit, so the counter would stay
  at zero. Two extra events add it: **x1** Munich pays EUR 4m at Wed 21:15 and goes below zero;
  **x2** its expected receipt arrives at Thu 06:30. 555 minutes at 2.50 % (mock intraday rate) =
  EUR 107. The funding rule prefers intraday credit when a receipt is expected before opening,
  rather than unwinding units. Group-level balance stays positive throughout.
- **A-6 · Singapore supplier.** The supplier is paid at Sun 02:00 Paris (Mon 08:00 SGT), event **x3**.
- **A-7 · Return targets.** The return rule brings the current account to the day's need from the
  cash forecast: Tue–Thu EUR 80m, Fri EUR 30m, Mon EUR 65m (rows 6, 11, 15).
- **A-8 · Row 17 timing.** The brief says 10:05 and "simulate by jumping the clock to 20:00". The
  event sits at Mon 20:00 so the clock shows night when the payment is refused.
- **A-9 · Row 7 choice.** The USD receipt is placed in the USD 1-month unit (the default). The
  "convert" option is described, not simulated.

## Interest and counters

- **A-10 · Daily convention posts at midnight.** Current-account interest (both set-ups) is
  computed on the balance at 23:59 and appears in the counter when the day ends. That is why the
  traditional counter reads EUR 0 on Monday evening.
- **A-11 · Same euro, two accounts.** The brief says "14 hours at 1.80 %". Doctrine 5 unwinds the
  unit at 07:00, so the page shows 12 hours in the unit at 1.80 % plus 2 hours on the account at
  0.10 %: EUR 25.23 per EUR 1m, against EUR 13.89 on the current account.
- **A-12 · Traditional twin.** Everything on the current account at 0.50 % daily; the 3-month
  classic deposit at 2.20 % daily; fund at 1.95 % from Friday 09:00 (order after cut-off); the bid
  bond as a cash gage at 0 %, released by the back office on Monday 09:00; Singapore pre-funded
  Friday 17:00; weekend collections land on the current account; on Monday the deposit is broken
  (accrued interest on EUR 20m forfeited + 5 bps break cost). Cash at other banks earns 0 % in both
  set-ups.
- **A-13 · New-layer counter.** Current account (daily) + tokenised account (0.10 % to the minute on
  free and blocked balances) + units (their rate to the minute) + fund (1.95 % to the minute),
  minus intraday credit cost and the 2 bps spread on units sold. USD converted at 1.08.
- **A-14 · Hours counters.** "Off-hours" is any time outside Mon–Fri 09:00–18:00. Traditional: all
  off-hours are idle. New: off-hours during which overnight or weekend units exist.
- **A-15 · Mirror intragroup balance** is remunerated at the overnight unit rate (1.80 %) on the
  same clock. It stays open until the end of the week (intragroup settlement is out of scope).
- **A-16 · Interest is not credited to principal** during the week. Accrued amounts are posted to
  the classic interest engine; this keeps the state table exact to the euro.

## Product and data

- **A-17 · Current accounts.** The "Current" column is the Paris header account; Munich and Madrid
  current accounts are zero-balanced into it every evening (traditional cash pooling).
- **A-18 · Other banks.** EUR 180m sits outside the bank: HSBC 60, Deutsche Bank 45, Santander 40
  (not swept), local banks in Brazil, Mexico, Poland and the US 35 (EUR equivalent).
- **A-19 · Names are fictitious.** The group, subsidiaries, supplier and tender are invented. Bank
  names are those given in the brief.
- **A-20 · Time zone.** The week falls under CEST; the UI labels times "CET" as the brief does. The
  engine counts wall-clock minutes, so daylight saving never interferes.
- **A-21 · Your actions.** Colleagues can buy or sell units, fund subsidiaries, subscribe to the
  fund and approve payments. These are replayed on top of the scenario at the minute they were
  taken; later scenario events can then show different numbers. "Reset to scenario" removes them.
  Unit tests always use the pure scenario.
- **A-22 · shadcn/ui.** Components are written in the shadcn/ui style on Radix primitives (no CLI
  download) so the project installs offline from npm alone.
- **A-23 · Lighthouse** was measured with the desktop profile (the product targets desktop and
  tablet): Performance 94–100, Accessibility 100 on the pages checked.
