<?php
session_start();
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$type = $_GET['type'] ?? 'bookings';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'list':
        getArchivedItems($type);
        break;
    case 'restore':
        if ($id) restoreItem($type, $id);
        break;
    case 'delete':
        if ($id) permanentlyDeleteItem($type, $id);
        break;
    default:
        sendResponse(['error' => 'Invalid action'], 400);
}

function getArchivedItems($type)
{
    $conn = getDBConnection();
    $table = "archived_" . $type;
    
    $search = $_GET['search'] ?? '';
    $limit = (int) ($_GET['limit'] ?? 50);
    $offset = (int) ($_GET['offset'] ?? 0);

    if ($type === 'messages') {
        if ($search) {
            $searchParam = "%$search%";
            $query = "SELECT * FROM $table WHERE (name LIKE ? OR email LIKE ?) ORDER BY deleted_at DESC LIMIT ? OFFSET ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ssii", $searchParam, $searchParam, $limit, $offset);
            
            $countQuery = "SELECT COUNT(*) as total FROM $table WHERE (name LIKE ? OR email LIKE ?)";
            $countStmt = $conn->prepare($countQuery);
            $countStmt->bind_param("ss", $searchParam, $searchParam);
        } else {
            $query = "SELECT * FROM $table ORDER BY deleted_at DESC LIMIT ? OFFSET ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ii", $limit, $offset);
            
            $countQuery = "SELECT COUNT(*) as total FROM $table";
            $countStmt = $conn->prepare($countQuery);
        }
    } else {
        if ($search) {
            $searchParam = "%$search%";
            $query = "SELECT * FROM $table WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?) ORDER BY deleted_at DESC LIMIT ? OFFSET ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("sssii", $searchParam, $searchParam, $searchParam, $limit, $offset);
            
            $countQuery = "SELECT COUNT(*) as total FROM $table WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            $countStmt = $conn->prepare($countQuery);
            $countStmt->bind_param("sss", $searchParam, $searchParam, $searchParam);
        } else {
            $query = "SELECT * FROM $table ORDER BY deleted_at DESC LIMIT ? OFFSET ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ii", $limit, $offset);
            
            $countQuery = "SELECT COUNT(*) as total FROM $table";
            $countStmt = $conn->prepare($countQuery);
        }
    }
    
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    $stmt->execute();
    $result = $stmt->get_result();

    $archived = [];
    while ($row = $result->fetch_assoc()) {
        $archived[] = $row;
    }

    $responseKey = 'archived_' . $type;
    sendResponse([$responseKey => $archived, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

function restoreItem($type, $id)
{
    $conn = getDBConnection();
    $archive_table = "archived_" . $type;
    $table = $type;

    $stmt = $conn->prepare("SELECT * FROM $archive_table WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Archived item not found'], 404);
    }

    $archived = $result->fetch_assoc();

    if ($type === 'messages') {
        $restoreStmt = $conn->prepare("INSERT INTO $table (id, name, email, phone, subject, message, rating, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $restoreStmt->bind_param("issssssss", $archived['original_id'], $archived['name'], $archived['email'], $archived['phone'], $archived['subject'], $archived['message'], $archived['rating'], $archived['status'], $archived['original_created_at']);
        
        if ($restoreStmt->execute()) {
            $deleteStmt = $conn->prepare("DELETE FROM $archive_table WHERE id = ?");
            $deleteStmt->bind_param("i", $id);
            $deleteStmt->execute();

            $userId = $_SESSION['user_id'] ?? 1;
            $userName = $_SESSION['user_name'] ?? 'Admin';
            $activity = 'Message Restored';
            $details = "Restored message from {$archived['name']} (ID: {$archived['original_id']})";
            $ipAddress = $_SERVER['REMOTE_ADDR'];
            
            $auditStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, ?, ?, ?)");
            $auditStmt->bind_param("issss", $userId, $userName, $activity, $details, $ipAddress);
            $auditStmt->execute();

            sendResponse(['message' => 'Message restored successfully']);
        } else {
            sendResponse(['error' => 'Failed to restore message'], 500);
        }
    } else {
        $restoreStmt = $conn->prepare("INSERT INTO $table (id, first_name, last_name, email, phone, event_date, guests, venue, package, special_requests, images, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $restoreStmt->bind_param("isssssssssssss", $archived['original_id'], $archived['first_name'], $archived['last_name'], $archived['email'], $archived['phone'], $archived['event_date'], $archived['guests'], $archived['venue'], $archived['package'], $archived['special_requests'], $archived['images'], $archived['status'], $archived['original_created_at'], $archived['original_updated_at']);

        if ($restoreStmt->execute()) {
            $deleteStmt = $conn->prepare("DELETE FROM $archive_table WHERE id = ?");
            $deleteStmt->bind_param("i", $id);
            $deleteStmt->execute();

            $userId = $_SESSION['user_id'] ?? 1;
            $userName = $_SESSION['user_name'] ?? 'Admin';
            $activity = 'Booking Restored';
            $details = "Restored booking for {$archived['first_name']} {$archived['last_name']} (ID: {$archived['original_id']})";
            $ipAddress = $_SERVER['REMOTE_ADDR'];
            
            $auditStmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, ?, ?, ?)");
            $auditStmt->bind_param("issss", $userId, $userName, $activity, $details, $ipAddress);
            $auditStmt->execute();

            sendResponse(['message' => 'Booking restored successfully']);
        } else {
            sendResponse(['error' => 'Failed to restore booking'], 500);
        }
    }
}

function permanentlyDeleteItem($type, $id)
{
    $conn = getDBConnection();
    $archive_table = "archived_" . $type;

    $stmt = $conn->prepare("DELETE FROM $archive_table WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendResponse(['message' => 'Booking permanently deleted']);
    } else {
        sendResponse(['error' => 'Archived item not found'], 404);
    }
}
?>
