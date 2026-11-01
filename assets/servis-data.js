// Merkez Servis Full Live CMS, Google Ads Landing Engine & Real-Time Visitor Telemetry v3
// 4 Distinct Themes x 5 Live Color Palettes, 38 Authentic Brands (with custom vector SVG logos),
// 71 Exact Google Ads Keywords (incl. Endustriyel Mutfak & Soguk Hava Deposu), 10 Ultra-HD Product Photo Branches,
// 1-Click Global 444 60 82 Phone Sync, Search Console / GA4 / Ads Code Injector, and Dual PHP + LocalStorage Sync.

(function () {
  const STORAGE_KEY = 'merkez_servis_config_v3';
  const LEADS_KEY = 'merkez_servis_leads_v3';
  const TECHS_KEY = 'merkez_servis_techs_v3';
  const CUSTOM_BRANDS_KEY = 'merkez_servis_custom_brands_v3';
  const CUSTOM_FAULTS_KEY = 'merkez_servis_custom_faults_v3';
  const REVIEWS_KEY = 'merkez_servis_reviews_v3';
  const FAQS_KEY = 'merkez_servis_faqs_v3';
  const VISITORS_KEY = 'merkez_servis_visitors_v3';
  const SESSION_ID_KEY = 'merkez_servis_current_sid_v3';
  const HIDE_PILL_KEY = 'merkez_servis_hide_demo_pill_v3';

  const liveChannel = (typeof BroadcastChannel !== 'undefined')
    ? new BroadcastChannel('merkez_servis_live_v3')
    : null;

  const DEFAULT_CONFIG = {
    companyName: 'Merkez Beyaz Eşya Servisi',
    legalName: 'Merkez Beyaz Eşya Servisi Ticaret Limited Şirketi',
    headOfficeAddress: 'Yenişehir Mah. Kuvayi Milliye Cad. No:42 Yenişehir / Mersin',
    taxInfo: 'İstiklal V.D. · Mersis: 0618094281000019',
    primaryPhoneDisplay: '444 60 82',
    primaryPhoneTel: '4446082',
    secondaryPhoneDisplay: '0850 380 02 02',
    secondaryPhoneTel: '08503800202',
    emergencyNightPhone: '444 60 82',
    whatsappPhone: '904446082',
    whatsappDisplay: '444 60 82',
    singleNumberSync: true,
    savedPhonePresets: [
      { label: 'Kurumsal Ana Hat (444)', phone: '444 60 82', wa: '444 60 82' },
      { label: 'Ulusal Çağrı Hattı (0850)', phone: '0850 380 02 02', wa: '0850 380 02 02' },
      { label: 'Nöbetçi Mobil Saha Hattı', phone: '0532 610 02 02', wa: '0532 610 02 02' }
    ],
    whatsappGreeting: 'Merhaba, arızalı cihazım için teknik servis ve fiyat bilgisi almak istiyorum.',
    workingHoursWeekday: '08:00 - 22:00',
    workingHoursWeekend: '09:00 - 20:00',
    nightShiftActive: true,
    showTopDemoBar: false,
    showDemoFloatingPill: true,
    promoBannerActive: false,
    promoBannerText: 'Kış Kampanyası: Yoğuşmalı Kombi Bakımı + Termal İlaçlı Petek Temizliği Paketinde %20 İndirim!',
    promoBannerCode: 'KIS20',
    heroCustomBadge: '',
    heroCustomTitle: '',
    heroCustomSub: '',
    activeTheme: 'tema-1-kurumsal',
    colorPalette: 'royal-blue',
    paletteOverridden: false,
    dailyDripLimit: 250,
    adsComplianceBanner: true,
    adsComplianceText: 'Garantisi sona ermiş tüm marka cihazlar için 1 yıl parça & işçilik garantili bağımsız özel teknik servis hizmetidir.',
    warrantyMonths: 12,
    avgArrivalMinutes: 30,
    inspectionFeeTl: 450,
    inspectionNote: 'Onarım onaylandığında arıza tespit ve servis yönlendirme ücreti alınmaz.',
    floatingDockActive: true,
    liveDispatchTickerActive: true,
    seoTitleTemplate: '{ilce} {marka} Servisi — {sure} Dk Yerinde Onarım | {telefon}',
    seoMetaTemplate: '{il} {ilce} bölgesinde {marka} {hizmet} için {arac} gezici araçla ort. {sure} dakikada {garanti} ay parça garantili özel teknik servis. Hemen Ara: {telefon}',
    siteDomainUrl: 'https://merkezservis.com.tr',
    googleSearchConsoleVerification: '',
    yandexVerification: '',
    bingVerification: '',
    googleAnalyticsId: '',
    googleAdsId: '',
    googleAdsLabel: '',
    gtmId: '',
    metaPixelId: '',
    customHeadHtml: '',
    customBodyHtml: '',
    disabledBrands: [],
    disabledCategories: [],
    categoryOverrides: {}
  };

  const COLOR_PALETTES = [
    { id: 'royal-blue', name: 'Kurumsal Güven Mavisi', hex: '#0066ff', note: 'Beko / Samsung / Kurumsal Mavi' },
    { id: 'crimson-red', name: 'Bosch & Arçelik Kırmızısı', hex: '#e11d48', note: 'Bosch / Arçelik / Yüksek Dönüşüm Kırmızı' },
    { id: 'vaillant-emerald', name: 'Vaillant Eko Yeşili', hex: '#059669', note: 'Vaillant / Kombi & İklimlendirme Yeşil' },
    { id: 'thermal-amber', name: 'Acil Servis Turuncusu', hex: '#ea580c', note: 'Baymak / Viessmann Enerji Turuncusu' },
    { id: 'siemens-teal', name: 'Siemens Ankastre Turkuaz', hex: '#0891b2', note: 'Siemens / Miele Modern Petrol' }
  ];

  let phpApiPrefix = null;
  let phpApiAvailable = false;

  function normalizeTelDigits(displayStr) {
    return String(displayStr || '').replace(/[^\d+]/g, '');
  }

  function normalizeWaDigits(displayStr) {
    const digits = String(displayStr || '').replace(/\D/g, '');
    if (!digits) return '904446082';
    if (digits.startsWith('90')) return digits;
    if (digits.startsWith('0')) return '9' + digits;
    return '90' + digits;
  }

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        savedPhonePresets: Array.isArray(parsed.savedPhonePresets) && parsed.savedPhonePresets.length
          ? parsed.savedPhonePresets
          : DEFAULT_CONFIG.savedPhonePresets,
        disabledBrands: Array.isArray(parsed.disabledBrands) ? parsed.disabledBrands : [],
        disabledCategories: Array.isArray(parsed.disabledCategories) ? parsed.disabledCategories : [],
        categoryOverrides: parsed.categoryOverrides && typeof parsed.categoryOverrides === 'object' ? parsed.categoryOverrides : {}
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function pushConfigToPhpServer(cfg) {
    if (!phpApiAvailable || !phpApiPrefix) return;
    try {
      fetch(phpApiPrefix + 'api.php?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      }).catch(() => {});
    } catch {}
  }

  function saveConfig(patch, skipServerSync) {
    const next = { ...getConfig(), ...patch };
    if (next.primaryPhoneDisplay) {
      next.primaryPhoneTel = normalizeTelDigits(next.primaryPhoneDisplay);
    }
    if (next.secondaryPhoneDisplay) {
      next.secondaryPhoneTel = normalizeTelDigits(next.secondaryPhoneDisplay);
    }
    if (next.whatsappDisplay) {
      next.whatsappPhone = normalizeWaDigits(next.whatsappDisplay);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    if (!skipServerSync) {
      pushConfigToPhpServer(next);
    }
    if (liveChannel) {
      try { liveChannel.postMessage({ type: 'config-updated', config: next }); } catch {}
    }
    hydrateLiveConfig();
    injectVerificationAndTrackingCodes();
    window.dispatchEvent(new CustomEvent('merkez:config-updated', { detail: next }));
    return next;
  }

  // 1-Click Global Phone Replacement Across Entire Website, 4 Themes, 38 Brand Pages, 71 Keyword Pages & JSON-LD
  function applySinglePhoneEverywhere(phoneDisplay, options) {
    const clean = String(phoneDisplay || '').trim() || '444 60 82';
    const opts = options || {};
    const patch = {
      primaryPhoneDisplay: clean,
      primaryPhoneTel: normalizeTelDigits(clean)
    };
    if (opts.syncSecondary !== false) {
      patch.emergencyNightPhone = clean;
      if (opts.replaceSecondaryToo) {
        patch.secondaryPhoneDisplay = clean;
        patch.secondaryPhoneTel = normalizeTelDigits(clean);
      }
    }
    if (opts.syncWhatsapp !== false) {
      patch.whatsappDisplay = clean;
      patch.whatsappPhone = normalizeWaDigits(clean);
    }
    return saveConfig(patch);
  }

  // All 38 Authentic Brands (35 original + ECA, Alarko, Baykan from Yusuf Bey's full WhatsApp list)
  const BRANDS = [
    { slug: 'arcelik', name: 'Arçelik', group: 'Beyaz Eşya, Kombi, Klima & TV', origin: 'TR', accent: '#e30613', photo: 'photos/buzdolabi-ultra.jpg', codes: ['E01', 'E08', 'E18', 'F04'] },
    { slug: 'beko', name: 'Beko', group: 'Beyaz Eşya, Klima & TV', origin: 'TR', accent: '#0054a6', photo: 'photos/camasir-bulasik-ultra.jpg', codes: ['E05', 'E09', 'E17', 'H20'] },
    { slug: 'bosch', name: 'Bosch', group: 'Beyaz Eşya, Ankastre & Kombi', origin: 'DE', accent: '#e20015', photo: 'photos/camasir-bulasik-ultra.jpg', codes: ['E18', 'E15', 'E23', 'EA'] },
    { slug: 'siemens', name: 'Siemens', group: 'Beyaz Eşya & Ankastre', origin: 'DE', accent: '#009999', photo: 'photos/ankastre-kitchen.jpg', codes: ['E18', 'E15', 'E24', 'F23'] },
    { slug: 'profilo', name: 'Profilo', group: 'Beyaz Eşya & Ankastre', origin: 'DE', accent: '#004b93', photo: 'photos/buzdolabi-ultra.jpg', codes: ['F18', 'F21', 'E15', 'E02'] },
    { slug: 'samsung', name: 'Samsung', group: 'Beyaz Eşya, Klima & QLED TV', origin: 'KR', accent: '#1428a0', photo: 'photos/televizyon-ultra.jpg', codes: ['4C', '5C', 'UE', 'CH05'] },
    { slug: 'lg', name: 'LG', group: 'Beyaz Eşya, Klima & OLED TV', origin: 'KR', accent: '#a50034', photo: 'photos/televizyon-ultra.jpg', codes: ['OE', 'IE', 'LE', 'CH38'] },
    { slug: 'vestel', name: 'Vestel', group: 'Beyaz Eşya, TV & Klima', origin: 'TR', accent: '#e30613', photo: 'photos/buzdolabi-ultra.jpg', codes: ['E01', 'E02', 'E03', 'SR'] },
    { slug: 'eca', name: 'E.C.A.', group: 'Yoğuşmalı Kombi & İklimlendirme', origin: 'TR', accent: '#004a99', photo: 'photos/kombi-maintenance.jpg', codes: ['E01', 'E03', 'F37', 'E05'] },
    { slug: 'vaillant', name: 'Vaillant', group: 'Yoğuşmalı Kombi & Isı Pompası', origin: 'DE', accent: '#007a53', photo: 'photos/kombi-maintenance.jpg', codes: ['F28', 'F22', 'F29', 'F75'] },
    { slug: 'viessmann', name: 'Viessmann', group: 'Yoğuşmalı Kombi & Klima', origin: 'DE', accent: '#e63312', photo: 'photos/kombi-maintenance.jpg', codes: ['F2', 'F4', 'F5', 'A9'] },
    { slug: 'buderus', name: 'Buderus', group: 'Yoğuşmalı Kombi & Kazan', origin: 'DE', accent: '#004f9f', photo: 'photos/kombi-maintenance.jpg', codes: ['6A', '4C', '3C', '2E'] },
    { slug: 'demirdokum', name: 'DemirDöküm', group: 'Kombi, Klima & Şofben', origin: 'TR', accent: '#d40f2a', photo: 'photos/kombi-maintenance.jpg', codes: ['F4', 'F5', 'F10', 'F28'] },
    { slug: 'baymak', name: 'Baymak', group: 'Yoğuşmalı Kombi & Klima', origin: 'TR', accent: '#f36f21', photo: 'photos/kombi-maintenance.jpg', codes: ['E01', 'E03', 'E10', 'E25'] },
    { slug: 'alarko', name: 'Alarko', group: 'Yoğuşmalı Kombi, Kazan & Klima', origin: 'TR', accent: '#d40f2a', photo: 'photos/kombi-maintenance.jpg', codes: ['E01', 'E02', 'H02', 'L03'] },
    { slug: 'baykan', name: 'Baykan', group: 'Yoğuşmalı Kombi & Isıtma', origin: 'TR', accent: '#00529b', photo: 'photos/kombi-maintenance.jpg', codes: ['E01', 'E02', 'E04', 'E10'] },
    { slug: 'altus', name: 'Altus', group: 'Beyaz Eşya & Klima', origin: 'TR', accent: '#00629b', photo: 'photos/camasir-bulasik-ultra.jpg', codes: ['E01', 'E05', 'H20', 'E18'] },
    { slug: 'miele', name: 'Miele', group: 'Premium Ankastre & Beyaz Eşya', origin: 'DE', accent: '#8c0014', photo: 'photos/ankastre-kitchen.jpg', codes: ['F11', 'F16', 'F20', 'F138'] },
    { slug: 'electrolux', name: 'Electrolux', group: 'Beyaz Eşya & Endüstriyel Mutfak', origin: 'SE', accent: '#041e42', photo: 'photos/endustriyel-mutfak-ultra.jpg', codes: ['E10', 'E20', 'E40', 'i20'] },
    { slug: 'aeg', name: 'AEG', group: 'Ankastre & Beyaz Eşya', origin: 'DE', accent: '#d4001a', photo: 'photos/ankastre-kitchen.jpg', codes: ['E10', 'E20', 'i30', 'EF0'] },
    { slug: 'regal', name: 'Regal', group: 'Beyaz Eşya, TV & Klima', origin: 'TR', accent: '#c8102e', photo: 'photos/buzdolabi-ultra.jpg', codes: ['E01', 'E02', 'E03', 'E04'] },
    { slug: 'seg', name: 'SEG', group: 'Beyaz Eşya, TV & Klima', origin: 'TR', accent: '#1b365d', photo: 'photos/camasir-bulasik-ultra.jpg', codes: ['E01', 'E03', 'E04', 'LF'] },
    { slug: 'sharp', name: 'Sharp', group: 'No-Frost Buzdolabı & TV', origin: 'JP', accent: '#e60012', photo: 'photos/buzdolabi-ultra.jpg', codes: ['EE', 'U1', 'E2', 'H35'] },
    { slug: 'hotpoint', name: 'Hotpoint', group: 'Beyaz Eşya & Ankastre', origin: 'IT', accent: '#b51b26', photo: 'photos/camasir-bulasik-ultra.jpg', codes: ['F05', 'F01', 'F08', 'H20'] },
    { slug: 'ariston', name: 'Ariston', group: 'Kombi, Beyaz Eşya & Termosifon', origin: 'IT', accent: '#c4161c', photo: 'photos/kombi-maintenance.jpg', codes: ['501', '101', '108', '607'] },
    { slug: 'indesit', name: 'Indesit', group: 'Beyaz Eşya', origin: 'IT', accent: '#007bc0', photo: 'photos/camasir-bulasik-ultra.jpg', codes: ['F05', 'F06', 'F08', 'F15'] },
    { slug: 'ferroli', name: 'Ferroli', group: 'Yoğuşmalı Kombi & Klima', origin: 'IT', accent: '#e85d04', photo: 'photos/kombi-maintenance.jpg', codes: ['A01', 'A03', 'F37', 'F05'] },
    { slug: 'airfel', name: 'Airfel', group: 'Yoğuşmalı Kombi & Inverter Klima', origin: 'TR', accent: '#0072ce', photo: 'photos/klima-service.jpg', codes: ['C1 06', 'C1 11', 'C1 33', 'U4'] },
    { slug: 'protherm', name: 'Protherm', group: 'Yoğuşmalı Kombi & Isıtma', origin: 'EU', accent: '#d40f2a', photo: 'photos/kombi-maintenance.jpg', codes: ['F28', 'F22', 'F29', 'F62'] },
    { slug: 'immergas', name: 'Immergas', group: 'Yoğuşmalı Kombi', origin: 'IT', accent: '#d22630', photo: 'photos/kombi-maintenance.jpg', codes: ['E01', 'E02', 'E10', 'E11'] },
    { slug: 'lambert', name: 'Lambert', group: 'Yoğuşmalı Kombi & Isıtma', origin: 'TR', accent: '#1e3a5f', photo: 'photos/kombi-maintenance.jpg', codes: ['E01', 'E03', 'E10', 'E35'] },
    { slug: 'gaggenau', name: 'Gaggenau', group: 'Lüks Ankastre Mutfak', origin: 'DE', accent: '#1f2328', photo: 'photos/ankastre-kitchen.jpg', codes: ['E15', 'E0111', 'E24', 'D3'] },
    { slug: 'franke', name: 'Franke', group: 'Ankastre Fırın, Ocak & Davlumbaz', origin: 'CH', accent: '#c8102e', photo: 'photos/ankastre-kitchen.jpg', codes: ['F02', 'F05', 'E12', 'ER1'] },
    { slug: 'teka', name: 'Teka', group: 'Ankastre Fırın & İndüksiyon Ocak', origin: 'DE', accent: '#c8102e', photo: 'photos/ankastre-kitchen.jpg', codes: ['ER03', 'ER22', 'F4', 'E2'] },
    { slug: 'beretta', name: 'Beretta', group: 'Kombi & Kazan Sistemleri', origin: 'IT', accent: '#b5121b', photo: 'photos/kombi-maintenance.jpg', codes: ['A01', 'A02', 'A04', 'A06'] },
    { slug: 'zanussi', name: 'Zanussi', group: 'Beyaz Eşya & Endüstriyel Mutfak', origin: 'IT', accent: '#1f2937', photo: 'photos/endustriyel-mutfak-ultra.jpg', codes: ['E10', 'E20', 'E40', 'i20'] },
    { slug: 'westinghouse', name: 'Westinghouse', group: 'Beyaz Eşya & Soğutma', origin: 'US', accent: '#0033a0', photo: 'photos/buzdolabi-ultra.jpg', codes: ['SY EF', '5Y CE', 'E10', 'E20'] },
    { slug: 'amana', name: 'Amana', group: 'Gardırop Tipi Buzdolabı', origin: 'US', accent: '#004b87', photo: 'photos/buzdolabi-ultra.jpg', codes: ['E1', 'E2', 'CF', 'PO'] }
  ];

  function slugifyTr(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || ('marka-' + Date.now());
  }

  function getBrandUrl(slug, prefix) {
    const pre = prefix || './';
    return `${pre}marka-servisi/index.html?marka=${encodeURIComponent(slug)}`;
  }

  function getServiceUrl(slug, prefix) {
    const pre = prefix || './';
    return `${pre}marka-servisi/index.html?hizmet=${encodeURIComponent(slug)}`;
  }

  function getLocalLandingUrl(provSlug, distName, brandSlug, prefix) {
    const pre = prefix || './';
    const dSlug = slugifyTr(distName || 'merkez');
    return `${pre}marka-servisi/index.html?marka=${encodeURIComponent(brandSlug)}&il=${encodeURIComponent(provSlug)}&ilce=${encodeURIComponent(dSlug)}`;
  }

  // Authentic Custom Vector SVG Brand Wordmarks & Emblems for All 38 Brands
  const CUSTOM_BRAND_SVGS = {
    bosch: `<svg viewBox="0 0 138 34" width="138" height="34" role="img" aria-label="Bosch Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="17" r="11" fill="none" stroke="#64748b" stroke-width="2.2"/>
      <path d="M12 10.5v13M20 10.5v13M12 17h8" stroke="#64748b" stroke-width="2.1" stroke-linecap="round"/>
      <text x="34" y="23.5" fill="#e20015" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="18.5" font-weight="900" letter-spacing="0.04em">BOSCH</text>
    </svg>`,
    arcelik: `<svg viewBox="0 0 132 34" width="132" height="34" role="img" aria-label="Arçelik Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="22" height="22" rx="6" fill="#e30613"/>
      <path d="M9.5 21.5L14 11.5l4.5 10M11 18.5h6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="32" y="23.5" fill="#e30613" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-size="19.5" font-weight="800" letter-spacing="-0.03em">arçelik</text>
    </svg>`,
    beko: `<svg viewBox="0 0 112 34" width="112" height="34" role="img" aria-label="Beko Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="8" y="24.5" fill="#0054a6" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-size="23" font-weight="900" letter-spacing="-0.04em">beko</text>
      <path d="M8 28.5c18 2.4 42 2.4 62 0" stroke="#0082ca" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    </svg>`,
    siemens: `<svg viewBox="0 0 136 34" width="136" height="34" role="img" aria-label="Siemens Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="6" y="23.5" fill="#009999" font-family="'Plus Jakarta Sans','Segoe UI',sans-serif" font-size="18.5" font-weight="900" letter-spacing="0.09em">SIEMENS</text>
    </svg>`,
    profilo: `<svg viewBox="0 0 132 34" width="132" height="34" role="img" aria-label="Profilo Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6.5" width="124" height="21" rx="6" fill="#004b93"/>
      <text x="65" y="22" text-anchor="middle" fill="#ffffff" font-family="'Plus Jakarta Sans',sans-serif" font-size="14.5" font-weight="800" letter-spacing="0.09em">PROFİLO</text>
    </svg>`,
    samsung: `<svg viewBox="0 0 138 34" width="138" height="34" role="img" aria-label="Samsung Servisi" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="69" cy="17" rx="63" ry="12.5" transform="rotate(-3 69 17)" fill="#1428a0"/>
      <text x="69" y="21.8" text-anchor="middle" fill="#ffffff" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="13.5" font-weight="900" letter-spacing="0.11em">SAMSUNG</text>
    </svg>`,
    lg: `<svg viewBox="0 0 104 34" width="104" height="34" role="img" aria-label="LG Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="17" r="12" fill="#a50034"/>
      <path d="M18 9.2a7.8 7.8 0 1 0 7.8 7.8h-5.2" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M17.8 12.5v6h3" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>
      <circle cx="14.6" cy="13.8" r="1.2" fill="#fff"/>
      <text x="37" y="23.5" fill="currentColor" font-family="'Plus Jakarta Sans',sans-serif" font-size="19.5" font-weight="800" letter-spacing="0.03em">LG</text>
    </svg>`,
    vestel: `<svg viewBox="0 0 128 34" width="128" height="34" role="img" aria-label="Vestel Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="6" y="23.5" fill="#e30613" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-style="italic" font-size="19" font-weight="900" letter-spacing="0.06em">VESTEL</text>
    </svg>`,
    eca: `<svg viewBox="0 0 118 34" width="118" height="34" role="img" aria-label="ECA Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5.5" width="110" height="23" rx="6" fill="#004a99"/>
      <rect x="3" y="24.5" width="110" height="4" rx="2" fill="#e30613"/>
      <text x="58" y="21.5" text-anchor="middle" fill="#ffffff" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="15.5" font-weight="900" letter-spacing="0.08em">E.C.A.</text>
    </svg>`,
    vaillant: `<svg viewBox="0 0 140 34" width="140" height="34" role="img" aria-label="Vaillant Servisi" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="17" rx="13" ry="11" fill="#007a53"/>
      <path d="M14 11c1.2 3.5 1.8 5.2 4 6.2 2.2-1 2.8-2.7 4-6.2M15 20.5c1.8 1.2 4.2 1.2 6 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <text x="36" y="23" fill="#007a53" font-family="Georgia,'Plus Jakarta Sans',serif" font-size="19.5" font-weight="700">Vaillant</text>
    </svg>`,
    viessmann: `<svg viewBox="0 0 148 34" width="148" height="34" role="img" aria-label="Viessmann Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6.5" width="142" height="21" rx="5" fill="#e63312"/>
      <text x="74" y="21.8" text-anchor="middle" fill="#ffffff" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="13.5" font-weight="900" letter-spacing="0.09em">VIESSMANN</text>
    </svg>`,
    buderus: `<svg viewBox="0 0 134 34" width="134" height="34" role="img" aria-label="Buderus Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6.5" width="128" height="21" rx="4" fill="#004f9f"/>
      <text x="67" y="22.2" text-anchor="middle" fill="#ffffff" font-family="'Plus Jakarta Sans',sans-serif" font-size="15.5" font-weight="800" letter-spacing="0.04em">Buderus</text>
    </svg>`,
    demirdokum: `<svg viewBox="0 0 156 34" width="156" height="34" role="img" aria-label="DemirDöküm Servisi" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 6c4.5 4 6.5 8 4.5 13.5-1.5 3.5-5 5.5-8 4 2-2.5 2.2-5.5.5-8.5C8.5 19 6 22 8 26c-4.5-2-6-7.5-3-12.5C7 10 10.5 8 13 6z" fill="#d40f2a"/>
      <text x="24" y="22.8" fill="#d40f2a" font-family="'Plus Jakarta Sans',sans-serif" font-size="16.5" font-weight="800" letter-spacing="-0.02em">DemirDöküm</text>
    </svg>`,
    baymak: `<svg viewBox="0 0 132 34" width="132" height="34" role="img" aria-label="Baymak Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="17" r="9.5" fill="none" stroke="#f36f21" stroke-width="2.6"/>
      <circle cx="16" cy="17" r="4" fill="#f36f21"/>
      <text x="31" y="23" fill="#f36f21" font-family="'Plus Jakarta Sans',sans-serif" font-size="19" font-weight="800" letter-spacing="-0.02em">baymak</text>
    </svg>`,
    alarko: `<svg viewBox="0 0 136 34" width="136" height="34" role="img" aria-label="Alarko Servisi" xmlns="http://www.w3.org/2000/svg">
      <polygon points="14,6 25,26 3,26" fill="none" stroke="#d40f2a" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="14" cy="19.5" r="3" fill="#005596"/>
      <text x="31" y="23" fill="#005596" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="16.5" font-weight="900" letter-spacing="0.06em">ALARKO</text>
    </svg>`,
    baykan: `<svg viewBox="0 0 134 34" width="134" height="34" role="img" aria-label="Baykan Servisi" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 7c4 4.5 5.5 8.5 3.5 13.5-1.5 3.5-5 5-7.5 3.5 2-2.5 2-5 0-8-2 3.5-3.5 6.5-1.5 9.5-4-2-5-7-2-12C7.5 10.5 10.5 8.5 13 7z" fill="#f58220"/>
      <text x="24" y="23" fill="#00529b" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="16.5" font-weight="900" letter-spacing="0.05em">BAYKAN</text>
    </svg>`,
    miele: `<svg viewBox="0 0 116 34" width="116" height="34" role="img" aria-label="Miele Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="24" fill="#8c0014" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="23" font-weight="700" letter-spacing="0.02em">Miele</text>
    </svg>`,
    altus: `<svg viewBox="0 0 120 34" width="120" height="34" role="img" aria-label="Altus Servisi" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 9.5c26-4.5 68-4.5 96 0" stroke="#00a3e0" stroke-width="2.3" stroke-linecap="round" fill="none"/>
      <text x="58" y="24.5" text-anchor="middle" fill="#00629b" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="17.5" font-weight="900" letter-spacing="0.09em">ALTUS</text>
    </svg>`,
    electrolux: `<svg viewBox="0 0 148 34" width="148" height="34" role="img" aria-label="Electrolux Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="17" r="10.5" fill="#041e42"/>
      <path d="M7.5 17c4.5 0 7.5-3.2 7.5-7.5 0 4.3 3 7.5 7.5 7.5-4.5 0-7.5 3.2-7.5 7.5 0-4.3-3-7.5-7.5-7.5z" fill="#ffffff"/>
      <text x="31" y="22.8" fill="currentColor" font-family="'Plus Jakarta Sans',sans-serif" font-size="17.5" font-weight="800" letter-spacing="-0.01em">Electrolux</text>
    </svg>`,
    aeg: `<svg viewBox="0 0 98 34" width="98" height="34" role="img" aria-label="AEG Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="24.5" fill="#d4001a" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="22" font-weight="900" letter-spacing="0.12em">AEG</text>
    </svg>`,
    regal: `<svg viewBox="0 0 118 34" width="118" height="34" role="img" aria-label="Regal Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="17" r="7" fill="#c8102e"/>
      <circle cx="13" cy="17" r="3" fill="#fff"/>
      <text x="26" y="23.5" fill="#c8102e" font-family="'Plus Jakarta Sans',sans-serif" font-size="18.5" font-weight="900" letter-spacing="0.06em">REGAL</text>
    </svg>`,
    seg: `<svg viewBox="0 0 100 34" width="100" height="34" role="img" aria-label="SEG Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6.5" width="88" height="21" rx="5" fill="none" stroke="#1b365d" stroke-width="2.4"/>
      <text x="49" y="22.5" text-anchor="middle" fill="currentColor" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="16.5" font-weight="900" letter-spacing="0.14em">SEG</text>
    </svg>`,
    sharp: `<svg viewBox="0 0 122 34" width="122" height="34" role="img" aria-label="Sharp Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="8" y="23.5" fill="#e60012" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="19" font-weight="900" letter-spacing="0.09em">SHARP</text>
    </svg>`,
    hotpoint: `<svg viewBox="0 0 132 34" width="132" height="34" role="img" aria-label="Hotpoint Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="17" r="8.5" fill="#b51b26"/>
      <path d="M10 17h10" stroke="#fff" stroke-width="2.1"/>
      <text x="29" y="22.8" fill="currentColor" font-family="'Plus Jakarta Sans',sans-serif" font-size="17.5" font-weight="800">Hotpoint</text>
    </svg>`,
    ariston: `<svg viewBox="0 0 136 34" width="136" height="34" role="img" aria-label="Ariston Servisi" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19c4-8 13-10 18-3-4 8-13 10-18 3z" fill="#c4161c"/>
      <text x="29" y="23" fill="#c4161c" font-family="'Plus Jakarta Sans',sans-serif" font-size="17.5" font-weight="800" letter-spacing="0.06em">ARISTON</text>
    </svg>`,
    indesit: `<svg viewBox="0 0 132 34" width="132" height="34" role="img" aria-label="Indesit Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="17" r="9.5" fill="none" stroke="#007bc0" stroke-width="2.3"/>
      <line x1="15" y1="14.5" x2="15" y2="21.5" stroke="#007bc0" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="15" cy="11.2" r="1.4" fill="#007bc0"/>
      <text x="30" y="23" fill="#007bc0" font-family="'Plus Jakarta Sans',sans-serif" font-size="17.5" font-weight="800" letter-spacing="0.05em">INDESIT</text>
    </svg>`,
    ferroli: `<svg viewBox="0 0 126 34" width="126" height="34" role="img" aria-label="Ferroli Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="7" width="18" height="20" rx="4" fill="#e85d04"/>
      <text x="14" y="22" text-anchor="middle" fill="#fff" font-family="'Arial Black',sans-serif" font-size="14" font-weight="900">F</text>
      <text x="30" y="23" fill="currentColor" font-family="'Plus Jakarta Sans',sans-serif" font-size="18.5" font-weight="800">Ferroli</text>
    </svg>`,
    airfel: `<svg viewBox="0 0 122 34" width="122" height="34" role="img" aria-label="Airfel Servisi" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 15c5-4 10 4 15 0M6 20c5-4 10 4 15 0" stroke="#0072ce" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <text x="27" y="23.5" fill="#0072ce" font-family="'Plus Jakarta Sans',sans-serif" font-size="20" font-weight="800" letter-spacing="-0.02em">airfel</text>
    </svg>`,
    protherm: `<svg viewBox="0 0 138 34" width="138" height="34" role="img" aria-label="Protherm Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="8" height="18" rx="3" fill="#d40f2a"/>
      <text x="18" y="23" fill="currentColor" font-family="'Plus Jakarta Sans',sans-serif" font-size="18.5" font-weight="800" letter-spacing="-0.01em">protherm</text>
      <path d="M18 27h96" stroke="#d40f2a" stroke-width="2.2"/>
    </svg>`,
    immergas: `<svg viewBox="0 0 142 34" width="142" height="34" role="img" aria-label="Immergas Servisi" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 7c3.5 4 4.5 7.5 2.5 12-1 2.5-3.5 4-5.5 3 1.5-2 1.5-4.5 0-6.5-1.5 2.5-2.5 5-1 7.5-3-1.5-4-5.5-1.5-9.5C8 10.5 10 8.5 12 7z" fill="#d22630"/>
      <text x="23" y="22.8" fill="#d22630" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="15.5" font-weight="900" letter-spacing="0.05em">IMMERGAS</text>
    </svg>`,
    lambert: `<svg viewBox="0 0 134 34" width="134" height="34" role="img" aria-label="Lambert Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6.5" width="126" height="21" rx="5" fill="#1e3a5f"/>
      <text x="67" y="22" text-anchor="middle" fill="#ffffff" font-family="'Plus Jakarta Sans',sans-serif" font-size="14.5" font-weight="800" letter-spacing="0.1em">LAMBERT</text>
    </svg>`,
    gaggenau: `<svg viewBox="0 0 148 34" width="148" height="34" role="img" aria-label="Gaggenau Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="6" y="22.5" fill="currentColor" font-family="'Plus Jakarta Sans',sans-serif" font-size="15.5" font-weight="800" letter-spacing="0.18em">GAGGENAU</text>
    </svg>`,
    franke: `<svg viewBox="0 0 128 34" width="128" height="34" role="img" aria-label="Franke Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="14" height="14" rx="2" fill="#c8102e"/>
      <text x="24" y="23" fill="#c8102e" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="17" font-weight="900" letter-spacing="0.08em">FRANKE</text>
    </svg>`,
    teka: `<svg viewBox="0 0 108 34" width="108" height="34" role="img" aria-label="Teka Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="7" width="20" height="20" rx="3" fill="#c8102e"/>
      <path d="M10 12h10M15 12v10" stroke="#fff" stroke-width="2.4"/>
      <text x="32" y="23.5" fill="currentColor" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="18.5" font-weight="900" letter-spacing="0.08em">TEKA</text>
    </svg>`,
    beretta: `<svg viewBox="0 0 128 34" width="128" height="34" role="img" aria-label="Beretta Servisi" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="64" cy="17" rx="58" ry="11.5" fill="none" stroke="#b5121b" stroke-width="2.2"/>
      <text x="64" y="22" text-anchor="middle" fill="#b5121b" font-family="'Plus Jakarta Sans',sans-serif" font-size="15.5" font-weight="800" letter-spacing="0.05em">Beretta</text>
    </svg>`,
    zanussi: `<svg viewBox="0 0 132 34" width="132" height="34" role="img" aria-label="Zanussi Servisi" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="24.5" width="118" height="3.5" rx="1.5" fill="#eab308"/>
      <text x="63" y="21.5" text-anchor="middle" fill="currentColor" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="16.5" font-weight="900" letter-spacing="0.09em">ZANUSSI</text>
    </svg>`,
    westinghouse: `<svg viewBox="0 0 158 34" width="158" height="34" role="img" aria-label="Westinghouse Servisi" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="17" r="10" fill="none" stroke="#0033a0" stroke-width="2.1"/>
      <path d="M10 14l2.5 6 2.5-4.5 2.5 4.5 2.5-6" fill="none" stroke="#0033a0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="30" y="22.2" fill="#0033a0" font-family="'Plus Jakarta Sans',sans-serif" font-size="15.5" font-weight="800">Westinghouse</text>
    </svg>`,
    amana: `<svg viewBox="0 0 120 34" width="120" height="34" role="img" aria-label="Amana Servisi" xmlns="http://www.w3.org/2000/svg">
      <text x="60" y="23.2" text-anchor="middle" fill="#004b87" font-family="'Arial Black','Plus Jakarta Sans',sans-serif" font-size="18.5" font-weight="900" letter-spacing="0.11em">AMANA</text>
    </svg>`
  };

  function getCustomBrands() {
    try {
      const raw = localStorage.getItem(CUSTOM_BRANDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function getAllBrands() {
    return [...getCustomBrands(), ...BRANDS];
  }

  function getActiveBrands() {
    const cfg = getConfig();
    const list = getAllBrands().filter(b => !cfg.disabledBrands.includes(b.slug));
    return list.length ? list : BRANDS.slice(0, 8);
  }

  function addCustomBrand(entry) {
    const slug = slugifyTr(entry.name);
    const all = getAllBrands();
    if (all.some(b => b.slug === slug)) return all;
    const item = {
      slug,
      name: (entry.name || 'Yeni Marka').trim(),
      group: (entry.group || 'Beyaz Eşya & Kombi').trim(),
      origin: 'TR',
      accent: entry.accent || '#0066ff',
      photo: 'photos/hero-technician-kitchen.jpg',
      codes: Array.isArray(entry.codes) && entry.codes.length
        ? entry.codes
        : String(entry.codes || 'E01, F02').split(',').map(s => s.trim()).filter(Boolean),
      isCustom: true
    };
    const next = [item, ...getCustomBrands()];
    try { localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(next)); } catch {}
    return getAllBrands();
  }

  function toggleBrandActive(slug) {
    const cfg = getConfig();
    const set = new Set(cfg.disabledBrands);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    saveConfig({ disabledBrands: Array.from(set) });
    return getAllBrands();
  }

  function renderBrandMarkSvg(brand) {
    if (!brand) return '';
    if (CUSTOM_BRAND_SVGS[brand.slug]) {
      return CUSTOM_BRAND_SVGS[brand.slug];
    }
    const label = String(brand.name || 'MARKA').toUpperCase();
    const accent = brand.accent || '#0066ff';
    const w = Math.max(118, label.length * 10 + 36);
    return `<svg viewBox="0 0 ${w} 34" width="${w}" height="34" role="img" aria-label="${brand.name} Özel Teknik Servis" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="18" height="20" rx="5" fill="${accent}"/>
      <text x="12" y="21.5" text-anchor="middle" fill="#fff" font-family="'Plus Jakarta Sans',sans-serif" font-size="12" font-weight="800">${label.charAt(0)}</text>
      <text x="28" y="22.5" fill="currentColor" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-size="14.5" font-weight="800" letter-spacing="0.05em">${label}</text>
    </svg>`;
  }

  // Real Fault-Code Diagnostic Knowledge Base (Expanded for ECA, Alarko, Baykan & Endustriyel)
  const FAULT_DATABASE = [
    {
      code: 'E18',
      brands: ['bosch', 'siemens', 'arcelik', 'altus', 'profilo'],
      device: 'Çamaşır Makinesi',
      title: 'Tahliye Pompası veya Gider Akış Tıkanıklığı',
      symptom: 'Makine kazan içindeki suyu boşaltamıyor, sıkma adımına geçmeden duruyor.',
      cause: 'Tahliye pompa pervanesine yabancı cisim sıkışması, pompa motoru sargı arızası veya körük hortumu tıkanıklığı.',
      action: 'Ön alt filtre kapağını açıp suyu tahliye edin; hata sürerse pompa motoru yerinde orijinal parçayla 35 dakikada değiştirilir.',
      durationMin: 35,
      warranty: '1 Yıl Orijinal Pompa Garantisi'
    },
    {
      code: 'F28',
      brands: ['vaillant', 'protherm', 'demirdokum', 'eca'],
      device: 'Yoğuşmalı Kombi',
      title: 'Ateşleme Başarısız — Alev Oluşmuyor',
      symptom: 'Kombi ateşleme denemesi yapıyor ancak peteklere veya sıcak suya ısı vermeden kırmızı arıza lambası yakıyor.',
      cause: 'Gaz valfi selenoid arızası, iyonizasyon elektrodu kurumlanması veya elektronik anakart ateşleme rölesi kesintisi.',
      action: 'Daire gaz vanasını kontrol edip 1 kez resetleyin; tekrar F28 verirse gaz valfi ve iyonizasyon testi cihaz başında yapılır.',
      durationMin: 45,
      warranty: '1 Yıl Parça & İşçilik Garantisi'
    },
    {
      code: 'F22',
      brands: ['vaillant', 'protherm', 'siemens', 'eca', 'baykan'],
      device: 'Kombi & Isıtma',
      title: 'Tesisat Su Basıncı Düşük (Kuru Yanma Koruması)',
      symptom: 'Kombi ekranında F22 / E10 yanıp sönüyor, sirkülasyon pompası korumaya geçtiği için cihaz çalışmıyor.',
      cause: 'Tesisat basıncının 0.8 bar altına düşmesi, genleşme tankı diyafram havası kaybı veya doldurma musluğu kaçırması.',
      action: 'Alt doldurma musluğuyla basıncı 1.5 bar seviyesine getirin; basınç tekrar düşüyorsa genleşme tankı azot basımı yapılır.',
      durationMin: 30,
      warranty: '1 Yıl Tesisat & Parça Garantisi'
    },
    {
      code: 'E15',
      brands: ['bosch', 'siemens', 'profilo', 'gaggenau'],
      device: 'Bulaşık Makinesi',
      title: 'Alt Taban Su Kaçağı (AquaStop Emniyet Kilidi)',
      symptom: 'Musluk işareti yanıyor, tahliye pompası makine kapalıyken bile sürekli çalışmaya devam ediyor.',
      cause: 'Kazan hazne contası sızıntısı nedeniyle alt emniyet tavasına su dolması ve şamandıra sensörünün devreye girmesi.',
      action: 'Cihazın fişini çekip su vanasını kapatın; alt hazne sızdırmazlık revizyonu yerinde özel conta kitiyle tamamlanır.',
      durationMin: 40,
      warranty: '1 Yıl Sızdırmazlık Garantisi'
    },
    {
      code: '4C',
      brands: ['samsung', 'buderus'],
      device: 'Çamaşır / Bulaşık Makinesi',
      title: 'Su Giriş Valfleri Besleme Kesintisi',
      symptom: 'Yıkama programı başlıyor fakat tambura su alınamadığı için birkaç dakika sonra 4C uyarısı veriyor.',
      cause: 'Elektromanyetik su giriş ventili arızası, giriş hortumu kireç filtresi tıkanıklığı veya prosestat basınç hatası.',
      action: 'Musluk basıncı normalse çiftli su giriş ventili ve seviye sensörü yerinde ölçülerek yenilenir.',
      durationMin: 30,
      warranty: '1 Yıl Orijinal Ventil Garantisi'
    },
    {
      code: 'OE',
      brands: ['lg'],
      device: 'Direct Drive Çamaşır Makinesi',
      title: 'Kazan Su Tahliye Zaman Aşımı',
      symptom: 'Durulama veya sıkma aşamasında su kazanda kalıyor ve ekranda OE kodu sabitleniyor.',
      cause: 'BLDC tahliye pompa motoru arızası veya basınç anahtarı hortumunda tortu birikimi.',
      action: 'BLDC sessiz tahliye pompası yerinde ölçülüp orijinal LG uyumlu pompa grubuyla değiştirilir.',
      durationMin: 35,
      warranty: '1 Yıl Orijinal Parça Garantisi'
    },
    {
      code: 'F4',
      brands: ['demirdokum', 'viessmann', 'teka', 'alarko'],
      device: 'Yoğuşmalı Kombi / Ankastre',
      title: 'İyonizasyon ve Alev Algılama Kesintisi',
      symptom: 'Brülör kısa süre yanıp sönüyor veya hiç alev almadan F4 uyarısına düşüyor.',
      cause: 'İyonizasyon çubuğu oksitlenmesi, baca prosestatı hava akış yetersizliği veya gaz grup arızası.',
      action: 'Yanma odası temizliği, baca çekiş ölçümü ve elektrot değişimi tek ziyarette tamamlanır.',
      durationMin: 45,
      warranty: '1 Yıl Parça & İşçilik Garantisi'
    },
    {
      code: 'E01',
      brands: ['vestel', 'arcelik', 'baymak', 'eca', 'alarko', 'baykan', 'regal', 'seg', 'altus', 'lambert', 'immergas'],
      device: 'Buzdolabı / Kombi / Çamaşır',
      title: 'Sensör (NTC) veya Ateşleme Kontrol Hatası',
      symptom: 'Soğutucu bölme yeterince soğutmuyor ya da kombi ilk ateşleme çevrimini tamamlayamıyor.',
      cause: 'Evaporatör NTC ısı sensörü sapması, defrost rezistansı kesintisi veya ateşleme kartı voltaj dalgalanması.',
      action: 'Dijital ohm ölçümüyle arızalı sensör veya kart tespit edilip yerinde garantili değiştirilir.',
      durationMin: 40,
      warranty: '1 Yıl Elektronik Parça Garantisi'
    },
    {
      code: 'CH05',
      brands: ['samsung', 'lg', 'airfel', 'vestel', 'arcelik', 'beko'],
      device: 'Inverter Klima',
      title: 'İç ve Dış Ünite Haberleşme / Gaz Basınç Hatası',
      symptom: 'Klima fan üflüyor fakat soğutma veya ısıtmaya geçmeden dış üniteyi durduruyor.',
      cause: 'Dış ünite inverter IPM kart haberleşme kesintisi veya R32/R410A soğutucu akışkan basınç kaybı.',
      action: 'Manometre ile gaz kaçağı testi ve dış ünite haberleşme hattı onarımı yerinde uygulanır.',
      durationMin: 50,
      warranty: '1 Yıl Onarım Garantisi'
    },
    {
      code: 'DEF',
      brands: ['electrolux', 'zanussi', 'bosch', 'arcelik'],
      device: 'Soğuk Hava Deposu / Sanayi Buzdolabı',
      title: 'Ticari Soğutma Defrost & Kompresör Yüksek Basınç Uyarısı',
      symptom: 'Soğuk hava deposu veya endüstriyel dolap hedef +2°C / -18°C derecesine inmiyor, evaporatör karlanma yapıyor.',
      cause: 'Defrost rezistansı kesintisi, kondanser fan motoru sıkışması veya R404A/R134a gaz basınç düşüşü.',
      action: 'İşletmenizdeki ürünler bozulmadan 35 dakikada acil soğutma ekibimiz müdahale edip kompresör/gaz revizyonunu tamamlar.',
      durationMin: 35,
      warranty: '1 Yıl Ticari Soğutma Garantisi'
    }
  ];

  function getFaults() {
    try {
      const raw = localStorage.getItem(CUSTOM_FAULTS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [...FAULT_DATABASE];
  }

  function addFault(entry) {
    const cur = getFaults();
    const code = String(entry.code || 'E99').trim().toUpperCase();
    const filtered = cur.filter(f => f.code.toUpperCase() !== code);
    const next = [{
      code,
      brands: Array.isArray(entry.brands) ? entry.brands : String(entry.brands || 'bosch, arcelik').split(',').map(s => slugifyTr(s.trim())).filter(Boolean),
      device: (entry.device || 'Beyaz Eşya').trim(),
      title: (entry.title || 'Elektronik Kontrol Hatası').trim(),
      symptom: (entry.symptom || 'Cihaz güvenlik moduna geçerek çalışmayı durduruyor.').trim(),
      cause: (entry.cause || 'Sensör veya elektronik kontrol modülü arızası.').trim(),
      action: (entry.action || 'Yerinde dijital ölçümle arızalı parça tespit edilip garantili değiştirilir.').trim(),
      durationMin: Number(entry.durationMin) || 40,
      warranty: (entry.warranty || '1 Yıl Orijinal Parça Garantisi').trim()
    }, ...filtered];
    try { localStorage.setItem(CUSTOM_FAULTS_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function removeFault(code) {
    const next = getFaults().filter(f => f.code.toUpperCase() !== String(code).toUpperCase());
    const safe = next.length ? next : [...FAULT_DATABASE];
    try { localStorage.setItem(CUSTOM_FAULTS_KEY, JSON.stringify(safe)); } catch {}
    return safe;
  }

  // All 81 Provinces of Turkey + Representative Real Districts
  const PROVINCES = [
    { plate: '34', name: 'İstanbul', slug: 'istanbul', activeVans: 18, eta: 30, districts: ['Kadıköy', 'Beşiktaş', 'Üsküdar', 'Ataşehir', 'Bakırköy', 'Şişli', 'Pendik', 'Ümraniye', 'Maltepe', 'Başakşehir', 'Beylikdüzü', 'Sarıyer', 'Kartal', 'Bahçelievler', 'Küçükçekmece'] },
    { plate: '06', name: 'Ankara', slug: 'ankara', activeVans: 11, eta: 32, districts: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Etimesgut', 'Mamak', 'Sincan', 'Gölbaşı', 'Altındağ', 'Pursaklar'] },
    { plate: '35', name: 'İzmir', slug: 'izmir', activeVans: 10, eta: 32, districts: ['Karşıyaka', 'Bornova', 'Konak', 'Buca', 'Çiğli', 'Gaziemir', 'Balçova', 'Narlıdere', 'Urla', 'Bayraklı'] },
    { plate: '33', name: 'Mersin', slug: 'mersin', activeVans: 8, eta: 25, districts: ['Yenişehir', 'Mezitli', 'Toroslar', 'Akdeniz', 'Tarsus', 'Erdemli', 'Silifke'] },
    { plate: '01', name: 'Adana', slug: 'adana', activeVans: 6, eta: 30, districts: ['Çukurova', 'Seyhan', 'Yüreğir', 'Sarıçam', 'Ceyhan'] },
    { plate: '07', name: 'Antalya', slug: 'antalya', activeVans: 8, eta: 33, districts: ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat', 'Serik'] },
    { plate: '16', name: 'Bursa', slug: 'bursa', activeVans: 8, eta: 32, districts: ['Nilüfer', 'Osmangazi', 'Yıldırım', 'İnegöl', 'Mudanya', 'Gemlik'] },
    { plate: '41', name: 'Kocaeli', slug: 'kocaeli', activeVans: 6, eta: 34, districts: ['İzmit', 'Gebze', 'Darıca', 'Çayırova', 'Gölcük', 'Kartepe'] },
    { plate: '27', name: 'Gaziantep', slug: 'gaziantep', activeVans: 6, eta: 31, districts: ['Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye'] },
    { plate: '42', name: 'Konya', slug: 'konya', activeVans: 5, eta: 35, districts: ['Selçuklu', 'Meram', 'Karatay', 'Ereğli'] },
    { plate: '38', name: 'Kayseri', slug: 'kayseri', activeVans: 5, eta: 34, districts: ['Melikgazi', 'Kocasinan', 'Talas', 'İncesu'] },
    { plate: '26', name: 'Eskişehir', slug: 'eskisehir', activeVans: 4, eta: 30, districts: ['Odunpazarı', 'Tepebaşı', 'Sivrihisar'] },
    { plate: '55', name: 'Samsun', slug: 'samsun', activeVans: 4, eta: 35, districts: ['Atakum', 'İlkadım', 'Canik', 'Bafra'] },
    { plate: '31', name: 'Hatay', slug: 'hatay', activeVans: 4, eta: 36, districts: ['İskenderun', 'Antakya', 'Defne', 'Dörtyol', 'Arsuz'] },
    { plate: '79', name: 'Kilis', slug: 'kilis', activeVans: 3, eta: 25, districts: ['Merkez', 'Musabeyli', 'Elbeyli', 'Polateli'] },
    { plate: '20', name: 'Denizli', slug: 'denizli', activeVans: 4, eta: 34, districts: ['Pamukkale', 'Merkezefendi', 'Çivril'] },
    { plate: '48', name: 'Muğla', slug: 'mugla', activeVans: 5, eta: 38, districts: ['Bodrum', 'Fethiye', 'Marmaris', 'Menteşe', 'Milas'] },
    { plate: '54', name: 'Sakarya', slug: 'sakarya', activeVans: 4, eta: 34, districts: ['Adapazarı', 'Serdivan', 'Erenler', 'Hendek'] },
    { plate: '59', name: 'Tekirdağ', slug: 'tekirdag', activeVans: 4, eta: 35, districts: ['Çorlu', 'Süleymanpaşa', 'Çerkezköy', 'Kapaklı'] },
    { plate: '21', name: 'Diyarbakır', slug: 'diyarbakir', activeVans: 4, eta: 36, districts: ['Kayapınar', 'Bağlar', 'Yenişehir', 'Sur'] },
    { plate: '63', name: 'Şanlıurfa', slug: 'sanliurfa', activeVans: 4, eta: 36, districts: ['Karaköprü', 'Haliliye', 'Eyyübiye', 'Siverek'] },
    { plate: '44', name: 'Malatya', slug: 'malatya', activeVans: 3, eta: 36, districts: ['Yeşilyurt', 'Battalgazi'] },
    { plate: '61', name: 'Trabzon', slug: 'trabzon', activeVans: 4, eta: 35, districts: ['Ortahisar', 'Akçaabat', 'Yomra'] },
    { plate: '10', name: 'Balıkesir', slug: 'balikesir', activeVans: 4, eta: 36, districts: ['Altıeylül', 'Karesi', 'Bandırma', 'Edremit', 'Ayvalık'] },
    { plate: '09', name: 'Aydın', slug: 'aydin', activeVans: 4, eta: 35, districts: ['Efeler', 'Kuşadası', 'Nazilli', 'Söke', 'Didim'] },
    { plate: '45', name: 'Manisa', slug: 'manisa', activeVans: 4, eta: 35, districts: ['Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli'] }
  ];

  const OTHER_PROVINCES = [
    '02 Adıyaman', '03 Afyonkarahisar', '04 Ağrı', '05 Amasya', '08 Artvin', '11 Bilecik', '12 Bingöl', '13 Bitlis',
    '14 Bolu', '15 Burdur', '17 Çanakkale', '18 Çankırı', '19 Çorum', '22 Edirne', '23 Elazığ', '24 Erzincan',
    '25 Erzurum', '28 Giresun', '29 Gümüşhane', '30 Hakkari', '32 Isparta', '36 Kars', '37 Kastamonu', '39 Kırklareli',
    '40 Kırşehir', '43 Kütahya', '46 Kahramanmaraş', '47 Mardin', '49 Muş', '50 Nevşehir', '51 Niğde', '52 Ordu',
    '53 Rize', '56 Siirt', '57 Sinop', '58 Sivas', '60 Tokat', '62 Tunceli', '64 Uşak', '65 Van', '66 Yozgat',
    '67 Zonguldak', '68 Aksaray', '69 Bayburt', '70 Karaman', '71 Kırıkkale', '72 Batman', '73 Şırnak', '74 Bartın',
    '75 Ardahan', '76 Iğdır', '77 Yalova', '78 Karabük', '80 Osmaniye', '81 Düzce'
  ].map(item => {
    const [plate, ...rest] = item.split(' ');
    const name = rest.join(' ');
    return {
      plate,
      name,
      slug: name.toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u'),
      activeVans: 2,
      eta: 40,
      districts: ['Merkez', 'Yeni Mahalle', 'Cumhuriyet', 'Sanayi Bölgesi']
    };
  });

  const ALL_81_PROVINCES = [...PROVINCES, ...OTHER_PROVINCES].sort((a, b) => Number(a.plate) - Number(b.plate));

  // 10 Ultra-HD Photographed Service Branches (Covers Household + Industrial Kitchen + Cold Storage)
  const SERVICE_CATEGORIES = [
    { id: 'beyaz-esya', slug: 'beyaz-esya-servisi', name: 'Beyaz Eşya Servisi', photo: 'photos/hero-technician-kitchen.jpg', items: 'Çamaşır makinesi, bulaşık makinesi, buzdolabı, kurutma makinesi ve derin dondurucu yerinde garantili tamiri', feeNote: 'Arıza tespiti sonrası net fiyat onayı', avgMin: 35, startPriceTl: 750 },
    { id: 'buzdolabi', slug: 'buzdolabi-servisi', name: 'Buzdolabı Servisi & Tamircisi', photo: 'photos/buzdolabi-ultra.jpg', items: 'No-Frost ve gardırop tipi buzdolabı inverter kompresör, R600a gaz dolumu, fan, sensör ve anakart onarımı', feeNote: 'Gıdalarınız bozulmadan aynı gün acil müdahale', avgMin: 40, startPriceTl: 850 },
    { id: 'camasir-bulasik', slug: 'camasir-makinesi-servisi', name: 'Çamaşır & Bulaşık Makinesi Servisi', photo: 'photos/camasir-bulasik-ultra.jpg', items: 'Tahliye pompası, kazan rulman, körük lastiği, AquaStop su kaçağı, ısıtıcı rezistans ve elektronik kart tamiri', feeNote: 'Araç içi orijinal yedek parçayla tek ziyarette çözüm', avgMin: 35, startPriceTl: 750 },
    { id: 'kombi', slug: 'kombi-servisi', name: 'Kombi Servisi, Tamiri & Yıllık Bakım', photo: 'photos/kombi-maintenance.jpg', items: 'Yoğuşmalı kombi anakart, gaz valfi, üç yollu vana, eşanjör, sirkülasyon pompası ve kışlık periyodik bakım', feeNote: 'Baca gazı analizi ve genleşme tankı azot basımı dahil', avgMin: 45, startPriceTl: 950 },
    { id: 'klima', slug: 'klima-servisi', name: 'Klima Servisi, Bakımı & Montajı', photo: 'photos/klima-service.jpg', items: 'Split, salon tipi ve VRF klima R32/R410A gaz dolumu, söküm-montaj, dış ünite kart tamiri ve ilaçlı yıkama', feeNote: 'Manometre basınç testi ve vakumlu kurulum', avgMin: 45, startPriceTl: 1100 },
    { id: 'petek', slug: 'petek-temizligi', name: 'İlaçlı Petek & Kalorifer Temizliği', photo: 'photos/petek-thermal.jpg', items: 'Çift yönlü darbeli makine ve koruyucu kimyasalla kalorifer peteği ve tesisatı çamur/kireç tahliyesi', feeNote: 'Termal kamerayla petek alt-üst ısı ölçümü', avgMin: 55, startPriceTl: 1450 },
    { id: 'ankastre', slug: 'firin-servisi', name: 'Fırın & Ankastre Servisi', photo: 'photos/ankastre-kitchen.jpg', items: 'Ankastre fırın rezistans, termostat, fan motoru, dokunmatik cam ocak indüksiyon modülü ve davlumbaz tamiri', feeNote: 'Mutfak dolabına zarar vermeden yerinde söküm', avgMin: 40, startPriceTl: 850 },
    { id: 'tv', slug: 'televizyon-servisi', name: 'Televizyon (TV) Servisi & Tamircisi', photo: 'photos/televizyon-ultra.jpg', items: 'LED / QLED / OLED TV ses var görüntü yok LED bar değişimi, besleme kartı, anakart ve duvar montajı', feeNote: '1 yıl garantili tam takım alüminyum LED bar', avgMin: 50, startPriceTl: 1200 },
    { id: 'endustriyel', slug: 'endustriyel-mutfak-servisi', name: 'Endüstriyel Mutfak & Sanayi Cihazları', photo: 'photos/endustriyel-mutfak-ultra.jpg', items: 'Endüstriyel buzdolabı, giyotin/konveyörlü sanayi bulaşık makinesi, sanayi çamaşır, endüstriyel fırın ve sanayi tipi ocak', feeNote: 'Restoran, otel ve yemekhanelere öncelikli acil ekip', avgMin: 30, startPriceTl: 1600 },
    { id: 'soguk-hava', slug: 'soguk-hava-deposu-servisi', name: 'Soğuk Hava Deposu, Buz Makinesi & Çay Kazanı', photo: 'photos/soguk-hava-buz-ultra.jpg', items: 'Soğuk hava deposu kompresör/gaz, soğutma sistemleri, ticari buz makinesi ve çay kazanı rezistans/termostat tamiri', feeNote: '7/24 ticari soğutma acil nöbetçi servis aracı', avgMin: 30, startPriceTl: 1650 }
  ];

  // All 71 Exact Keywords Sent by Yusuf Bey (11:51) — Ready for Dedicated Google Ads Landing Pages!
  const GOOGLE_ADS_KEYWORDS = [
    // Brand Keywords (38)
    ...BRANDS.map(b => ({
      slug: `${b.slug}-servisi`,
      keyword: `${b.name.replace(/\./g, '')} Servisi`,
      type: 'brand',
      brandSlug: b.slug,
      catId: /kombi|ısıtma/i.test(b.group) && !/beyaz/i.test(b.group) ? 'kombi' : 'beyaz-esya',
      photo: b.photo || 'photos/hero-technician-kitchen.jpg',
      groupLabel: 'Marka Özel Servisleri'
    })),
    // Household White Goods & TV Keywords
    { slug: 'beyaz-esya-servisi', keyword: 'Beyaz Eşya Servisi', type: 'service', catId: 'beyaz-esya', photo: 'photos/hero-technician-kitchen.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'beyaz-esya-tamircisi', keyword: 'Beyaz Eşya Tamircisi', type: 'service', catId: 'beyaz-esya', photo: 'photos/hero-technician-kitchen.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'buzdolabi-servisi', keyword: 'Buzdolabı Servisi', type: 'service', catId: 'buzdolabi', photo: 'photos/buzdolabi-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'buzdolabi-tamircisi', keyword: 'Buzdolabı Tamircisi', type: 'service', catId: 'buzdolabi', photo: 'photos/buzdolabi-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'camasir-makinesi-servisi', keyword: 'Çamaşır Makinesi Servisi', type: 'service', catId: 'camasir-bulasik', photo: 'photos/camasir-bulasik-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'camasir-makinesi-tamircisi', keyword: 'Çamaşır Makinesi Tamircisi', type: 'service', catId: 'camasir-bulasik', photo: 'photos/camasir-bulasik-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'bulasik-makinesi-servisi', keyword: 'Bulaşık Makinesi Servisi', type: 'service', catId: 'camasir-bulasik', photo: 'photos/camasir-bulasik-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'bulasik-makinesi-tamircisi', keyword: 'Bulaşık Makinesi Tamircisi', type: 'service', catId: 'camasir-bulasik', photo: 'photos/camasir-bulasik-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'firin-servisi', keyword: 'Fırın Servisi', type: 'service', catId: 'ankastre', photo: 'photos/ankastre-kitchen.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'firin-tamircisi', keyword: 'Fırın Tamircisi', type: 'service', catId: 'ankastre', photo: 'photos/ankastre-kitchen.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'televizyon-servisi', keyword: 'Televizyon Servisi', type: 'service', catId: 'tv', photo: 'photos/televizyon-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    { slug: 'televizyon-tamircisi', keyword: 'Televizyon Tamircisi', type: 'service', catId: 'tv', photo: 'photos/televizyon-ultra.jpg', groupLabel: 'Beyaz Eşya & TV' },
    // Kombi, Klima & Petek Keywords
    { slug: 'kombi-servisi', keyword: 'Kombi Servisi', type: 'service', catId: 'kombi', photo: 'photos/kombi-maintenance.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kombi-tamircisi', keyword: 'Kombi Tamircisi', type: 'service', catId: 'kombi', photo: 'photos/kombi-maintenance.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kombi-bakimi', keyword: 'Kombi Bakımı', type: 'service', catId: 'kombi', photo: 'photos/kombi-maintenance.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kombi-tamiri', keyword: 'Kombi Tamiri', type: 'service', catId: 'kombi', photo: 'photos/kombi-maintenance.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kombi-ariza-servisi', keyword: 'Kombi Arıza Servisi', type: 'service', catId: 'kombi', photo: 'photos/kombi-maintenance.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kombi-yillik-bakim', keyword: 'Kombi Yıllık Bakım', type: 'service', catId: 'kombi', photo: 'photos/kombi-maintenance.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kombi-petek-temizligi', keyword: 'Kombi Petek Temizliği', type: 'service', catId: 'petek', photo: 'photos/petek-thermal.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'petek-temizleme', keyword: 'Petek Temizleme', type: 'service', catId: 'petek', photo: 'photos/petek-thermal.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'petek-temizligi', keyword: 'Petek Temizliği', type: 'service', catId: 'petek', photo: 'photos/petek-thermal.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'petek-bakimi', keyword: 'Petek Bakımı', type: 'service', catId: 'petek', photo: 'photos/petek-thermal.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kalorifer-petegi-temizligi', keyword: 'Kalorifer Peteği Temizliği', type: 'service', catId: 'petek', photo: 'photos/petek-thermal.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'kalorifer-tesisati-temizligi', keyword: 'Kalorifer Tesisatı Temizliği', type: 'service', catId: 'petek', photo: 'photos/petek-thermal.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'klima-servisi', keyword: 'Klima Servisi', type: 'service', catId: 'klima', photo: 'photos/klima-service.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'klima-tamircisi', keyword: 'Klima Tamircisi', type: 'service', catId: 'klima', photo: 'photos/klima-service.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'klima-bakimi', keyword: 'Klima Bakımı', type: 'service', catId: 'klima', photo: 'photos/klima-service.jpg', groupLabel: 'Kombi, Klima & Petek' },
    { slug: 'klima-montaji', keyword: 'Klima Montajı', type: 'service', catId: 'klima', photo: 'photos/klima-service.jpg', groupLabel: 'Kombi, Klima & Petek' },
    // Industrial Kitchen & Commercial Cold Storage Keywords (12)
    { slug: 'endustriyel-mutfak-servisi', keyword: 'Endüstriyel Mutfak Servisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'endustriyel-mutfak-tamircisi', keyword: 'Endüstriyel Mutfak Tamircisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'endustriyel-buzdolabi-servisi', keyword: 'Endüstriyel Buzdolabı Servisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'endustriyel-bulasik-makinesi-servisi', keyword: 'Endüstriyel Bulaşık Makinesi Servisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'endustriyel-camasir-makinesi-servisi', keyword: 'Endüstriyel Çamaşır Makinesi Servisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'endustriyel-firin-servisi', keyword: 'Endüstriyel Fırın Servisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'sanayi-tipi-buzdolabi-tamircisi', keyword: 'Sanayi Tipi Buzdolabı Tamircisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'sanayi-tipi-bulasik-makinesi-tamircisi', keyword: 'Sanayi Tipi Bulaşık Makinesi Tamircisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'sanayi-tipi-ocak-servisi', keyword: 'Sanayi Tipi Ocak Servisi', type: 'service', catId: 'endustriyel', photo: 'photos/endustriyel-mutfak-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'soguk-hava-deposu-servisi', keyword: 'Soğuk Hava Deposu Servisi', type: 'service', catId: 'soguk-hava', photo: 'photos/soguk-hava-buz-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'sogutma-sistemleri-servisi', keyword: 'Soğutma Sistemleri Servisi', type: 'service', catId: 'soguk-hava', photo: 'photos/soguk-hava-buz-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'buz-makinesi-servisi', keyword: 'Buz Makinesi Servisi', type: 'service', catId: 'soguk-hava', photo: 'photos/soguk-hava-buz-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' },
    { slug: 'cay-kazani-tamircisi', keyword: 'Çay Kazanı Tamircisi', type: 'service', catId: 'soguk-hava', photo: 'photos/soguk-hava-buz-ultra.jpg', groupLabel: 'Endüstriyel Mutfak & Soğutma' }
  ];

  function getCategories() {
    const cfg = getConfig();
    return SERVICE_CATEGORIES.map(c => ({
      ...c,
      ...(cfg.categoryOverrides[c.id] || {}),
      enabled: !cfg.disabledCategories.includes(c.id)
    }));
  }

  function getActiveCategories() {
    const list = getCategories().filter(c => c.enabled);
    return list.length ? list : getCategories().slice(0, 4);
  }

  function updateCategory(id, patch) {
    const cfg = getConfig();
    const overrides = { ...cfg.categoryOverrides, [id]: { ...(cfg.categoryOverrides[id] || {}), ...patch } };
    saveConfig({ categoryOverrides: overrides });
    return getCategories();
  }

  function toggleCategoryActive(id) {
    const cfg = getConfig();
    const set = new Set(cfg.disabledCategories);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    saveConfig({ disabledCategories: Array.from(set) });
    return getCategories();
  }

  // Field Technicians Roster
  const INITIAL_TECHNICIANS = [
    { id: 'TECH-01', name: 'Murat Usta (Anadolu-2)', phone: '0532 411 20 84', region: 'İstanbul / Kadıköy - Ataşehir', specialty: 'Yoğuşmalı Kombi & Petek', commissionPct: 30, status: 'busy', completedCount: 412 },
    { id: 'TECH-02', name: 'Kemal Usta (Mersin-1)', phone: '0544 618 33 19', region: 'Mersin / Yenişehir - Mezitli', specialty: 'Beyaz Eşya & Klima', commissionPct: 30, status: 'available', completedCount: 528 },
    { id: 'TECH-03', name: 'Serkan Usta (İzmir-3)', phone: '0533 892 74 51', region: 'İzmir / Karşıyaka - Bornova', specialty: 'Ankastre & Bulaşık / Çamaşır', commissionPct: 30, status: 'available', completedCount: 364 },
    { id: 'TECH-04', name: 'Orhan Usta (Bursa-1)', phone: '0542 730 16 92', region: 'Bursa / Nilüfer - Osmangazi', specialty: 'Kombi, ECA, Alarko & Petek', commissionPct: 30, status: 'available', completedCount: 295 },
    { id: 'TECH-05', name: 'Emre Usta (Ankara-2)', phone: '0505 491 82 60', region: 'Ankara / Çankaya - Yenimahalle', specialty: 'Buzdolabı & Endüstriyel Soğutma', commissionPct: 35, status: 'available', completedCount: 389 },
    { id: 'TECH-06', name: 'Burak Usta (Antalya-1)', phone: '0535 284 90 17', region: 'Antalya / Muratpaşa - Konyaaltı', specialty: 'Inverter Klima & Soğuk Hava Deposu', commissionPct: 30, status: 'off', completedCount: 241 }
  ];

  function getTechnicians() {
    try {
      const raw = localStorage.getItem(TECHS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [...INITIAL_TECHNICIANS];
  }

  function saveTechnicians(list) {
    try { localStorage.setItem(TECHS_KEY, JSON.stringify(list)); } catch {}
    return list;
  }

  function addTechnician(entry) {
    const cur = getTechnicians();
    const item = {
      id: 'TECH-' + Math.floor(10 + Math.random() * 89),
      name: (entry.name || 'Yeni Saha Ustası').trim(),
      phone: (entry.phone || '0532 000 00 00').trim(),
      region: (entry.region || 'İstanbul / Avrupa').trim(),
      specialty: (entry.specialty || 'Beyaz Eşya & Kombi').trim(),
      commissionPct: Math.min(80, Math.max(5, Number(entry.commissionPct) || 30)),
      status: entry.status || 'available',
      completedCount: 0
    };
    return saveTechnicians([item, ...cur]);
  }

  function updateTechnician(id, patch) {
    const next = getTechnicians().map(t => t.id === id ? { ...t, ...patch } : t);
    return saveTechnicians(next);
  }

  function removeTechnician(id) {
    const next = getTechnicians().filter(t => t.id !== id);
    return saveTechnicians(next.length ? next : [...INITIAL_TECHNICIANS]);
  }

  // Leads / Work Orders
  const INITIAL_LEADS = [
    { id: 'SRV-2026-8419', createdAt: 'Bugün 08:32', source: '444 60 82 Çağrı', customer: 'Hakan Demirtaş', phone: '0532 614 88 21', city: 'İstanbul / Kadıköy', brand: 'Vaillant', device: 'Yoğuşmalı Kombi', fault: 'F28 Ateşleme Hatası', tech: 'Murat Usta (Anadolu-2)', status: 'assigned', feeTl: 2450, commissionPct: 30, commissionTl: 735 },
    { id: 'SRV-2026-8418', createdAt: 'Bugün 08:19', source: 'Google Ads Form', customer: 'Selin Yurdakul', phone: '0544 309 41 10', city: 'Mersin / Yenişehir', brand: 'Bosch', device: 'Çamaşır Makinesi', fault: 'E18 Su Boşaltmıyor', tech: 'Kemal Usta (Mersin-1)', status: 'onway', feeTl: 1850, commissionPct: 30, commissionTl: 555 },
    { id: 'SRV-2026-8417', createdAt: 'Bugün 07:54', source: 'WhatsApp', customer: 'Ahmet Karaca', phone: '0505 782 19 63', city: 'Ankara / Çankaya', brand: 'Endüstriyel Soğutma', device: 'Soğuk Hava Deposu', fault: 'Kompresör Devreye Girmiyor', tech: 'Emre Usta (Ankara-2)', status: 'assigned', feeTl: 4200, commissionPct: 35, commissionTl: 1470 },
    { id: 'SRV-2026-8415', createdAt: 'Dün 21:40', source: '444 60 82 Çağrı', customer: 'Derya Özkan', phone: '0533 418 07 54', city: 'İzmir / Karşıyaka', brand: 'Siemens', device: 'Bulaşık Makinesi', fault: 'E15 AquaStop Su Kaçağı', tech: 'Serkan Usta (İzmir-3)', status: 'completed', feeTl: 2100, commissionPct: 30, commissionTl: 630 },
    { id: 'SRV-2026-8412', createdAt: 'Dün 18:15', source: '444 60 82 Çağrı', customer: 'Mustafa Çelik', phone: '0542 891 33 08', city: 'Bursa / Nilüfer', brand: 'E.C.A.', device: 'Proteus Premix Kombi + Petek', fault: 'E01 Hatası + İlaçlı Petek', tech: 'Orhan Usta (Bursa-1)', status: 'completed', feeTl: 3200, commissionPct: 30, commissionTl: 960 }
  ];

  function getLeads() {
    try {
      const raw = localStorage.getItem(LEADS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [...INITIAL_LEADS];
  }

  function saveLeads(list) {
    try { localStorage.setItem(LEADS_KEY, JSON.stringify(list)); } catch {}
    if (liveChannel) {
      try { liveChannel.postMessage({ type: 'leads-updated' }); } catch {}
    }
    return list;
  }

  function findCommissionPctForTech(techName) {
    const found = getTechnicians().find(t => t.name === techName);
    return found ? Number(found.commissionPct) || 30 : 30;
  }

  function updateLead(id, patch) {
    const next = getLeads().map(item => {
      if (item.id !== id) return item;
      const merged = { ...item, ...patch };
      const pct = patch.tech ? findCommissionPctForTech(patch.tech) : (Number(merged.commissionPct) || 30);
      merged.commissionPct = pct;
      const fee = Math.max(0, Number(merged.feeTl) || 0);
      merged.feeTl = fee;
      merged.commissionTl = Math.round(fee * (pct / 100));
      return merged;
    });
    return saveLeads(next);
  }

  function updateLeadStatus(id, status, tech) {
    return updateLead(id, { status, ...(tech ? { tech } : {}) });
  }

  function addLead(entry) {
    const id = 'SRV-2026-' + Math.floor(8420 + Math.random() * 550);
    const techName = entry.tech || 'Atama Bekliyor';
    const pct = findCommissionPctForTech(techName);
    const fee = Math.max(0, Number(entry.feeTl) || 0);
    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const record = {
      id,
      createdAt: 'Bugün ' + nowTime,
      source: entry.source || 'Web Form',
      customer: entry.customer || 'Web Ziyaretçisi',
      phone: entry.phone || '',
      city: entry.city || 'İstanbul / Kadıköy',
      brand: entry.brand || 'Bosch',
      device: entry.device || 'Beyaz Eşya',
      fault: entry.fault || 'Genel Arıza Kaydı',
      tech: techName,
      status: entry.status || (techName !== 'Atama Bekliyor' ? 'assigned' : 'pending'),
      feeTl: fee,
      commissionPct: pct,
      commissionTl: Math.round(fee * (pct / 100))
    };
    const next = [record, ...getLeads()].slice(0, 60);
    saveLeads(next);
    recordVisitorAction(`📋 Servis Formu Gönderdi (${record.brand} - ${record.id})`);
    if (phpApiAvailable && phpApiPrefix) {
      try {
        fetch(phpApiPrefix + 'api.php?action=add_lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        }).catch(() => {});
      } catch {}
    }
    return record;
  }

  function removeLead(id) {
    const next = getLeads().filter(l => l.id !== id);
    return saveLeads(next.length ? next : [...INITIAL_LEADS]);
  }

  // Verified Customer Reviews
  const INITIAL_REVIEWS = [
    { id: 'REV-1', customer: 'Selin Y.', city: 'Mersin / Yenişehir', ticketId: 'SRV-2026-8418', brand: 'Bosch Çamaşır', rating: 5, text: 'Bosch çamaşır makinem gece E18 hatası verdi. Sabah 444 60 82 hattından kayıt açtım, 30 dakikada Kemal Usta kapıdaydı. Pompayı yerinde değiştirip 1 yıllık dijital garanti fişimi ilettiler.' },
    { id: 'REV-2', customer: 'Hakan D.', city: 'İstanbul / Kadıköy', ticketId: 'SRV-2026-8419', brand: 'Vaillant Kombi', rating: 5, text: 'Vaillant kombimiz F28 ateşleme arızasına geçmişti. Anakart değişecek diye korkuyorduk, gaz valfi ve elektrot kalibrasyonuyla çok makul fiyata aynı gün çözdüler.' },
    { id: 'REV-3', customer: 'Ahmet K. (Restoran İşletmesi)', city: 'Ankara / Çankaya', ticketId: 'SRV-2026-8417', brand: 'Soğuk Hava Deposu', rating: 5, text: 'Restoranımızın soğuk hava deposu ve sanayi tipi bulaşık makinesi arızasına 25 dakika içinde acil ekip gönderdiler, ürünlerimiz bozulmadan yerinde çözdüler.' },
    { id: 'REV-4', customer: 'Mustafa Ç.', city: 'Bursa / Nilüfer', ticketId: 'SRV-2026-8412', brand: 'E.C.A. Kombi + Petek', rating: 5, text: 'Peteklerin alt yarısı buz gibiydi. Darbeli makineyle ilaçlı temizlik yapıp termal kamerayla öncesi-sonrası ısı farkını gösterdiler, kombi en kısıkta bile evi ısıtıyor.' },
    { id: 'REV-5', customer: 'Gökhan T.', city: 'İzmir / Karşıyaka', ticketId: 'SRV-2026-8398', brand: 'Siemens Ankastre', rating: 5, text: 'Siemens indüksiyon ocağımızın güç modülü arızasını mutfak tezgahına tek çizik bile atmadan orijinal parçayla onardılar. Webden garanti belgesi görünmesi harika.' }
  ];

  function getReviews() {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [...INITIAL_REVIEWS];
  }

  function addReview(entry) {
    const item = {
      id: 'REV-' + Date.now(),
      customer: (entry.customer || 'Müşteri Yorumu').trim(),
      city: (entry.city || 'İstanbul / Kadıköy').trim(),
      ticketId: (entry.ticketId || 'SRV-2026-' + Math.floor(8420 + Math.random() * 400)).trim(),
      brand: (entry.brand || 'Beyaz Eşya').trim(),
      rating: Math.min(5, Math.max(4, Number(entry.rating) || 5)),
      text: (entry.text || 'Aynı gün zamanında gelip 1 yıl garantili olarak yerinde çözdüler.').trim()
    };
    const next = [item, ...getReviews()];
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function removeReview(id) {
    const next = getReviews().filter(r => r.id !== id);
    const safe = next.length ? next : [...INITIAL_REVIEWS];
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(safe)); } catch {}
    return safe;
  }

  // FAQs
  const INITIAL_FAQS = [
    { id: 'FAQ-1', q: 'Değişen yedek parçalar ne kadar süre garantili?', a: 'Cihazınızda değiştirilen tüm elektronik ve mekanik parçalar, size teslim edilen dijital ve basılı servis iş emri fişi üzerinde 1 yıl (12 ay) resmi firma garantimiz altındadır.' },
    { id: 'FAQ-2', q: 'Onarım öncesi net fiyat bilgisi veriliyor mu?', a: 'Kesinlikle. Teknisyenimiz adreste dijital ölçümle arızayı netleştirdikten sonra toplam parça ve işçilik tutarını size sunar; onayınız olmadan hiçbir sürpriz işlem yapılmaz.' },
    { id: 'FAQ-3', q: 'Yetkili servis misiniz yoksa özel servis mi?', a: 'Firmamız üretici garantisi sona ermiş tüm marka ev tipi ve endüstriyel cihazlara hızlı, şeffaf fiyatlı ve 1 yıl firma garantili onarım sunan bağımsız özel teknik servistir.' },
    { id: 'FAQ-4', q: 'Endüstriyel mutfak, soğuk hava deposu ve buz makinesine bakıyor musunuz?', a: 'Evet. Restoran, otel, market, kafe ve yemekhanelerdeki sanayi tipi buzdolabı, endüstriyel bulaşık/çamaşır makinesi, soğuk hava deposu, buz makinesi, sanayi tipi ocak ve çay kazanlarına aynı gün öncelikli acil ekip yönlendiriyoruz.' }
  ];

  function getFaqs() {
    try {
      const raw = localStorage.getItem(FAQS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [...INITIAL_FAQS];
  }

  function addFaq(entry) {
    const item = {
      id: 'FAQ-' + Date.now(),
      q: (entry.q || 'Servis kaydı sonrası kaç dakikada geliyorsunuz?').trim(),
      a: (entry.a || 'İlçenizdeki nöbetçi gezici ekibimiz ortalama 30-45 dakika içinde adresinize ulaşmaktadır.').trim()
    };
    const next = [...getFaqs(), item];
    try { localStorage.setItem(FAQS_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function removeFaq(id) {
    const next = getFaqs().filter(f => f.id !== id);
    const safe = next.length ? next : [...INITIAL_FAQS];
    try { localStorage.setItem(FAQS_KEY, JSON.stringify(safe)); } catch {}
    return safe;
  }

  // ============================================================================
  // REAL-TIME VISITOR TELEMETRY ENGINE (Device/Phone Model, Clock Time, Active Duration, Visited Pages & Call Actions)
  // ============================================================================
  const SEEDED_VISITORS = [
    {
      sid: 'VIS-SEED-101',
      isSeed: true,
      deviceType: 'mobile',
      deviceModel: 'Apple iPhone 15 Pro',
      osBrowser: 'iOS 18.1 · Mobile Safari',
      screenRes: '393×852',
      source: 'Google Ads ("bosch çamaşır makinesi servisi")',
      cityHint: 'Mersin / Yenişehir',
      ipMasked: '176.88.42.***',
      entryDate: 'Bugün',
      entryTime: '08:41:12',
      lastSeenTime: '08:44:30',
      durationSec: 198,
      pages: [
        { title: 'Bosch Servisi Özel Sayfası', path: '/bosch-servisi', time: '08:41' },
        { title: 'Çamaşır Makinesi Servisi (E18)', path: '/camasir-makinesi-servisi', time: '08:42' }
      ],
      actions: ['🔍 E18 Kodu Sorguladı', '📞 Tıkla Ara: 444 60 82'],
      convertedCall: true,
      adClickCount: 1,
      suspectedFraud: false
    },
    {
      sid: 'VIS-SEED-102',
      isSeed: true,
      deviceType: 'mobile',
      deviceModel: 'Samsung Galaxy S24 (SM-S921B)',
      osBrowser: 'Android 14 · Chrome Mobile',
      screenRes: '384×832',
      source: 'Google Ads ("eca kombi servisi")',
      cityHint: 'İstanbul / Kadıköy',
      ipMasked: '78.173.119.***',
      entryDate: 'Bugün',
      entryTime: '08:27:05',
      lastSeenTime: '08:29:49',
      durationSec: 164,
      pages: [
        { title: 'E.C.A. Servisi Özel Sayfası', path: '/eca-servisi', time: '08:27' },
        { title: 'Kombi Bakımı & Petek Temizliği', path: '/kombi-servisi', time: '08:28' }
      ],
      actions: ['📞 Tıkla Ara: 444 60 82'],
      convertedCall: true,
      adClickCount: 1,
      suspectedFraud: false
    },
    {
      sid: 'VIS-SEED-103',
      isSeed: true,
      deviceType: 'mobile',
      deviceModel: 'Xiaomi Redmi Note 13 Pro',
      osBrowser: 'Android 14 · Chrome Mobile',
      screenRes: '393×873',
      source: 'Google Ads ("soğuk hava deposu servisi")',
      cityHint: 'Ankara / Çankaya',
      ipMasked: '88.230.54.***',
      entryDate: 'Bugün',
      entryTime: '08:09:44',
      lastSeenTime: '08:13:52',
      durationSec: 248,
      pages: [
        { title: 'Soğuk Hava Deposu Servisi', path: '/soguk-hava-deposu-servisi', time: '08:09' },
        { title: 'Endüstriyel Mutfak Servisi', path: '/endustriyel-mutfak-servisi', time: '08:11' }
      ],
      actions: ['💬 WhatsApp Konum/Fotoğraf Tıkladı', '📋 Servis Formu Gönderdi'],
      convertedCall: true,
      adClickCount: 1,
      suspectedFraud: false
    },
    {
      sid: 'VIS-SEED-104',
      isSeed: true,
      deviceType: 'mobile',
      deviceModel: 'Samsung Galaxy A54 5G (SM-A546E)',
      osBrowser: 'Android 14 · Samsung Internet',
      screenRes: '360×800',
      source: 'Google Ads ("kombi tamircisi")',
      cityHint: 'Bursa / Nilüfer',
      ipMasked: '95.70.184.***',
      entryDate: 'Bugün',
      entryTime: '07:52:18',
      lastSeenTime: '07:52:24',
      durationSec: 6,
      pages: [
        { title: 'Kombi Tamircisi Sayfası', path: '/kombi-tamircisi', time: '07:52' }
      ],
      actions: ['⚠️ 4 Kez Peş Peşe Reklam Girişi (6 sn)'],
      convertedCall: false,
      adClickCount: 4,
      suspectedFraud: true
    },
    {
      sid: 'VIS-SEED-105',
      isSeed: true,
      deviceType: 'mobile',
      deviceModel: 'Apple iPhone 13',
      osBrowser: 'iOS 17.6 · Mobile Safari',
      screenRes: '390×844',
      source: 'Google Organik Arama',
      cityHint: 'İzmir / Karşıyaka',
      ipMasked: '176.240.91.***',
      entryDate: 'Bugün',
      entryTime: '07:38:50',
      lastSeenTime: '07:41:15',
      durationSec: 145,
      pages: [
        { title: 'Ana Sayfa', path: '/', time: '07:38' },
        { title: 'Arçelik Servisi Özel Sayfası', path: '/arcelik-servisi', time: '07:39' },
        { title: 'Buzdolabı Servisi', path: '/buzdolabi-servisi', time: '07:40' }
      ],
      actions: ['📞 Tıkla Ara: 444 60 82'],
      convertedCall: true,
      adClickCount: 0,
      suspectedFraud: false
    }
  ];

  function mapAndroidModelCode(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) return '';
    const map = {
      'SM-S928': 'Samsung Galaxy S24 Ultra',
      'SM-S926': 'Samsung Galaxy S24+',
      'SM-S921': 'Samsung Galaxy S24',
      'SM-S918': 'Samsung Galaxy S23 Ultra',
      'SM-S911': 'Samsung Galaxy S23',
      'SM-A556': 'Samsung Galaxy A55 5G',
      'SM-A546': 'Samsung Galaxy A54 5G',
      'SM-A536': 'Samsung Galaxy A53',
      'SM-A346': 'Samsung Galaxy A34',
      'SM-A155': 'Samsung Galaxy A15',
      '2312DRA50G': 'Xiaomi Redmi Note 13 Pro',
      '23021RAA2Y': 'Xiaomi Redmi Note 12'
    };
    for (const [prefix, friendly] of Object.entries(map)) {
      if (code.toUpperCase().startsWith(prefix)) return `${friendly} (${code})`;
    }
    if (/^SM-/i.test(code)) return `Samsung Galaxy (${code})`;
    if (/Redmi|POCO|Mi /i.test(code)) return `Xiaomi ${code}`;
    return code;
  }

  function detectVisitorDevice() {
    const ua = navigator.userAgent || '';
    const sw = Math.min(window.screen.width || window.innerWidth, window.screen.height || window.innerHeight);
    const sh = Math.max(window.screen.width || window.innerWidth, window.screen.height || window.innerHeight);
    const dpr = window.devicePixelRatio || 1;
    const screenRes = `${window.innerWidth}×${window.innerHeight}`;

    let deviceType = 'desktop';
    let deviceModel = 'Masaüstü Bilgisayar';
    let os = 'Windows';
    let browser = 'Chrome';

    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
    else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/CriOS\//i.test(ua)) browser = 'Chrome iOS';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Safari\//i.test(ua)) browser = 'Safari';

    if (/iPhone/i.test(ua)) {
      deviceType = 'mobile';
      const iosMatch = ua.match(/OS (\d+[_\.]\d+)/);
      os = 'iOS ' + (iosMatch ? iosMatch[1].replace('_', '.') : '');
      if (sh >= 932) deviceModel = 'Apple iPhone 15/16 Pro Max';
      else if (sh >= 852 && dpr >= 3) deviceModel = 'Apple iPhone 15/16 Pro';
      else if (sh >= 844) deviceModel = 'Apple iPhone 13/14/15';
      else if (sh >= 812) deviceModel = 'Apple iPhone 11 Pro / 12 mini';
      else deviceModel = 'Apple iPhone';
    } else if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
      deviceType = 'tablet';
      deviceModel = 'Apple iPad';
      os = 'iPadOS';
    } else if (/Android/i.test(ua)) {
      deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
      const verMatch = ua.match(/Android (\d+(?:\.\d+)?)/i);
      os = 'Android ' + (verMatch ? verMatch[1] : '');
      const buildMatch = ua.match(/;\s*([^;)]+?)\s*(?:Build\/|\))/i);
      const rawModel = buildMatch ? buildMatch[1].replace(/^wv$/i, '').trim() : '';
      if (rawModel && rawModel !== 'K' && !/^Linux/i.test(rawModel)) {
        deviceModel = mapAndroidModelCode(rawModel);
      } else {
        deviceModel = 'Android Akıllı Telefon';
      }
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      deviceType = 'desktop';
      deviceModel = 'Apple Mac / MacBook';
      os = 'macOS';
    } else if (/Windows NT 10\.0/i.test(ua)) {
      deviceType = 'desktop';
      deviceModel = 'Windows 10/11 Bilgisayar';
      os = 'Windows 10/11';
    } else if (/Linux/i.test(ua)) {
      deviceType = 'desktop';
      deviceModel = 'Linux Bilgisayar';
      os = 'Linux';
    }

    return {
      deviceType,
      deviceModel,
      osBrowser: `${os.trim()} · ${browser}`,
      screenRes,
      approxSpecs: `${sw}×${sh} @${dpr}x`
    };
  }

  function detectTrafficSource() {
    try {
      const sp = new URLSearchParams(window.location.search);
      const kw = sp.get('utm_term') || sp.get('keyword') || sp.get('q');
      if (sp.get('gclid') || sp.get('utm_source') === 'google_ads' || sp.get('gad_source')) {
        return {
          label: kw ? `Google Ads ("${kw}")` : 'Google Ads Reklam Tıklaması',
          isAdClick: true
        };
      }
      if (sp.get('marka')) {
        return { label: `Marka Sayfası (${sp.get('marka')})`, isAdClick: false };
      }
      if (sp.get('hizmet')) {
        return { label: `Hizmet Sayfası (${sp.get('hizmet')})`, isAdClick: false };
      }
      const ref = document.referrer || '';
      if (/google\./i.test(ref)) return { label: 'Google Organik Arama', isAdClick: false };
      if (/yandex\./i.test(ref)) return { label: 'Yandex Arama', isAdClick: false };
      if (/instagram|facebook/i.test(ref)) return { label: 'Sosyal Medya', isAdClick: false };
    } catch {}
    return { label: 'Doğrudan Giriş (Canlı Test)', isAdClick: false };
  }

  function getFriendlyCurrentPageInfo() {
    const sp = new URLSearchParams(window.location.search);
    const p = window.location.pathname || '/';
    const marka = sp.get('marka');
    const hizmet = sp.get('hizmet');
    const il = sp.get('il');
    const ilce = sp.get('ilce');

    if (marka) {
      const b = getAllBrands().find(x => x.slug === marka);
      const bName = b ? b.name : marka;
      const locPrefix = il ? `${ilce ? ilce + ' / ' : ''}${il} ` : '';
      return {
        title: `${locPrefix}${bName} Servisi`,
        path: il ? `/${il}/${ilce || 'merkez'}-${marka}-servisi` : `/${marka}-servisi`
      };
    }
    if (hizmet) {
      const kw = GOOGLE_ADS_KEYWORDS.find(k => k.slug === hizmet);
      return {
        title: kw ? kw.keyword : hizmet,
        path: `/${hizmet}`
      };
    }
    if (p.includes('tema-1-kurumsal')) return { title: 'Tema 1: Kurumsal 3D Bento Ana Sayfa', path: '/tema-1-kurumsal' };
    if (p.includes('tema-2-hizli-cagri')) return { title: 'Tema 2: Google Ads Hızlı Çağrı', path: '/tema-2-hizli-cagri' };
    if (p.includes('tema-3-prestij')) return { title: 'Tema 3: Prestij Ankastre & SEO', path: '/tema-3-prestij' };
    if (p.includes('tema-4-apple-vitrin')) return { title: 'Tema 4: Apple Galeri & Cihaz Seçici', path: '/tema-4-apple-vitrin' };
    if (p.includes('yonetim-paneli')) return { title: 'Yönetim Paneli (Admin)', path: '/yonetim-paneli' };
    return { title: 'Ana Vitrin / Sunum Merkezi', path: '/' };
  }

  function formatDurationTr(sec) {
    const s = Math.max(1, Math.floor(Number(sec) || 0));
    if (s < 60) return `${s} sn`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m < 60) return `${m} dk ${rem < 10 ? '0' + rem : rem} sn`;
    const h = Math.floor(m / 60);
    return `${h} sa ${m % 60} dk`;
  }

  function getStoredVisitorsRaw() {
    try {
      const raw = localStorage.getItem(VISITORS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [...SEEDED_VISITORS];
  }

  function saveStoredVisitorsRaw(list) {
    try { localStorage.setItem(VISITORS_KEY, JSON.stringify(list.slice(0, 80))); } catch {}
    if (liveChannel) {
      try { liveChannel.postMessage({ type: 'visitors-updated' }); } catch {}
    }
  }

  function getOrCreateSessionId() {
    try {
      let sid = sessionStorage.getItem(SESSION_ID_KEY);
      if (!sid) {
        sid = 'VIS-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 899);
        sessionStorage.setItem(SESSION_ID_KEY, sid);
      }
      return sid;
    } catch {
      return 'VIS-LIVE-001';
    }
  }

  const CURRENT_SID = getOrCreateSessionId();
  let lastServerVisitorPushMs = 0;

  function syncCurrentVisitorToServer(sessionObj, useBeacon) {
    if (!phpApiAvailable || !phpApiPrefix || !sessionObj) return;
    const now = Date.now();
    if (!useBeacon && now - lastServerVisitorPushMs < 9000) return;
    lastServerVisitorPushMs = now;
    const url = phpApiPrefix + 'api.php?action=track_visitor';
    const payload = JSON.stringify(sessionObj);
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(url, payload);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch {}
  }

  function upsertCurrentVisitorSession(mutator, forceServerBeacon) {
    const list = getStoredVisitorsRaw();
    const now = new Date();
    const clockFull = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const clockShort = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let idx = list.findIndex(v => v.sid === CURRENT_SID);
    let session;
    if (idx === -1) {
      const dev = detectVisitorDevice();
      const src = detectTrafficSource();
      session = {
        sid: CURRENT_SID,
        isSeed: false,
        deviceType: dev.deviceType,
        deviceModel: dev.deviceModel,
        osBrowser: dev.osBrowser,
        screenRes: dev.screenRes,
        source: src.label,
        cityHint: 'Aktif Oturum (TR)',
        ipMasked: 'Canlı Oturum',
        entryDate: `Bugün (${dateStr})`,
        entryTime: clockFull,
        lastSeenTime: clockFull,
        lastActiveEpoch: Date.now(),
        durationSec: 1,
        pages: [],
        actions: [],
        convertedCall: false,
        adClickCount: src.isAdClick ? 1 : 0,
        suspectedFraud: false
      };
      list.unshift(session);
      idx = 0;
    } else {
      session = { ...list[idx] };
      session.lastSeenTime = clockFull;
      session.lastActiveEpoch = Date.now();
    }

    if (typeof mutator === 'function') {
      mutator(session, clockShort);
    }

    list[idx] = session;
    // Keep current session pinned at top
    if (idx > 0) {
      list.splice(idx, 1);
      list.unshift(session);
    }
    saveStoredVisitorsRaw(list);
    syncCurrentVisitorToServer(session, !!forceServerBeacon);
    return session;
  }

  function recordVisitorAction(actionLabel) {
    if (!actionLabel) return;
    upsertCurrentVisitorSession((s, clockShort) => {
      const stamped = `${actionLabel} (${clockShort})`;
      if (!Array.isArray(s.actions)) s.actions = [];
      if (s.actions[s.actions.length - 1] !== stamped) {
        s.actions = [...s.actions.slice(-7), stamped];
      }
      if (/Ara|WhatsApp|Form/i.test(actionLabel)) {
        s.convertedCall = true;
      }
    }, true);
  }

  function initLiveVisitorTelemetry() {
    const pageInfo = getFriendlyCurrentPageInfo();
    upsertCurrentVisitorSession((s, clockShort) => {
      if (!Array.isArray(s.pages)) s.pages = [];
      const last = s.pages[s.pages.length - 1];
      if (!last || last.path !== pageInfo.path) {
        s.pages = [...s.pages.slice(-9), { title: pageInfo.title, path: pageInfo.path, time: clockShort }];
      }
    }, false);

    // Upgrade Android exact hardware model via Client Hints High-Entropy API when available (Chrome Android)
    if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
      navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']).then(hints => {
        if (hints && hints.model) {
          const pretty = mapAndroidModelCode(hints.model);
          if (pretty) {
            upsertCurrentVisitorSession(s => { s.deviceModel = pretty; }, false);
          }
        }
      }).catch(() => {});
    }

    // Active foreground duration ticker (1s precision, saves every 2s)
    let unsavedTicks = 0;
    setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      unsavedTicks += 1;
      if (unsavedTicks >= 2) {
        const add = unsavedTicks;
        unsavedTicks = 0;
        upsertCurrentVisitorSession(s => {
          s.durationSec = (Number(s.durationSec) || 0) + add;
        }, false);
      }
    }, 1000);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && unsavedTicks > 0) {
        const add = unsavedTicks;
        unsavedTicks = 0;
        upsertCurrentVisitorSession(s => {
          s.durationSec = (Number(s.durationSec) || 0) + add;
        }, true);
      }
    });

    // Global Click-to-Call & WhatsApp Conversion Listener
    document.addEventListener('click', (e) => {
      const link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href.startsWith('tel:')) {
        const num = href.replace('tel:', '');
        recordVisitorAction(`📞 Tıkla Ara: ${num}`);
        fireGoogleAdsCallConversion(num);
      } else if (href.includes('wa.me/')) {
        recordVisitorAction('💬 WhatsApp Mesaj Butonu');
        fireGoogleAdsCallConversion('whatsapp');
      }
    }, true);
  }

  function getVisitors() {
    const list = getStoredVisitorsRaw();
    return list.map(v => ({
      ...v,
      isCurrentSession: v.sid === CURRENT_SID,
      isLiveNow: v.sid === CURRENT_SID || (v.lastActiveEpoch && (Date.now() - v.lastActiveEpoch < 45000))
    }));
  }

  function clearSeedVisitorsKeepCurrent() {
    const cur = getStoredVisitorsRaw().filter(v => v.sid === CURRENT_SID);
    saveStoredVisitorsRaw(cur);
    return getVisitors();
  }

  // ============================================================================
  // DYNAMIC SEARCH CONSOLE, GA4, GOOGLE ADS & CUSTOM <HEAD>/<BODY> CODE INJECTOR
  // ============================================================================
  function extractMetaContentOrToken(rawInput) {
    const val = String(rawInput || '').trim();
    if (!val) return '';
    const m = val.match(/content\s*=\s*["']([^"']+)["']/i);
    return m ? m[1].trim() : val.replace(/<[^>]+>/g, '').trim();
  }

  function injectVerificationAndTrackingCodes() {
    if (typeof document === 'undefined' || !document.head) return;
    const cfg = getConfig();

    function upsertMeta(name, rawVal) {
      const token = extractMetaContentOrToken(rawVal);
      let el = document.head.querySelector(`meta[name="${name}"]`);
      if (!token) {
        if (el && el.hasAttribute('data-merkez-injected')) el.remove();
        return;
      }
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        el.setAttribute('data-merkez-injected', '1');
        document.head.appendChild(el);
      }
      el.setAttribute('content', token);
    }

    upsertMeta('google-site-verification', cfg.googleSearchConsoleVerification);
    upsertMeta('yandex-verification', cfg.yandexVerification);
    upsertMeta('msvalidate.01', cfg.bingVerification);

    // GA4 / Google Ads gtag bootstrap
    const gtagId = (cfg.googleAnalyticsId || cfg.googleAdsId || '').trim();
    if (gtagId && /^(G-|AW-)/i.test(gtagId) && !document.getElementById('merkezGtagScript')) {
      const s = document.createElement('script');
      s.id = 'merkezGtagScript';
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gtagId);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      if (cfg.googleAnalyticsId) window.gtag('config', cfg.googleAnalyticsId.trim());
      if (cfg.googleAdsId) window.gtag('config', cfg.googleAdsId.trim());
    }

    // Custom raw <head> HTML container
    if (cfg.customHeadHtml && !document.getElementById('merkezCustomHeadHost')) {
      const tpl = document.createElement('template');
      tpl.innerHTML = cfg.customHeadHtml;
      const marker = document.createElement('meta');
      marker.id = 'merkezCustomHeadHost';
      marker.name = 'merkez-custom-head';
      marker.content = 'active';
      document.head.appendChild(marker);
      Array.from(tpl.content.childNodes).forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const sc = document.createElement('script');
          Array.from(node.attributes || []).forEach(a => sc.setAttribute(a.name, a.value));
          sc.textContent = node.textContent;
          document.head.appendChild(sc);
        } else {
          document.head.appendChild(node.cloneNode(true));
        }
      });
    }

    // Custom raw <body> HTML container
    if (cfg.customBodyHtml && document.body && !document.getElementById('merkezCustomBodyHost')) {
      const host = document.createElement('div');
      host.id = 'merkezCustomBodyHost';
      host.style.display = 'none';
      host.innerHTML = cfg.customBodyHtml;
      document.body.appendChild(host);
    }
  }

  function fireGoogleAdsCallConversion(channelLabel) {
    try {
      const cfg = getConfig();
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'click_to_call', {
          event_category: 'engagement',
          event_label: channelLabel || cfg.primaryPhoneTel
        });
        if (cfg.googleAdsId && cfg.googleAdsLabel) {
          window.gtag('event', 'conversion', {
            send_to: `${cfg.googleAdsId.trim()}/${cfg.googleAdsLabel.trim()}`
          });
        }
      }
    } catch {}
  }

  function resetAllData() {
    [STORAGE_KEY, LEADS_KEY, TECHS_KEY, CUSTOM_BRANDS_KEY, CUSTOM_FAULTS_KEY, REVIEWS_KEY, FAQS_KEY, VISITORS_KEY, HIDE_PILL_KEY].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    hydrateLiveConfig();
    return getConfig();
  }

  function exportAllDataJson() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      config: getConfig(),
      visitors: getVisitors(),
      technicians: getTechnicians(),
      leads: getLeads(),
      customBrands: getCustomBrands(),
      faults: getFaults(),
      reviews: getReviews(),
      faqs: getFaqs()
    }, null, 2);
  }

  function exportSitemapXml() {
    const cfg = getConfig();
    const base = (cfg.siteDomainUrl || 'https://merkezservis.com.tr').replace(/\/+$/, '');
    const today = new Date().toISOString().slice(0, 10);
    const urls = [
      `${base}/`,
      ...GOOGLE_ADS_KEYWORDS.map(k => `${base}/${k.slug}`)
    ];
    // Add top Drip-Feed local brand pages up to dailyDripLimit
    let count = urls.length;
    const limit = Math.max(100, Number(cfg.dailyDripLimit) || 250);
    const topBrands = getActiveBrands().slice(0, 12);
    for (const p of ALL_81_PROVINCES) {
      for (const d of p.districts.slice(0, 2)) {
        for (const b of topBrands.slice(0, 3)) {
          if (count >= limit) break;
          urls.push(`${base}/${p.slug}/${slugifyTr(d)}-${b.slug}-servisi`);
          count++;
        }
        if (count >= limit) break;
      }
      if (count >= limit) break;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u, idx) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${idx === 0 ? '1.0' : idx <= 72 ? '0.9' : '0.8'}</priority>\n  </url>`).join('\n') +
      `\n</urlset>`;
  }

  // Apply live config across all 4 themes, brand landing pages & admin components
  function hydrateLiveConfig() {
    if (typeof document === 'undefined') return;
    const cfg = getConfig();
    document.querySelectorAll('[data-servis-company]').forEach(el => { el.textContent = cfg.companyName; });
    document.querySelectorAll('[data-servis-legal]').forEach(el => { el.textContent = cfg.legalName; });
    document.querySelectorAll('[data-servis-address]').forEach(el => { el.textContent = cfg.headOfficeAddress; });
    document.querySelectorAll('[data-servis-tax]').forEach(el => { el.textContent = cfg.taxInfo; });
    document.querySelectorAll('[data-servis-phone]').forEach(el => { el.textContent = cfg.primaryPhoneDisplay; });
    document.querySelectorAll('[data-servis-phone-secondary]').forEach(el => { el.textContent = cfg.secondaryPhoneDisplay; });
    document.querySelectorAll('[data-servis-night-phone]').forEach(el => { el.textContent = cfg.emergencyNightPhone; });
    document.querySelectorAll('[data-servis-hours-weekday]').forEach(el => { el.textContent = cfg.workingHoursWeekday; });
    document.querySelectorAll('[data-servis-hours-weekend]').forEach(el => { el.textContent = cfg.workingHoursWeekend; });
    document.querySelectorAll('[data-servis-warranty-months]').forEach(el => { el.textContent = cfg.warrantyMonths + ' Ay'; });
    document.querySelectorAll('[data-servis-eta]').forEach(el => { el.textContent = cfg.avgArrivalMinutes + ' Dk'; });
    document.querySelectorAll('[data-servis-inspection-note]').forEach(el => { el.textContent = cfg.inspectionNote; });
    document.querySelectorAll('[data-servis-ads-text]').forEach(el => { el.textContent = cfg.adsComplianceText; });

    if (cfg.heroCustomBadge) {
      document.querySelectorAll('[data-servis-hero-badge]').forEach(el => { el.textContent = cfg.heroCustomBadge; });
    }
    if (cfg.heroCustomTitle) {
      document.querySelectorAll('[data-servis-hero-title]').forEach(el => { el.textContent = cfg.heroCustomTitle; });
    }
    if (cfg.heroCustomSub) {
      document.querySelectorAll('[data-servis-hero-sub]').forEach(el => { el.textContent = cfg.heroCustomSub; });
    }

    document.querySelectorAll('a[data-servis-tel]').forEach(a => {
      a.setAttribute('href', 'tel:' + cfg.primaryPhoneTel);
    });
    document.querySelectorAll('a[data-servis-tel-secondary]').forEach(a => {
      a.setAttribute('href', 'tel:' + cfg.secondaryPhoneTel);
    });
    document.querySelectorAll('a[data-servis-wa]').forEach(a => {
      const msg = a.getAttribute('data-wa-text') || cfg.whatsappGreeting || 'Merhaba, cihaz arızası için teknik servis kaydı oluşturmak istiyorum.';
      a.setAttribute('href', `https://wa.me/${cfg.whatsappPhone}?text=${encodeURIComponent(msg)}`);
    });

    const bannerEl = document.querySelector('[data-servis-ads-shield]');
    if (bannerEl) {
      bannerEl.style.display = cfg.adsComplianceBanner ? '' : 'none';
    }

    const promoRibbon = document.querySelector('[data-servis-promo-ribbon]');
    if (promoRibbon) {
      promoRibbon.style.display = cfg.promoBannerActive ? '' : 'none';
      const pTxt = promoRibbon.querySelector('[data-servis-promo-text]');
      const pCode = promoRibbon.querySelector('[data-servis-promo-code]');
      if (pTxt) pTxt.textContent = cfg.promoBannerText;
      if (pCode) {
        pCode.textContent = cfg.promoBannerCode ? ('KOD: ' + cfg.promoBannerCode) : '';
        pCode.style.display = cfg.promoBannerCode ? '' : 'none';
      }
    }

    const dockEl = document.querySelector('.floating-dock');
    if (dockEl) {
      dockEl.style.display = cfg.floatingDockActive ? '' : 'none';
    }

    document.querySelectorAll('[data-servis-live-ticker]').forEach(el => {
      el.style.display = cfg.liveDispatchTickerActive ? '' : 'none';
    });

    const pageDefault = document.documentElement.getAttribute('data-default-palette') || 'royal-blue';
    const activePal = cfg.paletteOverridden ? (cfg.colorPalette || pageDefault) : pageDefault;
    document.documentElement.setAttribute('data-palette', activePal);
    document.querySelectorAll('[data-palette-btn]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-palette-btn') === activePal ? 'true' : 'false');
    });
    document.querySelectorAll('[data-adm-pal], [data-hub-pal]').forEach(btn => {
      const pid = btn.getAttribute('data-adm-pal') || btn.getAttribute('data-hub-pal');
      btn.classList.toggle('active', pid === activePal);
    });
    const palNameEl = document.querySelector('[data-active-palette-name]');
    if (palNameEl) {
      const found = COLOR_PALETTES.find(p => p.id === activePal);
      if (found) palNameEl.textContent = found.name;
    }
  }

  function setPalette(paletteId) {
    const valid = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
    saveConfig({ colorPalette: valid.id, paletteOverridden: true });
    window.dispatchEvent(new CustomEvent('merkez:palette-changed', { detail: valid }));
    return valid;
  }

  function probePhpBackend(prefix) {
    phpApiPrefix = prefix || './';
    try {
      fetch(phpApiPrefix + 'api.php?action=public_bootstrap', { cache: 'no-store' })
        .then(r => {
          const ct = (r.headers.get('content-type') || '').toLowerCase();
          if (!r.ok || !ct.includes('application/json')) return null;
          return r.json();
        })
        .then(data => {
          if (!data || !data.ok) return;
          phpApiAvailable = true;
          if (data.config && typeof data.config === 'object' && Object.keys(data.config).length) {
            saveConfig(data.config, true);
          }
          if (Array.isArray(data.visitors) && data.visitors.length) {
            const localCur = getStoredVisitorsRaw().find(v => v.sid === CURRENT_SID);
            const merged = localCur
              ? [localCur, ...data.visitors.filter(v => v.sid !== CURRENT_SID)]
              : data.visitors;
            saveStoredVisitorsRaw(merged);
          }
          if (Array.isArray(data.leads) && data.leads.length) {
            saveLeads(data.leads);
          }
        })
        .catch(() => {});
    } catch {}
  }

  function mountStudioChrome(activePage, prefix) {
    const pre = prefix || './';
    probePhpBackend(pre);
    injectVerificationAndTrackingCodes();
    initLiveVisitorTelemetry();

    const cfg = getConfig();
    const navItems = [
      { key: 'hub', label: 'Sunum Vitrini', href: pre + 'index.html' },
      { key: 'tema1', label: 'Tema 1: Kurumsal Bento', href: pre + 'tema-1-kurumsal/index.html' },
      { key: 'tema2', label: 'Tema 2: Google Ads Hızlı Çağrı', href: pre + 'tema-2-hizli-cagri/index.html' },
      { key: 'tema3', label: 'Tema 3: Prestij Showroom', href: pre + 'tema-3-prestij/index.html' },
      { key: 'tema4', label: 'Tema 4: Apple Galeri Vitrin', href: pre + 'tema-4-apple-vitrin/index.html' },
      { key: 'brand', label: 'Örnek Marka Sayfası (Bosch)', href: pre + 'marka-servisi/index.html?marka=bosch' },
      { key: 'admin', label: 'Yönetim & Ziyaretçi Paneli', href: pre + 'yonetim-paneli/index.html' }
    ];

    const isCustomerFacingTheme = ['tema1', 'tema2', 'tema3', 'tema4', 'brand'].includes(activePage);
    const shouldRenderTopBar = !isCustomerFacingTheme || !!cfg.showTopDemoBar;

    const barHost = document.getElementById('studioBarHost');
    if (barHost) {
      const topBarHtml = shouldRenderTopBar ? `<div class="studio-bar">
        <div class="studio-bar-inner">
          <nav class="studio-nav" aria-label="Canlı Tema Seçici">
            ${navItems.map(n => `<a href="${n.href}" ${n.key === activePage ? 'aria-current="page"' : ''}>${n.label}</a>`).join('')}
          </nav>
          <div class="palette-picker" role="group" aria-label="Canlı Tema Rengi Seçici">
            <span class="palette-label">Renk:</span>
            ${COLOR_PALETTES.map(p => `<button type="button" class="swatch-btn" data-palette-btn="${p.id}" style="background:${p.hex}" title="${p.name} — ${p.note}" aria-label="${p.name}"></button>`).join('')}
            <span class="palette-active-tag" data-active-palette-name>Kurumsal Güven Mavisi</span>
          </div>
        </div>
      </div>` : '';

      const promoHtml = isCustomerFacingTheme ? `<div class="promo-ribbon" data-servis-promo-ribbon style="${cfg.promoBannerActive ? '' : 'display:none;'}">
        <div class="container-xl promo-ribbon-inner">
          <span class="promo-dot-tag">KAMPANYA</span>
          <span class="promo-text" data-servis-promo-text>${cfg.promoBannerText}</span>
          <span class="promo-code mono" data-servis-promo-code style="${cfg.promoBannerCode ? '' : 'display:none;'}">KOD: ${cfg.promoBannerCode}</span>
          <a class="promo-cta tnum" data-servis-tel href="tel:${cfg.primaryPhoneTel}">Hemen Ara: <span data-servis-phone>${cfg.primaryPhoneDisplay}</span> →</a>
        </div>
      </div>` : '';

      barHost.innerHTML = topBarHtml + promoHtml;
      barHost.querySelectorAll('[data-palette-btn]').forEach(btn => {
        btn.addEventListener('click', () => setPalette(btn.getAttribute('data-palette-btn')));
      });
    }

    // Discreet Bottom-Left Collapsible Theme / Color / Admin Pill on Clean-Top Theme Pages
    const pillDismissed = sessionStorage.getItem(HIDE_PILL_KEY) === '1';
    if (isCustomerFacingTheme && !cfg.showTopDemoBar && cfg.showDemoFloatingPill !== false && !pillDismissed) {
      let existingWrap = document.getElementById('demoSwitcherWrap');
      if (!existingWrap) {
        existingWrap = document.createElement('div');
        existingWrap.id = 'demoSwitcherWrap';
        existingWrap.className = 'demo-switcher-wrap';
        document.body.appendChild(existingWrap);
      }
      existingWrap.innerHTML = `
        <div class="demo-drawer" id="demoSwitcherDrawer" role="dialog" aria-label="4 Tema, 5 Renk ve Yönetim Paneli">
          <div class="demo-drawer-title">
            <span>4 Farklı Tema · Canlı Geçiş</span>
            <span style="color:#10b981;">Üst Bar Temiz Mod ✓</span>
          </div>
          <div class="demo-theme-list">
            ${navItems.map(n => `<a class="demo-theme-link ${n.key === activePage ? 'active' : ''}" href="${n.href}">
              <span>${n.label}</span>
              <span>→</span>
            </a>`).join('')}
          </div>
          <div class="demo-drawer-title" style="margin-bottom:0.4rem;">
            <span>5 Canlı Kurumsal Renk</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;padding-top:0.15rem;">
            ${COLOR_PALETTES.map(p => `<button type="button" class="swatch-btn" data-palette-btn="${p.id}" style="background:${p.hex};width:24px;height:24px;" title="${p.name}"></button>`).join('')}
            <span style="font-size:0.74rem;color:#cbd5e1;font-weight:600;margin-left:0.25rem;" data-active-palette-name>Kurumsal Mavi</span>
          </div>
        </div>
        <div class="demo-pill-row">
          <button type="button" class="demo-pill-toggle" id="demoPillToggleBtn" aria-expanded="false">
            <span class="demo-pill-dot"></span>
            <span>4 Tema · Renk · Yönetim Paneli</span>
          </button>
          <button type="button" class="demo-pill-close" id="demoPillCloseBtn" title="Bu kutuyu gizle (Tam Canlı Görünüm)" aria-label="Tema seçiciyi gizle">×</button>
        </div>
      `;
      const drawer = document.getElementById('demoSwitcherDrawer');
      const toggleBtn = document.getElementById('demoPillToggleBtn');
      const closeBtn = document.getElementById('demoPillCloseBtn');
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = drawer.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      closeBtn.addEventListener('click', () => {
        try { sessionStorage.setItem(HIDE_PILL_KEY, '1'); } catch {}
        existingWrap.remove();
      });
      document.addEventListener('click', (e) => {
        if (existingWrap && !existingWrap.contains(e.target)) {
          drawer.classList.remove('open');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
      existingWrap.querySelectorAll('[data-palette-btn]').forEach(btn => {
        btn.addEventListener('click', () => setPalette(btn.getAttribute('data-palette-btn')));
      });
    }

    const dockHost = document.getElementById('floatingDockHost');
    if (dockHost) {
      dockHost.innerHTML = `<div class="floating-dock" aria-label="Hızlı Tıkla Ara ve WhatsApp" style="${cfg.floatingDockActive ? '' : 'display:none;'}">
        <a class="dock-wa" data-servis-wa href="https://wa.me/${cfg.whatsappPhone}" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span>WhatsApp</span>
        </a>
        <a class="dock-call tnum" data-servis-tel href="tel:${cfg.primaryPhoneTel}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"/></svg>
          <span>Tıkla Ara: <span data-servis-phone>${cfg.primaryPhoneDisplay}</span></span>
        </a>
      </div>`;
    }

    hydrateLiveConfig();

    // Smooth IntersectionObserver scroll reveals (supports all 4 theme signature classes!)
    const revealEls = document.querySelectorAll('.reveal-up, .spring-pop, .kinetic-in, .cinema-reveal, .apple-reveal');
    if (revealEls.length) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(ent => {
            if (ent.isIntersecting) {
              ent.target.classList.add('is-visible');
              io.unobserve(ent.target);
            }
          });
        }, { threshold: 0.01, rootMargin: '0px 0px 40px 0px' });
        revealEls.forEach(el => io.observe(el));
      } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
      }
    }
  }

  window.addEventListener('storage', () => hydrateLiveConfig());
  if (liveChannel) {
    liveChannel.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'config-updated') hydrateLiveConfig();
    });
  }

  // Generate dynamic Anti-Spam Local SEO Content & JSON-LD Schema for any (Province, District, Brand, Category)
  function buildSeoPreview(provinceSlug, districtName, brandSlug, categoryId, prefix) {
    const cfg = getConfig();
    const prov = ALL_81_PROVINCES.find(p => p.slug === provinceSlug) || ALL_81_PROVINCES[0];
    const dist = districtName || prov.districts[0];
    const allB = getAllBrands();
    const brand = allB.find(b => b.slug === brandSlug) || allB[2] || BRANDS[2];
    const cats = getCategories();
    const cat = cats.find(c => c.id === categoryId) || cats[0];
    const faults = getFaults();
    const matchingFaults = faults.filter(f => f.brands.includes(brand.slug));
    const topFault = matchingFaults[0] || faults[0];

    const distSlug = slugifyTr(dist);
    const urlPath = `/${prov.slug}/${distSlug}-${brand.slug}-servisi/`;
    const livePreviewHref = getLocalLandingUrl(prov.slug, dist, brand.slug, prefix || '../');
    const tokens = {
      '{il}': prov.name,
      '{ilce}': dist,
      '{marka}': brand.name,
      '{hizmet}': cat.name,
      '{sure}': String(prov.eta),
      '{arac}': String(prov.activeVans),
      '{garanti}': String(cfg.warrantyMonths),
      '{telefon}': cfg.primaryPhoneDisplay
    };
    const applyTpl = (tpl) => Object.entries(tokens).reduce((acc, [k, v]) => acc.split(k).join(v), tpl);

    const title = applyTpl(cfg.seoTitleTemplate || DEFAULT_CONFIG.seoTitleTemplate);
    const h1 = `${prov.name} ${dist} ${brand.name} Özel Teknik Servisi`;
    const uniqueIntro = `${prov.name} ${dist} bölgesindeki gezici ${brand.name} (${brand.group}) ekibimiz şu an ${prov.activeVans} aktif servis aracıyla ortalama ${prov.eta} dakika içinde adresinize ulaşmaktadır. Garantisi sona ermiş ${brand.name} cihazlarınızda ${(brand.codes || ['E18']).join(', ')} arıza kodları başta olmak üzere tüm elektronik kart, pompa ve ısıtma/soğutma arızaları ${cfg.warrantyMonths} ay parça garantili iş emri fişiyle yerinde giderilir. Acil Çağrı Hattı: ${cfg.primaryPhoneDisplay}.`;

    const schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      name: `${cfg.companyName} - ${dist} ${brand.name} Özel Servis Birimi`,
      telephone: '+90-' + cfg.primaryPhoneTel.replace(/^0/, ''),
      address: cfg.headOfficeAddress,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: `${dist}, ${prov.name}, Türkiye`
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: (cfg.workingHoursWeekday || '08:00 - 22:00').split('-')[0].trim(),
        closes: (cfg.workingHoursWeekday || '08:00 - 22:00').split('-')[1]?.trim() || '22:00'
      },
      makesOffer: {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: `${dist} ${brand.name} ${cat.name}`,
          description: applyTpl(cfg.seoMetaTemplate || DEFAULT_CONFIG.seoMetaTemplate)
        }
      }
    };

    return {
      urlPath,
      livePreviewHref,
      title,
      h1,
      uniqueIntro,
      prov,
      dist,
      brand,
      cat,
      topFault,
      schemaJson: JSON.stringify(schemaObj, null, 2)
    };
  }

  window.MerkezServis = {
    DEFAULT_CONFIG,
    BRANDS,
    FAULT_DATABASE,
    ALL_81_PROVINCES,
    SERVICE_CATEGORIES,
    GOOGLE_ADS_KEYWORDS,
    COLOR_PALETTES,
    slugifyTr,
    getConfig,
    saveConfig,
    applySinglePhoneEverywhere,
    setPalette,
    mountStudioChrome,
    getAllBrands,
    getActiveBrands,
    addCustomBrand,
    toggleBrandActive,
    getBrandUrl,
    getServiceUrl,
    getLocalLandingUrl,
    getCategories,
    getActiveCategories,
    updateCategory,
    toggleCategoryActive,
    getFaults,
    addFault,
    removeFault,
    getTechnicians,
    addTechnician,
    updateTechnician,
    removeTechnician,
    getLeads,
    updateLead,
    updateLeadStatus,
    addLead,
    removeLead,
    getReviews,
    addReview,
    removeReview,
    getFaqs,
    addFaq,
    removeFaq,
    getVisitors,
    recordVisitorAction,
    clearSeedVisitorsKeepCurrent,
    formatDurationTr,
    injectVerificationAndTrackingCodes,
    resetAllData,
    exportAllDataJson,
    exportSitemapXml,
    renderBrandMarkSvg,
    hydrateLiveConfig,
    buildSeoPreview
  };
})();
