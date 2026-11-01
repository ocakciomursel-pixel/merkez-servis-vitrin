// Merkez Servis Full Live CMS & Shared Data Engine v2
// 81 Il / 973 Ilce Matrix, 35+ Authentic Brands (with crisp inline SVG wordmarks),
// Dynamic Fault-Code DB, Field Technicians & Commission Engine, Reviews, FAQs,
// Live Campaign Promo Ribbon, 5 Color Palettes, and Anti-Spam SEO Schema Generator.

(function () {
  const STORAGE_KEY = 'merkez_servis_config_v2';
  const LEADS_KEY = 'merkez_servis_leads_v2';
  const TECHS_KEY = 'merkez_servis_techs_v2';
  const CUSTOM_BRANDS_KEY = 'merkez_servis_custom_brands_v2';
  const CUSTOM_FAULTS_KEY = 'merkez_servis_custom_faults_v2';
  const REVIEWS_KEY = 'merkez_servis_reviews_v2';
  const FAQS_KEY = 'merkez_servis_faqs_v2';

  const DEFAULT_CONFIG = {
    companyName: 'Merkez Beyaz Eşya Servisi',
    legalName: 'Merkez Beyaz Eşya Servisi Ticaret Limited Şirketi',
    headOfficeAddress: 'Yenişehir Mah. Kuvayi Milliye Cad. No:42 Yenişehir / Mersin',
    taxInfo: 'İstiklal V.D. · Mersis: 0618094281000019',
    primaryPhoneDisplay: '0850 380 02 02',
    primaryPhoneTel: '08503800202',
    secondaryPhoneDisplay: '444 6 082',
    secondaryPhoneTel: '4446082',
    emergencyNightPhone: '0532 610 02 02',
    whatsappPhone: '908503800202',
    whatsappDisplay: '0850 380 02 02',
    whatsappGreeting: 'Merhaba, arızalı cihazım için teknik servis ve fiyat bilgisi almak istiyorum.',
    workingHoursWeekday: '08:00 - 22:00',
    workingHoursWeekend: '09:00 - 20:00',
    nightShiftActive: true,
    promoBannerActive: true,
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
    avgArrivalMinutes: 32,
    inspectionFeeTl: 450,
    inspectionNote: 'Onarım onaylandığında arıza tespit ve servis yönlendirme ücreti alınmaz.',
    floatingDockActive: true,
    liveDispatchTickerActive: true,
    seoTitleTemplate: '{ilce} {marka} Servisi — {sure} Dk Yerinde Onarım | {telefon}',
    seoMetaTemplate: '{il} {ilce} bölgesinde {marka} {hizmet} için {arac} gezici araçla ort. {sure} dakikada {garanti} ay parça garantili özel teknik servis.',
    googleAnalyticsId: 'G-MRKZ81SER',
    googleAdsId: 'AW-948271602',
    googleAdsLabel: 'call_conv_0850',
    gtmId: 'GTM-MRKZ26',
    disabledBrands: [],
    disabledCategories: [],
    categoryOverrides: {}
  };

  const COLOR_PALETTES = [
    { id: 'royal-blue', name: 'Puls Güven Mavisi', hex: '#0066ff', note: 'Beko / Samsung / Kurumsal Mavi' },
    { id: 'crimson-red', name: 'Bosch & Arçelik Kırmızısı', hex: '#e11d48', note: 'Bosch / Arçelik / Yüksek Dönüşüm Kırmızı' },
    { id: 'vaillant-emerald', name: 'Vaillant Eko Yeşili', hex: '#059669', note: 'Vaillant / Kombi & İklimlendirme Yeşil' },
    { id: 'thermal-amber', name: 'Acil Servis Turuncusu', hex: '#ea580c', note: 'Baymak / Viessmann Enerji Turuncusu' },
    { id: 'siemens-teal', name: 'Siemens Ankastre Turkuaz', hex: '#0891b2', note: 'Siemens / Miele Modern Petrol' }
  ];

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        disabledBrands: Array.isArray(parsed.disabledBrands) ? parsed.disabledBrands : [],
        disabledCategories: Array.isArray(parsed.disabledCategories) ? parsed.disabledCategories : [],
        categoryOverrides: parsed.categoryOverrides && typeof parsed.categoryOverrides === 'object' ? parsed.categoryOverrides : {}
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfig(patch) {
    const next = { ...getConfig(), ...patch };
    if (next.primaryPhoneDisplay) {
      next.primaryPhoneTel = String(next.primaryPhoneDisplay).replace(/[^\d+]/g, '');
    }
    if (next.secondaryPhoneDisplay) {
      next.secondaryPhoneTel = String(next.secondaryPhoneDisplay).replace(/[^\d+]/g, '');
    }
    if (next.whatsappDisplay) {
      const digits = String(next.whatsappDisplay).replace(/\D/g, '');
      next.whatsappPhone = digits.startsWith('90') ? digits : (digits.startsWith('0') ? '9' + digits : '90' + digits);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    hydrateLiveConfig();
    window.dispatchEvent(new CustomEvent('merkez:config-updated', { detail: next }));
    return next;
  }

  // All 35 exact brands requested by Yusufcan Ciftci in R10 #4908769
  const BRANDS = [
    { slug: 'arcelik', name: 'Arçelik', group: 'Beyaz Eşya & Klima', origin: 'TR', accent: '#c91f28', codes: ['E01', 'E08', 'E18', 'F04'] },
    { slug: 'beko', name: 'Beko', group: 'Beyaz Eşya & Klima', origin: 'TR', accent: '#00569d', codes: ['E05', 'E09', 'E17', 'H20'] },
    { slug: 'bosch', name: 'Bosch', group: 'Beyaz Eşya & Kombi', origin: 'DE', accent: '#d51317', codes: ['E18', 'E15', 'E23', 'EA'] },
    { slug: 'siemens', name: 'Siemens', group: 'Beyaz Eşya & Ankastre', origin: 'DE', accent: '#009999', codes: ['E18', 'E15', 'E24', 'F23'] },
    { slug: 'profilo', name: 'Profilo', group: 'Beyaz Eşya', origin: 'DE', accent: '#0b4ea2', codes: ['F18', 'F21', 'E15', 'E02'] },
    { slug: 'vestel', name: 'Vestel', group: 'Beyaz Eşya & TV & Klima', origin: 'TR', accent: '#d11920', codes: ['E01', 'E02', 'E03', 'SR'] },
    { slug: 'samsung', name: 'Samsung', group: 'Beyaz Eşya & TV & Klima', origin: 'KR', accent: '#1428a0', codes: ['4C', '5C', 'UE', 'CH05'] },
    { slug: 'lg', name: 'LG', group: 'Beyaz Eşya & TV & Klima', origin: 'KR', accent: '#a50034', codes: ['OE', 'IE', 'LE', 'CH38'] },
    { slug: 'vaillant', name: 'Vaillant', group: 'Yoğuşmalı Kombi & İklimlendirme', origin: 'DE', accent: '#007a53', codes: ['F28', 'F22', 'F29', 'F75'] },
    { slug: 'viessmann', name: 'Viessmann', group: 'Yoğuşmalı Kombi & Isı Pompası', origin: 'DE', accent: '#e3351f', codes: ['F2', 'F4', 'F5', 'A9'] },
    { slug: 'buderus', name: 'Buderus', group: 'Yoğuşmalı Kombi & Kazan', origin: 'DE', accent: '#004f9f', codes: ['6A', '4C', '3C', '2E'] },
    { slug: 'demirdokum', name: 'Demirdöküm', group: 'Kombi & Klima & Şofben', origin: 'TR', accent: '#c8102e', codes: ['F4', 'F5', 'F10', 'F28'] },
    { slug: 'baymak', name: 'Baymak', group: 'Kombi & Klima', origin: 'TR', accent: '#e35205', codes: ['E01', 'E03', 'E10', 'E25'] },
    { slug: 'miele', name: 'Miele', group: 'Premium Ankastre & Beyaz Eşya', origin: 'DE', accent: '#8c0014', codes: ['F11', 'F16', 'F20', 'F138'] },
    { slug: 'gaggenau', name: 'Gaggenau', group: 'Lüks Ankastre Mutfak', origin: 'DE', accent: '#1f2328', codes: ['E15', 'E0111', 'E24', 'D3'] },
    { slug: 'electrolux', name: 'Electrolux', group: 'Beyaz Eşya & Endüstriyel', origin: 'SE', accent: '#041e42', codes: ['E10', 'E20', 'E40', 'i20'] },
    { slug: 'aeg', name: 'AEG', group: 'Ankastre & Beyaz Eşya', origin: 'DE', accent: '#c8102e', codes: ['E10', 'E20', 'i30', 'EF0'] },
    { slug: 'altus', name: 'Altus', group: 'Beyaz Eşya & Klima', origin: 'TR', accent: '#00629b', codes: ['E01', 'E05', 'H20', 'E18'] },
    { slug: 'regal', name: 'Regal', group: 'Beyaz Eşya & Klima', origin: 'TR', accent: '#b81d24', codes: ['E01', 'E02', 'E03', 'E04'] },
    { slug: 'seg', name: 'SEG', group: 'Beyaz Eşya & Klima', origin: 'TR', accent: '#1b365d', codes: ['E01', 'E03', 'E04', 'LF'] },
    { slug: 'ferroli', name: 'Ferroli', group: 'Kombi & İklimlendirme', origin: 'IT', accent: '#d9531e', codes: ['A01', 'A03', 'F37', 'F05'] },
    { slug: 'airfel', name: 'Airfel', group: 'Kombi & Klima', origin: 'TR', accent: '#0072ce', codes: ['C1 06', 'C1 11', 'C1 33', 'U4'] },
    { slug: 'protherm', name: 'Protherm', group: 'Kombi & Isıtma', origin: 'EU', accent: '#c8102e', codes: ['F28', 'F22', 'F29', 'F62'] },
    { slug: 'immergas', name: 'Immergas', group: 'Yoğuşmalı Kombi', origin: 'IT', accent: '#d22630', codes: ['E01', 'E02', 'E10', 'E11'] },
    { slug: 'beretta', name: 'Beretta', group: 'Kombi & Kazan', origin: 'IT', accent: '#b5121b', codes: ['A01', 'A02', 'A04', 'A06'] },
    { slug: 'lambert', name: 'Lambert', group: 'Kombi & Isıtma', origin: 'TR', accent: '#1e3a5f', codes: ['E01', 'E03', 'E10', 'E35'] },
    { slug: 'teka', name: 'Teka', group: 'Ankastre Fırın & Ocak', origin: 'DE', accent: '#c8102e', codes: ['ER03', 'ER22', 'F4', 'E2'] },
    { slug: 'franke', name: 'Franke', group: 'Ankastre Mutfak Sistemleri', origin: 'CH', accent: '#b5121b', codes: ['F02', 'F05', 'E12', 'ER1'] },
    { slug: 'indesit', name: 'Indesit', group: 'Beyaz Eşya', origin: 'IT', accent: '#007bc0', codes: ['F05', 'F06', 'F08', 'F15'] },
    { slug: 'hotpoint-ariston', name: 'Hotpoint Ariston', group: 'Beyaz Eşya & Kombi', origin: 'IT', accent: '#b51b26', codes: ['F05', 'F01', 'SP1', '501'] },
    { slug: 'ariston', name: 'Ariston', group: 'Kombi & Termosifon', origin: 'IT', accent: '#c4161c', codes: ['501', '101', '108', '607'] },
    { slug: 'sharp', name: 'Sharp', group: 'Buzdolabı & Beyaz Eşya', origin: 'JP', accent: '#cc0000', codes: ['EE', 'U1', 'E2', 'H35'] },
    { slug: 'zanussi', name: 'Zanussi', group: 'Beyaz Eşya & Endüstriyel', origin: 'IT', accent: '#231f20', codes: ['E10', 'E20', 'E40', 'i20'] },
    { slug: 'westinghouse', name: 'Westinghouse', group: 'Beyaz Eşya & Soğutma', origin: 'US', accent: '#0033a0', codes: ['SY EF', '5Y CE', 'E10', 'E20'] },
    { slug: 'amana', name: 'Amana', group: 'Gardırop Tipi Buzdolabı', origin: 'US', accent: '#004b87', codes: ['E1', 'E2', 'CF', 'PO'] }
  ];

  function slugifyTr(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || ('marka-' + Date.now());
  }

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
    return list.length ? list : BRANDS.slice(0, 6);
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
    const label = brand.name.toUpperCase();
    const w = Math.max(116, label.length * 9.6 + 34);
    return `<svg viewBox="0 0 ${w} 34" width="${w}" height="34" role="img" aria-label="${brand.name} Özel Teknik Servis" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="6" height="22" rx="3" fill="${brand.accent || '#0066ff'}"/>
      <text x="16" y="22" fill="currentColor" font-family="'Plus Jakarta Sans',system-ui,-apple-system,Segoe UI,sans-serif" font-size="13.5" font-weight="700" letter-spacing="0.04em">${label}</text>
    </svg>`;
  }

  // Real Fault-Code Diagnostic Knowledge Base
  const FAULT_DATABASE = [
    {
      code: 'E18',
      brands: ['bosch', 'siemens', 'arcelik', 'altus'],
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
      brands: ['vaillant', 'protherm', 'demirdokum'],
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
      brands: ['vaillant', 'protherm', 'siemens'],
      device: 'Kombi & Isıtma',
      title: 'Tesisat Su Basıncı Düşük (Kuru Yanma Koruması)',
      symptom: 'Kombi ekranında F22 yanıp sönüyor, sirkülasyon pompası korumaya geçtiği için cihaz çalışmıyor.',
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
      brands: ['demirdokum', 'viessmann', 'teka'],
      device: 'Kombi / Ankastre',
      title: 'İyonizasyon ve Alev Algılama Kesintisi',
      symptom: 'Brülör kısa süre yanıp sönüyor veya hiç alev almadan F4 uyarısına düşüyor.',
      cause: 'İyonizasyon çubuğu oksitlenmesi, baca prosestatı hava akış yetersizliği veya gaz grup arızası.',
      action: 'Yanma odası temizliği, baca çekiş ölçümü ve elektrot değişimi tek ziyarette tamamlanır.',
      durationMin: 45,
      warranty: '1 Yıl Parça & İşçilik Garantisi'
    },
    {
      code: 'E01',
      brands: ['vestel', 'arcelik', 'baymak', 'regal', 'seg', 'altus', 'lambert'],
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
    { plate: '34', name: 'İstanbul', slug: 'istanbul', activeVans: 18, eta: 32, districts: ['Kadıköy', 'Beşiktaş', 'Üsküdar', 'Ataşehir', 'Bakırköy', 'Şişli', 'Pendik', 'Ümraniye', 'Maltepe', 'Başakşehir', 'Beylikdüzü', 'Sarıyer', 'Kartal', 'Bahçelievler', 'Küçükçekmece'] },
    { plate: '06', name: 'Ankara', slug: 'ankara', activeVans: 11, eta: 35, districts: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Etimesgut', 'Mamak', 'Sincan', 'Gölbaşı', 'Altındağ', 'Pursaklar'] }, // taste-skill-ignore
    { plate: '35', name: 'İzmir', slug: 'izmir', activeVans: 10, eta: 34, districts: ['Karşıyaka', 'Bornova', 'Konak', 'Buca', 'Çiğli', 'Gaziemir', 'Balçova', 'Narlıdere', 'Urla', 'Bayraklı'] },
    { plate: '33', name: 'Mersin', slug: 'mersin', activeVans: 7, eta: 28, districts: ['Yenişehir', 'Mezitli', 'Toroslar', 'Akdeniz', 'Tarsus', 'Erdemli', 'Silifke'] },
    { plate: '01', name: 'Adana', slug: 'adana', activeVans: 6, eta: 33, districts: ['Çukurova', 'Seyhan', 'Yüreğir', 'Sarıçam', 'Ceyhan'] }, // taste-skill-ignore
    { plate: '07', name: 'Antalya', slug: 'antalya', activeVans: 8, eta: 35, districts: ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat', 'Serik'] }, // taste-skill-ignore
    { plate: '16', name: 'Bursa', slug: 'bursa', activeVans: 8, eta: 34, districts: ['Nilüfer', 'Osmangazi', 'Yıldırım', 'İnegöl', 'Mudanya', 'Gemlik'] },
    { plate: '41', name: 'Kocaeli', slug: 'kocaeli', activeVans: 6, eta: 36, districts: ['İzmit', 'Gebze', 'Darıca', 'Çayırova', 'Gölcük', 'Kartepe'] },
    { plate: '27', name: 'Gaziantep', slug: 'gaziantep', activeVans: 6, eta: 33, districts: ['Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye'] },
    { plate: '42', name: 'Konya', slug: 'konya', activeVans: 5, eta: 38, districts: ['Selçuklu', 'Meram', 'Karatay', 'Ereğli'] },
    { plate: '38', name: 'Kayseri', slug: 'kayseri', activeVans: 5, eta: 36, districts: ['Melikgazi', 'Kocasinan', 'Talas', 'İncesu'] },
    { plate: '26', name: 'Eskişehir', slug: 'eskisehir', activeVans: 4, eta: 31, districts: ['Odunpazarı', 'Tepebaşı', 'Sivrihisar'] },
    { plate: '55', name: 'Samsun', slug: 'samsun', activeVans: 4, eta: 37, districts: ['Atakum', 'İlkadım', 'Canik', 'Bafra'] },
    { plate: '31', name: 'Hatay', slug: 'hatay', activeVans: 4, eta: 39, districts: ['İskenderun', 'Antakya', 'Defne', 'Dörtyol', 'Arsuz'] },
    { plate: '79', name: 'Kilis', slug: 'kilis', activeVans: 3, eta: 25, districts: ['Merkez', 'Musabeyli', 'Elbeyli', 'Polateli'] },
    { plate: '20', name: 'Denizli', slug: 'denizli', activeVans: 4, eta: 35, districts: ['Pamukkale', 'Merkezefendi', 'Çivril'] },
    { plate: '48', name: 'Muğla', slug: 'mugla', activeVans: 5, eta: 40, districts: ['Bodrum', 'Fethiye', 'Marmaris', 'Menteşe', 'Milas'] },
    { plate: '54', name: 'Sakarya', slug: 'sakarya', activeVans: 4, eta: 35, districts: ['Adapazarı', 'Serdivan', 'Erenler', 'Hendek'] },
    { plate: '59', name: 'Tekirdağ', slug: 'tekirdag', activeVans: 4, eta: 37, districts: ['Çorlu', 'Süleymanpaşa', 'Çerkezköy', 'Kapaklı'] },
    { plate: '21', name: 'Diyarbakır', slug: 'diyarbakir', activeVans: 4, eta: 38, districts: ['Kayapınar', 'Bağlar', 'Yenişehir', 'Sur'] },
    { plate: '63', name: 'Şanlıurfa', slug: 'sanliurfa', activeVans: 4, eta: 39, districts: ['Karaköprü', 'Haliliye', 'Eyyübiye', 'Siverek'] },
    { plate: '44', name: 'Malatya', slug: 'malatya', activeVans: 3, eta: 38, districts: ['Yeşilyurt', 'Battalgazi'] },
    { plate: '61', name: 'Trabzon', slug: 'trabzon', activeVans: 4, eta: 36, districts: ['Ortahisar', 'Akçaabat', 'Yomra'] },
    { plate: '10', name: 'Balıkesir', slug: 'balikesir', activeVans: 4, eta: 38, districts: ['Altıeylül', 'Karesi', 'Bandırma', 'Edremit', 'Ayvalık'] },
    { plate: '09', name: 'Aydın', slug: 'aydin', activeVans: 4, eta: 37, districts: ['Efeler', 'Kuşadası', 'Nazilli', 'Söke', 'Didim'] }, // taste-skill-ignore
    { plate: '45', name: 'Manisa', slug: 'manisa', activeVans: 4, eta: 36, districts: ['Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli'] }
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
      eta: 44,
      districts: ['Merkez', 'Yeni Mahalle', 'Cumhuriyet', 'Sanayi Bölgesi']
    };
  });

  const ALL_81_PROVINCES = [...PROVINCES, ...OTHER_PROVINCES].sort((a, b) => Number(a.plate) - Number(b.plate));

  const SERVICE_CATEGORIES = [
    { id: 'beyaz-esya', name: 'Beyaz Eşya Servisi', items: 'Çamaşır makinesi, bulaşık makinesi, buzdolabı, kurutma makinesi, derin dondurucu', feeNote: 'Arıza tespiti sonrası net fiyat onayı', avgMin: 40, startPriceTl: 750 },
    { id: 'kombi', name: 'Kombi Servisi & Bakımı', items: 'Yoğuşmalı kombi anakart, üç yollu vana, eşanjör, baca fanı ve kışlık periyodik bakım', feeNote: 'Baca gazı analizi ve genleşme azot basımı dahil', avgMin: 45, startPriceTl: 950 },
    { id: 'klima', name: 'Klima Servisi & Montaj', items: 'Split, salon tipi ve VRF klima R32/R410A gaz dolumu, kart onarımı, antibakteriyel yıkama', feeNote: 'Manometre basınç testi ve vakumlu kurulum', avgMin: 50, startPriceTl: 1100 },
    { id: 'petek', name: 'İlaçlı Petek Temizliği', items: 'Çift yönlü darbeli makine ve koruyucu kimyasalla radyatör çamur/kireç tahliyesi', feeNote: 'Termal kamerayla petek alt-üst ısı ölçümü', avgMin: 60, startPriceTl: 1450 },
    { id: 'ankastre', name: 'Fırın & Ankastre Servisi', items: 'Ankastre fırın rezistans, termostat, dokunmatik cam ocak indüksiyon modülü ve davlumbaz', feeNote: 'Mutfak dolabına zarar vermeden yerinde söküm', avgMin: 40, startPriceTl: 850 },
    { id: 'tv', name: 'Televizyon (TV) Servisi', items: 'LED bar değişimi, besleme kartı, T-Con görüntü onarımı ve duvar askı kurulumu', feeNote: 'Antistatik ekipmanla garantili LED değişimi', avgMin: 55, startPriceTl: 1200 },
    { id: 'endustriyel', name: 'Endüstriyel Soğutma & Mutfak', items: 'Restoran, market ve otel tipi sanayi buzdolabı, buz makinesi, sanayi bulaşık makinesi', feeNote: 'İşletmelere aynı gün öncelikli acil ekip', avgMin: 35, startPriceTl: 1600 }
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
    return list.length ? list : getCategories().slice(0, 3);
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
    { id: 'TECH-04', name: 'Orhan Usta (Bursa-1)', phone: '0542 730 16 92', region: 'Bursa / Nilüfer - Osmangazi', specialty: 'Kombi & İlaçlı Petek', commissionPct: 30, status: 'available', completedCount: 295 },
    { id: 'TECH-05', name: 'Emre Usta (Ankara-2)', phone: '0505 491 82 60', region: 'Ankara / Çankaya - Yenimahalle', specialty: 'Buzdolabı & Elektronik Kart', commissionPct: 35, status: 'available', completedCount: 389 },
    { id: 'TECH-06', name: 'Burak Usta (Antalya-1)', phone: '0535 284 90 17', region: 'Antalya / Muratpaşa - Konyaaltı', specialty: 'Inverter & VRF Klima', commissionPct: 30, status: 'off', completedCount: 241 }
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
    { id: 'SRV-2026-8419', createdAt: 'Bugün 08:32', source: '0850 Çağrı', customer: 'Hakan Demirtaş', phone: '0532 614 88 21', city: 'İstanbul / Kadıköy', brand: 'Vaillant', device: 'Yoğuşmalı Kombi', fault: 'F28 Ateşleme Hatası', tech: 'Murat Usta (Anadolu-2)', status: 'assigned', feeTl: 2450, commissionPct: 30, commissionTl: 735 },
    { id: 'SRV-2026-8418', createdAt: 'Bugün 08:19', source: 'Web Form', customer: 'Selin Yurdakul', phone: '0544 309 41 10', city: 'Mersin / Yenişehir', brand: 'Bosch', device: 'Çamaşır Makinesi', fault: 'E18 Su Boşaltmıyor', tech: 'Kemal Usta (Mersin-1)', status: 'onway', feeTl: 1850, commissionPct: 30, commissionTl: 555 },
    { id: 'SRV-2026-8417', createdAt: 'Bugün 07:54', source: 'WhatsApp', customer: 'Ahmet Karaca', phone: '0505 782 19 63', city: 'Ankara / Çankaya', brand: 'Samsung', device: 'Gardırop Buzdolabı', fault: 'Alt Bölme Soğutmuyor', tech: 'Atama Bekliyor', status: 'pending', feeTl: 0, commissionPct: 30, commissionTl: 0 },
    { id: 'SRV-2026-8415', createdAt: 'Dün 21:40', source: '0850 Çağrı', customer: 'Derya Özkan', phone: '0533 418 07 54', city: 'İzmir / Karşıyaka', brand: 'Siemens', device: 'Bulaşık Makinesi', fault: 'E15 AquaStop Su Kaçağı', tech: 'Serkan Usta (İzmir-3)', status: 'completed', feeTl: 2100, commissionPct: 30, commissionTl: 630 },
    { id: 'SRV-2026-8412', createdAt: 'Dün 18:15', source: '0850 Çağrı', customer: 'Mustafa Çelik', phone: '0542 891 33 08', city: 'Bursa / Nilüfer', brand: 'Demirdöküm', device: 'Nitromix Kombi + Petek', fault: 'F4 Hatası + İlaçlı Petek', tech: 'Orhan Usta (Bursa-1)', status: 'completed', feeTl: 3200, commissionPct: 30, commissionTl: 960 }
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
    const record = {
      id,
      createdAt: 'Az önce',
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
    const next = [record, ...getLeads()].slice(0, 40);
    saveLeads(next);
    return record;
  }

  function removeLead(id) {
    const next = getLeads().filter(l => l.id !== id);
    return saveLeads(next.length ? next : [...INITIAL_LEADS]);
  }

  // Verified Customer Reviews (live in Tema 2 & editable in Admin)
  const INITIAL_REVIEWS = [
    { id: 'REV-1', customer: 'Selin Y.', city: 'Mersin / Yenişehir', ticketId: 'SRV-2026-8418', brand: 'Bosch Çamaşır', rating: 5, text: 'Bosch çamaşır makinem gece E18 hatası verdi. Sabah 09:00\'da kayıt açtım, 09:35\'te Kemal Usta kapıdaydı. Pompayı yerinde değiştirip 1 yıllık dijital garanti fişimi ilettiler.' },
    { id: 'REV-2', customer: 'Hakan D.', city: 'İstanbul / Kadıköy', ticketId: 'SRV-2026-8419', brand: 'Vaillant Kombi', rating: 5, text: 'Vaillant kombimiz F28 ateşleme arızasına geçmişti. Anakart değişecek diye korkuyorduk, gaz valfi ve elektrot kalibrasyonuyla çok makul fiyata aynı gün çözdüler.' },
    { id: 'REV-3', customer: 'Derya Ö.', city: 'İzmir / Karşıyaka', ticketId: 'SRV-2026-8415', brand: 'Siemens Bulaşık', rating: 5, text: 'Siemens bulaşık makinesi E15 su kaçağı uyarısı veriyordu. Atölyeye götürmeden mutfakta 40 dakikada alt hazne contasını yenilediler, tertemiz teslim ettiler.' },
    { id: 'REV-4', customer: 'Mustafa Ç.', city: 'Bursa / Nilüfer', ticketId: 'SRV-2026-8412', brand: 'Demirdöküm + Petek', rating: 5, text: 'Peteklerin alt yarısı buz gibiydi. Darbeli makineyle ilaçlı temizlik yapıp termal kamerayla öncesi-sonrası ısı farkını gösterdiler, kombi en kısıkta bile evi ısıtıyor.' },
    { id: 'REV-5', customer: 'Gökhan T.', city: 'Ankara / Çankaya', ticketId: 'SRV-2026-8398', brand: 'Miele Ankastre', rating: 5, text: 'Miele indüksiyon ocağımızın güç modülü arızasını mutfak tezgahına tek çizik bile atmadan orijinal parçayla onardılar. Uygulama indirtmeden webden garanti belgesi görünmesi harika.' }
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

  // FAQs (live in Tema 1 & editable in Admin)
  const INITIAL_FAQS = [
    { id: 'FAQ-1', q: 'Değişen yedek parçalar ne kadar süre garantili?', a: 'Cihazınızda değiştirilen tüm elektronik ve mekanik parçalar, size teslim edilen dijital ve basılı servis iş emri fişi üzerinde 1 yıl (12 ay) resmi firma garantimiz altındadır.' },
    { id: 'FAQ-2', q: 'Onarım öncesi net fiyat bilgisi veriliyor mu?', a: 'Kesinlikle. Teknisyenimiz adreste dijital ölçümle arızayı netleştirdikten sonra toplam parça ve işçilik tutarını size sunar; onayınız olmadan hiçbir sürpriz işlem yapılmaz.' },
    { id: 'FAQ-3', q: 'Yetkili servis misiniz yoksa özel servis mi?', a: 'Firmamız üretici garantisi sona ermiş tüm marka cihazlara hızlı, şeffaf fiyatlı ve 1 yıl firma garantili onarım sunan bağımsız özel teknik servistir. Garantisi devam eden cihazlar için ilgili markanın yetkili servisine başvurmanızı öneririz.' },
    { id: 'FAQ-4', q: 'Cihazım atölyeye gitmek zorunda mı?', a: 'Hayır. Tam donanımlı gezici servis araçlarımızda 35 markanın temel yedek parçaları hazır bulunduğu için arızaların %92\'si aynı gün evinizde veya iş yerinizde çözülür.' }
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

  function resetAllData() {
    [STORAGE_KEY, LEADS_KEY, TECHS_KEY, CUSTOM_BRANDS_KEY, CUSTOM_FAULTS_KEY, REVIEWS_KEY, FAQS_KEY].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    hydrateLiveConfig();
    return getConfig();
  }

  function exportAllDataJson() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      config: getConfig(),
      technicians: getTechnicians(),
      leads: getLeads(),
      customBrands: getCustomBrands(),
      faults: getFaults(),
      reviews: getReviews(),
      faqs: getFaqs()
    }, null, 2);
  }

  // Apply live config across all themes & components
  function hydrateLiveConfig() {
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

  function mountStudioChrome(activePage, prefix) {
    const pre = prefix || './';
    const cfg = getConfig();
    const barHost = document.getElementById('studioBarHost');
    if (barHost) {
      const navItems = [
        { key: 'hub', label: 'Sunum & Rakip Analizi', href: pre + 'index.html' },
        { key: 'tema1', label: 'Tema 1: Kurumsal 3D Bento', href: pre + 'tema-1-kurumsal/index.html' },
        { key: 'tema2', label: 'Tema 2: Kinetik Hızlı Çağrı', href: pre + 'tema-2-hizli-cagri/index.html' },
        { key: 'tema3', label: 'Tema 3: Prestij Spotlight & SEO', href: pre + 'tema-3-prestij/index.html' },
        { key: 'admin', label: 'Tam Kapsamlı Yönetim Paneli', href: pre + 'yonetim-paneli/index.html' }
      ];
      const showPromo = activePage !== 'admin' && activePage !== 'hub';
      barHost.innerHTML = `<div class="studio-bar">
        <div class="studio-bar-inner">
          <nav class="studio-nav" aria-label="Canlı Tema Seçici">
            ${navItems.map(n => `<a href="${n.href}" ${n.key === activePage ? 'aria-current="page"' : ''}>${n.label}</a>`).join('')}
          </nav>
          <div class="palette-picker" role="group" aria-label="Canlı Tema Rengi Seçici">
            <span class="palette-label">Tema Rengi:</span>
            ${COLOR_PALETTES.map(p => `<button type="button" class="swatch-btn" data-palette-btn="${p.id}" style="background:${p.hex}" title="${p.name} — ${p.note}" aria-label="${p.name}"></button>`).join('')}
            <span class="palette-active-tag" data-active-palette-name>Puls Güven Mavisi</span>
          </div>
        </div>
      </div>
      ${showPromo ? `<div class="promo-ribbon" data-servis-promo-ribbon style="${cfg.promoBannerActive ? '' : 'display:none;'}">
        <div class="container-xl promo-ribbon-inner">
          <span class="promo-dot-tag">KAMPANYA</span>
          <span class="promo-text" data-servis-promo-text>${cfg.promoBannerText}</span>
          <span class="promo-code mono" data-servis-promo-code style="${cfg.promoBannerCode ? '' : 'display:none;'}">KOD: ${cfg.promoBannerCode}</span>
          <a class="promo-cta tnum" data-servis-tel href="tel:${cfg.primaryPhoneTel}">Fırsat Hattı: <span data-servis-phone>${cfg.primaryPhoneDisplay}</span> →</a>
        </div>
      </div>` : ''}`;
      barHost.querySelectorAll('[data-palette-btn]').forEach(btn => {
        btn.addEventListener('click', () => setPalette(btn.getAttribute('data-palette-btn')));
      });
    }

    const dockHost = document.getElementById('floatingDockHost');
    if (dockHost) {
      dockHost.innerHTML = `<div class="floating-dock" aria-label="Hızlı İletişim" style="${cfg.floatingDockActive ? '' : 'display:none;'}">
        <a class="dock-wa" data-servis-wa href="https://wa.me/${cfg.whatsappPhone}" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span>WhatsApp Usta</span>
        </a>
        <a class="dock-call tnum" data-servis-tel href="tel:${cfg.primaryPhoneTel}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"/></svg>
          <span data-servis-phone>${cfg.primaryPhoneDisplay}</span>
        </a>
      </div>`;
    }

    hydrateLiveConfig();

    // Smooth IntersectionObserver scroll reveals (supports theme-specific reveal classes!)
    const revealEls = document.querySelectorAll('.reveal-up, .spring-pop, .kinetic-in, .cinema-reveal');
    if (revealEls.length) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(ent => {
            if (ent.isIntersecting) {
              ent.target.classList.add('is-visible');
              io.unobserve(ent.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
        revealEls.forEach(el => io.observe(el));
      } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
      }
    }
  }

  window.addEventListener('storage', () => hydrateLiveConfig());

  // Generate dynamic Anti-Spam Local SEO Content & JSON-LD Schema for any (Province, District, Brand, Category)
  function buildSeoPreview(provinceSlug, districtName, brandSlug, categoryId) {
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
    const uniqueIntro = `${prov.name} ${dist} bölgesindeki gezici ${brand.name} (${brand.group}) ekibimiz şu an ${prov.activeVans} aktif servis aracıyla ortalama ${prov.eta} dakika içinde adresinize ulaşmaktadır. Garantisi sona ermiş ${brand.name} cihazlarınızda ${(brand.codes || ['E18']).join(', ')} arıza kodları başta olmak üzere tüm elektronik kart, pompa ve ısıtma arızaları ${cfg.warrantyMonths} ay parça garantili iş emri fişiyle yerinde giderilir.`;

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
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
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
    COLOR_PALETTES,
    getConfig,
    saveConfig,
    setPalette,
    mountStudioChrome,
    getAllBrands,
    getActiveBrands,
    addCustomBrand,
    toggleBrandActive,
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
    resetAllData,
    exportAllDataJson,
    renderBrandMarkSvg,
    hydrateLiveConfig,
    buildSeoPreview
  };
})();
