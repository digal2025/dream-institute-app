const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOtpEmail(to, otp) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com',
    subject: 'Your Dream Institute OTP',
    text: `Your OTP is: ${otp}\nThis code is valid for 5 minutes.`,
    html: `<p>Your OTP is: <b>${otp}</b><br>This code is valid for 5 minutes.</p>`,
  };
  return sgMail.send(msg);
}

async function sendPasswordResetEmail(to, resetUrl) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com',
    subject: 'Reset your Dream Institute password',
    text: `Click the link to reset your password: ${resetUrl}`,
    html: `<p>Click the link below to reset your password:<br><a href="${resetUrl}">${resetUrl}</a><br>This link is valid for 15 minutes.</p>`
  };
  return sgMail.send(msg);
}

async function sendFeeReminderEmail(to, studentName, outstandingAmount, course, batch) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com',
    subject: 'Fee Payment Reminder - Dream Institute',
    text: `Dear ${studentName},\n\nThis is a gentle reminder that your course fee is due.\n\nCourse: ${course}\nBatch: ${batch}\nOutstanding Amount: ₹${outstandingAmount}\n\nPlease make the payment at the earliest to avoid any inconvenience.\n\nIf you have already paid, please ignore this message.\n\nThank you!`,
    html: `<p>Dear <b>${studentName}</b>,<br><br>This is a gentle reminder that your course fee is due.<br><br><b>Course:</b> ${course}<br><b>Batch:</b> ${batch}<br><b>Outstanding Amount:</b> ₹${outstandingAmount}<br><br>Please make the payment at the earliest to avoid any inconvenience.<br><br>If you have already paid, please ignore this message.<br><br>Thank you!</p>`
  };
  return sgMail.send(msg);
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendFeeReminderEmail }; 