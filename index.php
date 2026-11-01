<?php
/**
 * Merkez Beyaz Eşya Servisi — Canlı Kök Dizin (/) Sunucu Yönlendirici & SEO/Search Console Enjektörü
 * Yönetim panelinden seçilen aktif temayı (Tema 1, Tema 2, Tema 3 veya Tema 4) doğrudan ana domainde (/) açar;
 * Google Search Console meta etiketini, Analytics/Ads kodlarını ve güncel telefon numarasını sunucu tarafında HTML'e işler.
 */

$configFile = __DIR__ . '/data/config.json';
$cfg = [];
if (file_exists($configFile)) {
    $decoded = json_decode(@file_get_contents($configFile), true);
    if (is_array($decoded)) $cfg = $decoded;
}

$allowedThemes = [
    'tema-1-kurumsal',
    'tema-2-hizli-cagri',
    'tema-3-prestij',
    'tema-4-apple-vitrin'
];

$activeTheme = $cfg['activeTheme'] ?? 'tema-1-kurumsal';
if (!in_array($activeTheme, $allowedThemes, true)) {
    $activeTheme = 'tema-1-kurumsal';
}

$themeHtmlPath = __DIR__ . '/' . $activeTheme . '/index.html';
if (!file_exists($themeHtmlPath)) {
    $themeHtmlPath = __DIR__ . '/index.html';
}

$html = (string)@file_get_contents($themeHtmlPath);

// Alt klasör (../) yollarını kök dizin (./) yollarına dönüştür
$html = str_replace(
    ['"../assets/', "'../assets/", '"../marka-servisi/', "'../marka-servisi/", '"../yonetim-paneli/', "'../yonetim-paneli/", '"../tema-', "'../tema-", "mountStudioChrome('tema1', '../')", "mountStudioChrome('tema2', '../')", "mountStudioChrome('tema3', '../')", "mountStudioChrome('tema4', '../')"],
    ['"./assets/', "'./assets/", '"./marka-servisi/', "'./marka-servisi/", '"./yonetim-paneli/', "'./yonetim-paneli/", '"./tema-', "'./tema-", "mountStudioChrome('tema1', './')", "mountStudioChrome('tema2', './')", "mountStudioChrome('tema3', './')", "mountStudioChrome('tema4', './')"],
    $html
);

// Telefon numarası panelden değiştirilmişse sunucu tarafında da HTML içine doğrudan işle (Googlebot & anlık açılış için)
$primaryDisplay = trim((string)($cfg['primaryPhoneDisplay'] ?? '444 60 82'));
$primaryTel     = preg_replace('/[^\d+]/', '', $primaryDisplay) ?: '4446082';
if ($primaryDisplay !== '444 60 82') {
    $html = str_replace(['444 60 82', 'tel:4446082'], [htmlspecialchars($primaryDisplay, ENT_QUOTES, 'UTF-8'), 'tel:' . $primaryTel], $html);
}

// Search Console, Yandex, Bing, GA4, Google Ads ve Özel <head> kodlarını sunucu tarafında <head> içine göm
function extractMetaTokenPhp($raw) {
    $val = trim((string)$raw);
    if ($val === '') return '';
    if (preg_match('/content\s*=\s*["\']([^"\']+)["\']/i', $val, $m)) {
        return trim($m[1]);
    }
    return trim(strip_tags($val));
}

$headInject = "\n  <!-- Merkez Servis Canli Search Console & Ads Kodlari -->\n";
$gscToken = extractMetaTokenPhp($cfg['googleSearchConsoleVerification'] ?? '');
if ($gscToken !== '') {
    $headInject .= '  <meta name="google-site-verification" content="' . htmlspecialchars($gscToken, ENT_QUOTES, 'UTF-8') . '">' . "\n";
}
$yandexToken = extractMetaTokenPhp($cfg['yandexVerification'] ?? '');
if ($yandexToken !== '') {
    $headInject .= '  <meta name="yandex-verification" content="' . htmlspecialchars($yandexToken, ENT_QUOTES, 'UTF-8') . '">' . "\n";
}
$bingToken = extractMetaTokenPhp($cfg['bingVerification'] ?? '');
if ($bingToken !== '') {
    $headInject .= '  <meta name="msvalidate.01" content="' . htmlspecialchars($bingToken, ENT_QUOTES, 'UTF-8') . '">' . "\n";
}

$ga4Id = trim((string)($cfg['googleAnalyticsId'] ?? ''));
$adsId = trim((string)($cfg['googleAdsId'] ?? ''));
$gtagPrimary = $ga4Id !== '' ? $ga4Id : $adsId;
if ($gtagPrimary !== '') {
    $safePrimary = htmlspecialchars($gtagPrimary, ENT_QUOTES, 'UTF-8');
    $headInject .= '  <script async src="https://www.googletagmanager.com/gtag/js?id=' . $safePrimary . '"></script>' . "\n";
    $headInject .= "  <script>\n    window.dataLayer = window.dataLayer || [];\n    function gtag(){dataLayer.push(arguments);}\n    gtag('js', new Date());\n";
    if ($ga4Id !== '') {
        $headInject .= "    gtag('config', '" . htmlspecialchars($ga4Id, ENT_QUOTES, 'UTF-8') . "');\n";
    }
    if ($adsId !== '') {
        $headInject .= "    gtag('config', '" . htmlspecialchars($adsId, ENT_QUOTES, 'UTF-8') . "');\n";
    }
    $headInject .= "  </script>\n";
}

if (!empty($cfg['customHeadHtml'])) {
    $headInject .= "  " . $cfg['customHeadHtml'] . "\n";
}

$html = str_replace('</head>', $headInject . '</head>', $html);

if (!empty($cfg['customBodyHtml'])) {
    $html = str_replace('</body>', "\n" . $cfg['customBodyHtml'] . "\n</body>", $html);
}

header('Content-Type: text/html; charset=utf-8');
echo $html;
