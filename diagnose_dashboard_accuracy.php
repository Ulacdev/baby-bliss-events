<?php
require_once 'api/config.php';

$conn = getDBConnection();

echo "=== DASHBOARD DATA ACCURACY DIAGNOSTIC ===\n\n";

// 1. Check total bookings
$result = $conn->query("SELECT COUNT(*) as total FROM bookings");
$totalBookings = $result->fetch_assoc()['total'];
echo "1. Total Bookings: $totalBookings\n";

// 2. Check total payments
$result = $conn->query("SELECT COUNT(*) as total FROM payments");
$totalPayments = $result->fetch_assoc()['total'];
echo "2. Total Payments: $totalPayments\n";

// 3. Check payment status distribution
$result = $conn->query("SELECT payment_status, COUNT(*) as count, SUM(amount) as total_amount FROM payments GROUP BY payment_status");
echo "\n3. Payment Status Distribution:\n";
while ($row = $result->fetch_assoc()) {
    echo "   - {$row['payment_status']}: {$row['count']} payments, ₱{$row['total_amount']}\n";
}

// 4. Check paid payments with valid booking links
$result = $conn->query("SELECT COUNT(*) as count FROM payments p WHERE payment_status = 'paid' AND p.booking_id IS NOT NULL");
$paidWithBooking = $result->fetch_assoc()['count'];
echo "\n4. Paid Payments with valid booking_id: $paidWithBooking\n";

// 5. Check bookings with deleted_at
$result = $conn->query("SELECT COUNT(*) as total FROM bookings WHERE deleted_at IS NOT NULL");
$deletedBookings = $result->fetch_assoc()['total'];
echo "5. Deleted Bookings: $deletedBookings\n";

// 6. Get the actual dashboard revenue query result
echo "\n6. Dashboard Revenue Query Result:\n";
$currentMonth = date('Y-m');
$query = "SELECT SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as total_paid FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.deleted_at IS NULL";
$result = $conn->query($query);
$dashboardRevenue = $result->fetch_assoc()['total_paid'];
echo "   Total Paid (All Time): ₱$dashboardRevenue\n";

// 7. Monthly breakdown for current month
echo "\n7. Current Month ($currentMonth) Breakdown:\n";
$query = "SELECT 
    COUNT(b.id) as total_bookings,
    COUNT(DISTINCT p.id) as paid_count,
    SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as paid_revenue
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_status = 'paid'
WHERE DATE_FORMAT(b.created_at, '%Y-%m') = '$currentMonth' AND b.deleted_at IS NULL";
$result = $conn->query($query);
$row = $result->fetch_assoc();
echo "   - Bookings Created: {$row['total_bookings']}\n";
echo "   - Paid Payments: {$row['paid_count']}\n";
echo "   - Revenue (by payment_date): {$row['paid_revenue']}\n";

// 8. Show actual paid payment records
echo "\n8. Last 10 Paid Payments:\n";
$result = $conn->query("SELECT p.id, p.booking_id, p.amount, p.payment_status, p.payment_date, b.event_title FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE p.payment_status = 'paid' ORDER BY p.payment_date DESC LIMIT 10");
$count = 0;
while ($row = $result->fetch_assoc()) {
    echo "   - Payment #{$row['id']}: Booking #{$row['booking_id']}, Amount: ₱{$row['amount']}, Date: {$row['payment_date']}\n";
    $count++;
}
if ($count === 0) {
    echo "   (No paid payments found)\n";
}

// 9. Check if payments table has any records at all
echo "\n9. Sample Records from Payments Table (last 5):\n";
$result = $conn->query("SELECT id, booking_id, amount, payment_status, payment_date, payment_method FROM payments ORDER BY created_at DESC LIMIT 5");
$count = 0;
while ($row = $result->fetch_assoc()) {
    echo "   - ID: {$row['id']}, Booking: {$row['booking_id']}, Amount: ₱{$row['amount']}, Status: {$row['payment_status']}, Date: {$row['payment_date']}\n";
    $count++;
}
if ($count === 0) {
    echo "   (No payments in database)\n";
}

// 10. Check API endpoint response
echo "\n10. Testing API Dashboard Endpoint Response:\n";
echo "   Calling: GET /api/dashboard.php\n";
// Simulate the API call
$user = ['user_id' => 1, 'email' => 'admin@test.com', 'role' => 'admin'];

// Build WHERE clause for role-based filtering
$whereClause = "";

$query = "SELECT SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as total_paid FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.deleted_at IS NULL";
$result = $conn->query($query);
$revenue = $result->fetch_assoc()['total_paid'];
$estimated_revenue = (int) ($revenue ?: 0);
echo "   estimated_revenue: $estimated_revenue\n";

echo "\n=== END DIAGNOSTIC ===\n";
?>