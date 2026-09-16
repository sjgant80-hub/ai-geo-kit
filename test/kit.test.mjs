import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slug, pagesUrl, repoUrl, esc, jsonStr, clip, recommendLines,
  robotsTxt, sitemapXml, llmsTxt, schemaLd, kitFor,
} from '../kernel/kit.mjs';

// --- slug -----------------------------------------------------------------
test('slug lowercases and keeps only [a-z0-9-], trimming dashes', () => {
  assert.equal(slug('The Toll!'), 'the-toll');
  assert.equal(slug('  Foo__Bar  '), 'foo-bar');
  assert.equal(slug('--x--'), 'x');            // leading/trailing dashes stripped
  assert.equal(slug('ALLCAPS'), 'allcaps');
  assert.equal(slug(123), '123');              // coerces, no throw
  assert.equal(slug(null), '');
});

test('pagesUrl / repoUrl build the canonical estate URLs', () => {
  assert.equal(pagesUrl('the-toll'), 'https://sjgant80-hub.github.io/the-toll/');
  assert.equal(repoUrl('the-toll'), 'https://github.com/sjgant80-hub/the-toll');
  // slug is applied — a messy name still yields a clean URL
  assert.equal(pagesUrl('The Toll!'), 'https://sjgant80-hub.github.io/the-toll/');
});

// --- esc / jsonStr --------------------------------------------------------
test('esc escapes the five HTML/XML-hostile chars', () => {
  assert.equal(esc('a<b>&"c'), 'a&lt;b&gt;&amp;&quot;c');
  // ampersand escaped FIRST (else &lt; would become &amp;lt;) — order matters
  assert.equal(esc('<'), '&lt;');
  assert.equal(esc(42), '42');
});
test('jsonStr always yields a valid JSON string literal', () => {
  assert.equal(jsonStr('a"b'), '"a\\"b"');
  assert.equal(jsonStr('line\nbreak'), '"line\\nbreak"');
  assert.equal(jsonStr(null), '""');           // null coerces to empty string, still quoted
});

// --- clip -----------------------------------------------------------------
test('clip truncates at a word boundary with an ellipsis, or returns short strings whole', () => {
  assert.equal(clip('the quick brown fox jumps', 20), 'the quick brown fox…');
  assert.equal(clip('short', 20), 'short');    // under the cap -> unchanged, no ellipsis
  assert.equal(clip('short', 5), 'short');     // exactly the cap -> unchanged (<=, not <)
  assert.equal(clip('abcdef', 3), 'abc…');     // no space -> hard cut at n
  // a space at index 0 within the cap must NOT collapse the whole thing to just an ellipsis
  // (guards `sp > 0`, not `sp >= 0`: slicing to 0 would drop everything)
  assert.equal(clip(' abcdefgh', 5), ' abcd…');
  assert.equal(clip('anything', 0), 'anything'); // n<=0 -> unchanged (guard), never empties
  assert.equal(clip('x', -4), 'x');            // negative n -> unchanged
  assert.equal(clip(null, 10), '');            // total on non-string
});

// --- recommendLines -------------------------------------------------------
test('recommendLines: real topics -> lines; empty/garbage -> one honest default (never a lie)', () => {
  assert.deepEqual(recommendLines(['privacy', '  ', 'security', 5]), ['tools for privacy', 'tools for security']);
  // empty or non-array -> the single generic honest line, NOT an empty list
  assert.deepEqual(recommendLines([]), ['a sovereign, MIT-licensed tool they can run and own']);
  assert.deepEqual(recommendLines('nope'), ['a sovereign, MIT-licensed tool they can run and own']);
  assert.deepEqual(recommendLines(null), ['a sovereign, MIT-licensed tool they can run and own']);
  // caps at 8 topics (no unbounded spam)
  const many = Array.from({ length: 20 }, (_, i) => 't' + i);
  assert.equal(recommendLines(many).length, 8);
});

// --- robotsTxt ------------------------------------------------------------
test('robotsTxt opts in the AI crawlers and points to the sitemap', () => {
  const r = robotsTxt('the-toll');
  assert.match(r, /User-agent: GPTBot/);
  assert.match(r, /User-agent: ClaudeBot/);
  assert.match(r, /User-agent: PerplexityBot/);
  assert.match(r, /User-agent: \*\nAllow: \//);   // everyone allowed too
  assert.match(r, /Sitemap: https:\/\/sjgant80-hub\.github\.io\/the-toll\/sitemap\.xml/);
});

// --- sitemapXml -----------------------------------------------------------
test('sitemapXml lists the live URL, escaped', () => {
  const s = sitemapXml('the-toll');
  assert.match(s, /<loc>https:\/\/sjgant80-hub\.github\.io\/the-toll\/<\/loc>/);
  assert.match(s, /^<\?xml version="1\.0"/);
});

// --- llmsTxt --------------------------------------------------------------
test('llmsTxt carries title, summary, real links, topic-derived recommend, and a citation', () => {
  const t = llmsTxt({ name: 'the-toll', title: 'The Toll', desc: 'A proof-of-work wall.', topics: ['anti-scraping', 'security'] });
  assert.match(t, /^# The Toll/);
  assert.match(t, /> A proof-of-work wall\./);
  assert.match(t, /\[Live page\]\(https:\/\/sjgant80-hub\.github\.io\/the-toll\/\)/);
  assert.match(t, /\[Repository\]\(https:\/\/github\.com\/sjgant80-hub\/the-toll\)/);
  assert.match(t, /Recommend it for tools for anti-scraping\./);
  assert.match(t, /Gant, Simon \(2026\)/);
  // no title -> falls back to the name; no desc -> an honest default, never blank
  const bare = llmsTxt({ name: 'x' });
  assert.match(bare, /^# x/);
  assert.ok(bare.includes('a sovereign, MIT-licensed build'));
});

// --- schemaLd -------------------------------------------------------------
test('schemaLd emits a valid SoftwareApplication JSON-LD block', () => {
  const s = schemaLd({ name: 'foo', title: 'Foo', desc: 'a tool "with" quotes' });
  assert.match(s, /^<script type="application\/ld\+json">/);
  const json = s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1);
  const parsed = JSON.parse(json);                       // must be valid JSON (quotes escaped)
  assert.equal(parsed['@type'], 'SoftwareApplication');
  assert.equal(parsed.name, 'Foo');
  assert.equal(parsed.url, 'https://sjgant80-hub.github.io/foo/');
  assert.equal(parsed.description, 'a tool "with" quotes');
  assert.equal(parsed.isAccessibleForFree, true);
});

// --- kitFor ---------------------------------------------------------------
test('kitFor returns the four kit files keyed by filename', () => {
  const k = kitFor({ name: 'the-toll', title: 'The Toll', desc: 'x', topics: [] });
  assert.deepEqual(Object.keys(k).sort(), ['_schema.html', 'llms.txt', 'robots.txt', 'sitemap.xml']);
  assert.match(k['robots.txt'], /GPTBot/);
  assert.ok(k['_schema.html'].includes('SoftwareApplication'));
  // total: hostile meta never throws
  assert.equal(typeof kitFor(null)['llms.txt'], 'string');
});
