# WALLHACK · Studio (v2)

3D product configurator for the WALLHACK glass mousepad line, built per
`BUILD_GUIDE.md` in this repo.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
```

## Stack

- Next.js 15 (App Router) + React 19
- @react-three/fiber 9 + @react-three/drei 10 + @react-three/postprocessing 3
- @react-spring/three 10 (camera/pad transitions)
- zustand (state) + framer-motion (2D UI)
- Inter via `next/font/google`
- Shopify Storefront API client with mock fallback

## Layout

```
src/
  app/                       — Next.js App Router
  components/
    canvas/                  — everything inside <Canvas> (R3F)
      Backdrop.tsx           — floor + AccumulativeShadows
      CarouselPad.tsx        — one pad, react-spring driven
      Pad.tsx                — Suspense wrapper for the model
      PadLabel.tsx           — floating drei <Html> tag
      PadModel.tsx           — GLB loader + material assignment
      PostFX.tsx             — Bloom + Vignette + SMAA
      Showroom.tsx           — carousel layout + slot math
      StudioRig.tsx          — 4-point lights + Environment
    ui/                      — DOM overlays
      TopBar.tsx
      ProductPanel.tsx
      PillRow.tsx
      AddToCart.tsx
      Loader.tsx
    GestureLayer.tsx         — global keyboard + swipe
    UrlSync.tsx              — ?sku= ↔ store
    Studio.tsx               — Canvas + scene root
  config/
    materials.ts             — Edge + Surface material data + factories
    skus.ts                  — SKU registry incl. Shopify variant mapping
  hooks/
    useCart.ts               — variant resolution + cart create/append
    useSkuNavigation.ts      — global keyboard + swipe
    useSkuUrlSync.ts         — URL ↔ store sync
  lib/
    shopify/                 — Storefront API client + mock fallback
    store/                   — zustand configurator store
public/
  models/                    — sp-005.glb, cr-005.glb
```

## Shopify setup

The cart layer runs in mock mode out of the box (see console for log lines
like `[mock-shopify] cartCreate`). To wire real Shopify checkout:

1. Set in `.env.local`:

   ```
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=wallhack.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=shpat_xxx
   ```

2. Fill `shopify.variants` in `src/config/skus.ts` with real
   `gid://shopify/ProductVariant/...` ids per colour.

3. Click ADD → cart created via Storefront API → user redirected to
   `cart.checkoutUrl`.

## What's missing vs `BUILD_GUIDE.md`

Honest list:

- **Authored hero GLBs** — the included `sp-005.glb` / `cr-005.glb` are stubs
  (~45 KB, no bevels, no UVs on the surface, same mesh for both SKUs). The
  guide's §2 covers the authoring requirements.
- **Custom HDRI** — using the drei `studio` preset as placeholder. Bake a
  Wallhack-specific HDR per guide §3.2.
- **KTX2 textures** — no normal/roughness maps shipped yet. Anisotropy on
  the edge is currently constant; add maps per guide §4.
- **Shopify product/variant ids** — registry stubs are `null`, mock client
  handles the gap.

Everything else from the guide is wired and tested.
