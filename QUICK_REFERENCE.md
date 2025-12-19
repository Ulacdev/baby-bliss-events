# Staff Module - Quick Reference Card

## 🚀 Getting Started (5 minutes)

### 1. Run Migration

```
Open: http://localhost/baby-bliss/api/migrate_staff.php
```

### 2. Access Staff Dashboard

```
URL: http://localhost:5173/staff/dashboard
Auth: Requires Bearer token in Authorization header
```

### 3. Try Sidebar Toggle

```
Keyboard: Press Ctrl+B to collapse/expand
Mouse: Hover over sidebar on desktop to auto-expand
Mobile: Click menu button (☰) at top-left
```

---

## 📍 Staff Routes

| Route                 | Purpose          | Status    |
| --------------------- | ---------------- | --------- |
| `/staff/dashboard`    | Home & metrics   | ✅ Active |
| `/staff/calendar`     | Schedule view    | ✅ Active |
| `/staff/bookings`     | My bookings list | ✅ Active |
| `/staff/bookings/:id` | Booking detail   | ✅ Active |
| `/staff/messages`     | Chat interface   | ✅ Active |
| `/staff/profile`      | Settings         | ✅ Active |

---

## 🔌 API Endpoints

All require: `Authorization: Bearer <token>`

```
GET    /api/staff.php               → Get profile
GET    /api/staff.php?action=dashboard    → Dashboard data
GET    /api/staff.php?action=bookings     → List bookings
GET    /api/staff.php/1             → Booking detail
PATCH  /api/staff.php/1             → Update booking
GET    /api/staff.php?action=availability → Get schedule
POST   /api/staff.php?action=availability → Set schedule
GET    /api/staff.php?action=messages     → Get messages
POST   /api/staff.php?action=messages     → Send message
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action                         |
| -------- | ------------------------------ |
| `Ctrl+B` | Toggle sidebar collapse/expand |
| `Enter`  | Send message (in Messages)     |
| `Esc`    | Close mobile menu              |

---

## 🎨 Theme Support

- **Light Mode** (default)
- **Dark Mode** (theme-aware)
- Automatic transitions
- Persisted preference

---

## 📱 Responsive Breakpoints

- **Mobile**: `< 768px` - Full sidebar overlay
- **Tablet**: `768px - 1024px` - Collapsible sidebar
- **Desktop**: `> 1024px` - Persistent sidebar

---

## 💾 localStorage Keys

```javascript
staffSidebarCollapsed: Boolean; // Sidebar state
adminSidebarCollapsed: Boolean; // Admin sidebar state
theme: "light" | "dark"; // Theme preference
```

---

## 📊 Database Tables

### staff_availability

```
id, staff_id, day_of_week, start_time, end_time, is_available
```

### staff_notifications

```
id, staff_id, type, title, message, related_id, is_read, created_at
```

### staff_timesheets (Phase 2)

```
id, staff_id, booking_id, clock_in_time, clock_out_time, total_hours
```

### users (updated)

```
... existing fields, role, auth_token, availability_status, notification_preferences
```

### bookings (updated)

```
... existing fields, assigned_staff_id, staff_notes, checked_in_at, checked_out_at
```

---

## 🔑 Authentication

**Token Location**: `users.auth_token`
**Role Check**: `users.role = 'staff'`

Example header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🐛 Quick Troubleshooting

| Problem               | Solution                                   |
| --------------------- | ------------------------------------------ |
| "Unauthorized"        | Check Bearer token in Authorization header |
| Sidebar not toggling  | Clear cache, check localStorage enabled    |
| Bookings not showing  | Verify staff user has bookings assigned    |
| Messages not syncing  | Refresh page, check recipient_id           |
| Dark mode not working | Toggle theme in settings                   |

---

## 📁 File Organization

```
Staff Module Files:
├── Backend (6 files)
│   └── api/staff.php, migrate_staff.php
├── Frontend (8 files)
│   ├── Pages (6)
│   └── Components (2)
├── Docs (4 files)
│   └── README, Testing Guide, etc
└── Config (2 files)
   └── Setup scripts
```

---

## ✅ Feature Checklist

- [x] Dashboard with real-time metrics
- [x] Calendar scheduling
- [x] Booking check-in/out
- [x] Messaging system
- [x] Profile management
- [x] Availability scheduling
- [x] Sidebar collapse/expand
- [x] Keyboard shortcuts
- [x] Dark mode
- [x] Mobile responsive
- [x] localStorage persistence
- [x] Full API with auth
- [x] Complete documentation
- [x] Testing guide

---

## 🔄 Next Phase (Phase 2)

- [ ] Time tracking system
- [ ] Staff ratings
- [ ] Payout system
- [ ] Shift swaps
- [ ] Task checklists
- [ ] PWA support
- [ ] Team chat
- [ ] Analytics

---

## 📞 Need Help?

1. **Installation**: See `STAFF_MODULE_README.md`
2. **Testing**: See `TESTING_GUIDE.md`
3. **Summary**: See `IMPLEMENTATION_COMPLETE.md`
4. **API Docs**: Check `/api/staff.php` comments
5. **Component Props**: Check each component's TypeScript interface

---

**Quick Links**

- 📖 [STAFF_MODULE_README.md](./STAFF_MODULE_README.md)
- 🧪 [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- ✅ [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)

---

**Status**: ✅ MVP Ready
**Version**: 1.0.0
**Last Updated**: Dec 19, 2025
