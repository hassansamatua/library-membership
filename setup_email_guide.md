# Email Configuration for Contact Form

## Current Status
✅ Contact form submissions are working and stored in database
❌ Email notifications are not being sent (SMTP credentials missing)

## Where Do Submissions Go Right Now?
1. **Database Storage**: All submissions are saved in `contact_submissions` table
2. **Admin Access**: You can view submissions via database or admin panel
3. **No Email**: Admin doesn't receive email notifications yet

## To Enable Email Notifications

### Step 1: Create .env.local file
Create a file named `.env.local` in your project root with:

```env
# SMTP Configuration for Contact Form Emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 2: Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security
3. Enable "App passwords"
4. Generate a new app password for this application
5. Use the app password in `SMTP_PASS`

### Step 3: Alternative SMTP Providers

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### SendGrid:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Step 4: Restart Development Server
After creating .env.local, restart your Next.js development server:
```bash
npm run dev
```

## Current Email Recipient
The contact form sends emails to: `info@tla.or.tz`

## Testing Email Configuration
After setup, test the contact form and check:
1. Server logs for email sending status
2. Your email inbox for the notification
3. Database for the submission record

## Alternative: View Submissions Without Email
If you don't configure email, you can still view submissions:
1. **Direct Database Access**: Query `contact_submissions` table
2. **Admin Panel**: Add a contact submissions management page
3. **Database Admin Tools**: Use phpMyAdmin or similar

## Database Query to View Submissions
```sql
SELECT * FROM contact_submissions ORDER BY created_at DESC;
```

## Security Notes
- Never commit .env.local to version control
- Use app passwords instead of regular passwords
- Consider using transactional email services for production
- Monitor email sending limits for your SMTP provider
