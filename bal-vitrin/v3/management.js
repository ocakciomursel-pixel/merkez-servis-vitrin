import { escape as e, load, save, notify } from "./core.js";
function variantRow(v) {
  return `<div class="variant-editor" data-variant-id="${e(v.id)}"><label>Gramaj / seçenek adı<input data-variant="label" value="${e(v.label)}" maxlength="40" required></label><label>Ürün kodu<input data-variant="sku" value="${e(v.sku || "")}" maxlength="60"></label><label>Fiyat (TL)<input data-variant="price" type="number" value="${v.price}" min="1" max="1000000" step="1" required></label><label>Stok (adet)<input data-variant="stock" type="number" value="${v.stock}" min="0" max="1000000" step="1" required></label><button type="button" class="row-button variant-remove">Bu seçeneği kaldır</button></div>`;
}
export function enhanceProductEditor(p) {
  const form = document.querySelector("#product-form");
  form.querySelector(".edit-variants").innerHTML =
    `<span class="small">Gramajlar, ürün kodları & stoklar</span><div id="variant-list">${p.variants.map(variantRow).join("")}</div><button type="button" class="button secondary small" id="add-variant">+ Gramaj / seçenek ekle</button><div class="form-grid"><label>Vitrin sırası<input type="number" name="position" min="0" max="9999" value="${p.position || 0}"></label><label>Hasat / koleksiyon etiketi<input name="harvestLabel" maxlength="80" value="${e(p.harvestLabel || "")}" placeholder="Örnek: Sonbahar seçkisi"></label></div>`;
  document.querySelector("#edit-dialog").classList.add("product-editor-wide");
}
export function readVariants(form) {
  const rows = [...form.querySelectorAll("[data-variant-id]")];
  if (!rows.length) throw Error("En az bir gramaj / seçenek olmalı.");
  return rows.map((row) => {
    const value = (k) => row.querySelector(`[data-variant="${k}"]`).value;
    const label = value("label").trim(),
      price = Number(value("price")),
      stock = Number(value("stock"));
    if (
      !label ||
      !Number.isInteger(price) ||
      price < 1 ||
      price > 1000000 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 1000000
    )
      throw Error(
        "Gramaj adını doldurun. Fiyat ve stok geçerli tam sayı olmalı.",
      );
    return {
      id: row.dataset.variantId,
      label,
      price,
      stock,
      sku: value("sku").trim(),
    };
  });
}
export function orderFields(o) {
  return `<form id="order-meta-form" class="edit-form" data-order-id="${e(o.id)}"><label>Kargo firması<input name="carrier" value="${e(o.carrier || "")}" maxlength="70" placeholder="Demo kargo firması"></label><label>Takip numarası<input name="tracking" value="${e(o.tracking || "")}" maxlength="90"></label><label>Sipariş notu<textarea name="note" maxlength="1000" rows="3" placeholder="Hazırlık ve teslim notları">${e(o.note || "")}</textarea></label><button class="button primary small" type="submit">Sipariş detaylarını kaydet</button></form>`;
}
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function bindManagement(refresh) {
  document.addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.id === "add-variant") {
      const list = document.querySelector("#variant-list");
      if (list.children.length >= 12) {
        notify("Bir üründe en fazla 12 seçenek olabilir.", true);
        return;
      }
      list.insertAdjacentHTML(
        "beforeend",
        variantRow({
          id: "v-" + crypto.randomUUID(),
          label: "",
          price: 1,
          stock: 0,
        }),
      );
    }
    if (b.classList.contains("variant-remove")) {
      const row = b.closest("[data-variant-id]");
      if (row.parentElement.children.length === 1) {
        notify("Üründe en az bir seçenek kalmalı.", true);
        return;
      }
      row.remove();
    }
    if (b.id === "export-backup")
      download(
        "yayladan-demo-yedek.json",
        JSON.stringify(
          { exported: new Date().toISOString(), state: load() },
          null,
          2,
        ),
        "application/json",
      );
    if (b.id === "export-orders") {
      const s = load();
      const safe = (value) =>
        '"' +
        String(value ?? "")
          .replace(/^[=+@-]/, "'")
          .replaceAll('"', '""') +
        '"';
      const rows = [
        [
          "Sipariş",
          "Tarih",
          "İsim",
          "Şehir",
          "Durum",
          "Toplam",
          "Kargo firması",
          "Takip",
        ],
        ...s.orders.map((o) => [
          o.id,
          o.created,
          o.name,
          o.city,
          o.status,
          o.total,
          o.carrier,
          o.tracking,
        ]),
      ];
      download(
        "demo-siparisler.csv",
        "\ufeff" + rows.map((r) => r.map(safe).join(";")).join("\r\n"),
        "text/csv;charset=utf-8",
      );
    }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id !== "order-meta-form") return;
    event.preventDefault();
    try {
      const s = load(),
        o = s.orders.find((o) => o.id === event.target.dataset.orderId);
      if (!o) throw Error("Sipariş bulunamadı.");
      const d = new FormData(event.target);
      o.carrier = String(d.get("carrier")).trim();
      o.tracking = String(d.get("tracking")).trim();
      o.note = String(d.get("note")).trim();
      save(s);
      document.querySelector("#edit-dialog").close();
      refresh();
      notify("Sipariş detayları kaydedildi.");
    } catch (error) {
      notify(error.message, true);
    }
  });
}
