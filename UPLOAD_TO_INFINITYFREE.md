# Quick Upload Guide - InfinityFree

## Your Database Credentials (Confirmed ✅)

- **Hostname:** sql100.infinityfree.com
- **Username:** if0_40697563
- **Password:** nEedRr5f39Aby
- **Database:** if0_40697563_baby_bliss

---

## Option 1: Upload via cPanel File Manager (Easiest for Beginners)

### Step 1: Access cPanel

1. Go to https://cpanel.infinityfree.com (or your control panel link)
2. Log in with your InfinityFree credentials

### Step 2: Open File Manager

1. Click **File Manager**
2. Click **public_html** folder
3. You should see a folder list

### Step 3: Create API Folder (if not exists)

1. Right-click → **Create New Folder**
2. Name: `api`
3. Click **Create**

### Step 4: Upload PHP Files

These are the **ESSENTIAL** files to upload from your local `api/` folder:

**Critical files (MUST upload):**

- ✅ `config.php` - Database & CORS setup
- ✅ `auth.php` - Login/authentication
- ✅ `index.php` - API router
- ✅ `.htaccess` - Server rules
- ✅ `test_cors.php` - Diagnostic tool

**Other important files (upload these too):**

- `bookings.php`
- `clients.php`
- `messages.php`
- `users.php`
- `dashboard.php`
- `calendar.php`
- `financial.php`
- `profile.php`
- `settings.php`
- `payments.php`
- `reports.php`
- `archive.php`
- `audit.php`
- `upload.php`
- `public_events.php`

**Steps to upload:**

1. Click into the `api/` folder
2. Click **Upload** button
3. Select files from your `C:\Users\John Carlo\Downloads\baby-bliss-ui-kit-main\baby-bliss-ui-kit-main\api\` folder
4. You can select multiple files at once
5. Click **Upload**

### Step 5: Don't Upload These

- ❌ `vendor/` folder (upload separately if needed, or skip)
- ❌ `composer.json` and `composer.lock` (upload if you have Composer installed)
- ❌ `Screenshot 2025-12-17 015504.png` (just a screenshot)
- ❌ `setup.php`, `create_db.php`, `migrate.php` (only for setup, not needed for running)

---

## Option 2: Upload via FTP (Faster for Many Files)

### Required: FTP Credentials

Get these from InfinityFree cPanel → **FTP Accounts**

### Using FileZilla (Free FTP Client)

1. Download: https://filezilla-project.org/
2. File → Site Manager → New Site
3. Fill in:
   - **Protocol:** FTP
   - **Host:** ftp.babyblissbooking.great-site.net (or your domain)
   - **Port:** 21
   - **Username:** Your FTP username
   - **Password:** Your FTP password
4. Click **Connect**
5. Navigate to `public_html/api/`
6. Drag-and-drop PHP files from local folder

---

## Step 6: Verify Upload (Critical!)

### Test 1: Check if Files Exist

In your browser, visit:

```
https://babyblissbooking.great-site.net/api/test_cors.php
```

You should see:

```json
{
  "status": "success",
  "message": "API is working!",
  "php_version": "7.4.x",
  ...
}
```

**If you see:**

- ✅ JSON response → **Files uploaded successfully!** ✅
- ❌ 404 error → Files not uploaded, try again
- ❌ Blank page → PHP error, check InfinityFree error logs
- ❌ "Connection refused" → Server issue

### Test 2: Check Auth Endpoint

If test_cors.php works, try:

```
https://babyblissbooking.great-site.net/api/auth.php?action=session
```

Should return JSON (might have error about no session, but that's OK - means it's responding)

---

## Step 7: Back to Vercel

Once files are uploaded and test_cors.php returns JSON:

1. Go to Vercel dashboard
2. Redeploy the project
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try login again

---

## Troubleshooting

### Problem: "Failed to fetch" still after upload

**Step 1:** Check browser DevTools (F12) → Network tab

- Find request to `auth.php`
- Click it
- Check **Status Code**:
  - `0` = Network/CORS issue
  - `500` = Server error (check error logs)
  - `200` = Success (check Response body)

### Problem: 404 error on test_cors.php

- Files not uploaded to right location
- Path should be: `public_html/api/test_cors.php`
- Use cPanel File Manager to verify files exist

### Problem: Blank page or "Internal Server Error"

1. In cPanel, find **Error Logs** or **Raw Logs**
2. Check for PHP errors
3. Might need to enable PHP extensions (contact InfinityFree support)

---

## Quick Checklist Before Trying Login Again

- [ ] Accessed InfinityFree cPanel
- [ ] Created `api/` folder in `public_html/`
- [ ] Uploaded PHP files to `public_html/api/`
- [ ] Visited `https://babyblissbooking.great-site.net/api/test_cors.php` in browser
- [ ] Saw JSON response with "status": "success"
- [ ] Redeployed on Vercel
- [ ] Cleared browser cache
- [ ] Tried login again
- [ ] Check DevTools Console for error message

---

## Need Help?

Share screenshot of:

1. cPanel File Manager showing files in `api/` folder
2. Browser tab showing test_cors.php result
3. DevTools Console error when trying to login
4. DevTools Network tab showing auth.php request details

Then we can debug further!
