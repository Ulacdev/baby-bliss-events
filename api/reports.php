<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

switch ($action) {
    case 'analytics':
        getAnalytics();
        break;
    case 'audit-trail':
        getAuditTrail();
        break;
    case 'recent-activity':
        getRecentActivity();
        break;
    case 'generate':
        generateReport();
        break;
    default:
        sendResponse(['error' => 'Invalid action'], 400);
}

function getAnalytics()
{
    $conn = getDBConnection();

    $query = "SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(package_price) as total_revenue,
        AVG(guests) as average_guests,
        MAX(event_date) as latest_event
        FROM bookings
        WHERE deleted_at IS NULL";

    $result = $conn->query($query);
    $analytics = $result->fetch_assoc();

    $monthlyQuery = "SELECT 
        DATE_FORMAT(event_date, '%Y-%m') as month,
        COUNT(*) as bookings,
        SUM(package_price) as revenue
        FROM bookings
        WHERE deleted_at IS NULL
        GROUP BY DATE_FORMAT(event_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12";

    $monthlyResult = $conn->query($monthlyQuery);
    $monthly = [];
    while ($row = $monthlyResult->fetch_assoc()) {
        $monthly[] = $row;
    }

    sendResponse(['analytics' => $analytics, 'monthly' => $monthly]);
}

function getAuditTrail()
{
    $conn = getDBConnection();
    $limit = $_GET['limit'] ?? 100;

    $query = "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $limit);
    $stmt->execute();

    $result = $stmt->get_result();
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }

    sendResponse(['audit_logs' => $logs]);
}

function getRecentActivity()
{
    $conn = getDBConnection();

    $query = "SELECT 
        'booking' as type,
        id,
        CONCAT(first_name, ' ', last_name) as title,
        event_date as date,
        status,
        created_at
        FROM bookings
        WHERE deleted_at IS NULL
        UNION ALL
        SELECT 
        'payment' as type,
        id,
        CONCAT('Payment - ₱', amount) as title,
        payment_date as date,
        payment_status as status,
        created_at
        FROM payments
        UNION ALL
        SELECT 
        'expense' as type,
        id,
        CONCAT(category, ' - ₱', amount) as title,
        expense_date as date,
        'recorded' as status,
        created_at
        FROM expenses
        UNION ALL
        SELECT 
        'message' as type,
        id,
        CONCAT('Message from ', name) as title,
        created_at as date,
        status,
        created_at
        FROM messages
        ORDER BY created_at DESC
        LIMIT 50";

    $result = $conn->query($query);
    $activities = [];
    while ($row = $result->fetch_assoc()) {
        $activities[] = $row;
    }

    sendResponse(['activities' => $activities]);
}

function generateReport()
{
    $input = getJsonInput();
    $report_type = $input['report_type'] ?? 'monthly';
    $report_period = $input['report_period'] ?? date('Y-m');

    $conn = getDBConnection();

    $query = "SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(package_price) as total_revenue,
        AVG(guests) as average_guests
        FROM bookings
        WHERE deleted_at IS NULL
        AND DATE_FORMAT(event_date, '%Y-%m') = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $report_period);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    $insertStmt = $conn->prepare("INSERT INTO reports (report_type, report_period, total_bookings, confirmed_bookings, pending_bookings, cancelled_bookings, total_revenue, average_guests, generated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $generated_by = 1;
    $insertStmt->bind_param("ssiiiiddi", $report_type, $report_period, $data['total_bookings'], $data['confirmed_bookings'], $data['pending_bookings'], $data['cancelled_bookings'], $data['total_revenue'], $data['average_guests'], $generated_by);

    if ($insertStmt->execute()) {
        logAudit('report_generated', "Report: $report_type for $report_period");
        sendResponse(['message' => 'Report generated successfully', 'report' => $data], 201);
    } else {
        sendResponse(['error' => 'Failed to generate report'], 500);
    }
}

function logAudit($activity, $details)
{
    $conn = getDBConnection();
    $user_id = 1;
    $user_name = 'Admin';
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $user_id, $user_name, $activity, $details, $ip_address);
    $stmt->execute();
}
?>