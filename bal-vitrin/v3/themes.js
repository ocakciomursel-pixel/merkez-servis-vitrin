import { escape as e, imageNames } from "./core.js";
export const themes = {
  yayladan: {
    name: "Yayladan",
    subtitle: "bal & arıcılık",
    label: "Doğal & sıcak",
    title: "İyi balın\nbir hikâyesi var.",
    intro:
      "Çiçekten kovana, kovandan sofranıza.\nGünün en güzel başlangıcı için kendinize bir kavanoz ayırın.",
    tagline: "Doğadan, olduğu gibi.",
    cta: "Sofrana bir tat kat",
    image: "hero-honey.webp",
    collection: "Sana göre bir kavanoz.",
    description: "Güneşli fotoğraflar, orman yeşili ve sıcak bir sofra daveti.",
  },
  gece: {
    name: "Gece Hasadı",
    subtitle: "seçkin bal koleksiyonu",
    label: "Sinematik & seçkin",
    title: "Doğanın en\nderin notaları.",
    intro:
      "Kestanenin yoğunluğu. Balın sıcaklığı.\nHer kavanozda keşfedilmeyi bekleyen bir lezzet.",
    tagline: "Az söz. Derin lezzet.",
    cta: "Koleksiyona gir",
    image: "chestnut.webp",
    collection: "Damakta iz bırakanlar.",
    description:
      "Tam ekran sahne, koyu zemin, altın çizgiler ve seçkin bir tadım deneyimi.",
  },
  kulup: {
    name: "Bal Kulübü",
    subtitle: "kahvaltının neşeli hali",
    label: "Cesur & eğlenceli",
    title: "Günaydın,\ntatlı insan!",
    intro:
      "Ekmeğe sür, yoğurda kat, kaşığı daldır.\nKahvaltının en neşeli üyesiyle tanış.",
    tagline: "Sofraya biraz neşe.",
    cta: "Favorini kap",
    image: "honeycomb.webp",
    collection: "Kahvaltı ekibin hazır.",
    description:
      "Turuncu ve kobalt, iri harfler, kalın çerçeveler ve hareketli ürün kartları.",
  },
  atolye: {
    name: "Kovan Atölyesi",
    subtitle: "bal, sade haliyle",
    label: "Editoryal & yalın",
    title: "Sadece bal.\nKendi halinde güzel.",
    intro:
      "Lezzeti anlamak için yavaşlayın.\nGramajınızı seçin, sofranızda bir yer açın.",
    tagline: "Lezzetin sade bir yorumu.",
    cta: "Ürünleri incele",
    image: "hero-honey.webp",
    collection: "Özenle seçilen lezzetler.",
    description:
      "Beyaz alan, dengeli tipografi, galeri düzeni ve sakin bir alışveriş deneyimi.",
  },
};
export const detailFields = {
  navProducts: ["Ürünler menüsü", "Bal koleksiyonu"],
  navStory: ["Hikâye menüsü", "Kovandan sofraya"],
  navFaq: ["SSS menüsü", "Merak edilenler"],
  collectionLabel: ["Koleksiyon üst etiketi", "Kahvaltının en tatlı tarafı"],
  storyLabel: ["Hikâye üst etiketi", "Kovandan sofraya"],
  storyCaption: [
    "Hikâye fotoğrafı alt yazısı",
    "Küçük bir kovandan, kocaman bir sofraya.",
  ],
  storyLink: ["Hikâye düğmesi", "Kendi lezzetini bul"],
  pairingLabel: ["Sofra üst etiketi", "Küçük bir sofra önerisi"],
  pairingCta: ["Sofra düğmesi", "Kahvaltını tamamla"],
  faqLabel: ["SSS üst etiketi", "Aklınızda kalmasın"],
  faqTitle: ["SSS başlığı", "Merak edilenler."],
  faqIntro: ["SSS açıklaması", "Seçimden siparişe, ihtiyacınız olan bilgiler."],
  closingCta: ["Kapanış düğmesi", "Koleksiyonu keşfet"],
  heroFoot: ["Ana ekran küçük notu", "Biraz yavaşla.\nDoğanın tadını çıkar."],
  photoCaption: ["Ana fotoğraf alt yazısı", "Bir sofra hikâyesi"],
  roundTop: ["Yuvarlak rozet üst satırı", "Bir kaşık"],
  roundMain: ["Yuvarlak rozet ana metni", "mutluluk."],
  roundBottom: ["Yuvarlak rozet alt satırı", "Her sabah yeniden"],
  benefit1: ["Bilgi şeridi 1", "Damak tadına göre seçim"],
  benefit2: ["Bilgi şeridi 2", "Kavanozunu, gramajını seç"],
  benefit3: ["Bilgi şeridi 3", "Kargo tutarı baştan belli"],
  seoTitle: ["Tarayıcı başlığı", ""],
  seoDescription: [
    "Sayfa açıklaması",
    "Bal ve arıcılık ürünleri için etkileşimli mağaza demosu.",
  ],
};
export function defaultSite() {
  return {
    ...Object.fromEntries(
      Object.entries(detailFields).map(([key, [label, value]]) => [key, value]),
    ),
    theme: "yayladan",
    motion: true,
    brandName: "",
    brandSubtitle: "",
    tagline: "",
    heroTitle: "",
    heroText: "",
    heroCta: "",
    heroImage: "",
    collectionTitle: "",
    collectionText:
      "Hafif ve çiçeksi mi, yoğun ve karakterli mi? Sevdiğin lezzeti bul, gramajını seç.",
    storyTitle: "Doğanın ritmine\nbir yer açın.",
    storyText:
      "Bir kavanoz bal; çiçeklerin, arıların ve emeğin buluşması. Bizce iyi bir sofra, neyi sevdiğinizi bilmekle başlıyor.",
    storyImage: "apiary.webp",
    pairingTitle: "Bir kaşık bal.\nBinbir güzel eşlikçi.",
    pairingText:
      "Sıcak bir dilim ekmek, taze bir peynir veya yoğurdun üzerine küçük bir dokunuş. Sevdiğiniz ritüelinize biraz tat katın.",
    pairingImage: "honeycomb.webp",
    closingTitle: "Sofranızda doğaya yer var.",
    footerText: "Doğadan, olduğu gibi.",
    email: "",
    phone: "",
    address: "",
    instagram: "",
    sections: { story: true, pairing: true, faq: true, closing: true },
    faqs: [
      {
        q: "Hangi balı seçmeliyim?",
        a: "Hafif bir tat için çiçek balını, yoğun aroma için kestane balını seçebilirsiniz. Ürün detaylarından gramajı ve lezzet notlarını inceleyin.",
      },
      {
        q: "Kargo nasıl hesaplanıyor?",
        a: "Sepetinizde güncel kargo koşulları ve indirim sonrası toplam tutar açıkça gösterilir.",
      },
      {
        q: "Tahlil bilgilerini inceleyebilir miyim?",
        a: "Ürün detaylarında sentetik örnek analiz kartları bulunur. Gerçek laboratuvar belgesi değildir; işletmenin kendi belgeleriyle değiştirilecektir.",
      },
      {
        q: "Buradan gerçek sipariş verebilir miyim?",
        a: "Bu bir demo sunumudur. Gerçek ödeme alınmaz, WhatsApp mesajı gönderilmez. Kayıtlar bu tarayıcıda saklanır.",
      },
    ],
  };
}
export function siteConfig(state) {
  const site = {
    ...defaultSite(),
    ...state.site,
    sections: { ...defaultSite().sections, ...state.site?.sections },
  };
  return { ...site, ...(!themes[site.theme] ? { theme: "yayladan" } : {}) };
}
export function selectedTheme(state) {
  const requested = new URLSearchParams(location.search).get("tema");
  return themes[requested] ? requested : siteConfig(state).theme;
}
export function themeSelector(state) {
  const current = selectedTheme(state);
  return `<div class="theme-switcher" aria-label="Tasarım kimlikleri"><span>Dört ayrı kimlik</span><div>${Object.entries(
    themes,
  )
    .map(
      ([id, t]) =>
        `<button data-theme="${id}" aria-pressed="${id === current}" class="theme-choice ${id === current ? "selected" : ""}"><i class="swatch ${id}"></i>${e(t.name)}</button>`,
    )
    .join("")}</div><a href="admin.html#studio">Tasarımı yönet ↗</a></div>`;
}
function text(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}
function image(selector, value) {
  const el = document.querySelector(selector);
  if (el && imageNames.includes(value)) {
    el.src = "assets/" + value;
    el.alt = {
      "hero-honey.webp": "Bal kavanozu ve petekten oluşan konsept sunum",
      "chestnut.webp": "Kestane balı kavanozu konsepti",
      "honeycomb.webp": "Seramik tabakta bal peteği konsepti",
      "pollen.webp": "Arı poleni kavanozu konsepti",
      "apiary.webp": "Doğada arı kovanları konsepti",
    }[value];
  }
}
export function applySite(state) {
  const s = siteConfig(state),
    key = selectedTheme(state),
    t = themes[key];
  document.body.dataset.theme = key;
  document.body.classList.toggle("no-motion", !s.motion);
  document.querySelectorAll(".wordmark").forEach((el) => {
    el.innerHTML = `${e(s.brandName || t.name)}<span>${e(s.brandSubtitle || t.subtitle)}</span>`;
    el.setAttribute("aria-label", (s.brandName || t.name) + " ana sayfa");
  });
  document.title =
    s.seoTitle || (s.brandName || t.name) + " — Bal & arıcılık demosu";
  text("#hero-title", s.heroTitle || t.title);
  text(".hero-copy>p", s.heroText || t.intro);
  const origin = document.querySelector(".origin");
  if (origin)
    origin.innerHTML = `<span class="little-flower">✳</span> ${e(s.tagline || t.tagline)}`;
  const cta = document.querySelector(".hero-copy>.button");
  if (cta) {
    cta.innerHTML =
      e(s.heroCta || t.cta) + ' <span aria-hidden="true">↗</span>';
  }
  image("#hero-image", s.heroImage || t.image);
  text(".photo-note", (s.brandName || t.name) + " bir sofra hikâyesi");
  text("#collection-title", s.collectionTitle || t.collection);
  text(".section-intro>p", s.collectionText);
  text(".story-copy h2", s.storyTitle);
  text(".story-copy>p", s.storyText);
  const ps = document.querySelectorAll(".story-copy>p");
  if (ps[1]) ps[1].hidden = true;
  image(".story-photo img", s.storyImage);
  text(".pairing h2", s.pairingTitle);
  text(".pairing p", s.pairingText);
  image(".pairing img", s.pairingImage);
  text(".closing h2", s.closingTitle);
  text(".footer>p", s.footerText);
  for (const [key, selector] of Object.entries({
    story: ".story",
    pairing: ".pairing",
    faq: ".faq",
    closing: ".closing",
  })) {
    const el = document.querySelector(selector);
    if (el) el.hidden = !s.sections[key];
  }
  document
    .querySelectorAll('a[href="#hikaye"]')
    .forEach((a) => (a.hidden = !s.sections.story));
  document
    .querySelectorAll('a[href="#sorular"]')
    .forEach((a) => (a.hidden = !s.sections.faq));
  const faq = document.querySelector(".faq-list");
  if (faq)
    faq.innerHTML =
      s.faqs
        .map(
          (f) =>
            `<details><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`,
        )
        .join("") +
      '<p class="small muted">Örnek ürün sunumu. Gerçek ürün ve işletme bilgileri ayrıca doğrulanacaktır.</p>';
  const contact = document.querySelector("#store-contact");
  if (contact)
    contact.innerHTML = [
      s.email && `<a href="mailto:${e(s.email)}">${e(s.email)}</a>`,
      s.phone && `<span>${e(s.phone)}</span>`,
      s.address && `<span>${e(s.address)}</span>`,
      s.instagram && `<span>${e(s.instagram)}</span>`,
    ]
      .filter(Boolean)
      .join("");

  const detailsMap = {
    navProducts: '.header nav a[href="#urunler"]',
    navStory: '.header nav a[href="#hikaye"]',
    navFaq: '.header nav a[href="#sorular"]',
    collectionLabel: ".section-intro .section-note",
    storyLabel: ".story-copy .section-note",
    storyCaption: ".story-photo>span",
    storyLink: ".story-copy .text-link",
    pairingLabel: ".pairing .section-note",
    pairingCta: ".pairing .button",
    faqLabel: ".faq>div>.section-note",
    faqTitle: ".faq h2",
    faqIntro: ".faq>div>p",
    closingCta: ".closing .button",
    heroFoot: ".hero-foot>span:last-child",
    photoCaption: ".photo-note",
    roundTop: ".round-note>span:first-child",
    roundMain: ".round-note>strong",
    roundBottom: ".round-note>span:last-child",
  };
  for (const [key, selector] of Object.entries(detailsMap))
    text(selector, s[key]);
  for (let i = 1; i <= 3; i++) {
    const el = document.querySelector(
      ".benefit-strip>span:nth-child(" + i + ")",
    );
    if (el) {
      const icon = el.querySelector("[data-icon]")?.outerHTML || "";
      el.innerHTML = icon + " " + e(s["benefit" + i]);
    }
  }
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", s.seoDescription);

  const selector = document.querySelector("#theme-selector");
  if (selector) selector.innerHTML = themeSelector(state);
}
