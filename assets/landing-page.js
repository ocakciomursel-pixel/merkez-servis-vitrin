(function () {
  const MS = window.MerkezServis;
  if (!MS) return;
  const is404Fallback = document.documentElement.getAttribute('data-is-404-router') === 'true';
  const pageDepth = document.documentElement.getAttribute('data-page-depth') || '../';
  MS.mountStudioChrome('brand', pageDepth);

  const cfg = MS.getConfig();
  const themePaths = {
    'tema-1-kurumsal': pageDepth + 'tema-1-kurumsal/index.html',
    'tema-2-hizli-cagri': pageDepth + 'tema-2-hizli-cagri/index.html',
    'tema-3-prestij': pageDepth + 'tema-3-prestij/index.html',
    'tema-4-apple-vitrin': pageDepth + 'tema-4-apple-vitrin/index.html'
  };
  const homeHref = themePaths[cfg.activeTheme] || themePaths['tema-1-kurumsal'];
  const backLink = document.getElementById('backToActiveThemeLink');
  const bcHome = document.getElementById('bcHomeLink');
  if (backLink) backLink.setAttribute('href', homeHref);
  if (bcHome) bcHome.setAttribute('href', homeHref);

  let curProv = document.documentElement.getAttribute('data-prov-slug') || '';
  let curBrand = document.documentElement.getAttribute('data-brand-slug') || '';
  let curService = document.documentElement.getAttribute('data-service-slug') || '';
  let curDistLabel = '';

  const allBrands = MS.getAllBrands();
  const allProvs = MS.ALL_81_PROVINCES;

  // Smart URL resolver for 404.html on GitHub Pages (preserves exact URL in address bar via history.replaceState)
  if (is404Fallback) {
    // 404.html carries placeholder data-* attributes (bosch); resolve purely from the URL
    curProv = ''; curBrand = ''; curService = ''; curDistLabel = '';
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const parts = rawPath.split('/').filter(Boolean);
    const lastSeg = (parts[parts.length - 1] || '').replace(/\.html$/i, '');
    const prevSeg = parts.length > 1 ? parts[parts.length - 2] : '';

    // Check /<il>/<ilce>-<marka>-servisi
    const pFromPrev = allProvs.find(p => p.slug === prevSeg);
    if (pFromPrev) {
      curProv = pFromPrev.slug;
      for (const b of allBrands) {
        if (lastSeg.endsWith('-' + b.slug + '-servisi')) {
          curBrand = b.slug;
          const distSlug = lastSeg.slice(0, -('-' + b.slug + '-servisi').length);
          curDistLabel = pFromPrev.districts.find(d => MS.slugifyTr(d) === distSlug) || '';
          break;
        }
      }
    }

    // Check /<il>-<ilce>-<marka>-servisi or /<il>-<ilce>-yetkili-servisi (single segment, full 973-district list)
    const FULL_DIST = window.MS_FULL_DISTRICTS || {};
    const SLUG_TR = window.MS_SLUG_TR || MS.slugifyTr;
    if (!curProv && !curBrand) {
      outerDist: for (const p of allProvs) {
        if (!lastSeg.startsWith(p.slug + '-')) continue;
        const rest = lastSeg.slice(p.slug.length + 1);
        for (const dn of (FULL_DIST[p.slug] || p.districts || [])) {
          const ds = SLUG_TR(dn);
          if (!rest.startsWith(ds + '-')) continue;
          const rem = rest.slice(ds.length + 1);
          if (rem === 'yetkili-servisi' || rem === 'servisi') { curProv = p.slug; curDistLabel = dn; break outerDist; }
          const bm = allBrands.find(b => rem === b.slug + '-servisi');
          if (bm) { curProv = p.slug; curBrand = bm.slug; curDistLabel = dn; break outerDist; }
        }
      }
    }

    // Check /<il>-<marka>-servisi or /<il>-yetkili-servisi or /<il>-servisi
    if (!curProv && !curBrand) {
      for (const p of allProvs) {
        if (lastSeg === p.slug + '-servisi' || lastSeg === p.slug + '-yetkili-servisi') {
          curProv = p.slug;
          break;
        }
        if (lastSeg.startsWith(p.slug + '-') && lastSeg.endsWith('-servisi')) {
          const mid = lastSeg.slice((p.slug + '-').length, -'-servisi'.length);
          const bMatch = allBrands.find(b => b.slug === mid);
          if (bMatch) {
            curProv = p.slug;
            curBrand = bMatch.slug;
            break;
          }
        }
      }
    }

    if (!curProv && !curBrand) {
      const bOnly = allBrands.find(b => lastSeg === b.slug + '-servisi');
      if (bOnly) {
        curBrand = bOnly.slug;
      } else {
        curService = lastSeg;
      }
    }

    // Hydrate page DOM for the resolved URL without changing address bar
    const pObj = curProv ? allProvs.find(p => p.slug === curProv) : null;
    const bObj = curBrand ? allBrands.find(b => b.slug === curBrand) : null;
    const locTxt = pObj ? (curDistLabel ? pObj.name + ' ' + curDistLabel + ' ' : pObj.name + ' ') : '';
    const titleLabel = bObj
      ? (locTxt + bObj.name + ' Yetkili Servisi')
      : (pObj ? (locTxt + 'Yetkili Servisi') : 'Merkez Yetkili Servisi');
    const eta = pObj ? pObj.eta : 30;
    const fullCurrentUrl = window.location.origin + window.location.pathname;

    document.title = titleLabel + ' | 0850 380 02 02 (' + eta + ' Dk Yerinde Onarım)';
    const h1El = document.getElementById('lpHeroH1');
    if (h1El) h1El.textContent = titleLabel + ' — Aynı Gün Yerinde 1 Yıl Garantili Onarım';
    const leadEl = document.getElementById('lpHeroLead');
    if (leadEl) {
      leadEl.textContent = locTxt
        ? (locTxt + 'genelinde orijinal yedek parça stoklu gezici yetkili servisi araçlarımızla ortalama ' + eta + ' dakikada adresinizdeyiz. 12 ay resmi parça ve işçilik garantisi.')
        : '81 ilde orijinal yedek parça stoklu gezici yetkili servisi araçlarımızla ortalama 30 dakikada adresinizdeyiz. 12 ay resmi parça ve işçilik garantisi.';
    }
    const bcTitle = document.getElementById('bcCurrentTitle');
    if (bcTitle) bcTitle.textContent = titleLabel;
    const urlCodeEl = document.querySelector('.ads-url-code');
    if (urlCodeEl) urlCodeEl.textContent = fullCurrentUrl;
    const copyBtnEl = document.getElementById('lpCopyUrlBtn');
    if (copyBtnEl) copyBtnEl.setAttribute('data-copy-url', fullCurrentUrl);
  }

  // Render SVG Brand Logo in header & hero if brand page
  const brandObj = curBrand ? allBrands.find(b => b.slug === curBrand) : null;
  if (brandObj) {
    const svg = MS.renderBrandMarkSvg(brandObj);
    const hLogo = document.getElementById('headerBrandLogoHost');
    const heroLogo = document.getElementById('heroBrandLogoHost');
    if (hLogo) hLogo.innerHTML = svg;
    if (heroLogo) heroLogo.innerHTML = svg;
  }

  // Populate 81-Province and 38-Brand switcher dropdowns so changing them navigates to the dedicated URL
  const provSel = document.getElementById('lpProvSelect');
  const brandSel = document.getElementById('lpBrandSelect');

  if (provSel) {
    provSel.innerHTML = '';
    provSel.add(new Option('Türkiye Geneli (81 İl)', ''));
    allProvs.forEach(p => provSel.add(new Option(p.plate + ' - ' + p.name, p.slug)));
    if (curProv) provSel.value = curProv;
  }

  if (brandSel) {
    brandSel.innerHTML = '';
    brandSel.add(new Option('Tüm Markalar (38 Marka)', ''));
    MS.getActiveBrands().forEach(b => brandSel.add(new Option(b.name + ' Yetkili Servisi', b.slug)));
    if (curBrand) brandSel.value = curBrand;
  }

  function navigateToSelection() {
    const p = provSel ? provSel.value : curProv;
    const b = brandSel ? brandSel.value : curBrand;
    let targetSlug = '';
    if (p && b) {
      targetSlug = p + '-' + b + '-servisi';
    } else if (p && !b) {
      targetSlug = p + '-yetkili-servisi';
    } else if (!p && b) {
      targetSlug = b + '-servisi';
    } else if (curService) {
      targetSlug = curService;
    } else {
      targetSlug = 'bosch-servisi';
    }
    const suffix = window.location.protocol === 'file:' ? '/index.html' : '/';
    window.location.href = pageDepth + targetSlug + suffix;
  }

  if (provSel) provSel.addEventListener('change', navigateToSelection);
  if (brandSel) brandSel.addEventListener('change', navigateToSelection);

  // Copy URL button handler
  const copyBtn = document.getElementById('lpCopyUrlBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const urlToCopy = copyBtn.getAttribute('data-copy-url') || window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(urlToCopy).catch(() => {});
      }
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓ Kopyalandı';
      setTimeout(() => { copyBtn.textContent = orig; }, 1600);
    });
  }

  // Lead Form submission
  const leadForm = document.getElementById('lpLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pageTitleText = (document.getElementById('bcCurrentTitle') || {}).textContent || 'Yetkili Servisi';
      const provObj = curProv ? allProvs.find(x => x.slug === curProv) : null;
      const rec = MS.addLead({
        source: 'Google Ads Sayfası (' + (curProv || 'TR') + ')',
        customer: document.getElementById('lpfName').value.trim(),
        phone: document.getElementById('lpfPhone').value.trim(),
        city: provObj ? provObj.name : 'Türkiye Geneli',
        brand: brandObj ? brandObj.name : pageTitleText,
        device: pageTitleText,
        fault: document.getElementById('lpfFault').value.trim()
      });
      const t = document.getElementById('lpFormToast');
      if (t) {
        t.style.display = 'block';
        t.innerHTML = '<strong>✓ Kaydınız Alındı! İş Emri No: <span class="mono">' + rec.id + '</span></strong><br>Bölge yetkili servisi teknisyenimiz 5 dakika içinde <strong>' + rec.phone + '</strong> numaranızı arayacaktır.';
      }
      e.target.reset();
    });
  }
})();
