import { defaultSite } from "./themes.js";
export const KEY = "o2io.yayladan.demo.v2.1";
export const money = (n) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
export const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const imageNames = [
  "hero-honey.webp",
  "chestnut.webp",
  "honeycomb.webp",
  "pollen.webp",
  "apiary.webp",
];
export function seed() {
  return {
    version: 2,
    site: defaultSite(),
    campaign: { code: "BAL10", percent: 10, min: 0, enabled: true },
    revision: 0,
    products: [
      {
        id: "cicek",
        name: "Yayla çiçek balı",
        category: "suzme",
        note: "Yumuşak & çiçeksi",
        description:
          "Kahvaltı sofralarına yakışan çiçeksi bir lezzet. Hafif aromaları sevenler için iyi bir başlangıç.",
        image: "hero-honey.webp",
        badge: "Sofranın klasiği",
        active: true,
        variants: [
          { id: "450", label: "450 g", price: 480, stock: 24 },
          { id: "850", label: "850 g", price: 850, stock: 18 },
        ],
      },
      {
        id: "kestane",
        name: "Kestane balı",
        category: "suzme",
        note: "Yoğun & kendine özgü",
        description:
          "Koyu rengi ve belirgin aromasıyla daha güçlü tatlardan hoşlananlara. Az miktarda bile kendini hissettiren bir seçim.",
        image: "chestnut.webp",
        badge: "Yoğun lezzet",
        active: true,
        variants: [
          { id: "450", label: "450 g", price: 620, stock: 12 },
          { id: "850", label: "850 g", price: 1120, stock: 8 },
        ],
      },
      {
        id: "petek",
        name: "Doğal petek balı",
        category: "petek",
        note: "Peteğinden sofraya",
        description:
          "Balı peteğiyle birlikte sevenlere. Kahvaltıda küçük porsiyonlarla sunabileceğiniz dokulu bir deneyim.",
        image: "honeycomb.webp",
        badge: "Petek sevenlere",
        active: true,
        variants: [
          { id: "500", label: "500 g", price: 690, stock: 14 },
          { id: "1000", label: "1 kg", price: 1280, stock: 6 },
        ],
      },
      {
        id: "polen",
        name: "Arı poleni",
        category: "ari",
        note: "Küçük bir dokunuş",
        description:
          "Yoğurdunuza, granolanıza veya kahvaltılık karışımlarınıza eşlik edecek arıcılık ürünü. Arı ürünlerine alerjiniz varsa tüketmeyin.",
        image: "pollen.webp",
        badge: "Kahvaltıya eşlikçi",
        active: true,
        variants: [
          { id: "100", label: "100 g", price: 240, stock: 16 },
          { id: "250", label: "250 g", price: 520, stock: 10 },
        ],
      },
    ].map((p) => ({
      ...p,
      analysis:
        p.category === "ari"
          ? null
          : {
              batch: "DEMO-2026-" + p.id.toUpperCase(),
              harvest: "2026 / Örnek hasat",
              proline: 650,
              moisture: 17.2,
            },
    })),
    cart: [],
    coupon: "",
    orders: [],
    settings: {
      shipping: 65,
      freeShipping: 750,
      storeName: "Yayladan",
      announcement: "750 TL ve üzeri siparişlerde kargo bizden.",
    },
  };
}
export function load(storage = globalThis.localStorage) {
  try {
    const state = JSON.parse(storage.getItem(KEY));
    if (
      state?.version === 2 &&
      Array.isArray(state.products) &&
      Array.isArray(state.cart) &&
      Array.isArray(state.orders) &&
      state.settings
    )
      return {
        ...state,
        site: { ...defaultSite(), ...state.site },
        campaign: state.campaign || {
          code: "BAL10",
          percent: 10,
          min: 0,
          enabled: true,
        },
      };
  } catch {}
  return seed();
}
export function save(state, storage = globalThis.localStorage) {
  state.revision = (state.revision || 0) + 1;
  storage.setItem(KEY, JSON.stringify(state));
  return state;
}
export function findVariant(state, pid, vid) {
  const product = state.products.find((p) => p.id === pid);
  return { product, variant: product?.variants.find((v) => v.id === vid) };
}
export function totals(state) {
  let subtotal = 0;
  const lines = [];
  const issues = [];
  for (const item of state.cart) {
    const { product, variant } = findVariant(state, item.pid, item.vid);
    if (
      !product?.active ||
      !variant ||
      !Number.isInteger(item.qty) ||
      item.qty < 1
    ) {
      issues.push("Sepetteki bir ürün artık satışta değil.");
      continue;
    }
    if (item.qty > variant.stock)
      issues.push(
        `${product.name}: en fazla ${variant.stock} adet alınabilir.`,
      );
    subtotal += variant.price * item.qty;
    lines.push({
      ...item,
      name: product.name,
      label: variant.label,
      image: product.image,
      price: variant.price,
      stock: variant.stock,
    });
  }
  const campaign = state.campaign || {
    code: "BAL10",
    percent: 10,
    min: 0,
    enabled: true,
  };
  const discount =
    campaign.enabled &&
    state.coupon === campaign.code &&
    subtotal >= campaign.min
      ? Math.round((subtotal * campaign.percent) / 100)
      : 0;
  const discounted = subtotal - discount;
  const shipping =
    lines.length && discounted < state.settings.freeShipping
      ? state.settings.shipping
      : 0;
  return {
    lines,
    issues,
    subtotal,
    discount,
    couponCode: discount ? state.coupon : "",
    shipping,
    total: discounted + shipping,
    remaining: Math.max(0, state.settings.freeShipping - discounted),
    count: lines.reduce((n, l) => n + l.qty, 0),
  };
}
export function addToCart(state, pid, vid, qty = 1) {
  const { product, variant } = findVariant(state, pid, vid);
  if (!product?.active || !variant) throw Error("Bu ürün satışta değil.");
  if (!Number.isInteger(qty) || qty < 1) throw Error("Geçerli bir adet seçin.");
  const existing = state.cart.find((c) => c.pid === pid && c.vid === vid);
  if ((existing?.qty || 0) + qty > variant.stock)
    throw Error(`Bu gramajda ${variant.stock} adet stok var.`);
  if (existing) existing.qty += qty;
  else state.cart.push({ pid, vid, qty });
  return state;
}
export function changeQuantity(state, pid, vid, qty) {
  const item = state.cart.find((c) => c.pid === pid && c.vid === vid);
  if (!item) return;
  if (qty <= 0) {
    state.cart = state.cart.filter((c) => c !== item);
    return;
  }
  const { variant } = findVariant(state, pid, vid);
  if (!Number.isInteger(qty) || !variant || qty > variant.stock)
    throw Error("Stok sınırına ulaştınız.");
  item.qty = qty;
}
export function placeOrder(
  state,
  { name = "Demo ziyaretçi", city = "İstanbul", method = "whatsapp" } = {},
) {
  const t = totals(state);
  if (!t.lines.length) throw Error("Önce sepetinize ürün ekleyin.");
  if (t.issues.length) throw Error(t.issues[0]);
  if (!["whatsapp", "card", "wire"].includes(method))
    throw Error("Bir sipariş yöntemi seçin.");
  if (state.settings.methods && state.settings.methods[method] === false)
    throw Error("Bu sipariş yöntemi kapalı. Başka bir yöntem seçin.");
  const order = {
    id: `YAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    created: new Date().toISOString(),
    name: String(name).trim().slice(0, 80) || "Demo ziyaretçi",
    city: String(city).trim().slice(0, 60) || "İstanbul",
    method,
    status: "Yeni",
    ...t,
  };
  for (const line of t.lines)
    findVariant(state, line.pid, line.vid).variant.stock -= line.qty;
  state.orders.unshift(order);
  state.cart = [];
  state.coupon = "";
  return order;
}
export function setOrderStatus(state, id, status) {
  if (
    ![
      "Yeni",
      "Hazırlanıyor",
      "Kargoya verildi",
      "Tamamlandı",
      "İptal",
    ].includes(status)
  )
    throw Error("Geçersiz durum.");
  const o = state.orders.find((o) => o.id === id);
  if (!o) throw Error("Sipariş bulunamadı.");
  if (o.status === "İptal" && status !== "İptal")
    throw Error("İptal edilen sipariş yeniden açılamaz.");
  if (status === "İptal" && o.status !== "İptal")
    for (const l of o.lines) {
      const { variant } = findVariant(state, l.pid, l.vid);
      if (variant) variant.stock += l.qty;
    }
  o.status = status;
  return o;
}
export function orderMessage(o) {
  return `Merhaba, demo sipariş özetim:\n${o.lines.map((l) => `${l.name} · ${l.label} × ${l.qty}: ${money(l.price * l.qty)}`).join("\n")}\nAra toplam: ${money(o.subtotal)}\nİndirim: ${money(o.discount)}\nKargo: ${money(o.shipping)}\nGenel toplam: ${money(o.total)}\nSipariş: ${o.id}\nBu bir demo kaydıdır; gerçek sipariş veya ödeme oluşturulmamıştır.`;
}
export const icons = {
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 3C9 1 2 7 5 15c8 7 16 0 15-12Z"/><path d="M3 22 16 8"/></svg>',
  truck:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 5h12v12H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m5 12 4 4L19 6"/></svg>',
};
export function notify(message, error = false) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.toggle("error", error);
  el.classList.add("show");
  clearTimeout(globalThis.toastTimer);
  globalThis.toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}
