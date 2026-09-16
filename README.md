# ai-geo-kit

**▶ Live: https://sjgant80-hub.github.io/ai-geo-kit/**

Generate a repository's **AI/GEO surface** — `llms.txt`, `robots.txt` (AI crawlers opted in), `sitemap.xml`, and `schema.org` JSON-LD — from its metadata, so AI answer-engines (ChatGPT, Perplexity, Google AI Overviews, Claude) and agents find it and describe it correctly. The estate's [ai-geo-standard](https://www.ai-nativesolutions.com/), made one command.

## Use

```bash
node --test test/kit.test.mjs   # the tests
node konomi/run-gate.mjs        # witness mutation gate: CLEAN 15/17 killed, +2 reviewed-equivalents

node rollout.mjs                # stamp every live, non-companion estate repo (additive)
node rollout.mjs --offset 200   # resume from #200
node rollout.mjs --limit 20 --dry  # preview, no writes
```

## How it works

- `kernel/kit.mjs` — the pure, witness-gated builder: metadata (`name`, `desc`, `topics`) → the kit files. No I/O.
- `rollout.mjs` — reads the estate index and writes the three **safe standalone files** to each repo via the GitHub API. **Additive only:** it never overwrites an existing file (hand-crafted kits stay) and never touches a page's HTML, so it cannot break a page.
- The live page runs the same kernel — paste a repo's details and watch the kit build.

## Honest scope

- The `robots.txt` / `llms.txt` / `sitemap.xml` are safe to add anywhere and carry the bulk of the on-site GEO value (crawlers opted in, an accurate summary, a sitemap).
- **schema.org injection stays a per-repo, verified step** — placing structured data into 400+ different pages is HTML surgery, not a blind sweep.
- On-site GEO is **necessary, not sufficient**: there is no fixed "position #1" in AI engines; visibility is mention frequency, driven substantially by **off-site authority** (mentions and references across the web). This kit makes you extractable and correctly represented when found.

_MIT · part of the AI Native Solutions estate._
