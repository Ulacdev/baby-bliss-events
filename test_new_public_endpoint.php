<?php
// Test the new public events endpoint
echo "Testing new public events endpoint...\n\n";

$testUrl = 'http://localhost/api/public_events.php?id=1';
echo "Testing URL: $testUrl\n\n";

// Test 1: Direct cURL call
echo "=== TEST 1: Direct cURL call ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n\n";

// Test 2: Test with non-existent event
echo "=== TEST 2: Non-existent event (ID: 99999) ===\n";
$testUrl2 = 'http://localhost/api/public_events.php?id=99999';
$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, $testUrl2);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response2 = curl_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "HTTP Status: $httpCode2\n";
echo "Response: $response2\n\n";

// Test 3: Test without ID parameter
echo "=== TEST 3: Missing ID parameter ===\n";
$testUrl3 = 'http://localhost/api/public_events.php';
$ch3 = curl_init();
curl_setopt($ch3, CURLOPT_URL, $testUrl3);
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response3 = curl_exec($ch3);
$httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);

echo "HTTP Status: $httpCode3\n";
echo "Response: $response3\n\n";

echo "Tests completed!\n";
?>