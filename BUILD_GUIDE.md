# WALLHACK 3D Configurator — Build Guide

A step-by-step blueprint for building the configurator at the visual quality of
**apple.com/iphone-17-pro** and the interaction quality of
**pedestal.com/pages/studio**, with per-SKU Shopify integration.

This document assumes the current scaffold is a starting point and treats every
section as a rebuild target. It is intentionally implementation-focused: every
section ends with a deliverable a single engineer can ship in 1–3 days.

---

## 0. Target Quality Bar — What "iPhone-grade" Actually Means

The Apple product pages look the way they do because of seven specific things,
not because of magic:

1. **Authored assets, not generated geometry.** Models are sculpted/CAD'd at
   100k–800k polys, decimated for web to ~80–150k, with hand-cleaned UVs and
   real edge bevels (no shading-only fake bevels).
2. **Real material authoring.** Anisotropic specular on the CNC bezel, fingerprint /
   smudge maps on the glass, microscratch roughness variation. Not just
   "roughness 0.4 and a normal map."
3. **Calibrated HDRI lighting** — custom studio HDR baked specifically for the
   product. Not a drei preset.
4. **Linear color pipeline with AgX or ACES tone mapping**, plus subtle
   post: SSAO, bloom on highlights only, sharp output.
5. **Real shadows** — contact shadows or shadow-mapped key light, never the
   default geometric shadow.
6. **60fps locked** with proper budgeting. Asset compression matters
   (Draco/Meshopt + KTX2 textures).
7. **Camera curves**, not lerps. Real easing (cubic bezier, spring physics) with
   purposeful timing.

Each section below maps to one of these.

---

## 1. Project Setup

**Stack lock-in:**

```
Next.js 15 (App Router, RSC where possible)
React 19
@react-three/fiber 9.x
@react-three/drei 10.x
three 0.171+
zustand            // global state (active SKU, cart, etc.)
framer-motion      // 2D UI motion
maath              // 3D math helpers (easing, damping)
@react-spring/three  // 3D spring physics (optional, for camera moves)
@shopify/storefront-api-client  // Shopify Storefront API
```

**Tailwind** for the 2D UI. Keep R3F entirely separate from the DOM tree —
they communicate only via zustand.

**File layout:**

```
src/
  app/
    layout.tsx
    page.tsx
    api/
      cart/route.ts          // server-side Shopify cart proxy
  components/
    canvas/                  // anything inside <Canvas>
      Scene.tsx
      Showroom.tsx
      Pad.tsx
      PadModel.tsx
      StudioRig.tsx
      ContactShadow.tsx
      PostFX.tsx
    ui/                      // anything outside <Canvas>
      TopBar.tsx
      ProductPanel.tsx
      PillRow.tsx
      AddToCart.tsx
      Loader.tsx
  config/
    skus.ts                  // product registry, NOT including Shopify IDs
    materials.ts             // material data (already exists)
    camera.ts                // camera presets per slot
  lib/
    shopify/
      client.ts
      queries.ts
      cart.ts
      types.ts
    store/
      configurator.ts        // zustand store
  hooks/
    useCart.ts
    useSkuFromUrl.ts
public/
  models/                    // .glb files (Draco/Meshopt compressed)
  hdri/
    studio.hdr               // 2K equirectangular
  textures/                  // .ktx2 textures
```

**Routing:** use a single page at `/` but encode the active SKU in the URL as
`?sku=sp-005`. This makes shareable links and back-button navigation work.

---

## 2. Asset Pipeline (Blender → Web)

The fastest path to "iPhone-grade" rendering is **asset quality, not shader
trickery.** Plan ~half the project's effort here.

### 2.1 Authoring in Blender

Per SKU, model the pad with:

- **Real edge bevels** (Bevel modifier, 3 segments, 0.3mm). Shading-only bevels
  read flat at glancing angles.
- **Inset playing surface** geometry, 0.4mm step. The step walls take the
  polished material — this is what catches highlight rolloff.
- **One Blender object, two material slots.** Slot 0 = `Surface`, slot 1 =
  `Edge`. Avoid Boolean ops; manually inset/extrude for clean topology.
- **Planar UV unwrap** for the surface top. Edge UVs irrelevant.
- **Triangle count target: 30k–80k.** Higher than this is overkill for a pad.
- **Scale 1.0, all transforms applied** (`Ctrl+A → All Transforms`).
- Author in **meters** (Scene Units = Metric, scale 1.0).

### 2.2 Export

```
File → Export → glTF 2.0 (.glb)
  Format: glTF Binary (.glb)
  Include: Visible Objects, Active Collection
  Transform: +Y Up
  Geometry: Apply Modifiers ✓, UVs ✓, Normals ✓, Tangents ✓
  Compression: Off (we compress in the next step)
  Materials: No Export  (we replace materials at runtime)
```

### 2.3 Compression — Mandatory

Without compression a 300kb mesh becomes 2MB. Mandatory pipeline:

```bash
# Install gltf-transform (free, scriptable)
npm i -g @gltf-transform/cli

# Apply Meshopt + Draco compression (Meshopt is smaller and decodes faster)
gltf-transform meshopt input.glb output.glb

# Optional: weld + deduplicate before compression
gltf-transform optimize input.glb output.glb \
  --compress meshopt --texture-compress webp
```

For textures (normal maps, roughness maps):

```bash
# KTX2 with BasisU — GPU-native, ~10× smaller than PNG
gltf-transform uastc input.glb output.glb
```

Target final asset sizes per pad: **< 400 KB GLB, < 200 KB per texture.**

### 2.4 Asset Manifest

Create `public/models/manifest.json` listing each SKU's assets, hashes, and
bbox. Useful for preloading and cache busting.

---

## 3. Scene Setup — Color, Tone Mapping, Lighting

This section is where "looks like a Three.js demo" becomes "looks like
Apple.com." Most teams skip step 3.1 and never recover.

### 3.1 Color Pipeline (non-negotiable)

```ts
// In Canvas onCreated:
gl.outputColorSpace = SRGBColorSpace;       // r3f default in v9
gl.toneMapping = AgXToneMapping;            // available in three 0.166+
gl.toneMappingExposure = 1.0;
```

Use **AgX** over ACES. ACES Filmic crushes blacks and is over-saturated; AgX
preserves highlights and neutrals, which matters for matte-black products
photographed against light backgrounds — exactly our case.

**Every color you write must be sRGB.** drei/r3f handle this for most
properties, but watch for raw `Color` constructions in your code.

### 3.2 HDRI Lighting

**Do not ship with a drei preset in production.** They're rights-cleared but
generic. Get a custom HDRI:

- Author one in Blender (cycloramic room with area lights), bake to 2K
  equirectangular EXR with `File → Render → Save As Image, Cycles`.
- Or buy from Poly Haven (CC0) and curate — `studio_small_08` and
  `photo_studio_01` are good starts.
- Save as `public/hdri/studio.hdr` (2K is enough, 4K is overkill at typical viewports).

Load in scene:

```tsx
<Environment files="/hdri/studio.hdr" background={false} />
```

For "background=true" you'd see the HDR mapped to the skybox. Use a custom
backdrop instead (next section).

### 3.3 Light Rig

The HDRI gives you ambient reflection. You still need *direct lights* for
shadows and shaped highlights. Standard 3-point + kicker:

```tsx
<directionalLight position={[3, 6, 4]} intensity={2.5} castShadow
  shadow-mapSize={[2048, 2048]}
  shadow-bias={-0.0001}
  shadow-normalBias={0.02}
/>
<directionalLight position={[-4, 3, 2]} intensity={0.8} />   {/* fill */}
<directionalLight position={[0, 5, -4]} intensity={1.4} />   {/* rim */}
<directionalLight position={[2, 2, -2]} intensity={0.6} />   {/* kicker on bezel */}
```

Tune the rim until you can see the polished edge silhouette against the
background. That single highlight does more than any other element.

### 3.4 Backdrop / Cyclorama

A flat plane is boring. Build a **cyclorama**: a plane that curves up at the
back, no visible horizon line. Two ways:

- **Procedural:** large plane + extruded curve as a wall, blended in Blender,
  imported as part of the studio model.
- **Subdivided plane** with a vertex displacement shader for the curve.

Material: `MeshStandardMaterial` with `roughness 0.7`, neutral off-white
`#ebebed`. Match `body { background }` so any blank frame won't reveal a seam.

### 3.5 Contact Shadows

drei's `<ContactShadows>` is OK; for hero quality use **AccumulativeShadows**
which raymarches and caches a soft contact shadow:

```tsx
<AccumulativeShadows temporal frames={60} alphaTest={0.85} scale={5} position={[0, 0.001, 0]}>
  <RandomizedLight amount={8} radius={4} ambient={0.5} position={[3, 5, 4]} />
</AccumulativeShadows>
```

This produces the soft, photographic under-product shadow Apple uses. Render
once at scene mount, then no per-frame cost.

### 3.6 Post-Processing

Use `@react-three/postprocessing` with **subtle** settings:

- **N8AO** for ambient occlusion (better than SSAO for stylized PBR)
- **Bloom** with threshold 0.9, intensity 0.4 (highlights only)
- **Vignette** at 0.3 falloff (frames the product)
- **SMAA** for cheap antialiasing on top of MSAA

```tsx
<EffectComposer multisampling={4}>
  <N8AO intensity={2} aoRadius={0.5} distanceFalloff={0.2} />
  <Bloom luminanceThreshold={0.9} intensity={0.4} mipmapBlur />
  <Vignette eskil={false} offset={0.5} darkness={0.3} />
</EffectComposer>
```

Always view side-by-side with post off. If you can't tell the difference, the
settings are too subtle. If post screams "filter," it's too loud.

**Deliverable for Section 3:** static scene with one pad, no UI, that you'd be
embarrassed to ship and proud to screenshot.

---

## 4. Materials — Two-Surface Glass, Production Quality

### 4.1 The polished CNC edge

Anisotropy is what makes machined aluminum/glass look real:

```ts
const edge = new MeshPhysicalMaterial({
  color: '#dfe9e2',
  metalness: 0,
  roughness: 0.04,
  clearcoat: 1.0,
  clearcoatRoughness: 0.03,
  envMapIntensity: 1.8,
  anisotropy: 0.6,            // three 0.165+
  anisotropyRotation: Math.PI / 4,
  anisotropyMap: loadKTX2('/textures/edge_aniso.ktx2'),
  ior: 1.5,
  transmission: 0,
});
```

The anisotropy map is a 256×256 noise pattern oriented along the bezel's brush
direction. Even without the map, just setting `anisotropy: 0.6` gives the
"stretched highlight" character of milled metal/glass.

### 4.2 The matte playing surface

```ts
const surface = new MeshPhysicalMaterial({
  color: tintColor,           // overridden per SKU
  metalness: 0,
  roughness: 0.5,
  clearcoat: 0,
  ior: 1.5,
  envMapIntensity: 0.5,
  normalMap: loadKTX2('/textures/surface_normal.ktx2'),
  roughnessMap: loadKTX2('/textures/surface_rough.ktx2'),
});
surface.normalMap.repeat.set(64, 64);
surface.normalMap.wrapS = surface.normalMap.wrapT = RepeatWrapping;
```

The **roughness map** is just as important as the normal map. Real glass has
roughness variation: dust, fingerprints, micro-imperfections. A flat
`roughness: 0.5` looks like plastic. Add a low-contrast roughness map
(grayscale, ±0.05 around 0.5) and it instantly reads as real.

### 4.3 Recoloring per SKU

Mutate `material.color` only — never recreate the material:

```ts
useEffect(() => {
  surfaceMaterial.color.set(tintColor);
}, [tintColor]);
```

Recreating the material breaks shader caches and triggers a recompile (visible
hitch).

**Deliverable for Section 4:** screenshot of one pad lit at three angles
(top, 3/4, raking) and the bezel highlight reads as polished, not plastic.

---

## 5. Camera — Framing & Transitions

### 5.1 Framing Math

**Telephoto compression** is the visual signature of product photography. Use a
narrow FOV (24°–32°) and pull the camera back. This compresses depth and makes
parallel edges read as parallel (no perspective fan).

For one pad at ~0.5m across, framing fills ~60% of frame width:

```
distance = (pad_width / 2) / tan((fov / 2) * π/180) / 0.6
         = 0.25 / tan(14°) / 0.6
         ≈ 1.67m
```

So camera at distance 1.67m, FOV 28°. Adjust per SKU if widths differ.

### 5.2 Off-Center Frustum

The product panel takes the right ~30% of screen. Render the pad in the **left
half** by biasing the camera lookAt to the right (in world space):

```ts
camera.lookAt(0.3, 0, 0);
```

Or use `camera.setViewOffset` for a precise asymmetric frustum:

```ts
camera.setViewOffset(width, height, -width * 0.15, 0, width, height);
camera.updateProjectionMatrix();
```

This is what Apple uses to anchor product photography to one side of a layout
without changing the model's apparent position.

### 5.3 Camera Transitions Between SKUs

Don't lerp positions linearly. Use a **spring** or **cubic bezier**:

```tsx
import { useSpring, animated } from '@react-spring/three';

const { camPos, camTarget } = useSpring({
  camPos: targetPos.toArray(),
  camTarget: targetLookAt.toArray(),
  config: { mass: 1, tension: 80, friction: 26 },  // tuned, not default
});

useFrame(() => {
  camera.position.set(...camPos.get());
  camera.lookAt(...camTarget.get());
});
```

The default spring config is too bouncy. The values above give a
~700ms critically-damped motion — the same easing class as iOS sheet
transitions.

### 5.4 Idle Camera Motion

A static camera reads as flat. Add a **subtle** parallax drift tied to either
time or mouse position:

```ts
useFrame((state) => {
  const t = state.clock.elapsedTime;
  camera.position.x = baseX + Math.sin(t * 0.3) * 0.005;
  camera.position.y = baseY + Math.sin(t * 0.4) * 0.003;
});
```

Amplitude **must be < 1cm**. Anything bigger reads as "the camera is
animating," which breaks the product-photo feel.

---

## 6. Layout — Carousel Mechanics

Pedestal's pattern: **all SKUs live in 3D, the user navigates between them.**
Two valid layouts:

- **Stack carousel** (this project's current direction): SKUs arrayed on a
  diagonal track, active in foreground, others receding. Click to advance.
- **Linear gallery**: all SKUs in a row, camera dollies between them. Closer to
  apple.com/iphone navigation.

The stack carousel is more compact and fits Wallhack's three-SKU lineup. Use
this.

### 6.1 Slot System

```ts
// Each SKU has a slot index relative to the active SKU:
const slotOf = (skuIndex: number, activeIndex: number, n: number) =>
  (skuIndex - activeIndex + n) % n;

// World positions for slots — first slot is active, subsequent slots recede
const SLOT_OFFSETS = [
  new Vector3(0, 0, 0),
  new Vector3(0.78, 0, -0.42),
  new Vector3(1.45, 0, -0.78),
];
```

Each pad animates its world position toward `SLOT_OFFSETS[slotOf(i, active)]`.

### 6.2 Per-Pad Springs

Don't share one tween for all pads. Each pad has its own spring:

```tsx
function CarouselPad({ targetSlot, ... }) {
  const [{ pos }, api] = useSpring(() => ({ pos: targetSlot.toArray() }));
  useEffect(() => {
    api.start({ pos: targetSlot.toArray() });
  }, [targetSlot]);
  // ...apply to group position
}
```

This way pads can have staggered timings (cheap but expensive-looking trick:
delay each pad's spring by `slot * 40ms`).

### 6.3 Z-Sort & Visibility

When a pad scrolls "past" the camera (slot 0 → wraps to slot 2 going backward),
its target Z briefly puts it behind the camera. Fade out its material opacity
during that window so it doesn't pop. Alternatively, force the rotation
direction to always be one-way (forward through the array).

---

## 7. UI Architecture — The 2D Layer

Two key rules:

1. **The 2D UI is a sibling of the Canvas**, not inside it. Communicate via
   zustand.
2. **All UI motion is Framer Motion.** R3F handles 3D motion; Framer handles
   2D. Keep these worlds separate.

### 7.1 zustand Store

```ts
// lib/store/configurator.ts
import { create } from 'zustand';

type Store = {
  activeSku: SkuId;
  colorBySku: Record<SkuId, ColorOption>;
  isLoading: boolean;
  setSku: (id: SkuId) => void;
  setColor: (id: SkuId, c: ColorOption) => void;
};

export const useConfigurator = create<Store>((set) => ({
  activeSku: 'sp-005',
  colorBySku: { 'sp-005': 'black', 'cr-005': 'black', 'sp-004a': 'white' },
  isLoading: true,
  setSku: (id) => set({ activeSku: id }),
  setColor: (id, c) => set((s) => ({ colorBySku: { ...s.colorBySku, [id]: c } })),
}));
```

Both the Canvas tree and the UI tree consume this. No prop drilling.

### 7.2 Top Bar

Three regions: brand wordmark, category nav, account/exit. Use a CSS grid:

```tsx
<header className="grid grid-cols-[auto_1fr_auto] items-center px-8 py-5">
  <Wordmark />
  <Nav />
  <AccountTools />
</header>
```

Each nav item is a small card + sublabel underneath. The sublabel shows the
currently active selection for that category (e.g., GLASS PAD → "sp-005").

### 7.3 Product Panel

Right-anchored, vertically centered. Built from three reusable atoms:

- `<PillRow label="surface" options={...} value={...} onChange={...} />`
- `<TagList tags={...} />`
- `<AddToCartCTA price={...} onAdd={...} />`

All transitions on selection change are Framer Motion `<motion.span>`
crossfades, not React state swaps (which would jump).

### 7.4 Loading State

Critical for perceived quality. Show:

1. WALLHACK wordmark fading in (300ms).
2. A thin progress bar tracking actual GLB byte progress (via
   `useGLTF.preload(url, onProgress)`).
3. Crossfade to the rendered scene when done.

Never show a spinner. Apple doesn't, Pedestal doesn't.

---

## 8. Interactions

### 8.1 Click to Focus

Each pad's outer group has an `onClick` raycaster handler. Stop propagation so
clicks on a pad don't fall through to a background handler.

### 8.2 Drag / Swipe Carousel

For trackpad and touch: use `@use-gesture/react` to track horizontal drag,
convert pixel delta to slot delta:

```tsx
const bind = useDrag(({ movement: [mx], last }) => {
  if (last) {
    const direction = mx > 50 ? -1 : mx < -50 ? 1 : 0;
    if (direction !== 0) {
      const newIndex = (activeIndex + direction + n) % n;
      setSku(SKUS[newIndex].id);
    }
  }
});
```

Apply `{...bind()}` to the Canvas wrapper.

### 8.3 Keyboard

- `←` / `→` cycles SKUs.
- `Tab` order: nav → product panel pills → CTA.
- `Enter` on a pill activates it.
- All custom-styled buttons need `:focus-visible` outlines (skip on
  `:focus`).

### 8.4 URL State

```tsx
// hooks/useSkuFromUrl.ts
export function useSkuFromUrl() {
  const search = useSearchParams();
  const setSku = useConfigurator((s) => s.setSku);
  const sku = (search.get('sku') as SkuId) ?? 'sp-005';
  useEffect(() => { setSku(sku); }, [sku]);
}
```

And on change, update the URL via `router.replace('?sku=' + id, { scroll: false })`.

### 8.5 Hover Feedback

On hover over a non-active pad:

- 2D: pad's floating label scales 1.0 → 1.05.
- 3D: subtle Y lift of 5mm + slight rotation toward camera.
- Cursor: `pointer`.

These three together signal interactivity without being loud.

---

## 9. Shopify Integration

The configurator is a glorified product card — it picks a Shopify variant and
hands off to checkout. Don't build a full cart UI; redirect to Shopify's
checkout (or use Hydrogen if migrating that direction).

### 9.1 Setup

1. In Shopify Admin → Apps → "Develop apps" → create a private app with
   **Storefront API** scopes (`unauthenticated_read_product_listings`,
   `unauthenticated_write_checkouts`).
2. Copy the storefront access token to `.env.local`:

```
SHOPIFY_STORE_DOMAIN=wallhack.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=shpat_xxxxxxxxxxxxx
```

3. Each pad SKU corresponds to a Shopify **Product**. Color/surface variants
   correspond to Shopify **Variants** under that product. Note variant IDs.

### 9.2 SKU → Shopify Variant Mapping

In `config/skus.ts`, extend each SKU:

```ts
type Sku = {
  id: SkuId;
  // ...existing fields
  shopify: {
    productId: string;  // gid://shopify/Product/...
    variants: Record<string, string>;  // key: "black" | "white", value: variant gid
  };
};
```

`gid://shopify/ProductVariant/12345` format.

### 9.3 Storefront API Client

```ts
// lib/shopify/client.ts
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

export const shopify = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
  apiVersion: '2025-01',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN!,
});
```

### 9.4 Cart Mutation

```ts
// lib/shopify/cart.ts
export async function createCart(variantId: string, quantity = 1) {
  const { data } = await shopify.request(`
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { id checkoutUrl }
      }
    }`, {
    variables: {
      input: {
        lines: [{ merchandiseId: variantId, quantity }],
      },
    },
  });
  return data.cartCreate.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity = 1) {
  const { data } = await shopify.request(`
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { id checkoutUrl totalQuantity }
      }
    }`, {
    variables: { cartId, lines: [{ merchandiseId: variantId, quantity }] },
  });
  return data.cartLinesAdd.cart;
}
```

### 9.5 Cart Hook

```ts
// hooks/useCart.ts
export function useCart() {
  const [cartId, setCartId] = useLocalStorage<string | null>('wallhack:cart', null);
  const [cart, setCart] = useState<Cart | null>(null);

  const add = async (variantId: string) => {
    if (!cartId) {
      const c = await createCart(variantId);
      setCartId(c.id);
      setCart(c);
    } else {
      const c = await addToCart(cartId, variantId);
      setCart(c);
    }
  };

  return { cart, add };
}
```

### 9.6 ADD button wire-up

```tsx
function AddToCart() {
  const { add } = useCart();
  const sku = useConfigurator((s) => SKUS.find(x => x.id === s.activeSku)!);
  const color = useConfigurator((s) => s.colorBySku[s.activeSku]);
  const variantId = sku.shopify.variants[color];

  return (
    <button onClick={async () => {
      const cart = await add(variantId);
      window.location.href = cart.checkoutUrl;
    }}>
      ADD — {sku.currency}{sku.price}
    </button>
  );
}
```

### 9.7 Inventory

Optional: query variant `availableForSale` on mount, disable the pill if
out-of-stock. Don't poll — Shopify webhooks aren't worth setting up for a
configurator; refresh on page load is fine.

### 9.8 Price (live from Shopify)

Don't hardcode prices in `skus.ts`. Fetch the variant price from Shopify on
mount and cache for the session. Currency localization comes from Shopify's
Markets API — pass `country: 'DK'` in your context arg.

---

## 10. Performance & Polish

### 10.1 Preload All Pads

```ts
useGLTF.preload('/models/sp-005.glb');
useGLTF.preload('/models/cr-005.glb');
useGLTF.preload('/models/sp-004a.glb');
```

Call at module-top so they start loading during page render.

### 10.2 Frameloop Strategy

If the scene is static after intro, set `frameloop="demand"` and call
`invalidate()` from each animation hook. The browser idles when nothing is
moving — your laptop fan stays quiet.

### 10.3 Texture Compression

Already covered in section 2.3 — KTX2/BasisU for every texture. Three.js
auto-decodes via `KTX2Loader`.

### 10.4 Frame Budget

Target: **16.6ms / frame.** Use Spector.js to inspect draw calls. Each pad
should be **1–2 draw calls**. If you see more, you have duplicate materials
or are recreating geometries.

### 10.5 Tab-Hidden Pause

Pause the render loop when the tab is hidden:

```tsx
useEffect(() => {
  const onVis = () => setEnabled(!document.hidden);
  document.addEventListener('visibilitychange', onVis);
  return () => document.removeEventListener('visibilitychange', onVis);
}, []);
```

### 10.6 Accessibility

- All interactive elements reachable by keyboard.
- `prefers-reduced-motion` → kill camera idle drift + reduce spring stiffness.
- Alt text on each pad image (yes, even 3D — for screen readers).
- `aria-live` on cart count.

---

## 11. Testing & Deploy

### 11.1 Smoke Tests

Playwright covers the critical paths:

```
test 1: page loads → first SKU renders within 2s
test 2: click second pad → activeSku changes, URL updates
test 3: select color "white" → surface tint updates
test 4: click ADD → cart created, checkoutUrl returned
```

### 11.2 Visual Regression

`@argos-ci/playwright` snapshots the scene at known camera presets. Run on
every PR.

### 11.3 Lighthouse Budget

- Performance: ≥ 90
- Best Practices: 100
- Accessibility: ≥ 95
- LCP < 2.5s, CLS < 0.1, INP < 200ms

The Canvas counts as a single LCP element. If it's slow, you need smaller
GLBs.

### 11.4 Deployment

Vercel works fine. Static-export the page; the only dynamic piece is the cart
API route, which Vercel runs at the edge.

Set up image preview deployments per PR so the design team can review
visually.

---

## 12. Build Order (Recommended Sequence)

A two-week sprint, one engineer:

**Week 1 — 3D fidelity**

| Day | Goal |
|-----|------|
| 1 | Re-author SP-005 GLB with bevels, compressed to < 400KB |
| 2 | Custom studio HDRI baked in Blender |
| 3 | Scene rig: AgX, AccumulativeShadows, key/fill/rim lights |
| 4 | Materials: anisotropic edge + roughness-map'd surface |
| 5 | Post FX: N8AO + bloom + vignette tuned subtly |

**Week 2 — Interactions & Shopify**

| Day | Goal |
|-----|------|
| 6 | zustand store + URL state + 2D layout shell |
| 7 | Carousel slot system + per-pad springs |
| 8 | Top bar, product panel, pill rows, Framer Motion polish |
| 9 | Shopify product/variant mapping + Storefront API client |
| 10 | Cart hook + ADD CTA + checkout redirect |

**Week 3 — Polish & ship**

| Day | Goal |
|-----|------|
| 11 | Drag/swipe + keyboard + a11y |
| 12 | Loader, preload, perf pass |
| 13 | Playwright tests + visual regression |
| 14 | Lighthouse pass, deploy to staging |

---

## 13. What to Demand From Anyone Building This

If you hand this to a contractor, the deliverable that proves they understood
this doc is:

1. A 10-second video of the scene rotating slowly, with no UI, in
   uncompressed quality. The polished bezel highlight should travel smoothly,
   the matte surface should react to lighting changes, and the contact shadow
   should be soft and grounded.
2. A Lighthouse report from the staging URL meeting the budget above.
3. A Storefront API call log showing a successful `cartCreate` followed by
   a checkout redirect to wallhack.myshopify.com.

Anything less means a section above was skipped.

---

## Appendix A — Reference Materials

- **Pedestal Studio** — pedestal.com/pages/studio. Study: pad rotation
  speed, panel transitions, color swatch interaction.
- **Apple iPhone 17 Pro** — apple.com/iphone-17-pro. Study: studio HDRI
  character, telephoto compression, hero scroll choreography.
- **Three.js Journey** — threejs-journey.com. Bruno Simon's course on
  realistic rendering. Best single source on the color pipeline.
- **Poly Haven** — polyhaven.com. CC0 HDRIs and textures.
- **glTF Sample Models** — github.com/KhronosGroup/glTF-Sample-Models. Use
  the DamagedHelmet to verify your material pipeline matches the reference.

## Appendix B — Cost Model (Rough)

- Asset authoring (3 SKUs): 3–5 days, ~$3k–$6k contracted
- Custom HDRI bake: 1 day, ~$500
- Engineering: 2–3 weeks, $15k–$30k contracted
- Shopify Plus or Basic depending on plan
- Hosting (Vercel Pro): $20/mo

Total to ship: **$20k–$40k**, 4–6 calendar weeks.
