# The Figma design system

File: **WH-Website-Component** in the WALLHACK Figma team (file key `jBz28tmWpCtjak7NHq88rc`).
An older personal copy (`gnG5IUP6hVPX7tnJmqZAn4`) was the working file until 19 Oct 2026; node ids are the same in both.

## Pages

| Page | Contents |
|---|---|
| **Library — Sections + Components** | Three folder frames: **Sections** (`9:3`, every `Section/*` main component), **Components** (`158:7052`, Media, Button, Card, Compare, Spec, FAQ, Callout, …), **Shop** (`285:7275`, Product Header, Gallery Image, Glass/*, Shop/*, Menu/Top Bar, Menu Mobile/*) |
| **Library — Icons + Drawings** | 76 scalable, ratio-locked artwork components: `USP/<group>/<name>`, `Drawing/<product>/<name>`, `Contents/<product>/<name>`, plus `Line drawing/<product>` sets used by Drawing + callouts |
| **Templates** | Starter pages (Basic, Product launch, Accessory, Product Page Starter) and the guide frame “How to build a page — start here” (`45:1468`) |
| **Campaign Page Converted** | The five archive campaigns rebuilt from library sections: sleeves, pads-gen-5, skates, k-001, m-001 — each a desktop frame `page/<handle>` plus a phone frame `page/<handle> (mobile)` |
| **Product Pages — Full Pages** (`398:16941`) | Product pages: PDP - M-001 `417:39053`, K-001 `417:39080`, SP-005 `417:39107`, CR-005 `417:39134`, SP-004A `417:39161`, Sleeves `417:39188`, Skates `417:39215`, Misc Product `417:39266` |
| **Incoming - New Assets** (`243:2`) | Designers drop finished designs here; they are turned into tokens/components but the designers' frames are **never edited** |
| **Archive — imported campaign pages** | The original campaign pages, reference only |

## Variable collections

All non-primitive variables have Web code syntax `--wh-<full/figma/path>` (slashes → dashes), which is exactly the CSS
custom property name in `assets/wh-tokens.css`.

| Collection | Modes | Holds |
|---|---|---|
| **Primitives** | one | Raw colours (WH-BG `#F9F9F9`, WH-Black `#0E0E0E`, greys), font families, radius, spacing scale `space/4 · 8 · 12 · 16 · 24 · 32 · 64 · 128` |
| **Color** | **Light** (default) / **Dark** (campaigns) | Semantic colours: `color/background`, `foreground`, `foreground-muted` (canvas labels only), `border`, `image-background`, `surface`, `gradient-end`, `video-background`, `button-fill`, `button-fill-hover`, `button-stroke-color`, `button-font-fill` |
| **Responsive** | **Desktop** (1464 wide, default) / **Mobile** (390 wide) | Every size: `layout/*` (window width, side padding, block padding, text and detail max widths, column min width), `font-size/*`, `text/*` paragraph spacing, `component/<name>/*` per-component sizes, `breakpoint/mobile` + `breakpoint/above-mobile` booleans |

Type scale (ratio 1.333, minimal): `font-size/display` (H1), `title` (H5), `subtitle` (H2 + H3), `body` (P1), `small`
(P2 + H4). Headings use **NB Architekt** (Light 300 / Bold 700), body text **Inter** (Light 300 / Bold 700).

## Rules the file follows

- **Figma is the source of truth.** The theme copies Figma values; it never invents its own.
- **Keep variables simple.** Prefer per-component variables that alias the shared scale over new one-off values.
- **Light is the default; Dark is for campaigns.** Every page starts Light; designers switch individual sections to Dark.
- **Every component works in Light and Dark.** All fills, strokes and text colours are bound to semantic `color/*`
  variables — never a primitive or a raw hex. Icons always use the text colour (`color/foreground`).
- **Breakpoints come from variable modes, never variants.** Desktop vs Mobile is chosen by the Responsive mode of the
  containing frame. Differences go into a Responsive variable (Desktop/Mobile values); layers that exist on only one
  breakpoint bind `visible` to `breakpoint/mobile` or `breakpoint/above-mobile`. Main components carry no explicit modes.
- **Images are full bleed** (edge to edge, no padding or radius) unless they sit in a card or column.
- **Repeatable items are slots** (USPs, FAQ entries, cards, compare items, callouts, spec lines, contents items, size rows) —
  no “show item 3” toggles.
- **No clip content** (the Product Header gallery strip is the one exception). **All borders are centred** strokes.
- **Descriptions are written in plain language** for non-designers: what it is / how to edit / good to know / a
  “for developers” line naming the Shopify section file.
- Designers edit the file live: re-read values before changing them and don't overwrite settings someone already set.

## Key components

| Component | Notes |
|---|---|
| `Media/Image` (`153:18290`) | Photo frame used by every section. Variants **Ratio** 21:9 · 2:1 · 16:9 · 3:2 · 4:3 · 1:1 · 4:5 · 2:3 · 9:16 × **Background** Solid · None · Gradient. Booleans **fade top / fade bottom** (opacity masks, 30% of the height). The picture lives on a child `photo` layer inside `content`; its scale mode (Fill / Fit) becomes `image_fit` |
| `Media/Card Image` (`153:18295`) | Same for cards (radius 8), Background Solid · None |
| Mobile image = Same / Separate | Variant on Cover, Text + Media, Image, Split, Card, Compare item, Content Frame. *Separate* adds an `image (mobile)` layer shown only on Mobile |
| `Section/Drawing + callouts` (set `444:36806`) | Type = Callouts / Illustration. One `drawing` swap drives desktop + mobile art. Drawing and callout rows share `layout/detail-max-width` |
| `Section/Specs + Contents` (`125:4087`) | Nested Contents (“what's in the box”) + Spec sheet; spec text sized by `component/spec-font-size` |
| `Section/Product Header` (`281:19`) | Top of every product page: top bar (breadcrumbs + close), gallery slot, title, description, reviews |
| `Menu Mobile/Product Bar` (`266:76`) | Floating Add to Cart bar, used on every screen size |
| `Section/Content Frame` (`289:7300`) | Glass frame around a video or photo, Orientation Landscape / Portrait |

Full Figma component → Shopify section table: see [`HANDOFF.md` §6](../HANDOFF.md#6-figma-component--shopify-section).
