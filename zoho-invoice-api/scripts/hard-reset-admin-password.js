const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../backend/models/User');

async function hardResetPassword() {
  const email = 'gitudigal@outlook.com';
  const newPassword = 'editHere';
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const user = await User.findOne({ email });
  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }
  user.passwordHash = passwordHash;
  await user.save();
  console.log('Password reset successfully for', email);
  process.exit(0);
}

hardResetPassword().catch(err => {
  console.error('Error resetting password:', err);
  process.exit(1);
}); 