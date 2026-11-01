<?php
/**
 * Merkez Beyaz Eşya Servisi — Sunucu Tarafı Canlı Yönetim, Numara & Ziyaretçi Telemetri API (v3)
 * Gereksinim: Standart PHP 7.4+ / 8.x (cPanel, Plesk, DirectAdmin, LiteSpeed, Apache - Veritabanı gerektirmez, JSON tabanlıdır)
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$htaccessProtect = $dataDir . '/.htaccess';
if (!file_exists($htaccessProtect)) {
    @file_put_contents($htaccessProtect, "Order allow,deny\nDeny from all\n");
}

$configFile   = $dataDir . '/config.json';
$visitorsFile = $dataDir . '/visitors.json';
$leadsFile    = $dataDir . '/leads.json';

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
$rawBody = file_get_contents('php://input');
$payload = $rawBody ? json_decode($rawBody, true) : [];
if (!is_array($payload)) $payload = [];

if ($action === 'public_bootstrap') {
    $cfg = readJsonFile($configFile, []);
    $visitors = readJsonFile($visitorsFile, []);
    $leads = readJsonFile($leadsFile, []);
    echo json_encode([
        'ok' => true,
        'config' => $cfg,
        'visitors' => array_slice($visitors, 0, 120),
        'leads' => $leads
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'save_config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $cur = readJsonFile($configFile, []);
    $merged = array_merge($cur, $payload);
    // Varsayılan canlı kurumsal görünümde üst demo bar kapalı tutulur
    writeJsonFile($configFile, $merged);
    echo json_encode(['ok' => true, 'saved' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'track_visitor' && $_SERVER['REQUEST_METHOD'] === 'POST') {
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

if (($action === 'add_lead' || $action === 'save_leads') && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'save_leads' && isset($payload['leads']) && is_array($payload['leads'])) {
        writeJsonFile($leadsFile, array_slice($payload['leads'], 0, 500));
    } else {
        $leads = readJsonFile($leadsFile, []);
        array_unshift($leads, $payload);
        writeJsonFile($leadsFile, array_slice($leads, 0, 500));
    }
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'unknown_action'], JSON_UNESCAPED_UNICODE);
