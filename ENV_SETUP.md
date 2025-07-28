# Environment Variables Setup

To enable email notifications for event submissions, add these variables to your `.env` file:

```bash
# Email Configuration for Event Submissions
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
SUBMISSION_EMAIL=saintgull94@gmail.com
```

## Gmail Setup Instructions:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Use the app password** as EMAIL_PASSWORD (not your regular Gmail password)

## Alternative Email Services:

Instead of Gmail, you can use:
- **SendGrid**: More reliable for production
- **AWS SES**: Good for high volume
- **Mailgun**: Developer-friendly

## Testing Email:

The form will:
1. Send a notification email to SUBMISSION_EMAIL with all event details
2. Send a confirmation email to the submitter (if they provided an email)
3. Still work even if email fails (graceful fallback)

## Email Content:

**Notification Email (to you):**
- Subject: "New Event Submission: [Event Name]"
- Contains all form details
- Formatted for easy review

**Confirmation Email (to submitter):**
- Subject: "Event Submission Received - Toronto Event Calendar"  
- Thanks them and sets expectations for review timeline