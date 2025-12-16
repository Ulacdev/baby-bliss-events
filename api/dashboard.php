<?php
require_once 'config.php';

// Check authentication
$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

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
    $conn = getDBConnection();

    $stats = [];

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings");
    $stats['total_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings WHERE status = 'pending'");
    $stats['pending_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings WHERE status = 'confirmed'");
    $stats['confirmed_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT COUNT(*) as total FROM bookings WHERE status = 'cancelled'");
    $stats['cancelled_bookings'] = $result->fetch_assoc()['total'];

    $result = $conn->query("SELECT id, first_name, last_name, event_date, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 5");
    $recentBookings = [];
    while ($row = $result->fetch_assoc()) {
        $recentBookings[] = $row;
    }
    $stats['recent_bookings'] = $recentBookings;

    $currentMonth = date('Y-m');
    $result = $conn->query("SELECT COUNT(*) as total FROM bookings WHERE DATE_FORMAT(created_at, '%Y-%m') = '$currentMonth'");
    $stats['monthly_bookings'] = $result->fetch_assoc()['total'];

    $nextWeek = date('Y-m-d', strtotime('+7 days'));
    $result = $conn->query("SELECT COUNT(*) as total FROM bookings WHERE event_date <= '$nextWeek' AND event_date >= CURDATE() AND status = 'confirmed'");
    $stats['upcoming_events'] = $result->fetch_assoc()['total'];

    // Calculate revenue from paid payments only
    $result = $conn->query("SELECT SUM(p.amount) as total_revenue FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.payment_status = 'paid' AND DATE_FORMAT(b.created_at, '%Y-%m') = '$currentMonth'");
    $stats['estimated_revenue'] = (int) $result->fetch_assoc()['total_revenue'];

    // Monthly trends (last 6 months)
    $monthlyTrends = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $monthName = date('M', strtotime("-$i months"));
        $result = $conn->query("SELECT COUNT(*) as bookings FROM bookings WHERE DATE_FORMAT(created_at, '%Y-%m') = '$month'");
        $bookingCount = $result->fetch_assoc()['bookings'];

        $result = $conn->query("SELECT SUM(p.amount) as revenue FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.payment_status = 'paid' AND DATE_FORMAT(b.created_at, '%Y-%m') = '$month'");
        $revenue = (int) $result->fetch_assoc()['revenue'];

        $monthlyTrends[] = [
            'month' => $monthName,
            'bookings' => (int) $bookingCount,
            'revenue' => $revenue
        ];
    }
    $stats['monthly_trends'] = $monthlyTrends;

    // Status distribution
    $statusData = [];
    $statuses = ['confirmed', 'pending', 'cancelled'];
    $colors = ['#0077B6', '#F59E0B', '#EF4444'];

    foreach ($statuses as $index => $status) {
        $result = $conn->query("SELECT COUNT(*) as count FROM bookings WHERE status = '$status'");
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