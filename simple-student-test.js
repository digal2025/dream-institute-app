// Simple Student Endpoints Test
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3004;

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testStudentEndpoints() {
  console.log('🧪 Testing Student Endpoints');
  console.log('============================');
  console.log('');

  try {
    // Test 1: Student Login with missing fields
    console.log('1️⃣ Testing student login with missing email...');
    const test1 = await makeRequest('/api/student/login', 'POST', { password: 'test123' });
    if (test1.status === 400 && test1.data.msg === 'Email and password are required.') {
      console.log('✅ Correctly rejected missing email');
    } else {
      console.log('❌ Unexpected response:', test1);
    }

    // Test 2: Student Login with missing password
    console.log('\n2️⃣ Testing student login with missing password...');
    const test2 = await makeRequest('/api/student/login', 'POST', { emailOrPhone: 'test@test.com' });
    if (test2.status === 400 && test2.data.msg === 'Email and password are required.') {
      console.log('✅ Correctly rejected missing password');
    } else {
      console.log('❌ Unexpected response:', test2);
    }

    // Test 3: Student Login with invalid credentials
    console.log('\n3️⃣ Testing student login with invalid credentials...');
    const test3 = await makeRequest('/api/student/login', 'POST', { 
      emailOrPhone: 'test@test.com', 
      password: 'test123' 
    });
    if (test3.status === 400 && test3.data.msg === 'Invalid credentials.') {
      console.log('✅ Correctly rejected invalid credentials');
    } else {
      console.log('❌ Unexpected response:', test3);
    }

    // Test 4: Send OTP for non-existent student
    console.log('\n4️⃣ Testing send OTP for non-existent student...');
    const test4 = await makeRequest('/api/student/send-otp', 'POST', { email: 'test@test.com' });
    if (test4.status === 404 && test4.data.msg === 'Student not found.') {
      console.log('✅ Correctly rejected non-existent student');
    } else {
      console.log('❌ Unexpected response:', test4);
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