// Test email functionality with Node.js
require('dotenv').config({ path: '.env.local' });

const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('=== Testing Email Configuration ===\n');
  
  // Check environment variables
  console.log('Email Configuration:');
  console.log('- Host:', process.env.EMAIL_HOST);
  console.log('- Port:', process.env.EMAIL_PORT);
  console.log('- User:', process.env.EMAIL_USER);
  console.log('- From:', process.env.EMAIL_FROM);
  console.log('- App URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('');
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  try {
    // Verify connection
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    
    // Test sending email
    console.log('Sending test email...');
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: '🧪 TLA Email Test - Gmail SMTP Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #10B981; text-align: center;">🎉 Email Test Successful!</h1>
            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
              This is a test email from the TLA Membership System to verify that Gmail SMTP is working correctly.
            </p>
            <div style="background-color: #F0FDF4; border: 2px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: 600; color: #111827;">Test Details:</p>
              <ul style="margin: 10px 0 0 20px; color: #374151;">
                <li>SMTP Server: ${process.env.EMAIL_HOST}</li>
                <li>Port: ${process.env.EMAIL_PORT}</li>
                <li>From: ${process.env.EMAIL_FROM}</li>
                <li>Time: ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p style="color: #6B7280; font-size: 14px; text-align: center; margin-top: 30px;">
              If you receive this email, the email system is working perfectly! 🚀
            </p>
          </div>
        </div>
      `,
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('- Message ID:', result.messageId);
    console.log('- Response:', result.response);
    console.log('');
    console.log('🎉 Email system is ready to send approval/rejection notifications!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your Gmail App Password');
    console.log('2. Make sure "Less secure app access" is enabled');
    console.log('3. Verify all environment variables are set correctly');
    console.log('4. Check if Gmail is blocking the connection');
  }
}

testEmail();
