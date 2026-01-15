<?php
// Gmail SMTP Configuration for Email Notifications
// Replace these values with your actual Gmail credentials

define('GMAIL_USERNAME', 'babyblissbooking@gmail.com');  // Replace with your Gmail address
define('GMAIL_APP_PASSWORD', 'wijrrfbqtessbiqw'); // Generate App Password from Gmail settings

// Email settings
define('FROM_EMAIL', GMAIL_USERNAME);
define('FROM_NAME', 'Baby Bliss Booking');

// Setup instructions for Gmail:
// 1. Enable 2-Factor Authentication on your Gmail account
// 2. Generate an App Password: https://support.google.com/accounts/answer/185833
// 3. Use the App Password (not your regular password) in GMAIL_APP_PASSWORD
// 4. Replace 'your-gmail@gmail.com' with your actual Gmail address
// 5. Make sure "Less secure app access" is OFF (App Passwords are the secure way)

// Note: For security, consider moving these to environment variables in production

// Test email function
function testEmailConfiguration()
{
    if (GMAIL_USERNAME === 'your-gmail@gmail.com' || GMAIL_APP_PASSWORD === 'your-app-password') {
        return false; // Not configured
    }
    return true; // Configured
}
?>