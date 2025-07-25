require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testSendGridConnection() {
  try {
    console.log('🔍 Testing SendGrid connection...');
    console.log('📧 From Email:', process.env.SENDGRID_FROM_EMAIL);
    console.log('🔑 API Key:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
    
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY is not set in .env file');
      return;
    }
    
    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.error('❌ SENDGRID_FROM_EMAIL is not set in .env file');
      return;
    }

    // Test email
    const testEmail = {
      to: process.env.SENDGRID_FROM_EMAIL, // Send to yourself for testing
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: '🧪 SendGrid Connection Test - Dream Institute',
      text: 'This is a test email to verify your SendGrid connection is working properly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🧪 SendGrid Connection Test</h2>
          <p>Hello! This is a test email to verify that your SendGrid connection is working properly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>✅ API Key: Configured</li>
            <li>✅ From Email: ${process.env.SENDGRID_FROM_EMAIL}</li>
            <li>✅ Domain Authentication: Should be working</li>
            <li>⏰ Sent at: ${new Date().toLocaleString()}</li>
          </ul>
          <p style="color: #666; font-size: 14px;">If you received this email, your SendGrid setup is working correctly!</p>
        </div>
      `
    };

    console.log('📤 Sending test email...');
    const response = await sgMail.send(testEmail);
    
    console.log('✅ Test email sent successfully!');
    console.log('📊 Response:', response[0].statusCode);
    console.log('📧 Check your inbox for the test email');
    
  } catch (error) {
    console.error('❌ SendGrid test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    
    // Common error solutions
    if (error.message.includes('Unauthorized')) {
      console.log('\n💡 Solution: Check your SENDGRID_API_KEY in .env file');
    } else if (error.message.includes('Forbidden')) {
      console.log('\n💡 Solution: Verify your sender email is authenticated in SendGrid');
    } else if (error.message.includes('Bad Request')) {
      console.log('\n💡 Solution: Check your SENDGRID_FROM_EMAIL format');
    }
  }
}

// Run the test
testSendGridConnection(); 