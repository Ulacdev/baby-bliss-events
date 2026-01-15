<?php
require_once 'config.php';

// Set headers for Server-Sent Events
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');

// Check authentication
$user = authenticateWithToken();
if (!$user) {
    http_response_code(401);
    echo "data: " . json_encode(['error' => 'Unauthorized']) . "\n\n";
    exit;
}

// Verify user has staff role
if ($user['role'] !== 'staff') {
    http_response_code(403);
    echo "data: " . json_encode(['error' => 'Access denied. Staff role required.']) . "\n\n";
    exit;
}

$user_id = $user['user_id'];

// Function to send SSE data
function sendEvent($event, $data) {
    echo "event: $event\n";
    echo "data: " . json_encode($data) . "\n\n";
    ob_flush();
    flush();
}

// Send initial connection confirmation
sendEvent('connected', [
    'message' => 'Real-time connection established',
    'user_id' => $user_id,
    'timestamp' => date('Y-m-d H:i:s')
]);

// Track last update times to avoid sending duplicate data
$lastUpdates = [
    'bookings' => 0,
    'messages' => 0,
    'dashboard' => 0
];

$iteration = 0;
$maxIterations = 3600; // 1 hour maximum (60 iterations per minute * 60 minutes)

while ($iteration < $maxIterations) {
    // Check for new bookings
    $bookingQuery = "
        SELECT COUNT(*) as new_count
        FROM bookings
        WHERE assigned_staff_id = ? AND updated_at > FROM_UNIXTIME(?)
    ";
    $bookingStmt = getDBConnection()->prepare($bookingQuery);
    $bookingStmt->bind_param("ii", $user_id, $lastUpdates['bookings']);
    $bookingStmt->execute();
    $bookingResult = $bookingStmt->get_result()->fetch_assoc();

    if ($bookingResult['new_count'] > 0) {
        // Get the latest booking updates
        $latestBookingsQuery = "
            SELECT id, event_title, status, booking_date, updated_at
            FROM bookings
            WHERE assigned_staff_id = ? AND updated_at > FROM_UNIXTIME(?)
            ORDER BY updated_at DESC
            LIMIT 5
        ";
        $latestStmt = getDBConnection()->prepare($latestBookingsQuery);
        $latestStmt->bind_param("ii", $user_id, $lastUpdates['bookings']);
        $latestStmt->execute();
        $latestBookings = $latestStmt->get_result()->fetch_all(MYSQLI_ASSOC);

        sendEvent('bookings_update', [
            'new_count' => $bookingResult['new_count'],
            'latest_bookings' => $latestBookings,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    // Check for new messages
    $messageQuery = "
        SELECT COUNT(*) as new_count
        FROM messages
        WHERE recipient_id = ? AND status = 'unread' AND created_at > FROM_UNIXTIME(?)
    ";
    $messageStmt = getDBConnection()->prepare($messageQuery);
    $messageStmt->bind_param("ii", $user_id, $lastUpdates['messages']);
    $messageStmt->execute();
    $messageResult = $messageStmt->get_result()->fetch_assoc();

    if ($messageResult['new_count'] > 0) {
        // Get the latest messages
        $latestMessagesQuery = "
            SELECT m.id, m.message, m.created_at, u.email as sender_email, p.first_name, p.last_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            LEFT JOIN profiles p ON m.sender_id = p.user_id
            WHERE m.recipient_id = ? AND m.created_at > FROM_UNIXTIME(?)
            ORDER BY m.created_at DESC
            LIMIT 3
        ";
        $latestMsgStmt = getDBConnection()->prepare($latestMessagesQuery);
        $latestMsgStmt->bind_param("ii", $user_id, $lastUpdates['messages']);
        $latestMsgStmt->execute();
        $latestMessages = $latestMsgStmt->get_result()->fetch_all(MYSQLI_ASSOC);

        sendEvent('messages_update', [
            'new_count' => $messageResult['new_count'],
            'latest_messages' => $latestMessages,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    // Send periodic dashboard stats update (every 30 seconds)
    if ($iteration % 30 == 0) {
        // Get today's bookings count
        $todayQuery = "
            SELECT COUNT(*) as today_count
            FROM bookings
            WHERE assigned_staff_id = ? AND DATE(booking_date) = CURDATE()
        ";
        $todayStmt = getDBConnection()->prepare($todayQuery);
        $todayStmt->bind_param("i", $user_id);
        $todayStmt->execute();
        $todayCount = $todayStmt->get_result()->fetch_assoc()['today_count'];

        // Get upcoming bookings count
        $upcomingQuery = "
            SELECT COUNT(*) as upcoming_count
            FROM bookings
            WHERE assigned_staff_id = ? AND booking_date > CURDATE() AND booking_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND status IN ('confirmed', 'pending')
        ";
        $upcomingStmt = getDBConnection()->prepare($upcomingQuery);
        $upcomingStmt->bind_param("i", $user_id);
        $upcomingStmt->execute();
        $upcomingCount = $upcomingStmt->get_result()->fetch_assoc()['upcoming_count'];

        // Get unread messages count
        $unreadQuery = "
            SELECT COUNT(*) as unread_count
            FROM messages
            WHERE recipient_id = ? AND status = 'unread'
        ";
        $unreadStmt = getDBConnection()->prepare($unreadQuery);
        $unreadStmt->bind_param("i", $user_id);
        $unreadStmt->execute();
        $unreadCount = $unreadStmt->get_result()->fetch_assoc()['unread_count'];

        sendEvent('dashboard_update', [
            'today_bookings' => (int)$todayCount,
            'upcoming_count' => (int)$upcomingCount,
            'unread_messages' => (int)$unreadCount,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    // Update last check times
    $currentTime = time();
    $lastUpdates['bookings'] = $currentTime;
    $lastUpdates['messages'] = $currentTime;
    $lastUpdates['dashboard'] = $currentTime;

    // Send heartbeat every 30 seconds
    if ($iteration % 30 == 0) {
        sendEvent('heartbeat', [
            'timestamp' => date('Y-m-d H:i:s'),
            'connection_alive' => true
        ]);
    }

    $iteration++;

    // Wait 1 second before next check
    sleep(1);

    // Check if client disconnected
    if (connection_aborted()) {
        break;
    }
}

// Send final disconnect event
sendEvent('disconnected', [
    'message' => 'Real-time connection closed',
    'timestamp' => date('Y-m-d H:i:s')
]);

?>