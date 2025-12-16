<?php
// Test script to verify public event access is working
header('Content-Type: application/json');

echo "Testing Public Event Access\n";
echo "==========================\n\n";

// Test 1: Check if bookings API allows public access
echo "1. Testing GET /api/bookings.php?id=1&public=1\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/api/bookings.php?id=1&public=1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n\n";

// Test 2: Check if the API allows access without authentication
echo "2. Testing without authentication headers\n";

$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, 'http://localhost/api/bookings.php?id=1&public=1');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
    // No Authorization header
]);

$response2 = curl2_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "HTTP Status: $httpCode2\n";
echo "Response: $response2\n\n";

// Test 3: Check what happens with a non-existent event ID
echo "3. Testing with non-existent event ID\n";

$ch3 = curl_init();
curl_setopt($ch3, CURLOPT_URL, 'http://localhost/api/bookings.php?id=99999&public=1');
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response3 = curl_exec($ch3);
$httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);

echo "HTTP Status: $httpCode3\n";
echo "Response: $response3\n\n";

echo "Test completed!\n";
?>