// WCAG contrast check for the design tokens in src/app/globals.css (light + night).
// Usage: node scripts/check-contrast.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf("\n}", start);
  return css.slice(start, end);
}

function tokens(selector) {
  const out = {};
  for (const m of block(selector).matchAll(/--g-([a-z0-9-]+):\s*oklch\(([^)]+)\)/g)) {
    const [l, c, h] = m[2].split(/\s+/).map(Number);
    out[m[1]] = { l, c, h };
  }
  return out;
}

function toLinear({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const [L, M, S] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const rgb = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  return rgb.map((v) => Math.min(1, Math.max(0, v)));
}

const lum = (c) => {
  const [r, g, b] = toLinear(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export function hex(c) {
  return (
    "#" +
    toLinear(c)
      .map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
      .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

const root = tokens(":root");
const themes = { light: root, night: { ...root, ...tokens(".night") } };

const HUES = ["rose", "sky", "lilac", "sun", "sage", "peach"];
const pairs = [
  // [foreground, background, min ratio, note]
  ["ink", "bg", 4.5],
  ["ink", "panel", 4.5],
  ["ink", "panel2", 4.5],
  ["sub", "bg", 4.5],
  ["sub", "panel", 4.5],
  ["faint", "bg", 3],
  ["faint", "panel", 3],
  ["prim", "bg", 4.5],
  ["prim", "panel", 4.5],
  ["prim", "prim-soft", 4.5],
  ["on-prim", "prim", 4.5],
  ["clay", "bg", 4.5],
  ["clay", "panel", 4.5],
  ["clay", "clay-soft", 4.5],
  ["honey", "bg", 3],
  ["honey", "honey-soft", 3],
  ...HUES.map((h) => ["ink", `t-${h}`, 4.5]),
  ...HUES.map((h) => ["sub", `t-${h}`, 4.5]),
];

let failures = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [fg, bg, min] of pairs) {
    if (!t[fg] || !t[bg]) continue;
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`${ok ? "ok  " : "FAIL"} ${fg.padEnd(8)} on ${bg.padEnd(10)} ${r.toFixed(2)} (min ${min})`);
  }
}

console.log(`\nbg: light ${hex(themes.light.bg)}, night ${hex(themes.night.bg)}`);
console.log(failures ? `\n${failures} failing pair(s)` : "\nall pairs pass");
process.exitCode = failures ? 1 : 0;
