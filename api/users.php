<?php
require_once 'config.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch ($method) {
        case 'GET':
            if ($action === 'list') {
                handleGetUsers();
            } elseif ($action === 'profile') {
                handleGetUserProfile();
            }
            break;
        case 'POST':
            if ($action === 'create') {
                handleCreateUser();
            } elseif ($action === 'update') {
                handleUpdateUser();
            }
            break;
        case 'DELETE':
            handleDeleteUser();
            break;
        default:
            sendResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log("Users API Error: " . $e->getMessage());
    sendResponse(['error' => 'Internal server error'], 500);
}

function handleGetUsers()
{
    $user = authenticateWithToken();
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
        return;
    }

    $conn = getDBConnection();

    // Get users with their profiles
    $stmt = $conn->prepare("
        SELECT
            u.id,
            u.email,
            u.role,
            u.created_at,
            u.updated_at,
            u.profile_image as user_profile_image,
            CONCAT(COALESCE(p.first_name, ''), '.', COALESCE(p.last_name, '')) as username,
            p.first_name,
            p.last_name,
            p.full_name,
            p.phone,
            p.profile_image as profile_profile_image,
            p.business_name,
            p.business_phone,
            p.business_email,
            CASE WHEN u.session_token IS NOT NULL AND u.session_expires > NOW() THEN 'active' ELSE 'inactive' END as status
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        ORDER BY u.created_at DESC
    ");

    if (!$stmt->execute()) {
        sendResponse(['error' => 'Failed to fetch users'], 500);
        return;
    }

    $result = $stmt->get_result();
    $users = [];

    while ($row = $result->fetch_assoc()) {
        // Use user profile image for admin users, profile table image for others
        $profileImage = '';
        if ($row['role'] === 'admin') {
            $profileImage = $row['user_profile_image'] ?: ''; // No default for admins
        } else {
            $profileImage = $row['profile_profile_image'] ?: ''; // No default for others
        }

        $users[] = [
            'id' => $row['id'],
            'email' => $row['email'],
            'role' => $row['role'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'first_name' => $row['first_name'] ?? '',
            'last_name' => $row['last_name'] ?? '',
            'full_name' => $row['full_name'] ?? ($row['first_name'] && $row['last_name'] ? $row['first_name'] . ' ' . $row['last_name'] : $row['email']),
            'phone' => $row['phone'] ?? '',
            'profile_image' => $profileImage,
            'business_name' => $row['business_name'] ?? '',
            'business_phone' => $row['business_phone'] ?? '',
            'business_email' => $row['business_email'] ?? ''
        ];
    }

    header('Content-Type: application/json');
    echo json_encode(['users' => $users]);
    exit;
}

function handleCreateUser()
{
    $user = authenticateWithToken();
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
        return;
    }

    $input = getJsonInput();
    if (!$input) {
        sendResponse(['error' => 'Invalid JSON input'], 400);
        return;
    }
    $missing = validateRequired($input, ['email', 'password']);

    if (!empty($missing)) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        return;
    }

    $email = trim($input['email']);
    $password = $input['password'];
    $role = $input['role'] ?? 'admin';
    $firstName = trim($input['first_name'] ?? '');
    $lastName = trim($input['last_name'] ?? '');
    $phone = trim($input['phone'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email format'], 400);
        return;
    }

    if (strlen($password) < 6) {
        sendResponse(['error' => 'Password must be at least 6 characters'], 400);
        return;
    }

    if ($role !== 'admin') {
        sendResponse(['error' => 'Invalid role. Only admin role is allowed'], 400);
        return;
    }

    $conn = getDBConnection();

    // Check if user already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        sendResponse(['error' => 'User with this email already exists'], 409);
        return;
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert user
        $stmt = $conn->prepare("INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->bind_param("sss", $email, $passwordHash, $role);

        if (!$stmt->execute()) {
            throw new Exception('Failed to create user');
        }

        $userId = $conn->insert_id;

        // Create profile
        $fullName = $firstName && $lastName ? $firstName . ' ' . $lastName : null;
        $stmt2 = $conn->prepare("INSERT INTO profiles (user_id, first_name, last_name, full_name, phone, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt2->bind_param("issss", $userId, $firstName, $lastName, $fullName, $phone);

        if (!$stmt2->execute()) {
            throw new Exception('Failed to create user profile');
        }

        // Log the action
        $logStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, 'User Created', ?, ?)");
        $details = "Created user: $email (Role: $role)";
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $logStmt->bind_param("isss", $user['user_id'], $user['email'], $details, $ipAddress);
        $logStmt->execute();

        $conn->commit();

        sendResponse([
            'message' => 'User created successfully',
            'user' => [
                'id' => $userId,
                'email' => $email,
                'role' => $role,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'full_name' => $fullName,
                'phone' => $phone
            ]
        ], 201);

    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

function handleUpdateUser()
{
    try {
        $user = authenticateWithToken();
        if (!$user) {
            sendResponse(['error' => 'Unauthorized'], 401);
            return;
        }

        $input = getJsonInput();
        if (!$input) {
            sendResponse(['error' => 'Invalid JSON input'], 400);
            return;
        }
        $missing = validateRequired($input, ['id', 'email']);

        if (!empty($missing)) {
            sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
            return;
        }

        $userId = $input['id'];
        $email = trim($input['email']);
        $role = $input['role'] ?? 'admin';
        $firstName = trim($input['first_name'] ?? '');
        $lastName = trim($input['last_name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $password = $input['password'] ?? null;
        $profileImage = $input['profile_image'] ?? null;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendResponse(['error' => 'Invalid email format'], 400);
            return;
        }

        if ($role !== 'admin') {
            sendResponse(['error' => 'Invalid role. Only admin role is allowed'], 400);
            return;
        }

        if ($password && strlen($password) < 6) {
            sendResponse(['error' => 'Password must be at least 6 characters'], 400);
            return;
        }

        $conn = getDBConnection();

        // Check if email is already taken by another user
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->bind_param("si", $email, $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            sendResponse(['error' => 'Email is already taken by another user'], 409);
            return;
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Update user
            if ($password) {
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                if ($role === 'admin' && $profileImage !== null) {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, password_hash = ?, role = ?, profile_image = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("ssssi", $email, $passwordHash, $role, $profileImage, $userId);
                } else {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, password_hash = ?, role = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("sssi", $email, $passwordHash, $role, $userId);
                }
            } else {
                if ($role === 'admin' && $profileImage !== null) {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, role = ?, profile_image = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("sssi", $email, $role, $profileImage, $userId);
                } else {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, role = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("ssi", $email, $role, $userId);
                }
            }

            if (!$stmt->execute()) {
                throw new Exception('Failed to update user');
            }

            // Update profile
            $fullName = $firstName && $lastName ? $firstName . ' ' . $lastName : null;
            $profileTableImage = $role !== 'admin' ? ($input['profile_image'] ?? null) : null; // Only non-admin users can have profile images in profiles table
            $stmt2 = $conn->prepare("UPDATE profiles SET first_name = ?, last_name = ?, full_name = ?, phone = ?, profile_image = ?, updated_at = NOW() WHERE user_id = ?");
            $stmt2->bind_param("sssssi", $firstName, $lastName, $fullName, $phone, $profileTableImage, $userId);

            if (!$stmt2->execute()) {
                throw new Exception('Failed to update user profile');
            }

            // Log the action
            $logStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, 'User Updated', ?, ?)");
            $details = "Updated user: $email (Role: $role)";
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            $logStmt->bind_param("isss", $user['user_id'], $user['email'], $details, $ipAddress);
            $logStmt->execute();

            $conn->commit();

            sendResponse([
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'role' => $role,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'full_name' => $fullName,
                    'phone' => $phone
                ]
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            sendResponse(['error' => $e->getMessage()], 500);
        }
    } catch (Exception $e) {
        error_log("handleUpdateUser Error: " . $e->getMessage());
        sendResponse(['error' => 'Internal server error'], 500);
    }
}

function handleDeleteUser()
{
    $user = authenticateWithToken();
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
        return;
    }

    $userId = $_GET['id'] ?? null;

    if (!$userId) {
        sendResponse(['error' => 'User ID is required'], 400);
        return;
    }

    // Prevent deleting yourself
    if ($userId == $user['user_id']) {
        sendResponse(['error' => 'You cannot delete your own account'], 400);
        return;
    }

    $conn = getDBConnection();

    // Get user email for logging
    $stmt = $conn->prepare("SELECT email FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'User not found'], 404);
        return;
    }

    $userData = $result->fetch_assoc();
    $userEmail = $userData['email'];

    // Start transaction
    $conn->begin_transaction();

    try {
        // Delete user (this will cascade delete profile due to foreign key)
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);

        if (!$stmt->execute()) {
            throw new Exception('Failed to delete user');
        }

        // Log the action
        $logStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, 'User Deleted', ?, ?)");
        $details = "Deleted user: $userEmail";
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $logStmt->bind_param("isss", $user['user_id'], $user['email'], $details, $ipAddress);
        $logStmt->execute();

        $conn->commit();

        sendResponse(['message' => 'User deleted successfully']);

    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

function handleGetUserProfile()
{
    $user = authenticateWithToken();
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
        return;
    }

    $conn = getDBConnection();

    $stmt = $conn->prepare("
        SELECT
            u.id,
            u.email,
            u.role,
            u.created_at,
            u.updated_at,
            p.first_name,
            p.last_name,
            p.full_name,
            p.phone,
            p.bio,
            p.profile_image,
            p.business_name,
            p.business_address,
            p.business_phone,
            p.business_email
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?
    ");

    $stmt->bind_param("i", $user['user_id']);

    if (!$stmt->execute()) {
        sendResponse(['error' => 'Failed to fetch profile'], 500);
        return;
    }

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Profile not found'], 404);
        return;
    }

    $profile = $result->fetch_assoc();

    sendResponse(['profile' => $profile]);
}
?>