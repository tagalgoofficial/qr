import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../../contexts/authStore';
import useSuperAdminStore from '../../contexts/superAdminStore';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { 
    restaurants, 
    subscriptionPlans, 
    systemAnalytics, 
    loading, 
    fetchRestaurants, 
    fetchSubscriptionPlans, 
    fetchSystemAnalytics 
  } = useSuperAdminStore();
  
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchRestaurants(),
        fetchSubscriptionPlans(),
        fetchSystemAnalytics()
      ]);
    };
    
    loadData();
  }, [fetchRestaurants, fetchSubscriptionPlans, fetchSystemAnalytics]);
  
  useEffect(() => {
    // Calculate statistics from real data
    const totalRestaurants = restaurants.filter(r => r.isActive !== false).length;
    const totalUsers = restaurants.reduce((sum, r) => sum + (r.totalUsers || 0), 0);
    const totalRevenue = restaurants.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const activeSubscriptions = restaurants.filter(r => r.subscription?.status === 'active').length;
    
    setStats({
      totalRestaurants,
      totalUsers,
      totalRevenue,
      activeSubscriptions
    });
  }, [restaurants]);
  
  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }
  
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 lg:p-12 text-white shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute w-48 h-48 bg-white/10 rounded-full -top-12 -left-12 animate-float"></div>
              <div className="absolute w-64 h-64 bg-white/5 rounded-full -bottom-16 -right-16 animate-float animation-delay-2000"></div>
              <div className="absolute w-32 h-32 bg-white/10 rounded-full top-1/2 left-1/4 animate-float animation-delay-4000"></div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 animate-bounceIn">
                مرحباً، {user?.displayName || 'Super Admin'}! 👋
              </h1>
              <p className="text-purple-100 text-lg sm:text-xl animate-fadeIn animation-delay-500">
                لوحة تحكم Super Admin - إدارة شاملة لنظام QR Menu
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center animate-glow">
                <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative z-10 mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn animation-delay-1000">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
              <p className="text-sm font-medium text-white/80">المطاعم</p>
              <p className="text-2xl font-bold text-white">{stats.totalRestaurants}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
              <p className="text-sm font-medium text-white/80">المستخدمين</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
              <p className="text-sm font-medium text-white/80">الإيرادات</p>
              <p className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()} EGP</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
              <p className="text-sm font-medium text-white/80">الاشتراكات</p>
              <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slideInRight">
          {/* Total Restaurants */}
          <div className="card hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  إجمالي المطاعم
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalRestaurants}
                </p>
                <p className="text-sm font-medium text-green-600">
                  +12 هذا الشهر
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/superadmin/restaurants" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
                إدارة المطاعم
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Total Users */}
          <div className="card hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  إجمالي المستخدمين
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-green-600">
                  +8.2% هذا الشهر
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/superadmin/analytics" className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center">
                عرض التحليلات
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="card hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  إجمالي الإيرادات
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalRevenue.toLocaleString()} EGP
                </p>
                <p className="text-sm font-medium text-green-600">
                  +15.3% هذا الشهر
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/superadmin/analytics" className="text-yellow-600 hover:text-yellow-700 font-medium text-sm flex items-center">
                عرض الإيرادات
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="card hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  الاشتراكات النشطة
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.activeSubscriptions}
                </p>
                <p className="text-sm font-medium text-green-600">
                  +5 هذا الأسبوع
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/superadmin/subscriptions" className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center">
                إدارة الاشتراكات
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Restaurants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">المطاعم الجديدة</h3>
            <div className="space-y-4">
              {restaurants.slice(0, 5).map((restaurant, index) => (
                <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {restaurant.restaurantName?.charAt(0)?.toUpperCase() || 'R'}
                      </span>
                    </div>
                    <div className="mr-4">
                      <p className="font-medium text-gray-900">{restaurant.restaurantName || 'بدون اسم'}</p>
                      <p className="text-sm text-gray-500">{restaurant.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      restaurant.subscription?.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      restaurant.subscription?.plan === 'premium' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {restaurant.subscription?.plan || 'free'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {restaurant.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'غير محدد'}
                    </p>
                  </div>
                </div>
              ))}
              {restaurants.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">لا توجد مطاعم مسجلة بعد</p>
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">حالة النظام</h3>
            <div className="space-y-4">
              {[
                { service: 'قاعدة البيانات', status: 'Operational', uptime: '99.9%' },
                { service: 'خدمات المصادقة', status: 'Operational', uptime: '99.8%' },
                { service: 'خدمات التخزين', status: 'Operational', uptime: '99.7%' },
                { service: 'خدمات التحليلات', status: 'Operational', uptime: '99.6%' },
                { service: 'خدمات الدفع', status: 'Operational', uptime: '99.5%' }
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">{service.service}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-medium">{service.status}</p>
                    <p className="text-xs text-gray-500">{service.uptime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/superadmin/restaurants"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">إدارة المطاعم</h3>
                    <p className="mt-1 text-sm text-gray-500">عرض وإدارة جميع المطاعم</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/superadmin/subscriptions"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">إدارة الاشتراكات</h3>
                    <p className="mt-1 text-sm text-gray-500">إدارة خطط الاشتراك والأسعار</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/superadmin/analytics"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">التحليلات</h3>
                    <p className="mt-1 text-sm text-gray-500">إحصائيات شاملة للنظام</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/superadmin/settings"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">الإعدادات</h3>
                    <p className="mt-1 text-sm text-gray-500">إعدادات النظام العامة</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;