import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@/i18n/en';

/** Every string in the i18n tree, functions called with a placeholder. */
function strings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node);
  else if (typeof node === 'function')
    out.push(String((node as (...a: string[]) => unknown)('x', 'y')));
  else if (Array.isArray(node)) node.forEach((n) => strings(n, out));
  else if (node && typeof node === 'object') Object.values(node).forEach((n) => strings(n, out));
  return out;
}

/** Never in client-facing copy. */
const BANNED = [/blockchain/i, /crypto/i, /\btokens?\b/i];
/**
 * Allowed only where the product owner asked for them: corridors (partner wallets, euro
 * stablecoin) and escrow (smart contract). Everywhere else the ledger vocabulary applies.
 */
const SCOPED = [/wallet/i, /smart contract/i, /stablecoin/i];
const SCOPED_SECTIONS = [
  'tour',
  'incidents',
  'bc',
  'funding',
  'sweep',
  'adv',
  'corridors',
  'escrow',
  'contracts',
  'journeys',
  'repatriation',
  'about',
  'hood',
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

describe('client-facing copy', () => {
  it('uses no crypto vocabulary; wallet, stablecoin and smart contract only in corridors and escrow', () => {
    for (const [section, node] of Object.entries(en)) {
      for (const s of strings(node)) {
        for (const re of BANNED) expect(s, s).not.toMatch(re);
        if (!SCOPED_SECTIONS.includes(section))
          for (const re of SCOPED) expect(s, `${section}: ${s}`).not.toMatch(re);
      }
    }
  });

  it('keeps the product names', () => {
    expect(en.product.name).toBe('Tokenised account');
    expect(en.product.units).toBe('Term units');
    expect(en.product.fund).toBe('Tokenised fund');
    expect(en.product.hood).toBe('Under the hood');
    expect(en.product.tagline).toBe('Treasury, counted in minutes.');
  });

  it('screens contain no banned words in JSX text either', () => {
    for (const f of files('src')) {
      const src = readFileSync(f, 'utf8');
      const text = [...src.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
      for (const t of text) for (const re of BANNED) expect(t, `${f}: ${t}`).not.toMatch(re);
    }
  });
});
