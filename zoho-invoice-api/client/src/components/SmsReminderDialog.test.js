import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SmsReminderDialog from './SmsReminderDialog';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Dialog: ({ children, open, onClose }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogActions: ({ children }) => <div data-testid="dialog-actions">{children}</div>,
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableHead: ({ children }) => <thead data-testid="table-head">{children}</thead>,
  TableBody: ({ children }) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }) => <tr data-testid="table-row">{children}</tr>,
  TableCell: ({ children }) => <td data-testid="table-cell">{children}</td>,
  TableHead: ({ children }) => <th data-testid="table-header">{children}</th>,
  CircularProgress: () => <div data-testid="loading-spinner">Loading...</div>,
  Alert: ({ severity, children }) => <div data-testid={`alert-${severity}`}>{children}</div>,
  Box: ({ children }) => <div data-testid="box">{children}</div>,
  Typography: ({ children, variant }) => <div data-testid={`typography-${variant}`}>{children}</div>
}));

describe('SmsReminderDialog Component', () => {
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onNotify: jest.fn()
  };

  const mockUnpaidStudents = [
    {
      id: 'CUST001',
      customer_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+919876543210',
      outstanding_receivable_amount: 5000,
      cf_pgdca_course: 'PGDCA',
      cf_batch_name: 'Batch A'
    },
    {
      id: 'CUST002',
      customer_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+919876543211',
      outstanding_receivable_amount: 3000,
      cf_pgdca_course: 'PGDCA',
      cf_batch_name: 'Batch B'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        unpaidStudents: mockUnpaidStudents
      })
    });
  });

  describe('Dialog Rendering', () => {
    it('should render dialog when open is true', () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-actions')).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      render(<SmsReminderDialog {...mockProps} open={false} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should display correct dialog title', () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      expect(screen.getByText('Fee Reminder')).toBeInTheDocument();
    });

    it('should display unpaid students table', () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByTestId('table-head')).toBeInTheDocument();
      expect(screen.getByTestId('table-body')).toBeInTheDocument();
    });
  });

  describe('Table Headers', () => {
    it('should display correct table headers', () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Course')).toBeInTheDocument();
      expect(screen.getByText('Batch')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Amount')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Student Data Display', () => {
    it('should display student information in table rows', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('+919876543210')).toBeInTheDocument();
        expect(screen.getByText('PGDCA')).toBeInTheDocument();
        expect(screen.getByText('Batch A')).toBeInTheDocument();
        expect(screen.getByText('₹5,000')).toBeInTheDocument();
      });
    });

    it('should display multiple students', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should format currency amounts correctly', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('₹5,000')).toBeInTheDocument();
        expect(screen.getByText('₹3,000')).toBeInTheDocument();
      });
    });
  });

  describe('Individual Reminder Actions', () => {
    it('should display Send Reminder button for each student', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        const sendButtons = screen.getAllByText('Send Reminder');
        expect(sendButtons.length).toBe(2);
      });
    });

    it('should send individual reminder when Send Reminder button is clicked', async () => {
      // Mock successful reminder send
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Fee reminder email sent to john.doe@example.com.'
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const sendButtons = screen.getAllByText('Send Reminder');
        await userEvent.click(sendButtons[0]);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/sms/send-reminder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: 'CUST001'
          })
        });
      });
    });

    it('should show success message after sending individual reminder', async () => {
      // Mock successful reminder send
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Fee reminder email sent to john.doe@example.com.'
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const sendButtons = screen.getAllByText('Send Reminder');
        await userEvent.click(sendButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Fee reminder email sent to john.doe@example.com.')).toBeInTheDocument();
      });
    });

    it('should show error message when individual reminder fails', async () => {
      // Mock failed reminder send
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to send reminder'
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const sendButtons = screen.getAllByText('Send Reminder');
        await userEvent.click(sendButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to send reminder: Failed to send reminder')).toBeInTheDocument();
      });
    });

    it('should disable Send Reminder button while sending', async () => {
      // Mock slow API response
      fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const sendButtons = screen.getAllByText('Send Reminder');
        await userEvent.click(sendButtons[0]);
        
        // Button should be disabled while sending
        expect(sendButtons[0]).toBeDisabled();
      });
    });
  });

  describe('Bulk Reminder Actions', () => {
    it('should display Send Fee Reminder to All button', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Send Fee Reminder to All (2)')).toBeInTheDocument();
      });
    });

    it('should send bulk reminders when Send Fee Reminder to All button is clicked', async () => {
      // Mock successful bulk reminder send
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Bulk reminders sent successfully'
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const bulkButton = screen.getByText('Send Fee Reminder to All (2)');
        await userEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/sms/send-bulk-reminders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
      });
    });

    it('should show success message after sending bulk reminders', async () => {
      // Mock successful bulk reminder send
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Bulk reminders sent successfully'
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const bulkButton = screen.getByText('Send Fee Reminder to All (2)');
        await userEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Bulk reminders sent successfully')).toBeInTheDocument();
      });
    });

    it('should show error message when bulk reminders fail', async () => {
      // Mock failed bulk reminder send
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to send bulk reminders'
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const bulkButton = screen.getByText('Send Fee Reminder to All (2)');
        await userEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to send bulk reminders: Failed to send bulk reminders')).toBeInTheDocument();
      });
    });

    it('should disable bulk button while sending', async () => {
      // Mock slow API response
      fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const bulkButton = screen.getByText('Send Fee Reminder to All (2)');
        await userEvent.click(bulkButton);
        
        // Button should show loading state
        expect(screen.getByText('Sending All...')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching unpaid students', () => {
      // Mock slow API response
      fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<SmsReminderDialog {...mockProps} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading spinner after data is loaded', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API call fails', async () => {
      // Mock API failure
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show error message when no unpaid students found', async () => {
      // Mock empty response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          unpaidStudents: []
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/no unpaid students/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Actions', () => {
    it('should call onClose when Close button is clicked', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      const closeButton = screen.getByText('Close');
      await userEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onNotify when notification is triggered', async () => {
      // Mock successful reminder send
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Fee reminder email sent to john.doe@example.com.'
        })
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      await waitFor(async () => {
        const sendButtons = screen.getAllByText('Send Reminder');
        await userEvent.click(sendButtons[0]);
      });

      await waitFor(() => {
        expect(mockProps.onNotify).toHaveBeenCalledWith({
          message: 'Fee reminder email sent to john.doe@example.com.'
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      // Test tab navigation
      const closeButton = screen.getByText('Close');
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });

    it('should have proper table accessibility', () => {
      render(<SmsReminderDialog {...mockProps} />);
      
      const table = screen.getByTestId('table');
      expect(table).toHaveAttribute('role', 'table');
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should render properly on tablet devices', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<SmsReminderDialog {...mockProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      
      render(<SmsReminderDialog {...mockProps} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render should complete within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large number of students efficiently', () => {
      // Mock large dataset
      const largeUnpaidStudents = Array.from({ length: 100 }, (_, i) => ({
        id: `CUST${i}`,
        customer_name: `Student ${i}`,
        email: `student${i}@example.com`,
        phone: `+9198765432${i.toString().padStart(2, '0')}`,
        outstanding_receivable_amount: 1000 + i,
        cf_pgdca_course: 'PGDCA',
        cf_batch_name: `Batch ${Math.floor(i / 10)}`
      }));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          unpaidStudents: largeUnpaidStudents
        })
      });

      const startTime = performance.now();
      
      render(<SmsReminderDialog {...mockProps} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render should complete within 500ms even with large dataset
      expect(renderTime).toBeLessThan(500);
    });
  });
}); 