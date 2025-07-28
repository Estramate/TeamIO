/**
 * Test script for SendGrid email configuration
 * Run with: node server/test-email.js
 */

const { MailService } = require('@sendgrid/mail');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'club.flow.2025@gmail.com';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable not set');
  process.exit(1);
}

const mailService = new MailService();
mailService.setApiKey(SENDGRID_API_KEY);

async function testEmail() {
  console.log('📧 Testing SendGrid configuration...');
  console.log('📧 API Key Status:', SENDGRID_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED');
  console.log('📧 From Email:', FROM_EMAIL);
  
  const testMessage = {
    to: 'test@example.com', // Replace with your test email
    from: FROM_EMAIL,
    subject: 'ClubFlow SendGrid Test - club.flow.2025 Domain',
    text: 'This is a test email from ClubFlow using the verified club.flow.2025@gmail.com sender address.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">🏆 ClubFlow Email Test</h2>
        <p>This is a test email from ClubFlow using the verified sender address:</p>
        <p><strong>FROM:</strong> ${FROM_EMAIL}</p>
        <p><strong>Domain:</strong> club.flow.2025</p>
        <p style="color: #10b981;">✅ If you receive this email, SendGrid is configured correctly!</p>
        <hr>
        <p style="font-size: 12px; color: #6b7280;">Sent from ClubFlow development environment</p>
      </div>
    `
  };

  try {
    console.log('📧 Attempting to send test email via SendGrid...');
    await mailService.send(testMessage);
    console.log('📧 ✅ Test email sent successfully!');
    console.log('📧 Check your inbox for the test message.');
  } catch (error) {
    console.error('📧 ❌ SendGrid test failed:', error);
    if (error.response) {
      console.error('📧 Error details:', error.response.body);
    }
  }
}

testEmail();