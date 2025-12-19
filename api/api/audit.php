<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Check authentication
$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

switch ($method) {
    case 'GET':
        getAuditLogs();
        break;
    case 'POST':
        logActivity();
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getAuditLogs()
{
    $conn = getDBConnection();

    $search = $_GET['search'] ?? '';
    $dateFrom = $_GET['date_from'] ?? '';
    $dateTo = $_GET['date_to'] ?? '';
    $activityType = $_GET['activity_type'] ?? '';
    $limit = (int) ($_GET['limit'] ?? 50);
    $offset = (int) ($_GET['offset'] ?? 0);

    $where = [];
    $params = [];
    $types = '';

    if ($search) {
        $where[] = "(user_name LIKE ? OR activity LIKE ? OR details LIKE ?)";
        $searchParam = "%$search%";
        $params = array_merge($params, [$searchParam, $searchParam, $searchParam]);
        $types .= 'sss';
    }

    if ($dateFrom) {
        $where[] = "created_at >= ?";
        $params[] = $dateFrom;
        $types .= 's';
    }

    if ($dateTo) {
        $where[] = "created_at <= ?";
        $params[] = $dateTo . ' 23:59:59';
        $types .= 's';
    }

    if ($activityType) {
        $where[] = "activity = ?";
        $params[] = $activityType;
        $types .= 's';
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $query = "SELECT * FROM audit_logs $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($query);
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }

    sendResponse(['audit_logs' => $logs]);
}

function logActivity()
{
    $input = getJsonInput();
    $conn = getDBConnection();
    global $user;

    $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, ?, ?, ?)");
    $userId = $user['user_id'] ?? 1;
    $userName = $input['user_name'] ?? 'Admin';
    $activity = $input['activity'];
    $details = $input['details'];
    $ipAddress = $_SERVER['REMOTE_ADDR'];

    $stmt->bind_param("issss", $userId, $userName, $activity, $details, $ipAddress);

    if ($stmt->execute()) {
        sendResponse(['message' => 'Activity logged successfully']);
    } else {
        sendResponse(['error' => 'Failed to log activity'], 500);
    }
}
?>