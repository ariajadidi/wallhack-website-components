# WALLHACK — Figma design system → Shopify theme

WALLHACK's website pages are designed in Figma with a shared library of section components and design tokens (variables),
then translated **as data** into fixed Shopify theme sections. Nothing on a page is styled by hand: every size, colour and
font comes from the Figma variables, and every page is a list of sections with settings.

> **Figma is the source of truth.** If the site and Figma disagree, the site is wrong.

This repository is the Shopify theme plus the tools that move pages and tokens from Figma to Shopify.
It replaces the older 3D configurator prototype that used to live here (still in the git history, commit `bb39b67`).

## What's inside

| Path | What it is |
|---|---|
| `sections/wh-*.liquid` | 20 page sections, one per Figma section component (Cover, Image, Text + Media, Split, Cards, Compare, Drawing + callouts, Spec sheet, Product Header, Product Bar, …) |
| `blocks/wh-*.liquid` | Theme blocks used inside sections (cards, compare columns + tags, FAQ entries, USPs, spec lines, contents items, variant cards) |
| `snippets/wh-*.liquid` | Shared pieces: photo frame (`wh-media`), colour overrides (`wh-colors`), icons, callouts, ratios, rune |
| `assets/wh-tokens.css` | **Generated** from the Figma variables — never edit by hand |
| `assets/wh-sections.css` | Section layout CSS; every size is a token |
| `assets/wh-gallery.js` | Product Header photo strip (endless auto-scroll, drag, inertia) |
| `assets/wh-shop.js` | Floating Product Bar (Add to Cart) |
| `layout/theme.liquid` | Test layout for the dev store (page window = browser) |
| `templates/product.wh-*.json` | Product pages: M-001, K-001, SP-005, CR-005, SP-004A, Sleeves, Skates |
| `templates/index.*.json` | Test pages for the dev store (`?view=<name>`) |
| `_tools/` | Figma extractor, token exporter, token → CSS generator, Figma → Shopify converter |
| `_content/figma-export.json` | Every page read from Figma (the converter's input) |
| `_content/image-map-campaigns.json` | Figma image hash → uploaded Shopify file name |
| `docs/` | Detailed documentation (below) |

Photos and SVG files (`_content/upload*/`, ~170 MB) are **not** in this repository: it is public and they include
unreleased campaign imagery. They are already uploaded to the dev store's *Content → Files*; the design lead has the originals.

## Documentation

- [`HANDOFF.md`](HANDOFF.md) — for whoever puts pages on the live store: setup, the per-page routine, rules.
- [`docs/design-system.md`](docs/design-system.md) — the Figma file: pages, variable collections, components, design rules.
- [`docs/pipeline.md`](docs/pipeline.md) — step by step: Figma page → JSON → Shopify template, tokens, images, pushing, verifying.
- [`docs/theme.md`](docs/theme.md) — how the theme works: scaling layout, tokens, colours, photo options, product pages.
- [`docs/figma-plugin-gotchas.md`](docs/figma-plugin-gotchas.md) — Figma Plugin API limits and workarounds learned along the way.
- [`docs/history.md`](docs/history.md) — what was built and decided, by date (Oct 2026).

## Quick start

Requirements: Shopify CLI, Node 18+, Python 3, a Figma seat with edit/Dev access to the WH-Website-Component file and the
Figma MCP connected in Claude Code. Log in to the CLI yourself — never put passwords or tokens in files.

```sh
# preview on the dev store (WALLHACK has its own unpublished theme there)
shopify theme dev  --store wh-test-k2f13wb3.myshopify.com --theme 189703782649 --port 9292

# or push changed files without a dev server
shopify theme push --store wh-test-k2f13wb3.myshopify.com --theme 189703782649 --nodelete --only templates/product.wh-k-001.json

# regenerate tokens after exporting Figma variables to _tools/tokens.json
node _tools/gen-tokens.mjs

# regenerate templates after re-reading pages from Figma into _content/figma-export.json
python3 _tools/figma-to-shopify.py --only pdp-m-001 pdp-k-001
```

Preview a product page with any product: `/products/<any-product>?preview_theme_id=189703782649&view=wh-k-001`.

## Status (2 Nov 2026)

Done: design system (192 variables, 14 text styles), 20 sections, 5 converted campaign pages, 7 product pages (PDPs) in
Figma and as Shopify templates, floating Add to Cart bar, photo fades / backgrounds / phone photos, spec sheet + contents
sizing. Open items are listed at the end of [`HANDOFF.md`](HANDOFF.md).
