# Masters automatic data pipeline

This pipeline is designed for your current frontend contract, but only for the parts that can be sourced and validated automatically.

## What it does automatically

It fetches:
- the ESPN final leaderboard page for the tournament
- each player's ESPN scorecard page
- the Masters hole-stats page for hole yardage/par

It generates:
- `tournament.json`
- `winner.json`
- `winner_scorecard.json`
- `winner_profile.json`
- `methodology.json`

It can also sync those files directly into `src/data` and `public/data`.

## What it intentionally does **not** generate

These are not auto-generated because the public pages are not a clean trustworthy source for them at hole level:
- hole-level fairway hit
- hole-level GIR
- hole-level putts
- hole-level field fairway %
- hole-level field GIR %
- hole-level top-10 fairway %
- hole-level top-10 GIR %
- editorial narrative copy

If your frontend still renders those values, it should be changed to hide them rather than infer them.

## Install

Your repo already uses ESM, so the only extra dependency is Playwright:

```bash
npm install -D playwright
npx playwright install chromium
```

## Run

From repo root:

```bash
node ./pipeline/run.mjs
```

To also overwrite the automated files in `src/data` and `public/data`:

```bash
node ./pipeline/run.mjs --sync
```

## Output

Generated files land in:

```text
pipeline/out/generated/
```

Raw page captures and parsed page payloads are cached in:

```text
pipeline/out/raw/
```

## Important notes

1. This pipeline assumes the ESPN leaderboard URL in `pipeline/config.mjs` points to the correct finished event page.
2. It uses the ESPN player scorecard pages to compute field and top-10 averages. That means if ESPN changes the page structure, the parser may need adjustment.
3. It does not attempt to create fake values for unsupported hole-level skill stats.
4. Hole names are optional. The pipeline recovers hole number, par, and yardage from Masters' hole stats page. Your current `Home.tsx` already has a fallback if `holeName` is missing.
5. The repeat/historical files are left alone. This pipeline is for the current tournament's automated data layer only.

## Files touched by `--sync`

Only these are overwritten:
- `tournament.json`
- `winner.json`
- `winner_scorecard.json`
- `winner_profile.json`
- `methodology.json`

All editorial and historical files remain untouched.
