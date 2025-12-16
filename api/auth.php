<?php
require_once 'config.php';
require_once 'email_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';


$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            handleLogin();
        } elseif ($action === 'logout') {
            handleLogout();
        } elseif ($action === 'session') {
            handleGetSession();
        } elseif ($action === 'forgot_password') {
            handleForgotPassword();
        } elseif ($action === 'reset_password') {
            handleResetPassword();
        }
        break;
    case 'GET':
        if ($action === 'session') {
            handleGetSession();
        }
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleLogin()
{
    $input = getJsonInput();
    $missing = validateRequired($input, ['email', 'password']);

    if (!empty($missing)) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }

    $email = trim($input['email']);
    $password = $input['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email format'], 400);
    }

    $conn = getDBConnection();

    // Get user from database
    $stmt = $conn->prepare("SELECT id, email, password_hash, created_at FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Invalid email or password'], 401);
    }

    $user = $result->fetch_assoc();

    if (!password_verify($password, $user['password_hash'])) {
        sendResponse(['error' => 'Invalid email or password'], 401);
    }

    // Generate a token and store in users table
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours')); // Token expires in 24 hours

    $stmt2 = $conn->prepare("UPDATE users SET session_token = ?, session_expires = ? WHERE id = ?");
    $stmt2->bind_param("ssi", $token, $expiresAt, $user['id']);
    if (!$stmt2->execute()) {
        sendResponse(['error' => 'Failed to create session: ' . $stmt2->error], 500);
    }
    $stmt2->close();

    // Log login
    $logStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, 'Login', 'User logged in', ?)");
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $logStmt->bind_param("iss", $user['id'], $user['email'], $ipAddress);
    $logStmt->execute();

    sendResponse([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email']
        ],
        'session' => [
            'access_token' => $token,
            'token_type' => 'bearer'
        ]
    ]);
}


function handleLogout()
{
    $user = authenticateWithToken();
    if ($user) {
        $conn = getDBConnection();
        // Log the logout
        $logStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, 'Logout', 'User logged out', ?)");
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $logStmt->bind_param("iss", $user['user_id'], $user['email'], $ipAddress);
        $logStmt->execute();

        // Remove the token from users table
        $tokenStmt = $conn->prepare("UPDATE users SET session_token = NULL, session_expires = NULL WHERE id = ?");
        $tokenStmt->bind_param("i", $user['user_id']);
        $tokenStmt->execute();
        $tokenStmt->close();
        $conn->close();
    }

    sendResponse(['message' => 'Logged out successfully']);
}

function handleGetSession()
{
    $user = authenticateWithToken();

    if (!$user) {
        sendResponse(['session' => null]);
    }

    // Get the token from the Authorization header to return it
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
    }

    sendResponse([
        'user' => [
            'id' => $user['user_id'],
            'email' => $user['email']
        ],
        'session' => [
            'access_token' => $token,
            'token_type' => 'bearer'
        ]
    ]);
}

function handleForgotPassword()
{
    $input = getJsonInput();
    $missing = validateRequired($input, ['email']);

    if (!empty($missing)) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }

    $email = trim($input['email']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email format'], 400);
    }

    $conn = getDBConnection();

    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // Don't reveal if email exists or not for security
        sendResponse(['message' => 'If the email exists, a password reset link has been sent.'], 200);
    }

    $user = $result->fetch_assoc();

    // Generate token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token expires in 1 hour

    // Insert token
    $stmt2 = $conn->prepare("INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)");
    $stmt2->bind_param("isss", $user['id'], $email, $token, $expiresAt);

    if (!$stmt2->execute()) {
        sendResponse(['error' => 'Failed to create reset token'], 500);
    }

    // Send email
    $resetLink = "http://localhost:8080/reset-password?token=" . $token; // Adjust URL as needed
    $subject = "Password Reset Request - Baby Bliss";
    $message = "Hello,\n\nYou have requested to reset your password. Click the link below to reset your password:\n\n" . $resetLink . "\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nBaby Bliss Team";

    $mail = new PHPMailer(true);
    try {
        //Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = GMAIL_USERNAME;
        $mail->Password = GMAIL_APP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        //Recipients
        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress($email);

        //Content
        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body = $message;

        $mail->send();
    } catch (Exception $e) {
        // Log error but don't fail the request
        error_log("Email send failed: " . $mail->ErrorInfo);
    }

    sendResponse(['message' => 'If the email exists, a password reset link has been sent.'], 200);
}

function handleResetPassword()
{
    $input = getJsonInput();
    $missing = validateRequired($input, ['token', 'password']);

    if (!empty($missing)) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }

    $token = $input['token'];
    $password = $input['password'];

    if (strlen($password) < 6) {
        sendResponse(['error' => 'Password must be at least 6 characters'], 400);
    }

    $conn = getDBConnection();

    // Get token
    $stmt = $conn->prepare("SELECT user_id, email, expires_at, used FROM password_reset_tokens WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Invalid or expired token'], 400);
    }

    $resetToken = $result->fetch_assoc();

    if ($resetToken['used']) {
        sendResponse(['error' => 'Token has already been used'], 400);
    }

    if (strtotime($resetToken['expires_at']) < time()) {
        sendResponse(['error' => 'Token has expired'], 400);
    }

    // Hash new password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Update user password
    $stmt2 = $conn->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
    $stmt2->bind_param("si", $passwordHash, $resetToken['user_id']);

    if (!$stmt2->execute()) {
        sendResponse(['error' => 'Failed to update password'], 500);
    }

    // Mark token as used
    $stmt3 = $conn->prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?");
    $stmt3->bind_param("s", $token);
    $stmt3->execute();

    // Log the action
    $logStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, 'Password Reset', 'Password reset via token', ?)");
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $logStmt->bind_param("iss", $resetToken['user_id'], $resetToken['email'], $ipAddress);
    $logStmt->execute();

    sendResponse(['message' => 'Password has been reset successfully'], 200);
}
?>