/*
 * Yönetim paneli — gelişmiş modüller
 *   1) Raporlar & Dönüşüm      (pane-reports)
 *   2) SEO & URL Sağlığı       (pane-seohealth)
 *   3) Sistem, Yedek & Güvenlik (pane-system)
 * Mevcut panel betiğinden sonra yüklenir; yalnızca window.MerkezServis API'sini kullanır.
 */
(function () {
  'use strict';
  var MS = window.MerkezServis;
  if (!MS) return;

  // ---------- Ortak yardımcılar ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var nf = new Intl.NumberFormat('tr-TR');
  function tl(n) { return nf.format(Math.round(Number(n) || 0)) + ' ₺'; }
  function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }
  function safeJson(raw, fb) { try { return raw ? JSON.parse(raw) : fb; } catch (e) { return fb; } }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* yok say */ } }

  function downloadText(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    // Excel formül enjeksiyonuna karşı: =, +, -, @ ile başlayan hücreleri etkisizleştir
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function toCsv(rows) { return '﻿' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n'); }
  function stamp() { return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); }

  function bars(entries, opts) {
    opts = opts || {};
    if (!entries.length) return '<div class="pp-empty">Henüz veri yok.</div>';
    var max = Math.max.apply(null, entries.map(function (e) { return e[1]; })) || 1;
    return entries.map(function (e) {
      var w = Math.max(2, Math.round((e[1] / max) * 100));
      var cls = (opts.cls && opts.cls(e)) || '';
      return '<div class="pp-bar-row"><span class="lbl" title="' + esc(e[0]) + '">' + esc(e[0]) + '</span>' +
        '<div class="pp-bar-track"><div class="pp-bar-fill ' + cls + '" style="width:' + w + '%"></div></div>' +
        '<span class="val">' + esc(opts.fmt ? opts.fmt(e[1]) : e[1]) + '</span></div>';
    }).join('');
  }
  function groupBy(list, keyFn, valFn) {
    var m = {};
    list.forEach(function (x) { var k = keyFn(x) || 'Belirsiz'; m[k] = (m[k] || 0) + (valFn ? valFn(x) : 1); });
    return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  }
  function kpi(label, value, sub, cls) {
    return '<div class="pp-kpi ' + (cls || '') + '"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong><small>' + esc(sub || '') + '</small></div>';
  }
  function chip(text, cls) { return '<span class="pp-chip ' + (cls || '') + '">' + esc(text) + '</span>'; }

  // ---------- İşlem günlüğü (audit) ----------
  var AUDIT_KEY = 'merkez_admin_audit_v1';
  function auditList() { var l = safeJson(lsGet(AUDIT_KEY), []); return Array.isArray(l) ? l : []; }
  function audit(action, detail) {
    var l = auditList();
    l.unshift({ t: new Date().toISOString(), a: action, d: String(detail || '').slice(0, 160) });
    lsSet(AUDIT_KEY, JSON.stringify(l.slice(0, 300)));
    var box = $('#ppAuditLog');
    if (box) renderAudit();
  }
  var AUDIT_LABELS = {
    saveConfig: 'Ayar kaydedildi', updateLeadStatus: 'İş emri durumu değişti', updateLead: 'İş emri güncellendi', addLead: 'İş emri eklendi',
    removeLead: 'İş emri silindi', addTechnician: 'Usta eklendi', updateTechnician: 'Usta güncellendi', removeTechnician: 'Usta silindi',
    addReview: 'Yorum eklendi', removeReview: 'Yorum silindi', addFaq: 'SSS eklendi', removeFaq: 'SSS silindi', addCustomBrand: 'Marka eklendi',
    toggleBrandActive: 'Marka durumu değişti', addFault: 'Arıza kodu eklendi', removeFault: 'Arıza kodu silindi', resetAllData: 'Tüm veriler sıfırlandı'
  };
  function summarize(name, args) {
    var a = args[0];
    if (name === 'saveConfig') return a && typeof a === 'object' ? Object.keys(a).join(', ') : '';
    if (typeof a === 'string' || typeof a === 'number') return String(a) + (typeof args[1] === 'string' ? ' → ' + args[1] : '');
    if (a && typeof a === 'object') return a.id || a.name || a.customer || a.title || a.q || '';
    return '';
  }
  Object.keys(AUDIT_LABELS).forEach(function (name) {
    var orig = MS[name];
    if (typeof orig !== 'function') return;
    MS[name] = function () {
      var r = orig.apply(this, arguments);
      try { audit(AUDIT_LABELS[name], summarize(name, arguments)); } catch (e) { /* günlük hatası paneli bozmasın */ }
      return r;
    };
  });

  // =====================================================================
  // 1) RAPORLAR & DÖNÜŞÜM
  // =====================================================================
  var STATUS_LABEL = { pending: 'Bekleyen', assigned: 'Atandı', onway: 'Yolda', completed: 'Tamamlandı' };

  function renderReports() {
    var root = $('#ppReports');
    if (!root) return;
    var leads = MS.getLeads(), visitors = MS.getVisitors(), techs = MS.getTechnicians();
    var real = visitors.filter(function (v) { return !v.isSeed; });
    var gross = leads.reduce(function (s, l) { return s + (Number(l.feeTl) || 0); }, 0);
    var center = leads.reduce(function (s, l) { return s + (Number(l.commissionTl) || 0); }, 0);
    var done = leads.filter(function (l) { return l.status === 'completed'; });
    var pending = leads.filter(function (l) { return l.status === 'pending'; });
    var unassigned = leads.filter(function (l) { return !l.tech || /bekliyor/i.test(l.tech); });
    var calls = visitors.filter(function (v) { return v.convertedCall; });
    var fraud = visitors.filter(function (v) { return v.suspectedFraud; });
    var avgDwell = visitors.length ? Math.round(visitors.reduce(function (s, v) { return s + (Number(v.durationSec) || 0); }, 0) / visitors.length) : 0;
    var avgTicket = done.length ? gross / Math.max(1, leads.filter(function (l) { return Number(l.feeTl) > 0; }).length) : 0;

    var kpis = [
      kpi('Toplam İş Emri', leads.length, done.length + ' tamamlandı · ' + pending.length + ' bekliyor', pending.length ? 'warn' : ''),
      kpi('Tamamlanma Oranı', '%' + pct(done.length, leads.length), 'İş emirlerinin kapanma oranı', pct(done.length, leads.length) >= 60 ? 'good' : ''),
      kpi('Brüt Ciro', tl(gross), 'Ortalama fiş: ' + tl(avgTicket)),
      kpi('Merkez Komisyonu', tl(center), 'Brüt cironun %' + pct(center, gross)),
      kpi('Ziyaretçi → Arama', '%' + pct(calls.length, visitors.length), calls.length + ' arama / ' + visitors.length + ' oturum', pct(calls.length, visitors.length) >= 25 ? 'good' : ''),
      kpi('Ort. Sitede Kalış', Math.floor(avgDwell / 60) + ' dk ' + (avgDwell % 60) + ' sn', real.length + ' gerçek · ' + (visitors.length - real.length) + ' örnek oturum'),
      kpi('Atanmamış İş', unassigned.length, 'Usta ataması bekleyen kayıt', unassigned.length ? 'bad' : 'good'),
      kpi('Şüpheli Tıklama', fraud.length, 'Tekrarlı IP / cihaz izi', fraud.length ? 'warn' : 'good')
    ].join('');

    var funnel = ['pending', 'assigned', 'onway', 'completed'].map(function (s) {
      return [STATUS_LABEL[s], leads.filter(function (l) { return l.status === s; }).length];
    });
    var byCity = groupBy(leads, function (l) { return String(l.city || '').split('/')[0].trim(); }).slice(0, 8);
    var byBrand = groupBy(leads, function (l) { return l.brand; }).slice(0, 8);
    var bySource = groupBy(leads, function (l) { return l.source; }).slice(0, 6);
    var revenueBrand = groupBy(leads, function (l) { return l.brand; }, function (l) { return Number(l.feeTl) || 0; }).slice(0, 6);

    var techRows = techs.map(function (t) {
      var own = leads.filter(function (l) { return l.tech === t.name; });
      var g = own.reduce(function (s, l) { return s + (Number(l.feeTl) || 0); }, 0);
      var c = own.reduce(function (s, l) { return s + (Number(l.commissionTl) || 0); }, 0);
      return { t: t, n: own.length, gross: g, center: c, share: Math.max(0, g - c) };
    }).sort(function (a, b) { return b.gross - a.gross; });
    var techTable = '<div class="table-scroll"><table><thead><tr><th>Usta</th><th>Bölge</th><th>Durum</th><th>İş</th><th>Brüt</th><th>Usta Payı</th><th>Merkez</th></tr></thead><tbody>' +
      (techRows.map(function (r) {
        return '<tr><td><strong>' + esc(r.t.name) + '</strong></td><td>' + esc(r.t.region) + '</td><td>' + chip(r.t.status === 'available' ? 'Müsait' : r.t.status === 'busy' ? 'Sahada' : 'Pasif', r.t.status === 'available' ? 'ok' : r.t.status === 'busy' ? 'warn' : '') +
          '</td><td>' + r.n + '</td><td>' + tl(r.gross) + '</td><td>' + tl(r.share) + '</td><td>' + tl(r.center) + '</td></tr>';
      }).join('') || '<tr><td colspan="7" class="pp-empty">Usta kaydı yok.</td></tr>') + '</tbody></table></div>';

    var devices = groupBy(visitors, function (v) { return v.deviceType === 'mobile' ? 'Mobil' : v.deviceType === 'tablet' ? 'Tablet' : 'Masaüstü'; });
    var visSrc = groupBy(visitors, function (v) { return String(v.source || 'Doğrudan').replace(/\(.*$/, '').trim(); }).slice(0, 6);
    var pageMap = {};
    visitors.forEach(function (v) { (v.pages || []).forEach(function (p) { var k = p.title || p.path; pageMap[k] = (pageMap[k] || 0) + 1; }); });
    var topPages = Object.keys(pageMap).map(function (k) { return [k, pageMap[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var cities = groupBy(visitors, function (v) { return String(v.cityHint || '').split('/')[0].trim(); }).slice(0, 6);

    root.innerHTML =
      '<div class="pp-toolbar"><span class="pp-chip">Veri kaynağı: bu tarayıcı + sunucu eşitlemesi</span><span class="grow"></span>' +
      '<button type="button" class="btn-soft" data-pp-csv="leads">İş Emirleri CSV ↓</button>' +
      '<button type="button" class="btn-soft" data-pp-csv="visitors">Ziyaretçiler CSV ↓</button>' +
      '<button type="button" class="btn-soft" data-pp-csv="techs">Usta Hakediş CSV ↓</button>' +
      '<button type="button" class="btn-primary" id="ppReportRefresh">Yenile</button></div>' +
      '<div class="pp-kpis">' + kpis + '</div>' +
      '<div class="pp-grid">' +
      '<div class="pp-card"><h3>İş Emri Hunisi</h3><p class="pp-sub">Aşama bazında kayıt sayısı</p>' + bars(funnel, { cls: function (e) { return e[0] === 'Tamamlandı' ? 'ok' : e[0] === 'Bekleyen' ? 'warn' : ''; } }) + '</div>' +
      '<div class="pp-card"><h3>İl Dağılımı</h3><p class="pp-sub">En çok iş emri gelen iller</p>' + bars(byCity) + '</div>' +
      '<div class="pp-card"><h3>Marka Dağılımı</h3><p class="pp-sub">Arıza kaydı sayısı</p>' + bars(byBrand) + '</div>' +
      '<div class="pp-card"><h3>Markaya Göre Ciro</h3><p class="pp-sub">Brüt tahsilat</p>' + bars(revenueBrand, { fmt: tl }) + '</div>' +
      '<div class="pp-card"><h3>Kanal Dağılımı</h3><p class="pp-sub">İş emri kaynağı</p>' + bars(bySource) + '</div>' +
      '<div class="pp-card"><h3>Ziyaretçi Cihazları</h3><p class="pp-sub">Telemetri oturumları</p>' + bars(devices) + '</div>' +
      '<div class="pp-card"><h3>Trafik Kaynakları</h3><p class="pp-sub">Ziyaretçi geliş kanalı</p>' + bars(visSrc) + '</div>' +
      '<div class="pp-card"><h3>En Çok Gezilen Sayfalar</h3><p class="pp-sub">Oturum izlerinden</p>' + bars(topPages) + '</div>' +
      '<div class="pp-card"><h3>Ziyaretçi Şehirleri</h3><p class="pp-sub">Konum tahmini</p>' + bars(cities) + '</div>' +
      '</div>' +
      '<div class="pp-card" style="margin-bottom:1rem"><h3>Usta Performansı & Hakediş</h3><p class="pp-sub">Atanan iş emirlerinden hesaplanır</p>' + techTable + '</div>';

    var refresh = $('#ppReportRefresh');
    if (refresh) refresh.addEventListener('click', renderReports);
    $$('[data-pp-csv]', root).forEach(function (b) { b.addEventListener('click', function () { exportCsv(b.getAttribute('data-pp-csv')); }); });
  }

  function exportCsv(kind) {
    var rows;
    if (kind === 'leads') {
      rows = [['Fiş No', 'Oluşturma', 'Kanal', 'Müşteri', 'Telefon', 'İl/İlçe', 'Marka', 'Cihaz', 'Arıza', 'Usta', 'Durum', 'Ücret ₺', 'Komisyon %', 'Komisyon ₺']]
        .concat(MS.getLeads().map(function (l) { return [l.id, l.createdAt, l.source, l.customer, l.phone, l.city, l.brand, l.device, l.fault, l.tech, STATUS_LABEL[l.status] || l.status, l.feeTl, l.commissionPct, l.commissionTl]; }));
    } else if (kind === 'visitors') {
      rows = [['Oturum', 'Cihaz', 'İşletim Sistemi', 'Kaynak', 'Konum', 'Giriş', 'Süre (sn)', 'Sayfalar', 'Aksiyonlar', 'Arama', 'Şüpheli']]
        .concat(MS.getVisitors().map(function (v) { return [v.sid, v.deviceModel, v.osBrowser, v.source, v.cityHint, (v.entryDate || '') + ' ' + (v.entryTime || ''), v.durationSec, (v.pages || []).map(function (p) { return p.title; }).join(' > '), (v.actions || []).join(' | '), v.convertedCall ? 'Evet' : 'Hayır', v.suspectedFraud ? 'Evet' : 'Hayır']; }));
    } else {
      var leads = MS.getLeads();
      rows = [['Usta', 'Bölge', 'Uzmanlık', 'Komisyon %', 'İş Adedi', 'Brüt ₺', 'Usta Payı ₺', 'Merkez ₺']].concat(MS.getTechnicians().map(function (t) {
        var own = leads.filter(function (l) { return l.tech === t.name; });
        var g = own.reduce(function (s, l) { return s + (Number(l.feeTl) || 0); }, 0);
        var c = own.reduce(function (s, l) { return s + (Number(l.commissionTl) || 0); }, 0);
        return [t.name, t.region, t.specialty, t.commissionPct, own.length, g, Math.max(0, g - c), c];
      }));
    }
    downloadText('merkez-' + kind + '-' + stamp() + '.csv', toCsv(rows), 'text/csv;charset=utf-8');
    audit('CSV dışa aktarıldı', kind + ' · ' + (rows.length - 1) + ' satır');
  }

  // =====================================================================
  // 2) SEO & URL SAĞLIĞI
  // =====================================================================
  var FULL = window.MS_FULL_DISTRICTS || {};
  var slugify = window.MS_SLUG_TR || MS.slugifyTr;
  var provs = MS.ALL_81_PROVINCES;
  var brands = MS.getAllBrands();
  var distSets = {};
  provs.forEach(function (p) { distSets[p.slug] = new Set((FULL[p.slug] || []).map(slugify)); });
  var seo = { urls: null, loading: null };

  function toSlug(loc) {
    var m = String(loc).replace(/^https?:\/\/[^/]+\//, '');
    m = m.replace(/^merkez-servis-vitrin\//, '');
    return m.replace(/\/+$/, '');
  }
  function classify(slug) {
    if (!slug) return 'home';
    var isY = /-yetkili-servisi$/.test(slug), isS = /-servisi$/.test(slug);
    if (isY) {
      var stem = slug.slice(0, -'-yetkili-servisi'.length);
      if (distSets[stem]) return 'il';
      for (var i = 0; i < provs.length; i++) {
        var p = provs[i].slug;
        if (stem.indexOf(p + '-') === 0 && distSets[p].has(stem.slice(p.length + 1))) return 'ilce';
      }
      return 'diger';
    }
    if (!isS) return 'diger';
    var st = slug.slice(0, -'-servisi'.length);
    for (var b = 0; b < brands.length; b++) {
      var bs = brands[b].slug;
      if (st === bs) return 'marka';
      if (st.slice(-bs.length - 1) === '-' + bs) {
        var rest = st.slice(0, -bs.length - 1);
        if (distSets[rest]) return 'ilmarka';
        for (var j = 0; j < provs.length; j++) {
          var pp = provs[j].slug;
          if (rest.indexOf(pp + '-') === 0 && distSets[pp].has(rest.slice(pp.length + 1))) return 'ilcemarka';
        }
      }
    }
    return 'hizmet';
  }
  function fetchText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.text().then(function (t) { return { status: r.status, text: t, ok: r.ok }; }); });
  }
  function locsOf(text) { return Array.from(text.matchAll(/<loc>([^<]+)<\/loc>/g), function (m) { return m[1]; }); }
  function loadSitemap() {
    if (seo.urls) return Promise.resolve(seo.urls);
    if (seo.loading) return seo.loading;
    seo.loading = fetchText('../sitemap.xml').then(function (r) {
      if (!r.ok) throw new Error('sitemap.xml HTTP ' + r.status);
      var locs = locsOf(r.text);
      if (r.text.indexOf('<sitemapindex') === -1) return locs;
      return Promise.all(locs.map(function (u) { return fetchText('../' + u.split('/').pop()).then(function (x) { return locsOf(x.text); }); }))
        .then(function (parts) { return [].concat.apply([], parts); });
    }).then(function (all) { seo.urls = Array.from(new Set(all)); return seo.urls; });
    seo.loading.catch(function () { seo.loading = null; });
    return seo.loading;
  }

  function fillProbeSelects() {
    var ps = $('#ppProbeProv'); if (!ps || ps.options.length) return;
    ps.innerHTML = provs.map(function (p) { return '<option value="' + p.slug + '">' + esc(p.name) + '</option>'; }).join('');
    $('#ppProbeBrand').innerHTML = '<option value="">Marka yok</option>' + brands.map(function (b) { return '<option value="' + b.slug + '">' + esc(b.name) + '</option>'; }).join('');
    ps.addEventListener('change', fillDistricts);
    fillDistricts();
  }
  function fillDistricts() {
    var p = $('#ppProbeProv').value;
    $('#ppProbeDist').innerHTML = '<option value="">İlçe yok</option>' + (FULL[p] || []).map(function (n) { return '<option value="' + slugify(n) + '">' + esc(n) + '</option>'; }).join('');
  }
  function probeSlug() {
    var p = $('#ppProbeProv').value, d = $('#ppProbeDist').value, b = $('#ppProbeBrand').value;
    if (b) return [p, d, b].filter(Boolean).join('-') + '-servisi';
    return [p, d].filter(Boolean).join('-') + '-yetkili-servisi';
  }

  function inspectPage(slug) {
    return fetchText('../' + slug + '/').then(function (r) {
      var doc = new DOMParser().parseFromString(r.text, 'text/html');
      var title = (doc.querySelector('title') || {}).textContent || '';
      var canon = (doc.querySelector('link[rel=canonical]') || {}).href || (doc.querySelector('link[rel=canonical]') && doc.querySelector('link[rel=canonical]').getAttribute('href')) || '';
      var robots = (doc.querySelector('meta[name=robots]') || { getAttribute: function () { return ''; } }).getAttribute('content') || '';
      var ld = doc.querySelectorAll('script[type="application/ld+json"]').length;
      var h1 = (doc.querySelector('h1') || {}).textContent || '';
      var issues = [];
      if (r.status !== 200) issues.push('HTTP ' + r.status);
      if (!title) issues.push('title yok'); else if (title.length > 80) issues.push('title ' + title.length + ' krk (>80)');
      if (!canon) issues.push('canonical yok'); else if (toSlug(canon) !== slug) issues.push('canonical farklı sayfaya işaret ediyor');
      if (/noindex/i.test(robots)) issues.push('noindex');
      if (!ld) issues.push('JSON-LD yok');
      if (!h1.trim()) issues.push('h1 yok');
      return { slug: slug, status: r.status, title: title, canon: canon, robots: robots, ld: ld, h1: h1, issues: issues, bytes: r.text.length };
    }).catch(function (e) { return { slug: slug, status: 0, title: '', issues: ['erişilemedi: ' + e.message], bytes: 0 }; });
  }
  function probeRow(x) {
    var okc = x.issues.length ? 'bad' : 'ok';
    return '<tr><td class="mono" style="font-size:.74rem;word-break:break-all">' + esc(x.slug) + '</td><td>' + chip(x.status || 'ERR', x.status === 200 ? 'ok' : 'bad') + '</td><td style="max-width:340px">' + esc(x.title) + '</td><td>' + (x.issues.length ? chip(x.issues.join(' · '), okc) : chip('Sorun yok', 'ok')) + '</td></tr>';
  }
  var probeHead = '<div class="table-scroll"><table><thead><tr><th>URL</th><th>HTTP</th><th>Title</th><th>Bulgu</th></tr></thead><tbody>';

  function renderSeoSkeleton() {
    var root = $('#ppSeo'); if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    root.innerHTML =
      '<div class="pp-note">Bu modül, siteyi bu panelin yayınlandığı adresten tarar. Yerel (<span class="mono">localhost</span>) ve canlı adreste ayrı ayrı çalıştırabilirsiniz.</div>' +
      '<div class="pp-card" style="margin-bottom:1rem"><h3>Sitemap Kapsamı</h3><p class="pp-sub">Sitemap içindeki URL sayısı, beklenen sayıyla karşılaştırılır.</p><div id="ppCoverage"><div class="pp-empty">Yükleniyor…</div></div></div>' +
      '<div class="pp-grid">' +
      '<div class="pp-card"><h3>Teknik SEO Kontrol Listesi</h3><p class="pp-sub">robots.txt, sitemap, 404 davranışı, yönlendirmeler</p><div id="ppChecks"><div class="pp-empty">Yükleniyor…</div></div></div>' +
      '<div class="pp-card"><h3>Tek URL Denetimi</h3><p class="pp-sub">İl / ilçe / marka seçip sayfanın başlık, canonical ve şema verisini doğrulayın.</p>' +
      '<div class="pp-toolbar"><select id="ppProbeProv" class="pp-select"></select><select id="ppProbeDist" class="pp-select"></select><select id="ppProbeBrand" class="pp-select"></select></div>' +
      '<div class="pp-toolbar"><button type="button" class="btn-primary" id="ppProbeRun">Denetle</button><button type="button" class="btn-soft" id="ppProbeCopy">URL Kopyala</button><span id="ppProbeUrl" class="mono" style="font-size:.74rem;color:var(--muted);word-break:break-all"></span></div>' +
      '<div id="ppProbeOut"></div></div></div>' +
      '<div class="pp-card"><h3>Rastgele Örneklem Taraması</h3><p class="pp-sub">Sitemap\'ten rastgele sayfalar seçilip HTTP durumu, başlık, canonical ve şema kontrol edilir.</p>' +
      '<div class="pp-toolbar"><select id="ppScanN" class="pp-select"><option value="25">25 sayfa</option><option value="60" selected>60 sayfa</option><option value="150">150 sayfa</option></select>' +
      '<select id="ppScanType" class="pp-select"><option value="all">Tüm türler</option><option value="ilcemarka">İlçe + marka</option><option value="ilmarka">İl + marka</option><option value="ilce">İlçe</option><option value="il">İl</option><option value="marka">Marka</option><option value="hizmet">Hizmet</option></select>' +
      '<button type="button" class="btn-primary" id="ppScanRun">Taramayı Başlat</button><button type="button" class="btn-soft" id="ppScanCsv" disabled>Sonuç CSV ↓</button></div>' +
      '<div class="pp-progress" id="ppScanProg" hidden><div></div></div><div id="ppScanSummary"></div><div id="ppScanOut"></div></div>';
    fillProbeSelects();
    var upd = function () { $('#ppProbeUrl').textContent = '../' + probeSlug() + '/'; };
    ['ppProbeProv', 'ppProbeDist', 'ppProbeBrand'].forEach(function (id) { $('#' + id).addEventListener('change', upd); });
    upd();
    $('#ppProbeRun').addEventListener('click', function () {
      $('#ppProbeOut').innerHTML = '<div class="pp-empty">Denetleniyor…</div>';
      inspectPage(probeSlug()).then(function (x) {
        $('#ppProbeOut').innerHTML = probeHead + probeRow(x) + '</tbody></table></div>' +
          '<div style="font-size:.78rem;color:var(--muted);margin-top:.5rem">H1: ' + esc(x.h1) + ' · Robots: ' + esc(x.robots || '—') + ' · JSON-LD: ' + x.ld + ' · Boyut: ' + nf.format(x.bytes) + ' bayt</div>';
      });
    });
    $('#ppProbeCopy').addEventListener('click', function () {
      var full = (MS.getConfig().siteDomainUrl || (location.origin + location.pathname.replace(/yonetim-paneli\/.*$/, ''))).replace(/\/+$/, '') + '/' + probeSlug() + '/';
      if (navigator.clipboard) navigator.clipboard.writeText(full).catch(function () { /* izin yok */ });
      $('#ppProbeUrl').textContent = full;
    });
    $('#ppScanRun').addEventListener('click', runScan);
    $('#ppScanCsv').addEventListener('click', function () {
      var rows = [['URL', 'HTTP', 'Title', 'Canonical', 'Robots', 'JSON-LD', 'Bulgular']].concat(scanResults.map(function (x) { return [x.slug, x.status, x.title, x.canon, x.robots, x.ld, x.issues.join(' | ')]; }));
      downloadText('merkez-seo-tarama-' + stamp() + '.csv', toCsv(rows), 'text/csv;charset=utf-8');
    });
  }

  var scanResults = [];
  function runScan() {
    var btn = $('#ppScanRun'); btn.disabled = true;
    var n = Number($('#ppScanN').value), type = $('#ppScanType').value;
    $('#ppScanOut').innerHTML = ''; $('#ppScanSummary').innerHTML = '';
    var prog = $('#ppScanProg'); prog.hidden = false; prog.firstElementChild.style.width = '0';
    loadSitemap().then(function (urls) {
      var slugs = urls.map(toSlug).filter(function (s) { return s && (type === 'all' || classify(s) === type); });
      for (var i = slugs.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = slugs[i]; slugs[i] = slugs[j]; slugs[j] = t; }
      var pick = slugs.slice(0, n), done = 0, idx = 0; scanResults = [];
      if (!pick.length) { $('#ppScanOut').innerHTML = '<div class="pp-empty">Seçilen türde sitemap URL\'si yok. Bu bir kapsam eksikliğidir.</div>'; return; }
      return new Promise(function (resolve) {
        function next() {
          if (idx >= pick.length) { if (done >= pick.length) resolve(); return; }
          var s = pick[idx++];
          inspectPage(s).then(function (x) { scanResults.push(x); done++; prog.firstElementChild.style.width = pct(done, pick.length) + '%'; next(); if (done >= pick.length) resolve(); });
        }
        for (var k = 0; k < Math.min(6, pick.length); k++) next();
      }).then(function () {
        var bad = scanResults.filter(function (x) { return x.issues.length; });
        var okN = scanResults.length - bad.length;
        $('#ppScanSummary').innerHTML = '<div class="pp-kpis">' + kpi('Taranan', scanResults.length, 'sayfa') + kpi('Sorunsuz', okN, '%' + pct(okN, scanResults.length), okN === scanResults.length ? 'good' : '') + kpi('Sorunlu', bad.length, 'sayfa', bad.length ? 'bad' : 'good') +
          kpi('404 / hata', scanResults.filter(function (x) { return x.status !== 200; }).length, 'HTTP 200 olmayan', bad.length ? 'bad' : 'good') + '</div>';
        scanResults.sort(function (a, b) { return b.issues.length - a.issues.length; });
        $('#ppScanOut').innerHTML = probeHead + scanResults.slice(0, 120).map(probeRow).join('') + '</tbody></table></div>';
        $('#ppScanCsv').disabled = false;
        audit('SEO taraması', scanResults.length + ' sayfa · ' + bad.length + ' sorunlu');
      });
    }).catch(function (e) { $('#ppScanOut').innerHTML = '<div class="pp-note warn">Sitemap okunamadı: ' + esc(e.message) + '</div>'; })
      .then(function () { btn.disabled = false; prog.hidden = true; });
  }

  function renderCoverage() {
    var box = $('#ppCoverage'); if (!box) return;
    loadSitemap().then(function (urls) {
      var counts = { home: 0, il: 0, ilce: 0, marka: 0, ilmarka: 0, ilcemarka: 0, hizmet: 0, diger: 0 };
      urls.forEach(function (u) { counts[classify(toSlug(u))]++; });
      var nDist = provs.reduce(function (s, p) { return s + (FULL[p.slug] || []).length; }, 0);
      var exp = [['İl sayfaları', counts.il, provs.length], ['İlçe sayfaları', counts.ilce, nDist], ['Marka sayfaları', counts.marka, brands.length], ['İl + marka', counts.ilmarka, provs.length * brands.length], ['İlçe + marka', counts.ilcemarka, nDist * brands.length]];
      box.innerHTML = '<div class="pp-kpis">' + kpi('Sitemap toplamı', nf.format(urls.length), 'benzersiz URL') + kpi('Hizmet / diğer', counts.hizmet + counts.diger, 'hizmet ve özel sayfalar') + '</div>' +
        exp.map(function (e) {
          var r = pct(e[1], e[2]), cls = r >= 100 ? 'ok' : r >= 50 ? 'warn' : 'bad';
          return '<div class="pp-bar-row" style="grid-template-columns:minmax(110px,26%) 1fr auto"><span class="lbl">' + e[0] + '</span><div class="pp-bar-track"><div class="pp-bar-fill ' + cls + '" style="width:' + Math.min(100, r) + '%"></div></div><span class="val">' + nf.format(e[1]) + ' / ' + nf.format(e[2]) + ' (%' + r + ')</span></div>';
        }).join('');
    }).catch(function (e) { box.innerHTML = '<div class="pp-note warn">Sitemap okunamadı (' + esc(e.message) + '). Panel dosya olarak (file://) açıldıysa tarayıcı ağ isteğini engeller; bir web sunucusundan açın.</div>'; });
  }

  function renderChecks() {
    var box = $('#ppChecks'); if (!box) return;
    var rows = [];
    function add(level, title, detail) { rows.push({ level: level, title: title, detail: detail }); }
    var cfg = MS.getConfig();
    Promise.all([
      fetchText('../robots.txt').catch(function () { return null; }),
      fetchText('../sitemap.xml').catch(function () { return null; }),
      fetchText('../__sayfa_yok_' + Date.now() + '__/').catch(function () { return null; }),
      fetchText('../admin.html').catch(function () { return null; }),
      fetchText('../api.php?action=ping').catch(function () { return null; })
    ]).then(function (res) {
      var robots = res[0], sm = res[1], nf404 = res[2], adm = res[3], api = res[4];
      if (!robots || !robots.ok) add('bad', 'robots.txt', 'Dosyaya erişilemedi.');
      else {
        var abs = /^Sitemap:\s*https?:\/\//mi.test(robots.text), rel = /^Sitemap:\s*\/(?!\/)/mi.test(robots.text);
        add(abs && !rel ? 'ok' : 'bad', 'robots.txt Sitemap satırı', abs && !rel ? 'Mutlak URL ile tanımlı.' : 'Göreli veya eksik Sitemap satırı: Google yalnızca mutlak URL kabul eder.');
        add(/Disallow:\s*\/yonetim-paneli\//i.test(robots.text) ? 'ok' : 'warn', 'Yönetim paneli taramaya kapalı', 'robots.txt içinde /yonetim-paneli/ Disallow satırı aranır.');
      }
      if (!sm || !sm.ok) add('bad', 'sitemap.xml', 'Dosyaya erişilemedi.');
      else add(sm.text.indexOf('<sitemapindex') > -1 ? 'ok' : 'warn', 'Sitemap yapısı', sm.text.indexOf('<sitemapindex') > -1 ? 'Dizin + parçalı sitemap (parça başına en fazla 10.000 URL).' : 'Tek dosya; 50.000 URL / 50 MB sınırına dikkat edin.');
      if (!nf404) add('warn', '404 davranışı', 'Test edilemedi.');
      else add(nf404.status === 404 ? (/noindex/i.test(nf404.text) ? 'ok' : 'warn') : 'bad', 'Olmayan sayfa → 404', nf404.status === 404 ? (/noindex/i.test(nf404.text) ? 'HTTP 404 ve noindex.' : '404 dönüyor ancak noindex yok.') : 'Olmayan URL HTTP ' + nf404.status + ' döndürüyor (soft-404 riski).');
      add(adm && adm.ok ? 'ok' : 'warn', '/admin.html yönlendirmesi', adm && adm.ok ? 'Panele yönlendiriyor.' : 'Eski paylaşılan admin.html bağlantısı çalışmıyor.');
      if (!api || !api.ok) add('ok', 'Sunucu API', 'Bu barındırmada api.php yok (statik yayın). Veriler tarayıcıda tutulur.');
      else if (/^\s*<\?php/.test(api.text)) add('warn', 'api.php kaynak kodu görünür', 'Statik barındırmada PHP çalışmaz, dosya düz metin sunulur. Yazma işlemleri yönetici anahtarı ister ama dosyayı bu yayından kaldırmak daha temizdir.');
      else add('ok', 'Sunucu API', 'api.php JSON döndürüyor.');
      add(location.protocol === 'https:' ? 'ok' : 'warn', 'HTTPS', location.protocol === 'https:' ? 'Bağlantı şifreli.' : 'Şu an ' + location.protocol + ' üzerinden açık.');
      var domain = String(cfg.siteDomainUrl || '');
      var defDomain = String((MS.DEFAULT_CONFIG || {}).siteDomainUrl || '');
      var domOk = domain && !/github\.io/.test(domain) && domain !== defDomain;
      add(domOk ? 'ok' : 'warn', 'Canlı alan adı', domOk ? domain : 'Alan adı ayarı varsayılan örnek değerde (' + (domain || 'boş') + '). Müşterinin gerçek alan adını Search Console & Ads sekmesinden girin.');
      add(cfg.googleSearchConsoleVerification ? 'ok' : 'warn', 'Search Console doğrulaması', cfg.googleSearchConsoleVerification ? 'Doğrulama kodu girilmiş.' : 'Doğrulama kodu girilmemiş.');
      add(cfg.googleAnalyticsId || cfg.ga4MeasurementId ? 'ok' : 'warn', 'Analytics / Ads etiketi', cfg.googleAnalyticsId || cfg.ga4MeasurementId ? 'Tanımlı.' : 'GA4 / Ads dönüşüm etiketi tanımlı değil.');
      box.innerHTML = rows.map(function (r) {
        return '<div class="pp-check"><span>' + chip(r.level === 'ok' ? 'Tamam' : r.level === 'warn' ? 'Uyarı' : 'Sorun', r.level) + '</span><span class="t">' + esc(r.title) + '</span><span class="d">' + esc(r.detail) + '</span></div>';
      }).join('');
    });
  }

  // =====================================================================
  // 3) SİSTEM, YEDEK & GÜVENLİK
  // =====================================================================
  var DATA_KEYS = [
    ['merkez_servis_config_v4', 'Site ayarları', 'config'], ['merkez_servis_leads_v4', 'İş emirleri', 'leads'], ['merkez_servis_techs_v4', 'Ustalar', 'technicians'],
    ['merkez_servis_custom_brands_v4', 'Özel markalar', 'customBrands'], ['merkez_servis_custom_faults_v4', 'Özel arıza kodları', null], ['merkez_servis_reviews_v4', 'Yorumlar', 'reviews'],
    ['merkez_servis_faqs_v4', 'SSS', 'faqs'], ['merkez_servis_visitors_v4', 'Ziyaretçi oturumları', 'visitors'], [AUDIT_KEY, 'İşlem günlüğü', null]
  ];
  var PIN_KEY = 'merkez_admin_pin_v1';

  function sha256(text) {
    var enc = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join(''); });
  }

  function renderAudit() {
    var box = $('#ppAuditLog'); if (!box) return;
    var l = auditList();
    box.innerHTML = l.length ? l.slice(0, 80).map(function (e) {
      var d = new Date(e.t);
      return '<div class="pp-log-row"><time>' + esc(d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })) + '</time><span><strong>' + esc(e.a) + '</strong>' + (e.d ? ' · ' + esc(e.d) : '') + '</span></div>';
    }).join('') : '<div class="pp-empty">Henüz işlem kaydı yok. Panelde yapılan değişiklikler burada listelenir.</div>';
  }

  function renderStorage() {
    var tbody = $('#ppStorageBody'); if (!tbody) return;
    var total = 0;
    tbody.innerHTML = DATA_KEYS.map(function (k) {
      var raw = lsGet(k[0]); var bytes = raw ? new Blob([raw]).size : 0; total += bytes;
      var parsed = safeJson(raw, null); var n = Array.isArray(parsed) ? parsed.length : parsed ? Object.keys(parsed).length : 0;
      return '<tr><td>' + esc(k[1]) + '</td><td>' + (raw ? n + (Array.isArray(parsed) ? ' kayıt' : ' alan') : '—') + '</td><td>' + (bytes ? nf.format(bytes) + ' B' : 'Varsayılan') + '</td></tr>';
    }).join('') + '<tr><td><strong>Toplam</strong></td><td></td><td><strong>' + nf.format(total) + ' B</strong></td></tr>';
  }

  function renderApiStatus() {
    var box = $('#ppApiStatus'); if (!box) return;
    fetchText('../api.php?action=ping').then(function (r) {
      if (!r.ok) return box.innerHTML = chip('Statik barındırma', 'warn') + '<p class="pp-sub" style="margin:.5rem 0 0">Sunucu API (api.php) bu adreste çalışmıyor. Telemetri, iş emirleri ve ayarlar yalnızca bu tarayıcıda saklanır; başka cihazlarla eşitlenmez. Kalıcı ve ortak kayıt için PHP destekli barındırmaya kurun.</p>';
      var j = safeJson(r.text, null);
      if (!j) return box.innerHTML = chip('Yanıt geçersiz', 'bad') + '<p class="pp-sub" style="margin:.5rem 0 0">api.php JSON yerine başka içerik döndürüyor (PHP çalışmıyor olabilir).</p>';
      box.innerHTML = chip('Sunucu API aktif', 'ok') + ' ' + chip(j.auth ? 'Yönetici anahtarı: açık' : 'Yönetici anahtarı: kurulmamış', j.auth ? 'ok' : 'bad') +
        '<p class="pp-sub" style="margin:.5rem 0 0">Sürüm ' + esc(j.version || '?') + (j.auth ? '' : ' · Güvenlik için aşağıdan yönetici anahtarı oluşturun.') + '</p>';
    }).catch(function () { box.innerHTML = chip('Ulaşılamadı', 'bad'); });
  }

  function renderSystemSkeleton() {
    var root = $('#ppSystem'); if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    root.innerHTML =
      '<div class="pp-grid">' +
      '<div class="pp-card"><h3>Veri Kaynağı Durumu</h3><p class="pp-sub">Verilerin nerede tutulduğu</p><div id="ppApiStatus"><div class="pp-empty">Kontrol ediliyor…</div></div></div>' +
      '<div class="pp-card"><h3>Yönetici Anahtarı (Sunucu API)</h3><p class="pp-sub">api.php yazma işlemleri bu anahtarı ister. Anahtar bu tarayıcıda saklanır.</p>' +
      '<div class="pp-toolbar"><input id="ppApiToken" type="password" class="clean-input" style="flex:1;min-width:180px" placeholder="Yönetici anahtarı" autocomplete="off"><button type="button" class="btn-primary" id="ppApiTokenSave">Kaydet</button></div>' +
      '<div class="pp-toolbar"><button type="button" class="btn-soft" id="ppApiSetup">İlk Kurulum: Anahtar Üret</button><span id="ppApiMsg" style="font-size:.78rem;color:var(--muted)"></span></div></div>' +
      '<div class="pp-card"><h3>Panel Kilidi (PIN)</h3><p class="pp-sub">Bu tarayıcıda panel açılırken PIN ister. Sadece arayüz kilididir; sunucu güvenliğinin yerine geçmez.</p>' +
      '<div id="ppPinState"></div><div class="pp-toolbar"><input id="ppPinNew" type="password" inputmode="numeric" class="clean-input" style="width:150px" maxlength="8" placeholder="4-8 haneli PIN" autocomplete="off"><button type="button" class="btn-primary" id="ppPinSet">PIN Belirle</button><button type="button" class="btn-soft" id="ppPinClear">Kilidi Kaldır</button></div></div>' +
      '</div>' +
      '<div class="pp-grid">' +
      '<div class="pp-card"><h3>Yedekle & Geri Yükle</h3><p class="pp-sub">Tüm ayarlar, iş emirleri, ustalar, yorumlar ve ziyaretçi kayıtları tek JSON dosyasında.</p>' +
      '<div class="pp-toolbar"><button type="button" class="btn-primary" id="ppBackup">Yedek İndir ↓</button><label class="btn-soft" style="cursor:pointer">Yedekten Yükle…<input id="ppRestore" type="file" accept="application/json,.json" hidden></label></div>' +
      '<div id="ppRestoreMsg" style="font-size:.8rem;color:var(--muted)"></div></div>' +
      '<div class="pp-card"><h3>Depolama Özeti</h3><p class="pp-sub">Tarayıcı belleğinde tutulan veri</p><div class="table-scroll"><table><thead><tr><th>Veri</th><th>İçerik</th><th>Boyut</th></tr></thead><tbody id="ppStorageBody"></tbody></table></div>' +
      '<div class="pp-toolbar" style="margin-top:.7rem"><button type="button" class="btn-soft" id="ppClearSeed">Örnek Ziyaretçileri Temizle</button></div></div>' +
      '</div>' +
      '<div class="pp-card"><div class="pp-toolbar"><div><h3 style="margin:0">İşlem Günlüğü</h3><p class="pp-sub" style="margin:0">Panelde yapılan değişikliklerin kaydı (en son 300)</p></div><span class="grow"></span><button type="button" class="btn-soft" id="ppAuditCsv">CSV ↓</button><button type="button" class="btn-danger-sm" id="ppAuditClear">Günlüğü Temizle</button></div><div id="ppAuditLog" class="pp-log"></div></div>';

    $('#ppBackup').addEventListener('click', function () { downloadText('merkez-yedek-' + stamp() + '.json', MS.exportAllDataJson(), 'application/json'); audit('Yedek alındı', 'JSON'); });
    $('#ppRestore').addEventListener('change', function (ev) {
      var f = ev.target.files && ev.target.files[0]; if (!f) return;
      var msg = $('#ppRestoreMsg');
      if (f.size > 5 * 1024 * 1024) { msg.textContent = 'Dosya çok büyük (en fazla 5 MB).'; return; }
      f.text().then(function (txt) {
        var data = safeJson(txt, null);
        if (!data || typeof data !== 'object' || (!data.config && !data.leads && !data.technicians)) { msg.textContent = 'Geçerli bir Merkez yedek dosyası değil.'; return; }
        var items = DATA_KEYS.filter(function (k) { return k[2] && data[k[2]] != null; });
        if (!window.confirm('Yedek geri yüklenecek: ' + items.map(function (k) { return k[1]; }).join(', ') + '.\nMevcut veriler bu alanlar için değiştirilir. Devam edilsin mi?')) return;
        items.forEach(function (k) {
          var v = data[k[2]];
          if (k[2] === 'visitors' && Array.isArray(v)) v = v.filter(function (x) { return !x.isSeed && !x.isCurrentSession; });
          lsSet(k[0], JSON.stringify(v));
        });
        audit('Yedek geri yüklendi', f.name + ' · ' + items.length + ' bölüm');
        msg.textContent = 'Geri yüklendi, sayfa yenileniyor…';
        setTimeout(function () { location.reload(); }, 700);
      }).catch(function () { msg.textContent = 'Dosya okunamadı.'; });
    });
    $('#ppClearSeed').addEventListener('click', function () { MS.clearSeedVisitorsKeepCurrent(); audit('Örnek ziyaretçiler temizlendi', ''); renderStorage(); renderReports(); });
    $('#ppAuditClear').addEventListener('click', function () { if (window.confirm('İşlem günlüğü silinsin mi?')) { lsDel(AUDIT_KEY); renderAudit(); renderStorage(); } });
    $('#ppAuditCsv').addEventListener('click', function () { downloadText('merkez-islem-gunlugu-' + stamp() + '.csv', toCsv([['Zaman', 'İşlem', 'Ayrıntı']].concat(auditList().map(function (e) { return [e.t, e.a, e.d]; }))), 'text/csv;charset=utf-8'); });

    // API anahtarı
    var tk = lsGet('merkez_admin_token_v1'); if (tk) $('#ppApiToken').placeholder = 'Kayıtlı anahtar var (değiştirmek için yazın)';
    $('#ppApiTokenSave').addEventListener('click', function () { var v = $('#ppApiToken').value.trim(); if (!v) return; lsSet('merkez_admin_token_v1', v); $('#ppApiToken').value = ''; $('#ppApiMsg').textContent = 'Kaydedildi.'; audit('Yönetici anahtarı güncellendi', ''); });
    $('#ppApiSetup').addEventListener('click', function () {
      $('#ppApiMsg').textContent = 'İstek gönderiliyor…';
      fetch('../api.php?action=setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(function (r) { return r.text(); }).then(function (t) {
        var j = safeJson(t, null);
        if (j && j.ok && j.token) { lsSet('merkez_admin_token_v1', j.token); $('#ppApiMsg').innerHTML = 'Anahtar üretildi ve bu tarayıcıya kaydedildi. <strong>Yedeğini alın:</strong> <span class="mono">' + esc(j.token) + '</span>'; audit('Yönetici anahtarı üretildi', 'sunucu'); renderApiStatus(); }
        else $('#ppApiMsg').textContent = (j && j.error === 'already_setup') ? 'Anahtar zaten kurulu; mevcut anahtarı girin.' : 'Kurulum yapılamadı (api.php bu adreste çalışmıyor olabilir).';
      }).catch(function () { $('#ppApiMsg').textContent = 'Sunucuya ulaşılamadı.'; });
    });

    // PIN
    function pinState() { $('#ppPinState').innerHTML = lsGet(PIN_KEY) ? chip('PIN kilidi açık', 'ok') : chip('PIN kilidi kapalı', 'warn'); }
    pinState();
    $('#ppPinSet').addEventListener('click', function () {
      var pin = $('#ppPinNew').value.trim();
      if (!/^\d{4,8}$/.test(pin)) { $('#ppPinState').innerHTML = chip('PIN 4-8 haneli rakam olmalı', 'bad'); return; }
      sha256('merkez-pin:' + pin).then(function (h) { lsSet(PIN_KEY, h); try { sessionStorage.setItem('pp_unlocked', '1'); } catch (e) { /* yok say */ } $('#ppPinNew').value = ''; pinState(); audit('Panel PIN kilidi açıldı', ''); });
    });
    $('#ppPinClear').addEventListener('click', function () { lsDel(PIN_KEY); pinState(); audit('Panel PIN kilidi kaldırıldı', ''); });

    renderApiStatus(); renderStorage(); renderAudit();
  }

  // PIN kilit ekranı
  function lockIfNeeded() {
    var h = lsGet(PIN_KEY); if (!h) return;
    try { if (sessionStorage.getItem('pp_unlocked') === '1') return; } catch (e) { /* devam */ }
    var ov = document.createElement('div'); ov.className = 'pp-lock';
    ov.innerHTML = '<form class="pp-lock-box"><h2>Yönetim Paneli</h2><p>Devam etmek için PIN girin.</p><input type="password" inputmode="numeric" class="clean-input" maxlength="8" autocomplete="off" aria-label="PIN"><div class="pp-lock-err" role="alert"></div><button type="submit" class="btn-primary" style="margin-top:.8rem;width:100%">Aç</button></form>';
    document.body.appendChild(ov);
    var form = $('form', ov), inp = $('input', ov), err = $('.pp-lock-err', ov), fails = 0, until = 0;
    inp.focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (Date.now() < until) { err.textContent = 'Çok fazla deneme. ' + Math.ceil((until - Date.now()) / 1000) + ' sn bekleyin.'; return; }
      sha256('merkez-pin:' + inp.value).then(function (x) {
        if (x === h) { try { sessionStorage.setItem('pp_unlocked', '1'); } catch (er) { /* yok say */ } ov.remove(); audit('Panel açıldı', ''); }
        else { fails++; err.textContent = 'Hatalı PIN.'; inp.value = ''; if (fails % 5 === 0) until = Date.now() + 30000; }
      });
    });
  }

  // ---------- Bağlama ----------
  var lazy = { seohealth: false, system: false };
  function onTab(id) {
    if (id === 'reports') renderReports();
    if (id === 'seohealth') { renderSeoSkeleton(); if (!lazy.seohealth) { lazy.seohealth = true; renderCoverage(); renderChecks(); } }
    if (id === 'system') { renderSystemSkeleton(); renderStorage(); renderAudit(); }
  }
  $$('[data-tab-target]').forEach(function (b) { b.addEventListener('click', function () { onTab(b.getAttribute('data-tab-target')); }); });
  window.addEventListener('merkez:config-updated', function () { if ($('#pane-reports.active')) renderReports(); });
  window.addEventListener('storage', function () { if ($('#pane-reports.active')) renderReports(); });
  var urlTab = new URLSearchParams(location.search).get('tab');
  if (urlTab) onTab(urlTab);
  lockIfNeeded();
})();
