// Merkez Yetkili Servisi — sayfa şablonları, il+marka / ilçe+marka kabuk sayfaları ve sitemap üreticisi.
//
// Kullanım (depo kökünden):
//   node tools/build-pages.mjs --check            # yalnız doğrula (mevcut statik Bosch sayfalarıyla birebir karşılaştırır)
//   node tools/build-pages.mjs --check --diff=<slug>  # tek sayfanın ilk farkını göster
//   node tools/build-pages.mjs --write            # şablonları, eksik kabuk sayfaları ve sitemap dosyalarını yazar
//
// Mevcut tam statik sayfalara dokunulmaz; yalnızca eksik URL'ler için hafif kabuk sayfa üretilir.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PR = require(path.join(ROOT, 'assets', 'page-render.js'));
const ORIGIN = PR.ORIGIN_PATH;
const WRITE = process.argv.includes('--write');
const DIFF = (process.argv.find(a => a.startsWith('--diff=')) || '').slice(7);

// ---- servis-data.js / districts-full.js verisini sanal pencerede yükle ----
const store = {};
const win = {
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
  location: { href: 'https://x/', pathname: '/', search: '', hash: '', protocol: 'https:', origin: 'https://x' },
  navigator: { userAgent: 'node', language: 'tr' }, BroadcastChannel: undefined, fetch: undefined,
  setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {}, Date, JSON, Math
};
win.window = win; win.self = win;
win.document = { querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, addEventListener() {}, readyState: 'loading', documentElement: { setAttribute() {}, getAttribute: () => null }, createElement: () => ({ style: {}, setAttribute() {} }), body: { appendChild() {} }, head: { appendChild() {} }, title: '', cookie: '', referrer: '' };
const ctx = vm.createContext(win);
for (const f of ['servis-data.js', 'districts-full.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8'), ctx, { filename: f });
}
const MS = win.MerkezServis;
const FULL = win.MS_FULL_DISTRICTS;
const slugify = win.MS_SLUG_TR || MS.slugifyTr;
const provs = MS.ALL_81_PROVINCES;
const brands = MS.getAllBrands();
if (provs.length !== 81 || brands.length !== 38) throw new Error(`Beklenmeyen veri: il=${provs.length} marka=${brands.length}`);
const bosch = brands.find(x => x.slug === 'bosch');

const readPage = d => fs.readFileSync(path.join(ROOT, d, 'index.html'), 'utf8');
const exists = d => fs.existsSync(path.join(ROOT, d, 'index.html'));
const bodyOf = t => {
  const a = t.indexOf('<div id="studioBarHost"></div>') + '<div id="studioBarHost"></div>'.length;
  return t.slice(a, t.indexOf('<div id="floatingDockHost">'));
};

// ---- Şablonları mevcut Adana/Bosch sayfalarından belirteçlerle üret ----
function makeTemplate(kind) {
  const src = kind === 'ilce' ? 'adana-ceyhan-bosch-servisi' : 'adana-bosch-servisi';
  let b = bodyOf(readPage(src));
  b = b.replace(/(<select class="lp-input"[^>]*aria-label="İlçe Seçin"[^>]*>)[\s\S]*?(<\/select>)/, '$1{{DIST_OPTIONS}}$2');
  b = b.replace(/(<div class="district-pills-wrap"[^>]*>\s*)[\s\S]*?(\s*<\/div>)/, '$1{{PILLS}}$2');
  b = b.replace(/(<div class="ilce-grid">)[\s\S]*?(<\/div>)/, '$1{{ILCE_GRID}}$2');
  const k = b.indexOf('<footer');
  let m = b.slice(0, k); const f = b.slice(k);
  if (kind === 'ilce') {
    m = m.split('adana-ceyhan-bosch-servisi').join('{{SLUG}}')
      .split('Adana Ceyhan genelinde').join('{{LOC}}{{LEADLIST}} genelinde')
      .split('Adana Ceyhan').join('{{LOC}}');
  } else {
    m = m.split('adana-bosch-servisi').join('{{SLUG}}')
      .replace(/Adana \([^)]*\) genelinde/, '{{LOC}}{{LEADLIST}} genelinde');
  }
  m = m.split('adana-yetkili-servisi').join('{{PROVSLUG}}-yetkili-servisi')
    .split('adana-bosch-servisi').join('{{PROVSLUG}}-{{BRANDSLUG}}-servisi')
    .split('Adana').join('{{PROV}}')
    .split('Bosch').join('{{BRAND}}')
    .split('(15 İlçe)').join('({{NDIST}} İlçe)')
    .replace(/\b6 Gezici/g, '{{VANS}} Gezici').replace(/\b6 gezici/g, '{{VANS}} gezici')
    .replace('Müsait · Ort. 30 Dk', 'Müsait · Ort. {{ETA}} Dk')
    .replace('<strong class="tnum">30 Dk</strong>', '<strong class="tnum">{{ETA}} Dk</strong>')
    .replace(/\b30 dakika/g, '{{ETA}} dakika');
  const leftovers = m.match(/Ceyhan|Çukurova|adana|Adana|Bosch/g);
  if (leftovers) throw new Error(`Şablon (${kind}) içinde belirteç dışı metin: ` + [...new Set(leftovers)].join(','));
  return m + f;
}
const TPL = { ilce: makeTemplate('ilce'), il: makeTemplate('il') };

const ctxFor = (prov, distName, brand) => ({
  prov, brand, slugify,
  dist: distName ? { name: distName, slug: slugify(distName) } : null,
  allDists: (FULL[prov.slug] || []).map(n => ({ name: n, slug: slugify(n) }))
});

// ---- Doğrulama: mevcut Bosch sayfalarıyla birebir karşılaştır ----
function verify(kind) {
  let checked = 0, bodyDiff = 0, headDiff = 0, missing = 0; const samples = [];
  const cases = kind === 'ilce' ? provs.flatMap(p => (FULL[p.slug] || []).map(dn => [p, dn])) : provs.map(p => [p, null]);
  for (const [p, dn] of cases) {
    const c = ctxFor(p, dn, bosch); const meta = PR.build(c); const dir = meta.pageSlug;
    if (!exists(dir)) { missing++; continue; }
    const t = readPage(dir); checked++;
    const rendered = PR.render(TPL[kind], c);
    if (DIFF === dir) {
      const a = bodyOf(t); let i = 0; while (a[i] === rendered[i]) i++;
      console.log('ilk fark:', i, '\nMEVCUT  :', JSON.stringify(a.slice(Math.max(0, i - 80), i + 220)), '\nÜRETİLEN:', JSON.stringify(rendered.slice(Math.max(0, i - 80), i + 220)));
    }
    if (bodyOf(t) !== rendered) { bodyDiff++; if (samples.length < 4) samples.push(['body', dir]); }
    const title = (t.match(/<title>([^<]*)<\/title>/) || [])[1];
    const desc = (t.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const ok = (a, b) => a === b || a === b.replace(/&/g, '&amp;');
    if (!ok(title, meta.title)) { headDiff++; if (samples.length < 6) samples.push(['title', dir, title, meta.title]); }
    else if (!ok(desc, meta.desc)) { headDiff++; if (samples.length < 6) samples.push(['desc', dir, desc, meta.desc]); }
  }
  console.log(`Doğrulama [${kind}]: ${checked} mevcut Bosch sayfası, gövde farkı=${bodyDiff}, head farkı=${headDiff}, dosyası olmayan=${missing}`);
  if (samples.length) console.log(JSON.stringify(samples, null, 1));
  return bodyDiff + headDiff;
}
if (verify('ilce') + verify('il')) { console.error('Şablon mevcut sayfalarla birebir eşleşmiyor; yazma iptal.'); process.exit(2); }
if (!WRITE) process.exit(0);

// ---- Yazma ----
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
fs.writeFileSync(path.join(ROOT, 'assets', 'page-template-ilce.html'), TPL.ilce);
fs.writeFileSync(path.join(ROOT, 'assets', 'page-template-il.html'), TPL.il);
const legacy = path.join(ROOT, 'assets', 'page-template.html');
if (fs.existsSync(legacy)) fs.unlinkSync(legacy);

const headFor = (c, meta) => {
  const kind = c.dist ? 'ilce' : 'il';
  const ld = { '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', name: meta.h1 + ' - 0850 380 02 02', description: meta.desc, url: meta.url, telephone: '+90-850-380-0202', priceRange: '₺₺', openingHours: 'Mo-Su 00:00-23:59', areaServed: meta.loc + ', Türkiye', address: { '@type': 'PostalAddress', addressLocality: meta.loc, addressCountry: 'TR' } };
  return `<!doctype html>
<html lang="tr" data-default-palette="royal-blue" data-page-depth="../" data-page-kind="${kind}" data-prov-slug="${c.prov.slug}" data-dist-slug="${c.dist ? c.dist.slug : ''}" data-brand-slug="${c.brand.slug}" data-service-slug="" data-page-shell="true">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.desc)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${meta.url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.desc)}">
  <meta property="og:url" content="${meta.url}">
  <link rel="preload" href="../assets/page-template-${kind}.html" as="fetch" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/studio-ui.css">
  <link rel="stylesheet" href="../assets/landing-page.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <div id="studioBarHost"></div>
  <div id="lpShellRoot">
    <main class="container-xl" style="padding:2rem 1rem;">
      <h1 id="lpHeroH1">${esc(meta.h1)} — Aynı Gün Yerinde 1 Yıl Garantili Onarım</h1>
      <p class="lp-lead" id="lpHeroLead">${esc(meta.desc)}</p>
      <p><a data-servis-tel href="tel:08503800202" style="font-weight:800;">Tıkla Ara: <span data-servis-phone>0850 380 02 02</span></a></p>
      <noscript><p>Bu sayfanın tüm içeriği için JavaScript gereklidir. <a href="../${c.prov.slug}-yetkili-servisi/">${esc(c.prov.name)} Yetkili Servisi</a> sayfasına gidebilirsiniz.</p></noscript>
    </main>
  </div>
  <div id="floatingDockHost"></div>
  <script src="../assets/servis-data.js"></script>
  <script src="../assets/districts-full.js"></script>
  <script src="../assets/page-render.js"></script>
  <script src="../assets/landing-page.js"></script>
</body>
</html>
`;
};

let written = 0, kept = 0; const urls = [];
function emit(c) {
  const meta = PR.build(c); urls.push(meta.url);
  if (exists(meta.pageSlug) && !readPage(meta.pageSlug).includes('data-page-shell="true"')) { kept++; return; }
  fs.mkdirSync(path.join(ROOT, meta.pageSlug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, meta.pageSlug, 'index.html'), headFor(c, meta));
  written++;
}
for (const p of provs) {
  for (const b of brands) emit(ctxFor(p, null, b));
  for (const dn of FULL[p.slug] || []) for (const b of brands) emit(ctxFor(p, dn, b));
}
console.log(`Kabuk sayfa (yeni/yenilenen): ${written}, tam statik sayfa (dokunulmadı): ${kept}`);

// ---- Sitemap: mevcut içerik + üretilen URL'ler; 10.000'lik parçalara bölünmüş dizin ----
const oldLocs = [];
for (const f of fs.readdirSync(ROOT).filter(n => /^sitemap(-\d+)?\.xml$/.test(n))) {
  for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/<url><loc>([^<]+)<\/loc>/g)) oldLocs.push(m[1]);
  for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)) oldLocs.push(m[1]);
}
const all = [...new Set([...oldLocs.filter(u => u.startsWith(ORIGIN)), ...urls])];
const today = new Date().toISOString().slice(0, 10);
const CH = 10000; const parts = [];
for (const f of fs.readdirSync(ROOT).filter(n => /^sitemap-\d+\.xml$/.test(n))) fs.unlinkSync(path.join(ROOT, f));
for (let i = 0; i < all.length; i += CH) {
  const name = `sitemap-${parts.length + 1}.xml`; parts.push(name);
  const body = all.slice(i, i + CH).map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  fs.writeFileSync(path.join(ROOT, name), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts.map(n => `  <sitemap><loc>${ORIGIN}${n}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);
console.log(`Sitemap: toplam ${all.length} URL, ${parts.length} parça + dizin.`);
