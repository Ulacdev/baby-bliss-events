<?php
require_once 'api/config.php';

$conn = getDBConnection();

// Check if staff user has profile data
$stmt = $conn->prepare("SELECT u.id, u.email, u.role, p.first_name, p.last_name, p.profile_image FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = 'staff@babybliss.com'");
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

echo "Staff user data:\n";
print_r($user);

if (!$user['first_name']) {
    echo "\nNo profile data found. Creating default profile...\n";

    // Check if profile record exists
    $checkStmt = $conn->prepare("SELECT id FROM profiles WHERE user_id = ?");
    $checkStmt->bind_param("i", $user['id']);
    $checkStmt->execute();

    if ($checkStmt->get_result()->num_rows === 0) {
        // Create profile record
        $insertStmt = $conn->prepare("INSERT INTO profiles (user_id, first_name, last_name) VALUES (?, 'Staff', 'Member')");
        $insertStmt->bind_param("i", $user['id']);
        if ($insertStmt->execute()) {
            echo "Profile created successfully!\n";
        } else {
            echo "Failed to create profile: " . $insertStmt->error . "\n";
        }
    } else {
        // Update existing profile
        $updateStmt = $conn->prepare("UPDATE profiles SET first_name = 'Staff', last_name = 'Member' WHERE user_id = ?");
        $updateStmt->bind_param("i", $user['id']);
        if ($updateStmt->execute()) {
            echo "Profile updated successfully!\n";
        } else {
            echo "Failed to update profile: " . $updateStmt->error . "\n";
        }
    }
} else {
    echo "\nProfile data exists.\n";
}

$stmt->close();
$conn->close();
?>