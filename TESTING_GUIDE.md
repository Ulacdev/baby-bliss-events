# Staff Module Testing Guide

## 🧪 Manual Testing

### 1. Test Database Migration

Visit in browser:

```
http://localhost/baby-bliss/api/migrate_staff.php
```

Expected output: ✓ checks for each table/column created

### 2. Test Staff API Endpoints

#### Get Staff Profile

```bash
curl -X GET http://localhost/baby-bliss/api/staff.php \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "staff": {...} }
```

#### Get Dashboard

```bash
curl -X GET http://localhost/baby-bliss/api/staff.php?action=dashboard \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "today_bookings": [...], "upcoming_count": N, "unread_messages": N }
```

#### Get Bookings

```bash
curl -X GET "http://localhost/baby-bliss/api/staff.php?action=bookings&status=upcoming&range=30" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "bookings": [...] }
```

#### Check In to Booking

```bash
curl -X PATCH http://localhost/baby-bliss/api/staff.php/1 \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checked_in_at": "2025-12-19T10:30:00Z",
    "status": "in-progress"
  }'

# Expected: { "success": true, "message": "Booking updated" }
```

#### Get Availability

```bash
curl -X GET http://localhost/baby-bliss/api/staff.php?action=availability \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "availability": [...] }
```

#### Set Availability

```bash
curl -X POST http://localhost/baby-bliss/api/staff.php?action=availability \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": 1,
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "is_available": true
  }'

# Expected: { "success": true, "message": "Availability updated" }
```

#### Send Message

```bash
curl -X POST http://localhost/baby-bliss/api/staff.php?action=messages \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": 2,
    "subject": "Service Update",
    "message": "I will arrive in 15 minutes"
  }'

# Expected: { "success": true, "message": "Message sent" }
```

### 3. Test React Components

#### Access Staff Dashboard

```
http://localhost:5173/staff/dashboard
```

Should show:

- ✅ Quick stats cards (today's bookings, upcoming, unread)
- ✅ Today's schedule list
- ✅ View Full Calendar button

#### Test Sidebar Toggle

- Click menu icon on mobile
- Desktop: Hover over sidebar for expand
- Press **Ctrl+B** to toggle collapse/expand
- Refresh page - state should persist

#### Access Calendar

```
http://localhost:5173/staff/calendar
```

Should show:

- ✅ Month calendar grid
- ✅ Booking indicators on days
- ✅ Previous/next month buttons
- ✅ View mode buttons (week/month)
- ✅ Upcoming bookings list

#### Access Bookings

```
http://localhost:5173/staff/bookings
```

Should show:

- ✅ Filter buttons (upcoming, assigned, past)
- ✅ Booking list with client name, time, location
- ✅ Status badges
- ✅ Click to open detail

#### Access Booking Detail

```
http://localhost:5173/staff/bookings/1
```

Should show:

- ✅ Check In button (if not checked in)
- ✅ Check Out button (if checked in)
- ✅ Booking details (time, location)
- ✅ Client info (phone, email)
- ✅ Staff notes textarea
- ✅ Save Notes button

#### Access Messages

```
http://localhost:5173/staff/messages
```

Should show:

- ✅ Left sidebar with conversations
- ✅ Chat area in the middle
- ✅ Message input at bottom
- ✅ Threaded conversations

#### Access Profile

```
http://localhost:5173/staff/profile
```

Should show:

- ✅ Profile info (name, email, phone)
- ✅ Edit button
- ✅ Weekly availability grid
- ✅ Availability toggle per day

### 4. Test Theme Toggle

- Switch between light/dark mode
- Verify all components update colors
- Check sidebar background colors

### 5. Test Keyboard Shortcuts

- Press **Ctrl+B** - Sidebar should collapse/expand
- Check localStorage: `staffSidebarCollapsed` should toggle

### 6. Test Mobile Responsiveness

- Resize browser to mobile width
- Menu button should appear
- Click menu to open/close sidebar
- Content should reflow properly

## 🔍 Common Issues & Fixes

### Issue: "Unauthorized" on API calls

**Solution**: Verify Bearer token is in Authorization header

```bash
-H "Authorization: Bearer <valid_token>"
```

### Issue: Sidebar not toggling

**Solution**:

1. Open DevTools (F12)
2. Check console for errors
3. Verify localStorage isn't disabled
4. Clear cache and refresh

### Issue: Bookings not appearing

**Solution**:

1. Check if staff user has bookings assigned
2. Verify `assigned_staff_id` matches staff user ID
3. Check API response in Network tab
4. Verify date range is correct

### Issue: Messages not syncing

**Solution**:

1. Check if recipient_id is valid
2. Verify sender and recipient are different users
3. Check messages table has data
4. Try refreshing page

### Issue: Dark mode not applying

**Solution**:

1. Check ThemeContext is working
2. Verify theme prop is being passed
3. Check Tailwind dark: prefix is enabled
4. Clear browser cache

## 📋 Database Query Tests

### Check Staff Users

```sql
SELECT id, name, email, role, availability_status FROM users WHERE role = 'staff';
```

### Check Bookings Assigned to Staff

```sql
SELECT id, client_id, assigned_staff_id, start_time, status
FROM bookings
WHERE assigned_staff_id = ?;
```

### Check Staff Availability

```sql
SELECT * FROM staff_availability WHERE staff_id = ?;
```

### Check Messages

```sql
SELECT * FROM messages
WHERE (sender_id = ? OR recipient_id = ?)
ORDER BY created_at DESC;
```

## ✅ Acceptance Criteria

- [ ] All 6 staff pages load without errors
- [ ] Sidebar collapse/expand works smoothly (300ms animation)
- [ ] Keyboard shortcut Ctrl+B toggles sidebar
- [ ] localStorage persists sidebar state across page reloads
- [ ] API endpoints return correct data
- [ ] Check-in/out updates booking status
- [ ] Messages send and receive
- [ ] Dark mode applies to all components
- [ ] Mobile menu works on small screens
- [ ] Responsive layout works on tablets
- [ ] No console errors or warnings

## 🚀 Performance Testing

### Lighthouse Audit

1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run audit for each staff page
4. Target: 80+ score

### Load Time

- Dashboard should load in < 2 seconds
- Bookings should load in < 1.5 seconds
- Sidebar toggle should be instant (< 300ms animation)

## 📱 Device Testing

### Desktop

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Tablet

- [ ] iPad
- [ ] Android tablet

### Mobile

- [ ] iPhone (latest)
- [ ] Android phone (latest)

---

**Testing Date**: December 19, 2025
**Tester**: QA Team
**Status**: Ready for QA
