<?php
/**
 * Merkez Beyaz Eşya Servisi — Dinamik Google Search Console XML Site Haritası (/sitemap.xml)
 */

header('Content-Type: application/xml; charset=utf-8');

$configFile = __DIR__ . '/data/config.json';
$cfg = [];
if (file_exists($configFile)) {
    $decoded = json_decode(@file_get_contents($configFile), true);
    if (is_array($decoded)) $cfg = $decoded;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? 'merkezservis.com.tr';
$base   = rtrim((string)($cfg['siteDomainUrl'] ?? ($scheme . '://' . $host)), '/');
$today  = date('Y-m-d');

$brands = [
    'arcelik','beko','bosch','siemens','profilo','samsung','lg','vestel','eca','vaillant',
    'viessmann','buderus','demirdokum','baymak','alarko','baykan','altus','miele','electrolux','aeg',
    'regal','seg','sharp','hotpoint','ariston','indesit','ferroli','airfel','protherm','immergas',
    'lambert','gaggenau','franke','teka','beretta','zanussi','westinghouse','amana'
];

$services = [
    'beyaz-esya-servisi','beyaz-esya-tamircisi','buzdolabi-servisi','buzdolabi-tamircisi',
    'camasir-makinesi-servisi','camasir-makinesi-tamircisi','bulasik-makinesi-servisi','bulasik-makinesi-tamircisi',
    'firin-servisi','firin-tamircisi','televizyon-servisi','televizyon-tamircisi',
    'kombi-servisi','kombi-tamircisi','kombi-bakimi','kombi-tamiri','kombi-ariza-servisi','kombi-yillik-bakim',
    'kombi-petek-temizligi','petek-temizleme','petek-temizligi','petek-bakimi',
    'kalorifer-petegi-temizligi','kalorifer-tesisati-temizligi',
    'klima-servisi','klima-tamircisi','klima-bakimi','klima-montaji',
    'endustriyel-mutfak-servisi','endustriyel-mutfak-tamircisi','endustriyel-buzdolabi-servisi',
    'endustriyel-bulasik-makinesi-servisi','endustriyel-camasir-makinesi-servisi','endustriyel-firin-servisi',
    'sanayi-tipi-buzdolabi-tamircisi','sanayi-tipi-bulasik-makinesi-tamircisi','sanayi-tipi-ocak-servisi',
    'soguk-hava-deposu-servisi','sogutma-sistemleri-servisi','buz-makinesi-servisi','cay-kazani-tamircisi'
];

$urls = [$base . '/'];
foreach ($brands as $b) {
    $urls[] = $base . '/' . $b . '-servisi';
}
foreach ($services as $s) {
    $urls[] = $base . '/' . $s;
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $i => $u) {
    $prio = ($i === 0) ? '1.0' : '0.9';
    echo "  <url>\n";
    echo "    <loc>" . htmlspecialchars($u, ENT_XML1, 'UTF-8') . "</loc>\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>{$prio}</priority>\n";
    echo "  </url>\n";
}
echo "</urlset>\n";
