import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSuperAdminStore from '../../contexts/superAdminStore';
import superAdminAnalyticsService from '../../services/superAdminAnalyticsService';
import { formatPrice } from '../../utils/currencies';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

const SuperAdminAnalytics = () => {
  const { t } = useTranslation();
  const { 
    systemAnalytics, 
    fetchAnalytics, 
    loading, 
    error 
  } = useSuperAdminStore();
  
  const [realTimeData, setRealTimeData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const data = await superAdminAnalyticsService.getSystemAnalytics();
        setRealTimeData(data);
      } catch (err) {
        console.error('Error fetching real-time data:', err);
      }
    };

    fetchRealTimeData();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toLocaleString() || 0;
  };

  // Show loading only if we don't have any data yet
  if (loading && !systemAnalytics && !realTimeData) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل التحليلات...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (error) {
    return (
      <SuperAdminLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            خطأ في تحميل البيانات
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  const analytics = realTimeData || systemAnalytics || {
    totalRestaurants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalProducts: 0,
    totalViews: 0,
    restaurantStats: [],
    revenueGrowth: 0,
    usersGrowth: 0,
    restaurantsGrowth: 0
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute w-40 h-40 bg-white/10 rounded-full -top-10 -left-10 animate-float"></div>
              <div className="absolute w-32 h-32 bg-white/5 rounded-full top-1/3 right-12 animate-float" style={{animationDelay: '2s'}}></div>
              <div className="absolute w-48 h-48 bg-white/10 rounded-full -bottom-16 -right-16 animate-float" style={{animationDelay: '4s'}}></div>
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-3 animate-fadeIn">
                  تحليلات النظام
                </h1>
                <p className="text-emerald-100 text-lg mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}>
                  نظرة شاملة على أداء النظام وجميع المطاعم
                </p>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 animate-fadeIn" style={{animationDelay: '0.4s'}}>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 rounded-xl px-4 py-2 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                >
                  <option value="7d" className="text-gray-900">آخر 7 أيام</option>
                  <option value="30d" className="text-gray-900">آخر 30 يوم</option>
                  <option value="90d" className="text-gray-900">آخر 90 يوم</option>
                </select>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium hover:bg-white/30 transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  تحديث
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">إجمالي المطاعم</p>
                <p className="text-3xl font-bold">{formatNumber(analytics?.totalRestaurants || 0)}</p>
                <p className="text-blue-100 text-sm flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +{analytics?.restaurantsGrowth || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold">{formatNumber(analytics?.totalUsers || 0)}</p>
                <p className="text-green-100 text-sm flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +{analytics?.usersGrowth || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">إجمالي الطلبات</p>
                <p className="text-3xl font-bold">{formatNumber(analytics?.totalOrders || 0)}</p>
                <p className="text-purple-100 text-sm flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +{analytics?.ordersGrowth || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold">{formatPrice(analytics?.totalRevenue || 0)}</p>
                <p className="text-orange-100 text-sm flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +{analytics?.revenueGrowth || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            إحصائيات سريعة
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">معدل النمو الشهري</span>
              <span className="text-sm font-medium text-green-600">+15.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">معدل الاحتفاظ بالعملاء</span>
              <span className="text-sm font-medium text-blue-600">87.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">متوسط وقت الاستجابة</span>
              <span className="text-sm font-medium text-gray-900">245ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">معدل الرضا</span>
              <span className="text-sm font-medium text-purple-600">4.8/5</span>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;