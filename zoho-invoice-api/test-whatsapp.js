require('dotenv').config();
const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testWhatsAppSetup() {
  console.log('🔍 Testing Twilio WhatsApp Setup...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.TWILIO_WHATSAPP_NUMBER) {
    console.log(`WhatsApp Number: ${process.env.TWILIO_WHATSAPP_NUMBER}`);
  }
  if (process.env.TWILIO_PHONE_NUMBER) {
    console.log(`SMS Number: ${process.env.TWILIO_PHONE_NUMBER}`);
  }
  
  console.log('\n🔧 Testing Twilio Account...');
  
  try {
    // Test account credentials
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log(`✅ Account Status: ${account.status}`);
    console.log(`✅ Account Type: ${account.type}`);
    
    // Check if it's a trial account
    if (account.type === 'Trial') {
      console.log('⚠️  This is a TRIAL account - WhatsApp has limitations');
      console.log('   - Can only send to verified numbers');
      console.log('   - Recipients must opt-in first');
      console.log('   - Limited to 1000 messages/month');
    }
    
  } catch (error) {
    console.log(`❌ Account Error: ${error.message}`);
    return;
  }
  
  console.log('\n📱 Testing WhatsApp Channel...');
  
  try {
    // Test WhatsApp message (this will fail but show us the exact error)
    const testMessage = await client.messages.create({
      body: 'Test message from WhatsApp API',
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: 'whatsapp:+919124903007' // This will fail, but we want to see the error
    });
    
    console.log('✅ WhatsApp channel is working!');
    
  } catch (error) {
    console.log(`❌ WhatsApp Error: ${error.message}`);
    console.log(`   Error Code: ${error.code}`);
    
    if (error.message.includes('Channel')) {
      console.log('\n🔧 Solutions:');
      console.log('1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message');
      console.log('2. Make sure your WhatsApp number is activated');
      console.log('3. For trial accounts, you need to use the exact trial number format');
      console.log('4. Check if your WhatsApp number is in the correct format');
    }
    
    if (error.code === 21211) {
      console.log('\n🔧 Invalid Phone Number Error:');
      console.log('- The recipient number format is incorrect');
      console.log('- Make sure to include country code (e.g., +91 for India)');
    }
    
    if (error.code === 21214) {
      console.log('\n🔧 Unverified Number Error:');
      console.log('- This is a trial account limitation');
      console.log('- Recipients must be verified in your Twilio console');
      console.log('- Or upgrade to a paid account for production use');
    }
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If you see "Channel" errors, activate WhatsApp in Twilio Console');
  console.log('2. For trial accounts, verify recipient numbers first');
  console.log('3. Consider adding a regular SMS number as fallback');
  console.log('4. Test with a verified number from your Twilio console');
}

// Run the test
testWhatsAppSetup().catch(console.error); 