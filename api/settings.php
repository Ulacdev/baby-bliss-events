<?php
require_once 'config.php';

// Check authentication only for PUT requests (updates)
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PUT') {
    // Temporarily disable auth for testing
    /*
    $user = authenticateWithToken();
    if (!$user) {
        error_log("Settings PUT: Unauthorized - no valid token");
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    error_log("Settings PUT: Authenticated user: " . $user['user_id']);
    */
}

// For GET requests, allow public access but only return public settings

switch ($method) {
    case 'GET':
        getSettings();
        break;
    case 'PUT':
        updateSettings();
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function getSettings()
{
    $conn = getDBConnection();

    // For now, we'll store settings in a simple key-value table
    // If the table doesn't exist, return default settings
    $result = $conn->query("SHOW TABLES LIKE 'settings'");
    if ($result->num_rows == 0) {
        // Return default settings with prefixed keys
        sendResponse([
            'settings' => [
                'general_site_title' => 'Baby Bliss',
                'general_logo_url' => '',
                'general_favicon_url' => '',
                'general_logo_size' => '32',
                'general_company_name' => 'Baby Bliss Events',
                'general_company_email' => 'info@babybliss.com',
                'general_company_phone' => '(555) 123-4567',
                'navbar_nav_home_text' => 'Home',
                'navbar_nav_about_text' => 'About',
                'navbar_nav_gallery_text' => 'Events',
                'navbar_nav_book_text' => 'Book Now',
                'navbar_nav_contact_text' => 'Contact',
                'navbar_nav_login_text' => 'Login',
                'footer_footer_text' => '© 2024 Baby Bliss Events. All rights reserved.',
                'footer_footer_address' => '123 Main Street, City, State 12345'
            ]
        ]);
    }

    // Get only allowed settings (with prefixes as stored in database)
    $allowed_keys = [
        'general_site_title',
        'general_logo_url',
        'general_favicon_url',
        'general_logo_size',
        'general_company_name',
        'general_company_email',
        'general_company_phone',
        'navbar_nav_home_text',
        'navbar_nav_about_text',
        'navbar_nav_gallery_text',
        'navbar_nav_book_text',
        'navbar_nav_contact_text',
        'navbar_nav_login_text',
        'footer_footer_text',
        'footer_footer_address'
    ];

    $placeholders = str_repeat('?,', count($allowed_keys) - 1) . '?';
    $stmt = $conn->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ($placeholders)");
    $stmt->bind_param(str_repeat('s', count($allowed_keys)), ...$allowed_keys);
    $stmt->execute();
    $result = $stmt->get_result();

    $settings = [];
    while ($row = $result->fetch_assoc()) {
        $value = json_decode($row['setting_value'], true);
        if ($value === null && json_last_error() !== JSON_ERROR_NONE) {
            // If not valid JSON, use as plain string (for backward compatibility)
            $value = $row['setting_value'];
        }
        $settings[$row['setting_key']] = $value;
    }

    sendResponse(['settings' => $settings]);
}

function updateSettings()
{
    $input = getJsonInput();

    if (!isset($input['settings']) || !is_array($input['settings'])) {
        sendResponse(['error' => 'Invalid settings data'], 400);
    }

    $conn = getDBConnection();
    $settings = $input['settings'];

    // Define sections for settings (with prefixes)
    $sections = [
        'general' => ['general_site_title', 'general_logo_url', 'general_favicon_url', 'general_logo_size', 'general_company_name', 'general_company_email', 'general_company_phone'],
        'navbar' => ['navbar_nav_home_text', 'navbar_nav_about_text', 'navbar_nav_gallery_text', 'navbar_nav_book_text', 'navbar_nav_contact_text', 'navbar_nav_login_text'],
        'footer' => ['footer_footer_text', 'footer_footer_address']
    ];

    // Begin transaction
    $conn->begin_transaction();

    try {
        foreach ($settings as $key => $value) {
            // Determine section for this setting
            $section = 'general'; // default
            foreach ($sections as $sec => $keys) {
                if (in_array($key, $keys)) {
                    $section = $sec;
                    break;
                }
            }

            // Convert value to JSON if it's an array/object, otherwise store as string
            $settingValue = is_array($value) || is_object($value) ? json_encode($value) : (string) $value;

            // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both insert and update
            $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value, section) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), section = VALUES(section)");
            $stmt->bind_param("sss", $key, $settingValue, $section);
            $stmt->execute();
            $stmt->close();
        }

        $conn->commit();

        // Log the activity
        logAudit('Settings Updated', 'Settings were updated via admin panel');

        sendResponse(['message' => 'Settings updated successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Settings update failed: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update settings'], 500);
    }
}
?>