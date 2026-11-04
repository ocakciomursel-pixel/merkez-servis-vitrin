import { siteConfig, themes } from "./themes.js";
import {
  enhanceProductEditor,
  readVariants,
  orderFields,
  bindManagement,
} from "./management.js";
import { studio, campaigns, bindStudio } from "./studio.js";
import { analysisFields, readAnalysis } from "./analysis.js";
import {
  KEY,
  seed,
  load,
  save,
  setOrderStatus,
  money,
  escape as e,
  icons,
  imageNames,
  notify,
} from "./core.js";
let state = load(),
  tab = location.hash === "#studio" ? "studio" : "overview",
  search = "",
  statusFilter = "all";
const $ = (s) => document.querySelector(s);
const tabs = {
  overview: "Genel bakış",
  orders: "Siparişler",
  products: "Ürünler & stok",
  settings: "Mağaza ayarları",
  studio: "Tasarım & içerik",
  campaigns: "Kampanyalar & sipariş",
};
const statuses = [
  "Yeni",
  "Hazırlanıyor",
  "Kargoya verildi",
  "Tamamlandı",
  "İptal",
];
const formatDate = (s) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s));
function badge(status) {
  return `<span class="state-badge ${status === "Yeni" ? "new" : status === "İptal" ? "cancelled" : status === "Tamamlandı" ? "done" : ""}">${e(status)}</span>`;
}
function pageTitle(title, desc, action = "") {
  return `<div class="admin-page-title"><div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;
}
function overview() {
  const valid = state.orders.filter((o) => o.status !== "İptal"),
    sum = valid.reduce((n, o) => n + o.total, 0),
    stock = state.products.reduce(
      (n, p) => n + p.variants.reduce((t, v) => t + v.stock, 0),
      0,
    ),
    recent = state.orders.slice(0, 5);
  return `${pageTitle("Mağazanıza hoş geldiniz.", "Ürünler, stoklar ve siparişler tek bir yerde.", '<a href="index.html" class="button secondary small">Mağazayı aç ↗</a>')}<div class="welcome-banner"><div><h2>Güzel bir gün, tatlı bir başlangıç.</h2><p>Mağazadan bir demo siparişi oluşturun. Siparişin buraya nasıl geldiğini, stokların nasıl güncellendiğini birlikte deneyin.</p></div><a href="index.html#urunler" class="button pale">Sipariş akışını dene ${icons.arrow}</a></div><div class="stats"><article class="stat"><span>Demo sipariş tutarı</span><strong>${money(sum)}</strong><small>Tahsilat değildir · iptaller hariç</small></article><article class="stat"><span>Toplam sipariş</span><strong>${state.orders.length}</strong><small>${state.orders.filter((o) => o.status === "Yeni").length} yeni kayıt</small></article><article class="stat"><span>Aktif ürün</span><strong>${state.products.filter((p) => p.active).length}</strong><small>Mağazada gösterilen</small></article><article class="stat"><span>Toplam stok</span><strong>${stock}</strong><small>Gramajlar dahil adet</small></article></div><div class="admin-columns"><div><section class="panel"><div class="panel-heading"><h2>Son siparişler</h2><button data-tab="orders">Tümünü gör</button></div>${recent.length ? recent.map((o) => `<div class="activity-row"><div><strong>${e(o.name)}</strong><small>${e(o.id)} · ${formatDate(o.created)}</small></div><div>${badge(o.status)}<strong>${money(o.total)}</strong></div></div>`).join("") : `<div class="empty-state">${icons.bag}<h3>İlk demo siparişiniz burada görünecek.</h3><p>Mağazadan bir ürün ekleyip demo siparişini tamamlayın.</p><a href="index.html#urunler" class="button secondary small">Mağazaya git</a></div>`}</section><div class="help-card"><h3>Mağazanızla birlikte çalışır.</h3><p>Burada değiştirdiğiniz fiyat ve stoklar, aynı tarayıcıdaki vitrinde de güncellenir. Kargo ve indirim hesapları siparişe kadar korunur.</p><a href="index.html">Vitrini kontrol et ↗</a></div></div><div><section class="panel"><div class="panel-heading"><h2>Stok görünümü</h2><button data-tab="products">Düzenle</button></div><div class="panel-body">${state.products
    .map((p) => {
      const n = p.variants.reduce((s, v) => s + v.stock, 0);
      return `<div class="stock-row"><div><span>${e(p.name)}</span><strong>${n} adet</strong></div><progress class="stock-progress ${n < 10 ? "low" : ""}" value="${Math.min(50, n)}" max="50" aria-label="${e(p.name)} stok görünümü"></progress></div>`;
    })
    .join(
      "",
    )}</div></section><div class="warning-panel"><strong>Sunum modu açık</strong><p>Bu alan gerçek yönetici girişi içermez. Demo verileri bu cihazdaki tarayıcıya özeldir; başka cihazlarla paylaşılmaz.</p></div></div></div>`;
}
function products() {
  const list = state.products.filter((p) =>
    p.name.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")),
  );
  return `${pageTitle("Ürünler & stok", "Fiyatı güncelleyin, gramaj bazında stokları yönetin.", '<button class="button primary small" id="new-product">+ Ürün ekle</button>')}<div class="admin-toolbar"><label class="search-box">${icons.search}<input type="search" id="admin-search" value="${e(search)}" placeholder="Ürün ara" aria-label="Ürün ara"></label><span class="muted small">${list.length} ürün · Değişiklikler vitrinde görünür</span></div><section class="panel"><div class="table-wrap"><table><thead><tr><th>Ürün</th><th>Fiyat aralığı</th><th>Stok</th><th>Görünürlük</th><th><span class="sr-only">İşlem</span></th></tr></thead><tbody>${list.map((p) => `<tr><td><div class="table-product"><img src="assets/${e(p.image)}" alt="" width="43" height="48"><div><strong>${e(p.name)}</strong><small>${p.variants.map((v) => e(v.label)).join(" / ")}</small></div></div></td><td>${money(Math.min(...p.variants.map((v) => v.price)))} – ${money(Math.max(...p.variants.map((v) => v.price)))}</td><td>${p.variants.reduce((n, v) => n + v.stock, 0)} adet</td><td><span class="state-badge ${p.active ? "done" : ""}">${p.active ? "Yayında" : "Gizli"}</span></td><td><button class="row-button" data-edit="${e(p.id)}">Düzenle</button></td></tr>`).join("")}</tbody></table></div>${list.length ? "" : '<div class="empty-state"><p>Aramanıza uygun ürün yok.</p></div>'}</section>`;
}
function orders() {
  const list = state.orders.filter(
    (o) =>
      (statusFilter === "all" || o.status === statusFilter) &&
      `${o.name} ${o.id} ${o.city}`
        .toLocaleLowerCase("tr")
        .includes(search.toLocaleLowerCase("tr")),
  );
  return `${pageTitle("Siparişler", "Demo siparişlerini inceleyin, hazırlık ve kargo durumlarını güncelleyin.", '<button id="export-orders" class="button secondary small">CSV indir</button>')}<div class="admin-toolbar"><label class="search-box">${icons.search}<input type="search" id="admin-search" value="${e(search)}" placeholder="Sipariş veya isim ara" aria-label="Sipariş ara"></label><select id="status-filter" aria-label="Sipariş durumu"><option value="all">Tüm durumlar</option>${statuses.map((s) => `<option ${s === statusFilter ? "selected" : ""}>${e(s)}</option>`).join("")}</select></div><section class="panel"><div class="table-wrap"><table><thead><tr><th>Sipariş</th><th>Örnek alıcı</th><th>Tutar</th><th>Durum</th><th><span class="sr-only">İşlem</span></th></tr></thead><tbody>${list.map((o) => `<tr><td><strong>${e(o.id)}</strong><div class="muted small">${formatDate(o.created)}</div></td><td>${e(o.name)}<div class="small muted">${e(o.city)}</div></td><td>${money(o.total)}</td><td><select data-status="${e(o.id)}" aria-label="${e(o.id)} sipariş durumu" ${o.status === "İptal" ? "disabled" : ""}>${statuses.map((s) => `<option ${s === o.status ? "selected" : ""}>${e(s)}</option>`).join("")}</select></td><td><button class="row-button" data-order="${e(o.id)}">İncele</button></td></tr>`).join("")}</tbody></table></div>${list.length ? "" : `<div class="empty-state"><h3>${state.orders.length ? "Bu filtrede sipariş yok." : "Henüz sipariş yok."}</h3><p>${state.orders.length ? "Aramayı veya durum filtresini değiştirin." : "Mağazada oluşturacağınız demo siparişi burada görünecek."}</p><a href="index.html" class="button secondary small">Mağazaya git</a></div>`}</section><p class="muted small">İptal edilen siparişin stokları bir kez geri eklenir. Tahsilat, kargo entegrasyonu ve gerçek mesaj gönderimi yapılmaz.</p>`;
}
function settings() {
  return `${pageTitle("Mağaza ayarları", "Kargo koşullarını ve üst duyuru metnini yönetin.")}<section class="panel"><form id="settings-form" class="settings-form"><h2>Kargo & duyuru</h2><label>Ücretsiz kargo alt limiti (TL)<input type="number" name="freeShipping" value="${state.settings.freeShipping}" min="0" max="1000000" step="1" required></label><label>Standart kargo ücreti (TL)<input type="number" name="shipping" value="${state.settings.shipping}" min="0" max="100000" step="1" required></label><label>Mağaza üst duyurusu<input name="announcement" maxlength="180" value="${e(state.settings.announcement)}" required></label><p>Ücretsiz kargo limiti indirim sonrası ürün tutarına göre hesaplanır. Duyuru metnini yeni koşullarla uyumlu tutun.</p><div><button class="button primary small" type="submit">Ayarları kaydet</button></div></form></section><section class="panel"><div class="settings-form"><h2>Demo verilerinizi saklayın</h2><p>Ürünleri, içerikleri, ayarları ve demo siparişlerini JSON olarak bu cihaza indirebilirsiniz.</p><button class="button secondary small" id="export-backup" type="button">Demo yedeğini indir</button><h2>Yeni bir sunuma başla</h2><p>Demo siparişlerini ve değişiklikleri temizleyip başlangıç ürünlerine dönebilirsiniz. Bu işlem yalnızca bu tarayıcıdaki demoyu etkiler.</p><div><button class="button secondary small" id="reset-demo">Demo verilerini sıfırla</button></div></div></section>`;
}
function render() {
  state = load();
  const site = siteConfig(state),
    theme = themes[site.theme];
  document.querySelector(".sidebar .wordmark").innerHTML =
    e(site.brandName || theme.name) + "<span>mağaza yönetimi</span>";
  $("#breadcrumb").textContent = tabs[tab];
  $("#order-badge").textContent = state.orders.filter(
    (o) => o.status === "Yeni",
  ).length;
  document.querySelectorAll(".admin-nav").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("#admin-content").innerHTML = {
    overview,
    products,
    orders,
    settings,
    studio: () => studio(state),
    campaigns: () => campaigns(state),
  }[tab]();
}
function editProduct(id) {
  state = load();
  const fresh = !id;
  const p = fresh
    ? {
        id: "p-" + Date.now().toString(36),
        name: "",
        note: "",
        description: "",
        category: "suzme",
        badge: "Yeni lezzet",
        image: imageNames[0],
        active: true,
        variants: [
          { id: "450", label: "450 g", price: 0, stock: 0 },
          { id: "850", label: "850 g", price: 0, stock: 0 },
        ],
      }
    : state.products.find((p) => p.id === id);
  $("#edit-title").textContent = fresh ? "Yeni ürün ekle" : "Ürün düzenle";
  $("#edit-content").innerHTML =
    `<form id="product-form" class="edit-form" data-id="${e(p.id)}" data-fresh="${fresh}" data-revision="${state.revision}"><label>Ürün adı<input name="name" value="${e(p.name)}" required maxlength="80"></label><div class="form-grid"><label>Kategori<select name="category">${Object.entries(
      { suzme: "Süzme bal", petek: "Petek bal", ari: "Arı ürünleri" },
    )
      .map(
        ([key, value]) =>
          `<option value="${key}" ${p.category === key ? "selected" : ""}>${value}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Kısa lezzet notu<input name="note" value="${e(p.note)}" maxlength="60" required></label></div><label>Ürün açıklaması<textarea name="description" rows="3" maxlength="600" required>${e(p.description)}</textarea></label><div class="form-grid"><label>Görsel<select name="image">${imageNames.map((im, i) => `<option value="${im}" ${p.image === im ? "selected" : ""}>${["Yayla balı konsepti", "Kestane balı konsepti", "Petek bal konsepti", "Polen konsepti", "Kovan konsepti"][i]}</option>`).join("")}</select></label><label>Ürün etiketi<input name="badge" value="${e(p.badge)}" maxlength="35"></label></div><div class="edit-variants"><span class="small">Gramaj başına fiyat & stok</span>${p.variants.map((v, i) => `<div class="variant-row"><strong>${e(v.label)}</strong><label>Fiyat (TL)<input type="number" name="price-${i}" value="${v.price}" min="1" max="100000" step="1" required></label><label>Stok (adet)<input type="number" name="stock-${i}" value="${v.stock}" min="0" max="100000" step="1" required></label></div>`).join("")}</div>${analysisFields(p)}<div class="product-save"><label class="check-row"><input type="checkbox" name="active" ${p.active ? "checked" : ""}>Mağazada göster</label><button type="submit" class="button primary small">Ürünü kaydet</button></div><div class="issue" id="edit-error" role="alert"></div></form>`;
  enhanceProductEditor(p);
  $("#edit-dialog").showModal();
}
function inspectOrder(id) {
  const o = load().orders.find((o) => o.id === id);
  if (!o) return;
  $("#edit-title").textContent = "Demo sipariş detayı";
  $("#edit-content").innerHTML =
    `<div class="order-detail"><p><strong>${e(o.id)}</strong> ${badge(o.status)}</p><p>${e(o.name)} · ${e(o.city)}</p><p>${formatDate(o.created)}</p></div>${o.lines.map((l) => `<div class="summary-row"><span>${e(l.name)} · ${e(l.label)} × ${l.qty}</span><strong>${money(l.price * l.qty)}</strong></div>`).join("")}<div class="summary-row"><span>İndirim</span><span>−${money(o.discount)}</span></div><div class="summary-row"><span>Kargo</span><span>${money(o.shipping)}</span></div><div class="summary-row total"><span>Toplam</span><span>${money(o.total)}</span></div><div class="demo-hint">Yöntem: ${{ card: "Kart simülasyonu", wire: "Havale simülasyonu", whatsapp: "WhatsApp özet önizlemesi" }[o.method]}. Gerçek ödeme veya mesaj gönderimi yapılmadı.</div>`;
  $("#edit-content").insertAdjacentHTML("beforeend", orderFields(o));
  $("#edit-dialog").showModal();
}
document.addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.dataset.close) {
    document.getElementById(b.dataset.close).close();
    return;
  }
  if (b.dataset.tab) {
    tab = b.dataset.tab;
    search = "";
    statusFilter = "all";
    render();
    return;
  }
  if (b.dataset.edit) {
    editProduct(b.dataset.edit);
    return;
  }
  if (b.dataset.order) {
    inspectOrder(b.dataset.order);
    return;
  }
  if (b.id === "new-product") {
    editProduct();
    return;
  }
  if (b.id === "reset-demo") $("#confirm-dialog").showModal();
  if (b.id === "confirm-reset") {
    try {
      save(seed());
      $("#confirm-dialog").close();
      render();
      notify("Demo başlangıç verilerine döndü.");
    } catch {
      notify(
        "Veriler saklanamadı. Tarayıcı depolama alanını kontrol edin.",
        true,
      );
    }
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "status-filter") {
    statusFilter = event.target.value;
    render();
  }
  if (event.target.dataset.status) {
    try {
      state = load();
      setOrderStatus(state, event.target.dataset.status, event.target.value);
      save(state);
      render();
      notify("Sipariş durumu güncellendi.");
    } catch (error) {
      notify(error.message, true);
      render();
    }
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "admin-search") {
    const position = event.target.selectionStart;
    search = event.target.value;
    render();
    $("#admin-search").focus();
    $("#admin-search").setSelectionRange(position, position);
  }
});
document.addEventListener("submit", (event) => {
  if (!["product-form", "settings-form"].includes(event.target.id)) return;
  event.preventDefault();
  try {
    state = load();
    const form = event.target,
      data = Object.fromEntries(new FormData(form));
    if (form.id === "settings-form") {
      state.settings = {
        ...state.settings,
        freeShipping: Number(data.freeShipping),
        shipping: Number(data.shipping),
        announcement: data.announcement.trim(),
      };
      if (
        !Number.isInteger(state.settings.freeShipping) ||
        state.settings.freeShipping < 0 ||
        !Number.isInteger(state.settings.shipping) ||
        state.settings.shipping < 0
      )
        throw Error("Geçerli bir kargo tutarı girin.");
      save(state);
      notify("Mağaza ayarları kaydedildi.");
      return;
    }
    if (state.revision !== Number(form.dataset.revision))
      throw Error(
        "Siz düzenlerken demo verileri değişti. Güncel stokları görmek için kapatıp yeniden açın.",
      );
    const fresh = form.dataset.fresh === "true";
    const p = fresh
      ? {
          id: form.dataset.id,
          variants: [
            { id: "450", label: "450 g" },
            { id: "850", label: "850 g" },
          ],
        }
      : state.products.find((p) => p.id === form.dataset.id);
    const variants = readVariants(form);
    if (
      variants.some(
        (v) =>
          !Number.isInteger(v.price) ||
          v.price < 1 ||
          !Number.isInteger(v.stock) ||
          v.stock < 0,
      )
    )
      throw Error(
        "Fiyat pozitif, stok sıfır veya daha büyük bir tam sayı olmalı.",
      );
    if (!data.name.trim() || !data.note.trim() || !data.description.trim())
      throw Error("Ürün adı, lezzet notu ve açıklamasını doldurun.");
    Object.assign(p, {
      name: data.name.trim(),
      note: data.note.trim(),
      description: data.description.trim(),
      category: data.category,
      image: imageNames.includes(data.image) ? data.image : imageNames[0],
      badge: data.badge.trim(),
      active: data.active === "on",
      analysis: readAnalysis(data),
      variants,
      position: Math.max(0, Math.min(9999, Number(data.position) || 0)),
      harvestLabel: (data.harvestLabel || " ").trim(),
    });
    if (fresh) state.products.push(p);
    save(state);
    $("#edit-dialog").close();
    render();
    notify("Ürün kaydedildi. Vitrin de güncellendi.");
  } catch (error) {
    if ($("#edit-error")) $("#edit-error").textContent = error.message;
    else notify(error.message, true);
  }
});
window.addEventListener("storage", (event) => {
  if (event.key === KEY) {
    if (tab === "settings" && $("#settings-form")) {
      notify("Demo verileri başka sekmede güncellendi.");
      return;
    }
    render();
  }
});
render();

bindStudio(render);

bindManagement(render);
