/**
 * API Configuration
 * Dynamic API URL detection - works with localhost, Ngrok, and production
 */
// Auto-detect API base URL based on current domain
const getAPIBaseURL = () => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return '/backend/api';
  }
  
  // Get current origin (protocol + host + port)
  const origin = window.location.origin;
  const port = window.location.port;
  
  // If Frontend is running on Vite dev server (port 5173, 3000, 8080, etc.)
  // and Backend is on Apache (port 80), use absolute URL to Apache
  if (port && (port === '5173' || port === '3000' || port === '8080' || port === '5174')) {
    // Frontend is on Vite dev server, Backend is on Apache (localhost:80)
    // Use absolute URL to Apache
    const host = window.location.hostname;
    return `http://qr-algo-je.xo.je/backend/api`;
  }
  
  // For production or when Frontend and Backend are on same domain
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

export default API_CONFIG;
