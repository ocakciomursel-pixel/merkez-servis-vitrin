import { escape as e } from "./core.js";
export function analysisCard(product) {
  const a = product.analysis;
  if (!a)
    return '<details class="analysis-card"><summary>Hasat & analiz bilgileri</summary><p>Bu ürün için örnek analiz kartı eklenmemiş. Gerçek ürün belgeleri işletme tarafından sağlanacak.</p></details>';
  return `<details class="analysis-card"><summary>Hasat & analiz kartını incele</summary><div class="analysis-body"><span class="state-badge new">Sentetik örnek · gerçek rapor değildir</span><dl><div><dt>Örnek parti</dt><dd>${e(a.batch)}</dd></div><div><dt>Örnek hasat</dt><dd>${e(a.harvest)}</dd></div><div><dt>Prolin (örnek)</dt><dd>${e(a.proline)} mg/kg</dd></div><div><dt>Nem (örnek)</dt><dd>%${e(a.moisture)}</dd></div></dl><p>Bu değerler yalnızca analiz sunumunu göstermek için oluşturuldu. Laboratuvar belgesi veya ürün saflığı kanıtı değildir.</p></div></details>`;
}
export function analysisFields(product) {
  const a = product.analysis || {
    batch: "DEMO-2026",
    harvest: "2026 / Örnek hasat",
    proline: 650,
    moisture: 17.2,
  };
  return `<fieldset class="analysis-fields"><legend>Örnek analiz kartı</legend><label class="check-row"><input name="analysisEnabled" type="checkbox" ${product.analysis ? "checked" : ""}>Örnek analiz bilgilerini göster</label><p class="small muted">Gerçek belge yerine geçmeyen sentetik sunum verileri.</p><div class="form-grid"><label>Örnek parti<input name="batch" maxlength="60" value="${e(a.batch)}"></label><label>Örnek hasat<input name="harvest" maxlength="80" value="${e(a.harvest)}"></label><label>Prolin (mg/kg)<input name="proline" type="number" min="0" max="5000" step="1" value="${a.proline}"></label><label>Nem (%)<input name="moisture" type="number" min="0" max="100" step="0.1" value="${a.moisture}"></label></div></fieldset>`;
}
export function readAnalysis(data) {
  if (data.analysisEnabled !== "on") return null;
  const proline = Number(data.proline),
    moisture = Number(data.moisture);
  if (
    !data.batch.trim() ||
    !data.harvest.trim() ||
    !Number.isFinite(proline) ||
    proline < 0 ||
    proline > 5000 ||
    !Number.isFinite(moisture) ||
    moisture < 0 ||
    moisture > 100
  )
    throw Error("Örnek parti, hasat ve analiz değerlerini kontrol edin.");
  return {
    batch: data.batch.trim(),
    harvest: data.harvest.trim(),
    proline,
    moisture,
  };
}
