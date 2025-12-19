<?php
require_once 'config.php';

$conn = getDBConnection();

// Update admin password to 'admin123'
$newPassword = 'admin123';
$newHash = password_hash($newPassword, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
$stmt->bind_param("ss", $newHash, $adminEmail);
$adminEmail = 'admin@babybliss.com';

if ($stmt->execute()) {
    echo "✅ Admin password updated to 'admin123'\n";
    echo "New hash: $newHash\n";
} else {
    echo "❌ Failed to update password: " . $stmt->error . "\n";
}

$conn->close();
?>