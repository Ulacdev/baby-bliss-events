<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'baby_bliss');

// Include email configuration
require_once 'email_config.php';
require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendEmail($to, $subject, $message)
{
    error_log("Attempting to send email to: $to with subject: $subject");

    $logoUrl = 'http://localhost/public/Baby_Bliss_White_Text_Character-removebg-preview.png';
    $htmlMessage = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .logo { max-width: 200px; height: auto; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <img src='$logoUrl' alt='Baby Bliss Booking Logo' class='logo'><br><br>
        $message
        <div class='footer'>
            Best regards,<br>
            Baby Bliss Booking Team<br>
            Email: " . FROM_EMAIL . "<br>
            Phone: (555) 123-4567
        </div>
    </body>
    </html>";

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
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlMessage;

        $result = $mail->send();
        error_log("Email send result: " . ($result ? 'SUCCESS' : 'FAILED'));
        return $result;
    } catch (Exception $e) {
        error_log("Email failed with exception: " . $e->getMessage());
        error_log("PHPMailer ErrorInfo: " . $mail->ErrorInfo);
        return false;
    }
}

function getDB()
{
    try {
        $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            return null;
        }
        return $conn;
    } catch (Exception $e) {
        return null;
    }
}

function respond($data, $code = 200)
{
    ob_clean();
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'list' && $method === 'GET') {
    $conn = getDB();
    if (!$conn) {
        respond(['messages' => []]);
    }

    @$conn->query("CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        rating INT,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $result = @$conn->query("SELECT * FROM messages ORDER BY created_at DESC");
    $messages = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $messages[] = $row;
        }
    }
    respond(['messages' => $messages]);
}

if ($action === 'create' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['name']) || !isset($input['email']) || !isset($input['message'])) {
        respond(['error' => 'Missing required fields'], 400);
    }

    $conn = getDB();
    if (!$conn) {
        respond(['error' => 'Database connection failed'], 500);
    }

    @$conn->query("CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        rating INT,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    @$conn->query("CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        user_name VARCHAR(255) DEFAULT 'Admin',
        activity VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $stmt = @$conn->prepare("INSERT INTO messages (name, email, phone, subject, message, rating) VALUES (?, ?, ?, ?, ?, ?)");
    if ($stmt) {
        $phone = $input['phone'] ?? null;
        $subject = $input['subject'] ?? null;
        $rating = $input['rating'] ?? null;
        $stmt->bind_param("sssssi", $input['name'], $input['email'], $phone, $subject, $input['message'], $rating);
        $stmt->execute();
        $id = $conn->insert_id;

        // Send email to admin
        $adminSubject = "New Message from {$input['name']}";
        $adminMessage = "Name: {$input['name']}\nEmail: {$input['email']}\nPhone: " . ($phone ?: 'N/A') . "\nSubject: " . ($subject ?: 'N/A') . "\nMessage: {$input['message']}\nRating: " . ($rating ?: 'N/A');
        sendEmail(GMAIL_USERNAME, $adminSubject, $adminMessage);

        // Send auto reply to client
        $clientSubject = "Thank you for contacting Baby Bliss Booking";
        if ($rating) {
            $clientMessage = "Dear {$input['name']},\n\nThank you for your feedback and for contacting us. We appreciate your input.\n\nBest regards,\nBaby Bliss Booking Team";
        } else {
            $clientMessage = "Dear {$input['name']},\n\nThank you for contacting us. We will get back to you soon regarding your message.\n\nBest regards,\nBaby Bliss Booking Team";
        }
        sendEmail($input['email'], $clientSubject, $clientMessage);

        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $details = "New message from {$input['name']} (ID: $id)";
        $stmt = @$conn->prepare("INSERT INTO audit_logs (activity, details, ip_address) VALUES (?, ?, ?)");
        if ($stmt) {
            $activity = 'Message Created';
            $stmt->bind_param("sss", $activity, $details, $ip);
            $stmt->execute();
        }

        respond(['message' => ['id' => $id]], 201);
    }
    respond(['error' => 'Failed to save'], 500);
}

if ($action === 'update' && $method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$id || !$input) {
        respond(['error' => 'Invalid request'], 400);
    }

    $conn = getDB();
    if (!$conn) {
        respond(['error' => 'Database connection failed'], 500);
    }

    @$conn->query("CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        user_name VARCHAR(255) DEFAULT 'Admin',
        activity VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    if (isset($input['status'])) {
        $stmt = @$conn->prepare("UPDATE messages SET status = ? WHERE id = ?");
        if ($stmt) {
            $stmt->bind_param("si", $input['status'], $id);
            $stmt->execute();

            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            $details = "Updated message status to {$input['status']} (ID: $id)";
            $stmt = @$conn->prepare("INSERT INTO audit_logs (activity, details, ip_address) VALUES (?, ?, ?)");
            if ($stmt) {
                $activity = 'Message Updated';
                $stmt->bind_param("sss", $activity, $details, $ip);
                $stmt->execute();
            }

            respond(['message' => 'Updated']);
        }
    }
    respond(['error' => 'Failed to update'], 500);
}

if ($action === 'delete' && $method === 'POST') {
    $id = $_GET['id'] ?? null;
    $input = json_decode(file_get_contents('php://input'), true);
    $reason = isset($input['deleted_reason']) ? $input['deleted_reason'] : 'Deleted by admin';

    if (!$id) {
        respond(['error' => 'Invalid request'], 400);
    }

    $conn = getDB();
    if (!$conn) {
        respond(['error' => 'Database connection failed'], 500);
    }

    @$conn->query("CREATE TABLE IF NOT EXISTS archived_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT,
        rating INT,
        status VARCHAR(50),
        deleted_reason TEXT,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        original_created_at TIMESTAMP
    )");

    @$conn->query("CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        user_name VARCHAR(255) DEFAULT 'Admin',
        activity VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $result = @$conn->query("SELECT * FROM messages WHERE id = $id");
    if ($result && $result->num_rows > 0) {
        $msg = $result->fetch_assoc();

        $stmt = @$conn->prepare("INSERT INTO archived_messages (original_id, name, email, phone, subject, message, rating, status, deleted_reason, original_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt) {
            $stmt->bind_param("isssssssss", $msg['id'], $msg['name'], $msg['email'], $msg['phone'], $msg['subject'], $msg['message'], $msg['rating'], $msg['status'], $reason, $msg['created_at']);
            $stmt->execute();
        }

        @$conn->query("DELETE FROM messages WHERE id = $id");

        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $details = "Deleted message from {$msg['name']} (ID: $id)";
        $stmt = @$conn->prepare("INSERT INTO audit_logs (activity, details, ip_address) VALUES (?, ?, ?)");
        if ($stmt) {
            $activity = 'Message Deleted';
            $stmt->bind_param("sss", $activity, $details, $ip);
            $stmt->execute();
        }

        respond(['message' => 'Message archived successfully']);
    } else {
        respond(['error' => 'Message not found'], 404);
    }
}

if ($action === 'delete_all' && $method === 'POST') {
    $conn = getDB();
    if (!$conn) {
        respond(['error' => 'Database connection failed'], 500);
    }

    @$conn->query("CREATE TABLE IF NOT EXISTS archived_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT,
        rating INT,
        status VARCHAR(50),
        deleted_reason TEXT,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        original_created_at TIMESTAMP
    )");

    @$conn->query("CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        user_name VARCHAR(255) DEFAULT 'Admin',
        activity VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $result = @$conn->query("SELECT * FROM messages");
    $deletedCount = 0;
    if ($result) {
        while ($msg = $result->fetch_assoc()) {
            $stmt = @$conn->prepare("INSERT INTO archived_messages (original_id, name, email, phone, subject, message, rating, status, deleted_reason, original_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            if ($stmt) {
                $reason = 'Bulk delete all messages';
                $stmt->bind_param("isssssssss", $msg['id'], $msg['name'], $msg['email'], $msg['phone'], $msg['subject'], $msg['message'], $msg['rating'], $msg['status'], $reason, $msg['created_at']);
                $stmt->execute();
                $deletedCount++;
            }
        }
    }

    @$conn->query("DELETE FROM messages");

    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $details = "Deleted all $deletedCount messages";
    $stmt = @$conn->prepare("INSERT INTO audit_logs (activity, details, ip_address) VALUES (?, ?, ?)");
    if ($stmt) {
        $activity = 'Bulk Delete Messages';
        $stmt->bind_param("sss", $activity, $details, $ip);
        $stmt->execute();
    }

    respond(['message' => "All $deletedCount messages deleted successfully"]);
}

if ($action === 'delete_all_archived' && $method === 'POST') {
    $conn = getDB();
    if (!$conn) {
        respond(['error' => 'Database connection failed'], 500);
    }

    @$conn->query("CREATE TABLE IF NOT EXISTS permanently_deleted_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT,
        rating INT,
        status VARCHAR(50),
        deleted_reason TEXT,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        original_created_at TIMESTAMP
    )");

    @$conn->query("CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        user_name VARCHAR(255) DEFAULT 'Admin',
        activity VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $result = @$conn->query("SELECT * FROM archived_messages");
    $deletedCount = 0;
    if ($result) {
        while ($msg = $result->fetch_assoc()) {
            $stmt = @$conn->prepare("INSERT INTO permanently_deleted_messages (original_id, name, email, phone, subject, message, rating, status, deleted_reason, original_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            if ($stmt) {
                $reason = 'Bulk permanent delete archived messages';
                $stmt->bind_param("isssssssss", $msg['original_id'], $msg['name'], $msg['email'], $msg['phone'], $msg['subject'], $msg['message'], $msg['rating'], $msg['status'], $reason, $msg['original_created_at']);
                $stmt->execute();
                $deletedCount++;
            }
        }
    }

    @$conn->query("DELETE FROM archived_messages");

    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $details = "Permanently deleted all $deletedCount archived messages";
    $stmt = @$conn->prepare("INSERT INTO audit_logs (activity, details, ip_address) VALUES (?, ?, ?)");
    if ($stmt) {
        $activity = 'Bulk Permanent Delete Archived Messages';
        $stmt->bind_param("sss", $activity, $details, $ip);
        $stmt->execute();
    }

    respond(['message' => "All $deletedCount archived messages permanently deleted successfully"]);
}

respond(['error' => 'Invalid action'], 400);
?>