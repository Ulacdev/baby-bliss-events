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
        getCalendarBookings();
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getCalendarBookings() {
    $conn = getDBConnection();

    // Get month/year from query parameters
    $month = isset($_GET['month']) ? (int)$_GET['month'] : (int)date('m');
    $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');

    // Validate month/year
    if ($month < 1 || $month > 12 || $year < 2020 || $year > 2030) {
        sendResponse(['error' => 'Invalid month or year'], 400);
    }

    // Get first and last day of the month
    $firstDay = date('Y-m-01', strtotime("$year-$month-01"));
    $lastDay = date('Y-m-t', strtotime("$year-$month-01"));

    // Get bookings for the month
    $stmt = $conn->prepare("SELECT id, first_name, last_name, event_date, status, venue, guests FROM bookings WHERE event_date BETWEEN ? AND ? ORDER BY event_date");
    $stmt->bind_param("ss", $firstDay, $lastDay);
    $stmt->execute();
    $result = $stmt->get_result();

    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = [
            'id' => $row['id'],
            'title' => $row['first_name'] . ' ' . $row['last_name'] . ' - ' . ucfirst($row['status']),
            'date' => $row['event_date'],
            'status' => $row['status'],
            'venue' => $row['venue'],
            'guests' => $row['guests'],
            'client' => $row['first_name'] . ' ' . $row['last_name']
        ];
    }

    // Group bookings by date for calendar display
    $calendarEvents = [];
    foreach ($bookings as $booking) {
        $date = $booking['date'];
        if (!isset($calendarEvents[$date])) {
            $calendarEvents[$date] = [];
        }
        $calendarEvents[$date][] = $booking;
    }

    sendResponse([
        'month' => $month,
        'year' => $year,
        'events' => $calendarEvents,
        'bookings' => $bookings
    ]);
}
?>