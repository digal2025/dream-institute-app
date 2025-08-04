const express = require('express');
const Customer = require('../backend/models/Customer');
const Invoice = require('../backend/models/Invoice');
const router = express.Router();
const mongoose = require('mongoose');
const Payment = require('../backend/models/Payment');

// GET /api/mongo/customers/:id - get a single customer by contact_id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ contact_id: req.params.id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/mongo/customers - paginated, filtered, searchable
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, ...filters } = req.query;
    const query = {};
    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { contact_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    // Add any other filters
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ customers, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Error fetching customers:', err.stack || err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Check for duplicate customer
router.post('/check-duplicates', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    let query = { $or: [] };

    // Build a case-insensitive and whitespace-trimmed query
    if (name && name.trim()) {
      query.$or.push({ customer_name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    }
    if (email && email.trim()) {
      query.$or.push({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });
    }
    if (phone && phone.trim()) {
      query.$or.push({ phone: phone.trim() });
    }

    // If no fields are provided or all are empty, it's not a valid request
    if (query.$or.length === 0) {
      return res.status(200).json({ exists: false });
    }

    const existingCustomer = await Customer.findOne(query);

    if (existingCustomer) {
      let field = 'field';
      if (name && existingCustomer.customer_name.toLowerCase() === name.trim().toLowerCase()) field = 'name';
      else if (email && existingCustomer.email.toLowerCase() === email.trim().toLowerCase()) field = 'email';
      else if (phone && existingCustomer.phone === phone.trim()) field = 'phone';
      
      return res.status(200).json({ exists: true, message: `A student with this ${field} already exists.` });
    }

    res.status(200).json({ exists: false });
  } catch (err) {
    res.status(500).json({ error: 'Server error while checking for duplicates.' });
  }
});


// Helper to send notification
const sendNotification = async (message, user) => {
  try {
    const Notification = require('../backend/models/Notification');
    await Notification.create({
      message,
      user,
      time: new Date(),
      read: false,
      type: 'student',
    });
  } catch (err) { /* ignore */ }
};

// Add new customer
router.post('/', async (req, res) => {
  try {
    let data = { ...req.body };
    if (!data.contact_id) delete data.contact_id;
    
    // Create customer
    const created = await Customer.create(data);
    if (!created.contact_id) {
      created.contact_id = created._id.toString();
      await created.save();
    }

    // Create invoice if course_fees is provided
    let invoice = null;
    if (data.course_fees && data.course_fees > 0) {
      const invoiceData = {
        invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        invoice_number: `INV-${Date.now()}`,
        date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'sent',
        total: data.course_fees,
        balance: data.course_fees, // Initially balance equals total
        customer_id: created.contact_id,
        customer_name: created.customer_name,
        line_items: [{
          name: `${data.cf_pgdca_course} Course Fee`,
          description: `Course fees for ${data.cf_pgdca_course} - ${data.cf_batch_name}`,
          quantity: 1,
          rate: data.course_fees,
          amount: data.course_fees
        }],
        payment_made: 0,
        payments: [],
        created_time: new Date(),
        last_modified_time: new Date(),
        custom_fields: []
      };
      
      invoice = await Invoice.create(invoiceData);
    }

    // Send detailed notification
    let notificationMessage = `Added student: ${created.customer_name}`;
    if (req.body.course_fees && req.body.course_fees > 0) {
      notificationMessage += ` with course fees ₹${req.body.course_fees.toLocaleString()}`;
      if (invoice) {
        notificationMessage += ` - Invoice created (Total: ₹${invoice.total.toLocaleString()}, Balance: ₹${invoice.balance.toLocaleString()})`;
      }
    }
    await sendNotification(notificationMessage, req.body.user || (req.user && req.user.name));
    
    res.json({ 
      customer: created, 
      invoice: invoice,
      message: invoice ? 'Student and invoice created successfully' : 'Student created successfully'
    });
  } catch (err) {
    console.error('Error adding customer:', err.stack || err);
    // Handle duplicate key error with a user-friendly message
    if (err.code === 11000) {
      res.status(400).json({ error: 'A customer with this contact_id already exists.' });
    } else {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
});

// PATCH /api/mongo/customers/:id - update a single customer by contact_id
router.patch('/:id', async (req, res) => {
  try {
    // Get the current customer data to check if course_fees is being added
    const currentCustomer = await Customer.findOne({ contact_id: req.params.id });
    if (!currentCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update the customer
    const updated = await Customer.findOneAndUpdate(
      { contact_id: req.params.id },
      req.body,
      { new: true }
    );

    // Check if course_fees is being added or updated
    let invoice = null;
    let existingInvoice = null;
    const isAddingCourseFees = (!currentCustomer.course_fees || currentCustomer.course_fees === 0) && req.body.course_fees && req.body.course_fees > 0;
    const isUpdatingCourseFees = currentCustomer.course_fees && req.body.course_fees && req.body.course_fees > 0 && req.body.course_fees !== currentCustomer.course_fees;
    
    console.log('Edit Student Debug:', {
      customerId: req.params.id,
      currentCourseFees: currentCustomer.course_fees,
      newCourseFees: req.body.course_fees,
      isAddingCourseFees,
      isUpdatingCourseFees,
      willCreateInvoice: isAddingCourseFees || isUpdatingCourseFees
    });
    
    if (isAddingCourseFees || isUpdatingCourseFees) {
      // Check if student already has an invoice
      const allInvoices = await Invoice.find({ customer_id: updated.contact_id });
      existingInvoice = allInvoices[0]; // Get the first one
      
      console.log('Invoice Check:', {
        customerId: updated.contact_id,
        totalInvoicesFound: allInvoices.length,
        existingInvoiceFound: !!existingInvoice,
        existingInvoiceId: existingInvoice ? existingInvoice.invoice_id : null,
        existingInvoiceTotal: existingInvoice ? existingInvoice.total : null,
        existingInvoiceBalance: existingInvoice ? existingInvoice.balance : null,
        allInvoiceIds: allInvoices.map(inv => inv.invoice_id)
      });
      
      if (existingInvoice) {
        // If there are multiple invoices, delete the old ones first
        if (allInvoices.length > 1) {
          console.log('Multiple invoices found, deleting old ones...');
          for (let i = 1; i < allInvoices.length; i++) {
            await Invoice.findByIdAndDelete(allInvoices[i]._id);
            console.log('Deleted old invoice:', allInvoices[i].invoice_id);
          }
        }
        
        // Update existing invoice
        const totalPaid = existingInvoice.payment_made || 0;
        const newBalance = Math.max(0, req.body.course_fees - totalPaid);
        
        const updatedInvoice = await Invoice.findByIdAndUpdate(existingInvoice._id, {
          total: req.body.course_fees,
          balance: newBalance,
          payment_made: totalPaid,
          line_items: [{
            name: `${req.body.cf_pgdca_course || updated.cf_pgdca_course} Course Fee`,
            description: `Course fees for ${req.body.cf_pgdca_course || updated.cf_pgdca_course} - ${req.body.cf_batch_name || updated.cf_batch_name}`,
            quantity: 1,
            rate: req.body.course_fees,
            amount: req.body.course_fees
          }],
          last_modified_time: new Date()
        }, { new: true });
        
        invoice = updatedInvoice;
        console.log('Invoice updated for student:', {
          customerId: updated.contact_id,
          customerName: updated.customer_name,
          invoiceId: invoice.invoice_id,
          total: invoice.total,
          balance: invoice.balance,
          paymentMade: invoice.payment_made
        });
      } else {
        // Create new invoice for existing student
        const invoiceData = {
          invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          invoice_number: `INV-${Date.now()}`,
          date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'sent',
          total: req.body.course_fees,
          balance: req.body.course_fees, // Initially balance equals total
          customer_id: updated.contact_id,
          customer_name: updated.customer_name,
          line_items: [{
            name: `${req.body.cf_pgdca_course || updated.cf_pgdca_course} Course Fee`,
            description: `Course fees for ${req.body.cf_pgdca_course || updated.cf_pgdca_course} - ${req.body.cf_batch_name || updated.cf_batch_name}`,
            quantity: 1,
            rate: req.body.course_fees,
            amount: req.body.course_fees
          }],
          payment_made: 0,
          payments: [],
          created_time: new Date(),
          last_modified_time: new Date(),
          custom_fields: []
        };
        
        invoice = await Invoice.create(invoiceData);
        console.log('Invoice created for student:', {
          customerId: updated.contact_id,
          customerName: updated.customer_name,
          invoiceId: invoice.invoice_id,
          total: invoice.total,
          balance: invoice.balance
        });
      }
    }

    // Send detailed notification
    let notificationMessage = `Updated student: ${updated.customer_name}`;
    
    // Track course fee changes
    if (req.body.course_fees !== undefined && req.body.course_fees !== currentCustomer.course_fees) {
      const oldFees = currentCustomer.course_fees || 0;
      const newFees = req.body.course_fees || 0;
      
      if (oldFees === 0 && newFees > 0) {
        notificationMessage += ` - Course fees added: ₹${newFees.toLocaleString()}`;
      } else if (oldFees > 0 && newFees > 0 && oldFees !== newFees) {
        notificationMessage += ` - Course fees updated: ₹${oldFees.toLocaleString()} → ₹${newFees.toLocaleString()}`;
      }
      
      // Add invoice details
      if (invoice) {
        if (existingInvoice) {
          notificationMessage += ` - Invoice updated (Total: ₹${invoice.total.toLocaleString()}, Balance: ₹${invoice.balance.toLocaleString()}, Paid: ₹${invoice.payment_made.toLocaleString()})`;
        } else {
          notificationMessage += ` - Invoice created (Total: ₹${invoice.total.toLocaleString()}, Balance: ₹${invoice.balance.toLocaleString()})`;
        }
      }
    } else {
      notificationMessage += ` - General details updated`;
    }
    
    await sendNotification(notificationMessage, req.body.user || (req.user && req.user.name));
    
    res.json({ 
      customer: updated, 
      invoice: invoice,
      message: invoice ? (existingInvoice ? 'Student updated and invoice updated successfully' : 'Student updated and invoice created successfully') : 'Student updated successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE /api/mongo/customers/:id - delete a single customer by contact_id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Customer.findOneAndDelete({ contact_id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Send notification
    await sendNotification(`Deleted student: ${deleted.customer_name}`, req.body.user || (req.user && req.user.name));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Catch-all for unexpected errors in this router
router.use((err, req, res, next) => {
  console.error('Unexpected error in mongoCustomers router:', err.stack || err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

module.exports = router; 