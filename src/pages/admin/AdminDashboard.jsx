import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import useAuthStore from '../../contexts/authStore';
import useRestaurantStore from '../../contexts/restaurantStore';
import useBranchStore from '../../contexts/branchStore';
import useNotificationStore from '../../contexts/notificationStore';
import { generateQRCode } from '../../utils/qrCodeGenerator';
import restaurantService from '../../services/restaurantService';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import branchService from '../../services/branchService';
import orderService from '../../services/orderService';
import subscriptionService from '../../services/subscriptionService';
import authService from '../../services/authService';
import AnimatedCard from '../../components/AnimatedCard';
import FadeIn from '../../components/FadeIn';

// Admin Layout Component
import AdminLayout from '../../components/admin/AdminLayout';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { settings, menuItems, fetchMenuItems, fetchSettings } = useRestaurantStore();
  const { selectedBranch, branches, setSelectedBranch, setBranches, isMainRestaurant } = useBranchStore();
  const { unreadCount, startListening, stopListening, requestNotificationPermission } = useNotificationStore();
  
  const [qrCodeURL, setQRCodeURL] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCategories: 0,
    totalViews: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    preparingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    mostViewedItem: null
  });
  
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realSettings, setRealSettings] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [realCategories, setRealCategories] = useState([]);
  const [realProducts, setRealProducts] = useState([]);
  const [realOrders, setRealOrders] = useState([]);
  const [branchStats, setBranchStats] = useState({});
  const [ordersPollInterval, setOrdersPollInterval] = useState(null);
  
  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    // Prioritize restaurantId from JWT token, then from user object
    // Never use uid as it's user ID not restaurant ID
    // If restaurantId in JWT is the same as userId, it means the JWT was created incorrectly
    // In that case, we should fetch it from the user object or verify endpoint
    let restaurantId = currentUser?.restaurantId || user?.restaurantId;
    
    // Safety check: If restaurantId equals userId, it's likely incorrect
    // This can happen if the JWT token was created with user ID instead of restaurant ID
    if (restaurantId && currentUser?.userId && restaurantId === currentUser.userId) {
      // Try to get from user object instead
      restaurantId = user?.restaurantId;
    }
    
    return restaurantId;
  };
  
  useEffect(() => {
    const restaurantId = getRestaurantId();
    if (restaurantId) {
      fetchRealData();
      fetchBranches();
      fetchOrders();
    } else {
      // If no user, stop loading
      setIsLoading(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (ordersPollInterval) {
        clearInterval(ordersPollInterval);
      }
    };
  }, [user]);

  useEffect(() => {
    const restaurantId = getRestaurantId();
    if (user && restaurantId && (selectedBranch !== undefined || isMainRestaurant())) {
      // Start notification listener for real-time notifications
      const branchId = selectedBranch ? selectedBranch.id : null;
      startListening(restaurantId, branchId);
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission();
      }
      
      // Start polling for orders updates every 5 seconds
      startOrdersPolling();
    }
    
    return () => {
      if (ordersPollInterval) {
        clearInterval(ordersPollInterval);
      }
      stopListening();
    };
  }, [selectedBranch, user, startListening, stopListening, requestNotificationPermission]);
  
  const fetchRealData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const restaurantId = getRestaurantId();
      
      if (!restaurantId) {
        setIsLoading(false);
        return;
      }
      
      const [restaurantData, settings, categories, products, subscriptionData] = await Promise.all([
        restaurantService.getRestaurant(restaurantId).catch(err => {
          console.error('Error fetching restaurant:', err);
          return null;
        }),
        restaurantService.getRestaurantSettings(restaurantId).catch(err => {
          console.error('Error fetching settings:', err);
          return null;
        }),
        categoryService.getCategories(restaurantId).catch(err => {
          console.error('Error fetching categories:', err);
          return [];
        }),
        productService.getProducts(restaurantId).catch(err => {
          console.error('Error fetching products:', err);
          return [];
        }),
        subscriptionService.getRestaurantSubscription(restaurantId).catch(err => {
          console.error('Error fetching subscription:', err);
          return null;
        })
      ]);
      
      setRealSettings(settings);
      setRestaurantData(restaurantData);
      setRealCategories(categories || []);
      setRealProducts(products || []);
      setSubscription(subscriptionData);
      
      // Calculate basic statistics
      const totalViews = (products || []).reduce((sum, item) => sum + (item.views || 0), 0);
      const mostViewed = products && products.length > 0 
        ? [...products].sort((a, b) => (b.views || 0) - (a.views || 0))[0] 
        : null;
      
      setStats(prev => ({
        ...prev,
        totalItems: (products || []).length,
        totalCategories: (categories || []).length,
        totalViews: totalViews,
        mostViewedItem: mostViewed
      }));
      
      // Generate QR code for the restaurant menu using slug
      if (restaurantData) {
      const restaurantSlug = restaurantData?.slug || restaurantId;
      const menuUrl = `${window.location.origin}/menu/${restaurantSlug}`;
      generateQRCode(menuUrl, { width: 256 })
        .then(result => setQRCodeURL(result.dataUrl))
        .catch(err => console.error('Error generating QR code:', err));
      }
        
    } catch (error) {
      console.error('Error fetching real data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    if (!user) return;
    
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) return;
      
      const branchesData = await branchService.getBranches(restaurantId).catch(err => {
        console.error('Error fetching branches:', err);
        return [];
      });
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) return;
      
      const branchId = selectedBranch ? selectedBranch.id : null;
      const ordersData = await orderService.getOrders(restaurantId, branchId).catch(err => {
        console.error('Error fetching orders:', err);
        return [];
      });
      setRealOrders(ordersData || []);
      calculateStats(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setRealOrders([]);
      calculateStats([]);
    }
  };

  const startOrdersPolling = () => {
    // Poll for orders every 5 seconds
    const interval = setInterval(() => {
      // Ensure we use the correct restaurantId from JWT token
      const restaurantId = getRestaurantId();
      if (restaurantId) {
      fetchOrders();
      }
    }, 5000);
    setOrdersPollInterval(interval);
  };

  const calculateStats = (orders) => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const confirmedOrders = orders.filter(order => order.status === 'confirmed').length;
    const preparingOrders = orders.filter(order => order.status === 'preparing').length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    setStats(prev => ({
      ...prev,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">

          {/* Welcome Section - Enhanced with better responsive design */}
          <FadeIn delay={0.1}>
            <div className="relative overflow-hidden bg-gradient-to-r from-[#ff2d2d] via-[#cc0000] to-[#ff2d2d] rounded-3xl p-6 sm:p-8 lg:p-12 text-white shadow-2xl">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
                <div className="absolute top-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-10 left-1/4 w-20 h-20 bg-white/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-white/10 rounded-full animate-float" style={{animationDelay: '3s'}}></div>
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 animate-fadeIn">
                    {t('admin.welcome')}, {realSettings?.name || user?.displayName || t('admin.restaurantOwner')}! 👋
                  </h1>
                  <p className="text-blue-100 text-base sm:text-lg lg:text-xl mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}>
                    {t('admin.dashboardDescription')}
                  </p>
                  
                  {/* Quick stats in welcome section */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn" style={{animationDelay: '0.4s'}}>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold">{stats.totalItems}</div>
                      <div className="text-xs text-blue-100">{t('admin.items')}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold">{stats.totalCategories}</div>
                      <div className="text-xs text-blue-100">{t('admin.categories')}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold">{stats.totalViews}</div>
                      <div className="text-xs text-blue-100">{t('admin.views')}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold">{stats.totalOrders}</div>
                      <div className="text-xs text-blue-100">الطلبات</div>
                    </div>
                  </div>
                  
                  {/* Branch info */}
                  <div className="mt-4 animate-fadeIn" style={{animationDelay: '0.6s'}}>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {isMainRestaurant() 
                              ? (realSettings?.mainRestaurantNameAr || restaurantData?.restaurant_name || realSettings?.name || 'المطعم الرئيسي')
                              : selectedBranch?.name || 'اختر فرع'}
                          </h3>
                          <p className="text-blue-100 text-sm">
                            {isMainRestaurant() ? 'جميع الطلبات' : `طلبات فرع ${selectedBranch?.name}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue)}</div>
                          <div className="text-xs text-blue-100">إجمالي الإيرادات</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative element */}
                <div className="hidden lg:block lg:ml-8">
                  <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-24 h-24 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </FadeIn>
          
          {/* Order Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Pending Orders */}
            <AnimatedCard delay={0.2} glass>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </motion.div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600 mb-1">في الانتظار</p>
                      <motion.p 
                        className="text-3xl font-bold text-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                      >
                        {stats.pendingOrders}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Confirmed Orders */}
            <AnimatedCard delay={0.25} glass>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </motion.div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600 mb-1">مؤكد</p>
                      <motion.p 
                        className="text-3xl font-bold text-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.35 }}
                      >
                        {stats.confirmedOrders}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Preparing Orders */}
            <AnimatedCard delay={0.3} glass>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </motion.div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600 mb-1">قيد التحضير</p>
                      <motion.p 
                        className="text-3xl font-bold text-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
                      >
                        {stats.preparingOrders}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Delivered Orders */}
            <AnimatedCard delay={0.35} glass>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600 mb-1">تم التسليم</p>
                      <motion.p 
                        className="text-3xl font-bold text-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.45 }}
                      >
                        {stats.deliveredOrders}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Cancelled Orders */}
            <AnimatedCard delay={0.4} glass>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff2d2d]/10 to-[#cc0000]/10 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-r from-[#ff2d2d] to-[#cc0000] text-white shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600 mb-1">ملغي</p>
                      <motion.p 
                        className="text-3xl font-bold text-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                      >
                        {stats.cancelledOrders}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* Stats Cards - Enhanced with better responsive design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Menu Items */}
            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {t('admin.totalMenuItems')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalItems}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    +12%
                  </span>
                  <Link to="/admin/menu-items" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    {t('admin.viewAll')}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Total Categories */}
            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {t('admin.totalCategories')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalCategories}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    +5%
                  </span>
                  <Link to="/admin/menu-items" className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    {t('admin.manageCategories')}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Total Views */}
            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {t('admin.totalViews')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalViews}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    +8.2%
                  </span>
                  <Link to="/admin/analytics" className="text-yellow-600 hover:text-yellow-700 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    {t('admin.viewAnalytics')}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Subscription Status */}
            <AnimatedCard delay={0.3} glass>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff2d2d]/5 to-[#cc0000]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-r from-[#ff2d2d] to-[#cc0000] text-white shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </motion.div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {t('admin.subscriptionStatus')}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {subscription?.planName || t('admin.freeTrial')}
                      </p>
                      {subscription?.price && (
                        <p className="text-sm text-[#ff2d2d] font-semibold">
                          {subscription.price} {subscription.currency || 'EGP'}
                          {subscription.duration && ` / ${subscription.duration} يوم`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <motion.span 
                      className="text-sm font-semibold text-[#ff2d2d] flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div 
                        className={`w-2 h-2 rounded-full mr-2 ${subscription?.status === 'active' ? 'bg-green-500' : 'bg-[#ff2d2d]'}`}
                        animate={subscription?.status === 'active' ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      ></motion.div>
                      {subscription?.status === 'active' ? 'Active' : subscription?.status || 'Inactive'}
                    </motion.span>
                    <motion.div whileHover={{ x: 5 }}>
                      <Link to="/admin/subscription" className="text-[#ff2d2d] hover:text-[#cc0000] font-semibold text-sm flex items-center transition-colors duration-300">
                        {t('admin.manageSubscription')}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </motion.div>
                  </div>
                      {subscription?.end_date && (
                    <motion.div 
                      className="mt-4 p-4 bg-gradient-to-r from-[#ff2d2d]/5 to-[#cc0000]/5 rounded-xl border border-[#ff2d2d]/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[#ff2d2d]">انتهاء الاشتراك:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {(() => {
                            const endDate = subscription.end_date || subscription.endDate;
                            if (!endDate) return 'غير محدد';
                            try {
                              // Handle MySQL DATETIME string format
                              const dateStr = typeof endDate === 'string' ? endDate.replace(' ', 'T') : endDate;
                              return new Date(dateStr).toLocaleDateString('ar-EG');
                            } catch (e) {
                              return 'غير محدد';
                            }
                          })()}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div 
                            className="bg-gradient-to-r from-[#ff2d2d] to-[#cc0000] h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${(() => {
                                const endDate = subscription.end_date || subscription.endDate;
                                if (!endDate) return 0;
                                try {
                                  const dateStr = typeof endDate === 'string' ? endDate.replace(' ', 'T') : endDate;
                                  const end = new Date(dateStr);
                                  const now = new Date();
                                  const diff = end - now;
                                  const daysLeft = diff / (30 * 24 * 60 * 60 * 1000);
                                  return Math.max(0, Math.min(100, daysLeft * 100));
                                } catch (e) {
                                  return 0;
                                }
                              })()}%` 
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          ></motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          </div>
          
          {/* QR Code and Most Viewed Section - Enhanced responsive design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code Section */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('admin.yourMenuQRCode')}
                  </h3>
                </div>
                
                <div className="flex flex-col items-center">
                  {qrCodeURL ? (
                    <div className="relative group">
                      <img 
                        src={qrCodeURL} 
                        alt="Menu QR Code" 
                        className="w-48 h-48 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                    {qrCodeURL && (
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = qrCodeURL;
                          link.download = `${realSettings?.name || 'restaurant'}-menu-qr.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="flex-1 btn-primary group"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t('admin.downloadQRCode')}
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (user) {
                          try {
                            const restaurantId = getRestaurantId();
                            const restaurantData = await restaurantService.getRestaurant(restaurantId);
                            const restaurantSlug = restaurantData?.slug || restaurantId;
                            const menuUrl = `${window.location.origin}/menu/${restaurantSlug}`;
                            navigator.clipboard.writeText(menuUrl);
                            alert(t('admin.menuUrlCopied'));
                          } catch (error) {
                            console.error('Error getting restaurant data:', error);
                            // Fallback to restaurantId if error
                            const restaurantId = getRestaurantId();
                            const menuUrl = `${window.location.origin}/menu/${restaurantId}`;
                            navigator.clipboard.writeText(menuUrl);
                            alert(t('admin.menuUrlCopied'));
                          }
                        }
                      }}
                      className="flex-1 btn-secondary group"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('admin.copyMenuLink')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Most Viewed Item */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('admin.mostViewedItem')}
                  </h3>
                </div>
                
                <div className="mt-5">
                  {stats.mostViewedItem ? (
                    <div className="group/item">
                      <div className="flex items-start space-x-4">
                        {stats.mostViewedItem.image ? (
                          <div className="relative">
                            <img 
                              src={stats.mostViewedItem.image} 
                              alt={stats.mostViewedItem.name} 
                              className="w-20 h-20 object-cover rounded-xl shadow-md group-hover/item:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              #{1}
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                            <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover/item:text-emerald-600 transition-colors duration-300">
                            {stats.mostViewedItem.name_ar || stats.mostViewedItem.name_en || stats.mostViewedItem.name}
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            {stats.mostViewedItem.category_name_ar || stats.mostViewedItem.category_name_en || stats.mostViewedItem.category}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <svg className="w-4 h-4 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-medium">{stats.mostViewedItem.views || 0}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <svg className="w-4 h-4 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">{stats.mostViewedItem.price} {settings?.currency || 'EGP'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">{t('admin.noDataAvailable')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions - Enhanced with better responsive design */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('admin.quickActions')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add Menu Item */}
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900">{t('admin.addMenuItem')}</h3>
                      <p className="text-sm text-gray-500">{t('admin.addMenuItemDescription')}</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/menu-items"
                    className="btn-primary w-full group-hover:scale-105 transition-transform duration-300"
                  >
                    {t('admin.addItem')}
                  </Link>
                </div>
              </div>
              
              {/* Update Settings */}
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900">{t('admin.updateSettings')}</h3>
                      <p className="text-sm text-gray-500">{t('admin.updateSettingsDescription')}</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/settings"
                    className="btn-primary w-full group-hover:scale-105 transition-transform duration-300"
                  >
                    {t('admin.updateSettings')}
                  </Link>
                </div>
              </div>
              
              {/* View Analytics */}
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900">{t('admin.viewAnalytics')}</h3>
                      <p className="text-sm text-gray-500">{t('admin.viewAnalyticsDescription')}</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/analytics"
                    className="btn-primary w-full group-hover:scale-105 transition-transform duration-300"
                  >
                    {t('admin.viewAnalytics')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
};

export default AdminDashboard;