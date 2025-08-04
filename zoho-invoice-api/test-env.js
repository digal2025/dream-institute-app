// Test Environment Variables Script
require('dotenv').config();

console.log('🔍 Environment Variables Test');
console.log('=============================');
console.log('');

console.log('📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET (hidden for security)' : 'NOT SET');
console.log('');

if (process.env.MONGODB_URI) {
  console.log('✅ MongoDB URI is configured');
} else {
  console.log('❌ MongoDB URI is missing - this will cause connection issues');
}

console.log('');
console.log('🚀 To fix production issues:');
console.log('1. Go to your Dokploy dashboard');
console.log('2. Find your application settings');
console.log('3. Add environment variables:');
console.log('   - MONGODB_URI=mongodb+srv://gitudigal:3RkN2LC4i71wLfbu@gitudigal.yteriqn.mongodb.net/?retryWrites=true&w=majority&appName=GituDigal');
console.log('   - NODE_ENV=production');
console.log('   - PORT=3000');
console.log('');
console.log('4. Redeploy your application'); 