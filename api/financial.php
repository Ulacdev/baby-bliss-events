<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

// Check authentication
$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

switch ($action) {
    case 'payments':
        handlePayments($method, $id);
        break;
    case 'expenses':
        handleExpenses($method, $id);
        break;
    case 'summary':
        getFinancialSummary();
        break;
    case 'receipt':
        if ($id)
            printReceipt($id);
        break;
    default:
        sendResponse(['error' => 'Invalid action'], 400);
}

function handlePayments($method, $id)
{
    $conn = getDBConnection();

    if ($method === 'GET') {
        $query = "SELECT p.*, b.first_name, b.last_name, b.event_date, b.package, b.package_price 
                  FROM payments p 
                  JOIN bookings b ON p.booking_id = b.id 
                  WHERE b.deleted_at IS NULL
                  ORDER BY p.created_at DESC";

        $result = $conn->query($query);
        $payments = [];
        while ($row = $result->fetch_assoc()) {
            $payments[] = $row;
        }
        sendResponse(['payments' => $payments]);
    } elseif ($method === 'PUT' && $id) {
        $input = getJsonInput();
        $payment_status = $input['payment_status'] ?? null;
        $payment_date = $input['payment_date'] ?? date('Y-m-d');
        $payment_method = $input['payment_method'] ?? null;

        if (!$payment_status) {
            sendResponse(['error' => 'Payment status required'], 400);
        }

        $stmt = $conn->prepare("UPDATE payments SET payment_status = ?, payment_date = ?, payment_method = ?, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param("sssi", $payment_status, $payment_date, $payment_method, $id);

        if ($stmt->execute()) {
            logAudit('payment_updated', "Payment ID $id marked as $payment_status");
            sendResponse(['message' => 'Payment updated successfully']);
        } else {
            sendResponse(['error' => 'Failed to update payment: ' . $stmt->error], 500);
        }
    }
}

function handleExpenses($method, $id)
{
    global $user;
    $conn = getDBConnection();

    if ($method === 'GET') {
        $query = "SELECT e.*, u.full_name FROM expenses e
                  LEFT JOIN users u ON e.created_by = u.id";


        $query .= " ORDER BY e.expense_date DESC";

        $result = $conn->query($query);
        $expenses = [];
        while ($row = $result->fetch_assoc()) {
            $expenses[] = $row;
        }
        sendResponse(['expenses' => $expenses]);
    } elseif ($method === 'POST') {
        $input = getJsonInput();
        $required = ['category', 'description', 'amount', 'expense_date'];
        $missing = validateRequired($input, $required);

        if (!empty($missing)) {
            sendResponse(['error' => 'Missing fields: ' . implode(', ', $missing)], 400);
        }

        $stmt = $conn->prepare("INSERT INTO expenses (category, description, amount, expense_date, payment_method, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");

        $payment_method = $input['payment_method'] ?? null;
        $notes = $input['notes'] ?? null;
        $created_by = 1; // Default admin user

        $stmt->bind_param("ssdsssi", $input['category'], $input['description'], $input['amount'], $input['expense_date'], $payment_method, $notes, $created_by);

        if ($stmt->execute()) {
            logAudit('expense_created', "Expense: {$input['category']} - ₱{$input['amount']}");
            sendResponse(['message' => 'Expense recorded successfully'], 201);
        } else {
            sendResponse(['error' => 'Failed to record expense'], 500);
        }
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $conn->prepare("SELECT * FROM expenses WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            sendResponse(['error' => 'Expense not found'], 404);
        }

        $expense = $result->fetch_assoc();
        $deleted_by = 1;
        $deleted_reason = 'Deleted by admin';

        $archiveStmt = $conn->prepare("INSERT INTO archived_expenses (original_id, category, description, amount, expense_date, payment_method, receipt_image, notes, created_by, deleted_reason, deleted_by, original_created_at, original_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $archiveStmt->bind_param("issdssssisiss", $expense['id'], $expense['category'], $expense['description'], $expense['amount'], $expense['expense_date'], $expense['payment_method'], $expense['receipt_image'], $expense['notes'], $expense['created_by'], $deleted_reason, $deleted_by, $expense['created_at'], $expense['updated_at']);

        if ($archiveStmt->execute()) {
            $deleteStmt = $conn->prepare("DELETE FROM expenses WHERE id = ?");
            $deleteStmt->bind_param("i", $id);
            $deleteStmt->execute();

            logAudit('expense_archived', "Expense ID $id archived");
            sendResponse(['message' => 'Expense archived successfully']);
        } else {
            sendResponse(['error' => 'Failed to archive expense'], 500);
        }
    }
}

function getFinancialSummary()
{
    global $user;
    $conn = getDBConnection();

    $whereClause = "WHERE b.deleted_at IS NULL";

    $query = "SELECT
        SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN p.payment_status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END) as total_refunded,
        COUNT(DISTINCT p.booking_id) as total_bookings,
        (SELECT SUM(amount) FROM expenses) as total_expenses
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        $whereClause";

    $result = $conn->query($query);
    $summary = $result->fetch_assoc();

    sendResponse(['summary' => $summary]);
}

function printReceipt($payment_id)
{
    $conn = getDBConnection();

    $stmt = $conn->prepare("SELECT p.*, b.first_name, b.last_name, b.email, b.phone, b.event_date, b.package, b.package_price FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.id = ?");
    $stmt->bind_param("i", $payment_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Payment not found'], 404);
    }

    $payment = $result->fetch_assoc();

    $receipt = [
        'receipt_number' => 'RCP-' . str_pad($payment['id'], 6, '0', STR_PAD_LEFT),
        'date' => date('F j, Y', strtotime($payment['payment_date'])),
        'client_name' => $payment['first_name'] . ' ' . $payment['last_name'],
        'client_email' => $payment['email'],
        'client_phone' => $payment['phone'],
        'event_date' => date('F j, Y', strtotime($payment['event_date'])),
        'package' => $payment['package'],
        'package_price' => $payment['package_price'],
        'amount_paid' => $payment['amount'],
        'payment_method' => $payment['payment_method'],
        'payment_status' => $payment['payment_status'],
        'transaction_reference' => $payment['transaction_reference'],
        'notes' => $payment['notes']
    ];

    sendResponse(['receipt' => $receipt]);
}

function logAudit($activity, $details)
{
    $conn = getDBConnection();
    global $user;
    $user_id = $user['user_id'] ?? 1;
    $user_name = $user['email'] ?? 'Admin';
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $user_id, $user_name, $activity, $details, $ip_address);
    $stmt->execute();
}
?>