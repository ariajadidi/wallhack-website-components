# WALLHACK page system — implementation handoff

For the person (and their Claude agent) who puts designed pages on the live Shopify store.
Read this whole file before changing anything. **Figma is the source of truth**: pages are translated as
*data* (texts, images, settings) into fixed theme sections — never re-styled by hand.

---

## 1. What you need before you start

| Need | Why | Who provides it |
|---|---|---|
| **This repository** (github.com/ariajadidi/wallhack-website-components) | Theme sections/blocks/CSS + the conversion tools in `_tools/` | Design lead |
| **The photo + SVG files** (`_content/upload*/`, ~170 MB) | Not in the repository (it is public); needed to upload to the live store's Files | Design lead |
| **Figma file link** — “WH-Website-Component” in the WALLHACK Figma team | Source of every page | Design lead |
| **Figma account with a Full (editor) or Dev seat** on that team | The Figma MCP is limited to ~6 calls/month on a View seat — far too few | WALLHACK Figma admin |
| **Figma MCP connected in Claude Code**, signed in as that account | The extractor runs through the `use_figma` tool | You |
| **Shopify staff/collaborator account** with Themes, Files and Pages (Online Store) permission | Upload images, push theme files, create pages | WALLHACK Shopify owner |
| **Shopify CLI** (`shopify theme …`), Node 18+, Python 3 | Push/preview themes, run the tools | You |
| **NB Architekt web-font files** (`.woff2`, Light 300 + Bold 700) **with a web licence** | Heading font. Not included yet — headings fall back to a system font without it | WALLHACK (font licence) |

Never put Shopify or Figma passwords/tokens into files or chats; log in to the CLI yourself (`shopify theme dev/push` opens a browser login).

---

## 2. What is in this folder

```
sections/wh-*.liquid       20 page sections (one per Figma section component, + Top Bar and Product Bar)
blocks/wh-*.liquid         theme blocks used inside sections (cards, tags, FAQ entries, …)
snippets/wh-*.liquid       shared pieces (media/image frame, colours, icons, …)
assets/wh-tokens.css       GENERATED from Figma variables — never edit by hand
assets/wh-sections.css     section layout CSS (all sizes come from the tokens)
assets/wh-gallery.js       Product Header gallery strip · assets/wh-shop.js  floating Product Bar (Add to Cart)
layout/theme.liquid        TEST layout only (the page window fills the browser) — do not copy to live
config/, locales/          minimal test-theme settings — merge, don't overwrite (see §3)
templates/product.wh-*.json product pages (M-001, K-001, SP-005, CR-005, SP-004A, Sleeves, Skates)
templates/index*.json      TEST pages for the dev store (?view=basic etc.) — never push to live
_tools/                    extract-figma-page.js · export-figma-tokens.js · figma-to-shopify.py · gen-tokens.mjs
_content/figma-export.json extracted page data · image-map-campaigns.json hash → file
_content/upload*/          image + SVG files used by pages (local only, not in the Git repository)
docs/                      design system, pipeline, theme, Figma gotchas, history
```

`_tools/` and `_content/` are in `.shopifyignore` and never upload to Shopify.

---

## 3. One-time setup in the live theme

Work on a **duplicate, unpublished copy** of the live theme (`shopify theme duplicate` or Admin → Online Store → Themes → Duplicate). Preview, then publish.

1. **Copy in**: `sections/wh-*`, `blocks/wh-*`, `snippets/wh-*`, `assets/wh-tokens.css`, `assets/wh-sections.css`, `assets/wh-gallery.js`, `assets/wh-shop.js`. Check no live file has the same name.
2. **Remove the test-only CSS** at the top of `wh-sections.css` (the `body.wh-canvas` rule). Keep the `.wh-window` rule.
3. **Load the CSS** in the live layout `<head>`:
   ```liquid
   {{ 'wh-tokens.css' | asset_url | stylesheet_tag }}
   {{ 'wh-sections.css' | asset_url | stylesheet_tag }}
   ```
4. **Fonts**:
   - Inter Light 300 + Bold 700 (the test theme loads them from the `wh_font_body` font setting — reuse the live theme's font loading or add that setting).
   - NB Architekt: put the `.woff2` files in `assets/` and declare `@font-face { font-family: "NB Architekt"; … }` for weights 300 and 700. The CSS already asks for `"NB Architekt"`.
5. **Wrap WALLHACK pages** — every WH section needs two ancestors:
   ```liquid
   <div class="wh-window">      {%- comment -%} the visible page column; its width drives the scaling + the mobile switch {%- endcomment -%}
     <div class="wh-page">{{ content_for_layout }}</div>
   </div>
   ```
   `.wh-window` must be exactly as wide as the visible page area (on the live site that is the column *next to* the 420px menu, not the whole screen). Only wrap WH pages, e.g. in the live layout:
   ```liquid
   {%- if template.suffix contains 'wh-' -%} …wrapper above… {%- else -%} {{ content_for_layout }} {%- endif -%}
   ```
   and name every WH template `page.wh-<handle>.json` (or `product.wh-<handle>.json`).
6. **Upload every file** in `_content/upload/`, `_content/upload-v2/`, `_content/upload-v3/`, `_content/upload-v5/`, `_content/upload-v6/`, `_content/upload-v7/`, `_content/upload-v8/` (not `upload-v4`: AVIF can't be used) to the live store's **Content → Files**, keeping the exact file names (templates refer to them as `shopify://shop_images/<name>`). Files on the test store do **not** carry over.
7. Run `shopify theme check` — it must report no offenses.

---

## 4. Putting one designed page live (repeat per page)

The designer marks the page frame **“Ready for dev”** in Figma and sends you the frame link (it contains `node-id=XX-YYY` → node id `XX:YYY`).

1. **Sync design tokens first** (in case spacing/type changed):
   run `_tools/export-figma-tokens.js` with `use_figma` → save `tokens` as `_tools/tokens.json` and `textStyles` as `_tools/text-styles.json` → `node _tools/gen-tokens.mjs`.
   The design team authors the text styles — never "fix" them in code.
2. **Extract the page**: open `_tools/extract-figma-page.js`, set `PAGE_FRAME_ID` to the frame's node id, run it with `use_figma`.
   Save the returned JSON into `_content/figma-export.json` → `pages["<page-key>"]`, and add `"template": "page.wh-<handle>.json"` to that entry.
   Read any `warnings` in the output (e.g. a colour not linked to the colour system) and ask the designer if unclear.
3. **Images**: every photo is listed by its Figma image hash. Hashes already in `IMAGES` (top of `figma-to-shopify.py`) are uploaded. For new ones:
   - download with the Figma MCP `download_assets` (pass the **section** instance id — sub-layer ids like `I12:3;4:5` are rejected);
   - match each file to its hash (hash = SHA-1 of the file bytes), name it `wh-<section>-<what>.jpg`, compress, upload to Content → Files, add `"<hash>": "<file name>"` to `IMAGES`.
   - New icons / drawings: add the Figma component name → SVG file to `ICONS` / `DRAWINGS`. Export SVGs from a temporary instance on a transparent top-level frame and delete the first `<rect fill="#1E1E1E">` (Figma canvas colour).
4. **Convert**: `python3 _tools/figma-to-shopify.py --only <page-key>` → writes `templates/page.wh-<handle>.json`. Any image it can't map stays empty — fix `IMAGES` and re-run.
5. **Check + push**: `shopify theme check`, then push the new template (and any changed tool output such as `assets/wh-tokens.css`) to the unpublished theme. With `shopify theme dev`, upload order matters: snippets/blocks → sections → templates.
6. **Create the page** in Admin → Online Store → Pages, set its handle, choose template `wh-<handle>`. Product pages: assign template `wh-<name>` to the product instead.
7. **Verify** in the preview against the Figma frame: at a 1464px-wide window every section's height should match Figma within ~2px; at ≤749px the Mobile design must appear (scaled to the window, max 1.3×). Then publish the theme copy.

---

## 5. Rules that keep Figma and the site identical

- **Data only.** A page = section settings + blocks in a template JSON. Never add page-specific CSS, never edit `wh-tokens.css`, never hard-code sizes.
- **Scaling layout.** Desktop is designed at 1464px, Mobile at 390px; everything is sized in design px × `--wh-u`, so the whole page scales with the window. Switch to Mobile below a 750px window. Text never renders below 13px (body, Desktop) / 11px.
- **Colours.** Every page starts Light (WH-BG `#F9F9F9`, WH-Black `#0E0E0E`); Dark = campaign pages, set per section. Custom colours only come from Figma (collaboration pages): the converter writes them as `custom_*` section settings or per-element `custom_css` — don't invent them.
- **Images** are full bleed unless the design puts them inside a card/column. Their shape comes from the Figma image frame (`Ratio` 16:9 / 9:16 / 1:1 / Custom) → setting **Image shape**; the photo is cropped to fill.
- **Mobile**: body text left-aligned, headings centred; Split always puts the image under the text.
- Anything the design can't express with the existing sections → ask the design lead for a new Figma section first; then build the matching theme section.

## 6. Figma component → Shopify section

| Figma | Shopify section | Blocks |
|---|---|---|
| Section/Cover | `wh-cover` | — |
| Section/Intro + USPs | `wh-intro-usps` | `wh-usp` |
| Section/Text | `wh-text` | — |
| Section/Text + Media | `wh-text-media` | — |
| Section/Image | `wh-image` | — |
| Section/Split | `wh-split` | — |
| Section/Cards | `wh-cards` | `wh-card` |
| Section/Text Cards | `wh-text-cards` | `wh-text-card` |
| Section/Compare | `wh-compare` | `wh-compare-item` › `wh-compare-tag` |
| Section/Comparison Timeline | `wh-comparison-timeline` | `wh-variant-card` › `wh-variant-attribute` |
| Section/Drawing + callouts | `wh-drawing-callouts` | `callout` (section blocks) |
| Section/Specs + Contents | `wh-specs-contents` | `item`, `spec_row` (section blocks) |
| Section/Spec sheet (and Spec rows stacked) | `wh-spec-sheet` | `wh-spec-row` |
| Section/Contents | `wh-contents` | `wh-contents-item` |
| Section/Size table | `wh-size-table` | `row` (section blocks) |
| Section/FAQ | `wh-faq` | `wh-faq-item` |
| Section/Product Header (top of every product page) | `wh-top-bar` (sticky, its own section) + `wh-product-header` | `photo` (section blocks; empty on a product page = the product's own photos). Gallery is capped at 70% of the screen height (CSS only — Figma has no screen height). Live theme with its own sticky header: set `--wh-sticky-top` to that header's height |
| Section/Content Frame | `wh-content-frame` | — (video / YouTube·Vimeo link / photo setting; Figma video fills can't be carried over — upload the video in Shopify) |

## 7. Known open items

- NB Architekt font files + licence (headings use a fallback until added).
- Comparison Timeline: attribute lines on a version card are not yet a free list (designer to turn them into a slot).
- Photo options (Figma Media/Image → section settings on Cover, Text + Media, Image, Split): “fade top / fade bottom” → `image_fade` (opacity mask, 30% of the photo height), the separate phone photo's fades → `image_fade_mobile`, Background Solid/None/Gradient → `image_background` (gradient bottom colour → `custom_gradient_end`). Section/Content Frame “gradient” → `background_gradient`. The glow ends in `color/gradient-end`. A separate phone photo (Mobile image=Separate) → `image_mobile`. Media Ratio (21:9 · 2:1 · 16:9 · 3:2 · 4:3 · 1:1 · 4:5 · 2:3 · 9:16 — no Custom in Figma, layers inside sections can't be resized) → `image_shape`. The photo's Figma scale mode (Fill / Fit) → `image_fit` (also on compare items and cards; Fit shows the whole photo on the image background). Test page: `?view=gradient-test`. Phone photo frame shape (Figma “image (mobile)” Ratio) → `image_mobile_shape`. Text + Media section padding set to 0 in Figma → “No space above / below” (`no_space_top` / `no_space_bottom`). Intro button label → `cta_label` (read from Figma). Converted campaign photos: `_content/upload-v6/` (wh-camp-<hash>), hash → file map in `_content/image-map-campaigns.json` (loaded by the converter); upload that folder to Files on the live store too.
- Test templates (`templates/index*.json`) and the test layout are for the dev store only. `index.pdp-test.json` (?view=pdp-test) uses stand-in photos for the gallery and two test Content Frames.
- Product Header galleries and the “(125)” reviews are still the M-001 starter placeholders on every product page.
- The dev store has no WALLHACK products; templates are previewed on any product with `?view=wh-<name>`. Real products need the template assigned.
- Not built in Shopify yet: site navigation (Glass/Menu, Menu Mobile, Tabs, Footer Links).
- Sleeves, PADS and Skates campaign pages exist in Figma only (their photos are uploaded for the product pages).
- Content Frames (K-001 / M-001 software) need a real video.
- K-001 phone frame: three Text + Media sections have spacing on phones but none on desktop (no per-breakpoint spacing setting yet).
- Design lead's notes on the Figma file: Library pages “Library — Sections + Components” and “Library — Icons + Drawings”; the guide “How to build a page — start here” is on the Templates page.
