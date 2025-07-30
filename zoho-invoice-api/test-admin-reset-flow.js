require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const { sendOtpEmail } = require('./services/sendgridService');

async function testCompleteAdminResetFlow() {
  try {
    console.log('🔍 Testing Complete Admin Reset Password Flow...');
    console.log('==========================================');
    
    // 1. Test Database Connection
    console.log('\n📁 Step 1: Testing Database Connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // 2. Check if admin users exist
    console.log('\n👤 Step 2: Checking Admin Users...');
    const adminUsers = await User.find({});
    console.log(`📊 Found ${adminUsers.length} users in database:`);
    
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`);
    });
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found! This is likely the issue.');
      console.log('💡 Solution: Create an admin user first using scripts/create-admin-user.js');
      return;
    }
    
    // 3. Test with first admin user
    const testUser = adminUsers[0];
    console.log(`\n📧 Step 3: Testing Reset Flow with: ${testUser.email}`);
    
    // 4. Generate OTP and save to database (simulating the route logic)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    
    console.log(`🔢 Generated OTP: ${otp}`);
    console.log(`⏰ OTP Expires: ${otpExpires.toLocaleString()}`);
    
    // Save to database
    testUser.otp = otp;
    testUser.otpExpires = otpExpires;
    await testUser.save();
    console.log('✅ OTP saved to database');
    
    // 5. Test SendGrid Email Sending
    console.log('\n📤 Step 4: Testing SendGrid Email...');
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
    
    // Send the OTP email
    const emailResult = await sendOtpEmail(testUser.email, otp);
    console.log('✅ OTP email sent successfully!');
    console.log('📊 SendGrid Response Status:', emailResult[0].statusCode);
    
    // 6. Verify database state
    console.log('\n🔍 Step 5: Verifying Database State...');
    const updatedUser = await User.findById(testUser._id);
    console.log('✅ User OTP in database:', updatedUser.otp);
    console.log('✅ User OTP expiry:', updatedUser.otpExpires?.toLocaleString());
    
    console.log('\n🎉 SUCCESS: Complete admin reset flow is working!');
    console.log('📧 Check the email inbox for:', testUser.email);
    
    // 7. Test the actual auth route
    console.log('\n🔗 Step 6: Testing Auth Route Simulation...');
    await simulateAuthRoute(testUser.email);
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Error:', error.message);
    
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    
    // Provide specific debugging help
    if (error.message.includes('MONGODB_URI')) {
      console.log('\n💡 Solution: Check your MONGODB_URI in .env file');
    } else if (error.message.includes('Unauthorized')) {
      console.log('\n💡 Solution: Check your SENDGRID_API_KEY in .env file');
    } else if (error.message.includes('User')) {
      console.log('\n💡 Solution: Create an admin user first');
    }
    
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('\n📁 Database connection closed');
  }
}

// Simulate the actual auth route logic
async function simulateAuthRoute(email) {
  try {
    console.log(`🔄 Simulating POST /api/auth/admin-reset-password-request`);
    console.log(`📧 Email: ${email}`);
    
    // Find user (same as auth route)
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found in auth route simulation');
      return;
    }
    
    console.log('✅ User found in auth route simulation');
    
    // Generate OTP (same as auth route)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    console.log('✅ OTP generated and saved (auth route simulation)');
    
    // Send email (same as auth route)
    await sendOtpEmail(email, otp);
    console.log('✅ Email sent successfully (auth route simulation)');
    
    console.log('🎉 Auth route simulation completed successfully!');
    
  } catch (err) {
    console.error('❌ Auth route simulation failed:');
    console.error('Error:', err.message);
    console.error('This is exactly what would happen in the real auth route!');
  }
}

// Run the comprehensive test
testCompleteAdminResetFlow();