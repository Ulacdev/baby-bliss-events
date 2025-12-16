<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

// Check authentication for all profile operations
$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

$user_id = $user['user_id'];

switch ($method) {
    case 'GET':
        getProfile($user_id);
        break;
    case 'PUT':
        if ($action === 'change_password') {
            changePassword($user_id);
        } else {
            updateProfile($user_id);
        }
        break;
    case 'POST':
        if ($action === 'upload_image') {
            uploadProfileImage($user_id);
        } else {
            sendResponse(['error' => 'Invalid action'], 400);
        }
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getProfile($user_id)
{
    $conn = getDBConnection();

    // Get user data including role
    $userStmt = $conn->prepare("SELECT email, role, profile_image as user_profile_image FROM users WHERE id = ?");
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();

    if ($userResult->num_rows === 0) {
        sendResponse(['error' => 'User not found'], 404);
    }

    $userData = $userResult->fetch_assoc();
    $isAdmin = $userData['role'] === 'admin';

    // Ensure profile record exists
    $checkStmt = $conn->prepare("SELECT id FROM profiles WHERE user_id = ?");
    $checkStmt->bind_param("i", $user_id);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        // Create profile record if it doesn't exist
        $insertStmt = $conn->prepare("INSERT INTO profiles (user_id) VALUES (?)");
        $insertStmt->bind_param("i", $user_id);
        $insertStmt->execute();
    }

    // Get profile data from profiles table
    $profileStmt = $conn->prepare("SELECT first_name, last_name, full_name, phone, bio, profile_image, business_name, business_address, business_phone, business_email, created_at, updated_at FROM profiles WHERE user_id = ?");
    $profileStmt->bind_param("i", $user_id);
    $profileStmt->execute();
    $profileResult = $profileStmt->get_result();

    $profile = [];
    if ($profileResult->num_rows > 0) {
        $profile = $profileResult->fetch_assoc();
    }

    // For admins, use profile_image from users table
    if ($isAdmin) {
        $profile['profile_image'] = $userData['user_profile_image'];
    }

    // Combine user and profile data
    $profileData = array_merge([
        'id' => $user_id,
        'email' => $userData['email']
    ], $profile);

    sendResponse(['profile' => $profileData]);
}

function updateProfile($user_id)
{
    $input = getJsonInput();
    $profile = $input['profile'] ?? [];

    $conn = getDBConnection();

    // Check if user exists and get role
    $stmt = $conn->prepare("SELECT email, role FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'User not found'], 404);
    }
    $currentUser = $result->fetch_assoc();
    $isAdmin = $currentUser['role'] === 'admin';

    // Check email uniqueness if email is being updated
    if (isset($profile['email']) && $profile['email'] !== $currentUser['email']) {
        $emailCheckStmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $emailCheckStmt->bind_param("si", $profile['email'], $user_id);
        $emailCheckStmt->execute();
        if ($emailCheckStmt->get_result()->num_rows > 0) {
            sendResponse(['error' => 'Email address is already in use'], 409);
        }
        // Update email in users table
        $emailStmt = $conn->prepare("UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?");
        $emailStmt->bind_param("si", $profile['email'], $user_id);
        $emailStmt->execute();
        unset($profile['email']); // Remove from profile updates
    }

    // Handle profile_image separately based on role
    if (isset($profile['profile_image'])) {
        if ($isAdmin) {
            // For admins, update in users table
            $imgStmt = $conn->prepare("UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?");
            $imgStmt->bind_param("si", $profile['profile_image'], $user_id);
            $imgStmt->execute();
        } else {
            // For others, ensure profile record exists and update in profiles table
            $checkStmt = $conn->prepare("SELECT id FROM profiles WHERE user_id = ?");
            $checkStmt->bind_param("i", $user_id);
            $checkStmt->execute();
            if ($checkStmt->get_result()->num_rows === 0) {
                $insertStmt = $conn->prepare("INSERT INTO profiles (user_id) VALUES (?)");
                $insertStmt->bind_param("i", $user_id);
                $insertStmt->execute();
            }
            $imgStmt = $conn->prepare("UPDATE profiles SET profile_image = ?, updated_at = NOW() WHERE user_id = ?");
            $imgStmt->bind_param("si", $profile['profile_image'], $user_id);
            $imgStmt->execute();
        }
        unset($profile['profile_image']); // Remove from general profile updates
    }

    // Check if profile record exists for non-admin fields, create if not
    $checkStmt = $conn->prepare("SELECT id FROM profiles WHERE user_id = ?");
    $checkStmt->bind_param("i", $user_id);
    $checkStmt->execute();
    $exists = $checkStmt->get_result()->num_rows > 0;

    if (!$exists) {
        // Create profile record
        $insertStmt = $conn->prepare("INSERT INTO profiles (user_id) VALUES (?)");
        $insertStmt->bind_param("i", $user_id);
        $insertStmt->execute();
    }

    // Build update query for profiles table (for non-admin fields)
    $updates = [];
    $params = [];
    $types = '';

    $allowedFields = ['first_name', 'last_name', 'full_name', 'phone', 'bio', 'business_name', 'business_address', 'business_phone', 'business_email'];
    foreach ($allowedFields as $field) {
        if (isset($profile[$field])) {
            $updates[] = "$field = ?";
            $params[] = $profile[$field];
            $types .= 's';
        }
    }

    if (!empty($updates)) {
        $params[] = $user_id;
        $types .= 'i';

        $query = "UPDATE profiles SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
    }

    logAudit('Profile Update', "User ID $user_id updated their profile", $user_id, $currentUser['email']);
    sendResponse(['message' => 'Profile updated successfully']);
}

function changePassword($user_id)
{
    $input = getJsonInput();

    if (!isset($input['current_password']) || !isset($input['new_password'])) {
        sendResponse(['error' => 'Current password and new password are required'], 400);
    }

    $current_password = $input['current_password'];
    $new_password = $input['new_password'];

    if (strlen($new_password) < 6) {
        sendResponse(['error' => 'New password must be at least 6 characters long'], 400);
    }

    $conn = getDBConnection();

    // Get current password hash
    $stmt = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'User not found'], 404);
    }

    $userData = $result->fetch_assoc();

    // Verify current password
    if (!password_verify($current_password, $userData['password_hash'])) {
        sendResponse(['error' => 'Current password is incorrect'], 400);
    }

    // Hash new password
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);

    // Update password
    $stmt = $conn->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
    $stmt->bind_param("si", $new_password_hash, $user_id);

    if ($stmt->execute()) {
        logAudit('Password Change', "User ID $user_id changed their password", $user_id);
        sendResponse(['message' => 'Password changed successfully']);
    } else {
        sendResponse(['error' => 'Failed to change password'], 500);
    }
}

function uploadProfileImage($user_id)
{
    // Debug logging
    error_log('Profile image upload started for user: ' . $user_id);
    error_log('FILES array: ' . print_r($_FILES, true));
    error_log('REQUEST_METHOD: ' . $_SERVER['REQUEST_METHOD']);
    error_log('CONTENT_TYPE: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));

    // Check if file was uploaded
    if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] !== UPLOAD_ERR_OK) {
        error_log('File upload check failed. Error code: ' . ($_FILES['profile_image']['error'] ?? 'no file'));
        sendResponse(['error' => 'No image file uploaded'], 400);
    }

    $file = $_FILES['profile_image'];
    error_log('File details: ' . print_r($file, true));

    // Validate file type
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowed_types)) {
        sendResponse(['error' => 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed'], 400);
    }

    // Validate file size (5MB max)
    if ($file['size'] > 5 * 1024 * 1024) {
        sendResponse(['error' => 'File size too large. Maximum 5MB allowed'], 400);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'profile_' . $user_id . '_' . time() . '.' . $extension;
    $upload_path = '../uploads/' . $filename;

    error_log('Upload path: ' . $upload_path);
    error_log('Current working directory: ' . getcwd());
    error_log('Directory exists: ' . (is_dir('../uploads/') ? 'yes' : 'no'));
    error_log('Directory writable: ' . (is_writable('../uploads/') ? 'yes' : 'no'));

    // Create uploads directory if it doesn't exist
    if (!is_dir('../uploads/')) {
        error_log('Creating directory: ../uploads/');
        mkdir('../uploads/', 0755, true);
    }

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
        error_log('move_uploaded_file failed. Temp file: ' . $file['tmp_name'] . ' exists: ' . (file_exists($file['tmp_name']) ? 'yes' : 'no'));
        error_log('Target path writable: ' . (is_writable(dirname($upload_path)) ? 'yes' : 'no'));
        sendResponse(['error' => 'Failed to save image file'], 500);
    }

    error_log('File uploaded successfully to: ' . $upload_path);

    // Update profile with image path
    $conn = getDBConnection();
    $image_url = '/uploads/' . $filename;

    error_log('Updating database with image URL: ' . $image_url);

    // Get user role
    $roleStmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $roleStmt->bind_param("i", $user_id);
    $roleStmt->execute();
    $roleResult = $roleStmt->get_result();
    $userData = $roleResult->fetch_assoc();
    $isAdmin = $userData['role'] === 'admin';

    error_log('User role: ' . $userData['role'] . ', isAdmin: ' . ($isAdmin ? 'true' : 'false'));

    if ($isAdmin) {
        // For admins, update in users table
        error_log('Updating users table for admin');
        $stmt = $conn->prepare("UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param("si", $image_url, $user_id);
    } else {
        // For others, ensure profile record exists and update in profiles table
        error_log('Updating profiles table for non-admin');
        $checkStmt = $conn->prepare("SELECT id FROM profiles WHERE user_id = ?");
        $checkStmt->bind_param("i", $user_id);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows === 0) {
            error_log('Creating profile record');
            $insertStmt = $conn->prepare("INSERT INTO profiles (user_id) VALUES (?)");
            $insertStmt->bind_param("i", $user_id);
            $insertStmt->execute();
        }
        $stmt = $conn->prepare("UPDATE profiles SET profile_image = ?, updated_at = NOW() WHERE user_id = ?");
        $stmt->bind_param("si", $image_url, $user_id);
    }

    if ($stmt->execute()) {
        error_log('Database update successful');
        logAudit('Profile Image Upload', "User ID $user_id uploaded a new profile image", $user_id);
        sendResponse(['image_url' => $image_url, 'message' => 'Profile image uploaded successfully']);
    } else {
        error_log('Database update failed: ' . $stmt->error);
        // Clean up uploaded file if database update failed
        unlink($upload_path);
        sendResponse(['error' => 'Failed to update profile image'], 500);
    }
}


?>