@echo off
echo ================================================
echo Baby Bliss - Database and API Setup Script
echo ================================================
echo.

echo Step 1: Testing database connection...
curl -s http://localhost/api/test.php
echo.
echo.

echo Step 2: Setting up database...
echo If the above shows database connection error, you need to:
echo 1. Open phpMyAdmin: http://localhost/phpmyadmin
echo 2. Create a new database named 'baby_bliss'
echo 3. Import the database.sql file from api\database.sql
echo.
echo If MySQL is not running:
echo 1. Open XAMPP Control Panel
echo 2. Start MySQL service
echo.

echo Step 3: After database setup, test API again...
echo The API should work at: http://localhost/api/auth.php?action=session
echo.

pause