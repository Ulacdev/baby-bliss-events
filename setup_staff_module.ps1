#!/usr/bin/env powershell

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Baby Bliss Staff Module Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run database migration
Write-Host "[1/3] Running database migration..." -ForegroundColor Yellow
$migrateUrl = "http://localhost/baby-bliss/api/migrate_staff.php"

try {
    $response = Invoke-WebRequest -Uri $migrateUrl -UseBasicParsing
    Write-Host $response.Content -ForegroundColor Green
} catch {
    Write-Host "Error running migration: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/3] Staff module files have been created:" -ForegroundColor Yellow
Write-Host "  - API: /api/staff.php" -ForegroundColor Cyan
Write-Host "  - Pages:" -ForegroundColor Cyan
Write-Host "    - /src/pages/staff/Dashboard.tsx" -ForegroundColor Cyan
Write-Host "    - /src/pages/staff/Calendar.tsx" -ForegroundColor Cyan
Write-Host "    - /src/pages/staff/Bookings.tsx" -ForegroundColor Cyan
Write-Host "    - /src/pages/staff/BookingDetail.tsx" -ForegroundColor Cyan
Write-Host "    - /src/pages/staff/Messages.tsx" -ForegroundColor Cyan
Write-Host "    - /src/pages/staff/Profile.tsx" -ForegroundColor Cyan
Write-Host "  - Components:" -ForegroundColor Cyan
Write-Host "    - /src/components/StaffSidebar.tsx" -ForegroundColor Cyan

Write-Host ""
Write-Host "[3/3] Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update user authentication to include role field" -ForegroundColor White
Write-Host "2. Create test staff user with role='staff'" -ForegroundColor White
Write-Host "3. Ensure admin user has role='admin'" -ForegroundColor White
Write-Host "4. Test staff routes at /staff/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Keyboard Shortcuts:" -ForegroundColor Yellow
Write-Host "  - Ctrl+B: Toggle sidebar collapse/expand" -ForegroundColor White
Write-Host ""
Write-Host "Staff Features:" -ForegroundColor Yellow
Write-Host "  ✓ Dashboard with today's bookings & metrics" -ForegroundColor Green
Write-Host "  ✓ Calendar view for scheduling" -ForegroundColor Green
Write-Host "  ✓ Booking management with check-in/out" -ForegroundColor Green
Write-Host "  ✓ Messaging system" -ForegroundColor Green
Write-Host "  ✓ Profile & availability settings" -ForegroundColor Green
Write-Host ""
