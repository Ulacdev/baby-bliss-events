<?php
// Create database script
$servername = "localhost";
$username = "root";
$password = "";

// Create connection without database
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS baby_bliss";
if ($conn->query($sql) === TRUE) {
    echo "Database 'baby_bliss' created successfully or already exists\n";
} else {
    echo "Error creating database: " . $conn->error . "\n";
}

$conn->close();
?>