require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./backend/models/Customer');
const Payment = require('./backend/models/Payment');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const allStudents = await Customer.find({});
  const monthPayments = await Payment.find({ date: { $gte: monthStart, $lt: monthEnd } });
  const paidIds = new Set(monthPayments.map(p => String(p.customer_id)));
  const unpaid = allStudents.filter(s => !paidIds.has(String(s.contact_id)));
  const paid = allStudents.filter(s => paidIds.has(String(s.contact_id)));

  console.log('Total students:', allStudents.length);
  console.log('Paid this month:', paid.length);
  console.log('Unpaid this month:', unpaid.length);
  console.log('Paid students:', paid.map(s => s.customer_name));
  console.log('Unpaid students:', unpaid.map(s => s.customer_name));
  process.exit(0);
})(); 