# Contributing

Thank you for improving the mock-up. Two rules: keep the doctrine in
[docs/DOCTRINE.md](docs/DOCTRINE.md) intact, and keep every client-facing string in
[`src/i18n/en.ts`](src/i18n/en.ts).

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine unit tests
npm run lint
npm run e2e        # Playwright smoke tests (first time: npx playwright install chromium)
```

## Add a scenario event

The week is data: [`src/engine/scenario.ts`](src/engine/scenario.ts). Every screen reads the same
timeline, so a new event shows up everywhere (feed, timeline, ledger, counters).

1. **Write the copy** in `src/i18n/en.ts` under `scenario`:

   ```ts
   x5: { title: 'Warsaw receives a PLN customer payment', detail: 'Final at once by instant transfer.' },
   ```

2. **Add the event** to `SCENARIO`, at its time. `at(day, 'HH:MM')` builds the time — day 0 is
   Monday 5 October. Use `kind: 'extra'` for anything that is not a row of the brief.

   ```ts
   ev('x5', at(3, '14:10'), 'event', 'extra', 'traditional', (s, c) => {
     book(s, c, 'cur-paris', 2 * M, 'SCT Inst received — final');
   }),
   ```

   The callback receives a draft `State` and a `Ctx`. Use the helpers in `src/engine/ops.ts`
   (`book`, `move`, `buyUnit`, `partialUnwind`) so every movement writes its ledger entry, and
   `c.orchestrate({...})` to explain the decision under the hood.

3. **Mirror it in the traditional twin** (`TRAD_EVENTS`) if it changes what a treasurer without the
   ledger would hold, so the two counters stay comparable.

4. **Test it.** Add the expected state to `tests/unit/scenario.test.ts`, and run `npm test`. If an
   existing row changes, you have probably broken the story; check with the owner of the brief.

5. **Document it** in `docs/SCENARIO.md` (and `docs/ASSUMPTIONS.md` if you had to choose).

## Conventions

- Plain English, short sentences. Never: blockchain, wallet, crypto, smart contract, token. Say
  ledger, account, unit, rule, blocked, released, final. `tests/unit/copy.test.ts` checks this.
- Green = what the ledger adds, grey = what works today, dashed = outside the bank, amber = units
  and fund. Use `LayerTag` to label a card.
- Engine code is pure and tested; screens only read from `useSim()`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`…).
