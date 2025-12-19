<?php
// Simple router for Railway
$request = $_SERVER['REQUEST_URI'];

if ($request === '/health.php' || $request === '/health') {
    require_once 'health.php';
} elseif ($request === '/test_db.php') {
    require_once 'test_db.php';
} else {
    // For API routes, include the appropriate file
    $path = parse_url($request, PHP_URL_PATH);
    $file = basename($path);

    if (file_exists($file . '.php')) {
        require_once $file . '.php';
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }
}
?>