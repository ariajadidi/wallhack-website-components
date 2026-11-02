# How the theme works

## Scaling layout

The page scales like a picture (the teenage.engineering approach): everything — text, spacing, icons, drawings — keeps its
proportions as the window changes.

- Desktop design width **1464**, Mobile design width **390**. Below a **750 px** window the Mobile design is used.
- `1 design px = var(--wh-u)`. Desktop: `--wh-u = 100cqw / 1464`. Mobile: `min(100cqw / 390, 1.3px)` (stops growing at 1.3×).
  `cqw` is measured on `.wh-window`, the visible page column.
- Every token in `wh-tokens.css` is `calc(N * var(--wh-u))`. Text has minimum sizes so it never gets unreadable:
  body ≥ 13 px (Desktop) / 11 px, small ≥ 11 px.
- Pages need two wrappers: `<div class="wh-window"><div class="wh-page">…sections…</div></div>`.

## Sections are data

A page is a template JSON: a list of sections with settings and blocks. The converter fills them from Figma; editors
can change the same settings in the Shopify theme editor. There is no page-specific CSS.

Every section has:

- **Colour mode** `color_scheme` Light / Dark (`wh-scheme-light|dark`).
- **Custom colours** (collaboration pages only): `custom_background`, `custom_foreground`, `custom_border`,
  `custom_image_background`, and on photo sections `custom_gradient_end`. `snippets/wh-colors.liquid` writes them as
  `--wh-color-*` overrides on the section. Element-level colours from Figma become the section's `custom_css`.
- **Spacing** where Figma offers it: `spacing` large / regular, `no_space_top`, `no_space_bottom` (Text + Media).

## Photo options

On Cover, Image, Split and Text + Media (and partly on cards and compare columns):

| Setting | From Figma | Effect |
|---|---|---|
| `image_shape` | Media `Ratio` | 21:9 · 2:1 · 16:9 · 3:2 · 4:3 · 1:1 · 4:5 · 2:3 · 9:16 (`custom` + `image_ratio` = editor fallback) |
| `image_fit` / `image_fit_mobile` | photo scale mode | Fill (crop) or Fit (whole photo on the photo background) |
| `image_background` | Media `Background` | Solid (photo background colour) · None · Gradient (page colour → `gradient-end`) |
| `image_fade` / `image_fade_mobile` | fade top / bottom | Opacity mask (30% of the height), works on any background |
| `image_mobile`, `image_mobile_shape` | Mobile image = Separate | A different photo/crop on phones |

## Product pages (PDPs)

Order: **Top Bar** (sticky: breadcrumbs + close) → **Product Header** (gallery strip, title, description, reviews) →
**Drawing + callouts** → **spec section** (Specs + Contents / Spec sheet / Size table, Light) → the product's campaign
sections (Dark for K-001 / M-001, starting at the hero image).

- **Gallery** (`assets/wh-gallery.js`): endless slow auto-scroll, pauses on hover, mouse drag with inertia, native swipe.
  Top bar + photo row are capped at 70% of the screen height.
- **Product Bar** (`sections/wh-product-bar.liquid` + `assets/wh-shop.js`): floating Add to Cart with price, fixed in the
  lower right (full width on phones), first available variant, `cart/add.js`.
- Header text column width = `layout/text-max-width`. Drawing, callouts, spec rows and contents share
  `layout/detail-max-width` and are centred.
- Empty Product Header fields fall back to the Shopify product's own title, description and photos.

## Files

| File | Role |
|---|---|
| `snippets/wh-media.liquid` | The photo frame: ratio, fit, background, fades, phone photo |
| `snippets/wh-ratio.liquid` | Ratio name → aspect ratio |
| `snippets/wh-icon.liquid` | Icons/drawings as CSS masks (colour = `currentColor`) |
| `snippets/wh-colors.liquid` | Custom colour overrides |
| `snippets/wh-rune.liquid` | Embossed rune SVG (Content Frame) |
| `assets/wh-sections.css` | Layout; borders drawn as centred box-shadows so they never change box sizes |

## Live store notes

`layout/theme.liquid`, `config/` and `templates/index*.json` are for the dev store only. See [`HANDOFF.md`](../HANDOFF.md) §3
for moving the sections into the live theme (CSS includes, NB Architekt `@font-face`, `.wh-window` wrapper, uploading files).
