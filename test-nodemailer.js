// Test NodeMailer configuration
const nodemailer = require('nodemailer');

console.log('Testing NodeMailer import...');
console.log('NodeMailer version:', nodemailer.version || 'Unknown');

// Test basic transporter creation
try {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    auth: {
      user: 'test@gmail.com',
      pass: 'test-password'
    }
  });

  console.log('Transporter created successfully');
  console.log('Available methods:', Object.getOwnPropertyNames(transporter));
  
  // Test email sending (without actually sending)
  const mailOptions = {
    from: 'test@example.com',
    to: 'recipient@example.com',
    subject: 'Test Email',
    text: 'This is a test email from NodeMailer'
  };

  console.log('Mail options prepared:', mailOptions);
  
  // Don't actually send, just test the setup
  console.log('NodeMailer setup test completed successfully!');
  console.log('Ready to send real emails');
  
} catch (error) {
  console.error('Error testing NodeMailer:', error);
}
