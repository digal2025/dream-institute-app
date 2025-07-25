require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const { sendOtpEmail } = require('./services/sendgridService');

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testOtpSending() {
  try {
    console.log('🔍 Testing OTP sending functionality...');
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

    // Test the sendOtpEmail function directly
    const testEmail = 'gitudigal@dreaminstitute.co.in'; // Use your email for testing
    const testOtp = '123456';
    
    console.log('📤 Testing sendOtpEmail function...');
    console.log('📧 To:', testEmail);
    console.log('🔢 OTP:', testOtp);
    
    const result = await sendOtpEmail(testEmail, testOtp);
    
    console.log('✅ OTP email sent successfully!');
    console.log('📊 Result:', result);
    
  } catch (error) {
    console.error('❌ OTP sending test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }
}

// Run the test
testOtpSending(); 