import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import orderService from '../../services/orderService';
import branchService from '../../services/branchService';
import themeService from '../../services/themeService';
import useAuthStore from '../../contexts/authStore';
import useBranchStore from '../../contexts/branchStore';
import useNotificationStore from '../../contexts/notificationStore';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatDate } from '../../utils/dateFormatter';

const AdminOrders = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { selectedBranch, getCurrentBranchId, isMainRestaurant } = useBranchStore();
  const notificationStore = useNotificationStore();
  const { notifications, markAsRead, startListening, stopListening, requestNotificationPermission } = notificationStore;
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [theme, setTheme] = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [realtimeListener, setRealtimeListener] = useState(null);

  useEffect(() => {
    fetchBranches();
    fetchTheme();
    
    // Cleanup on unmount
    return () => {
      stopRealtimeListener();
    };
  }, []);

  useEffect(() => {
    if (user?.uid && (selectedBranch || isMainRestaurant())) {
      // Start notification listener for real-time notifications
      const branchId = getCurrentBranchId();
      startListening(user.uid, branchId);
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission();
      }
      
      // Start real-time listener instead of fetching once
      startRealtimeListener();
      fetchStats();
    }
    
    // Cleanup on unmount or branch change
    return () => {
      stopRealtimeListener();
      stopListening();
    };
  }, [selectedBranch, isMainRestaurant, user]);

  // Update stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      fetchStats();
    }
  }, [orders]);

  // Track new orders for visual effects
  useEffect(() => {
    if (notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      setNewOrders(unreadNotifications.map(n => n.id));
    }
  }, [notifications]);

  // Poll for orders updates
  const startRealtimeListener = () => {
    if (!user?.uid) return;

    // Clean up existing interval
    if (realtimeListener) {
      clearInterval(realtimeListener);
    }

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        const branchId = getCurrentBranchId();
        // Use restaurantId from user object, fallback to uid if restaurantId not available
        const restaurantId = user?.restaurantId || user?.uid;
        const ordersData = await orderService.getOrders(
          restaurantId, 
          isMainRestaurant() ? null : branchId,
          selectedStatus || null
        );

        // Check for new orders
        const currentOrderIds = orders.map(order => order.id);
        const newOrderIds = ordersData
          .filter(order => !currentOrderIds.includes(order.id))
          .map(order => order.id);

        if (newOrderIds.length > 0) {
          setNewOrders(prev => [...prev, ...newOrderIds]);
        }

        setOrders(ordersData);
        setLoading(false);
      } catch (error) {
        console.error('Error polling orders:', error);
      }
    }, 5000);

    setRealtimeListener(interval);
    
    // Initial fetch
    fetchOrders();
  };

  // Stop polling
  const stopRealtimeListener = () => {
    if (realtimeListener) {
      clearInterval(realtimeListener);
      setRealtimeListener(null);
    }
  };

  const fetchTheme = async () => {
    try {
      const themeData = await themeService.getRestaurantTheme(user.uid);
      setTheme(themeData);
    } catch (error) {
      console.error('Error fetching theme:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const branchesData = await branchService.getBranches(user.uid);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const branchId = getCurrentBranchId();
      // Use restaurantId from user object, fallback to uid if restaurantId not available
      // The backend will handle converting user_id to restaurant_id if needed
      const restaurantId = user?.restaurantId || user?.uid;
      let ordersData = await orderService.getOrders(
        restaurantId,
        isMainRestaurant() ? null : branchId,
        selectedStatus || null
      );
      
      // If no orders found, return empty array
      if (!ordersData || ordersData.length === 0) {
        ordersData = [];
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from local orders data
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const confirmedOrders = orders.filter(order => order.status === 'confirmed').length;
      const preparingOrders = orders.filter(order => order.status === 'preparing').length;
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      
      const totalRevenue = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      setStats({
        totalOrders,
        pendingOrders,
        confirmedOrders,
        preparingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Mark as read if it was a new order
      const branchId = getCurrentBranchId();
      if (newOrders.includes(orderId)) {
        markAsRead(orderId, user.uid, branchId);
        setNewOrders(prev => prev.filter(id => id !== orderId));
      }
      
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.PREPARING:
        return 'bg-orange-100 text-orange-800';
      case ORDER_STATUS.READY:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.DELIVERED:
        return 'bg-gray-100 text-gray-800';
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'في الانتظار';
      case ORDER_STATUS.CONFIRMED:
        return 'مؤكد';
      case ORDER_STATUS.PREPARING:
        return 'قيد التحضير';
      case ORDER_STATUS.READY:
        return 'جاهز';
      case ORDER_STATUS.DELIVERED:
        return 'تم التسليم';
      case ORDER_STATUS.CANCELLED:
        return 'ملغي';
      default:
        return status;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price);
  };


  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-primary-400 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                إدارة الطلبات
              </h1>
              <p className="text-gray-600 mt-3 text-lg">
                إدارة طلبات العملاء
                {selectedBranch && (
                  <span className="mr-2 text-blue-600 font-semibold">
                    - {selectedBranch.name}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                تصفية حسب الحالة
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="">جميع الحالات</option>
                <option value={ORDER_STATUS.PENDING}>في الانتظار</option>
                <option value={ORDER_STATUS.CONFIRMED}>مؤكد</option>
                <option value={ORDER_STATUS.PREPARING}>قيد التحضير</option>
                <option value={ORDER_STATUS.READY}>جاهز</option>
                <option value={ORDER_STATUS.DELIVERED}>تم التسليم</option>
                <option value={ORDER_STATUS.CANCELLED}>ملغي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {(selectedBranch || isMainRestaurant()) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className={`bg-white rounded-3xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 ${
              newOrders.length > 0 ? 'bg-green-50 border-green-200' : ''
            }`}>
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-semibold text-gray-600">إجمالي الطلبات</p>
                  <p className={`text-3xl font-bold ${newOrders.length > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {stats.totalOrders || 0}
                    {newOrders.length > 0 && (
                      <span className="ml-2 text-sm text-green-600 animate-pulse">
                        (+{newOrders.length})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-semibold text-gray-600">إجمالي الإيرادات</p>
                  <p className="text-3xl font-bold text-gray-900">{formatPrice(stats.totalRevenue || 0)}</p>
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-3xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 ${
              stats.pendingOrders > 0 ? 'bg-yellow-50 border-yellow-200' : ''
            }`}>
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-semibold text-gray-600">في الانتظار</p>
                  <p className={`text-3xl font-bold ${stats.pendingOrders > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {stats.pendingOrders || 0}
                    {stats.pendingOrders > 0 && (
                      <span className="ml-2 text-sm text-yellow-600 animate-pulse">
                        جديد
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-semibold text-gray-600">قيد التحضير</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.preparingOrders || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">الطلبات</h2>
            <p className="text-gray-600 mt-1">إدارة ومتابعة طلبات العملاء</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">لا توجد طلبات</h3>
              <p className="text-gray-600 text-lg">لم يتم العثور على طلبات في هذا الفرع</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className={`p-8 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-300 group ${
                    newOrders.includes(order.id) 
                      ? 'bg-green-50 border-r-4 border-green-500 animate-pulse' 
                      : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                            طلب #{order.order_number || order.orderNumber || order.id}
                            {newOrders.includes(order.id) && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                                جديد
                              </span>
                            )}
                          </h3>
                          <span className={`px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">التاريخ:</span> {formatDate(order.created_at || order.createdAt)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">العميل</p>
                            <p className="font-semibold text-gray-900 truncate">{order.customer_name || order.customerName || 'غير محدد'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">الهاتف</p>
                            <p className="font-semibold text-gray-900">{order.customer_phone || order.customerPhone || 'غير محدد'}</p>
                          </div>
                        </div>

                        {(order.customer_address || order.customerAddress) && (
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-500">العنوان</p>
                              <p className="font-semibold text-gray-900 truncate">{order.customer_address || order.customerAddress}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">المجموع</p>
                            <p className="font-bold text-xl sm:text-2xl text-gray-900">{formatPrice(order.total || 0)}</p>
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mb-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                          <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <div>
                              <p className="text-sm font-semibold text-yellow-800">ملاحظات العميل</p>
                              <p className="text-yellow-700">{order.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Order Items with Details */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            عناصر الطلب
                          </h4>
                          <div className="space-y-3">
                            {order.items.map((item, index) => {
                              // Calculate item total price
                              const itemPrice = item.totalPrice || (item.price ? item.price * (item.quantity || 1) : 0);
                              const pricePerUnit = item.price || (item.totalPrice ? item.totalPrice / (item.quantity || 1) : 0);
                              
                              return (
                                <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                  {/* Main Item Info */}
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-start space-x-3 flex-1">
                                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-sm font-bold text-white">{item.quantity || 1}</span>
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 text-base mb-1">{item.name}</h5>
                                        <div className="text-sm text-gray-600">
                                          السعر للقطعة: <span className="font-semibold">{formatPrice(pricePerUnit)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <div className="text-lg font-bold text-gray-900">
                                        {formatPrice(itemPrice)}
                                      </div>
                                      {item.quantity > 1 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          ({formatPrice(pricePerUnit)} × {item.quantity})
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Options Details */}
                                  {(item.selectedSize || item.selectedWeight || (item.selectedExtras && item.selectedExtras.length > 0)) && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                      {/* Selected Size */}
                                      {item.selectedSize && item.selectedSize.name && (
                                        <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-600">📏</span>
                                            <span className="text-sm font-medium text-gray-700">الحجم:</span>
                                            <span className="text-sm font-semibold text-gray-900">{item.selectedSize.name}</span>
                                          </div>
                                          {item.selectedSize.price && parseFloat(item.selectedSize.price) > 0 && (
                                            <span className="text-sm font-semibold text-blue-600">
                                              +{formatPrice(item.selectedSize.price)}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Selected Weight */}
                                      {item.selectedWeight && item.selectedWeight.name && (
                                        <div className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="text-purple-600">⚖️</span>
                                            <span className="text-sm font-medium text-gray-700">الوزن:</span>
                                            <span className="text-sm font-semibold text-gray-900">{item.selectedWeight.name}</span>
                                          </div>
                                          {item.selectedWeight.price && parseFloat(item.selectedWeight.price) > 0 && (
                                            <span className="text-sm font-semibold text-purple-600">
                                              +{formatPrice(item.selectedWeight.price)}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Selected Extras */}
                                      {item.selectedExtras && Array.isArray(item.selectedExtras) && item.selectedExtras.length > 0 && (
                                        <div className="py-2 px-3 bg-green-50 rounded-lg">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-green-600">➕</span>
                                            <span className="text-sm font-medium text-gray-700">الإضافات:</span>
                                          </div>
                                          <div className="space-y-1 mr-6">
                                            {item.selectedExtras.map((extra, extraIndex) => (
                                              <div key={extraIndex} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700 font-medium">
                                                  • {extra.name || extra}
                                                </span>
                                                {extra.price && parseFloat(extra.price) > 0 && (
                                                  <span className="text-green-600 font-semibold">
                                                    +{formatPrice(extra.price)}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="flex flex-col space-y-3 lg:ml-6">
                      {order.status === ORDER_STATUS.PENDING && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.CONFIRMED)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            تأكيد الطلب
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.CANCELLED)}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            إلغاء الطلب
                          </button>
                        </>
                      )}

                      {order.status === ORDER_STATUS.CONFIRMED && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.PREPARING)}
                          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-2xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          بدء التحضير
                        </button>
                      )}

                      {order.status === ORDER_STATUS.PREPARING && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.READY)}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          جاهز للتسليم
                        </button>
                      )}

                      {order.status === ORDER_STATUS.READY && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.DELIVERED)}
                          className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          تم التسليم
                        </button>
                      )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
