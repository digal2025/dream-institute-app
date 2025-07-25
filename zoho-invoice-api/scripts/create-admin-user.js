const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../backend/models/User');

async function createAdminUser() {
  const email = 'gitudigal@outlook.com';
  const password = 'editHere';
  const name = 'Admin User';
  const passwordHash = await bcrypt.hash(password, 10);

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let user = await User.findOne({ email });
  if (user) {
    console.error('User already exists:', email);
    process.exit(1);
  }
  user = await User.create({ name, email, passwordHash });
  console.log('Admin user created successfully:', email);
  process.exit(0);
}

createAdminUser().catch(err => {
  console.error('Error creating admin user:', err);
  process.exit(1);
}); 