# Staff Module Implementation Guide

## Overview

A complete staff side module with MVP features for managing bookings, schedules, and communications.

## 📦 What's Included

### Backend (PHP APIs)

- **`/api/staff.php`** - Main staff API endpoint handling:
  - Dashboard data (today's bookings, metrics)
  - Booking management (list, detail, check-in/out)
  - Calendar events
  - Messaging
  - Availability settings
  - Profile management

### Frontend (React Components)

- **Dashboard** - Overview of daily schedule and metrics
- **Calendar** - Month/week view with booking indicators
- **Bookings** - List and detail views with check-in/out
- **Messages** - Chat interface for client/admin communication
- **Profile** - Staff profile and availability management
- **StaffSidebar** - Navigation with collapse/expand UI

### Database Tables

- `staff_availability` - Weekly working hours
- `staff_notifications` - Notification log
- `staff_timesheets` - Time tracking (Phase 2)
- Updates to `users`, `bookings` tables

## 🚀 Quick Start

### 1. Run Database Migration

```powershell
# Via API
http://localhost/baby-bliss/api/migrate_staff.php

# Or directly in your database tool
php api/migrate_staff.php
```

### 2. Create Staff Users

Update your user registration/admin panel to assign `role = 'staff'` to users.

### 3. Test Routes

```
/staff/dashboard       - Staff home
/staff/calendar        - Scheduling view
/staff/bookings        - My bookings list
/staff/bookings/:id    - Booking detail
/staff/messages        - Messaging
/staff/profile         - Profile & settings
```

## 🎛️ Configuration

### Keyboard Shortcuts

- **Ctrl+B** - Toggle sidebar collapse/expand

### localStorage Keys

- `staffSidebarCollapsed` - Sidebar state persistence
- `adminSidebarCollapsed` - Admin sidebar state

## 🔌 API Endpoints

### Authentication Required (Bearer token)

All endpoints require a valid auth token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints

#### GET /api/staff/me

Get current staff profile

```json
Response: { "staff": {...} }
```

#### GET /api/staff/dashboard

Get dashboard metrics and today's bookings

```json
Response: {
  "today_bookings": [...],
  "upcoming_count": 5,
  "unread_messages": 2
}
```

#### GET /api/staff/bookings?status=upcoming&range=30

List staff bookings with optional filters

```json
Response: { "bookings": [...] }
```

#### GET /api/staff/bookings/:id

Get booking details

```json
Response: { "booking": {...} }
```

#### PATCH /api/staff/bookings/:id

Update booking (check-in, check-out, notes)

```json
Body: {
  "checked_in_at": "2025-12-19T10:00:00Z",
  "status": "in-progress",
  "notes": "..."
}
```

#### GET /api/staff/availability

Get weekly availability schedule

```json
Response: { "availability": [...] }
```

#### POST /api/staff/availability

Set availability for a day

```json
Body: {
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "is_available": true
}
```

#### GET /api/staff/messages

Get messages

```json
Response: { "messages": [...] }
```

#### POST /api/staff/messages

Send a message

```json
Body: {
  "recipient_id": 5,
  "message": "Hello client"
}
```

## 🎨 UI/UX Improvements

### Sidebar Enhancements

✅ **Smooth Collapse/Expand**

- Animated transitions (300ms)
- Hover-to-expand on desktop
- Keyboard shortcut (Ctrl+B)
- Persistent state via localStorage

✅ **Responsive Design**

- Mobile: Overlay sidebar with menu button
- Desktop: Collapsible sidebar with icons
- Tablet: Adaptive layout

✅ **Theme Support**

- Dark mode fully integrated
- Accessible color contrasts
- Smooth theme transitions

### Accessibility

- Keyboard navigation throughout
- Tooltip titles on collapsed icons
- Semantic HTML
- ARIA labels on interactive elements

## 📊 Phase 2 Features (Future)

- [ ] Time tracking / timesheets
- [ ] Staff ratings & reviews
- [ ] Payout history
- [ ] Shift swaps
- [ ] Task checklists per booking
- [ ] Offline mode / PWA
- [ ] Internal staff chat
- [ ] Performance reports

## 🔐 Security Notes

### Current Implementation

- Bearer token validation
- Role-based access control (role='staff')
- User ownership verification on bookings

### Recommended Additions

- JWT token with expiration
- Rate limiting on API endpoints
- CORS configuration
- HTTPS enforcement
- Audit logging for sensitive actions

## 🐛 Troubleshooting

### Bookings not loading?

- Verify auth token is valid
- Check `assigned_staff_id` in bookings table
- Ensure API endpoint is accessible

### Sidebar not toggling?

- Clear browser cache/localStorage
- Check for JavaScript errors in console
- Verify DOM element rendering

### Messages not appearing?

- Confirm sender/recipient IDs are correct
- Check messages table for data
- Verify recipient relationship

## 📝 Notes

- API uses `NOW()` and `CURDATE()` MySQL functions
- Timestamps stored in UTC
- All responses are JSON
- Error responses include descriptive messages

## 🔄 Integration Checklist

- [ ] Database migration applied
- [ ] Staff users created with role='staff'
- [ ] API endpoints accessible
- [ ] React routes loaded correctly
- [ ] Sidebar components integrated
- [ ] Authentication tokens working
- [ ] Keyboard shortcuts functional
- [ ] Responsive layout tested
- [ ] Dark mode verified
- [ ] Error handling tested

---

Generated: December 19, 2025
Version: 1.0.0 MVP
