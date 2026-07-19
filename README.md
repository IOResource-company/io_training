# IO Resource — Product Training

Interactive, self-contained product training app for the IO Resource sales team, plus a daily training-snippet email pipeline.

**Live site:** https://ioresource-company.github.io/io_training/

## What's here

| Path | Purpose |
|------|---------|
| `IOR-Product-Training.html` | The whole training app — 10 brands, quiz bank, flashcards, scenarios, Kill the Zebra hub, cheat sheets. Single file, no server needed. **This is the single source of truth for all training content** (the `const DATA` object inside it). |
| `index.html` | Redirect so the app loads at the site root. |
| `briefs/` | Per-brand markdown briefs the app content was consolidated from. |
| `build/embed-media.mjs` | Re-embeds product photos + logo into the HTML (run after adding products). |
| `scripts/daily-snippet.mjs` | Builds and sends the daily training snippet email via Resend. |
| `.github/workflows/daily-snippet.yml` | GitHub Actions cron — runs the snippet script every morning. |

## Daily snippet emails

Every morning (~08:15 Irish time) GitHub Actions runs `scripts/daily-snippet.mjs`, which:

1. Extracts the `DATA` object straight out of `IOR-Product-Training.html` — so new content added to the app automatically enters the email rotation, no extra step.
2. Picks a **date-seeded random mix**: one brand spotlight (talking point + objection handler), 3 quiz questions, and either a sales scenario or 2 flashcards (alternating days). Answers at the bottom.
3. Sends a branded HTML email via Resend.

Manual run / test:

```bash
node scripts/daily-snippet.mjs --dry-run     # writes out/preview.html, sends nothing
RESEND_API_KEY=re_xxx node scripts/daily-snippet.mjs
```

Config lives in env vars: `RESEND_API_KEY` (repo secret), `SNIPPET_TO`, `SNIPPET_FROM`, `SITE_URL`.

> Note: while IOR is on Resend's shared test sender, delivery is restricted to
> `stephen.browne@ioresource.com`. Verify an `ioresource.com` domain in Resend to
> send to the wider team, then set `SNIPPET_TO` / `SNIPPET_FROM`.

## Updating training content (monthly brand review)

1. Review the OneDrive Brands folder for new spec sheets / products.
2. Update the relevant brief in `briefs/` and the `DATA.brands` entry in `IOR-Product-Training.html` (positioning, products, topSellers, talkingPoints, objections, quiz, flashcards, scenarios).
3. If new products need photos, re-run `build/embed-media.mjs`.
4. Commit and push — GitHub Pages redeploys the site, and the daily emails pick up the new content automatically.

**Content rule:** this repo is shareable — sell-side facts only. No pricing, cost, margin/GP, or commercially sensitive supplier detail. Keep it that way.
