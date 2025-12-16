@echo off
REM Script to copy API files for upload to InfinityFree
REM This helps organize files to upload via cPanel File Manager

setlocal enabledelayedexpansion

set "SOURCE_DIR=api"
set "STAGING_DIR=api_upload_staging"

REM Create staging directory
if not exist "%STAGING_DIR%" mkdir "%STAGING_DIR%"

echo.
echo ===================================
echo InfinityFree API Files Upload Helper
echo ===================================
echo.
echo Source: %SOURCE_DIR%
echo Staging: %STAGING_DIR%
echo.

REM Copy critical files first
echo Copying CRITICAL files...
copy "%SOURCE_DIR%\config.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] config.php
copy "%SOURCE_DIR%\auth.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] auth.php
copy "%SOURCE_DIR%\index.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] index.php
copy "%SOURCE_DIR%\test_cors.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] test_cors.php
copy "%SOURCE_DIR%\.htaccess" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] .htaccess

echo.
echo Copying OTHER important files...
copy "%SOURCE_DIR%\bookings.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] bookings.php
copy "%SOURCE_DIR%\clients.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] clients.php
copy "%SOURCE_DIR%\messages.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] messages.php
copy "%SOURCE_DIR%\users.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] users.php
copy "%SOURCE_DIR%\dashboard.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] dashboard.php
copy "%SOURCE_DIR%\calendar.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] calendar.php
copy "%SOURCE_DIR%\financial.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] financial.php
copy "%SOURCE_DIR%\profile.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] profile.php
copy "%SOURCE_DIR%\settings.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] settings.php
copy "%SOURCE_DIR%\payments.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] payments.php
copy "%SOURCE_DIR%\reports.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] reports.php
copy "%SOURCE_DIR%\archive.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] archive.php
copy "%SOURCE_DIR%\audit.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] audit.php
copy "%SOURCE_DIR%\upload.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] upload.php
copy "%SOURCE_DIR%\public_events.php" "%STAGING_DIR%\" >nul 2>&1 && echo [OK] public_events.php

echo.
echo ===================================
echo.
echo All files staged in: %STAGING_DIR%
echo.
echo Next Steps:
echo 1. Go to InfinityFree cPanel
echo 2. Click File Manager
echo 3. Navigate to public_html/api/
echo 4. Click Upload
echo 5. Select ALL files from: %cd%\%STAGING_DIR%
echo 6. Upload
echo.
pause
