# InfinityFree API Setup & Troubleshooting

## Quick Diagnostics

### Test 1: Check if API is Accessible

Visit this URL in your browser (replace domain with yours):

```
https://babyblissbooking.great-site.net/api/test_cors.php
```

You should see a JSON response like:

```json
{
  "status": "success",
  "message": "API is working!",
  "php_version": "7.4.x",
  "server": "Apache/2.4.x",
  "method": "GET",
  "origin": "Direct access"
}
```

**If you see an error or blank page:**

- InfinityFree may have restrictions or the files aren't uploaded
- Check cPanel → File Manager to ensure `api/` folder exists
- Verify `api/config.php` and `api/auth.php` are uploaded

### Test 2: Check CORS Headers

Open browser DevTools (F12) and run:

```javascript
fetch("https://babyblissbooking.great-site.net/api/test_cors.php")
  .then((r) => {
    console.log("Status:", r.status);
    console.log("CORS Header:", r.headers.get("Access-Control-Allow-Origin"));
    return r.json();
  })
  .then((d) => console.log("Response:", d))
  .catch((e) => console.error("Error:", e));
```

Look for `Access-Control-Allow-Origin: *` in the response.

---

## InfinityFree Specific Issues & Solutions

### Issue 1: "Failed to Fetch" Error

**Cause:** CORS blocked or server not responding

**Solutions:**

1. **Verify files are uploaded to InfinityFree cPanel:**

   - Go to cPanel → File Manager
   - Navigate to `public_html/api/`
   - Check that `auth.php`, `config.php`, `test_cors.php` exist
   - If missing, upload them via FTP or cPanel File Manager

2. **InfinityFree .htaccess restrictions:**
   - Create/edit `.htaccess` in your `public_html/api/` folder
   - Add this content:
   ```apache
   <FilesMatch "\.php$">
       Header always set Access-Control-Allow-Origin "*"
       Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
       Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
   </FilesMatch>
   ```

### Issue 2: Database Connection Fails

**Error:** "Database connection failed"

**Check in InfinityFree cPanel:**

1. Go to **MySQL Databases** section
2. Verify your database credentials:
   - Host: `sql100.infinityfree.com` or similar
   - Username: Check exact name (usually `if0_xxxxx`)
   - Password: Correct password
   - Database: Check exact name
3. Test connection with a simple script:
   ```php
   <?php
   $conn = new mysqli('sql100.infinityfree.com', 'if0_40697563', 'nEedRr5f39Aby', 'if0_40697563_baby_bliss');
   if ($conn->connect_error) {
       die('Connection failed: ' . $conn->connect_error);
   }
   echo 'Database connection successful!';
   ```

### Issue 3: File Permissions

**Cause:** API files not executable

**Fix in InfinityFree cPanel:**

1. File Manager → Navigate to `api/` folder
2. Select files: `auth.php`, `config.php`
3. Click "Change Permissions" (wrench icon)
4. Set to **644** (readable by everyone)

### Issue 4: PHP Version Issues

**Check your PHP version:**

1. In InfinityFree cPanel, find **PHP Options** or **PHP Selector**
2. Ensure PHP 7.4+ is selected (required for `match` statements and modern features)
3. Ensure these extensions are enabled:
   - mysqli
   - json
   - filter
   - hash

---

## Upload Instructions

### Via FTP (Recommended)

1. Get FTP credentials from InfinityFree cPanel → **FTP Accounts**
2. Use FileZilla or WinSCP:
   - Host: `ftp.babyblissbooking.great-site.net`
   - Username: FTP account
   - Password: FTP password
3. Connect to `public_html/api/`
4. Upload all `.php` files from your local `api/` folder

### Via cPanel File Manager

1. Log into InfinityFree cPanel
2. File Manager → Go to `public_html/`
3. Create folder `api` if missing
4. Upload all `.php` files
5. Set permissions to 644

---

## Debugging with Logs

### Enable Error Logging

Add this to top of `api/config.php`:

```php
ini_set('log_errors', 1);
ini_set('error_log', dirname(__FILE__) . '/error.log');
```

### Check Error Logs

1. In InfinityFree cPanel, find **Error Log** or **Logs**
2. Check for PHP errors
3. Share errors with your developer

---

## Quick Fix Checklist

- [ ] Run `https://babyblissbooking.great-site.net/api/test_cors.php` in browser
- [ ] See JSON response with `"status": "success"`
- [ ] Verify database credentials in cPanel MySQL section
- [ ] Check all `.php` files uploaded to `api/` folder
- [ ] Set file permissions to 644
- [ ] PHP version is 7.4+
- [ ] `.htaccess` has CORS headers (optional but helps)
- [ ] Set `VITE_API_URL` in Vercel to exact domain
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Try login again

---

## Still Having Issues?

1. **Open DevTools (F12) → Network tab**
2. **Attempt login**
3. **Find the failed request to `auth.php`**
4. Check:
   - **Status code**: What number? (0 = network error, 500 = server error, 403 = forbidden)
   - **Response**: What does it say?
   - **Response Headers**: Does it have `Access-Control-Allow-Origin`?
5. Share screenshot with your developer

---

## Files to Verify on InfinityFree

Ensure these exist in `public_html/api/`:

- ✅ `config.php` - Main configuration
- ✅ `auth.php` - Authentication endpoint
- ✅ `test_cors.php` - Diagnostic test
- ✅ `index.php` - API router (if using)
- ✅ Other required PHP files

If any are missing, upload them from your local `api/` folder.
