# Delete and Archive System Guide

## Overview
All deletions in the Baby Bliss system use soft deletes with automatic archiving. When data is deleted, it's moved to archive tables instead of being permanently removed.

## Database Tables

### Main Tables (with soft delete support)
- `bookings` - has `deleted_at` column
- `clients` - (can add soft delete)
- `payments` - (can add soft delete)
- `expenses` - (can add soft delete)
- `messages` - (can add soft delete)
- `users` - (can add soft delete)

### Archive Tables (for deleted records)
- `archived_bookings`
- `archived_clients`
- `archived_payments`
- `archived_expenses`
- `archived_messages`
- `archived_users`

## Delete Flow

### 1. Booking Deletion
```php
// In your API endpoint (e.g., DELETE /api/bookings/{id})
$bookingId = $_GET['id'];

// Get booking data
$booking = $db->query("SELECT * FROM bookings WHERE id = ?", [$bookingId])->fetch();

// Archive the booking
$db->query("
  INSERT INTO archived_bookings (
    original_id, first_name, last_name, email, phone, event_date, 
    guests, venue, package, special_requests, images, status, 
    deleted_reason, deleted_by, original_created_at, original_updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
", [
  $booking['id'], $booking['first_name'], $booking['last_name'], 
  $booking['email'], $booking['phone'], $booking['event_date'],
  $booking['guests'], $booking['venue'], $booking['package'], 
  $booking['special_requests'], $booking['images'], $booking['status'],
  $_POST['reason'] ?? 'User deleted', $_SESSION['user_id'],
  $booking['created_at'], $booking['updated_at']
]);

// Soft delete (mark as deleted)
$db->query("UPDATE bookings SET deleted_at = NOW() WHERE id = ?", [$bookingId]);

// Log the action
$db->query("
  INSERT INTO audit_logs (user_id, user_name, activity, details)
  VALUES (?, ?, ?, ?)
", [
  $_SESSION['user_id'], 
  $_SESSION['user_name'],
  'DELETE_BOOKING',
  "Deleted booking ID: $bookingId"
]);
```

### 2. Client Deletion
```php
// Similar process for clients
// 1. Archive to archived_clients
// 2. Soft delete (add deleted_at column if not exists)
// 3. Log action
```

### 3. Payment Deletion
```php
// Similar process for payments
// 1. Archive to archived_payments
// 2. Soft delete
// 3. Log action
```

## Retrieving Data

### Get Active Records (exclude deleted)
```php
// Only show non-deleted records
$bookings = $db->query("
  SELECT * FROM bookings 
  WHERE deleted_at IS NULL 
  ORDER BY created_at DESC
")->fetchAll();
```

### Get Archived Records
```php
// View archived bookings
$archived = $db->query("
  SELECT * FROM archived_bookings 
  ORDER BY deleted_at DESC
")->fetchAll();
```

### Get All Records (including deleted)
```php
// For admin audit purposes
$allBookings = $db->query("
  SELECT * FROM bookings 
  ORDER BY created_at DESC
")->fetchAll();
```

## Archive Module Features

### View Archived Data
- Access archived records from admin panel
- Filter by deletion date
- View deletion reason and who deleted it
- Search archived records

### Restore from Archive
```php
// Restore a booking from archive
$archivedId = $_GET['archived_id'];

// Get archived data
$archived = $db->query("
  SELECT * FROM archived_bookings WHERE id = ?
", [$archivedId])->fetch();

// Restore to main table
$db->query("
  INSERT INTO bookings (
    id, first_name, last_name, email, phone, event_date,
    guests, venue, package, special_requests, images, status,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
", [
  $archived['original_id'], $archived['first_name'], $archived['last_name'],
  $archived['email'], $archived['phone'], $archived['event_date'],
  $archived['guests'], $archived['venue'], $archived['package'],
  $archived['special_requests'], $archived['images'], $archived['status'],
  $archived['original_created_at'], $archived['original_updated_at']
]);

// Remove from archive
$db->query("DELETE FROM archived_bookings WHERE id = ?", [$archivedId]);

// Log restoration
$db->query("
  INSERT INTO audit_logs (user_id, user_name, activity, details)
  VALUES (?, ?, ?, ?)
", [
  $_SESSION['user_id'],
  $_SESSION['user_name'],
  'RESTORE_BOOKING',
  "Restored booking ID: " . $archived['original_id']
]);
```

## Audit Trail

All deletions are logged in `audit_logs` table with:
- User ID and name who performed deletion
- Activity type (DELETE_BOOKING, DELETE_CLIENT, etc.)
- Timestamp
- Additional details

## API Endpoints

### Delete Booking
```
DELETE /api/bookings/{id}
Body: { "reason": "Customer requested cancellation" }
Response: { "success": true, "message": "Booking archived successfully" }
```

### Get Archived Bookings
```
GET /api/bookings/archived
Response: { "archived": [...] }
```

### Restore Booking
```
POST /api/bookings/{archived_id}/restore
Response: { "success": true, "message": "Booking restored successfully" }
```

## Best Practices

1. **Always provide deletion reason** - helps with audit trail
2. **Check permissions** - only admins can delete
3. **Log all actions** - maintain audit trail
4. **Archive before delete** - never permanently delete
5. **Retention policy** - decide how long to keep archived data
6. **Regular backups** - backup archive tables regularly
