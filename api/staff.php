<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Remove query string and get path segments
$path = parse_url($path, PHP_URL_PATH);
$pathSegments = explode('/', trim($path, '/'));
$endpoint = $pathSegments[count($pathSegments) - 1] ?? '';

// Check authentication for all staff operations
$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

// Verify user has staff role
if ($user['role'] !== 'staff') {
    sendResponse(['error' => 'Access denied. Staff role required.'], 403);
}

$user_id = $user['user_id'];

switch ($method) {
    case 'GET':
        switch ($endpoint) {
            case 'me':
                getStaffProfile($user_id);
                break;
            case 'dashboard':
                getStaffDashboard($user_id);
                break;
            case 'calendar':
                getStaffCalendar($user_id);
                break;
            case 'bookings':
                getStaffBookings($user_id);
                break;
            case 'availability':
                getStaffAvailability($user_id);
                break;
            case 'messages':
                getStaffMessages($user_id);
                break;
            default:
                sendResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
    case 'POST':
        switch ($endpoint) {
            case 'availability':
                setStaffAvailability($user_id);
                break;
            case 'messages':
                sendStaffMessage($user_id);
                break;
            default:
                sendResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
    case 'PUT':
        if ($endpoint === 'profile') {
            updateStaffProfile($user_id);
        } else {
            sendResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
    case 'PATCH':
        if ($endpoint === 'bookings') {
            updateStaffBooking($user_id);
        } else {
            sendResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getStaffProfile($user_id)
{
    $conn = getDBConnection();

    // Get user data
    $userStmt = $conn->prepare("SELECT email, role FROM users WHERE id = ?");
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();

    if ($userResult->num_rows === 0) {
        sendResponse(['error' => 'Staff member not found'], 404);
    }

    $userData = $userResult->fetch_assoc();

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
    $profileStmt = $conn->prepare("SELECT first_name, last_name, full_name, phone, bio, profile_image, created_at, updated_at FROM profiles WHERE user_id = ?");
    $profileStmt->bind_param("i", $user_id);
    $profileStmt->execute();
    $profileResult = $profileStmt->get_result();

    $profile = [];
    if ($profileResult->num_rows > 0) {
        $profile = $profileResult->fetch_assoc();
    }

    // Combine user and profile data
    $profileData = array_merge([
        'id' => $user_id,
        'email' => $userData['email'],
        'role' => $userData['role']
    ], $profile);

    sendResponse(['staff' => $profileData]);
}

function getStaffDashboard($user_id)
{
    $conn = getDBConnection();

    // Get today's bookings for this staff member
    $todayStmt = $conn->prepare("
        SELECT b.*, c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone
        FROM bookings b
        LEFT JOIN profiles c ON b.client_id = c.user_id
        WHERE b.assigned_staff_id = ? AND DATE(b.booking_date) = CURDATE()
        ORDER BY b.booking_date ASC, b.start_time ASC
    ");
    $todayStmt->bind_param("i", $user_id);
    $todayStmt->execute();
    $todayResult = $todayStmt->get_result();
    $today_bookings = $todayResult->fetch_all(MYSQLI_ASSOC);

    // Get upcoming bookings count (next 30 days)
    $upcomingStmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM bookings
        WHERE assigned_staff_id = ? AND booking_date > CURDATE() AND booking_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND status IN ('confirmed', 'pending')
    ");
    $upcomingStmt->bind_param("i", $user_id);
    $upcomingStmt->execute();
    $upcomingResult = $upcomingStmt->get_result();
    $upcoming_count = $upcomingResult->fetch_assoc()['count'];

    // Get unread messages count
    $messagesStmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM messages
        WHERE recipient_id = ? AND status = 'unread'
    ");
    $messagesStmt->bind_param("i", $user_id);
    $messagesStmt->execute();
    $messagesResult = $messagesStmt->get_result();
    $unread_messages = $messagesResult->fetch_assoc()['count'];

    // Calculate monthly revenue for this staff member using payment date (payments table)
    $currentMonth = date('Y-m');
    $revenueQuery = "SELECT SUM(p.amount) as total_revenue FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.payment_status = 'paid' AND DATE_FORMAT(p.payment_date, '%Y-%m') = '$currentMonth' AND b.assigned_staff_id = ?";
    $revenueStmt = $conn->prepare($revenueQuery);
    $revenueStmt->bind_param("i", $user_id);
    $revenueStmt->execute();
    $revenueResult = $revenueStmt->get_result();
    $monthly_revenue = (int) $revenueResult->fetch_assoc()['total_revenue'];

    sendResponse([
        'today_bookings' => $today_bookings,
        'upcoming_count' => (int) $upcoming_count,
        'unread_messages' => (int) $unread_messages,
        'monthly_revenue' => $monthly_revenue
    ]);
}

function getStaffCalendar($user_id)
{
    $conn = getDBConnection();

    $month = (int) ($_GET['month'] ?? date('n'));
    $year = (int) ($_GET['year'] ?? date('Y'));

    // Validate month and year
    if ($month < 1 || $month > 12) {
        sendResponse(['error' => 'Invalid month'], 400);
    }
    if ($year < 2020 || $year > 2030) {
        sendResponse(['error' => 'Invalid year'], 400);
    }

    // Get all bookings for this staff member in the specified month
    $startDate = sprintf('%04d-%02d-01', $year, $month);
    $endDate = date('Y-m-t', strtotime($startDate)); // Last day of month

    $stmt = $conn->prepare("
        SELECT b.id, b.booking_date, b.start_time, b.end_time, b.status, b.event_title,
               c.first_name as client_first_name, c.last_name as client_last_name
        FROM bookings b
        LEFT JOIN profiles c ON b.client_id = c.user_id
        WHERE b.assigned_staff_id = ? AND b.booking_date BETWEEN ? AND ?
        ORDER BY b.booking_date, b.start_time
    ");
    $stmt->bind_param("iss", $user_id, $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    $bookings = $result->fetch_all(MYSQLI_ASSOC);

    // Group bookings by date
    $events = [];
    foreach ($bookings as $booking) {
        $date = $booking['booking_date'];
        if (!isset($events[$date])) {
            $events[$date] = [];
        }
        $events[$date][] = [
            'id' => $booking['id'],
            'title' => $booking['event_title'] ?: 'Booking',
            'start_time' => $booking['start_time'],
            'end_time' => $booking['end_time'],
            'status' => $booking['status'],
            'client_name' => trim($booking['client_first_name'] . ' ' . $booking['client_last_name'])
        ];
    }

    sendResponse([
        'month' => $month,
        'year' => $year,
        'events' => $events,
        'bookings' => $bookings
    ]);
}

function getStaffBookings($user_id)
{
    $conn = getDBConnection();

    $status = $_GET['status'] ?? 'all';
    $range = (int) ($_GET['range'] ?? 30);

    $whereClause = "b.assigned_staff_id = ?";
    $params = [$user_id];
    $types = "i";

    if ($status !== 'all') {
        $whereClause .= " AND b.status = ?";
        $params[] = $status;
        $types .= "s";
    }

    if ($range > 0) {
        $whereClause .= " AND b.booking_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        $params[] = $range;
        $types .= "i";
    }

    $stmt = $conn->prepare("
        SELECT b.*, c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone
        FROM bookings b
        LEFT JOIN profiles c ON b.client_id = c.user_id
        WHERE $whereClause
        ORDER BY b.booking_date DESC, b.start_time DESC
    ");
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $bookings = $result->fetch_all(MYSQLI_ASSOC);

    sendResponse(['bookings' => $bookings]);
}

function getStaffAvailability($user_id)
{
    $conn = getDBConnection();

    $stmt = $conn->prepare("
        SELECT day_of_week, start_time, end_time, is_available
        FROM staff_availability
        WHERE staff_id = ?
        ORDER BY day_of_week
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $availability = $result->fetch_all(MYSQLI_ASSOC);

    sendResponse(['availability' => $availability]);
}

function setStaffAvailability($user_id)
{
    $input = getJsonInput();
    $conn = getDBConnection();

    if (!isset($input['day_of_week']) || !isset($input['start_time']) || !isset($input['end_time'])) {
        sendResponse(['error' => 'day_of_week, start_time, and end_time are required'], 400);
    }

    $day_of_week = (int) $input['day_of_week'];
    $start_time = $input['start_time'];
    $end_time = $input['end_time'];
    $is_available = $input['is_available'] ?? true;

    // Validate day_of_week (0-6)
    if ($day_of_week < 0 || $day_of_week > 6) {
        sendResponse(['error' => 'Invalid day_of_week. Must be 0-6'], 400);
    }

    // Check if availability already exists for this day
    $checkStmt = $conn->prepare("SELECT id FROM staff_availability WHERE staff_id = ? AND day_of_week = ?");
    $checkStmt->bind_param("ii", $user_id, $day_of_week);
    $checkStmt->execute();
    $exists = $checkStmt->get_result()->num_rows > 0;

    if ($exists) {
        // Update existing
        $stmt = $conn->prepare("
            UPDATE staff_availability
            SET start_time = ?, end_time = ?, is_available = ?, updated_at = NOW()
            WHERE staff_id = ? AND day_of_week = ?
        ");
        $stmt->bind_param("ssiii", $start_time, $end_time, $is_available, $user_id, $day_of_week);
    } else {
        // Insert new
        $stmt = $conn->prepare("
            INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("iissi", $user_id, $day_of_week, $start_time, $end_time, $is_available);
    }

    if ($stmt->execute()) {
        sendResponse(['message' => 'Availability updated successfully']);
    } else {
        sendResponse(['error' => 'Failed to update availability'], 500);
    }
}

function getStaffMessages($user_id)
{
    $conn = getDBConnection();

    // Mark messages as read when staff retrieves them
    $updateStmt = $conn->prepare("
        UPDATE messages
        SET status = 'read'
        WHERE recipient_id = ? AND status = 'unread'
    ");
    $updateStmt->bind_param("i", $user_id);
    $updateStmt->execute();

    $stmt = $conn->prepare("
        SELECT m.*, u.email as sender_email, p.first_name as sender_first_name, p.last_name as sender_last_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        LEFT JOIN profiles p ON m.sender_id = p.user_id
        WHERE m.recipient_id = ? OR m.sender_id = ?
        ORDER BY m.created_at DESC
        LIMIT 50
    ");
    $stmt->bind_param("ii", $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $messages = $result->fetch_all(MYSQLI_ASSOC);

    sendResponse(['messages' => $messages]);
}

function sendStaffMessage($user_id)
{
    $input = getJsonInput();
    $conn = getDBConnection();

    if (!isset($input['recipient_id']) || !isset($input['message'])) {
        sendResponse(['error' => 'recipient_id and message are required'], 400);
    }

    $recipient_id = (int) $input['recipient_id'];
    $message = trim($input['message']);

    if (empty($message)) {
        sendResponse(['error' => 'Message cannot be empty'], 400);
    }

    // Verify recipient exists
    $checkStmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
    $checkStmt->bind_param("i", $recipient_id);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendResponse(['error' => 'Recipient not found'], 404);
    }

    $stmt = $conn->prepare("
        INSERT INTO messages (sender_id, recipient_id, message, created_at)
        VALUES (?, ?, ?, NOW())
    ");
    $stmt->bind_param("iis", $user_id, $recipient_id, $message);

    if ($stmt->execute()) {
        sendResponse(['message' => 'Message sent successfully']);
    } else {
        sendResponse(['error' => 'Failed to send message'], 500);
    }
}

function updateStaffBooking($user_id)
{
    $input = getJsonInput();
    $conn = getDBConnection();

    $booking_id = $_GET['id'] ?? null;
    if (!$booking_id) {
        sendResponse(['error' => 'Booking ID required'], 400);
    }

    // Verify booking belongs to this staff member
    $checkStmt = $conn->prepare("SELECT id FROM bookings WHERE id = ? AND assigned_staff_id = ?");
    $checkStmt->bind_param("ii", $booking_id, $user_id);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendResponse(['error' => 'Booking not found or access denied'], 404);
    }

    $updates = [];
    $params = [];
    $types = '';

    $allowedFields = ['checked_in_at', 'status', 'notes'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
            $types .= 's';
        }
    }

    if (empty($updates)) {
        sendResponse(['error' => 'No valid fields to update'], 400);
    }

    $params[] = $booking_id;
    $types .= 'i';

    $query = "UPDATE bookings SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        sendResponse(['message' => 'Booking updated successfully']);
    } else {
        sendResponse(['error' => 'Failed to update booking'], 500);
    }
}

function updateStaffProfile($user_id)
{
    $input = getJsonInput();
    $conn = getDBConnection();

    if (!isset($input['profile'])) {
        sendResponse(['error' => 'Profile data required'], 400);
    }

    $profile = $input['profile'];

    // Validate required fields
    if (!isset($profile['first_name']) || !isset($profile['last_name']) || !isset($profile['email'])) {
        sendResponse(['error' => 'first_name, last_name, and email are required'], 400);
    }

    // Update profiles table
    $stmt = $conn->prepare("
        UPDATE profiles SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            bio = ?,
            profile_image = ?,
            updated_at = NOW()
        WHERE user_id = ?
    ");
    $stmt->bind_param(
        "sssssi",
        $profile['first_name'],
        $profile['last_name'],
        $profile['phone'] ?? null,
        $profile['bio'] ?? null,
        $profile['profile_image'] ?? null,
        $user_id
    );

    if ($stmt->execute()) {
        // Update users table email if changed
        if (isset($profile['email'])) {
            $emailStmt = $conn->prepare("UPDATE users SET email = ? WHERE id = ?");
            $emailStmt->bind_param("si", $profile['email'], $user_id);
            $emailStmt->execute();
        }

        sendResponse(['message' => 'Profile updated successfully']);
    } else {
        sendResponse(['error' => 'Failed to update profile'], 500);
    }
}
?>