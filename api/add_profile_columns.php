<?php
require_once 'config.php';

echo "Adding profile columns to users table...\n";

$conn = getDBConnection();

// Check if first_name column exists, if not add it
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'first_name'");
if ($result->num_rows == 0) {
    echo "Adding first_name column...\n";
    $conn->query("ALTER TABLE users ADD COLUMN first_name VARCHAR(100)");
    echo "✅ first_name column added\n";
} else {
    echo "✅ first_name column already exists\n";
}

// Check if last_name column exists, if not add it
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'last_name'");
if ($result->num_rows == 0) {
    echo "Adding last_name column...\n";
    $conn->query("ALTER TABLE users ADD COLUMN last_name VARCHAR(100)");
    echo "✅ last_name column added\n";
} else {
    echo "✅ last_name column already exists\n";
}

// Check if bio column exists, if not add it
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'bio'");
if ($result->num_rows == 0) {
    echo "Adding bio column...\n";
    $conn->query("ALTER TABLE users ADD COLUMN bio TEXT");
    echo "✅ bio column added\n";
} else {
    echo "✅ bio column already exists\n";
}

echo "Profile columns migration completed successfully! 🎉\n";
?>