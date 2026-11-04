<?php
/**
 * Merkez Beyaz Eşya Servisi — Sunucu Tarafı Canlı Yönetim, Numara & Ziyaretçi Telemetri API (v3)
 * Gereksinim: Standart PHP 7.4+ / 8.x (cPanel, Plesk, DirectAdmin, LiteSpeed, Apache - Veritabanı gerektirmez, JSON tabanlıdır)
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$htaccessProtect = $dataDir . '/.htaccess';
if (!file_exists($htaccessProtect)) {
    @file_put_contents($htaccessProtect, "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
}

$configFile   = $dataDir . '/config.json';
$visitorsFile = $dataDir . '/visitors.json';
$leadsFile    = $dataDir . '/leads.json';
$adminFile    = $dataDir . '/admin.json';
$rateFile     = $dataDir . '/rate.json';
const API_VERSION = '4.1';

function jsonOut($arr, $code = 200) {
    http_response_code($code);
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Yönetici anahtarı kurulmuş mu? */
function adminConfigured() {
    global $adminFile;
    return file_exists($adminFile);
}

/** X-Admin-Token başlığı kayıtlı anahtarla eşleşiyor mu? (zaman-sabit karşılaştırma) */
function isAdmin() {
    global $adminFile;
    if (!file_exists($adminFile)) return false;
    $cfg = json_decode((string)@file_get_contents($adminFile), true);
    $hash = is_array($cfg) ? ($cfg['tokenHash'] ?? '') : '';
    $given = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    return $hash !== '' && $given !== '' && password_verify($given, $hash);
}

function requireAdmin() {
    if (!adminConfigured()) jsonOut(['ok' => false, 'error' => 'setup_required'], 403);
    if (!isAdmin()) jsonOut(['ok' => false, 'error' => 'forbidden'], 403);
}

/** Basit IP başına hız sınırı: $limit istek / $windowSec saniye. */
function rateLimit($bucket, $limit, $windowSec) {
    global $rateFile;
    $now = time();
    $all = [];
    if (file_exists($rateFile)) {
        $d = json_decode((string)@file_get_contents($rateFile), true);
        if (is_array($d)) $all = $d;
    }
    $key = $bucket . ':' . getClientIpHash();
    $hits = array_values(array_filter($all[$key] ?? [], function ($t) use ($now, $windowSec) { return $t > $now - $windowSec; }));
    if (count($hits) >= $limit) jsonOut(['ok' => false, 'error' => 'rate_limited'], 429);
    $hits[] = $now;
    $all[$key] = $hits;
    foreach ($all as $k => $v) {
        $all[$k] = array_values(array_filter($v, function ($t) use ($now) { return $t > $now - 3600; }));
        if (!$all[$k]) unset($all[$k]);
    }
    @file_put_contents($rateFile, json_encode($all), LOCK_EX);
}

/** Halka açık formlardan gelen kaydı sınırlar: alan sayısı, uzunluk, iç içe derinlik. */
function sanitizePublic($v, $depth = 0) {
    if ($depth > 3) return null;
    if (is_array($v)) {
        $out = [];
        $n = 0;
        foreach ($v as $k => $x) {
            if (++$n > 40) break;
            $out[is_string($k) ? substr(preg_replace('/[^A-Za-z0-9_\-]/', '', $k), 0, 40) : $k] = sanitizePublic($x, $depth + 1);
        }
        return $out;
    }
    if (is_string($v)) return mb_substr($v, 0, 300);
    if (is_int($v) || is_float($v) || is_bool($v) || $v === null) return $v;
    return null;
}

function readJsonFile($path, $default) {
    if (!file_exists($path)) return $default;
    $raw = @file_get_contents($path);
    if (!$raw) return $default;
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $default;
}

function writeJsonFile($path, $data) {
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    @file_put_contents($path, $json, LOCK_EX);
}

function getClientIpMasked() {
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? '0.0.0.0';
    if (strpos($ip, ',') !== false) {
        $ip = trim(explode(',', $ip)[0]);
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $parts = explode('.', $ip);
        return $parts[0] . '.' . $parts[1] . '.' . $parts[2] . '.***';
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        return substr($ip, 0, 14) . ':***';
    }
    return 'Gizli IP';
}

function getClientIpHash() {
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? '0.0.0.0';
    if (strpos($ip, ',') !== false) {
        $ip = trim(explode(',', $ip)[0]);
    }
    return substr(hash('sha256', 'merkez_salt_v3_' . $ip), 0, 16);
}

$action = $_GET['action'] ?? 'public_bootstrap';
$rawBody = file_get_contents('php://input', false, null, 0, 65537);
if ($rawBody !== false && strlen($rawBody) > 65536) jsonOut(['ok' => false, 'error' => 'payload_too_large'], 413);
$payload = $rawBody ? json_decode($rawBody, true) : [];
if (!is_array($payload)) $payload = [];

if ($action === 'ping') {
    jsonOut(['ok' => true, 'version' => API_VERSION, 'auth' => adminConfigured()]);
}

// İlk kurulum: yalnızca henüz anahtar yokken, tek seferlik. Anahtar yalnızca bu yanıtta görünür.
if ($action === 'setup' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (adminConfigured()) jsonOut(['ok' => false, 'error' => 'already_setup'], 409);
    $token = bin2hex(random_bytes(24));
    writeJsonFile($adminFile, ['tokenHash' => password_hash($token, PASSWORD_DEFAULT), 'createdAt' => date('c')]);
    jsonOut(['ok' => true, 'token' => $token]);
}

if ($action === 'public_bootstrap') {
    $cfg = readJsonFile($configFile, []);
    // Ziyaretçi ve müşteri (iş emri) verileri yalnızca yönetici anahtarıyla döner.
    if (isAdmin()) {
        jsonOut([
            'ok' => true,
            'config' => $cfg,
            'visitors' => array_slice(readJsonFile($visitorsFile, []), 0, 120),
            'leads' => readJsonFile($leadsFile, [])
        ]);
    }
    jsonOut(['ok' => true, 'config' => $cfg]);
}

if ($action === 'save_config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin();
    $cur = readJsonFile($configFile, []);
    $merged = array_merge($cur, $payload);
    // Varsayılan canlı kurumsal görünümde üst demo bar kapalı tutulur
    writeJsonFile($configFile, $merged);
    echo json_encode(['ok' => true, 'saved' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'track_visitor' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    rateLimit('track', 240, 600);
    $payload = sanitizePublic($payload);
    foreach (['ipMasked', 'ipHash', 'lastActiveEpoch', 'suspectedFraud', 'isSeed', 'isCurrentSession', 'isLiveNow'] as $reserved) {
        unset($payload[$reserved]);
    }
    $sid = preg_replace('/[^A-Za-z0-9\-_]/', '', (string)($payload['sid'] ?? ''));
    if (!$sid) {
        echo json_encode(['ok' => false, 'error' => 'missing_sid']);
        exit;
    }

    $visitors = readJsonFile($visitorsFile, []);
    $ipMasked = getClientIpMasked();
    $ipHash   = getClientIpHash();

    $payload['sid'] = $sid;
    $payload['isSeed'] = false;
    $payload['ipMasked'] = $ipMasked;
    $payload['ipHash'] = $ipHash;
    $payload['lastActiveEpoch'] = round(microtime(true) * 1000);

    // Aynı IP'den son 30 dakikada yapılan farklı Google Ads oturumlarını say (Sahte/Rakip tıklama tespiti)
    $recentSameIpAds = 0;
    $cutoffMs = (round(microtime(true) * 1000)) - (30 * 60 * 1000);
    foreach ($visitors as $v) {
        if (($v['ipHash'] ?? '') === $ipHash && ($v['sid'] ?? '') !== $sid && ($v['lastActiveEpoch'] ?? 0) >= $cutoffMs) {
            if (!empty($v['adClickCount']) || stripos((string)($v['source'] ?? ''), 'Ads') !== false) {
                $recentSameIpAds++;
            }
        }
    }
    if (!empty($payload['adClickCount']) || stripos((string)($payload['source'] ?? ''), 'Ads') !== false) {
        $totalAdClicks = max((int)($payload['adClickCount'] ?? 1), $recentSameIpAds + 1);
        $payload['adClickCount'] = $totalAdClicks;
        if ($totalAdClicks >= 3) {
            $payload['suspectedFraud'] = true;
        }
    }

    $foundIdx = -1;
    foreach ($visitors as $idx => $existing) {
        if (($existing['sid'] ?? '') === $sid) {
            $foundIdx = $idx;
            break;
        }
    }

    if ($foundIdx >= 0) {
        $visitors[$foundIdx] = array_merge($visitors[$foundIdx], $payload);
        $updated = $visitors[$foundIdx];
        array_splice($visitors, $foundIdx, 1);
        array_unshift($visitors, $updated);
    } else {
        array_unshift($visitors, $payload);
    }

    $visitors = array_slice($visitors, 0, 250);
    writeJsonFile($visitorsFile, $visitors);
    echo json_encode(['ok' => true, 'ipMasked' => $ipMasked], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'save_leads' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin();
    if (isset($payload['leads']) && is_array($payload['leads'])) {
        writeJsonFile($leadsFile, array_slice($payload['leads'], 0, 500));
    }
    jsonOut(['ok' => true]);
}

if ($action === 'add_lead' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    rateLimit('lead', 12, 600);
    $lead = sanitizePublic($payload);
    if (!is_array($lead) || empty($lead['phone'])) jsonOut(['ok' => false, 'error' => 'invalid_lead'], 422);
    $leads = readJsonFile($leadsFile, []);
    array_unshift($leads, $lead);
    writeJsonFile($leadsFile, array_slice($leads, 0, 500));
    jsonOut(['ok' => true]);
}

jsonOut(['ok' => false, 'error' => 'unknown_action'], 404);
