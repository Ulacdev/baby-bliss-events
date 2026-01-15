<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP is working\n";
echo "Current directory: " . __DIR__ . "\n";
echo "Config file exists: " . (file_exists('config.php') ? 'yes' : 'no') . "\n";

if (file_exists('config.php')) {
    require_once 'config.php';
    echo "Config loaded\n";

    try {
        $conn = getDBConnection();
        echo json_encode(['status' => 'Database connected successfully']);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    }
} else {
    echo "Config file not found\n";
}