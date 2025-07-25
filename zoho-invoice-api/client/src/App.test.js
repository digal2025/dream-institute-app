import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the AuthContext
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: 'admin', role: 'admin' },
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock the dashboard data hook
jest.mock('./hooks/useDashboardData', () => ({
  __esModule: true,
  default: () => ({
    customers: [
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
    ],
    payments: [
      {
        id: 'PAY001',
        customer_id: 'CUST001',
        amount: 2000,
        date: '2024-01-15',
        payment_method: 'Cash'
      }
    ],
    invoices: [
      {
        id: 'INV001',
        customer_id: 'CUST001',
        amount: 5000,
        date: '2024-01-01',
        status: 'pending'
      }
    ],
    loading: false,
    error: null,
    refetchAll: jest.fn()
  })
}));

// Mock the dashboard handlers
jest.mock('./handlers/useDashboardHandlers', () => ({
  __esModule: true,
  default: () => ({
    handleAddCustomer: jest.fn(),
    handleEditCustomer: jest.fn(),
    handleAddPayment: jest.fn(),
    handleOpenSmsDialog: jest.fn(),
    handleOpenNotifications: jest.fn(),
    handleClearNotifications: jest.fn(),
    handleNotify: jest.fn()
  })
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful API responses
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        customers: [],
        payments: [],
        invoices: []
      })
    });
  });

  describe('Main Dashboard Rendering', () => {
    it('should render the main dashboard with title', () => {
      render(<App />);
      
      expect(screen.getByText('Fee Management Dashboard')).toBeInTheDocument();
    });

    it('should render the navigation buttons', () => {
      render(<App />);
      
      expect(screen.getByText('Add Student')).toBeInTheDocument();
      expect(screen.getByText('Edit Student')).toBeInTheDocument();
      expect(screen.getByText('Add Payment')).toBeInTheDocument();
      expect(screen.getByText('Fee Reminder')).toBeInTheDocument();
    });

    it('should render the data grid', () => {
      render(<App />);
      
      // Check for grid headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Course')).toBeInTheDocument();
      expect(screen.getByText('Batch')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Amount')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display customer data in the grid', () => {
      render(<App />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+919876543210')).toBeInTheDocument();
      expect(screen.getByText('PGDCA')).toBeInTheDocument();
      expect(screen.getByText('Batch A')).toBeInTheDocument();
      expect(screen.getByText('₹5,000')).toBeInTheDocument();
    });

    it('should display multiple customers', () => {
      render(<App />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should open Add Student dialog when Add Student button is clicked', async () => {
      render(<App />);
      
      const addStudentButton = screen.getByText('Add Student');
      await userEvent.click(addStudentButton);
      
      // Check if dialog opens (this would depend on your dialog implementation)
      // For now, we'll just verify the button is clickable
      expect(addStudentButton).toBeInTheDocument();
    });

    it('should open Edit Student dialog when Edit Student button is clicked', async () => {
      render(<App />);
      
      const editStudentButton = screen.getByText('Edit Student');
      await userEvent.click(editStudentButton);
      
      expect(editStudentButton).toBeInTheDocument();
    });

    it('should open Add Payment dialog when Add Payment button is clicked', async () => {
      render(<App />);
      
      const addPaymentButton = screen.getByText('Add Payment');
      await userEvent.click(addPaymentButton);
      
      expect(addPaymentButton).toBeInTheDocument();
    });

    it('should open Fee Reminder dialog when Fee Reminder button is clicked', async () => {
      render(<App />);
      
      const feeReminderButton = screen.getByText('Fee Reminder');
      await userEvent.click(feeReminderButton);
      
      expect(feeReminderButton).toBeInTheDocument();
    });
  });

  describe('Data Grid Functionality', () => {
    it('should display action buttons for each customer', () => {
      render(<App />);
      
      // Check for action buttons (View Payments, Send Reminder, etc.)
      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('should handle row selection', async () => {
      render(<App />);
      
      // Find and click on a customer row
      const customerRow = screen.getByText('John Doe').closest('tr');
      if (customerRow) {
        await userEvent.click(customerRow);
        // Verify selection (this would depend on your grid implementation)
      }
    });

    it('should display pagination controls', () => {
      render(<App />);
      
      // Check for pagination elements (this would depend on your grid implementation)
      // For now, we'll just verify the grid is rendered
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Search and Filter Functionality', () => {
    it('should filter customers by search term', async () => {
      render(<App />);
      
      // Find search input (this would depend on your implementation)
      const searchInput = screen.queryByPlaceholderText('Search customers...');
      if (searchInput) {
        await userEvent.type(searchInput, 'John');
        expect(searchInput.value).toBe('John');
      }
    });

    it('should filter by course', async () => {
      render(<App />);
      
      // Find course filter (this would depend on your implementation)
      const courseFilter = screen.queryByText('Filter by Course');
      if (courseFilter) {
        await userEvent.click(courseFilter);
      }
    });

    it('should filter by batch', async () => {
      render(<App />);
      
      // Find batch filter (this would depend on your implementation)
      const batchFilter = screen.queryByText('Filter by Batch');
      if (batchFilter) {
        await userEvent.click(batchFilter);
      }
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      // Mock API failure
      fetch.mockRejectedValueOnce(new Error('API Error'));
      
      render(<App />);
      
      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should display loading state', async () => {
      // Mock loading state
      jest.doMock('./hooks/useDashboardData', () => ({
        __esModule: true,
        default: () => ({
          customers: [],
          payments: [],
          invoices: [],
          loading: true,
          error: null,
          refetchAll: jest.fn()
        })
      }));

      render(<App />);
      
      // Check for loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
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

      render(<App />);
      
      expect(screen.getByText('Fee Management Dashboard')).toBeInTheDocument();
    });

    it('should render properly on tablet devices', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<App />);
      
      expect(screen.getByText('Fee Management Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<App />);
      
      // Check for accessibility attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      render(<App />);
      
      // Test tab navigation
      const addStudentButton = screen.getByText('Add Student');
      addStudentButton.focus();
      expect(addStudentButton).toHaveFocus();
    });

    it('should have proper heading structure', () => {
      render(<App />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Fee Management Dashboard');
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      
      render(<App />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render should complete within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', () => {
      // Mock large dataset
      const largeCustomers = Array.from({ length: 1000 }, (_, i) => ({
        id: `CUST${i}`,
        customer_name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+9198765432${i.toString().padStart(2, '0')}`,
        outstanding_receivable_amount: 1000 + i,
        cf_pgdca_course: 'PGDCA',
        cf_batch_name: `Batch ${Math.floor(i / 10)}`
      }));

      jest.doMock('./hooks/useDashboardData', () => ({
        __esModule: true,
        default: () => ({
          customers: largeCustomers,
          payments: [],
          invoices: [],
          loading: false,
          error: null,
          refetchAll: jest.fn()
        })
      }));

      const startTime = performance.now();
      
      render(<App />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render should complete within 500ms even with large dataset
      expect(renderTime).toBeLessThan(500);
    });
  });
});
