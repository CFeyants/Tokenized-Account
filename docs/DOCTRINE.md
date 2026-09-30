# Product doctrine

Copied from §2 of the brief. The mock-up's logic implements these rules literally; the engine
tests in `tests/unit/` assert the ones that can be asserted.

1. **The tokenised account is a service account, not a yield account.** Its interest rate is at or below the ordinary current account's rate (use 0.10 % vs 0.50 % for the current account in the mock). It never pays more than the current account. Its value is what it does, not what it pays.

2. **Time is counted, not days.** On the tokenised account, both the positive balance and any negative (intraday overdraft) are accrued to the minute on time-stamped balances. On the current account, interest is computed on the end-of-day balance with a daily convention (a euro that arrives at 19:00 and leaves at 09:00 counts for a full day at the sight rate).

3. **The clock follows finality.** Interest to the minute runs only from the minute funds are final on the paying entity's books. Within one legal entity: immediate. Between two Group entities: immediate for the client, with a mirror intragroup balance (shown in an "under the hood" panel). From another bank: only when the funds are final — instant transfers (SCT Inst) are final at once; correspondent-bank payments are final only when the nostro is credited (show a "pending cover, not yet earning" state for a USD receipt from a correspondent).

4. **Yield lives in term units, bought from the tokenised account.** A term unit is a term deposit issued as a unit on the ledger: fixed amount, fixed rate, maturity from overnight to 12 months. It can be transferred before maturity (to a group entity, to another client of the bank, or to the bank as market maker at the day's price), with accrued interest split to the minute. It is never broken. Rates in the mock (indicative, euro): overnight / weekend unit 1.80 %, 1 month 2.05 %, 3 months 2.20 %, 6 months 2.30 %, 12 months 2.35 %. Current account 0.50 %, tokenised account 0.10 %, money market fund 1.95 % (net), classic term deposit 2.05–2.35 % (breakable with penalty).

5. **Late cash earns.** Any balance that becomes final on the tokenised account after the last cut-off (18:00) is, by rule, placed into an overnight unit that minute (three-day unit on Friday), and unwound by rule before opening (07:00). Cash final at 19:00 earns the overnight rate from 19:00 — and all weekend if it is Friday.

6. **Collateral keeps earning.** An exact amount can be blocked (earmarked) on the tokenised account, or a term unit / fund unit pledged, as collateral for a guarantee, a margin call or an escrow. The blocked amount keeps earning until the minute it is released; release is automatic on an event (expiry date, document received, tender result).

7. **Just-in-time funding.** A subsidiary can be funded the minute it needs it, at any hour, from the group's consolidated balance on the ledger; it pays only for the minutes it borrows (intraday overdraft to the minute).

8. **Out-of-hours FX is for intragroup funding, not a trading product.** One conversion at the bank's markets desk, within a published position limit (mock: EUR 25m equivalent per night, USD/SGD/BRL/MXN/PLN), only to fund a subsidiary in another currency outside business hours.

9. **The tokenised money market fund is an option, not the engine.** It is bought and sold from the tokenised account, settled on the same ledger (DvP), for clients who already use funds and for the dollar leg. No cash leaves the ledger between the two. Fund units can be pledged as collateral. It trades within fund hours (mock: orders accepted 09:00–15:00, settled at once on the ledger; outside those hours the order is queued and the cash stays in the overnight unit — show this).

10. **The night sweep brings cash from other banks.** A rule sweeps the surplus of accounts at other banks after their cut-off to the tokenised account by instant transfer (today the only rail final all night between banks; later, interbank tokenised deposits), buys the overnight unit, and returns before opening only what each bank needs the next day, not everything.

11. **What does not change.** Domestic and SEPA payments, payroll, tax, cash forecasting, statements and reconciliation (ISO 20022 camt.053/camt.054), closing/IAS 7, intragroup netting rules. The mock-up must show these tools working normally and must not claim the new layer improves them.

12. **Across banks, not yet.** Paying a counterparty banked elsewhere at night, PvP FX with another bank, settling an asset with a non-client: these require the interbank layer (2028+). Show them as "not available yet — interbank ledger, 2028" with a tooltip, not as working features.

## Changes decided by the product owner

- **Doctrine 12 kept.** Interbank use cases are shown to explain, with a "Not right away" label
  (2028+). See ASSUMPTIONS A-30.
- **Six journeys.** The mock-up is organised around six client journeys (smart contracts, Brazil
  repatriation, earning to the minute, collateral and buffer, pre-validation, just-in-time
  funding); everyday banking stays one click away.
- **Stablecoin corridor.** Repatriation from Brazil, Mexico, Colombia and Chile through partner
  wallets and a euro stablecoin redeemed at par onto the tokenised account (A-32).
- **Vocabulary.** Wallet, stablecoin and smart contract are allowed in the corridor and escrow
  modules only (A-33).

## Where each rule lives in the code

| #   | Implementation                                                | Test                                           |
| --- | ------------------------------------------------------------- | ---------------------------------------------- |
| 1   | `src/data/rates.ts` (`tokenised ≤ current`)                   | `engine.test.ts` › doctrine                    |
| 2   | `src/engine/accrual.ts` (`integrateMinutes`, `integrateEod`)  | `engine.test.ts` › accrual                     |
| 3   | `src/engine/finality.ts`, event `e5`/`e7` in `scenario.ts`    | `engine.test.ts` › no interest before finality |
| 4   | `src/engine/pricing.ts` (`unitSaleQuote`), event `e16`        | `engine.test.ts` › pricing                     |
| 5   | `src/engine/rules.ts` (`runOvernightUnit`, `runReturn`)       | `scenario.test.ts` rows 3, 4, 6, 12            |
| 6   | event `e8`, `releaseCollateral`                               | `scenario.test.ts` rows 8, 12, 14              |
| 7   | events `x1`/`x2`, `debitWeight`                               | `engine.test.ts` › intraday credit             |
| 8   | event `e13`, `fxNightQuote`, `NIGHT_FX_LIMIT_EUR`             | `scenario.test.ts` row 13                      |
| 9   | events `e10`/`e11`, `userActions.ts` (`fund`)                 | `scenario.test.ts` rows 10, 11                 |
| 10  | `runNightSweep`, `runReturn`                                  | `engine.test.ts` › night sweeps                |
| 11  | Payments (SEPA, cross-border), Statements, Rules › forecast   | copy review                                    |
| 12  | Payments › Intragroup on the ledger; Under the hood › Not yet | Playwright smoke test                          |
