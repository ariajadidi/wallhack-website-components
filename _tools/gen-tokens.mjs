// Generates assets/wh-tokens.css from the Figma variable export (_tools/tokens.json).
// SCALED LAYOUT: the page is designed at one width per layout and scales as a whole
// (text, spacing, icons, drawings) with the page window — like a picture, aspect ratio locked.
//   Desktop design width 1464 (Figma "Desktop" mode) · Mobile design width 390 (Figma "Mobile" mode)
//   One switch: window < 750px uses the Mobile design, which scales up to 1.3× and then stops growing.
// 1 design px = var(--wh-u) = window width / design width (container query units on .wh-window).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(here, 'tokens.json'), 'utf8'));
const DESKTOP = { mode: 'Desktop', width: 1464 }, MOBILE = { mode: 'Mobile', width: 390, maxScale: 1.3 }, SWITCH = 750;

const val = (v) => {
  if (v && typeof v === 'object' && v.ref) return `var(${v.ref})`;
  if (typeof v === 'number') return v === 0 ? '0px' : `calc(${v} * var(--wh-u))`;
  return v;
};
const FLOOR = { 'font-size/body': [13, 11], 'font-size/small': [11, 11] };   // [desktop, mobile] minimum px
const decl = (vars, i, pad = '  ', floorIdx = null) => vars
  .filter(v => v.type !== 'BOOLEAN' && v.css.startsWith('--') && v.name !== 'layout/window-width')
  .map(v => {
    let x = val(v.vals[i]);
    if (v.type === 'STRING') x = `"${x}", system-ui, sans-serif`;
    if (floorIdx !== null && FLOOR[v.name]) x = `max(${x}, ${FLOOR[v.name][floorIdx]}px)`;
    return `${pad}${v.css}: ${x};`;
  }).join('\n');
const P = data.Primitives, C = data.Color, R = data.Responsive;
const pText = P.vars.filter(v => v.type === 'COLOR' || v.type === 'STRING');
const pSize = P.vars.filter(v => v.type === 'FLOAT');
const mi = n => R.modes.indexOf(n);

// Text styles come straight from the Figma text styles (_tools/text-styles.json) — the design team authors them.
const ts = JSON.parse(fs.readFileSync(path.join(here, 'text-styles.json'), 'utf8')).styles;
const WEIGHT = { Thin: 100, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, Black: 900 };
const CLASS = { 'H1': '.wh-h1', 'H2': '.wh-h2', 'H3': '.wh-h3', 'H4': '.wh-h4', 'H5': '.wh-h5', 'P1': '.wh-p1', 'P1 Bold': '.wh-p1-bold', 'P2': '.wh-p2, .wh-p3' };
const textStyles = '/* Text styles — generated from the Figma text styles */\n' + ts.map(t => {
  const fam = t.family === 'NB Architekt' ? 'var(--wh-font-heading)' : 'var(--wh-font-body)';
  const sel = CLASS[t.name] || '.wh-' + t.name.toLowerCase().replace(/\s+/g, '-');
  return `${sel} { font-family: ${fam}; font-weight: ${WEIGHT[t.style] ?? 400}; font-size: ${typeof t.size === 'number' ? `calc(${t.size} * var(--wh-u))` : `var(--wh-${t.size.replace(/\//g, '-')})`}; line-height: ${t.lineHeight === 'AUTO' ? 'normal' : +(t.lineHeight / 100).toFixed(3)}; letter-spacing: ${t.letterSpacing ? (t.letterSpacing / 100) + 'em' : '0'};${t.case === 'UPPER' ? ' text-transform: uppercase;' : ''} }`;
}).join('\n');

const css = `/* wh-tokens.css — GENERATED from Figma variables (WH-Website-Component) by _tools/gen-tokens.mjs. Do not edit by hand. */
/* Scaled layout: Desktop designed at ${DESKTOP.width}px, Mobile at ${MOBILE.width}px, switch at a ${SWITCH}px window.
   Everything is sized in design pixels × --wh-u, so the whole page scales with the window width. */

:root {
${decl(pText, 0)}
}

/* The page window is the container every section measures. */
.wh-window { container: wh-window / inline-size; }

/* Colour modes — put on a section (default Light). */
.wh-scheme-light, .wh-window {
${decl(C.vars, C.modes.indexOf('Light'))}
}
.wh-scheme-dark {
${decl(C.vars, C.modes.indexOf('Dark'))}
}

/* Desktop design (Figma mode: ${DESKTOP.mode}) */
.wh-page {
  --wh-u: calc(100cqw / ${DESKTOP.width});
${decl(pSize, 0)}
${decl(R.vars, mi(DESKTOP.mode), '  ', 0)}
}

/* Mobile design (Figma mode: ${MOBILE.mode}) */
@container wh-window (max-width: ${SWITCH - 1}px) {
  .wh-page {
    --wh-u: min(calc(100cqw / ${MOBILE.width}), ${MOBILE.maxScale}px); /* Mobile stops growing at ${MOBILE.maxScale}× (≈${Math.round(MOBILE.width * MOBILE.maxScale)}px window) */
${decl(R.vars, mi(MOBILE.mode), '    ', 1)}
  }
}

${textStyles}
`;
const out = path.join(here, '..', 'assets', 'wh-tokens.css');
fs.writeFileSync(out, css);
console.log('wrote', path.relative(process.cwd(), out), '| variables:', P.vars.length + C.vars.length + R.vars.length);
