import { applySite, themes } from "./themes.js";
import { analysisCard } from "./analysis.js";
import {
  KEY,
  load,
  save,
  totals,
  addToCart,
  changeQuantity,
  placeOrder,
  orderMessage,
  money,
  escape as e,
  icons,
  notify,
} from "./core.js";
let state = load(),
  filter = "all",
  query = "",
  sort = "featured",
  detailId = "",
  checkoutOrder = null;
const selected = {};
const $ = (s) => document.querySelector(s);
function iconify(root = document) {
  root
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = icons[el.dataset.icon] || ""));
}
function persist() {
  save(state);
}
function latest() {
  state = load();
}
function attempt(fn) {
  latest();
  const previous = structuredClone(state);
  try {
    fn();
    persist();
    render();
    return true;
  } catch (err) {
    state = previous;
    notify(err.message, true);
    return false;
  }
}
function variant(p) {
  return p.variants.find((v) => v.id === selected[p.id]) || p.variants[0];
}
function weights(p, context = "card") {
  return `<div class="weights" role="group" aria-label="${e(p.name)} gramajı">${p.variants.map((v) => `<button class="weight ${variant(p).id === v.id ? "selected" : ""}" data-weight="${e(p.id)}" data-vid="${e(v.id)}" data-context="${context}" aria-pressed="${variant(p).id === v.id}">${e(v.label)}</button>`).join("")}</div>`;
}
function renderProducts() {
  let list = state.products.filter(
    (p) =>
      p.active &&
      (filter === "all" || p.category === filter) &&
      `${p.name} ${p.note}`
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  if (sort === "featured")
    list.sort((a, b) => (a.position || 0) - (b.position || 0));
  if (sort !== "featured")
    list.sort(
      (a, b) =>
        (Math.min(...a.variants.map((v) => v.price)) -
          Math.min(...b.variants.map((v) => v.price))) *
        (sort === "asc" ? 1 : -1),
    );
  $("#result-count").textContent = `${list.length} ürün gösteriliyor.`;
  $("#products").innerHTML = list.length
    ? list
        .map((p) => {
          const v = variant(p);
          return `<article class="product-card"><div class="product-visual"><button class="product-image-button" data-detail="${e(p.id)}" aria-label="${e(p.name)} detayını aç"><img src="assets/${e(p.image)}" alt="${e(p.name)} için örnek ürün fotoğrafı" loading="lazy" width="400" height="450"></button><span class="product-tag">${e(p.badge)}</span><button class="quick-view" data-detail="${e(p.id)}" aria-label="${e(p.name)} detayını aç">↗</button></div><p class="product-meta">${e(p.note)}${p.harvestLabel ? " · " + e(p.harvestLabel) : ""}</p><button class="product-title" data-detail="${e(p.id)}"><h3>${e(p.name)}</h3></button>${weights(p)}<div class="product-bottom"><span class="price">${money(v.price)}</span><button class="add-button" data-add="${e(p.id)}" ${v.stock <= 0 ? "disabled" : ""}>${v.stock <= 0 ? "Tükendi" : 'Sepete ekle <span aria-hidden="true">+</span>'}</button></div></article>`;
        })
        .join("")
    : `<div class="empty-state"><h3>Bu lezzeti bulamadık.</h3><p>Başka bir kelime deneyin veya tüm ürünlere göz atın.</p><button class="button secondary" id="clear-search">Tüm ürünleri göster</button></div>`;
}
function summary(t) {
  return `<div class="summary-row"><span>Ara toplam</span><span>${money(t.subtotal)}</span></div>${t.discount ? `<div class="summary-row discount"><span>${e(t.couponCode || state.coupon)} indirimi</span><span>−${money(t.discount)}</span></div>` : ""}<div class="summary-row"><span>Kargo</span><span>${t.shipping ? money(t.shipping) : "Ücretsiz"}</span></div><div class="summary-row total"><span>Genel toplam</span><span>${money(t.total)}</span></div>`;
}
function renderCart() {
  const t = totals(state);
  $("#cart-count").textContent = t.count;
  $("#mobile-total").textContent = money(t.total);
  $("#mobile-cart").classList.toggle("visible", t.count > 0);
  if (!t.lines.length && state.cart.length) {
    $("#cart-content").innerHTML =
      '<div class="empty-state"><h3>Sepetinizdeki ürünler değişti.</h3><p>Bu ürünler artık satışta değil. Sepeti temizleyip yeni bir seçim yapabilirsiniz.</p><button class="button secondary" id="clear-unavailable">Uygun olmayan ürünleri kaldır</button></div>';
    return;
  }
  if (!t.lines.length) {
    $("#cart-content").innerHTML =
      `<div class="empty-state"><span data-icon="bag"></span><h3>Güzel bir başlangıca ne dersiniz?</h3><p>Sevdiğiniz balı ve gramajını seçin. Eklediğiniz ürünleri burada göreceksiniz.</p><button class="button primary" data-close="cart-dialog">Ürünleri keşfet</button></div>`;
    iconify($("#cart-content"));
    return;
  }
  $("#cart-content").innerHTML =
    `<div class="cart-shipping">${t.remaining ? `Ücretsiz kargoya ${money(t.remaining)} kaldı.` : "Kargo bizden. Sofranıza afiyet olsun!"}<progress max="${state.settings.freeShipping || 1}" value="${Math.max(0, t.subtotal - t.discount)}" aria-label="Ücretsiz kargo ilerlemesi"></progress></div><div>${t.lines.map((l) => `<article class="cart-line"><img src="assets/${e(l.image)}" alt="${e(l.name)}" width="68" height="80"><div><h3>${e(l.name)}</h3><p class="small">${e(l.label)} · ${money(l.price)}</p><div class="quantity" aria-label="${e(l.name)} adet seçimi"><button data-qty="${l.qty - 1}" data-pid="${e(l.pid)}" data-vid="${e(l.vid)}" aria-label="${e(l.name)} bir azalt">−</button><span>${l.qty}</span><button data-qty="${l.qty + 1}" data-pid="${e(l.pid)}" data-vid="${e(l.vid)}" aria-label="${e(l.name)} bir artır" ${l.qty >= l.stock ? "disabled" : ""}>+</button></div></div><div class="line-end">${money(l.price * l.qty)}<button class="remove" data-qty="0" data-pid="${e(l.pid)}" data-vid="${e(l.vid)}" aria-label="${e(l.name)} sepetten çıkar">Kaldır</button></div></article>`).join("")}</div>${t.issues.map((i) => `<p class="issue" role="alert">${e(i)}</p>`).join("")}${t.issues.length ? '<button class="row-button" id="clear-unavailable">Uygun olmayan ürünleri kaldır</button>' : ""}<div class="cart-bottom"><label for="coupon">Bir indirim kodunuz var mı?</label><form id="coupon-form" class="coupon-row"><input id="coupon" name="coupon" maxlength="20" value="${e(state.coupon)}" placeholder="${state.campaign?.enabled ? e(state.campaign.code) : "İndirim kodu"}" aria-label="İndirim kodu"><button type="submit">${state.coupon ? "Güncelle" : "Uygula"}</button>${state.coupon ? '<button type="button" id="remove-coupon" aria-label="İndirim kodunu kaldır">×</button>' : ""}</form>${summary(t)}<button class="button primary full" id="start-checkout" ${t.issues.length ? "disabled" : ""}>Siparişe devam et ${icons.arrow}</button><p class="small">Demo siparişi oluşturulur. Gerçek ödeme alınmaz.</p></div>`;
}
function render() {
  applySite(state);
  renderProducts();
  renderCart();
  $("#announcement").textContent = state.settings.announcement;
  if($("#shipping-faq"))$("#shipping-faq").textContent =
    `İndirim sonrası ${money(state.settings.freeShipping)} ve üzeri alışverişlerde ücretsiz, altındaki siparişlerde ${money(state.settings.shipping)}. Sepette tüm tutarlar birlikte gösterilir.`;
  if (detailId && $("#product-dialog").open) renderDetail();
}
function renderDetail() {
  const p = state.products.find((p) => p.id === detailId);
  if (!p?.active) {
    $("#product-dialog").close();
    return;
  }
  const v = variant(p);
  $("#product-detail").innerHTML =
    `<div class="detail-grid"><img src="assets/${e(p.image)}" alt="${e(p.name)} için örnek ürün fotoğrafı" width="400" height="500"><div class="detail-copy"><span class="section-note">${e(p.note)}</span><h2 id="detail-title">${e(p.name)}</h2><p>${e(p.description)}</p>${weights(p, "detail")}<div class="price">${money(v.price)}</div><div class="stock-note">${v.stock ? `${v.stock} adet demo stoğu mevcut` : "Bu gramaj tükendi. Diğer gramajı seçebilirsiniz."}</div><button class="button primary full" data-add="${e(p.id)}" ${!v.stock ? "disabled" : ""}>${v.stock ? "Sepete ekle" : "Tükendi"} ${icons.bag}</button>${analysisCard(p)}<p class="small">Örnek ürün bilgisi. Gerçek menşe, hasat ve analiz raporları işletme tarafından sağlanacak.</p></div></div>`;
}
function openCart() {
  latest();
  render();
  $("#cart-dialog").showModal();
}
function startCheckout() {
  latest();
  render();
  const t = totals(state);
  if (!t.lines.length || t.issues.length) return;
  $("#cart-dialog").close();
  checkoutOrder = null;
  $("#checkout-content").innerHTML =
    `<div class="demo-hint">Bu bir deneme akışıdır. Gerçek kişisel bilgi girmeyin. Ödeme alınmaz, dışarıya mesaj gönderilmez.</div><form id="checkout-form" class="checkout-form"><div class="form-grid"><label>Örnek isim<input name="name" value="Demo ziyaretçi" required maxlength="80" autocomplete="off"></label><label>Örnek şehir<input name="city" value="İstanbul" required maxlength="60" autocomplete="off"></label></div><fieldset class="method-list"><legend>Sipariş yöntemini deneyin</legend><label><input type="radio" name="method" value="whatsapp" checked><span>WhatsApp sipariş özeti<small>Mesaj önizlemesi oluşturulur; gönderilmez.</small></span></label><label><input type="radio" name="method" value="card"><span>Kartla ödeme simülasyonu<small>Kart bilgisi istenmez, tahsilat yapılmaz.</small></span></label><label><input type="radio" name="method" value="wire"><span>Havale / EFT simülasyonu<small>IBAN veya gerçek transfer talebi gösterilmez.</small></span></label></fieldset><div class="order-summary">${summary(t)}</div><div id="checkout-error" class="issue" role="alert"></div><button class="button primary full" type="submit">Demo siparişini oluştur ${icons.arrow}</button></form>`;
  const methods = state.settings.methods || {
    whatsapp: true,
    card: true,
    wire: true,
  };
  document
    .querySelectorAll("#checkout-form input[name=method]")
    .forEach((input) => {
      input.closest("label").hidden = !methods[input.value];
      input.disabled = !methods[input.value];
      input.checked = false;
    });
  const firstMethod = document.querySelector(
    "#checkout-form input[name=method]:not(:disabled)",
  );
  if (firstMethod) firstMethod.checked = true;
  $("#checkout-dialog").showModal();
}
function submitCheckout(form) {
  const button = form.querySelector("[type=submit]");
  button.disabled = true;
  try {
    latest();
    const values = Object.fromEntries(new FormData(form));
    const original = structuredClone(state);
    checkoutOrder = placeOrder(state, values);
    try {
      persist();
    } catch (error) {
      state = original;
      throw error;
    }
    render();
    $("#checkout-content").innerHTML =
      `<div class="success-view"><div class="success-icon">${icons.check}</div><h3>Sofraya bir adım daha yakın.</h3><p>Demo siparişiniz oluşturuldu. Stoklar güncellendi; siparişi yönetim panelinde görebilirsiniz.</p><div class="order-summary"><div class="summary-row"><span>Sipariş numarası</span><strong>${e(checkoutOrder.id)}</strong></div>${summary(checkoutOrder)}</div><div class="demo-hint">Ödeme alınmadı ve mesaj gönderilmedi. Bu sipariş yalnızca bu tarayıcıdaki demo kaydıdır.</div><label for="message-preview">Sipariş özeti</label><pre class="message-preview" id="message-preview">${e(orderMessage(checkoutOrder))}</pre><div class="button-row"><button class="button secondary" id="copy-order">Özeti kopyala</button><a class="button primary" href="admin.html">Panelde görüntüle ↗</a></div></div>`;
    notify("Demo siparişiniz kaydedildi.");
  } catch (error) {
    $("#checkout-error").textContent = error.message;
    button.disabled = false;
  }
}
document.addEventListener("click", async (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.dataset.theme) {
    const u = new URL(location.href);
    u.searchParams.set("tema", b.dataset.theme);
    history.replaceState(null, "", u);
    render();
    return;
  }
  if (b.dataset.close) {
    document.getElementById(b.dataset.close).close();
    return;
  }
  if (b.id === "open-cart" || b.id === "mobile-cart") {
    openCart();
    return;
  }
  if (b.dataset.filter) {
    filter = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((el) => {
      el.classList.toggle("active", el === b);
      el.setAttribute("aria-pressed", String(el === b));
    });
    renderProducts();
    return;
  }
  if (b.dataset.weight) {
    selected[b.dataset.weight] = b.dataset.vid;
    renderProducts();
    if ($("#product-dialog").open) renderDetail();
    return;
  }
  if (b.dataset.detail) {
    latest();
    detailId = b.dataset.detail;
    renderDetail();
    $("#product-dialog").showModal();
    return;
  }
  if (b.dataset.add) {
    const added = attempt(() => {
      const p = state.products.find((p) => p.id === b.dataset.add);
      addToCart(state, p.id, variant(p).id);
    });
    if (!added) return;
    const count = $("#cart-count");
    count.classList.remove("bump");
    void count.offsetWidth;
    count.classList.add("bump");
    if (!state.cart.length) return;
    if ($("#product-dialog").open) $("#product-dialog").close();
    notify("Sepetinize eklendi.");
    return;
  }
  if (b.dataset.qty !== undefined) {
    attempt(() =>
      changeQuantity(
        state,
        b.dataset.pid,
        b.dataset.vid,
        Number(b.dataset.qty),
      ),
    );
    return;
  }
  if (b.id === "clear-search") {
    filter = "all";
    query = "";
    $("#search").value = "";
    document.querySelectorAll("[data-filter]").forEach((el) => {
      el.classList.toggle("active", el.dataset.filter === "all");
      el.setAttribute("aria-pressed", String(el.dataset.filter === "all"));
    });
    renderProducts();
    return;
  }
  if (b.id === "clear-unavailable") {
    attempt(() => {
      state.cart = state.cart.filter((c) => {
        const p = state.products.find((p) => p.id === c.pid);
        const v = p?.variants.find((v) => v.id === c.vid);
        return p?.active && v && c.qty <= v.stock;
      });
    });
    return;
  }
  if (b.id === "remove-coupon") {
    attempt(() => (state.coupon = ""));
    return;
  }
  if (b.id === "start-checkout") {
    startCheckout();
    return;
  }
  if (b.id === "copy-order") {
    try {
      await navigator.clipboard.writeText(orderMessage(checkoutOrder));
      notify("Sipariş özeti kopyalandı.");
    } catch {
      notify(
        "Kopyalanamadı. Yukarıdaki metni seçerek kopyalayabilirsiniz.",
        true,
      );
    }
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "coupon-form") {
    event.preventDefault();
    const code = new FormData(event.target).get("coupon").trim().toUpperCase();
    latest();
    const c = state.campaign;
    if (!c?.enabled || code !== c.code) {
      notify("Bu indirim kodu geçerli değil.", true);
      return;
    }
    if (totals(state).subtotal < c.min) {
      notify(`Bu kod için en az ${money(c.min)} ürün tutarı gerekli.`, true);
      return;
    }
    if (attempt(() => (state.coupon = code)))
      notify(`%${c.percent} demo indirimi uygulandı.`);
  }
  if (event.target.id === "checkout-form") {
    event.preventDefault();
    submitCheckout(event.target);
  }
});
$("#search").addEventListener("input", (event) => {
  query = event.target.value;
  renderProducts();
});
$("#sort").addEventListener("change", (event) => {
  sort = event.target.value;
  renderProducts();
});
window.addEventListener("storage", (event) => {
  if (event.key === KEY) {
    latest();
    render();
    if ($("#checkout-dialog").open && !checkoutOrder) {
      $("#checkout-dialog").close();
      notify("Mağaza bilgileri güncellendi. Sepetinizi yeniden kontrol edin.");
    }
  }
});
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (event) => {
    if (event.target !== d) return;
    const r = d.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      d.close();
  }),
);
iconify();
render();

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
    },
    { threshold: 0.15 },
  );
  document
    .querySelectorAll(".story-photo,.story-copy,.pairing>img")
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
}
