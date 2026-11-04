import { themes, defaultSite, siteConfig, detailFields } from "./themes.js";
import { load, save, escape as e, imageNames, notify } from "./core.js";
const labels = {
  "hero-honey.webp": "Bal kavanozu",
  "chestnut.webp": "Kestane balı",
  "honeycomb.webp": "Petek bal",
  "pollen.webp": "Polen",
  "apiary.webp": "Kovanlar",
};
const field = (
  label,
  name,
  value,
  { area = false, type = "text", placeholder = "", max = 600 } = {},
) =>
  `<label>${label}${area ? `<textarea name="${name}" rows="3" maxlength="${max}" placeholder="${e(placeholder)}">${e(value)}</textarea>` : `<input name="${name}" type="${type}" value="${e(value)}" maxlength="${max}" placeholder="${e(placeholder)}">`}</label>`;
const imageField = (label, name, value) =>
  `<label>${label}<select name="${name}"><option value="">Temanın varsayılanı</option>${imageNames.map((im) => `<option value="${im}" ${im === value ? "selected" : ""}>${labels[im] || im}</option>`).join("")}</select></label>`;
export function studio(state) {
  const s = siteConfig(state);
  return `<div class="admin-page-title"><div><h1>Tasarım & sayfa düzeni</h1><p>Kimliği seçin, metinleri düzenleyin, istediğiniz bölümleri açıp kapatın.</p></div><a class="button secondary small" href="index.html" target="_blank">Vitrini aç ↗</a></div><form id="studio-form" class="studio-form" data-revision="${state.revision}"><section class="panel"><div class="panel-heading"><h2>Dört farklı tasarım kimliği</h2><span class="muted small">Bir seçimle tüm mağaza değişir</span></div><div class="theme-options">${Object.entries(
    themes,
  )
    .map(
      ([id, t]) =>
        `<label class="theme-option ${id}"><input type="radio" name="theme" value="${id}" ${s.theme === id ? "checked" : ""}><div class="theme-mini"><b>${e(t.name)}</b><span>${e(t.label)}</span></div><strong>${e(t.name)}</strong><p>${e(t.description)}</p><a href="index.html?tema=${id}" target="_blank">Bu temayı incele ↗</a></label>`,
    )
    .join(
      "",
    )}</div></section><div class="studio-grid"><section class="panel"><div class="panel-heading"><h2>Marka & ana ekran</h2></div><div class="settings-form">${field("Mağaza adı", "brandName", s.brandName, { max: 50, placeholder: "Seçilen temanın adı" })}${field("Marka alt başlığı", "brandSubtitle", s.brandSubtitle, { max: 70, placeholder: "Seçilen temanın alt başlığı" })}${field("Kısa slogan", "tagline", s.tagline, { max: 100, placeholder: "Temanın varsayılan sloganı" })}${field("Ana başlık", "heroTitle", s.heroTitle, { area: true, max: 140, placeholder: "Temanın başlığı; satır sonları korunur" })}${field("Ana açıklama", "heroText", s.heroText, { area: true, placeholder: "Temanın varsayılan açıklaması" })}${field("Ana düğme metni", "heroCta", s.heroCta, { max: 50, placeholder: "Temanın düğme metni" })}${imageField("Ana görsel", "heroImage", s.heroImage)}<label class="check-row"><input name="motion" type="checkbox" ${s.motion ? "checked" : ""}>Animasyonları göster</label><p>Boş bırakılan marka ve ana ekran alanlarında seçilen temanın kimliği kullanılır.</p></div></section><section class="panel"><div class="panel-heading"><h2>Bölümler & içerikler</h2></div><div class="settings-form">${field("Koleksiyon başlığı", "collectionTitle", s.collectionTitle, { max: 120, placeholder: "Temanın koleksiyon başlığı" })}${field("Koleksiyon açıklaması", "collectionText", s.collectionText, { area: true })}${Object.entries(
    {
      story: "Hikâye bölümü",
      pairing: "Sofra önerisi",
      faq: "Sık sorulan sorular",
      closing: "Kapanış alanı",
    },
  )
    .map(
      ([id, label]) =>
        `<label class="check-row"><input type="checkbox" name="section-${id}" ${s.sections[id] ? "checked" : ""}>${label} görünsün</label>`,
    )
    .join(
      "",
    )}${field("Hikâye başlığı", "storyTitle", s.storyTitle, { area: true, max: 140 })}${field("Hikâye metni", "storyText", s.storyText, { area: true })}${imageField("Hikâye görseli", "storyImage", s.storyImage)}${field("Sofra önerisi başlığı", "pairingTitle", s.pairingTitle, { area: true, max: 140 })}${field("Sofra önerisi metni", "pairingText", s.pairingText, { area: true })}${imageField("Sofra önerisi görseli", "pairingImage", s.pairingImage)}${field("Kapanış başlığı", "closingTitle", s.closingTitle, { max: 140 })}${field("Alt alan metni", "footerText", s.footerText, { max: 180 })}</div></section><section class="panel"><div class="panel-heading"><h2>İletişim bilgileri</h2></div><div class="settings-form">${field("E-posta", "email", s.email, { type: "email", max: 120 })}${field("Telefon (gösterim)", "phone", s.phone, { max: 40 })}${field("Adres", "address", s.address, { area: true, max: 250 })}${field("Sosyal medya kullanıcı adı", "instagram", s.instagram, { max: 80 })}<p>Telefon ve sosyal medya metin olarak gösterilir. Demo dışarıya mesaj göndermez.</p></div></section><section class="panel"><div class="panel-heading"><h2>Sık sorulan sorular</h2></div><div class="settings-form">${s.faqs.map((f, i) => `<div class="faq-editor">${field(`Soru ${i + 1}`, `faq-q-${i}`, f.q, { max: 150 })}${field("Yanıt", `faq-a-${i}`, f.a, { area: true })}<button type="button" class="row-button" data-remove-faq="${i}">Bu soruyu kaldır</button></div>`).join("")}<button type="button" class="button secondary small" id="add-faq">+ Soru ekle</button></div></section></div><section class="panel"><div class="panel-heading"><h2>Menüler, küçük metinler & sayfa bilgisi</h2></div><div class="detail-fields settings-form">${Object.entries(
    detailFields,
  )
    .map(([key, [label]]) =>
      field(label, key, s[key], { area: key === "heroFoot", max: 250 }),
    )
    .join(
      "",
    )}</div></section><div class="studio-save"><span>Değişiklikler bu tarayıcıdaki vitrine yansır.</span><button class="button primary" type="submit">Tasarımı ve içerikleri kaydet</button></div><p id="studio-error" class="issue" role="alert"></p></form>`;
}
export function campaigns(state) {
  const c = state.campaign || {
    code: "BAL10",
    percent: 10,
    min: 0,
    enabled: true,
  };
  const methods = state.settings.methods || {
    whatsapp: true,
    card: true,
    wire: true,
  };
  return `<div class="admin-page-title"><div><h1>Kampanyalar & sipariş</h1><p>İndirimleri, sipariş yöntemlerini ve kargo koşullarını yönetin.</p></div></div><form id="campaign-form" class="studio-form"><div class="studio-grid"><section class="panel"><div class="panel-heading"><h2>İndirim kodu</h2></div><div class="settings-form"><label class="check-row"><input type="checkbox" name="enabled" ${c.enabled ? "checked" : ""}>İndirim kodu aktif</label>${field("Kod", "code", c.code, { max: 20 })}${field("İndirim yüzdesi", "percent", c.percent, { type: "number" })}${field("Minimum ürün tutarı (TL)", "min", c.min, { type: "number" })}<p>İndirim ürün tutarından düşülür. Ücretsiz kargo, indirim sonrası tutara göre hesaplanır.</p></div></section><section class="panel"><div class="panel-heading"><h2>Kargo & sipariş yöntemleri</h2></div><div class="settings-form">${field("Ücretsiz kargo alt limiti (TL)", "freeShipping", state.settings.freeShipping, { type: "number" })}${field("Standart kargo ücreti (TL)", "shipping", state.settings.shipping, { type: "number" })}${field("Üst duyuru metni", "announcement", state.settings.announcement, { max: 180 })}${Object.entries(
    {
      whatsapp: "WhatsApp özet önizlemesi",
      card: "Kart simülasyonu",
      wire: "Havale simülasyonu",
    },
  )
    .map(
      ([id, label]) =>
        `<label class="check-row"><input type="checkbox" name="method-${id}" ${methods[id] ? "checked" : ""}>${label}</label>`,
    )
    .join(
      "",
    )}<p>Yöntemler yalnızca demo akışıdır; gerçek ödeme veya mesaj gönderimi açılmaz. En az bir yöntem seçin.</p></div></section></div><div class="studio-save"><span>Kurallar yeni siparişlere uygulanır.</span><button class="button primary" type="submit">Kampanya ve koşulları kaydet</button></div><p id="studio-error" class="issue" role="alert"></p></form>`;
}
export function bindStudio(refresh) {
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!["studio-form", "campaign-form"].includes(form.id)) return;
    event.preventDefault();
    try {
      const state = load(),
        d = Object.fromEntries(new FormData(form));
      if (form.id === "studio-form") {
        if (state.revision !== Number(form.dataset.revision))
          throw Error(
            "Başka bir sekmede veriler değişti. Tasarım sayfasını yeniden açıp güncel verilerle kaydedin.",
          );
        const s = siteConfig(state);
        for (const key of Object.keys(defaultSite()))
          if (typeof s[key] === "string" && key !== "theme")
            s[key] = (d[key] || "").trim();
        s.theme = themes[d.theme] ? d.theme : "yayladan";
        s.motion = d.motion === "on";
        s.sections = Object.fromEntries(
          Object.keys(s.sections).map((k) => [k, d["section-" + k] === "on"]),
        );
        s.faqs = s.faqs
          .map((f, i) => ({
            q: (d["faq-q-" + i] || "").trim(),
            a: (d["faq-a-" + i] || "").trim(),
          }))
          .filter((f) => f.q && f.a);
        state.site = s;
      } else {
        const percent = Number(d.percent),
          min = Number(d.min),
          shipping = Number(d.shipping),
          free = Number(d.freeShipping);
        if (
          !Number.isInteger(percent) ||
          percent < 1 ||
          percent > 90 ||
          ![min, shipping, free].every(
            (n) => Number.isInteger(n) && n >= 0 && n <= 1000000,
          )
        )
          throw Error(
            "İndirim %1–90 aralığında; tutarlar sıfır veya pozitif tam sayı olmalı.",
          );
        const code = d.code.trim().toUpperCase();
        if (!/^[A-Z0-9_-]{2,20}$/.test(code))
          throw Error(
            "Kod 2–20 karakter, Latin harf, rakam, _ veya - içermeli.",
          );
        const methods = Object.fromEntries(
          ["whatsapp", "card", "wire"].map((k) => [
            k,
            d["method-" + k] === "on",
          ]),
        );
        if (!Object.values(methods).some(Boolean))
          throw Error("En az bir sipariş yöntemi açık olmalı.");
        state.campaign = { code, percent, min, enabled: d.enabled === "on" };
        state.settings = {
          ...state.settings,
          shipping,
          freeShipping: free,
          announcement: d.announcement.trim(),
          methods,
        };
        if (!state.campaign.enabled || state.coupon !== code) state.coupon = "";
      }
      save(state);
      refresh();
      notify("Ayarlar kaydedildi. Mağazanız güncellendi.");
    } catch (error) {
      document.querySelector("#studio-error").textContent = error.message;
    }
  });
  document.addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b || !(b.id === "add-faq" || b.dataset.removeFaq !== undefined))
      return;
    const form = document.querySelector("#studio-form"),
      d = new FormData(form),
      state = load(),
      s = siteConfig(state);
    for (const key of Object.keys(s))
      if (typeof s[key] === "string" && key !== "theme")
        s[key] = String(d.get(key) || "");
    s.theme = d.get("theme");
    s.motion = d.has("motion");
    s.sections = Object.fromEntries(
      Object.keys(s.sections).map((k) => [k, d.has("section-" + k)]),
    );
    s.faqs = s.faqs.map((f, i) => ({
      q: String(d.get("faq-q-" + i) || ""),
      a: String(d.get("faq-a-" + i) || ""),
    }));
    if (b.id === "add-faq") {
      if (s.faqs.length >= 12) {
        notify("En fazla 12 soru ekleyebilirsiniz.", true);
        return;
      }
      s.faqs.push({ q: "Yeni soru", a: "Yanıtı buraya yazın." });
    } else s.faqs.splice(Number(b.dataset.removeFaq), 1);
    state.site = s;
    document.querySelector("#admin-content").innerHTML = studio(state);
    notify("Soru listesi düzenlendi. Değişiklikleri kaydetmeyi unutmayın.");
  });
}
