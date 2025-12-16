<?php
require_once 'config.php';
require_once 'email_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

// Test email function
function testSendEmail($to, $subject, $message)
{
    error_log("Testing email to: $to");

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
        $mail->addAddress($to);

        //Content
        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body = $message;

        $result = $mail->send();
        error_log("Test email result: " . ($result ? 'SUCCESS' : 'FAILED'));
        return $result;
    } catch (Exception $e) {
        error_log("Test email failed with exception: " . $e->getMessage());
        error_log("PHPMailer ErrorInfo: " . $mail->ErrorInfo);
        return false;
    }
}

// Test the email configuration
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $testEmail = $_GET['email'] ?? 'test@example.com';
    $result = testSendEmail($testEmail, 'Test Email from Baby Bliss', 'This is a test email to verify SMTP configuration.');
    sendResponse(['success' => $result, 'message' => $result ? 'Test email sent successfully' : 'Failed to send test email']);
}
?>