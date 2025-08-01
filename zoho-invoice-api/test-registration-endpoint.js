require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./backend/models/Customer');
const { sendOtpEmail } = require('./services/sendgridService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function testRegistrationEndpoint() {
  try {
    console.log('🔍 Testing registration endpoint logic...');
    
    // Test data
    const testData = {
      name: 'Test Student',
      phone: '+919876543210',
      email: 'gitudigal@dreaminstitute.co.in',
      password: 'dummy'
    };
    
    console.log('📝 Test data:', testData);
    
    // Check if student already exists
    const normPhone = testData.phone; // normalizePhone function logic
    let student = await Customer.findOne({ phone: normPhone });
    
    if (student) {
      console.log('⚠️ Student already exists, deleting for test...');
      await Customer.deleteOne({ phone: normPhone });
    }
    
    console.log('🔢 Generating OTP...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    
    console.log('📧 Generated OTP:', otp);
    console.log('⏰ OTP expires:', otpExpires);
    
    // Create student
    console.log('💾 Creating student record...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    
    student = await Customer.create({
      customer_name: testData.name,
      phone: normPhone,
      email: testData.email,
      password: hashedPassword,
      otp,
      otpExpires,
      mustChangePassword: true,
    });
    
    console.log('✅ Student created successfully');
    console.log('🆔 Student ID:', student.contact_id);
    
    // Send OTP via SendGrid email
    console.log('📤 Sending OTP via email...');
    await sendOtpEmail(testData.email, otp);
    
    console.log('✅ OTP sent successfully!');
    console.log('📧 Check your email for the OTP');
    
    // Clean up - delete test student
    console.log('🧹 Cleaning up test data...');
    await Customer.deleteOne({ phone: normPhone });
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Registration test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the test
testRegistrationEndpoint(); 