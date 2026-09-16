#!/usr/bin/env node
// rollout.mjs — stamp the AI/GEO kit across the estate. Reads the estate index, and for every LIVE,
// non-companion, public repo writes the three SAFE standalone files (robots.txt, llms.txt, sitemap.xml)
// via the GitHub API. Additive only: it NEVER overwrites a file that already exists (so hand-crafted
// kits stay), and standalone files cannot break a page. Schema.org injection into index.html is NOT done
// here — that is HTML surgery on 400+ varied pages and stays a per-repo, verified step (see stamp-schema).
//
//   node rollout.mjs [--offset N] [--limit M] [--dry]
//
// Resumable: run in batches with --offset/--limit; re-runs skip what is already stamped.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { kitFor } from './kernel/kit.mjs';

const OWNER = 'sjgant80-hub';
const INDEX = process.env.ESTATE_INDEX || 'C:/Users/sjgan/.claude/projects/C--Users-sjgan--claude/memory/estate-index.json';
const SAFE_FILES = ['robots.txt', 'llms.txt', 'sitemap.xml'];

const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const offset = parseInt(flag('--offset', '0'), 10) || 0;
const limit = parseInt(flag('--limit', '0'), 10) || 0;
const dry = args.includes('--dry');

const idx = JSON.parse(readFileSync(INDEX, 'utf8'));
if (!Array.isArray(idx.nodes) || idx.nodes.length < 100) { console.error('REFUSED: estate index looks thin — regenerate it first.'); process.exit(1); }
const companion = (n) => /-(api|mcp|sdk)$/.test(n.name || '');
const targets = idx.nodes
  .filter((n) => n.live && !n.private && !n.archived && !n.fork && !companion(n))
  .sort((a, b) => a.name.localeCompare(b.name));

const slice = targets.slice(offset, limit ? offset + limit : undefined);
console.log(`AI-GEO KIT rollout · ${targets.length} live non-companion repos · this batch ${slice.length} (offset ${offset})${dry ? ' · DRY RUN' : ''}\n`);

function ghExists(repo, path) {
  try { execFileSync('gh', ['api', `repos/${OWNER}/${repo}/contents/${path}`], { stdio: 'pipe' }); return true; }
  catch { return false; }
}
function ghPut(repo, path, content, msg) {
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  execFileSync('gh', ['api', '-X', 'PUT', `repos/${OWNER}/${repo}/contents/${path}`,
    '-f', `message=${msg}`, '-f', `content=${b64}`], { stdio: 'pipe' });
}
// GitHub throttles rapid content-writes (secondary rate limit); pace them with a sync pause.
const PAUSE_MS = 400;
function pace() { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, PAUSE_MS); } catch {} }

let created = 0, skipped = 0, failed = 0, reposTouched = 0;
for (let i = 0; i < slice.length; i++) {
  const n = slice[i];
  const kit = kitFor({ name: n.name, title: n.name, desc: n.desc || '', topics: n.topics || [] });
  let repoCreated = 0;
  for (const f of SAFE_FILES) {
    try {
      if (ghExists(n.name, f)) { skipped++; continue; }
      if (!dry) { ghPut(n.name, f, kit[f], 'add AI/GEO kit: ' + f + ' — llms.txt/robots/sitemap for AI-search discoverability'); pace(); }
      created++; repoCreated++;
    } catch (e) { failed++; console.error('  FAIL', n.name, f, String(e.message).slice(0, 90)); }
  }
  if (repoCreated) reposTouched++;
  console.log(`[${offset + i + 1}/${targets.length}] ${n.name} · +${repoCreated} (run totals: created ${created}, skipped ${skipped}, failed ${failed})`);
}
console.log(`\n=== done batch · repos touched ${reposTouched} · files created ${created} · skipped ${skipped} · failed ${failed} ===`);
console.log(offset + slice.length < targets.length
  ? `resume: node rollout.mjs --offset ${offset + slice.length}` + (limit ? ` --limit ${limit}` : '')
  : 'ROLLOUT COMPLETE across all live non-companion repos.');
