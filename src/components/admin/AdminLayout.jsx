import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../contexts/authStore';
import useBranchStore from '../../contexts/branchStore';
import useSubscriptionStore from '../../contexts/subscriptionStore';
import NotificationCenter from '../NotificationCenter';
import OrderNotificationToast from '../OrderNotificationToast';
import SubscriptionBlockModal from '../SubscriptionBlockModal';
import useNotificationStore from '../../contexts/notificationStore';
import restaurantService from '../../services/restaurantService';
import branchService from '../../services/branchService';
import themeService from '../../services/themeService';
import notificationService from '../../services/notificationService';
import authService from '../../services/authService';

// Apply theme to CSS variables
const applyTheme = (theme) => {
  const root = document.documentElement;
  
  // Apply all theme colors as CSS variables
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply additional CSS variables for buttons and cart
  if (theme.buttonBg) {
    root.style.setProperty('--color-button-bg', theme.buttonBg);
  }
  if (theme.buttonText) {
    root.style.setProperty('--color-button-text', theme.buttonText);
  }
  if (theme.cartBg) {
    root.style.setProperty('--color-cart-bg', theme.cartBg);
  }
  if (theme.cartText) {
    root.style.setProperty('--color-cart-text', theme.cartText);
  }
  
  // Apply primary as button background if not specified
  if (!theme.buttonBg && theme.primary) {
    root.style.setProperty('--color-button-bg', theme.primary);
  }
  // Apply text as cart text if not specified
  if (!theme.cartText && theme.text) {
    root.style.setProperty('--color-cart-text', theme.text);
  }
  // Apply background as cart background if not specified
  if (!theme.cartBg && theme.background) {
    root.style.setProperty('--color-cart-bg', theme.background);
  }
};

const AdminLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    selectedBranch, 
    branches, 
    setSelectedBranch, 
    setBranches, 
    getBranchDisplayName 
  } = useBranchStore();
  const { 
    unreadCount, 
    startListening, 
    stopListening, 
    requestNotificationPermission,
    latestNewOrder,
    clearLatestNewOrder
  } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [theme, setTheme] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const { currentSubscription, fetchCurrentSubscription } = useSubscriptionStore();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    // Get restaurantId from JWT token first, then fallback to user object
    const currentUser = authService.getCurrentUser();
    const restaurantId = currentUser?.restaurantId || user?.restaurantId || user?.uid;
    
    if (restaurantId) {
      fetchRestaurantSettings();
      fetchBranches();
      fetchTheme();
      fetchRestaurantInfo();
      fetchCurrentSubscription(restaurantId);
      requestNotificationPermission();
      
      // Poll for notifications every 5 seconds
      const notificationsInterval = setInterval(async () => {
        try {
          const notifications = await notificationService.getUserNotifications();
          const unreadCount = (notifications || []).filter(n => !n.is_read && !n.isRead).length;
          setUnreadNotificationsCount(unreadCount);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }, 5000);
      
      // Poll for subscription changes every 5 seconds
      const subscriptionInterval = setInterval(() => {
        const currentRestaurantId = getRestaurantId();
        if (currentRestaurantId) {
          fetchCurrentSubscription(currentRestaurantId);
        fetchRestaurantInfo();
        }
      }, 5000);
      
      return () => {
        clearInterval(notificationsInterval);
        clearInterval(subscriptionInterval);
      };
    }
  }, [user, fetchCurrentSubscription]);

  useEffect(() => {
    const restaurantId = getRestaurantId();
    if (restaurantId && selectedBranch !== undefined) {
      const branchId = selectedBranch ? selectedBranch.id : null;
      // Notification listener uses polling (every 5 seconds) instead of real-time
      try {
        startListening(restaurantId, branchId);
      } catch (error) {
        console.error('Error starting notification listener:', error);
      }
      
      return () => {
        try {
          stopListening();
        } catch (error) {
          console.error('Error stopping notification listener:', error);
        }
      };
    }
  }, [user, selectedBranch]);

  const getRestaurantId = () => {
    // Get restaurantId from JWT token first, then fallback to user object
    const currentUser = authService.getCurrentUser();
    return currentUser?.restaurantId || user?.restaurantId || user?.uid;
  };

  const fetchRestaurantSettings = async () => {
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) return;
      const settings = await restaurantService.getRestaurantSettings(restaurantId);
      setRestaurantSettings(settings);
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) return;
      const branchesData = await branchService.getBranches(restaurantId);
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchTheme = async () => {
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) return;
      const themeData = await themeService.getRestaurantTheme(restaurantId);
      setTheme(themeData);
      applyTheme(themeData);
    } catch (error) {
      console.error('Error fetching theme:', error);
    }
  };
  
  const fetchRestaurantInfo = async () => {
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) return;
      const info = await restaurantService.getRestaurant(restaurantId);
      setRestaurantInfo(info);
    } catch (error) {
      console.error('Error fetching restaurant info:', error);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBranchDropdown && !event.target.closest('.branch-dropdown')) {
        setShowBranchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBranchDropdown]);
  
  const isActiveSubscription = () => {
    if (!currentSubscription) return false;
    const now = new Date();
    let endDate = null;
    // Handle both camelCase (endDate) and snake_case (end_date) field names
    const sd = currentSubscription.endDate || currentSubscription.end_date;
    if (!sd) return false;
    
    // Handle different date formats
    if (sd.seconds !== undefined) {
      endDate = new Date(sd.seconds * 1000);
    } else if (sd.toDate && typeof sd.toDate === 'function') {
      endDate = sd.toDate();
    } else if (sd instanceof Date) {
      endDate = sd;
    } else if (typeof sd === 'string') {
      // MySQL DATETIME string or ISO string
      const dateStr = sd.replace(' ', 'T'); // Convert MySQL format to ISO-like format
      endDate = new Date(dateStr);
    } else if (sd._seconds) {
      endDate = new Date(sd._seconds * 1000);
    } else {
      endDate = new Date(sd);
    }
    
    if (!endDate || isNaN(endDate.getTime())) {
      return false;
    }
    
    return currentSubscription.status === 'active' && endDate > now;
  };

  const hasLimit = (key) => {
    const limits = currentSubscription?.limits || {};
    const val = limits[key];
    if (val === -1) return true;
    if (typeof val === 'boolean') return !!val;
    return (val || 0) > 0;
  };

  const restaurantActive = restaurantInfo?.is_active === 1 || restaurantInfo?.status === 'active';

  // Check if subscription is active
  const checkSubscriptionActive = () => {
    if (!currentSubscription) {
      return false;
    }
    
    // Check status first
    if (currentSubscription.status !== 'active') {
      return false;
    }
    
    const now = new Date();
    let endDate = null;
    // Handle both camelCase (endDate) and snake_case (end_date) field names
    const sd = currentSubscription.endDate || currentSubscription.end_date;
    
    if (!sd) {
      return false;
    }
    
    // Handle different date formats (MySQL DATETIME, ISO string, Date object)
    if (sd instanceof Date) {
      // Already a Date object
      endDate = sd;
    } else if (typeof sd === 'string') {
      // MySQL DATETIME string or ISO string
      // MySQL format: "2024-01-15 10:30:00"
      // ISO format: "2024-01-15T10:30:00.000Z"
      // Try to parse MySQL format first
      if (sd.includes(' ') && !sd.includes('T')) {
        // MySQL format: "2024-01-15 10:30:00"
        // Convert to ISO format: "2024-01-15T10:30:00"
        const dateStr = sd.replace(' ', 'T');
      endDate = new Date(dateStr);
      } else {
        endDate = new Date(sd);
      }
    } else if (sd && typeof sd === 'object') {
      // Handle legacy timestamp formats (for backward compatibility)
      if (sd.seconds !== undefined) {
        endDate = new Date(sd.seconds * 1000);
      } else if (sd.toDate && typeof sd.toDate === 'function') {
        endDate = sd.toDate();
    } else if (sd._seconds) {
      endDate = new Date(sd._seconds * 1000);
      }
    } else {
      // Try to parse as Date
      endDate = new Date(sd);
    }
    
    // Check if endDate is valid
    if (!endDate || isNaN(endDate.getTime())) {
      return false;
    }
    
    const isActive = endDate > now;
    
    return isActive;
  };

  // Add a clock state to force re-render and re-check subscription status
  const [subscriptionCheckClock, setSubscriptionCheckClock] = useState(Date.now());
  
  useEffect(() => {
    // Check subscription status every 2 seconds to catch updates quickly
    const interval = setInterval(() => {
      setSubscriptionCheckClock(Date.now());
      // Also refresh subscription data
      const restaurantId = getRestaurantId();
      if (restaurantId) {
        fetchCurrentSubscription(restaurantId).catch((err) => {
          console.error('Error refreshing subscription:', err);
        });
        fetchRestaurantInfo();
      }
    }, 2000); // Check every 2 seconds for faster updates
    
    return () => clearInterval(interval);
  }, [user?.uid, fetchCurrentSubscription]);

  const subscriptionActive = checkSubscriptionActive();
  // Block access only if subscription is not active, regardless of restaurant status
  // Restaurant status is managed separately and shouldn't block access if subscription is active
  const shouldBlockAccess = !subscriptionActive;
  
  // Removed debug logging to prevent console spam

  // Block access completely if restaurant is not active or subscription is not active
  if (shouldBlockAccess && user?.uid) {
    return (
      <>
        <SubscriptionBlockModal
          isOpen={true}
          restaurantStatus={restaurantActive}
          subscriptionStatus={currentSubscription?.status}
        />
      </>
    );
  }

  const baseNavigation = [
    { key: 'dashboard', name: t('admin.dashboard'), href: '/admin/dashboard', icon: 'dashboard', current: location.pathname === '/admin/dashboard' },
    { key: 'menu', name: t('admin.menu_items'), href: '/admin/menu-items', icon: 'menu', current: location.pathname === '/admin/menu-items' },
    { key: 'branches', name: 'الفروع', href: '/admin/branches', icon: 'branches', current: location.pathname === '/admin/branches' },
    { key: 'orders', name: 'الطلبات', href: '/admin/orders', icon: 'orders', current: location.pathname === '/admin/orders', badge: unreadCount },
    { key: 'revenue', name: 'الإيرادات', href: '/admin/revenue', icon: 'revenue', current: location.pathname === '/admin/revenue' },
    { key: 'analytics', name: t('admin.analytics'), href: '/admin/analytics', icon: 'analytics', current: location.pathname === '/admin/analytics' },
    { key: 'subscription', name: t('admin.subscription'), href: '/admin/subscription', icon: 'subscription', current: location.pathname === '/admin/subscription' },
    { key: 'settings', name: t('admin.settings'), href: '/admin/settings', icon: 'settings', current: location.pathname === '/admin/settings' },
  ];

  // Always show all navigation items, but disable them if needed
  const navigation = baseNavigation.map((item) => {
    let disabled = false;
    let disabledReason = '';
    
    // Core pages are always accessible
    if (item.key === 'subscription' || item.key === 'settings' || item.key === 'dashboard' || item.key === 'orders' || item.key === 'revenue') {
      return { ...item, disabled: false };
    }
    
    // Check if restaurant is active
    if (!restaurantActive) {
      disabled = true;
      disabledReason = 'المطعم غير نشط';
    }
    
    // Check subscription status
    if (!isActiveSubscription()) {
      disabled = true;
      disabledReason = 'الاشتراك غير نشط';
    }
    
    // Check specific limits
    if (item.key === 'menu' && !hasLimit('maxProducts')) {
      disabled = true;
      disabledReason = 'تم الوصول للحد الأقصى';
    }
    
    if (item.key === 'branches' && !hasLimit('maxBranches')) {
      disabled = true;
      disabledReason = 'تم الوصول للحد الأقصى';
    }
    
    if (item.key === 'analytics' && !hasLimit('analyticsRetention') && !hasLimit('advancedAnalytics')) {
      disabled = true;
      disabledReason = 'غير متاح في خطتك';
    }
    
    return { ...item, disabled, disabledReason };
  });

  const getIcon = (iconName, isActive = false) => {
    const iconClass = `w-5 h-5 ${isActive ? 'text-white' : 'text-current'}`;
    const icons = {
      dashboard: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      menu: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      analytics: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      subscription: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      branches: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      orders: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      themes: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      ),
      settings: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };
    return icons[iconName] || icons.dashboard;
  };

  
  return (
    <div 
      className={`min-h-screen flex transition-colors duration-250 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      data-theme={darkMode ? 'dark' : 'light'}
    >
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Soft UI Design */}
      <AnimatePresence>
        <motion.aside
          className={`${
            sidebarCollapsed ? 'w-20' : 'w-72'
          } ${
            darkMode 
              ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900' 
              : 'bg-white'
          } flex flex-col flex-shrink-0 transition-all duration-250 ease-in-out ${
            sidebarOpen ? 'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto' : 'hidden lg:flex'
          } ${
            darkMode 
              ? 'shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.1),0_4px_24px_rgba(0,0,0,0.4)]' 
              : 'shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.08)]'
          }`}
          initial={sidebarOpen ? { x: -288 } : false}
          animate={sidebarOpen ? { x: 0 } : false}
          exit={{ x: -288 }}
          transition={{ duration: 0.25, ease: 'ease-in-out' }}
        >
          {/* User Profile Section */}
          <div className={`p-4 border-b ${
            darkMode ? 'border-slate-700/50' : 'border-gray-200/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <motion.div
                  className="relative flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    darkMode 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg' 
                      : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-md'
                  }`}>
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                    darkMode ? 'border-slate-800' : 'border-white'
                  } bg-green-500`}></div>
                </motion.div>
                {!sidebarCollapsed && (
                  <motion.div
                    className="flex-1 min-w-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className={`text-sm font-semibold truncate ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className={`text-xs truncate ${
                      darkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      Manager
                    </p>
                  </motion.div>
                )}
              </div>
              {!sidebarCollapsed && (
                <motion.button
                  onClick={() => setSidebarCollapsed(true)}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    darkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              )}
              {sidebarCollapsed && (
                <motion.button
                  onClick={() => setSidebarCollapsed(false)}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    darkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>


          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
            <div className="space-y-1">
              {navigation.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                >
                  <Link
                    to={item.href}
                    className={`group relative flex items-center ${
                      sidebarCollapsed ? 'justify-center' : 'justify-between'
                    } px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      item.current
                        ? darkMode
                          ? 'bg-[#ff2d2d] text-white shadow-lg shadow-[#ff2d2d]/30'
                          : 'bg-[#ff2d2d] text-white shadow-lg shadow-[#ff2d2d]/20'
                        : darkMode
                          ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <motion.div
                        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          item.current
                            ? darkMode
                              ? 'bg-white/20'
                              : 'bg-white/20'
                            : darkMode
                              ? 'bg-slate-700/50 group-hover:bg-slate-700'
                              : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {getIcon(item.icon, item.current)}
                      </motion.div>
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium truncate flex-1">
                          {item.name}
                        </span>
                      )}
                    </div>
                    
                    {/* Badge */}
                    {!sidebarCollapsed && item.badge && item.badge > 0 && (
                      <motion.span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.current
                            ? 'bg-white/20 text-white'
                            : darkMode
                              ? 'bg-[#ff2d2d] text-white'
                              : 'bg-[#ff2d2d] text-white'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                    
                    {/* Add icon for Messages */}
                    {!sidebarCollapsed && item.icon === 'orders' && (
                      <motion.button
                        className={`ml-2 w-6 h-6 rounded-full flex items-center justify-center ${
                          darkMode
                            ? 'bg-[#ff2d2d]/20 text-[#ff2d2d] hover:bg-[#ff2d2d]/30'
                            : 'bg-[#ff2d2d]/10 text-[#ff2d2d] hover:bg-[#ff2d2d]/20'
                        } transition-all duration-200`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </motion.button>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </nav>

          {/* Dark Mode Toggle */}
          <div className={`p-4 border-t ${
            darkMode ? 'border-slate-700/50' : 'border-gray-200/50'
          }`}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                darkMode
                  ? 'bg-slate-800/50 hover:bg-slate-700/50'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-slate-700' : 'bg-white'
                }`}>
                  {darkMode ? (
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Logout Button */}
          <div className={`p-4 border-t ${
            darkMode ? 'border-slate-700/50' : 'border-gray-200/50'
          }`}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                darkMode
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300'
                  : 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                darkMode ? 'bg-red-600/30' : 'bg-red-100'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">
                  تسجيل الخروج
                </span>
              )}
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar - Soft UI Design */}
        <motion.header 
          className={`sticky top-0 z-40 transition-all duration-250 ${
            darkMode
              ? 'bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.3)]'
              : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.08)]'
          }`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2.5 rounded-xl transition-all duration-200 ${
                  darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>

              {/* Page Title */}
              <div className="flex items-center gap-3">
                <div className={`w-1 h-8 rounded-full ${
                  darkMode ? 'bg-[#ff2d2d]' : 'bg-[#ff2d2d]'
                }`}></div>
                <div>
                  <h2 className={`text-xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {navigation.find(item => item.current)?.name || t('admin.dashboard')}
                  </h2>
                  <p className={`text-xs ${
                    darkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    {t('admin.dashboard')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Branch Selector */}
              {branches.length > 0 && (
                <div className="relative branch-dropdown">
                  <motion.button
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm ${
                      darkMode
                        ? 'bg-slate-800/50 hover:bg-slate-700/50 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="hidden sm:inline">
                      {selectedBranch ? selectedBranch.name : (restaurantSettings?.mainRestaurantNameAr || restaurantInfo?.restaurant_name || restaurantSettings?.name || 'المطعم الرئيسي')}
                    </span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${showBranchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.button>

                  {/* Branch Dropdown */}
                  {showBranchDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute left-0 mt-2 w-64 rounded-xl shadow-2xl z-50 ${
                        darkMode
                          ? 'bg-slate-800 border border-slate-700'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setSelectedBranch(null);
                            setShowBranchDropdown(false);
                          }}
                          className={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 ${
                            !selectedBranch
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500 text-white'
                              : darkMode
                                ? 'hover:bg-slate-700 text-slate-200'
                                : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {restaurantSettings?.mainRestaurantNameAr || restaurantInfo?.restaurant_name || restaurantSettings?.name || 'المطعم الرئيسي'}
                            </span>
                            {!selectedBranch && (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                        {branches.map((branch) => (
                          <button
                            key={branch.id}
                            onClick={() => {
                              setSelectedBranch(branch);
                              setShowBranchDropdown(false);
                            }}
                            className={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 mt-1 ${
                              selectedBranch && selectedBranch.id === branch.id
                                ? darkMode
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                                : darkMode
                                  ? 'hover:bg-slate-700 text-slate-200'
                                  : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{branch.name}</span>
                              {selectedBranch && selectedBranch.id === branch.id && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Notifications Button */}
              <motion.button
                onClick={() => setShowNotifications(true)}
                className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                  darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? 'bg-slate-800/50 group-hover:bg-slate-700/50'
                    : 'bg-gray-100 group-hover:bg-gray-200'
                } transition-colors`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                {unreadNotificationsCount > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 bg-[#ff2d2d] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg shadow-[#ff2d2d]/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </motion.span>
                )}
              </motion.button>
              
              {/* Language Toggle */}
              <motion.button
                onClick={toggleLanguage}
                className={`px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                  darkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? 'bg-slate-800/50 hover:bg-slate-700/50'
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}>
                  <span className="text-xs font-semibold">
                    {i18n.language === 'en' ? 'عربي' : 'EN'}
                  </span>
                </div>
              </motion.button>

              {/* User Profile Button */}
              <motion.button
                className={`relative p-1 rounded-xl transition-all duration-200 ${
                  darkMode
                    ? 'hover:bg-slate-800/50'
                    : 'hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm ${
                  darkMode 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg' 
                    : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-md'
                }`}>
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                  darkMode ? 'border-slate-800' : 'border-white'
                } bg-green-500`}></div>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <main className={`flex-1 p-6 overflow-auto transition-colors duration-250 ${
          darkMode ? 'bg-slate-900' : 'bg-gray-50'
        }`}>
          {shouldBlockAccess ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">الوصول غير متاح</h2>
                <p className="text-gray-600">
                  {!restaurantActive && 'المطعم غير نشط حالياً'}
                  {restaurantActive && !subscriptionActive && 'الاشتراك غير نشط أو منتهي الصلاحية'}
                </p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          )}
        </main>
      </div>

      {/* Notification Center Modal */}
      <NotificationCenter
        userId={user?.uid}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Order Notification Toast */}
      {latestNewOrder && (
        <OrderNotificationToast
          order={latestNewOrder}
          onClose={clearLatestNewOrder}
          onView={() => {
            clearLatestNewOrder();
            navigate('/admin/orders');
          }}
        />
      )}
    </div>
  );
};

export default AdminLayout;
