# Gmail Email Notifications Setup

This guide explains how to set up Gmail email notifications for user account creation.

## Prerequisites

1. **Gmail Account**: You need a Gmail account to send emails
2. **2-Factor Authentication**: Must be enabled on your Gmail account
3. **App Password**: Generate an app-specific password for SMTP

## Gmail Setup Steps

### 1. Enable 2-Factor Authentication
1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the steps to enable 2FA

### 2. Generate App Password
1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to "Security" → "Signing in to Google" → "App passwords"
3. You might need to sign in again
4. Select "Mail" and "Other (custom name)"
5. Enter "Baby Bliss API" as the custom name
6. Click "Generate"
7. **Copy the 16-character password** (ignore spaces)

### 3. Configure Email Settings

Edit `api/email_config.php`:

```php
define('GMAIL_USERNAME', 'your-gmail@gmail.com');     // Your Gmail address
define('GMAIL_APP_PASSWORD', 'abcd-efgh-ijkl-mnop'); // The 16-char app password
```

Replace the placeholder values with your actual Gmail credentials.

## Testing Email Notifications

### 1. Install PHPMailer (if not already installed)
```bash
cd api
composer install
```

### 2. Test Email Sending
Create a test account through the frontend signup form at `/auth`, or test directly:

```bash
curl -X POST http://localhost:8082/api/auth.php?action=signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### 3. Check Email Logs
- Successful emails are logged to `api/email_log.txt`
- Check your Gmail sent folder
- Check spam folder if not received

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Verify your Gmail credentials in `email_config.php`
   - Ensure you're using the App Password, not your regular password
   - Check that 2FA is enabled

2. **"Connection failed"**
   - Check your internet connection
   - Verify Gmail SMTP settings haven't changed
   - Try again later (Gmail might temporarily block suspicious activity)

3. **Emails going to spam**
   - This is normal for new senders
   - Ask recipients to check spam folder
   - Consider setting up SPF/DKIM records for better deliverability

### Gmail SMTP Limits:
- **500 emails per day** for free Gmail accounts
- **2,000 emails per day** for Google Workspace accounts
- Rate limits apply for sending too quickly

## Production Considerations

For production deployment:

1. **Use environment variables** instead of hardcoded credentials:
   ```php
   define('GMAIL_USERNAME', getenv('GMAIL_USERNAME'));
   define('GMAIL_APP_PASSWORD', getenv('GMAIL_APP_PASSWORD'));
   ```

2. **Consider using a dedicated email service** like:
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5,000 emails/month)
   - AWS SES (free tier: 62,000 emails/month)

3. **Add email templates** for different scenarios:
   - Welcome emails
   - Password reset
   - Booking confirmations
   - Admin notifications

## Email Templates

The current welcome email includes:
- Professional HTML design
- Baby Bliss branding
- Account setup instructions
- Call-to-action buttons
- Unsubscribe information

Customize the email content in the `sendWelcomeEmail()` function in `auth.php`.