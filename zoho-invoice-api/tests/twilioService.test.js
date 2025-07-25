const twilio = require('twilio');

// Mock Twilio client
jest.mock('twilio', () => {
  const mockMessages = {
    create: jest.fn()
  };
  
  const mockClient = jest.fn(() => ({
    messages: mockMessages
  }));
  
  return mockClient;
});

// Import the service after mocking
const twilioService = require('../services/twilioService');

describe('Twilio Service', () => {
  let mockTwilioClient;
  let mockMessages;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get the mocked client and messages
    mockTwilioClient = twilio();
    mockMessages = mockTwilioClient.messages;
    
    // Ensure environment variables are set for each test
    process.env.TWILIO_WHATSAPP_NUMBER = '+1234567890';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  });

  describe('sendFeeReminder', () => {
    it('should send WhatsApp fee reminder successfully', async () => {
      const mockResponse = {
        sid: 'test-message-sid',
        status: 'sent'
      };
      
      mockMessages.create.mockResolvedValue(mockResponse);

      const result = await twilioService.sendFeeReminder(
        '+919876543210',
        'John Doe',
        5000,
        'PGDCA',
        'Batch A'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-sid');
      expect(result.status).toBe('sent');
      expect(result.channel).toBe('whatsapp');

      // Verify Twilio was called with correct parameters
      expect(mockMessages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('Dear John Doe'),
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+919876543210'
      });
    });

    it('should format phone number with country code if missing', async () => {
      const mockResponse = {
        sid: 'test-message-sid',
        status: 'sent'
      };
      
      mockMessages.create.mockResolvedValue(mockResponse);

      await twilioService.sendFeeReminder(
        '9876543210', // Without country code
        'John Doe',
        5000,
        'PGDCA',
        'Batch A'
      );

      expect(mockMessages.create).toHaveBeenCalledWith({
        body: expect.any(String),
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+919876543210'
      });
    });

    it('should handle WhatsApp channel errors and fallback to SMS', async () => {
      const whatsappError = new Error('Channel error');
      const smsResponse = {
        sid: 'sms-message-sid',
        status: 'sent'
      };

      mockMessages.create
        .mockRejectedValueOnce(whatsappError) // WhatsApp fails
        .mockResolvedValueOnce(smsResponse);  // SMS succeeds

      const result = await twilioService.sendFeeReminder(
        '+919876543210',
        'John Doe',
        5000,
        'PGDCA',
        'Batch A'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('sms-message-sid');
      expect(result.channel).toBe('sms_fallback');
      expect(mockMessages.create).toHaveBeenCalledTimes(2);
    });

    it('should handle both WhatsApp and SMS failures', async () => {
      const whatsappError = new Error('Channel error');
      const smsError = new Error('SMS error');

      mockMessages.create
        .mockRejectedValueOnce(whatsappError)
        .mockRejectedValueOnce(smsError);

      const result = await twilioService.sendFeeReminder(
        '+919876543210',
        'John Doe',
        5000,
        'PGDCA',
        'Batch A'
      );

      expect(result.success).toBe(false);
      expect(result.channel).toBe('both_failed');
      expect(result.error).toContain('WhatsApp failed');
    });

    it('should return error when WhatsApp number is not configured', async () => {
      // Temporarily remove WhatsApp number
      delete process.env.TWILIO_WHATSAPP_NUMBER;

      const result = await twilioService.sendFeeReminder(
        '+919876543210',
        'John Doe',
        5000,
        'PGDCA',
        'Batch A'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('TWILIO_WHATSAPP_NUMBER not configured');

      // Restore environment variable
      process.env.TWILIO_WHATSAPP_NUMBER = '+1234567890';
    });
  });

  describe('sendBulkFeeReminders', () => {
    it('should send bulk reminders to multiple students', async () => {
      const mockResponse = {
        sid: 'test-message-sid',
        status: 'sent'
      };
      
      mockMessages.create.mockResolvedValue(mockResponse);

      const unpaidStudents = [
        {
          contact_id: 'CUST001',
          customer_name: 'John Doe',
          phone: '+919876543210',
          outstanding_receivable_amount: '5000',
          cf_pgdca_course: 'PGDCA',
          cf_batch_name: 'Batch A'
        },
        {
          contact_id: 'CUST002',
          customer_name: 'Jane Smith',
          phone: '+919876543211',
          outstanding_receivable_amount: '3000',
          cf_pgdca_course: 'PGDCA',
          cf_batch_name: 'Batch B'
        }
      ];

      const results = await twilioService.sendBulkFeeReminders(unpaidStudents);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockMessages.create).toHaveBeenCalledTimes(2);
    });

    it('should handle students without phone numbers', async () => {
      const unpaidStudents = [
        {
          contact_id: 'CUST001',
          customer_name: 'John Doe',
          phone: null,
          outstanding_receivable_amount: '5000',
          cf_pgdca_course: 'PGDCA',
          cf_batch_name: 'Batch A'
        }
      ];

      const results = await twilioService.sendBulkFeeReminders(unpaidStudents);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('No phone number available');
      expect(mockMessages.create).not.toHaveBeenCalled();
    });

    it('should handle mixed success and failure scenarios', async () => {
      const mockResponse = {
        sid: 'test-message-sid',
        status: 'sent'
      };
      
      mockMessages.create
        .mockResolvedValueOnce(mockResponse)  // First student succeeds
        .mockRejectedValueOnce(new Error('Twilio error')); // Second student fails

      const unpaidStudents = [
        {
          contact_id: 'CUST001',
          customer_name: 'John Doe',
          phone: '+919876543210',
          outstanding_receivable_amount: '5000',
          cf_pgdca_course: 'PGDCA',
          cf_batch_name: 'Batch A'
        },
        {
          contact_id: 'CUST002',
          customer_name: 'Jane Smith',
          phone: '+919876543211',
          outstanding_receivable_amount: '3000',
          cf_pgdca_course: 'PGDCA',
          cf_batch_name: 'Batch B'
        }
      ];

      const results = await twilioService.sendBulkFeeReminders(unpaidStudents);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Twilio error');
    });
  });

  describe('sendCustomWhatsApp', () => {
    it('should send custom WhatsApp message successfully', async () => {
      const mockResponse = {
        sid: 'custom-message-sid',
        status: 'sent'
      };
      
      mockMessages.create.mockResolvedValue(mockResponse);

      const result = await twilioService.sendCustomWhatsApp(
        '+919876543210',
        'Custom test message'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('custom-message-sid');
      expect(result.status).toBe('sent');

      expect(mockMessages.create).toHaveBeenCalledWith({
        body: 'Custom test message',
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+919876543210'
      });
    });

    it('should handle custom WhatsApp message failure', async () => {
      const error = new Error('Twilio error');
      mockMessages.create.mockRejectedValue(error);

      const result = await twilioService.sendCustomWhatsApp(
        '+919876543210',
        'Custom test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Twilio error');
    });

    it('should format phone number correctly for custom messages', async () => {
      const mockResponse = {
        sid: 'custom-message-sid',
        status: 'sent'
      };
      
      mockMessages.create.mockResolvedValue(mockResponse);

      await twilioService.sendCustomWhatsApp(
        '9876543210', // Without country code
        'Custom test message'
      );

      expect(mockMessages.create).toHaveBeenCalledWith({
        body: 'Custom test message',
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+919876543210'
      });
    });
  });

  describe('sendWhatsAppOTP', () => {
    it('should send WhatsApp OTP successfully', async () => {
      const mockResponse = {
        sid: 'otp-message-sid',
        status: 'sent'
      };
      
      mockMessages.create.mockResolvedValue(mockResponse);

      const result = await twilioService.sendWhatsAppOTP(
        '+919876543210',
        '123456'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('otp-message-sid');
      expect(result.status).toBe('sent');

      expect(mockMessages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('123456'),
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+919876543210'
      });
    });

    it('should handle WhatsApp OTP failure', async () => {
      const error = new Error('TWILIO_WHATSAPP_NUMBER not configured');
      mockMessages.create.mockRejectedValue(error);

      const result = await twilioService.sendWhatsAppOTP(
        '+919876543210',
        '123456'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('TWILIO_WHATSAPP_NUMBER not configured');
    });

    it('should return error when WhatsApp number is not configured for OTP', async () => {
      // Temporarily remove WhatsApp number
      delete process.env.TWILIO_WHATSAPP_NUMBER;

      const result = await twilioService.sendWhatsAppOTP(
        '+919876543210',
        '123456'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('TWILIO_WHATSAPP_NUMBER not configured');

      // Restore environment variable
      process.env.TWILIO_WHATSAPP_NUMBER = '+1234567890';
    });
  });
}); 