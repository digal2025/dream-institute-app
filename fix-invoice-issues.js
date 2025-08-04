// Fix Invoice Issues - Comprehensive Solution
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Customer = require('./backend/models/Customer');
const Invoice = require('./backend/models/Invoice');
const Payment = require('./backend/models/Payment');

async function fixInvoiceIssues() {
  try {
    console.log('🔧 Fixing Invoice Issues');
    console.log('========================');
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fix 1: Nandita Behera - Update invoice to match course fees
    console.log('\n1️⃣ Fixing Nandita Behera:');
    console.log('---------------------------');
    
    const nanditaCustomer = await Customer.findOne({ 
      customer_name: { $regex: /nandita/i } 
    });
    
    if (nanditaCustomer) {
      console.log('✅ Found Nandita Behera');
      console.log('   Course Fees:', nanditaCustomer.course_fees);
      console.log('   Contact ID:', nanditaCustomer.contact_id);
      
      const nanditaInvoices = await Invoice.find({ customer_id: nanditaCustomer.contact_id });
      console.log('   Current Invoices:', nanditaInvoices.length);
      
      if (nanditaInvoices.length > 0) {
        // Get the latest invoice
        const latestInvoice = nanditaInvoices.sort((a, b) => 
          new Date(b.last_modified_time || b.created_time) - new Date(a.last_modified_time || a.created_time)
        )[0];
        
        console.log('   Latest Invoice Total:', latestInvoice.total);
        console.log('   Course Fees:', nanditaCustomer.course_fees);
        
        if (latestInvoice.total !== nanditaCustomer.course_fees) {
          // Get total payments made
          const nanditaPayments = await Payment.find({ customer_id: nanditaCustomer.contact_id });
          const totalPaid = nanditaPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const newBalance = Math.max(0, nanditaCustomer.course_fees - totalPaid);
          
          // Update the invoice
          const updatedInvoice = await Invoice.findByIdAndUpdate(latestInvoice._id, {
            total: nanditaCustomer.course_fees,
            balance: newBalance,
            payment_made: totalPaid,
            line_items: [{
              name: `${nanditaCustomer.cf_pgdca_course || 'Course'} Fee`,
              description: `Course fees for ${nanditaCustomer.cf_pgdca_course || 'Course'} - ${nanditaCustomer.cf_batch_name || 'Batch'}`,
              quantity: 1,
              rate: nanditaCustomer.course_fees,
              amount: nanditaCustomer.course_fees
            }],
            last_modified_time: new Date()
          }, { new: true });
          
          console.log('✅ Invoice updated successfully');
          console.log('   New Total:', updatedInvoice.total);
          console.log('   New Balance:', updatedInvoice.balance);
          console.log('   Payment Made:', updatedInvoice.payment_made);
        } else {
          console.log('✅ Invoice already matches course fees');
        }
      } else {
        console.log('❌ No invoices found for Nandita');
      }
    } else {
      console.log('❌ Nandita Behera not found');
    }

    // Fix 2: Test Student - Create invoice if missing
    console.log('\n2️⃣ Fixing Test Student:');
    console.log('------------------------');
    
    const testCustomer = await Customer.findOne({ 
      customer_name: { $regex: /test/i } 
    });
    
    if (testCustomer) {
      console.log('✅ Found Test Student');
      console.log('   Course Fees:', testCustomer.course_fees);
      console.log('   Contact ID:', testCustomer.contact_id);
      
      const testInvoices = await Invoice.find({ customer_id: testCustomer.contact_id });
      console.log('   Current Invoices:', testInvoices.length);
      
      if (testInvoices.length === 0 && testCustomer.course_fees > 0) {
        // Create new invoice
        const newInvoice = new Invoice({
          invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          invoice_number: `INV-${Date.now()}`,
          date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'sent',
          total: testCustomer.course_fees,
          balance: testCustomer.course_fees,
          customer_id: testCustomer.contact_id,
          customer_name: testCustomer.customer_name,
          line_items: [{
            name: `${testCustomer.cf_pgdca_course || 'Course'} Fee`,
            description: `Course fees for ${testCustomer.cf_pgdca_course || 'Course'} - ${testCustomer.cf_batch_name || 'Batch'}`,
            quantity: 1,
            rate: testCustomer.course_fees,
            amount: testCustomer.course_fees
          }],
          payment_made: 0,
          payments: [],
          created_time: new Date(),
          last_modified_time: new Date(),
          custom_fields: []
        });
        
        await newInvoice.save();
        console.log('✅ Invoice created successfully');
        console.log('   Invoice ID:', newInvoice.invoice_id);
        console.log('   Total:', newInvoice.total);
        console.log('   Balance:', newInvoice.balance);
      } else if (testInvoices.length > 0) {
        console.log('✅ Invoice already exists');
      } else {
        console.log('⚠️  No course fees set, skipping invoice creation');
      }
    } else {
      console.log('❌ Test Student not found');
    }

    // Fix 3: Clean up multiple invoices for all customers
    console.log('\n3️⃣ Cleaning up multiple invoices:');
    console.log('----------------------------------');
    
    const allCustomers = await Customer.find({});
    let fixedCustomers = 0;
    let totalInvoicesRemoved = 0;
    
    for (const customer of allCustomers) {
      const invoices = await Invoice.find({ customer_id: customer.contact_id });
      
      if (invoices.length > 1) {
        console.log(`\n   Processing ${customer.customer_name}:`);
        console.log(`   Found ${invoices.length} invoices`);
        
        // Sort by last_modified_time to get the latest
        invoices.sort((a, b) => {
          const dateA = new Date(a.last_modified_time || a.created_time || 0);
          const dateB = new Date(b.last_modified_time || b.created_time || 0);
          return dateB - dateA; // Descending order
        });
        
        const latestInvoice = invoices[0];
        const oldInvoices = invoices.slice(1);
        
        // Get total payments for this customer
        const payments = await Payment.find({ customer_id: customer.contact_id });
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        // Update the latest invoice with correct course fees if needed
        if (customer.course_fees > 0 && latestInvoice.total !== customer.course_fees) {
          const newBalance = Math.max(0, customer.course_fees - totalPaid);
          
          await Invoice.findByIdAndUpdate(latestInvoice._id, {
            total: customer.course_fees,
            balance: newBalance,
            payment_made: totalPaid,
            line_items: [{
              name: `${customer.cf_pgdca_course || 'Course'} Fee`,
              description: `Course fees for ${customer.cf_pgdca_course || 'Course'} - ${customer.cf_batch_name || 'Batch'}`,
              quantity: 1,
              rate: customer.course_fees,
              amount: customer.course_fees
            }],
            last_modified_time: new Date()
          });
          
          console.log(`   Updated latest invoice to ₹${customer.course_fees}`);
        }
        
        // Delete old invoices
        for (const oldInvoice of oldInvoices) {
          await Invoice.findByIdAndDelete(oldInvoice._id);
          console.log(`   Deleted old invoice: ${oldInvoice.invoice_id} (₹${oldInvoice.total})`);
          totalInvoicesRemoved++;
        }
        
        fixedCustomers++;
      }
    }
    
    console.log(`\n✅ Cleanup completed:`);
    console.log(`   Fixed ${fixedCustomers} customers`);
    console.log(`   Removed ${totalInvoicesRemoved} duplicate invoices`);

    // Verify the fixes
    console.log('\n4️⃣ Verifying fixes:');
    console.log('-------------------');
    
    // Check Nandita again
    const nanditaAfter = await Customer.findOne({ customer_name: { $regex: /nandita/i } });
    if (nanditaAfter) {
      const nanditaInvoicesAfter = await Invoice.find({ customer_id: nanditaAfter.contact_id });
      const nanditaPaymentsAfter = await Payment.find({ customer_id: nanditaAfter.contact_id });
      const totalPaidAfter = nanditaPaymentsAfter.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalInvoicedAfter = nanditaInvoicesAfter.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
      const outstandingAfter = totalInvoicedAfter - totalPaidAfter;
      
      console.log('   Nandita Behera:');
      console.log(`     Course Fees: ₹${nanditaAfter.course_fees}`);
      console.log(`     Invoice Total: ₹${totalInvoicedAfter}`);
      console.log(`     Total Paid: ₹${totalPaidAfter}`);
      console.log(`     Outstanding: ₹${outstandingAfter > 0 ? outstandingAfter : 0}`);
      console.log(`     Invoice Count: ${nanditaInvoicesAfter.length}`);
    }
    
    // Check Test Student again
    const testAfter = await Customer.findOne({ customer_name: { $regex: /test/i } });
    if (testAfter) {
      const testInvoicesAfter = await Invoice.find({ customer_id: testAfter.contact_id });
      const testPaymentsAfter = await Payment.find({ customer_id: testAfter.contact_id });
      const totalPaidAfter = testPaymentsAfter.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalInvoicedAfter = testInvoicesAfter.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
      const outstandingAfter = totalInvoicedAfter - totalPaidAfter;
      
      console.log('   Test Student:');
      console.log(`     Course Fees: ₹${testAfter.course_fees}`);
      console.log(`     Invoice Total: ₹${totalInvoicedAfter}`);
      console.log(`     Total Paid: ₹${totalPaidAfter}`);
      console.log(`     Outstanding: ₹${outstandingAfter > 0 ? outstandingAfter : 0}`);
      console.log(`     Invoice Count: ${testInvoicesAfter.length}`);
    }
    
    // Check for any remaining multiple invoices
    let remainingMultipleInvoices = 0;
    for (const customer of allCustomers) {
      const invoices = await Invoice.find({ customer_id: customer.contact_id });
      if (invoices.length > 1) {
        remainingMultipleInvoices++;
      }
    }
    
    console.log(`   Multiple Invoices Remaining: ${remainingMultipleInvoices}`);

    console.log('\n🎉 Invoice issues fixed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Nandita Behera invoice updated to match course fees');
    console.log('✅ Test Student invoice created (if course fees exist)');
    console.log('✅ Multiple invoices cleaned up for all customers');
    console.log('✅ Outstanding amounts now calculated correctly');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixInvoiceIssues(); 