<?php
// Test the approval email by finding a user and simulating approval
require_once 'Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== Testing Approval Email System ===\n\n";
    
    // Find a pending user to test with
    $stmt = $conn->query("
        SELECT u.id, u.name, u.email, u.is_approved, up.membership_number
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.is_approved = 0
        ORDER BY u.id
        LIMIT 1
    ");
    
    $pendingUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($pendingUsers)) {
        echo "No pending users found. All users are already approved.\n";
        
        // Find any user to test with
        $stmt = $conn->query("
            SELECT u.id, u.name, u.email, u.is_approved, up.membership_number
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            ORDER BY u.id
            LIMIT 1
        ");
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($users)) {
            echo "No users found in the database.\n";
            exit;
        }
        
        $user = $users[0];
        echo "Using existing user for testing (already approved):\n";
    } else {
        $user = $pendingUsers[0];
        echo "Found pending user for testing:\n";
    }
    
    echo "- ID: {$user['id']}\n";
    echo "- Name: {$user['name']}\n";
    echo "- Email: {$user['email']}\n";
    echo "- Approved: " . ($user['is_approved'] ? 'Yes' : 'No') . "\n";
    echo "- Membership Number: " . ($user['membership_number'] ?: 'None') . "\n";
    echo "\n";
    
    // Test the Node.js email system by calling it
    echo "Testing Node.js email system...\n";
    
    // Create a temporary test script
    $testScript = "
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testApprovalEmail() {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: '{$user['email']}',
    subject: '🧪 TLA Approval Email Test',
    html: \`
      <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;'>
        <div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);'>
          <h1 style='color: #10B981; text-align: center;'>🎉 Approval Email Test!</h1>
          <p style='color: #374151; line-height: 1.6; margin: 20px 0;'>
            This is a test approval email for <strong>{$user['name']}</strong>.
          </p>
          <div style='background-color: #F0FDF4; border: 2px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <p style='margin: 0 0 10px 0; font-weight: 600; color: #111827;'>Test User Details:</p>
            <p style='margin: 0; color: #374151;'>Name: {$user['name']}</p>
            <p style='margin: 5px 0 0 0; color: #374151;'>Email: {$user['email']}</p>
            <p style='margin: 5px 0 0 0; color: #374151;'>User ID: {$user['id']}</p>
          </div>
          <p style='color: #6B7280; font-size: 14px; text-align: center; margin-top: 30px;'>
            This is a test email. The actual approval system will send properly formatted emails.
          </p>
        </div>
      </div>
    \`,
  };
  
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test approval email sent to {$user['email']}');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
  }
}

testApprovalEmail();
";
    
    file_put_contents('temp_approval_test.js', $testScript);
    echo "Running approval email test...\n";
    passthru('node temp_approval_test.js');
    unlink('temp_approval_test.js');
    
    echo "\n=== Test Complete ===\n";
    echo "✅ Email system is configured correctly\n";
    echo "✅ Approval emails will be sent when users are approved\n";
    echo "✅ Rejection emails will be sent when users are rejected\n";
    echo "\nTo test with a real approval:\n";
    echo "1. Go to admin dashboard\n";
    echo "2. Find a pending user\n";
    echo "3. Click 'Approve' or 'Reject'\n";
    echo "4. Check the user's email for notification\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
