<?php
require_once 'api/config.php';

$conn = getDBConnection();

// Delete existing admin user if exists
$conn->query("DELETE FROM users WHERE email = 'admin@babybliss.com'");

// Create new admin user
$email = 'admin@babybliss.com';
$password = password_hash('admin123', PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
$stmt->bind_param("ss", $email, $password);

if ($stmt->execute()) {
    echo "Admin user created successfully!\n";
    echo "Email: admin@babybliss.com\n";
    echo "Password: admin123\n";
} else {
    echo "Failed to create admin user: " . $stmt->error . "\n";
}

$stmt->close();
$conn->close();
?>