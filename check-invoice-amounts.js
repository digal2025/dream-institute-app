// Check Invoice Amounts for Specific Students
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Customer = require('./zoho-invoice-api/backend/models/Customer');
const Invoice = require('./zoho-invoice-api/backend/models/Invoice');
const Payment = require('./zoho-invoice-api/backend/models/Payment');

async function checkInvoiceAmounts() {
  try {
    console.log('🔍 Checking Invoice Amounts for Nandita Behera and Test student');
    console.log('=============================================================');
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check for Nandita Behera
    console.log('\n1️⃣ Checking Nandita Behera:');
    console.log('----------------------------');
    
    const nanditaCustomer = await Customer.findOne({ 
      customer_name: { $regex: /nandita/i } 
    });
    
    if (nanditaCustomer) {
      console.log('✅ Customer found:', nanditaCustomer.customer_name);
      console.log('   Email:', nanditaCustomer.email);
      console.log('   Course Fees:', nanditaCustomer.course_fees);
      console.log('   Contact ID:', nanditaCustomer.contact_id);
      
      // Check invoices
      const nanditaInvoices = await Invoice.find({ customer_id: nanditaCustomer.contact_id });
      console.log('   Total Invoices:', nanditaInvoices.length);
      
      if (nanditaInvoices.length > 0) {
        nanditaInvoices.forEach((inv, index) => {
          console.log(`   Invoice ${index + 1}:`, {
            id: inv.invoice_id,
            total: inv.total,
            balance: inv.balance,
            payment_made: inv.payment_made,
            last_modified: inv.last_modified_time
          });
        });
        
        // Calculate outstanding
        const totalInvoiced = nanditaInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
        const nanditaPayments = await Payment.find({ customer_id: nanditaCustomer.contact_id });
        const totalPaid = nanditaPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const outstanding = totalInvoiced - totalPaid;
        
        console.log('   Summary:', {
          totalInvoiced,
          totalPaid,
          outstanding: outstanding > 0 ? outstanding : 0,
          paymentCount: nanditaPayments.length
        });
      } else {
        console.log('   ❌ No invoices found');
      }
    } else {
      console.log('❌ Customer not found: Nandita Behera');
    }

    // Check for Test student
    console.log('\n2️⃣ Checking Test student:');
    console.log('--------------------------');
    
    const testCustomer = await Customer.findOne({ 
      customer_name: { $regex: /test/i } 
    });
    
    if (testCustomer) {
      console.log('✅ Customer found:', testCustomer.customer_name);
      console.log('   Email:', testCustomer.email);
      console.log('   Course Fees:', testCustomer.course_fees);
      console.log('   Contact ID:', testCustomer.contact_id);
      
      // Check invoices
      const testInvoices = await Invoice.find({ customer_id: testCustomer.contact_id });
      console.log('   Total Invoices:', testInvoices.length);
      
      if (testInvoices.length > 0) {
        testInvoices.forEach((inv, index) => {
          console.log(`   Invoice ${index + 1}:`, {
            id: inv.invoice_id,
            total: inv.total,
            balance: inv.balance,
            payment_made: inv.payment_made,
            last_modified: inv.last_modified_time
          });
        });
        
        // Calculate outstanding
        const totalInvoiced = testInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
        const testPayments = await Payment.find({ customer_id: testCustomer.contact_id });
        const totalPaid = testPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const outstanding = totalInvoiced - totalPaid;
        
        console.log('   Summary:', {
          totalInvoiced,
          totalPaid,
          outstanding: outstanding > 0 ? outstanding : 0,
          paymentCount: testPayments.length
        });
      } else {
        console.log('   ❌ No invoices found');
      }
    } else {
      console.log('❌ Customer not found: Test student');
    }

    // Check for any customers with multiple invoices
    console.log('\n3️⃣ Checking for customers with multiple invoices:');
    console.log('------------------------------------------------');
    
    const allCustomers = await Customer.find({});
    let multipleInvoiceCustomers = [];
    
    for (const customer of allCustomers) {
      const invoices = await Invoice.find({ customer_id: customer.contact_id });
      if (invoices.length > 1) {
        multipleInvoiceCustomers.push({
          name: customer.customer_name,
          contact_id: customer.contact_id,
          invoiceCount: invoices.length,
          totalInvoiced: invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        });
      }
    }
    
    if (multipleInvoiceCustomers.length > 0) {
      console.log('⚠️  Found customers with multiple invoices:');
      multipleInvoiceCustomers.forEach(cust => {
        console.log(`   ${cust.name}: ${cust.invoiceCount} invoices, Total: ₹${cust.totalInvoiced}`);
      });
    } else {
      console.log('✅ No customers with multiple invoices found');
    }

    console.log('\n🎉 Invoice amount check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkInvoiceAmounts(); 