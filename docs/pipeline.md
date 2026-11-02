# Pipeline: Figma → Shopify

```
Figma variables ──export-figma-tokens.js──▶ _tools/tokens.json ──gen-tokens.mjs──▶ assets/wh-tokens.css
Figma page frame ──extract-figma-page.js──▶ _content/figma-export.json ──figma-to-shopify.py──▶ templates/*.json
Figma photos ──download_assets (SHA-1 = image hash)──▶ compress ──▶ Shopify Content → Files ──▶ IMAGES / image-map
```

The `.js` tools run inside Figma through the Figma MCP `use_figma` tool (Claude Code). The others run locally.
`_tools/` and `_content/` are in `.shopifyignore`, so they never upload to Shopify.

## 1. Tokens

1. Run `_tools/export-figma-tokens.js` with `use_figma`. It returns `{ tokens, textStyles }`.
2. Save `tokens` as `_tools/tokens.json` and `textStyles` as `_tools/text-styles.json`.
   - The `use_figma` return value is capped at 48 KB. When the full export is too big, export one collection
     (Responsive fits on its own) and merge it into `tokens.json`, printing the diff to check what changed.
3. `node _tools/gen-tokens.mjs` → writes `assets/wh-tokens.css` (192 variables).
4. Push `assets/wh-tokens.css`.

Never edit `wh-tokens.css` by hand and never “fix” text styles in code — the design team authors them in Figma.

## 2. Reading a page

1. Get the page frame's node id (from the frame link: `node-id=417-39080` → `417:39080`).
2. Run `_tools/extract-figma-page.js` with `PAGE_FRAME_ID` set to that id. To read several frames in one call, wrap the
   file's body in a function:
   ```js
   const res = {};
   for (const id of ['417:39053', '417:39080']) {
     const r = await (async (PAGE_FRAME_ID) => { /* body of extract-figma-page.js without its PAGE_FRAME_ID line */ })(id);
     const d = JSON.parse(r); d.frameName = (await figma.getNodeByIdAsync(id)).name; res[id] = d;
   }
   return JSON.stringify({ pdp: res });
   ```
3. Save each result in `_content/figma-export.json` under `pages["<page-key>"]` (product pages use `pdp-<name>`), with
   `"template": "product.wh-<name>.json"` (or `page.wh-<handle>.json`). Without `template`, the converter writes a test
   page `templates/index.<page-key>.json`.
4. Read any `warnings` and `phoneNotes` in the output.

What the extractor reads, per section instance (top to bottom; plain frames/groups inside the page are looked into):

- component name, properties (variants, text, booleans, swaps), slot items, image hashes;
- colour mode (explicit Light/Dark on the section) and **custom colours** — any solid paint no longer linked to a colour
  variable becomes a section colour (`colors`) or an element colour (`elementColors`);
- photo options: ratio (from the Media `Ratio` property), Fit/Fill, fades, Background, gradient end colour, separate phone
  photo and its options;
- spacing (`Regular` = padding linked to `layout/block-padding-y`), “no space above/below”;
- phone settings from the sibling phone frame `<frame name> (mobile)` when it exists (it wins over hidden `(mobile)` layers).

It switches the frame to Desktop mode while reading and restores the designer's mode afterwards.

## 3. Images

- Photos are referenced by their Figma image hash (= SHA-1 of the file bytes).
- New photos: Figma MCP `download_assets` with the **section** instance id (sub-layer ids `I…;…` are rejected), match
  files by SHA-1, compress (opaque → JPEG q≈86 ≤3000 px; transparent → PNG ≤2400 px; Shopify serves them as WebP),
  name them `wh-<section>-<what>` or `wh-camp-<hash8>`, upload to *Content → Files*, then add `"<hash>": "<file>"` to
  `IMAGES` in `figma-to-shopify.py` or to `_content/image-map-campaigns.json`.
- AVIF can't be used: Files stores it as a generic file that image settings can't pick.
- SVG drawings/icons: export from a temporary instance on a transparent top-level frame, strip the first
  `<rect fill="#1E1E1E">`, add the component name → file to `ICONS` / `DRAWINGS`.

## 4. Converting

```sh
python3 _tools/figma-to-shopify.py --only pdp-m-001 pdp-k-001     # page keys separated by spaces
```

Writes `templates/<template>`. Product templates get `wh-top-bar` + `wh-product-header` + `wh-product-bar` at the top.
Any image hash it can't map is left empty and printed.

## 5. Pushing

```sh
shopify theme push --store wh-test-k2f13wb3.myshopify.com --theme 189703782649 --nodelete \
  --only templates/product.wh-m-001.json --only templates/product.wh-k-001.json
```

- WALLHACK has its own unpublished theme **“WALLHACK WH dev” (189703782649)**. The store's development theme
  (189330391289) belongs to another project (OpenTabs, port 9393) — don't push WALLHACK files there.
- New files: push in the order snippets/blocks → sections → templates, or Shopify reports “undefined block type”.
- `shopify theme dev … --theme 189703782649 --port 9292` gives a live preview; its login expires after a while.
- Before stopping a running `theme dev`, check which folder it runs in (`lsof -d cwd`).

## 6. Verifying

- Preview: `/products/<any product>?preview_theme_id=189703782649&view=wh-k-001` (the dev store has no WALLHACK products).
- Compare section heights against Figma at a 1464 px window (Desktop) and 390 px (Mobile): load the page HTML into a
  same-origin iframe of that width and measure `.wh-section` boxes, dividing by `--wh-u` to get design pixels.
  Heights should match within ~2 px.
- Check every photo renders, nothing overflows, and phone photos/fades appear below 750 px.
