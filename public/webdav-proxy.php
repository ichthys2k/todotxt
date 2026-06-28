<?php
/**
 * WebDAV CORS Proxy
 * 
 * This lightweight PHP proxy forwards WebDAV requests to the target server,
 * bypassing browser CORS restrictions. It runs on the same origin as the
 * web app, so the browser allows the requests.
 *
 * Security measures:
 * - Only allows GET, PUT and PROPFIND methods
 * - Only proxies to HTTPS URLs (configurable)
 * - Validates and sanitizes all inputs
 */

// Allow requests from same origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, PROPFIND, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WebDAV-URL, Depth');
header('Access-Control-Max-Age: 86400');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// POST with X-HTTP-Method-Override: PROPFIND (fallback for servers that block PROPFIND)
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']) && $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] === 'PROPFIND') {
    $method = 'PROPFIND';
}

// Only allow GET, PUT and PROPFIND
if (!in_array($method, ['GET', 'PUT', 'PROPFIND'])) {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Only GET, PUT and PROPFIND are supported.']);
    exit;
}

// Get target URL from header
$targetUrl = isset($_SERVER['HTTP_X_WEBDAV_URL']) ? $_SERVER['HTTP_X_WEBDAV_URL'] : null;

if (!$targetUrl) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing X-WebDAV-URL header.']);
    exit;
}

// Validate URL
$parsedUrl = parse_url($targetUrl);
if (!$parsedUrl || !isset($parsedUrl['scheme']) || !isset($parsedUrl['host'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL format.']);
    exit;
}

// Only allow HTTPS (or HTTP for local dev)
$scheme = strtolower($parsedUrl['scheme']);
if (!in_array($scheme, ['https', 'http'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Only HTTPS URLs are supported.']);
    exit;
}

// Block requests to localhost/private IPs to prevent SSRF
$host = strtolower($parsedUrl['host']);
$blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
if (in_array($host, $blockedHosts)) {
    http_response_code(403);
    echo json_encode(['error' => 'Requests to localhost are not allowed.']);
    exit;
}

// Check for private IP ranges (SSRF protection)
$ip = gethostbyname($host);
if ($ip !== $host) { // DNS resolved
    $longIp = ip2long($ip);
    if ($longIp !== false) {
        // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8
        $privateRanges = [
            [ip2long('10.0.0.0'), ip2long('10.255.255.255')],
            [ip2long('172.16.0.0'), ip2long('172.31.255.255')],
            [ip2long('192.168.0.0'), ip2long('192.168.255.255')],
            [ip2long('127.0.0.0'), ip2long('127.255.255.255')],
        ];
        foreach ($privateRanges as $range) {
            if ($longIp >= $range[0] && $longIp <= $range[1]) {
                http_response_code(403);
                echo json_encode(['error' => 'Requests to private networks are not allowed.']);
                exit;
            }
        }
    }
}

// Build cURL request
$ch = curl_init($targetUrl);

// Forward Authorization header
$headers = [];
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $headers[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
}

// Handle body for PUT and PROPFIND
if ($method === 'PUT' || $method === 'PROPFIND') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    
    if ($method === 'PUT') {
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : 'text/plain';
        $headers[] = 'Content-Type: ' . $contentType;
    } else {
        // PROPFIND uses XML
        $headers[] = 'Content-Type: application/xml';
    }
}

// Forward Depth header for PROPFIND
if ($method === 'PROPFIND' && isset($_SERVER['HTTP_DEPTH'])) {
    $headers[] = 'Depth: ' . $_SERVER['HTTP_DEPTH'];
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

// Execute
$response = curl_exec($ch);

if ($response === false) {
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);
    http_response_code(502);
    echo json_encode([
        'error' => 'Failed to connect to WebDAV server.',
        'details' => $error,
        'code' => $errno
    ]);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

// Forward relevant headers
$headerLines = explode("\r\n", $responseHeaders);
foreach ($headerLines as $headerLine) {
    $lower = strtolower($headerLine);
    if (strpos($lower, 'content-type:') === 0) {
        header($headerLine);
    }
}

// Set response code and body
http_response_code($httpCode);
echo $responseBody;
