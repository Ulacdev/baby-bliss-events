@echo off
echo Copying API files to XAMPP htdocs directory...
echo.

REM Check if XAMPP directory exists
if not exist "C:\xampp3\htdocs\api" (
    mkdir "C:\xampp3\htdocs\api"
    echo Created API directory in XAMPP htdocs
)

REM Copy all API files
xcopy "api\*" "C:\xampp3\htdocs\api\" /E /Y /Q

echo.
echo API files copied successfully to C:\xampp3\htdocs\api\
echo.
echo Next steps:
echo 1. Make sure XAMPP Apache and MySQL are running
echo 2. Import the database from api\database.sql using phpMyAdmin
echo 3. Start the Vite dev server: npm run dev
echo.
pause