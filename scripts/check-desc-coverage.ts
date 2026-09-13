import { BUILT_JONT_IDS } from '../src/lib/jont-runtime/engines/index.ts';
import { CLIENT_BUILT_JONT_IDS } from '../src/lib/jont-runtime/client-engines/index.ts';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('spec/catalog/jonts.seed.json', 'utf8'));
const descIds = new Set(
  [...readFileSync('scripts/rewrite-built-descriptions.mjs', 'utf8').matchAll(/^  (J\d{3}):/gm)].map((m) => m[1]),
);

const all = [...BUILT_JONT_IDS, ...CLIENT_BUILT_JONT_IDS];
const numToJontId = (s: string) => `J${s.match(/jont_j(\d+)/)![1]}`;

for (const id of all) {
  const n = numToJontId(id);
  if (!descIds.has(n)) console.log('NO COPY FOR:', id, '->', n);
}
console.log('total built:', all.length, '| copy entries:', descIds.size);
