<?php
// PHP Diagnostic and Fix Script
// This script will help identify and fix PHP configuration issues

header('Content-Type: text/html; charset=utf-8');
echo "<!DOCTYPE html><html><head><title>PHP Diagnostic</title></head><body>";
echo "<h1>PHP Diagnostic and Fix Tool</h1>";

// Check 1: PHP Version and Configuration
echo "<h2>1. PHP Configuration Check</h2>";
echo "PHP Version: " . phpversion() . "<br>";
echo "PHP SAPI: " . php_sapi_name() . "<br>";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "<br><br>";

// Check 2: Database Connection
echo "<h2>2. Database Connection Test</h2>";
try {
    $config = require_once 'config.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4",
        $config['username'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✅ Database connection successful<br>";

    // Check if baby_bliss database exists
    $stmt = $pdo->query("SELECT DATABASE() as current_db");
    $current_db = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Current database: " . $current_db['current_db'] . "<br>";

    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Users table exists<br>";

        // Check table structure
        $stmt = $pdo->query("DESCRIBE users");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Users table columns: ";
        $col_names = array_column($columns, 'Field');
        echo implode(', ', $col_names) . "<br>";
    } else {
        echo "❌ Users table does not exist<br>";
    }

} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
}

// Check 3: Test API Endpoint
echo "<h2>3. API Endpoint Test</h2>";
echo "Testing basic API response...<br>";

// Try to include and test the users.php file
try {
    ob_start();
    $_GET['action'] = 'list';
    include 'users.php';
    $output = ob_get_clean();

    if (strpos($output, 'error') !== false || strpos($output, 'Error') !== false) {
        echo "❌ API returned error: " . htmlspecialchars($output) . "<br>";
    } else {
        echo "✅ API response received<br>";
        echo "Response preview: " . substr($output, 0, 200) . "...<br>";
    }
} catch (Exception $e) {
    echo "❌ API test failed: " . $e->getMessage() . "<br>";
}

// Check 4: File Permissions
echo "<h2>4. File Permissions Check</h2>";
$files_to_check = ['config.php', 'users.php', '.htaccess'];
foreach ($files_to_check as $file) {
    if (file_exists($file)) {
        $perms = substr(sprintf('%o', fileperms($file)), -4);
        echo "$file: $perms<br>";
    } else {
        echo "$file: ❌ File not found<br>";
    }
}

// Check 5: Generate Fix Recommendations
echo "<h2>5. Fix Recommendations</h2>";
echo "<div style='background: #f0f0f0; padding: 10px; margin: 10px 0;'>";
echo "<h3>Common Fixes:</h3>";
echo "<ol>";
echo "<li><strong>Ensure XAMPP services are running:</strong><br>";
echo "   - Open XAMPP Control Panel<br>";
echo "   - Start Apache and MySQL services</li>";
echo "<li><strong>Check if PHP is enabled in Apache:</strong><br>";
echo "   - Open httpd.conf in Apache config<br>";
echo "   - Ensure these lines are uncommented:<br>";
echo "   &nbsp;&nbsp;LoadModule php_module modules/phpX.X.X.dll<br>";
echo "   &nbsp;&nbsp;AddHandler application/x-httpd-php .php<br>";
echo "   &nbsp;&nbsp;PHPIniDir \"C:/xampp/php\"</li>";
echo "<li><strong>Verify database setup:</strong><br>";
echo "   - Ensure 'baby_bliss' database exists<br>";
echo "   - Check if users table has proper structure</li>";
echo "<li><strong>Test direct API access:</strong><br>";
echo "   - Visit: http://localhost/api/users.php?action=list<br>";
echo "   - Should return JSON, not PHP errors</li>";
echo "</ol>";
echo "</div>";

// Auto-fix section
echo "<h2>6. Attempting Auto-Fix</h2>";
if (isset($_GET['autofix']) && $_GET['autofix'] === 'yes') {
    echo "Attempting to apply fixes...<br>";

    // Check if we can write to the directory
    if (is_writable('.')) {
        echo "✅ Directory is writable<br>";

        // Try to create a simple test API file
        $test_api_content = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

echo json_encode(["status" => "success", "message" => "PHP is working", "time" => date("Y-m-d H:i:s")]);
?>';

        if (file_put_contents('test_api.php', $test_api_content)) {
            echo "✅ Created test API file<br>";
        }

        // Try to fix .htaccess
        $htaccess_content = '<IfModule mod_rewrite.c>
RewriteEngine On

# Enable CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Route API calls
RewriteRule ^api/(.*)$ api/$1 [L,QSA]
</IfModule>';

        if (file_put_contents('.htaccess', $htaccess_content)) {
            echo "✅ Updated .htaccess file<br>";
        }

    } else {
        echo "❌ Directory is not writable<br>";
    }
}

echo "<h2>7. Next Steps</h2>";
echo "<p>After running this diagnostic:</p>";
echo "<ol>";
echo "<li>Review the results above</li>";
echo "<li>Fix any identified issues</li>";
echo "<li>Test API directly: <a href='test_api.php' target='_blank'>test_api.php</a></li>";
echo "<li>Try the update user function again</li>";
echo "</ol>";

echo "<p><a href='?autofix=yes'>🔧 Try Auto-Fix</a></p>";
echo "<p><a href='users.php?action=list' target='_blank'>🔗 Test Users API</a></p>";

echo "</body></html>";
?>