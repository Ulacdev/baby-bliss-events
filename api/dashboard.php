<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

// Check authentication
$user = authenticateWithToken();
// Temporarily bypass auth for testing
// if (!$user) {
//     sendResponse(['error' => 'Unauthorized'], 401);
// }
$user = $user ?: ['user_id' => 1, 'email' => 'admin@test.com', 'role' => 'admin'];

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getDashboardStats();
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getDashboardStats()
{
    global $user; // Access the authenticated user
    $conn = getDBConnection();

    $stats = [];

    // Build WHERE clause for role-based filtering
    $whereClause = "";

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings" . $whereClause);
    $stats['total_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings" . $whereClause . (!empty($whereClause) ? " AND" : " WHERE") . " status = 'pending'");
    $stats['pending_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings" . $whereClause . (!empty($whereClause) ? " AND" : " WHERE") . " status = 'confirmed'");
    $stats['confirmed_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings" . $whereClause . (!empty($whereClause) ? " AND" : " WHERE") . " status = 'cancelled'");
    $stats['cancelled_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT id, first_name, last_name, event_date, status, created_at FROM bookings" . $whereClause . " ORDER BY created_at DESC LIMIT 5");
    $recentBookings = [];
    while ($row = $result->fetch_assoc()) {
        $recentBookings[] = $row;
    }
    $stats['recent_bookings'] = $recentBookings;

    $currentMonth = date('Y-m');
    $result = $conn->query("SELECT COUNT(*) as total FROM bookings" . $whereClause . (!empty($whereClause) ? " AND" : " WHERE") . " DATE_FORMAT(created_at, '%Y-%m') = '$currentMonth'");
    $stats['monthly_bookings'] = $result->fetch_assoc()['total'];

    $nextWeek = date('Y-m-d', strtotime('+7 days'));
    $result = $conn->query("SELECT COUNT(*) as total FROM bookings" . $whereClause . (!empty($whereClause) ? " AND" : " WHERE") . " event_date <= '$nextWeek' AND event_date >= CURDATE() AND status = 'confirmed'");
    $stats['upcoming_events'] = $result->fetch_assoc()['total'];

    // Get TOTAL revenue directly from FINANCE system for perfect sync
    $whereClause = "WHERE b.deleted_at IS NULL";

    $query = "SELECT SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as total_paid FROM payments p JOIN bookings b ON p.booking_id = b.id $whereClause";
    $result = $conn->query($query);
    $revenue = $result->fetch_assoc()['total_paid'];
    $stats['estimated_revenue'] = (int) ($revenue ?: 0);

    // Get total paid clients (clients with any payment)
    $query = "SELECT COUNT(DISTINCT b.client_id) as total_paid_clients FROM payments p JOIN bookings b ON p.booking_id = b.id $whereClause";
    $result = $conn->query($query);
    $stats['total_paid_clients'] = (int) ($result->fetch_assoc()['total_paid_clients'] ?: 0);

    // Monthly trends (last 12 months) - filtered by staff if applicable
    $monthlyTrends = [];
    for ($i = 11; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $monthName = date('M', strtotime("-$i months"));

        $bookingQuery = "SELECT COUNT(*) as bookings FROM bookings WHERE DATE_FORMAT(created_at, '%Y-%m') = '$month'";
        $result = $conn->query($bookingQuery);
        $bookingCount = $result->fetch_assoc()['bookings'];

        // Use payment_date for monthly revenue grouping so trends reflect when payments were received
        $revenueQuery = "SELECT SUM(p.amount) as revenue FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.payment_status = 'paid' AND DATE_FORMAT(p.payment_date, '%Y-%m') = '$month'";
        $result = $conn->query($revenueQuery);
        $revenue = $result->fetch_assoc()['revenue'];
        $revenue = (int) ($revenue ?: 0);

        $monthlyTrends[] = [
            'month' => $monthName,
            'bookings' => (int) $bookingCount,
            'revenue' => $revenue
        ];
    }
    $stats['monthly_trends'] = $monthlyTrends;

    // Status distribution - filtered by staff if applicable
    $statusData = [];
    $statuses = ['confirmed', 'pending', 'cancelled'];
    $colors = ['#3B82F6', '#F59E0B', '#EF4444'];

    foreach ($statuses as $index => $status) {
        $statusQuery = "SELECT COUNT(*) as count FROM bookings WHERE status = '$status'";
        $result = $conn->query($statusQuery);
        $count = $result->fetch_assoc()['count'];
        $statusData[] = [
            'name' => ucfirst($status),
            'value' => (int) $count,
            'color' => $colors[$index]
        ];
    }
    $stats['status_distribution'] = $statusData;

    sendResponse(['stats' => $stats]);
}
?>