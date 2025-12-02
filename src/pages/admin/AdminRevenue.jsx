import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../contexts/authStore';
import useBranchStore from '../../contexts/branchStore';
import orderService from '../../services/orderService';
import authService from '../../services/authService';
import { formatDate } from '../../utils/dateFormatter';
import { motion } from 'framer-motion';

const AdminRevenue = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { selectedBranch, getCurrentBranchId, isMainRestaurant } = useBranchStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    orders: []
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageOrderValue: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });

  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    return currentUser?.restaurantId || user?.restaurantId || user?.uid;
  };

  useEffect(() => {
    if (user && selectedDate) {
      fetchRevenueData();
    }
  }, [user, selectedDate, selectedBranch]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      const branchId = isMainRestaurant() ? null : getCurrentBranchId();
      
      // Fetch all orders for the selected date
      const allOrders = await orderService.getOrders(restaurantId, branchId, null);
      
      // Filter orders by selected date
      const selectedDateObj = new Date(selectedDate);
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at || order.createdAt);
        return orderDate.toISOString().split('T')[0] === selectedDate;
      });

      // Calculate revenue from completed/delivered orders only
      const completedOrders = filteredOrders.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );
      
      const totalRevenue = completedOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.total) || 0);
      }, 0);

      const cancelledOrders = filteredOrders.filter(order => 
        order.status === 'cancelled'
      );

      const averageOrderValue = completedOrders.length > 0 
        ? totalRevenue / completedOrders.length 
        : 0;

      setRevenueData({
        totalRevenue,
        totalOrders: filteredOrders.length,
        orders: filteredOrders.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt);
          const dateB = new Date(b.created_at || b.createdAt);
          return dateB - dateA;
        })
      });

      setStats({
        averageOrderValue,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'تم التسليم';
      case 'pending':
        return 'في الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'preparing':
        return 'قيد التحضير';
      case 'ready':
        return 'جاهز';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  // Get previous and next day
  const getPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };

  const getNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const today = new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0] > today ? today : date.toISOString().split('T')[0];
  };

  const goToPreviousDay = () => {
    setSelectedDate(getPreviousDay());
  };

  const goToNextDay = () => {
    const nextDay = getNextDay();
    if (nextDay <= new Date().toISOString().split('T')[0]) {
      setSelectedDate(nextDay);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  if (loading && revenueData.orders.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                الإيرادات
              </h1>
              <p className="mt-2 text-gray-600">
                عرض الإيرادات والأرباح حسب التاريخ
                {selectedBranch && (
                  <span className="mr-2 text-blue-600 font-semibold">
                    - {selectedBranch.name}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousDay}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="اليوم السابق"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold"
              />
              
              <button
                onClick={goToNextDay}
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="اليوم التالي"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                اليوم
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              {formatDate(selectedDate, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                locale: 'ar-EG'
              })}
            </div>
          </div>
        </div>

        {/* Revenue Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">إجمالي الإيرادات</p>
            <p className="text-3xl font-bold">{formatPrice(revenueData.totalRevenue)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">إجمالي الطلبات</p>
            <p className="text-3xl font-bold">{revenueData.totalOrders}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">متوسط قيمة الطلب</p>
            <p className="text-3xl font-bold">{formatPrice(stats.averageOrderValue)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">الطلبات المكتملة</p>
            <p className="text-3xl font-bold">{stats.completedOrders}</p>
          </motion.div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-xl font-bold text-gray-900">سجل الطلبات</h2>
            <p className="text-gray-600 text-sm mt-1">جميع الطلبات في {formatDate(selectedDate, { year: 'numeric', month: 'long', day: 'numeric', locale: 'ar-EG' })}</p>
          </div>

          {revenueData.orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-600">لم يتم العثور على طلبات في هذا التاريخ</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {revenueData.orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            طلب #{order.order_number || order.orderNumber || order.id}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">العميل</p>
                          <p className="font-semibold text-gray-900">
                            {order.customer_name || order.customerName || 'غير محدد'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">الهاتف</p>
                          <p className="font-semibold text-gray-900">
                            {order.customer_phone || order.customerPhone || 'غير محدد'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">الوقت</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(order.created_at || order.createdAt, {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              locale: 'ar-EG'
                            })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">المجموع</p>
                          <p className={`text-lg font-bold ${
                            order.status === 'delivered' || order.status === 'completed'
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }`}>
                            {formatPrice(order.total || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRevenue;

