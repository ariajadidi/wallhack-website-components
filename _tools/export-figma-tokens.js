// Figma variables + text styles → _tools/tokens.json and _tools/text-styles.json (run with the Figma MCP `use_figma` tool).
// Returns { tokens, textStyles }. Save `tokens` as _tools/tokens.json and `textStyles` as _tools/text-styles.json,
// then run `node _tools/gen-tokens.mjs` to regenerate assets/wh-tokens.css. Never edit those files by hand.
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const byId = new Map(vars.map(v => [v.id, v]));
// CSS name = the variable's Web code syntax (e.g. --wh-space-64); fallback --wh-<name with dashes>
const cssOf = v => { const w = v.codeSyntax && v.codeSyntax.WEB; return w ? w.replace(/^var\((.*)\)$/, '$1') : '--wh-' + v.name.replace(/\//g, '-'); };
const hex2 = x => Math.round(x * 255).toString(16).padStart(2, '0');
const color = c => (c.a === undefined || c.a >= 1) ? '#' + hex2(c.r) + hex2(c.g) + hex2(c.b)
  : `rgb(${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)} / ${+c.a.toFixed(2)})`;
const value = (v, val) => {
  if (val && val.type === 'VARIABLE_ALIAS') return { ref: cssOf(byId.get(val.id)) };
  if (v.resolvedType === 'COLOR') return color(val);
  if (v.resolvedType === 'FLOAT') return +(+val).toFixed(3);
  return val; };
const tokens = {};
for (const name of ['Primitives', 'Color', 'Responsive']) {
  const c = cols.find(x => x.name === name); if (!c) continue;
  tokens[name] = { modes: c.modes.map(m => m.name), vars: c.variableIds.map(id => byId.get(id)).filter(Boolean).map(v => ({
    name: v.name, css: cssOf(v), type: v.resolvedType, vals: c.modes.map(m => value(v, v.valuesByMode[m.modeId])) })) }; }
const styles = (await figma.getLocalTextStylesAsync()).map(s => {
  const bv = s.boundVariables || {};
  return { name: s.name, family: s.fontName.family, style: s.fontName.style,
    size: bv.fontSize ? byId.get(bv.fontSize.id).name : s.fontSize,
    lineHeight: s.lineHeight.unit === 'PERCENT' ? +s.lineHeight.value.toFixed(2) : s.lineHeight.unit === 'PIXELS' ? +(s.lineHeight.value / s.fontSize * 100).toFixed(2) : 'AUTO',
    letterSpacing: s.letterSpacing.unit === 'PERCENT' ? +s.letterSpacing.value.toFixed(2) : +(s.letterSpacing.value / s.fontSize * 100).toFixed(2),
    case: s.textCase }; });
return JSON.stringify({ tokens, textStyles: { _source: 'Figma local text styles (WH-Website-Component), exported ' + new Date().toISOString().slice(0, 10) + ' — authored by the design team; do not edit by hand', styles } });
