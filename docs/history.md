# History (October 2026)

What was built and decided, in order. Node ids refer to the Figma file `jBz28tmWpCtjak7NHq88rc`.

## 5–6 Oct — Design system and first theme

- Goal: repeatable fill-in section components + tokens so designs reach Shopify without spacing or type drift. Root cause
  of drift on the live site: one monolithic section with its own CSS per campaign.
- Built the SP-005 section components (Cover, Intro + USPs, Drawing + callouts, Spec table, FAQ, Text + Media, Compare,
  Split), then K-001 / M-001 / Skates / Sleeves sections (Text, Image, Cards, Comparison Timeline, Size table, Spec row,
  Contents). Library of 76 icons and drawings. Repeatable items became slots.
- Variables: Primitives, Color (Light / Dark), Responsive. All CSS names `--wh-<path>`.
- **Scaled layout decision:** four breakpoints replaced by Desktop 1464 + Mobile 390 that scale as one picture; mobile
  capped at 1.3×.
- Type scale 1.333 with role names (display, title, subtitle, body, small). Spacing scale 4·8·12·16·24·32·64·128.
- Rules: no clip content, centred borders, images full bleed, all pages start Light.
- Theme: 14 sections + blocks + snippets, tokens generated from Figma, content pipeline (extractor → JSON → converter)
  working end to end on the dev store. Custom colours for collaboration pages (section and element level).
- Image containers: `Media/Image` / `Media/Card Image` with fixed ratios.

## 19 Oct — Shop pieces and product header

- Working file moved to the Wallhack team copy. New “Incoming - New Assets” page for designers.
- Shop / navigation components: Glass buttons, chips, menu, product card, Top Bar, Tabs, Footer Links, Product Bar,
  Menu Mobile. **Rule: breakpoints are variable modes, never variants.**
- Section/Product Header (gallery slot, title, description, reviews) + Media/Gallery Image + Product Counter; Section/Content
  Frame (glass frame around video/photo). `color/surface`.
- Theme: `wh-product-header`, `wh-content-frame`, `wh-rune`, `wh-gallery.js` (endless auto-scrolling gallery).
- PNG in → WebP out for transparent photos (AVIF can't be used in Shopify Files).

## 23 Oct — Type scale, hover states, campaign conversion

- Desktop type scale reduced (body 18 → 16). Callouts smaller. Top bar became its own sticky section with size floors.
- Hover states (`color/button-fill-hover`, Hover variants, CSS `@media (hover: hover)`). Gallery inertia and loop fixes.
- Design-system audit; Figma and theme matched on every variable and text style.
- **Campaign conversion:** the five archive campaigns (sleeves, pads-gen-5, skates, k-001, m-001) rebuilt from library
  sections on “Campaign Page Converted”, with desktop + phone frames. Photo fades, gradients, Fit/Fill, separate phone
  photos, more ratios (21:9 … 9:16). K-001 and M-001 uploaded and verified at 1464 and 390.

## 28 Oct — Spacing, phone photos, product pages

- Spacing Regular / Large per section; photo Background Solid / None / Gradient; photo moved to its own `photo` layer.
- Phone photos on cards, compare columns and Content Frames. Extractor made mode-proof and reads the phone frame.
- Fades changed from colour overlays to opacity masks (work on any background).
- Drawing + callouts became a set (Callouts / Illustration).
- WALLHACK moved to its own unpublished theme 189703782649 (another project used the shared dev theme).
- **Product pages:** “Product Pages — Full Pages” with M-001, K-001, SP-005, CR-005, SP-004A, Sleeves, Skates. Templates
  `product.wh-*.json`. Buy UI = floating Product Bar on all screens (side menu dropped). Re-exported SP-005 cut-outs as PNG.

## 29 Oct — Product page polish

- PDP order: header → drawings → spec section (Light) → campaign. Header text column capped at `layout/text-max-width`.
- Spec sheet and contents ~12.5% smaller (`component/spec-*`, `contents/*`), new `component/spec-font-size`.
  Drawing, callouts, spec rows and contents share the new `layout/detail-max-width` (1057 / 313) and are centred.
  Tighter spec cells (row height 90 / 47).
- Contents icons smaller so the K-001 contents sits on two rows (item 104 × 125, icon 69).
- K-001 hero photo set to Fill.
- A gradient behind the K-001 / M-001 hero photos was tried and **reverted**: the heroes are back to Dark with a solid
  `#0e0e0e` background. The `custom_gradient_end` setting stays available.

## 2 Nov — Repository

- This repository now holds the theme, tools and documentation (replacing the 3D configurator prototype).
  Photos are kept out because the repository is public.
