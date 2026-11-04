/*
 * Merkez Yetkili Servisi — il / ilçe / marka sayfa üreticisi (tarayıcı + Node ortak modül).
 *
 * Amaç: 973 ilçe x 38 marka = 36.974 sayfanın her birini 45 KB'lık tam HTML olarak diske yazmak yerine,
 * her URL için kendi <head> (title, description, canonical, JSON-LD) taşıyan hafif bir "kabuk" sayfa
 * yayınlamak; gövde tek bir önbelleğe alınan şablondan (assets/page-template.html) üretilir.
 * Böylece her URL HTTP 200 döner, Google ayrı sayfa olarak indeksleyebilir ve depo boyutu makul kalır.
 *
 * Aynı render() fonksiyonu Node tarafında (tools/build-pages.mjs) mevcut statik sayfalarla
 * birebir karşılaştırılarak doğrulanır.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PageRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ORIGIN_PATH = 'https://ocakciomursel-pixel.github.io/merkez-servis-vitrin/';

  function pillList(prov, distName) {
    // Sayfadaki "İlçe" etiketleri: ilin öne çıkan (derlenmiş) tüm ilçe/bölge adları (mevcut statik sayfalarla aynı kural).
    return (prov.districts || []).slice();
  }

  function build(c) {
    // c = { prov:{slug,name,eta,activeVans,districts}, dist:{name,slug}|null, brand:{slug,name},
    //       allDists:[{name,slug}], slugify:fn }
    var prov = c.prov, dist = c.dist, brand = c.brand;
    var loc = prov.name + (dist ? ' ' + dist.name : '');
    var pageSlug = prov.slug + '-' + (dist ? dist.slug + '-' : '') + brand.slug + '-servisi';
    var h1 = loc + ' ' + brand.name + ' Yetkili Servisi';
    var title = h1 + ' | 0850 380 02 02 (' + prov.eta + ' Dk Yerinde Onarım)';
    var topList = (prov.districts || []).slice(0, 5);
    var desc = loc + ' ' + brand.name + ' Yetkili Servisi: ' + topList.join(', ') +
      ' ve tüm ilçelerde ortalama ' + prov.eta + ' dakikada yerinde arıza tespiti, 1 yıl garantili onarım. Hemen Ara: 0850 380 02 02.';
    return { loc: loc, pageSlug: pageSlug, h1: h1, title: title, desc: desc, url: ORIGIN_PATH + pageSlug + '/' };
  }

  function render(tpl, c) {
    var prov = c.prov, dist = c.dist, brand = c.brand;
    var meta = build(c);
    var all = c.allDists || [];
    var base = prov.slug + '-';
    var tail = '-' + brand.slug + '-servisi';

    var options = '<option value="">İlçe Seçin (' + all.length + ')</option>' + all.map(function (d) {
      var s = base + d.slug + tail;
      return '<option value="' + s + '"' + (dist && d.slug === dist.slug ? ' selected' : '') + '>' + d.name + '</option>';
    }).join('');

    var realNames = {};
    all.forEach(function (d) { realNames[d.name] = true; });
    var pills = pillList(prov, dist && dist.name).map(function (n) {
      var label = '📍 ' + n + ' ' + brand.name + ' Yetkili Servisi';
      // Gerçek ilçe değilse (mahalle/bölge adı) bağlantı verilmez; yalnızca etiket olarak gösterilir.
      if (!realNames[n]) return '<span class="district-pill">' + label + '</span>';
      return '<a class="district-pill" href="../' + base + c.slugify(n) + tail + '/">' + label + '</a>';
    }).join('');

    var grid = all.map(function (d) {
      var s = base + d.slug + tail;
      var cur = dist && d.slug === dist.slug ? ' class="is-current" aria-current="page"' : '';
      return '<a href="../' + s + '/"' + cur + '>' + d.name + ' ' + brand.name + ' Servisi</a>';
    }).join('');

    var map = {
      '{{LOC}}': meta.loc,
      // Çok az öne çıkan bölgesi olan illerde (ör. Malatya) giriş cümlesinde bölgeler parantez içinde listelenir.
      '{{LEADLIST}}': dist
        ? ((prov.districts || []).length < 3 ? ' (' + prov.districts.join(', ') + ')' : '')
        : ((prov.districts || []).length ? ' (' + prov.districts.slice(0, 6).join(', ') + ')' : ''),
      '{{PROV}}': prov.name,
      '{{PROVSLUG}}': prov.slug,
      '{{BRAND}}': brand.name,
      '{{BRANDSLUG}}': brand.slug,
      '{{SLUG}}': meta.pageSlug,
      '{{ETA}}': String(prov.eta),
      '{{VANS}}': String(prov.activeVans),
      '{{NDIST}}': String(all.length),
      '{{DIST_OPTIONS}}': options,
      '{{PILLS}}': pills,
      '{{ILCE_GRID}}': grid
    };
    return tpl.replace(/\{\{[A-Z_]+\}\}/g, function (k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : k; });
  }

  return { render: render, build: build, pillList: pillList, ORIGIN_PATH: ORIGIN_PATH };
});
