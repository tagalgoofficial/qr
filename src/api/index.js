/**
 * Centralized API Configuration and Service
 * ملف مركزي واحد لجميع عمليات API
 */

// ============================================
// API Configuration
// ============================================
// Dynamic API URL detection - works with localhost, Ngrok, and production
// Supports separate Backend and Frontend hosting
const getAPIBaseURL = () => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return '/backend/api';
  }
  
  // Priority 1: Check if Backend URL is configured in index.html
  // This allows setting a different Backend domain for production
  if (window.API_BACKEND_URL) {
    return window.API_BACKEND_URL;
  }
  
  // Priority 2: If Frontend is running on Vite dev server (port 5173, 3000, 8080, etc.)
  // and Backend is on Apache (port 80), use absolute URL to Apache
  const port = window.location.port;
  if (port && (port === '5173' || port === '3000' || port === '8080' || port === '5174')) {
    // Frontend is on Vite dev server, Backend is on Apache (localhost:80)
    // Use absolute URL to Apache
    const host = window.location.hostname;
    return `http://${host}/backend/api`;
  }
  
  // Priority 3: For production or when Frontend and Backend are on same domain
  // Use relative URL (works on localhost:80, Ngrok, and production)
  return '/backend/api';
};

const API_CONFIG = {
  BASE_URL: getAPIBaseURL(),
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: {
      REGISTER: '/auth/register.php',
      LOGIN: '/auth/login.php',
      LOGOUT: '/auth/logout.php',
      VERIFY: '/auth/verify.php',
      RESET_PASSWORD: '/auth/reset-password.php'
    },
    
    // Restaurants
    RESTAURANTS: {
      GET: '/restaurants/get.php',
      UPDATE: '/restaurants/update.php',
      THEME: {
        GET: '/restaurants/theme/get.php',
        UPDATE: '/restaurants/theme/update.php'
      }
    },
    
    // Products
    PRODUCTS: {
      LIST: '/products/list.php',
      GET: '/products/get.php',
      CREATE: '/products/create.php',
      UPDATE: '/products/update.php',
      DELETE: '/products/delete.php'
    },
    
    // Categories
    CATEGORIES: {
      LIST: '/categories/list.php',
      CREATE: '/categories/create.php',
      UPDATE: '/categories/update.php',
      DELETE: '/categories/delete.php'
    },
    
    // Branches
    BRANCHES: {
      LIST: '/branches/list.php',
      CREATE: '/branches/create.php',
      UPDATE: '/branches/update.php',
      DELETE: '/branches/delete.php'
    },
    
    // Orders
    ORDERS: {
      CREATE: '/orders/create.php',
      LIST: '/orders/list.php',
      UPDATE_STATUS: '/orders/update-status.php'
    },
    
    // Notifications
    NOTIFICATIONS: {
      LIST: '/notifications/list.php',
      MARK_READ: '/notifications/mark-read.php'
    },
    
    // Subscriptions
    SUBSCRIPTIONS: {
      GET: '/subscriptions/get.php',
      USAGE: '/subscriptions/usage.php'
    },
    
    // Upload
    UPLOAD: {
      IMAGE: '/upload/image.php'
    },
    
    // Super Admin
    SUPER_ADMIN: {
      CREATE: '/superadmin/create.php',
      RESTAURANTS: {
        LIST: '/superadmin/restaurants/list.php',
        UPDATE: '/superadmin/restaurants/update.php'
      },
      SUBSCRIPTION_PLANS: {
        LIST: '/superadmin/subscription-plans/list.php',
        CREATE: '/superadmin/subscription-plans/create.php',
        UPDATE: '/superadmin/subscription-plans/update.php',
        DELETE: '/superadmin/subscription-plans/delete.php'
      },
      ANALYTICS: {
        GET: '/superadmin/analytics/get.php'
      },
      PAYMENT_METHODS: {
        LIST: '/superadmin/payment-methods/list.php',
        CREATE: '/superadmin/payment-methods/create.php',
        UPDATE: '/superadmin/payment-methods/update.php',
        DELETE: '/superadmin/payment-methods/delete.php'
      },
      PAYMENTS: {
        LIST: '/superadmin/payments/list.php',
        UPDATE_STATUS: '/superadmin/payments/update-status.php'
      },
      SUBSCRIPTIONS: {
        LIST: '/superadmin/subscriptions/list.php',
        CREATE: '/superadmin/subscriptions/create.php',
        UPDATE: '/superadmin/subscriptions/update.php'
      }
    }
  }
};

// ============================================
// API Service Class
// ============================================
class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Get Base URL dynamically (reads from window.API_BACKEND_URL if available)
   */
  getBaseURL() {
    // Priority 1: Check if Backend URL is configured in index.html
    if (typeof window !== 'undefined' && window.API_BACKEND_URL) {
      console.log('🔗 [ApiService] Using window.API_BACKEND_URL:', window.API_BACKEND_URL);
      return window.API_BACKEND_URL;
    }
    
    // Priority 2: Check Vite environment variable
    if (import.meta.env.VITE_API_BACKEND_URL) {
      console.log('🔗 [ApiService] Using VITE_API_BACKEND_URL:', import.meta.env.VITE_API_BACKEND_URL);
      return import.meta.env.VITE_API_BACKEND_URL;
    }
    
    // Priority 3: Use API_CONFIG.BASE_URL (which is calculated dynamically)
    const baseURL = API_CONFIG.BASE_URL;
    console.log('🔗 [ApiService] Using API_CONFIG.BASE_URL:', baseURL);
    return baseURL;
  }

  /**
   * Set Auth Token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get Auth Token
   */
  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  /**
   * Build URL
   * Handles both relative and absolute URLs
   */
  buildURL(endpoint) {
    const baseURL = this.getBaseURL();
    // If baseURL is relative, just concatenate
    if (baseURL.startsWith('/')) {
      return `${baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    }
    // If baseURL is absolute, use it as is
    return `${baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }

  /**
   * Get Headers
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    return headers;
  }

  /**
   * Handle Response
   */
  async handleResponse(response) {
    // Handle empty responses (some endpoints might return empty)
    let data = {};
    
    // Try to parse as JSON regardless of content-type (sometimes PHP sends text/html but content is JSON)
    try {
      const text = await response.text();
      
      if (text && text.trim()) {
        // Try to parse as JSON
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          // If JSON parsing fails, log and return empty object
          console.error('JSON parse error:', parseError, 'Text:', text.substring(0, 200));
          data = {};
        }
      } else {
        console.warn('Empty response text');
      }
    } catch (e) {
      // Error reading response, return empty object
      console.error('Error reading response:', e);
      data = {};
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Request failed');
      error.status = response.status;
      error.response = { status: response.status, data };
      error.data = data;
      console.error('Response not OK:', response.status, data);
      throw error;
    }

    // Return the full response object (which includes data, success, message)
    return data;
  }

  /**
   * GET Request
   */
  async get(endpoint, params = {}, includeAuth = true) {
    let urlString = this.buildURL(endpoint);
    
    // Handle query parameters for relative URLs
    const paramsArray = [];
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        paramsArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    
    if (paramsArray.length > 0) {
      const separator = urlString.includes('?') ? '&' : '?';
      urlString += separator + paramsArray.join('&');
    }

    try {
      const response = await fetch(urlString, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      return this.handleResponse(response);
    } catch (error) {
      // Re-throw network errors
      throw error;
    }
  }

  /**
   * POST Request
   */
  async post(endpoint, data = {}, includeAuth = true) {
    const response = await fetch(this.buildURL(endpoint), {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * PUT Request
   */
  async put(endpoint, data = {}, includeAuth = true) {
    const url = this.buildURL(endpoint);
    const body = JSON.stringify(data);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: body,
    });

    return this.handleResponse(response);
  }

  /**
   * PATCH Request
   */
  async patch(endpoint, data = {}, includeAuth = true) {
    const response = await fetch(this.buildURL(endpoint), {
      method: 'PATCH',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * DELETE Request
   */
  async delete(endpoint, params = {}, includeAuth = true) {
    let urlString = this.buildURL(endpoint);
    
    // Handle query parameters for relative URLs
    const paramsArray = [];
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        paramsArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    
    if (paramsArray.length > 0) {
      const separator = urlString.includes('?') ? '&' : '?';
      urlString += separator + paramsArray.join('&');
    }

    const response = await fetch(urlString, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse(response);
  }

  /**
   * Upload File
   */
  async uploadFile(endpoint, file, folder = 'general') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const headers = {};
    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    const response = await fetch(this.buildURL(endpoint), {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }
}

// ============================================
// Export Singleton Instance
// ============================================
const api = new ApiService();

// Export API_CONFIG and api instance
export { API_CONFIG };
export default api;
