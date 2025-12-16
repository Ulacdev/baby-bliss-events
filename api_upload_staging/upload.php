<?php
require_once 'config.php';

// Check authentication for uploads
$user = authenticateWithToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

// Create uploads directory if it doesn't exist
$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$uploadedFiles = [];
$errors = [];

if (isset($_FILES['files']) || isset($_FILES['images'])) {
    $files = isset($_FILES['files']) ? $_FILES['files'] : $_FILES['images'];

    // Handle multiple files
    if (is_array($files['name'])) {
        $fileCount = count($files['name']);
        for ($i = 0; $i < $fileCount; $i++) {
            $result = handleFileUpload($files, $i, $uploadDir);
            if ($result['success']) {
                $uploadedFiles[] = $result['filename'];
            } else {
                $errors[] = $result['error'];
            }
        }
    } else {
        // Handle single file
        $result = handleFileUpload($files, null, $uploadDir);
        if ($result['success']) {
            $uploadedFiles[] = $result['filename'];
        } else {
            $errors[] = $result['error'];
        }
    }
}

if (!empty($errors)) {
    sendResponse(['error' => 'Upload failed: ' . implode(', ', $errors)], 400);
}

sendResponse([
    'message' => 'Files uploaded successfully',
    'files' => $uploadedFiles
], 201);

function handleFileUpload($files, $index, $uploadDir)
{
    $name = $index !== null ? $files['name'][$index] : $files['name'];
    $tmpName = $index !== null ? $files['tmp_name'][$index] : $files['tmp_name'];
    $error = $index !== null ? $files['error'][$index] : $files['error'];
    $size = $index !== null ? $files['size'][$index] : $files['size'];

    // Check for upload errors
    if ($error !== UPLOAD_ERR_OK) {
        return ['success' => false, 'error' => 'Upload error: ' . $error];
    }

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = $index !== null ? $files['type'][$index] : $files['type'];

    if (!in_array($fileType, $allowedTypes)) {
        return ['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'];
    }

    // Validate file size (max 5MB)
    if ($size > 5 * 1024 * 1024) {
        return ['success' => false, 'error' => 'File too large. Maximum size is 5MB.'];
    }

    // Generate unique filename
    $extension = pathinfo($name, PATHINFO_EXTENSION);
    $filename = uniqid('booking_', true) . '.' . $extension;
    $filepath = $uploadDir . $filename;

    if (move_uploaded_file($tmpName, $filepath)) {
        return ['success' => true, 'filename' => $filename];
    } else {
        return ['success' => false, 'error' => 'Failed to move uploaded file'];
    }
}
?>