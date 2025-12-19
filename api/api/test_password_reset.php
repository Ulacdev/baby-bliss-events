<?php
require_once 'config.php';
require_once 'email_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

/**
 * Test Password Reset Email Configuration
 * Access via: http://localhost/api/test_password_reset.php
 */

header('Content-Type: application/json');

$results = [];

try {
    // Test 1: Check database connection
    $conn = getDBConnection();
    $results['database'] = [
        'status' => 'OK',
        'message' => 'Database connection successful',
    ];

    // Test 2: Check email configuration
    $results['email_config'] = [
        'status' => GMAIL_USERNAME && GMAIL_APP_PASSWORD ? 'CONFIGURED' : 'NOT_CONFIGURED',
        'gmail_username' => GMAIL_USERNAME,
        'from_email' => FROM_EMAIL,
        'from_name' => FROM_NAME,
    ];

    // Test 3: Check if password_reset_tokens table exists
    $result = $conn->query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens'");
    $results['password_reset_tokens_table'] = [
        'exists' => $result->num_rows > 0,
    ];

    // Test 4: Try sending a test email
    $testEmail = 'test@example.com';
    $token = bin2hex(random_bytes(16));
    $resetLink = "http://localhost:8080/reset-password?token=" . $token;

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = GMAIL_USERNAME;
        $mail->Password = GMAIL_APP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->Timeout = 10;
        $mail->SMTPDebug = 0; // Disable debug in production

        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress($testEmail);
        $mail->isHTML(false);
        $mail->Subject = "Password Reset Test - Baby Bliss";
        $mail->Body = "Test reset link: " . $resetLink;

        $mail->send();

        $results['email_test'] = [
            'status' => 'SUCCESS',
            'message' => 'Test email sent successfully',
            'recipient' => $testEmail,
        ];
    } catch (Exception $e) {
        $results['email_test'] = [
            'status' => 'FAILED',
            'error' => $e->getMessage(),
        ];
    }

} catch (Exception $e) {
    $results['error'] = $e->getMessage();
}

http_response_code(200);
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>