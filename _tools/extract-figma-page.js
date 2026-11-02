// Figma page → figma-export.json page entry (run with the Figma MCP `use_figma` tool).
// Set PAGE_FRAME_ID to the page frame (e.g. a frame on the Templates page). Returns JSON in the
// shape _tools/figma-to-shopify.py expects: one entry per section instance, top to bottom.
figma.skipInvisibleInstanceChildren = false;   // hidden “(mobile)” layers (phone photos) must be readable too
const PAGE_FRAME_ID = '45:865';

const frame = await figma.getNodeByIdAsync(PAGE_FRAME_ID);
const cols = await figma.variables.getLocalVariableCollectionsAsync();
// Read the page in Desktop mode whatever mode the designer left it in (the phone version comes from the “(mobile)” layers); the mode is put back at the end.
// Only switched when needed: after a switch Figma can keep drawing some variable sizes from the other mode until the designer toggles it.
const respC = cols.find(c => c.name === 'Responsive'), prevResp = (frame.explicitVariableModes || {})[respC.id], deskId = respC.modes.find(m => m.name === 'Desktop').modeId;
const switched = prevResp !== deskId; if (switched) frame.setExplicitVariableModeForCollection(respC, deskId);
const colorC = cols.find(c => c.name === 'Color');
const clean = k => k.split('#')[0];
const visibleIn = (n, root) => { let p = n; while (p && p !== root) { if (p.visible === false) return false; p = p.parent; } return true; };
const compName = async i => { const m = await i.getMainComponentAsync(); return !m ? null : (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name); };
const props = async i => { const o = {}; for (const [k, v] of Object.entries(i.componentProperties)) {
  if (v.type === 'SLOT') continue;
  if (v.type === 'INSTANCE_SWAP') { const n = await figma.getNodeByIdAsync(v.value); o[clean(k)] = n ? (n.parent && n.parent.type === 'COMPONENT_SET' ? n.parent.name : n.name) : null; }
  else o[clean(k)] = v.value; } return o; };
const imageHashes = n => { const hs = []; for (const x of [n, ...n.findAll(() => true)]) { if (!visibleIn(x, n)) continue;
  const f = (Array.isArray(x.fills) ? x.fills : []).find(p => p && p.type === 'IMAGE' && p.visible !== false); if (f && f.imageHash && !hs.includes(f.imageHash)) hs.push(f.imageHash); } return hs; };   // Array check: vectors with per-region colours report fills as “mixed”
const slot = (i, name) => { const s = i.findAll(n => n.type === 'SLOT' && n.name === name)[0]; return s ? s.children.filter(c => c.visible) : []; };


// Colour overrides. Every solid fill/stroke gets the colour ROLE its layer has in the main component
// (background / foreground / border / image_background). A paint no longer linked to a variable is an override:
//  - if every layer of that role in the section was changed → section-level colour (e.colors)
//  - otherwise → element-level colour (e.elementColors) with the element's slot path + text field, for per-element CSS.
const localVars = new Map((await figma.variables.getLocalVariablesAsync()).map(v => [v.id, v]));
const ROLE = { 'color/background': 'background', 'color/foreground': 'foreground', 'color/foreground-muted': 'foreground', 'color/border': 'border', 'color/image-background': 'image_background' };
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
const fieldOf = n => { for (let x = n; x; x = x.parent) { const r = x.componentPropertyReferences; if (r && r.characters) return clean(r.characters); if (x.type === 'SLOT' || (x.parent && x.parent.type === 'SLOT')) break; } return null; };
const pathOf = (n, root) => { const p = []; for (let x = n; x && x !== root; x = x.parent) if (x.parent && x.parent.type === 'SLOT') p.unshift({ slot: x.parent.name, index: x.parent.children.filter(c => c.visible).findIndex(c => c.id === x.id) }); return p; };
const colorOverrides = async inst => {
  const total = {}, changed = [], warnings = [];
  for (const n of [inst, ...inst.findAll(() => true)]) {
    if (!visibleIn(n, inst)) continue;
    for (const k of ['fills', 'strokes']) { const arr = n[k]; if (!Array.isArray(arr)) continue;
      for (let i = 0; i < arr.length; i++) { const p = arr[i]; if (p.type !== 'SOLID' || p.visible === false) continue;
        let role;
        if (p.boundVariables && p.boundVariables.color) { const v = localVars.get(p.boundVariables.color.id); role = v && ROLE[v.name]; if (role) total[role] = (total[role] || 0) + 1; continue; }
        // where did this paint come from? the same layer in its main component; for slot items placed in a copy, the item's own main
        const cands = [];
        if (n === inst) cands.push(await inst.getMainComponentAsync()); else cands.push(await figma.getNodeByIdAsync(n.id.split(';').pop()));
        if (n.type === 'INSTANCE') cands.push(await n.getMainComponentAsync());
        if (cands[0] && cands[0].type === 'INSTANCE' && cands[0] !== n) cands.push(await cands[0].getMainComponentAsync());
        for (const src of cands) { const sp = src && src !== n && Array.isArray(src[k]) ? src[k][i] : null; const v = sp && sp.boundVariables && sp.boundVariables.color && localVars.get(sp.boundVariables.color.id); if (v && ROLE[v.name]) { role = ROLE[v.name]; break; } }
        if (!role) { warnings.push(`${n.name}: ${hex(p.color)} is not linked to a colour role — not carried over`); continue; }
        total[role] = (total[role] || 0) + 1;
        changed.push({ role, hex: hex(p.color), field: n.type === 'TEXT' ? fieldOf(n) : null, layer: n.name, kind: n.type === 'TEXT' ? 'text' : k === 'strokes' ? 'stroke' : 'fill', path: pathOf(n, inst), root: n === inst }); } } }
  const colors = {}, elementColors = [];
  for (const role of new Set(changed.map(c => c.role))) {
    const mine = changed.filter(c => c.role === role); const hexes = [...new Set(mine.map(c => c.hex))];
    if (mine.length === total[role] && hexes.length === 1) colors[role] = hexes[0];       // whole role recoloured → section colour
    else for (const c of mine) if (c.root && role === 'background') colors.background = c.hex; else elementColors.push(c);
  }
  // collapse duplicates (same element + role + colour)
  const seen = new Set(); const els = elementColors.filter(c => { const k = JSON.stringify([c.path, c.field || c.layer, c.role, c.hex]); if (seen.has(k)) return false; seen.add(k); return true; });
  return { colors, elementColors: els, warnings };
};


// Media/Image options: photo fades (fade top / fade bottom), gradient background, and the separate phone photo (Mobile image=Separate)
const ratioOfMedia = n => { const r = n && n.componentProperties && n.componentProperties.Ratio; const m = r && /^(\d+):(\d+)$/.exec(r.value); return m ? +(m[1] / m[2]).toFixed(3) : n ? +(n.width / n.height).toFixed(3) : undefined; };
const isMobileLayer = (n, root) => { for (let x = n; x && x !== root; x = x.parent) if (/\(mobile\)/.test(x.name)) return true; return false; };
const photoOf = n => n.findOne(c => c.name === 'photo') || n;   // Media/Image + Card Image: the picture is on its own “photo” layer (so switching Background keeps it); in Media/Image it sits inside “content” under the fade masks
const fitOf = n => { const f = (Array.isArray(photoOf(n).fills) ? photoOf(n).fills : []).find(x => x.type === 'IMAGE' && x.visible !== false); return f && f.scaleMode === 'FIT' ? 'fit' : 'fill'; };
const firstMediaFit = async c => { for (const n of [c, ...c.findAll(x => x.type === 'INSTANCE')]) { const nm = n.type === 'INSTANCE' ? await compName(n) : ''; if (nm === 'Media/Image' || nm === 'Media/Card Image') return fitOf(n); } return 'fill'; };
const bgOf = q => q.Background === 'Gradient' ? 'gradient' : q.Background === 'None' ? 'none' : 'solid';   // Media “Background”
const firstMediaBg = async c => { for (const n of [c, ...c.findAll(x => x.type === 'INSTANCE')]) { const nm = n.type === 'INSTANCE' ? await compName(n) : ''; if (nm === 'Media/Image' || nm === 'Media/Card Image') return bgOf(await props(n)); } return 'solid'; };
// Card / Compare column / Content Frame with Mobile image=Separate: the phone photo is the “(mobile)” layer
const phoneMediaOf = async (c, q) => { if (q['Mobile image'] !== 'Separate') return {};
  for (const n of c.findAll(x => /\(mobile\)/.test(x.name))) { const ph = n.type === 'INSTANCE' && ['Media/Image', 'Media/Card Image'].includes(await compName(n)) ? photoOf(n) : n;
    const f = (Array.isArray(ph.fills) ? ph.fills : []).find(x => x.type === 'IMAGE' && x.visible !== false);
    if (f && f.imageHash) return { imageMobile: [f.imageHash], imageMobileRatio: ratioOfMedia(n), imageFitMobile: f.scaleMode === 'FIT' ? 'fit' : 'fill' }; }
  return {}; };
// Background=Gradient: the bottom colour is color/gradient-end unless a designer set a plain colour on the “background” layer’s last stop
const gradientEndOf = n => { const bg = n.findOne(c => c.name === 'background'); const g = bg && Array.isArray(bg.fills) && bg.fills.find(f => f.type === 'GRADIENT_LINEAR' && f.visible !== false);
  const st = g && g.gradientStops[g.gradientStops.length - 1]; return st && !(st.boundVariables && st.boundVariables.color) ? hex(st.color) : null; };
const fadeOf = q => q['fade top'] && q['fade bottom'] ? 'both' : q['fade top'] ? 'top' : q['fade bottom'] ? 'bottom' : 'none';
const mediaOptions = async (s, p) => { const o = {}; const ms = [];
  for (const n of s.findAll(x => x.type === 'INSTANCE')) if ((await compName(n)) === 'Media/Image') ms.push(n);
  const desk = ms.find(n => !isMobileLayer(n, s)), mob = ms.find(n => isMobileLayer(n, s));
  if (desk) { const q = await props(desk); o.imageFade = fadeOf(q); o.imageBackground = bgOf(q); o.imageFit = fitOf(desk); const ge = gradientEndOf(desk); if (o.imageBackground === 'gradient' && ge) o.gradientEnd = ge; }
  if (mob && p['Mobile image'] === 'Separate') { const q = await props(mob); o.imageFadeMobile = fadeOf(q); o.imageFitMobile = fitOf(mob);
    const f = (Array.isArray(photoOf(mob).fills) ? photoOf(mob).fills : []).find(x => x.type === 'IMAGE' && x.visible !== false); if (f && f.imageHash) o.imageMobile = [f.imageHash];
    o.imageMobileRatio = ratioOfMedia(mob); }
  return o; };

// sections in page order; plain frames/groups used to organise a page (e.g. a page frame pasted inside another) are looked into
const flatten = n => n.children.flatMap(c => (c.type === 'FRAME' || c.type === 'GROUP' || c.type === 'SECTION') && c.visible ? flatten(c) : [c]);
// Phone photo settings of one section (photo, framing, shape, fade) — read from the “(mobile)” layers.
const PHONE_KEYS = ['imageMobile', 'imageMobileRatio', 'imageFitMobile', 'imageFadeMobile'];
const phoneOf = async (s, component, p) => {
  if (['Section/Cover', 'Section/Image', 'Section/Text + Media', 'Section/Split'].includes(component)) { const o = await mediaOptions(s, p); return Object.fromEntries(PHONE_KEYS.filter(k => k in o).map(k => [k, o[k]])); }
  if (component === 'Section/Content Frame') return await phoneMediaOf(s, p);
  if (component === 'Section/Cards') return { cards: await Promise.all(slot(s, 'cards').map(async c => phoneMediaOf(c, await props(c)))) };
  if (component === 'Section/Compare') return { items: await Promise.all(slot(s, 'items').map(async i => phoneMediaOf(i, await props(i)))) };
  return {}; };
// Campaign pages have a separate phone frame next to the page frame (“page/k-001 (mobile)”, a copy in Mobile mode).
// Designers set the phone photos there, so its phone settings win over the hidden “(mobile)” layers of the desktop frame.
const mobileFrame = frame.parent && 'children' in frame.parent ? frame.parent.children.find(c => c !== frame && c.name === frame.name + ' (mobile)') : null;
const out = [], phoneNotes = [];
try {
for (const s of flatten(frame)) {
  if (s.type !== 'INSTANCE' || !s.visible) continue;
  const component = await compName(s), p = await props(s), e = { component, props: p };
  const mode = (s.explicitVariableModes || {})[colorC.id]; if (mode) e.colorMode = colorC.modes.find(m => m.modeId === mode).name;
  const imgs = imageHashes(s); if (imgs.length) e.images = imgs;
  if (['Section/Cover', 'Section/Image', 'Section/Text + Media', 'Section/Split'].includes(component)) { const fr = s.findAll(n => n.name === 'image').find(n => visibleIn(n, s)); e.imageRatio = fr ? ratioOfMedia(fr) : +(s.width / s.height).toFixed(3); }
  if (['Section/Cover', 'Section/Image', 'Section/Text + Media', 'Section/Split'].includes(component)) Object.assign(e, await mediaOptions(s, p));
  const ratioOf = c => { const fr = c.findAll(n => n.name === 'image').find(n => visibleIn(n, c)); return fr ? ratioOfMedia(fr) : undefined; };
  if (component === 'Section/Intro + USPs') e.slots = { 'usp-row': await Promise.all(slot(s, 'usp-row').map(compName)) };
  if (component === 'Section/Intro + USPs') { const cta = s.findOne(n => n.type === 'INSTANCE' && n.name === 'cta'); if (cta) e.ctaLabel = (await props(cta)).cta_label; }
  // spacing switched off by the designer: section padding unlinked from its variable and set to 0
  { const mc = await s.getMainComponentAsync(), bv = s.boundVariables || {}, mv = (mc && mc.boundVariables) || {};
    if (mv.paddingTop && !bv.paddingTop && s.paddingTop === 0) e.noSpaceTop = true;
    if (mv.paddingBottom && !bv.paddingBottom && s.paddingBottom === 0) e.noSpaceBottom = true;
    // Spacing: Regular = section padding linked to layout/block-padding-y instead of the component's layout/block-padding-y-large
    const vn = k => bv[k] && localVars.get(bv[k].id) && localVars.get(bv[k].id).name; if (vn('paddingTop') === 'layout/block-padding-y' || vn('paddingBottom') === 'layout/block-padding-y') e.spacing = 'regular';
    else if (vn('paddingTop') === 'layout/block-padding-y-large' || vn('paddingBottom') === 'layout/block-padding-y-large') e.spacing = 'large'; }
  if (component === 'Section/Compare') e.slots = { items: await Promise.all(slot(s, 'items').map(async i => ({ props: await props(i), images: imageHashes(i), imageRatio: ratioOf(i), imageFit: await firstMediaFit(i), imageBackground: await firstMediaBg(i), ...(await phoneMediaOf(i, await props(i))),
    tags: await Promise.all(slot(i, 'tags').map(async t => (await props(t)).label)) }))) };
  if (component === 'Section/Text Cards') e.slots = { cards: await Promise.all(slot(s, 'cards').map(async c => { const q = await props(c); return { name: q.name, description: q.description }; })) };
  if (component === 'Section/Cards') e.slots = { cards: await Promise.all(slot(s, 'cards').map(async c => { const q = await props(c); return { name: q.name, description: q.description, images: imageHashes(c), imageRatio: ratioOf(c), imageFit: await firstMediaFit(c), imageBackground: await firstMediaBg(c), ...(await phoneMediaOf(c, q)) }; })) };
  if (component === 'Section/FAQ') e.slots = { items: await Promise.all(slot(s, 'items').map(async i => { const q = await props(i); return { question: q.question, answer: q.answer }; })) };
  if (component === 'Section/Contents') e.slots = { items: await Promise.all(slot(s, 'items').map(async i => { const q = await props(i); return { icon: q.icon, caption: q.caption }; })) };
  if (component === 'Section/Drawing + callouts') { e.slots = {}; for (const k of ['callouts-top', 'callouts-bottom']) e.slots[k] = await Promise.all(slot(s, k).map(async c => { const q = await props(c); return { text: q.Type === 'Empty' ? '' : q.text, Type: q.Type }; })); }
  if (component === 'Section/Comparison Timeline') e.slots = { cards: await Promise.all(slot(s, 'cards').map(async c => { const q = await props(c);
    const attrs = []; for (const a of c.findAll(n => n.type === 'INSTANCE' && n.name.startsWith('attr_'))) { const ap = await props(a); attrs.push([ap.label, ap.value]); }
    return { name: q.name, icon: q.icon, attributes: attrs }; })) };
  if (component === 'Section/Spec row') { e.pairs = []; for (const pr of s.findAll(n => n.type === 'INSTANCE' && n.name.startsWith('spec_'))) if (visibleIn(pr, s)) { const q = await props(pr); e.pairs.push({ label: q.label, value: q.value }); } }
  if (component === 'Section/Spec sheet') e.lines = await Promise.all(slot(s, 'lines').map(async l => ({ specs: (await props(l)).Specs,
    pairs: await Promise.all(l.findAll(n => n.type === 'INSTANCE' && n.name.startsWith('spec_')).filter(x => visibleIn(x, l)).map(async x => { const q = await props(x); return { label: q.label, value: q.value }; })) })));
  if (component === 'Section/Specs + Contents') { const ci = s.findOne(n => n.type === 'INSTANCE' && n.name === 'contents');
    e.label = ci ? (await props(ci)).label : '';
    e.slots = { items: await Promise.all(slot(s, 'items').map(async i => { const q = await props(i); return { icon: q.icon, caption: q.caption }; })) };
    e.lines = await Promise.all(slot(s, 'lines').map(async l => ({ specs: (await props(l)).Specs,
      pairs: await Promise.all(l.findAll(n => n.type === 'INSTANCE' && n.name.startsWith('spec_')).filter(x => visibleIn(x, l)).map(async x => { const q = await props(x); return { label: q.label, value: q.value }; })) }))); }
  if (component === 'Section/Size table') { const txt = n => n.findAll(t => t.type === 'TEXT').map(t => t.characters).join(' ');
    e.sizes = s.findOne(n => n.name === 'header').children.slice(1).map(txt);
    e.rows = slot(s, 'rows').map(r => { const [label, letter] = txt(r.findOne(n => n.name === 'label')).split(/\s*\n\s*|\s+\(/); return { label: label.trim(), letter: (letter || '').replace(/[()]/g, ''), values: r.children.filter(c => c.name.startsWith('value_')).map(txt) }; }); }
  if (component === 'Menu/Top Bar') e.breadcrumbs = p.breadcrumbs;   // a top bar placed straight on the page (campaign pages) → sticky WH Top Bar section
  if (component === 'Section/Product Header') { const tb = s.findOne(n => n.type === 'INSTANCE' && n.name === 'top bar'); e.breadcrumbs = tb ? (await props(tb)).breadcrumbs : '';
    e.slots = { gallery: await Promise.all(slot(s, 'gallery').map(async g => ({ ratio: (await props(g)).Ratio, images: imageHashes(g) }))) }; }
  if (component === 'Section/Content Frame') Object.assign(e, await phoneMediaOf(s, p));
  if (component === 'Section/Content Frame') { const v = s.findOne(n => n.name === 'video');
    if (v && (v.fills || []).some(p => p.type === 'VIDEO' && p.visible !== false)) (e.warnings = e.warnings || []).push('video: a Figma video fill can’t be carried over — upload the video in Shopify (section setting “Video”)'); }
  const co = await colorOverrides(s); if (Object.keys(co.colors).length) e.colors = co.colors; if (co.elementColors.length) e.elementColors = co.elementColors; if (co.warnings.length) e.warnings = (e.warnings || []).concat(co.warnings);
  out.push(e);
}
// phone frame → overwrite the phone settings, section by section (same order and components as the desktop frame)
if (mobileFrame) { const ms = flatten(mobileFrame).filter(x => x.type === 'INSTANCE' && x.visible);
  for (let i = 0; i < out.length; i++) { const m = ms[i], e = out[i]; if (!m) break;
    const mc = await compName(m); if (mc !== e.component) { phoneNotes.push(`section ${i + 1}: phone frame has ${mc}, page has ${e.component} — phone settings not read from the phone frame from here on`); break; }
    const ph = await phoneOf(m, mc, await props(m));
    if (ph.cards && e.slots && e.slots.cards) ph.cards.forEach((c, j) => { if (e.slots.cards[j]) { for (const k of PHONE_KEYS) delete e.slots.cards[j][k]; Object.assign(e.slots.cards[j], c); } });
    else if (ph.items && e.slots && e.slots.items) ph.items.forEach((c, j) => { if (e.slots.items[j]) { for (const k of PHONE_KEYS) delete e.slots.items[j][k]; Object.assign(e.slots.items[j], c); } });
    else if (!ph.cards && !ph.items) { for (const k of PHONE_KEYS) if (k in ph && JSON.stringify(ph[k]) !== JSON.stringify(e[k])) phoneNotes.push(`section ${i + 1} ${e.component}: ${k} ${JSON.stringify(e[k])} → ${JSON.stringify(ph[k])} (phone frame)`); Object.assign(e, ph); } } }
} finally { if (switched) { if (prevResp) frame.setExplicitVariableModeForCollection(respC, prevResp); else frame.clearExplicitVariableModeForCollection(respC); } }
const fm = (frame.explicitVariableModes || {})[colorC.id];
// page background changed for this page (raw colour instead of color/background) → used by sections without a background of their own (top bar)
const ff = (Array.isArray(frame.fills) ? frame.fills : []).find(x => x.type === 'SOLID' && x.visible !== false); const frameBackground = ff && !(ff.boundVariables && ff.boundVariables.color) ? hex(ff.color) : undefined;
return JSON.stringify({ frameMode: fm ? colorC.modes.find(m => m.modeId === fm).name : 'Light', frameBackground, mobileFrame: mobileFrame ? mobileFrame.id : undefined, phoneNotes, sections: out });
