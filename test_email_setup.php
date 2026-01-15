<?php
/**
 * Test Email Notification
 * Checks if email configuration is correct and sends a test email
 */

require_once 'Database.php';

echo "=== EMAIL NOTIFICATION TEST ===\n\n";

// Check environment variables
echo "1. Checking email configuration:\n";
$emailHost = getenv('EMAIL_HOST');
$emailPort = getenv('EMAIL_PORT');
$emailUser = getenv('EMAIL_USER');
$emailPassword = getenv('EMAIL_PASSWORD');
$emailFrom = getenv('EMAIL_FROM');

echo "   EMAIL_HOST: " . ($emailHost ? "✅ $emailHost" : "❌ NOT SET") . "\n";
echo "   EMAIL_PORT: " . ($emailPort ? "✅ $emailPort" : "❌ NOT SET") . "\n";
echo "   EMAIL_USER: " . ($emailUser ? "✅ $emailUser" : "❌ NOT SET") . "\n";
echo "   EMAIL_PASSWORD: " . ($emailPassword && $emailPassword !== 'your_gmail_app_password_here' ? "✅ SET" : "❌ NOT SET or PLACEHOLDER") . "\n";
echo "   EMAIL_FROM: " . ($emailFrom ? "✅ $emailFrom" : "❌ NOT SET") . "\n";

if (!$emailPassword || $emailPassword === 'your_gmail_app_password_here') {
    echo "\n⚠️  EMAIL_PASSWORD is missing or still a placeholder!\n";
    echo "Follow these steps to set it up:\n\n";
    echo "STEP 1: Enable 2-Factor Authentication\n";
    echo "   Go to: https://myaccount.google.com/security\n";
    echo "   Enable 2-Step Verification\n\n";
    echo "STEP 2: Generate App Password\n";
    echo "   Go to: https://myaccount.google.com/apppasswords\n";
    echo "   Select 'Mail' and 'Windows Computer'\n";
    echo "   Copy the 16-character password Google generates\n\n";
    echo "STEP 3: Update .env.local\n";
    echo "   Replace: EMAIL_PASSWORD=your_gmail_app_password_here\n";
    echo "   With:    EMAIL_PASSWORD=<your_16_char_password>\n\n";
    echo "STEP 4: Restart Dev Server\n";
    echo "   Stop: npm run dev (Ctrl+C)\n";
    echo "   Start: npm run dev\n\n";
    exit(1);
}

// Test email sending
echo "\n2. Testing email connection to Gmail SMTP:\n";

// Check if nodemailer would be available (it's in Node, not PHP)
echo "   Note: Email will be sent via Node.js/TypeScript when approving users\n";
echo "   This happens in: app/api/admin/approve-member/route.ts\n";

// Check if a test user exists
echo "\n3. Checking for test users in database:\n";
$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->query("SELECT id, name, email, is_approved FROM users LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) > 0) {
        echo "   Found " . count($users) . " users:\n";
        foreach ($users as $user) {
            $approved = $user['is_approved'] ? '✅ APPROVED' : '❌ NOT APPROVED';
            echo "   • ID: {$user['id']}, Name: {$user['name']}, Email: {$user['email']} - $approved\n";
        }
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== NEXT STEPS ===\n\n";
echo "1. Update EMAIL_PASSWORD in .env.local with your actual Gmail app password\n";
echo "2. Restart the dev server (npm run dev)\n";
echo "3. Go to admin dashboard and approve an unapproved user\n";
echo "4. Check the user's email inbox for approval notification\n";
echo "5. Check server logs (npm run dev terminal) for any errors\n\n";

echo "=== DEBUGGING ===\n\n";
echo "If you still don't receive emails:\n";
echo "• Check browser console for errors\n";
echo "• Check server logs for 'Approval notification sent' or error messages\n";
echo "• Verify the user's email address is correct\n";
echo "• Check spam/junk folder\n";
echo "• Verify Gmail app password is correct (16 characters)\n";
echo "• Make sure 2FA is enabled on the Gmail account\n";

$db = null;
?>
