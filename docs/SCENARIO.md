# The simulated week

Copied from §3.1 of the brief. Amounts in EUR m unless stated. Columns after each event:
Current / Tokenised free / Tokenised blocked / Term units / Fund units.
The week starts on **Monday 5 October 2026**; times are Paris wall-clock time.

| # | Moment | Actor | Event | State after |
|---|---|---|---|---|
| 0 | Mon 09:00 | — | Week starts. Payments day. | 120 / 0 / 0 / 0 / 0 |
| 1 | Mon 11:20 | Marie | Approves a SEPA supplier batch (EUR 8.4m) and a payroll file (Spain, EUR 2.1m) — traditional tools, nothing new. | 109.5 / 0 / 0 / 0 / 0 |
| 2 | Mon 17:45 | Event | Instant collection from a key customer, EUR 12m, final at 17:45 (SCT Inst). Traditional: earns sight rate for the day. | 121.5 / 0 / 0 / 0 / 0 |
| 3 | Mon 18:30 | Rule | Last cut-off passed. Rule "sweep surplus above EUR 20m to tokenised account" fires; rule "buy overnight unit on idle balance" fires at once. | 20 / 0 / 0 / 101.5 (overnight) / 0 |
| 4 | Mon 19:10 | Event | Night sweep from HSBC (EUR 15m) and Deutsche Bank (EUR 9m) by instant transfer — final at once — straight into the overnight unit. | 20 / 0 / 0 / 125.5 / 0 |
| 5 | Mon 22:00 | Event | USD 10m receipt announced by correspondent for the US subsidiary; cover not yet on our nostro → shown as "pending, not earning yet". | unchanged (+ pending USD 10m) |
| 6 | Tue 07:00 | Rule | Overnight unit unwound; return rule sends EUR 60m to current account, EUR 15m back to HSBC, EUR 9m back to Deutsche (their day needs), keeps EUR 41.5m on tokenised account as group buffer. | 80 / 41.5 / 0 / 0 / 0 |
| 7 | Tue 10:30 | Event | USD cover received on nostro → USD 10m becomes final; user chooses: keep in USD term unit (1 month, 3.90 %) or convert. Default: term unit. | + USD 10m term unit |
| 8 | Wed 11:00 | Marie | Brazil subsidiary needs a bid bond for a tender, EUR 15m equivalent. Marie blocks EUR 15m on the tokenised account as collateral; the bank issues the guarantee. Blocked amount keeps earning (0.10 % account rate + it is inside the overnight unit at night). Show the traditional alternative side by side: cash gage on a blocked account at 0 %. | 80 / 26.5 / 15 / 0 / 0 |
| 9 | Thu 17:00 | Marie | Cash forecast (traditional tool) shows EUR 50m durable surplus → Marie buys a 3-month term unit at 2.20 % from the tokenised account (first sweeping 50 from current). | 30 / 26.5 / 15 / 50 (3m) / 0 |
| 10 | Thu 17:30 | Marie | Marie also subscribes EUR 10m of the tokenised money market fund from the tokenised account (order within fund hours? No — 17:30 is after 15:00 → order queued for Friday 09:00; cash stays in overnight unit meanwhile; show this). | queued |
| 11 | Fri 09:00 | Event | Fund order settles DvP on the ledger. | 30 / 16.5 / 15 / 50 / 10 |
| 12 | Fri 18:30 | Rule | Weekend sweep: three-day unit bought on all idle tokenised cash (incl. blocked part? No — blocked amount stays blocked but earns the unit rate through a "blocked-in-unit" state; implement as: blocked part is included in the unit but flagged non-transferable). Night sweep from other banks again (EUR 24m). | 5 / 0 / 15 (in unit) / 50 + 65.5 (3-day) / 10 |
| 13 | Sat 22:00 | Marie | Singapore subsidiary must pay a supplier Monday 08:00 SGT (= Sun 02:00 CET). Marie funds it with EUR 10m → SGD, out-of-hours FX at the bank's desk within the night limit, from the group balance. Show: the three-day unit is partly unwound to the minute; the intragroup mirror balance appears in "under the hood"; the subsidiary account (BNP Paribas Singapore) is credited at once. Traditional alternative: wait until Monday, or pre-fund on Friday and lose the weekend interest. | −10 from 3-day unit |
| 14 | Sun 19:00 | Event | Brazil tender lost → guarantee expires → automatic release of the EUR 15m block; interest shown for every minute it was blocked (Wed 11:00 → Sun 19:00). | blocked 0 |
| 15 | Mon 07:00 | Rule | Units unwound; return rule executes; week-1 interest statement generated. | 65 / 30.5 / 0 / 50 / 10 |
| 16 | Mon 10:00 | Marie | Acquisition signs early: Marie needs EUR 20m today. She sells EUR 20m of the 3-month unit to the bank at the day's price (show price = par + accrued − small spread), cash on the tokenised account in minutes. Traditional alternative: break a term deposit → penalty, or overdraft for a day. | 65 / 50.5 / 0 / 30 / 10 |
| 17 | Mon 10:05 | Marie | Tries to pay a non-client supplier at another bank from the tokenised account outside hours (simulate by jumping the clock to 20:00) → blocked with the message "Available when banks exchange tokenised deposits (interbank ledger, 2028). Use SCT Inst instead." and a one-click fallback to a normal instant transfer. | — |

`tests/unit/scenario.test.ts` asserts every "State after" column above. Row 17 is placed at
Mon 20:00 in the engine (assumption A-8).

## Events the engine adds

These are needed for the rules to run "every night" and for the table to reconcile. They are
marked `kind: 'auto'` or `kind: 'extra'` in `src/engine/scenario.ts` and explained in
[ASSUMPTIONS.md](ASSUMPTIONS.md).

| Id | Moment | Kind | What |
|---|---|---|---|
| a_sweep_1…3, 7 | Tue–Thu, Mon 12 at 18:30 | auto | Surplus sweep + overnight unit |
| a_night_1…3, 7 | Tue–Thu, Mon 12 at 19:10 | auto | Night sweep from HSBC and Deutsche Bank |
| a_return_2…4 | Wed–Fri at 07:00 | auto | Units unwound, return rule |
| x1 | Wed 21:15 | extra | Munich pays EUR 4m by SCT Inst; intraday credit to the minute |
| x2 | Thu 06:30 | extra | Munich receives EUR 4m; back to zero |
| x3 | Sun 02:00 | extra | Singapore supplier paid (Mon 08:00 SGT) |
| x4 | Sun 16:00 | extra | Weekend instant collections, EUR 44m, into a weekend unit |
