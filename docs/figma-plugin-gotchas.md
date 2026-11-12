# Figma Plugin API gotchas (via the Figma MCP `use_figma` tool)

Learned while building this system. Each line is a limit we hit and what works instead.

## Running scripts

- A script that throws commits **nothing** — safe to retry after fixing.
- Return values are capped at **48 KB**; return compact strings, export one variable collection at a time.
- `figma.loadAllPagesAsync()` is not supported — loop `await page.loadAsync()` per page.
- Set `figma.skipInvisibleInstanceChildren = false` before reading or writing hidden `(mobile)` layers.
- `setSharedPluginData` needs a namespace of at least 3 characters (we use `wallhack`). `setPluginData` is unsupported.
- If `use_figma` says “no edit access”, the MCP is signed in with the wrong Figma account — re-run `/mcp` and sign in again.

## Fonts and text

- **NB Architekt can't be loaded by plugins.** No new NB text styles can be created and NB text can't be edited directly.
  Workaround for instance text: set the main component's NB layers to an Inter style, `setProperties` on the instances,
  then restore the original style with `setTextStyleIdAsync` — the overrides survive.
- Text created or moved by a plugin in NB renders with stale line positions until a person edits it (select all NB text
  → make any change).
- `setBoundVariable('maxWidth', …)` is invalid on text nodes — wrap the text in a frame and bind the frame.
- `setRangeBoundVariable(0, len, 'fontSize', v)` works but detaches the text style. A text-style override on page copies
  blocks changes from the main; apply the same range binding on the copies.
- Descriptions store `" ' & < >` as HTML entities — use curly quotes and “+”.

## Instances and components

- Layers inside instances can't be resized, and min/max width can't be overridden on instance layers. Existing instance
  layers with a `boundVariables` override don't receive new bindings from the main → wrap the layer in a new frame in the
  main instead.
- `resetOverrides()` on a nested instance also renames the layer to its main's name — restore the name afterwards.
- Setting an INSTANCE_SWAP to the value it already has resets the swapped layers (names + bindings). Only swap when the
  value differs.
- Never toggle properties on main components or their nested instances “to test”: page instances whose override equals
  the temporary value lose that override.
- A layer can't have both a boolean-property visibility and a variable visibility; use a variant for optional elements
  that also switch by breakpoint. Auto-layout wrappers don't collapse when their children are hidden.
- An aspect-locked Media/Image that is stretched in a vertical parent keeps its height when its Ratio changes — put it in a
  horizontal “image holder” frame with `layoutGrow 1` and a `minWidth`.
- Plugins can create slots with `ComponentNode.createSlot()`; slot content in existing instances doesn't follow the main.
- **Exposed nested instances break inside slots.** A nested instance with `isExposedInstance = true` inside an item that
  sits in a slot gets a wrong id path (it points at the main's slot layer); reading its `name` throws “node does not exist”.
  Use an INSTANCE_SWAP property on the parent component instead of exposing the nested instance.
- Inside slot content, plugins can change a property *on* a nested instance (variant, instance swap) but changes one level
  deeper (`setProperties` / `swapComponent` on a layer inside that instance) can silently not apply. Read values from the
  property, not from the layer it drives.
- An INSTANCE_SWAP property has **one default for the whole variant set**: binding a layer resets it to that default, and
  swapping a bound layer inside a variant changes the set's default for every variant. Pick one sensible default
  (`editComponentProperty(key, { defaultValue })`).
- A frame that only gets its height from visible children (hug auto-layout + invisible aspect-locked spacer frames bound to
  `breakpoint/*`) switches shape with the Responsive mode — this is how `Mobile ratio` works. Absolute children with
  STRETCH constraints follow the frame.
- **A property bound to a hidden layer disappears from the instance's right panel** (also when the layer is hidden by a
  variable). Keep layers that carry an INSTANCE_SWAP / text property visible; put the breakpoint visibility inside the
  swapped component instead.
- **For a list of fixed choices, use a variant, not an instance swap.** A variant gives a real dropdown; an instance swap only
  opens the instance picker. Instance-swap values must also be standalone components, not variants of one set. The swap dropdown lists a set as one
  item (its default variant) and can't pick the others unless the nested instance is exposed. Moving a variant out of its
  set (`appendChild` to a plain frame) keeps its id and key, so existing swaps survive.
- A hug auto-layout frame whose children are **all** hidden keeps its last size (it doesn't collapse). Add an always-visible
  0.01 px child so it re-measures when a breakpoint variable hides the rest.
- Rebuilding or cloning variant layers loses their `componentPropertyReferences` (e.g. boolean fades) — after a
  restructure, compare every variant's references against a sibling variant.
- Clones land on the source page — move them before `combineAsVariants`.

## Variables and modes

- Variable aliases per mode: `{ type: 'VARIABLE_ALIAS', id }`. CSS name: `setVariableCodeSyntax('WEB', 'var(--wh-…)')`.
- Bound gradient stops can't be transparent — fades use alpha masks instead.
- After a plugin switches a frame's Responsive mode, Figma can keep drawing nested sizes from the old mode; switch to the
  other mode and back. `get_screenshot` also lags just after a mode switch.
- Main components must not carry explicit modes (designers sometimes pin them while previewing — check before handoff).

## Assets

- `download_assets` rejects sub-layer ids (`I…;…`) — pass the section instance id and match files by SHA-1
  (= Figma `imageHash`). Raw images are capped at 20 per node.
- Exporting a Library component as SVG bakes in the library frame's background — export from a temporary instance on a
  transparent frame and strip the first `<rect fill="#1E1E1E">`.
