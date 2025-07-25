require('dotenv').config({ path: __dirname + '/../.env' });
console.log('MONGODB_URI:', process.env.MONGODB_URI);
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

mongoose.connect(process.env.MONGODB_URI);

async function seed() {
  await Customer.deleteMany({});
  await Payment.deleteMany({});
  await Invoice.deleteMany({});

  const customers = [];
  for (let i = 0; i < 20; i++) {
    customers.push(new Customer({
      contact_id: faker.string.uuid(),
      contact_name: faker.person.fullName(),
      customer_name: faker.person.fullName(),
      company_name: faker.company.name(),
      website: faker.internet.url(),
      language_code: 'en',
      contact_type: 'customer',
      status: 'active',
      customer_sub_type: 'individual',
      payment_terms: 0,
      payment_terms_label: 'Due on Receipt',
      currency_id: 'INR',
      currency_code: 'INR',
      outstanding_receivable_amount: faker.number.int({ min: 0, max: 5000 }),
      outstanding_receivable_amount_bcy: 0,
      unused_credits_receivable_amount: 0,
      unused_credits_receivable_amount_bcy: 0,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      mobile: faker.phone.number(),
      portal_status: 'disabled',
      created_time: faker.date.past(),
      last_modified_time: faker.date.recent(),
      custom_fields: [],
      cf_pgdca_course: faker.helpers.arrayElement(['PGDCA', 'DCA', 'BCA']),
      cf_batch_name: `Batch ${faker.number.int({ min: 1, max: 10 })}`
    }));
  }
  await Customer.insertMany(customers);

  const payments = [];
  // Generate last 12 months (current month first)
  const now = new Date();
  const monthsArr = [];
  let year = now.getFullYear();
  let month = now.getMonth();
  for (let i = 0; i < 12; i++) {
    monthsArr.push({ year, month });
    month--;
    if (month < 0) { month = 11; year--; }
  }
  // For each customer, create a payment for each month
  customers.forEach(customer => {
    monthsArr.forEach(({ year, month }) => {
      // Random day in month
      const day = faker.number.int({ min: 1, max: 28 });
      const date = new Date(year, month, day);
      payments.push(new Payment({
        payment_id: faker.string.uuid(),
        payment_number: String(faker.number.int({ min: 1000, max: 9999 })),
        invoice_numbers: `INV-${faker.number.int({ min: 100, max: 999 })}`,
        date,
        payment_mode: faker.helpers.arrayElement(['Cash', 'Card', 'UPI']),
        payment_mode_formatted: 'Cash',
        amount: faker.number.int({ min: 100, max: 2000 }),
        bcy_amount: 0,
        unused_amount: 0,
        bcy_unused_amount: 0,
        description: '',
        product_description: '',
        reference_number: faker.string.alphanumeric(8),
        customer_id: customer.contact_id,
        customer_name: customer.customer_name,
        created_time: faker.date.past(),
        last_modified_time: faker.date.recent(),
        payment_type: 'Invoice Payment',
        payment_status: 'paid',
        settlement_status: '',
        applied_invoices: [],
        has_attachment: false,
        documents: '',
        custom_fields_list: {},
        tax_amount_withheld: 0
      }));
    });
  });
  await Payment.insertMany(payments);

  // Create one invoice for each customer for exactly 50,000 rupees, status 'not paid'
  const invoices = customers.map(customer => new Invoice({
    invoice_id: faker.string.uuid(),
    invoice_number: `INV-${faker.number.int({ min: 100, max: 999 })}`,
    date: faker.date.past(),
    due_date: faker.date.future(),
    status: 'not paid',
    total: 50000,
    balance: 0,
    customer_id: customer.contact_id,
    customer_name: customer.customer_name,
    line_items: [],
    payment_made: 50000,
    payments: Array.from({ length: 5 }).map(() => ({
      payment_id: faker.string.uuid(),
      amount: faker.number.int({ min: 950, max: 1050 }),
      date: faker.date.past(),
      mode: faker.helpers.arrayElement(['Cash', 'Card', 'UPI']),
      reference_number: faker.string.alphanumeric(8)
    })),
    created_time: faker.date.past(),
    last_modified_time: faker.date.recent(),
    custom_fields: []
  }));
  await Invoice.insertMany(invoices);

  console.log('Seeded 20 customers, payments, and invoices!');
  process.exit();
}

seed(); 