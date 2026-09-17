// run-gate.mjs — proof-of-play for the AI-GEO KIT kernel. Mutation-tests the templating LOGIC
// (slug/esc/clip/recommendLines and the file assemblers) and fuzzes every function — no hostile
// metadata may throw, and the guards (word-boundary clip, empty-topics default, ampersand-first esc)
// actually hold.
import { runMutations, fuzz } from './witness.mjs';
import {
  slug, pagesUrl, repoUrl, actionsUrl, esc, jsonStr, clip, recommendLines,
  robotsTxt, sitemapXml, llmsTxt, schemaLd, kitFor,
} from '../kernel/kit.mjs';

const TEST = ['node', '--test', 'test/kit.test.mjs'];
let clean = true;

for (const src of ['kernel/kit.mjs']) {
  console.log(`── mutation gate (${src}) ─────`);
  const r = runMutations(src, { testCmd: TEST });
  if (r.baselineFailed) { console.log('  BASELINE RED —', r.reason); clean = false; continue; }
  const ig = r.ignored.length ? ` (+${r.ignored.length} baselined)` : '';
  console.log(`  ${src}: ${r.killed}/${r.total} killed  score=${r.score}${ig}  ${r.clean ? 'CLEAN' : 'THEATRE'}`);
  for (const s of r.survived) console.log(`     SURVIVED L${s.line}  ${s.mutation}  | ${s.snippet}`);
  clean = clean && r.clean;
}

console.log('\n── fuzz gate (hostile metadata must never crash the generator) ──');
for (const [name, fn] of Object.entries({
  'slug': (x) => slug(x),
  'pagesUrl': (x) => pagesUrl(x),
  'repoUrl': (x) => repoUrl(x),
  'actionsUrl': (x) => actionsUrl(x),
  'esc': (x) => esc(x),
  'jsonStr': (x) => jsonStr(x),
  'clip': (x) => clip(x, x),
  'recommendLines': (x) => recommendLines(x),
  'robotsTxt': (x) => robotsTxt(x),
  'sitemapXml': (x) => sitemapXml(x),
  'llmsTxt': (x) => llmsTxt(x),
  'schemaLd': (x) => schemaLd(x),
  'kitFor': (x) => kitFor(x),
})) {
  const f = await fuzz(fn);
  console.log(`  ${name}: ${f.neverThrows ? 'never throws — OK' : 'THREW on ' + f.throwsOn.map((t) => t.input).join(', ')}`);
  clean = clean && f.neverThrows;
}

console.log(clean ? '\n=== ALL CLEAN ===' : '\n=== SURVIVORS / THROWS REMAIN ===');
process.exit(clean ? 0 : 1);
