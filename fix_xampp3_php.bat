@echo off
echo ===========================================
echo XAMPP3 PHP Configuration Fix Script
echo ===========================================

echo.
echo Step 1: Checking if XAMPP3 directory exists...
if not exist "C:\xampp3\" (
    echo ERROR: XAMPP3 not found at C:\xampp3\
    echo Please install XAMPP3 or adjust the path in this script.
    pause
    exit /b 1
)

echo XAMPP3 found at C:\xampp3\

echo.
echo Step 2: Starting Apache and MySQL services...
"C:\xampp3\apache\bin\httpd.exe" -k start
"C:\xampp3\mysql\bin\mysqld.exe" --defaults-file="C:\xampp3\mysql\bin\my.ini" --standalone --console

echo.
echo Step 3: Checking PHP module in Apache configuration...
type "C:\xampp3\apache\conf\httpd.conf" | findstr /i "php"

echo.
echo Step 4: Testing PHP execution...
echo Creating test file...

echo ^<?php echo "PHP is working!"; ?^> > "C:\xampp3\htdocs\php_test.php"

echo.
echo Step 5: Opening diagnostic tool...
echo Please visit: http://localhost/php_diagnostic_and_fix.php
echo This will help identify and fix any remaining issues.

echo.
echo Step 6: Testing database connection...
echo Please ensure the baby_bliss database is set up.

echo.
echo ===========================================
echo Setup Instructions:
echo ===========================================
echo 1. Visit http://localhost/php_diagnostic_and_fix.php
echo 2. Click "Try Auto-Fix" to apply automatic fixes
echo 3. Test the API at http://localhost/api/users.php?action=list
echo 4. Try the update user function in your application
echo.
echo If issues persist, check:
echo - Apache error logs at C:\xampp3\apache\logs\error.log
echo - PHP error logs at C:\xampp3\php\logs\php_error_log
echo ===========================================

pause