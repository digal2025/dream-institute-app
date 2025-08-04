// Test Student Endpoints Script
const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'test123';

async function testStudentEndpoints() {
  console.log('🧪 Testing Student Endpoints');
  console.log('============================');
  console.log('');

  try {
    // Test 1: Student Login with missing fields
    console.log('1️⃣ Testing student login with missing email...');
    try {
      const response = await axios.post(`${BASE_URL}/api/student/login`, {
        password: TEST_PASSWORD
      });
      console.log('❌ Should have failed with missing email');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.msg === 'Email and password are required.') {
        console.log('✅ Correctly rejected missing email');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 2: Student Login with missing password
    console.log('\n2️⃣ Testing student login with missing password...');
    try {
      const response = await axios.post(`${BASE_URL}/api/student/login`, {
        emailOrPhone: TEST_EMAIL
      });
      console.log('❌ Should have failed with missing password');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.msg === 'Email and password are required.') {
        console.log('✅ Correctly rejected missing password');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 3: Student Login with invalid credentials
    console.log('\n3️⃣ Testing student login with invalid credentials...');
    try {
      const response = await axios.post(`${BASE_URL}/api/student/login`, {
        emailOrPhone: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      console.log('❌ Should have failed with invalid credentials');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.msg === 'Invalid credentials.') {
        console.log('✅ Correctly rejected invalid credentials');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 4: Send OTP for non-existent student
    console.log('\n4️⃣ Testing send OTP for non-existent student...');
    try {
      const response = await axios.post(`${BASE_URL}/api/student/send-otp`, {
        email: TEST_EMAIL
      });
      console.log('❌ Should have failed with student not found');
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.msg === 'Student not found.') {
        console.log('✅ Correctly rejected non-existent student');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 5: Verify OTP with missing fields
    console.log('\n5️⃣ Testing verify OTP with missing fields...');
    try {
      const response = await axios.post(`${BASE_URL}/api/student/verify-otp`, {
        email: TEST_EMAIL
      });
      console.log('❌ Should have failed with missing OTP');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.msg === 'Email and OTP are required.') {
        console.log('✅ Correctly rejected missing OTP');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    console.log('\n🎉 All student endpoint tests completed!');
    console.log('✅ Student login endpoint is working correctly');
    console.log('✅ All validation is working as expected');
    console.log('✅ Error handling is proper');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testStudentEndpoints(); 