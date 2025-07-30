// Environment-based API configuration
const getApiUrl = () => {
  // Check if running in production (served from same domain)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production: use same domain (relative URLs)
    return '';
  }
  
  // Development: use localhost backend
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiUrl();

// Helper function to build API endpoint URLs
export const buildApiUrl = (endpoint) => {
  // If endpoint starts with /, use it directly (relative URL)
  if (endpoint.startsWith('/')) {
    return `${API_BASE_URL}${endpoint}`;
  }
  
  // Otherwise, add /api/ prefix
  return `${API_BASE_URL}/api/${endpoint}`;
};

// Export common API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  
  // Student endpoints  
  STUDENT_LOGIN: '/api/student/login',
  STUDENT_RESET_PASSWORD: '/api/student/reset-password-request',
  
  
  // Dashboard data
  CUSTOMERS: '/api/mongo/customers',
  PAYMENTS: '/api/mongo/payments', 
  INVOICES: '/api/mongo/invoices'
};

export default {
  API_BASE_URL,
  buildApiUrl,
  API_ENDPOINTS
};