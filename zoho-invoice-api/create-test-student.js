// Create Test Student Script
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('./backend/models/Customer');

async function createTestStudent() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test student already exists
    const existingStudent = await Customer.findOne({ email: 'test@dreaminstitute.com' });
    if (existingStudent) {
      console.log('⚠️  Test student already exists');
      console.log('Email: test@dreaminstitute.com');
      console.log('Password: test123');
      console.log('Student ID:', existingStudent.contact_id);
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('test123', saltRounds);

    // Create test student
    const testStudent = new Customer({
      customer_name: 'Test Student',
      email: 'test@dreaminstitute.com',
      phone: '9876543210',
      cf_pgdca_course: 'PGDCA',
      cf_batch_name: 'Test Batch',
      status: 'in_progress',
      password: hashedPassword,
      mustChangePassword: false,
      contact_id: `test_${Date.now()}`,
      custom_fields: [
        {
          field_id: "2710236000000032523",
          customfield_id: "2710236000000032523",
          show_in_store: false,
          show_in_portal: true,
          is_active: true,
          index: 1,
          label: "Course Name",
          show_on_pdf: true,
          edit_on_portal: true,
          edit_on_store: false,
          api_name: "cf_pgdca_course",
          show_in_all_pdf: true,
          value_formatted: "PGDCA",
          search_entity: "contact",
          data_type: "string",
          placeholder: "cf_pgdca_course",
          value: "PGDCA",
          is_dependent_field: false
        }
      ]
    });

    await testStudent.save();
    console.log('✅ Test student created successfully!');
    console.log('');
    console.log('📋 Test Student Details:');
    console.log('Email: test@dreaminstitute.com');
    console.log('Password: test123');
    console.log('Student ID:', testStudent.contact_id);
    console.log('');
    console.log('🔗 You can now test student login at:');
    console.log('https://fees.dreaminstitute.co.in/student/login');

  } catch (error) {
    console.error('❌ Error creating test student:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestStudent(); 