// Reproducible media embed for IOR-Product-Training.html
// Inlines the IOR logo + favicon and base64-embeds matched product photos.
// Idempotent: re-run any time to refresh media. Run: node build/embed-media.mjs
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.join(import.meta.dirname, '..'));
const HTML = path.join(ROOT, 'IOR-Product-Training.html');
const IMG_DIR = 'C:/dev/ior_website/scripts/data/images';
const BRAND_DIR = 'C:/dev/ior_website/public/images/brand';

const MIME = { '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const dataUri = (file) => {
  const ext = path.extname(file).toLowerCase();
  const b64 = fs.readFileSync(file).toString('base64');
  return `data:${MIME[ext]||'application/octet-stream'};base64,${b64}`;
};

// Manual overrides where filename != product model: [brandSlug, nameSubstring(lowercased), stem]
const OVERRIDES = [
  ['toshiba','bv420d','toshiba-bv400d-series'],
  ['toshiba','bv400','toshiba-bv400d-series'],
];

let html = fs.readFileSync(HTML, 'utf8');

// --- 1. Extract DATA object from the HTML ---
const m = html.match(/const DATA = \{[\s\S]*?\n\]\};/);
if (!m) throw new Error('DATA block not found');
const DATA = (new Function(m[0] + '\nreturn DATA;'))();

// --- 2. Index available images by brand-prefixed stem ---
const files = fs.readdirSync(IMG_DIR).filter(f => MIME[path.extname(f).toLowerCase()]);
const stems = files.map(f => ({ stem: f.slice(0, -path.extname(f).length), file: path.join(IMG_DIR, f) }));

// --- 3. Match each product to an image ---
const PIMG = {}; const used = new Set(); const report = [];
for (const b of DATA.brands) {
  const bs = b.slug;
  const candidates = stems.filter(s => s.stem.startsWith(bs + '-'));
  for (const p of (b.products || [])) {
    const np = norm(p.name);
    let hit = null;
    // overrides first
    for (const [obs, sub, stem] of OVERRIDES) {
      if (obs === bs && np.includes(norm(sub))) { hit = candidates.find(c => c.stem === stem) || stems.find(c => c.stem === stem); break; }
    }
    // longest matching model-part wins
    if (!hit) {
      let best = null, bestLen = 0;
      for (const c of candidates) {
        const mp = norm(c.stem.slice(bs.length + 1));
        if (mp.length >= 4 && np.includes(mp) && mp.length > bestLen) { best = c; bestLen = mp.length; }
      }
      hit = best;
    }
    if (hit) {
      (PIMG[bs] = PIMG[bs] || {})[p.name] = hit.stem;
      used.add(hit.stem);
      report.push(`  ✓ ${bs.padEnd(10)} ${p.name.slice(0,32).padEnd(34)} → ${hit.stem}`);
    } else {
      report.push(`  · ${bs.padEnd(10)} ${p.name.slice(0,32).padEnd(34)} → (no image)`);
    }
  }
}

// --- 4. Build IMG map (only used stems) ---
const IMG = {};
for (const s of stems) if (used.has(s.stem)) IMG[s.stem] = dataUri(s.file);

// --- 5. Inline logo (white horizontal) + favicon (mark) ---
const logoSvg = fs.readFileSync(path.join(BRAND_DIR, 'logo-horizontal-white.svg'), 'utf8').replace(/<\?xml[^>]*\?>/,'').trim();
const faviconUri = dataUri(path.join(BRAND_DIR, 'logo-mark.svg'));

html = html.replace(/(<div class="logo-lockup">)[\s\S]*?(<\/div>)/, (mm, g1, g2) => g1 + logoSvg + g2);
if (html.includes('<!--FAVICON-->')) html = html.replace(/<link rel="icon"[\s\S]*?<!--FAVICON-->/, () => `<link rel="icon" href="${faviconUri}">`);
else html = html.replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" href="${faviconUri}">`);
html = html.replace(/\/\*IMG_START\*\/[\s\S]*?\/\*IMG_END\*\//, () => `/*IMG_START*/ var IMG=${JSON.stringify(IMG)}; var PIMG=${JSON.stringify(PIMG)}; /*IMG_END*/`);

fs.writeFileSync(HTML, html);

// --- 6. Report ---
console.log(report.join('\n'));
console.log(`\nMatched ${used.size} images across ${Object.keys(PIMG).length} brands.`);
console.log(`Logo inlined: ${logoSvg.length} chars. Favicon: ${faviconUri.length} chars.`);
console.log(`Final HTML size: ${(fs.statSync(HTML).size/1024/1024).toFixed(2)} MB`);
