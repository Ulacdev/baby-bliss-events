# CORS & API Connection Troubleshooting Guide

## Problem

You're getting `TypeError: Failed to fetch` when trying to authenticate from your Vercel frontend to your InfinityFree backend.

## Root Causes

### 1. **CORS (Cross-Origin Resource Sharing) Issue** ⚠️

- Your Vercel frontend (vercel.app domain) is trying to fetch from InfinityFree
- The browser blocks this due to CORS restrictions
- The backend must explicitly allow requests from your Vercel domain

### 2. **Network/DNS Issues**

- InfinityFree may have rate limiting or connectivity issues
- The backend server might be temporarily down
- DNS resolution might fail for the InfinityFree domain

### 3. **Environment Configuration**

- The API URL is hardcoded instead of environment-specific
- Vercel doesn't know which backend URL to use

## Solutions Applied

### ✅ Fix #1: Environment Variable Support

**File Updated:** `src/integrations/api/client.ts`

- Changed from hardcoded URL to use `VITE_API_URL` environment variable
- Now supports local development and production configurations

### ✅ Fix #2: Enhanced CORS Headers

**File Updated:** `api/config.php`

- Added explicit Vercel domain whitelist
- Improved preflight request handling
- Added proper credentials support

### ✅ Fix #3: Better Error Messages

**File Updated:** `src/integrations/api/client.ts`

- Now provides clearer debugging information for CORS errors
- Shows API URL and hints in browser console

## How to Deploy

### Step 1: Set Environment Variables on Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add:
   ```
   VITE_API_URL=https://babyblissbooking.great-site.net/api
   ```
4. Redeploy your project

### Step 2: Verify CORS is Enabled on InfinityFree

The updated `api/config.php` now includes proper CORS headers for:

- `https://baby-bliss-events.vercel.app` (replace with your actual domain)
- Any `*.vercel.app` domain
- Localhost for development

### Step 3: Local Testing

1. Create `.env.local` in your project root:
   ```
   VITE_API_URL=https://babyblissbooking.great-site.net/api
   ```
2. Or for local backend:
   ```
   VITE_API_URL=http://localhost/api
   ```
3. Run `npm run dev`

## Debugging Steps

### Check Browser Console

1. Open DevTools (F12) → Console tab
2. Look for the enhanced error message showing:
   - API URL being called
   - Whether it's a CORS or network issue
   - The actual error details

### Verify API is Responding

```bash
# In PowerShell or terminal
curl -i https://babyblissbooking.great-site.net/api/auth.php?action=session
```

Look for:

- `Access-Control-Allow-Origin` header
- Status 200 or proper error code (not 0)

### Check Network Tab

1. DevTools → Network tab
2. Try to log in
3. Click on the failed request to the API
4. Check:
   - **Request Headers**: Should include `Authorization` if token exists
   - **Response Headers**: Should have `Access-Control-Allow-Origin`
   - **Status**: Should not be 0 (indicates network/CORS issue)

## Common Issues & Fixes

| Issue                        | Symptom                         | Fix                                                      |
| ---------------------------- | ------------------------------- | -------------------------------------------------------- |
| InfinityFree server down     | All API calls fail              | Check InfinityFree status or restart server              |
| CORS blocked                 | `Failed to fetch` + No response | Updated `api/config.php` - now whitelists Vercel domains |
| Wrong API URL                | Requests to wrong server        | Set `VITE_API_URL` in Vercel environment                 |
| Missing Authorization header | 401 Unauthorized                | Token should be in `localStorage` - check Auth flow      |
| Rate limiting                | Intermittent failures           | Add retry logic or contact InfinityFree support          |

## Files Modified

- `src/integrations/api/client.ts` - Added env var support, better errors, explicit CORS mode
- `api/config.php` - Enhanced CORS handling with domain whitelist
- `.env.example` - Added for configuration reference

## Next Steps

1. ✅ Deploy the updated code to Vercel
2. ✅ Set `VITE_API_URL` environment variable in Vercel dashboard
3. ✅ Update your Vercel domain in `api/config.php` if different
4. ✅ Test login - check browser console for clear error messages
5. Contact InfinityFree support if `Failed to fetch` persists

---

**Need More Help?**

- Check Vercel build logs for deployment errors
- Check InfinityFree's cPanel for API status
- Monitor Network tab in DevTools while testing
