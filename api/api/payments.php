<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

switch ($method) {
    case 'GET':
        if ($id) {
            getPayment($id);
        } else {
            getPayments();
        }
        break;
    case 'POST':
        if ($action === 'mark-paid') {
            markAsPaid();
        } elseif ($action === 'mark-unpaid') {
            markAsUnpaid();
        } else {
            createPayment();
        }
        break;
    case 'PUT':
        if ($id) {
            updatePayment($id);
        } else {
            sendResponse(['error' => 'Payment ID required'], 400);
        }
        break;
    case 'DELETE':
        if ($id) {
            deletePayment($id);
        } else {
            sendResponse(['error' => 'Payment ID required'], 400);
        }
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getPayments()
{
    $conn = getDBConnection();
    
    $query = "SELECT p.*, b.first_name, b.last_name, b.event_date, b.package 
              FROM payments p 
              JOIN bookings b ON p.booking_id = b.id 
              ORDER BY p.created_at DESC";
    
    $result = $conn->query($query);
    
    $payments = [];
    while ($row = $result->fetch_assoc()) {
        $payments[] = $row;
    }
    
    sendResponse(['payments' => $payments]);
}

function getPayment($id)
{
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("SELECT * FROM payments WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Payment not found'], 404);
    }
    
    $payment = $result->fetch_assoc();
    sendResponse(['payment' => $payment]);
}

function createPayment()
{
    $input = getJsonInput();
    $missing = validateRequired($input, ['booking_id', 'amount', 'payment_status']);
    
    if (!empty($missing)) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }
    
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("INSERT INTO payments (booking_id, amount, payment_status, payment_method, payment_date, notes) VALUES (?, ?, ?, ?, ?, ?)");
    
    $payment_method = $input['payment_method'] ?? null;
    $payment_date = $input['payment_date'] ?? null;
    $notes = $input['notes'] ?? null;
    
    $stmt->bind_param(
        "idssss",
        $input['booking_id'],
        $input['amount'],
        $input['payment_status'],
        $payment_method,
        $payment_date,
        $notes
    );
    
    if ($stmt->execute()) {
        $paymentId = $conn->insert_id;
        logAudit('payment_created', "Payment ID $paymentId created for booking {$input['booking_id']}");
        sendResponse(['payment' => ['id' => $paymentId], 'message' => 'Payment created successfully'], 201);
    } else {
        sendResponse(['error' => 'Failed to create payment: ' . $stmt->error], 500);
    }
}

function markAsPaid()
{
    $input = getJsonInput();
    $booking_id = $input['booking_id'] ?? null;
    $amount = $input['amount'] ?? null;
    $payment_method = $input['payment_method'] ?? 'cash';
    
    if (!$booking_id || !$amount) {
        sendResponse(['error' => 'Booking ID and amount required'], 400);
    }
    
    $conn = getDBConnection();
    
    $checkStmt = $conn->prepare("SELECT id FROM payments WHERE booking_id = ?");
    $checkStmt->bind_param("i", $booking_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        $updateStmt = $conn->prepare("UPDATE payments SET payment_status = 'paid', payment_date = NOW(), payment_method = ?, amount = ?, updated_at = NOW() WHERE booking_id = ?");
        $updateStmt->bind_param("sdi", $payment_method, $amount, $booking_id);
        
        if ($updateStmt->execute()) {
            logAudit('payment_marked_paid', "Booking ID $booking_id marked as paid - ₱$amount");
            sendResponse(['message' => 'Payment marked as paid']);
        } else {
            sendResponse(['error' => 'Failed to update payment: ' . $updateStmt->error], 500);
        }
    } else {
        $insertStmt = $conn->prepare("INSERT INTO payments (booking_id, amount, payment_status, payment_method, payment_date) VALUES (?, ?, 'paid', ?, NOW())");
        $insertStmt->bind_param("ids", $booking_id, $amount, $payment_method);
        
        if ($insertStmt->execute()) {
            logAudit('payment_created_paid', "Booking ID $booking_id payment created - ₱$amount");
            sendResponse(['message' => 'Payment recorded successfully']);
        } else {
            sendResponse(['error' => 'Failed to record payment: ' . $insertStmt->error], 500);
        }
    }
}

function markAsUnpaid()
{
    $input = getJsonInput();
    $booking_id = $input['booking_id'] ?? null;
    
    if (!$booking_id) {
        sendResponse(['error' => 'Booking ID required'], 400);
    }
    
    $conn = getDBConnection();
    
    $updateStmt = $conn->prepare("UPDATE payments SET payment_status = 'pending', payment_date = NULL, updated_at = NOW() WHERE booking_id = ?");
    $updateStmt->bind_param("i", $booking_id);
    
    if ($updateStmt->execute()) {
        logAudit('payment_marked_unpaid', "Booking ID $booking_id marked as pending");
        sendResponse(['message' => 'Payment marked as unpaid']);
    } else {
        sendResponse(['error' => 'Failed to update payment: ' . $updateStmt->error], 500);
    }
}

function updatePayment($id)
{
    $input = getJsonInput();
    
    $conn = getDBConnection();
    
    // Check if payment exists
    $stmt = $conn->prepare("SELECT id FROM payments WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendResponse(['error' => 'Payment not found'], 404);
    }
    
    $updates = [];
    $params = [];
    $types = '';
    
    $fieldTypes = [
        'amount' => 'd',
        'payment_status' => 's',
        'payment_method' => 's',
        'payment_date' => 's',
        'notes' => 's'
    ];
    
    foreach ($fieldTypes as $field => $type) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
            $types .= $type;
        }
    }
    
    if (empty($updates)) {
        sendResponse(['error' => 'No fields to update'], 400);
    }
    
    $params[] = $id;
    $types .= 'i';
    
    $query = "UPDATE payments SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        logAudit('payment_updated', "Payment ID $id updated");
        sendResponse(['message' => 'Payment updated successfully']);
    } else {
        sendResponse(['error' => 'Failed to update payment: ' . $stmt->error], 500);
    }
}

function deletePayment($id)
{
    $input = getJsonInput();
    $deleted_reason = $input['deleted_reason'] ?? 'Deleted by admin';
    
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("SELECT * FROM payments WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Payment not found'], 404);
    }
    
    $payment = $result->fetch_assoc();
    $deleted_by = 1;
    
    $archiveStmt = $conn->prepare("INSERT INTO archived_payments (original_id, booking_id, amount, payment_status, payment_method, payment_date, transaction_reference, notes, deleted_reason, deleted_by, original_created_at, original_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $archiveStmt->bind_param("iidsssssiiss", $payment['id'], $payment['booking_id'], $payment['amount'], $payment['payment_status'], $payment['payment_method'], $payment['payment_date'], $payment['transaction_reference'], $payment['notes'], $deleted_reason, $deleted_by, $payment['created_at'], $payment['updated_at']);
    
    if ($archiveStmt->execute()) {
        $deleteStmt = $conn->prepare("DELETE FROM payments WHERE id = ?");
        $deleteStmt->bind_param("i", $id);
        $deleteStmt->execute();
        
        logAudit('payment_archived', "Payment ID $id archived. Reason: $deleted_reason");
        sendResponse(['message' => 'Payment archived successfully']);
    } else {
        sendResponse(['error' => 'Failed to archive payment'], 500);
    }
}

?>
