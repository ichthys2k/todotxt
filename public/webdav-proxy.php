<?php
/**
 * WebDAV Proxy
 *
 * Leitet WebDAV-Anfragen der Web-App an den vom Nutzer konfigurierten WebDAV-Server
 * weiter. Die App läuft im Browser und darf fremde Server wegen der Same-Origin-Policy
 * nicht direkt ansprechen; dieser Proxy liegt deshalb auf derselben Domain wie die App.
 *
 * Sicherheitskonzept (der Proxy ist ein "Relay", also ein beliebtes Missbrauchsziel):
 * - Kein CORS: Der Proxy wird nur von der eigenen Seite benutzt (gleiche Herkunft).
 *   Fremde Webseiten scheitern schon am Preflight; zusätzlich wird Origin/Sec-Fetch-Site geprüft.
 * - Nur GET, PUT und PROPFIND, nur https, keine Zugangsdaten in der Ziel-URL.
 * - SSRF-Schutz: Das Ziel muss auf ausschließlich öffentliche IP-Adressen (IPv4 und IPv6)
 *   auflösen. Die geprüfte Adresse wird fest an curl gebunden (kein DNS-Rebinding).
 * - Weiterleitungen werden nur innerhalb desselben Hosts und nur über https verfolgt,
 *   und der Authorization-Header verlässt nie den ursprünglichen Host.
 * - Größenlimits für Anfrage und Antwort, Rate-Limit pro IP, Sicherheits-Header.
 *
 * Kompatibel mit PHP 7.4 und neuer.
 */

const WEBDAV_MAX_REQUEST_BYTES = 5242880;   // 5 MB (todo.txt-Dateien sind winzig)
const WEBDAV_MAX_RESPONSE_BYTES = 10485760; // 10 MB
const WEBDAV_MAX_REDIRECTS = 3;
const WEBDAV_RATE_LIMIT = 120;              // Anfragen ...
const WEBDAV_RATE_WINDOW = 60;              // ... pro Zeitfenster in Sekunden und IP

function sendSecurityHeaders()
{
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    header('Referrer-Policy: no-referrer');
    // Selbst wenn jemand die Antwort direkt im Browser öffnen würde, führt sie nichts aus.
    header("Content-Security-Policy: default-src 'none'; sandbox");
}

function fail($status, $message, $extra = [])
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['error' => $message], $extra));
    exit;
}

/** Wahr, wenn die IPv4-Adresse (als Zahl) in CIDR-Bereich liegt. */
function ipv4InRange($ip, $cidr)
{
    list($net, $bits) = explode('/', $cidr);
    $mask = -1 << (32 - (int)$bits);
    return (ip2long($ip) & $mask) === (ip2long($net) & $mask);
}

/** Öffentliche IPv4? (Zusätzlich zu den PHP-Filtern: CGNAT, Dokumentation, Benchmarks, Multicast ...) */
function isPublicIpv4($ip)
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return false;
    }
    $blocked = [
        '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16',
        '172.16.0.0/12', '192.0.0.0/24', '192.0.2.0/24', '192.168.0.0/16', '198.18.0.0/15',
        '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4',
    ];
    foreach ($blocked as $cidr) {
        if (ipv4InRange($ip, $cidr)) {
            return false;
        }
    }
    return true;
}

/** Öffentliche IP (v4 oder v6)? Eingebettete IPv4-Adressen werden mitgeprüft. */
function isPublicIp($ip)
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false) {
        return isPublicIpv4($ip);
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) === false) {
        return false;
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return false;
    }
    $bin = @inet_pton($ip);
    if ($bin === false || strlen($bin) !== 16) {
        return false;
    }
    $zeros10 = str_repeat("\0", 10);
    // ::/96 (veraltet, IPv4-kompatibel) und ::ffff:0:0/96 (IPv4-gemappt)
    if (substr($bin, 0, 12) === str_repeat("\0", 12) || substr($bin, 0, 12) === $zeros10 . "\xff\xff") {
        return isPublicIpv4(inet_ntop(substr($bin, 12, 4)));
    }
    // 64:ff9b::/96 (NAT64)
    if (substr($bin, 0, 12) === "\x00\x64\xff\x9b" . str_repeat("\0", 8)) {
        return isPublicIpv4(inet_ntop(substr($bin, 12, 4)));
    }
    // 2002::/16 (6to4): die IPv4-Adresse steckt in den Bytes 2-5
    if (substr($bin, 0, 2) === "\x20\x02") {
        return isPublicIpv4(inet_ntop(substr($bin, 2, 4)));
    }
    // fec0::/10 (Site-Local, veraltet) und fc00::/7 (ULA) falls der PHP-Filter sie nicht kennt
    $first = ord($bin[0]);
    $second = ord($bin[1]);
    if (($first & 0xfe) === 0xfc || ($first === 0xfe && ($second & 0xc0) === 0xc0)) {
        return false;
    }
    return true;
}

/** Löst den Hostnamen auf und gibt alle Adressen zurück – oder null, wenn auch nur eine nicht öffentlich ist. */
function resolvePublicIps($host)
{
    $host = trim($host, '[]');
    if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
        return isPublicIp($host) ? [$host] : null;
    }
    // Nur normale Hostnamen: Buchstaben, Ziffern, Punkt, Bindestrich (keine Sonderformen wie 0x7f.1)
    if (!preg_match('/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i', $host)) {
        return null;
    }
    $ips = [];
    if (function_exists('dns_get_record')) {
        $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        if (is_array($records)) {
            foreach ($records as $r) {
                if (isset($r['ip'])) {
                    $ips[] = $r['ip'];
                } elseif (isset($r['ipv6'])) {
                    $ips[] = $r['ipv6'];
                }
            }
        }
    }
    if (!$ips) {
        $v4 = @gethostbynamel($host);
        if (is_array($v4)) {
            $ips = $v4;
        }
    }
    if (!$ips) {
        return null;
    }
    foreach ($ips as $ip) {
        if (!isPublicIp($ip)) {
            return null; // Auch nur eine interne Adresse genügt für die Ablehnung
        }
    }
    return array_values(array_unique($ips));
}

/**
 * Prüft eine Ziel-URL und gibt ihre Bestandteile samt geprüften IP-Adressen zurück.
 * Bricht bei Verstößen mit einer Fehlerantwort ab.
 */
function validateTarget($url)
{
    if (strlen($url) > 2048 || preg_match('/[\x00-\x20\x7f]/', $url)) {
        fail(400, 'Invalid URL format.');
    }
    $parts = parse_url($url);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        fail(400, 'Invalid URL format.');
    }
    if (strtolower($parts['scheme']) !== 'https') {
        fail(400, 'Only HTTPS URLs are supported.');
    }
    if (isset($parts['user']) || isset($parts['pass'])) {
        fail(400, 'Credentials in the URL are not allowed.');
    }
    $port = isset($parts['port']) ? (int)$parts['port'] : 443;
    if ($port < 1 || $port > 65535) {
        fail(400, 'Invalid port.');
    }
    $ips = resolvePublicIps($parts['host']);
    if ($ips === null) {
        fail(403, 'Target host is not allowed (only public internet hosts are reachable).');
    }
    return ['url' => $url, 'host' => strtolower(trim($parts['host'], '[]')), 'port' => $port, 'ips' => $ips];
}

/** Löst eine Weiterleitungs-Adresse relativ zur aktuellen URL auf (nur die üblichen Fälle). */
function resolveRedirect($base, $location)
{
    if (preg_match('#^https?://#i', $location)) {
        return $location;
    }
    $p = parse_url($base);
    $origin = $p['scheme'] . '://' . $p['host'] . (isset($p['port']) ? ':' . $p['port'] : '');
    if (strpos($location, '//') === 0) {
        return $p['scheme'] . ':' . $location;
    }
    if (isset($location[0]) && $location[0] === '/') {
        return $origin . $location;
    }
    $dir = isset($p['path']) ? preg_replace('#/[^/]*$#', '/', $p['path']) : '/';
    return $origin . $dir . $location;
}

/** Einfaches Rate-Limit pro IP über eine Datei im Temp-Verzeichnis. Fällt im Zweifel zugunsten des Nutzers aus. */
function enforceRateLimit()
{
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $dir = sys_get_temp_dir();
    $file = $dir . DIRECTORY_SEPARATOR . 'webdav-proxy-rl-' . sha1($ip);
    $fh = @fopen($file, 'c+');
    if (!$fh) {
        return;
    }
    if (flock($fh, LOCK_EX)) {
        $now = time();
        $data = json_decode((string)stream_get_contents($fh), true);
        if (!is_array($data) || !isset($data['start'], $data['count']) || $now - $data['start'] >= WEBDAV_RATE_WINDOW) {
            $data = ['start' => $now, 'count' => 0];
        }
        $data['count']++;
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($data));
        fflush($fh);
        flock($fh, LOCK_UN);
        if ($data['count'] > WEBDAV_RATE_LIMIT) {
            fclose($fh);
            header('Retry-After: ' . WEBDAV_RATE_WINDOW);
            fail(429, 'Too many requests.');
        }
    }
    fclose($fh);
    // Gelegentlich alte Zähler aufräumen
    if (mt_rand(1, 200) === 1) {
        foreach ((array)glob($dir . DIRECTORY_SEPARATOR . 'webdav-proxy-rl-*') as $old) {
            if (@filemtime($old) < time() - 10 * WEBDAV_RATE_WINDOW) {
                @unlink($old);
            }
        }
    }
}

/** Führt die Anfrage aus und liefert Status, Content-Type, Location und Body. */
function performRequest($target, $method, $headers, $body)
{
    $ch = curl_init($target['url']);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body !== null && $body !== '') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    curl_setopt($ch, CURLOPT_USERAGENT, 'todotxt-webdav-proxy');
    if (defined('CURLOPT_PROTOCOLS_STR')) {
        curl_setopt($ch, CURLOPT_PROTOCOLS_STR, 'https');
    } elseif (defined('CURLOPT_PROTOCOLS') && defined('CURLPROTO_HTTPS')) {
        curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
    }
    // Die geprüften Adressen fest an den Hostnamen binden: curl löst nicht erneut auf.
    if (filter_var($target['host'], FILTER_VALIDATE_IP) === false) {
        $addresses = [];
        foreach ($target['ips'] as $ip) {
            $addresses[] = strpos($ip, ':') !== false ? '[' . $ip . ']' : $ip;
        }
        curl_setopt($ch, CURLOPT_RESOLVE, [$target['host'] . ':' . $target['port'] . ':' . implode(',', $addresses)]);
    }

    $contentType = '';
    $location = '';
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($c, $line) use (&$contentType, &$location) {
        if (stripos($line, 'content-type:') === 0) {
            $contentType = trim(substr($line, 13));
        } elseif (stripos($line, 'location:') === 0) {
            $location = trim(substr($line, 9));
        }
        return strlen($line);
    });

    $response = '';
    $tooLarge = false;
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($c, $chunk) use (&$response, &$tooLarge) {
        if (strlen($response) + strlen($chunk) > WEBDAV_MAX_RESPONSE_BYTES) {
            $tooLarge = true;
            return 0; // bricht die Übertragung ab
        }
        $response .= $chunk;
        return strlen($chunk);
    });

    $ok = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($tooLarge) {
        fail(502, 'Response from WebDAV server is too large.');
    }
    if ($ok === false) {
        fail(502, 'Failed to connect to WebDAV server.', ['code' => $errno]);
    }
    return ['status' => $status, 'contentType' => $contentType, 'location' => $location, 'body' => $response];
}

// ---------------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------------

sendSecurityHeaders();

// Preflight-Anfragen anderer Herkunft werden bewusst abgelehnt (kein Access-Control-Allow-Origin).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    fail(403, 'Cross-origin requests are not allowed.');
}

// Nur Anfragen der eigenen Seite zulassen
$secFetchSite = isset($_SERVER['HTTP_SEC_FETCH_SITE']) ? strtolower($_SERVER['HTTP_SEC_FETCH_SITE']) : '';
if ($secFetchSite !== '' && $secFetchSite !== 'same-origin' && $secFetchSite !== 'none') {
    fail(403, 'Cross-origin requests are not allowed.');
}
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $originHost = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $originPort = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_PORT);
    $originAuthority = strtolower((string)$originHost) . ($originPort ? ':' . $originPort : '');
    $ownAuthority = strtolower(isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '');
    if ($originAuthority === '' || $originAuthority !== $ownAuthority) {
        fail(403, 'Cross-origin requests are not allowed.');
    }
}

enforceRateLimit();

// POST mit X-HTTP-Method-Override: PROPFIND (für Server, die PROPFIND blockieren)
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']) && $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] === 'PROPFIND') {
    $method = 'PROPFIND';
}
if (!in_array($method, ['GET', 'PUT', 'PROPFIND'], true)) {
    fail(405, 'Method not allowed. Only GET, PUT and PROPFIND are supported.');
}

$targetUrl = isset($_SERVER['HTTP_X_WEBDAV_URL']) ? $_SERVER['HTTP_X_WEBDAV_URL'] : '';
if ($targetUrl === '') {
    fail(400, 'Missing X-WebDAV-URL header.');
}
$target = validateTarget($targetUrl);

// Anfrage-Body begrenzt einlesen
$body = null;
if ($method === 'PUT' || $method === 'PROPFIND') {
    if (isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > WEBDAV_MAX_REQUEST_BYTES) {
        fail(413, 'Request body is too large.');
    }
    $in = fopen('php://input', 'rb');
    $body = (string)stream_get_contents($in, WEBDAV_MAX_REQUEST_BYTES + 1);
    fclose($in);
    if (strlen($body) > WEBDAV_MAX_REQUEST_BYTES) {
        fail(413, 'Request body is too large.');
    }
}

// Header für das Ziel zusammenstellen
$auth = '';
if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}
if (preg_match('/[\r\n]/', $auth)) {
    fail(400, 'Invalid Authorization header.');
}
$baseHeaders = [];
if ($method === 'PUT') {
    $ct = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : 'text/plain';
    $baseHeaders[] = 'Content-Type: ' . (preg_match('/^[\w.+\-]+\/[\w.+\-]+(;[ \w=.\-"]+)?$/', $ct) ? $ct : 'text/plain');
} elseif ($method === 'PROPFIND') {
    $baseHeaders[] = 'Content-Type: application/xml';
    $depth = isset($_SERVER['HTTP_DEPTH']) ? $_SERVER['HTTP_DEPTH'] : '';
    if ($depth === '0' || $depth === '1') { // "infinity" ist hier unnötig und teuer
        $baseHeaders[] = 'Depth: ' . $depth;
    }
}

// Anfrage ausführen; Weiterleitungen nur innerhalb desselben Hosts folgen
$originalHost = $target['host'];
$originalPort = $target['port'];
$result = null;
for ($hop = 0; $hop <= WEBDAV_MAX_REDIRECTS; $hop++) {
    $headers = $baseHeaders;
    if ($auth !== '') {
        $headers[] = 'Authorization: ' . $auth; // nur an den ursprünglichen Host (siehe unten)
    }
    $result = performRequest($target, $method, $headers, $body);

    $isRedirect = in_array($result['status'], [301, 302, 303, 307, 308], true) && $result['location'] !== '';
    if (!$isRedirect) {
        break;
    }
    if ($hop === WEBDAV_MAX_REDIRECTS) {
        fail(502, 'Too many redirects.');
    }
    $next = validateTarget(resolveRedirect($target['url'], $result['location']));
    if ($next['host'] !== $originalHost || $next['port'] !== $originalPort) {
        fail(502, 'Redirect to another host is not allowed.');
    }
    $target = $next;
}

// Antwort weitergeben: nur ein unverdächtiger Content-Type, sonst nichts vom Ziel übernehmen
$ct = $result['contentType'];
if ($ct === '' || !preg_match('/^[\w.+\-]+\/[\w.+\-]+(;[ \w=.\-"]+)?$/', $ct)) {
    $ct = 'text/plain; charset=utf-8';
}
header('Content-Type: ' . $ct);
http_response_code($result['status'] > 0 ? $result['status'] : 502);
echo $result['body'];
