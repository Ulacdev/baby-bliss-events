<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'email_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// Check authentication for protected routes
// Allow public access for:
// - GET with status filter (for gallery)
// - POST (for booking form)
// - GET with id and public=1 (for public event details)
$allowPublic = false;

// Debug logging
error_log("bookings.php: method=$method, id=$id, GET params=" . json_encode($_GET));

if ($method === 'GET' && isset($_GET['status'])) {
    $allowPublic = true; // Allow public access to view confirmed events in gallery
    error_log("bookings.php: Allowing public access for status filter");
} elseif ($method === 'POST') {
    $allowPublic = true; // Allow public access to create bookings
    error_log("bookings.php: Allowing public access for POST");
} elseif ($method === 'GET' && isset($_GET['upcoming'])) {
    $allowPublic = true; // Allow public access to upcoming events
    error_log("bookings.php: Allowing public access for upcoming events");
} elseif ($method === 'GET' && isset($_GET['id']) && isset($_GET['public'])) {
    $allowPublic = true; // Allow public access to individual event details
    error_log("bookings.php: Allowing public access for individual event with id=$id and public=" . $_GET['public']);
}

error_log("bookings.php: allowPublic=$allowPublic");

if (!$allowPublic) {
    error_log("bookings.php: Authentication required, calling authenticateWithToken");
    $user = authenticateWithToken();
    if (!$user) {
        error_log("bookings.php: Authentication failed, sending 401");
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    error_log("bookings.php: Authentication successful for user: " . json_encode($user));
} else {
    error_log("bookings.php: Public access allowed, skipping authentication");
}

$PACKAGE_PRICES = [
    'basic' => 15000.00,
    'premium' => 25000.00,
    'deluxe' => 40000.00
];

switch ($method) {
    case 'GET':
        if (isset($_GET['test'])) {
            // Simple test endpoint
            sendResponse(['message' => 'API is working', 'timestamp' => date('Y-m-d H:i:s')]);
        } elseif (isset($_GET['upcoming'])) {
            getUpcomingEvents();
        } elseif ($id) {
            getBooking($id);
        } else {
            getBookings();
        }
        break;
    case 'POST':
        createBooking();
        break;
    case 'PUT':
        if ($id) {
            updateBooking($id);
        } else {
            sendResponse(['error' => 'Booking ID required'], 400);
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteBooking($id);
        } else {
            sendResponse(['error' => 'Booking ID required'], 400);
        }
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getPackagePrice($package)
{
    global $PACKAGE_PRICES;
    return $PACKAGE_PRICES[strtolower($package)] ?? 0.00;
}

function sendBookingEmail($email, $subject, $message)
{
    error_log("Attempting to send email to: $email with subject: $subject");
    error_log("Using Gmail credentials - Username: " . GMAIL_USERNAME . ", App Password length: " . strlen(GMAIL_APP_PASSWORD));

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
        " . nl2br($message) . "
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
        $mail->addAddress($email);

        //Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlMessage;

        $result = $mail->send();
        error_log("Email send result: " . ($result ? 'SUCCESS' : 'FAILED'));
        return $result;
    } catch (Exception $e) {
        error_log("Booking email failed with exception: " . $e->getMessage());
        error_log("PHPMailer ErrorInfo: " . $mail->ErrorInfo);
        return false;
    }
}

function sendBookingStatusEmail($booking, $status)
{
    error_log("sendBookingStatusEmail called with status: $status for booking ID: " . ($booking['id'] ?? 'unknown'));

    $email = $booking['email'];
    $name = $booking['first_name'] . ' ' . $booking['last_name'];
    $eventDate = date('F j, Y', strtotime($booking['event_date']));
    $package = $booking['package'] ?: 'Custom Package';

    error_log("Sending booking status email to: $email for status: $status");
    error_log("Booking data: " . json_encode($booking));

    switch ($status) {
        case 'pending':
            $subject = "Thank You for Your Booking - Baby Bliss";
            $message = "Dear $name,

Thank you for booking with Baby Bliss! We have received your booking request and are excited to help make your special event memorable.

Booking Details:
- Event Date: $eventDate
- Package: $package
- Venue: " . ($booking['venue'] ?: 'To be confirmed') . "

Your booking is currently PENDING approval. We will review your request and confirm within 24-48 hours. You will receive another email once your booking is confirmed.

If you have any questions, please don't hesitate to contact us.

Best regards,
Baby Bliss Events Team
Email: " . FROM_EMAIL . "
Phone: (555) 123-4567";
            break;

        case 'confirmed':
            $statusText = strtoupper($status);
            $subject = "Your Booking is $statusText! - Baby Bliss";
            $message = "Dear $name,

Great news! Your booking has been $statusText. We're thrilled to be part of your special celebration.

Confirmed Booking Details:
- Event Date: $eventDate
- Package: $package
- Venue: " . ($booking['venue'] ?: 'To be confirmed') . "
- Status: $statusText

Next Steps:
1. Payment arrangements will be discussed separately
2. We'll be in touch regarding any additional details or preparations
3. Feel free to contact us with any questions

We can't wait to create magical memories for your baby shower!

Best regards,
Baby Bliss Events Team
Email: " . FROM_EMAIL . "
Phone: (555) 123-4567";
            break;

        case 'completed':
            // No email sent for completed status
            return;
            break;

        case 'cancelled':
            $subject = "Booking Update - Baby Bliss";
            $message = "Dear $name,

We regret to inform you that your booking has been CANCELLED.

Booking Details:
- Event Date: $eventDate
- Package: $package

If this cancellation was unexpected or if you have any questions, please contact us immediately so we can assist you.

We apologize for any inconvenience this may have caused and hope to work with you on future events.

Best regards,
Baby Bliss Events Team
Email: " . FROM_EMAIL . "
Phone: (555) 123-4567";
            break;

        default:
            return; // Don't send email for unknown status
    }

    return sendBookingEmail($email, $subject, $message);
}

function getBookings()
{
    global $user; // Access the authenticated user
    $conn = getDBConnection();
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $limit = (int) ($_GET['limit'] ?? 50);
    $offset = (int) ($_GET['offset'] ?? 0);
    $where = [];
    $params = [];
    $types = '';


    if ($search) {
        $where[] = "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR venue LIKE ?)";
        $searchParam = "%$search%";
        $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam]);
        $types .= 'ssss';
    }

    if ($status) {
        $where[] = "status = ?";
        $params[] = $status;
        $types .= 's';
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    $countQuery = "SELECT COUNT(*) as total FROM bookings $whereClause";
    $stmt = $conn->prepare($countQuery);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $total = $stmt->get_result()->fetch_assoc()['total'];

    $query = "SELECT * FROM bookings $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($query);
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }

    sendResponse(['bookings' => $bookings, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

function getBooking($id)
{
    error_log("getBooking called with id=$id");
    $conn = getDBConnection();

    // Check if this is a public request
    $isPublic = isset($_GET['public']);
    error_log("getBooking: isPublic=$isPublic");

    if ($isPublic) {
        // For public requests, only return confirmed events with limited data
        $query = "SELECT id, first_name, last_name, event_date, venue, guests, package, special_requests, images, status FROM bookings WHERE id = ? AND status = 'confirmed'";
        error_log("getBooking: Using public query: $query");
    } else {
        // For admin requests, return all data
        $query = "SELECT * FROM bookings WHERE id = ?";
        error_log("getBooking: Using admin query: $query");
    }

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        error_log("getBooking: SQL execution failed: " . $stmt->error);
        sendResponse(['error' => 'Database query failed: ' . $stmt->error], 500);
    }

    $result = $stmt->get_result();
    error_log("getBooking: Query returned " . $result->num_rows . " rows");

    if ($result->num_rows === 0) {
        error_log("getBooking: No rows found for id=$id");

        // For public requests, return error if no event found
        sendResponse(['error' => 'Event not found'], 404);
        return;
    }

    $booking = $result->fetch_assoc();
    error_log("getBooking: Retrieved booking: " . json_encode($booking));

    // For public requests, only return if the event is confirmed
    if ($isPublic && $booking['status'] !== 'confirmed') {
        error_log("getBooking: Event is not confirmed, status=" . $booking['status']);
        sendResponse(['error' => 'Event not found'], 404);
        return;
    }

    sendResponse(['booking' => $booking]);
}

function createBooking()
{
    $input = getJsonInput();
    $missing = validateRequired($input, ['first_name', 'last_name', 'email', 'event_date']);

    if (!empty($missing)) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }

    $package = $input['package'] ?? null;
    $package_price = $package ? getPackagePrice($package) : 0.00;

    $conn = getDBConnection();
    $stmt = $conn->prepare("INSERT INTO bookings (client_id, first_name, last_name, email, phone, event_date, guests, venue, package, package_price, special_requests, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $client_id = $input['client_id'] ?? null;
    $phone = $input['phone'] ?? null;
    $guests = $input['guests'] ?? null;
    $venue = $input['venue'] ?? null;
    $special_requests = $input['special_requests'] ?? null;
    $images = isset($input['images']) ? $input['images'] : null;
    $status = $input['status'] ?? 'pending';

    $stmt->bind_param("issssssissdss", $client_id, $input['first_name'], $input['last_name'], $input['email'], $phone, $input['event_date'], $guests, $venue, $package, $package_price, $special_requests, $images, $status);

    if ($stmt->execute()) {
        $bookingId = $conn->insert_id;

        // Get the created booking data for email
        $bookingData = [
            'id' => $bookingId,
            'first_name' => $input['first_name'],
            'last_name' => $input['last_name'],
            'email' => $input['email'],
            'event_date' => $input['event_date'],
            'venue' => $input['venue'] ?? null,
            'package' => $package
        ];

        if ($package_price > 0) {
            $paymentStmt = $conn->prepare("INSERT INTO payments (booking_id, amount, payment_status, payment_method) VALUES (?, ?, 'pending', 'cash')");
            $paymentStmt->bind_param("id", $bookingId, $package_price);
            $paymentStmt->execute();
        }

        // Send initial booking confirmation email
        sendBookingStatusEmail($bookingData, $status);

        logAudit('Create', "Created booking ID $bookingId for {$input['first_name']} {$input['last_name']}");
        sendResponse(['booking' => ['id' => $bookingId], 'message' => 'Booking created successfully'], 201);
    } else {
        sendResponse(['error' => 'Failed to create booking: ' . $stmt->error], 500);
    }
}

function updateBooking($id)
{
    $input = getJsonInput();
    error_log("Update booking input: " . json_encode($input));
    $conn = getDBConnection();
    $stmt = $conn->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Booking not found'], 404);
    }

    $currentBooking = $result->fetch_assoc();
    error_log("Current booking status: " . $currentBooking['status']);

    $updates = [];
    $params = [];
    $types = '';
    $fieldTypes = ['client_id' => 'i', 'first_name' => 's', 'last_name' => 's', 'email' => 's', 'phone' => 's', 'event_date' => 's', 'guests' => 'i', 'venue' => 's', 'package' => 's', 'special_requests' => 's', 'images' => 's', 'status' => 's'];

    foreach (array_keys($fieldTypes) as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
            $types .= $fieldTypes[$field];
        }
    }

    if (isset($input['package']) && $input['package'] !== $currentBooking['package']) {
        $package_price = getPackagePrice($input['package']);
        $updates[] = "package_price = ?";
        $params[] = $package_price;
        $types .= 'd';

        $paymentStmt = $conn->prepare("UPDATE payments SET amount = ? WHERE booking_id = ?");
        $paymentStmt->bind_param("di", $package_price, $id);
        $paymentStmt->execute();
    }

    if (empty($updates)) {
        sendResponse(['error' => 'No fields to update'], 400);
    }

    $params[] = $id;
    $types .= 'i';

    $stmt = $conn->prepare("UPDATE bookings SET " . implode(', ', $updates) . " WHERE id = ?");
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        $debug = [];
        $debug[] = "Status change check: isset=" . (isset($input['status']) ? 'true' : 'false');
        $debug[] = "Input status: " . ($input['status'] ?? 'null');
        $debug[] = "Current status: {$currentBooking['status']}";

        // Send status update email if status was provided
        if (isset($input['status'])) {
            $debug[] = "Status update: {$currentBooking['status']} -> {$input['status']}";
            $updatedBooking = $currentBooking;
            $updatedBooking['status'] = $input['status'];
            $emailResult = sendBookingStatusEmail($updatedBooking, $input['status']);
            $debug[] = "Email send result: " . ($emailResult ? 'SUCCESS' : 'FAILED');
        } else {
            $debug[] = "No status provided in update";
        }

        logAudit('Update', "Updated booking ID $id");
        sendResponse([
            'message' => 'Booking updated successfully',
            'debug' => $debug
        ]);
    } else {
        sendResponse(['error' => 'Failed to update booking: ' . $stmt->error], 500);
    }
}

function deleteBooking($id)
{
    $conn = getDBConnection();

    // Get booking data before deleting
    $stmt = $conn->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Booking not found'], 404);
    }

    $booking = $result->fetch_assoc();
    global $user;
    $deleted_by = $user['user_id'] ?? 1;
    $deleted_reason = 'Deleted from bookings module';

    // Archive the booking
    $phone = $booking['phone'] ?? '';
    $guests = $booking['guests'] ?? 0;
    $venue = $booking['venue'] ?? '';
    $package = $booking['package'] ?? '';
    $special_requests = $booking['special_requests'] ?? '';
    $images = $booking['images'] ?? '';

    $archiveStmt = $conn->prepare("INSERT INTO archived_bookings (original_id, first_name, last_name, email, phone, event_date, guests, venue, package, special_requests, images, status, deleted_reason, deleted_by, original_created_at, original_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $archiveStmt->bind_param(
        "isssssssssssssss",
        $booking['id'],
        $booking['first_name'],
        $booking['last_name'],
        $booking['email'],
        $phone,
        $booking['event_date'],
        $guests,
        $venue,
        $package,
        $special_requests,
        $images,
        $booking['status'],
        $deleted_reason,
        $deleted_by,
        $booking['created_at'],
        $booking['updated_at']
    );

    if ($archiveStmt->execute()) {
        // Delete from bookings table
        $deleteStmt = $conn->prepare("DELETE FROM bookings WHERE id = ?");
        $deleteStmt->bind_param("i", $id);
        $deleteStmt->execute();

        logAudit('Delete', "Deleted booking ID $id and moved to archive");
        sendResponse(['message' => 'Booking deleted successfully']);
    } else {
        sendResponse(['error' => 'Failed to archive booking: ' . $archiveStmt->error], 500);
    }
}

function getUpcomingEvents()
{
    $conn = getDBConnection();
    $limit = (int) ($_GET['limit'] ?? 9);
    $offset = (int) ($_GET['offset'] ?? 0);

    // Get total count for pagination
    $countStmt = $conn->prepare("SELECT COUNT(*) as total FROM bookings WHERE status = 'confirmed' AND event_date >= CURDATE()");
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];

    // Get paginated events
    $stmt = $conn->prepare("SELECT id, first_name, last_name, event_date, venue, images FROM bookings WHERE status = 'confirmed' AND event_date >= CURDATE() ORDER BY event_date ASC LIMIT ? OFFSET ?");
    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $images = [];

        // Try to parse as JSON first
        $jsonImages = json_decode($row['images'], true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($jsonImages)) {
            $images = $jsonImages;
        } elseif (!empty($row['images'])) {
            // Fallback to comma-separated format
            $images = array_map('trim', explode(',', $row['images']));
            $images = array_filter($images);
        }

        $imageUrl = 'https://images.unsplash.com/photo-1530047625168-4b29bfbbe1fc?w=400';

        if (!empty($images)) {
            $firstImage = $images[0];
            if (strpos($firstImage, 'http://') === 0 || strpos($firstImage, 'https://') === 0) {
                $imageUrl = $firstImage;
            } else {
                $imageUrl = '/uploads/' . $firstImage;
            }
        }

        $events[] = ['id' => $row['id'], 'title' => $row['first_name'] . ' ' . $row['last_name'] . ' Baby Shower', 'date' => date('F j, Y', strtotime($row['event_date'])), 'venue' => $row['venue'] ?: 'TBD', 'image' => $imageUrl];
    }

    sendResponse(['events' => $events, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}
?>