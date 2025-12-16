<?php
require_once 'config.php';

// Check authentication
$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getClient($id);
        } else {
            getClients();
        }
        break;
    case 'POST':
        createClient();
        break;
    case 'PUT':
        if ($id) {
            updateClient($id);
        } else {
            sendResponse(['error' => 'Client ID required'], 400);
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteClient($id);
        } else {
            sendResponse(['error' => 'Client ID required'], 400);
        }
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getClients()
{
    $conn = getDBConnection();
    $search = $_GET['search'] ?? '';
    $limit = (int) ($_GET['limit'] ?? 50);
    $offset = (int) ($_GET['offset'] ?? 0);
    $where = '';
    $params = [];
    $types = '';

    if ($search) {
        $where = 'WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
        $searchParam = "%$search%";
        $params = [$searchParam, $searchParam, $searchParam];
        $types = 'sss';
    }

    $countQuery = "SELECT COUNT(DISTINCT CONCAT(first_name, ' ', last_name, ' ', email)) as total FROM bookings $where";
    $stmt = $conn->prepare($countQuery);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $total = $stmt->get_result()->fetch_assoc()['total'];

    $query = "SELECT CONCAT(b.first_name, ' ', b.last_name) as full_name, b.first_name, b.last_name, b.email, b.phone, COUNT(b.id) as total_bookings, SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings, MAX(b.created_at) as last_booking, MIN(b.event_date) as first_event, MAX(b.event_date) as last_event FROM bookings b $where GROUP BY b.first_name, b.last_name, b.email, b.phone HAVING COUNT(b.id) > 0 ORDER BY last_booking DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($query);
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $clients[] = [
            'full_name' => $row['full_name'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'total_bookings' => (int) $row['total_bookings'],
            'confirmed_bookings' => (int) $row['confirmed_bookings'],
            'last_booking' => $row['last_booking'],
            'first_event' => $row['first_event'],
            'last_event' => $row['last_event']
        ];
    }

    sendResponse(['clients' => $clients, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

function getClient($id)
{
    $conn = getDBConnection();
    $stmt = $conn->prepare("SELECT * FROM bookings WHERE email = ? ORDER BY created_at DESC");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }

    if (empty($bookings)) {
        sendResponse(['error' => 'Client not found'], 404);
    }

    sendResponse(['client' => ['email' => $bookings[0]['email'], 'first_name' => $bookings[0]['first_name'], 'last_name' => $bookings[0]['last_name'], 'phone' => $bookings[0]['phone'], 'bookings' => $bookings]]);
}

function createClient()
{
    $input = getJsonInput();
    $missing = validateRequired($input, ['email', 'first_name', 'last_name']);

    if (!empty($missing)) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }

    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email format'], 400);
    }

    $conn = getDBConnection();
    $stmt = $conn->prepare("SELECT email FROM bookings WHERE email = ?");
    $stmt->bind_param("s", $input['email']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        sendResponse(['error' => 'Client already exists'], 409);
    }

    $stmt = $conn->prepare("INSERT INTO bookings (first_name, last_name, email, phone, event_date, guests, venue, special_requests, status) VALUES (?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 0, '', 'Client added manually', 'pending')");
    $phone = $input['phone'] ?? null;
    $stmt->bind_param("ssss", $input['first_name'], $input['last_name'], $input['email'], $phone);

    if ($stmt->execute()) {
        logAudit('Create', "Created client: {$input['first_name']} {$input['last_name']} ({$input['email']})");
        sendResponse(['message' => 'Client created successfully', 'client' => ['email' => $input['email']]], 201);
    } else {
        sendResponse(['error' => 'Failed to create client'], 500);
    }
}

function updateClient($id)
{
    $input = getJsonInput();
    $conn = getDBConnection();
    $updates = [];
    $params = [];
    $types = '';

    if (isset($input['first_name'])) {
        $updates[] = 'first_name = ?';
        $params[] = $input['first_name'];
        $types .= 's';
    }

    if (isset($input['last_name'])) {
        $updates[] = 'last_name = ?';
        $params[] = $input['last_name'];
        $types .= 's';
    }

    if (isset($input['phone'])) {
        $updates[] = 'phone = ?';
        $params[] = $input['phone'];
        $types .= 's';
    }

    if (empty($updates)) {
        sendResponse(['error' => 'No fields to update'], 400);
    }

    $params[] = $id;
    $types .= 's';

    $query = "UPDATE bookings SET " . implode(', ', $updates) . " WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        logAudit('Update', "Updated client: $id");
        sendResponse(['message' => 'Client updated successfully']);
    } else {
        sendResponse(['error' => 'Failed to update client'], 500);
    }
}

function deleteClient($id)
{
    $conn = getDBConnection();
    $stmt = $conn->prepare("DELETE FROM bookings WHERE email = ?");
    $stmt->bind_param("s", $id);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        logAudit('Delete', "Deleted client and all bookings: $id");
        sendResponse(['message' => 'Client and all bookings deleted successfully']);
    } else {
        sendResponse(['error' => 'Client not found'], 404);
    }
}
?>