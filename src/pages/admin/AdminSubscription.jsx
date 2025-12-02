import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../contexts/authStore';
import useSuperAdminStore from '../../contexts/superAdminStore';
import subscriptionService from '../../services/subscriptionService';
import superAdminSubscriptionService from '../../services/superAdminSubscriptionService';
import authService from '../../services/authService';
import { formatPrice } from '../../utils/currencies';
import SubscriptionUsageStats from '../../components/SubscriptionUsageStats';
import PaymentModal from '../../components/PaymentModal';

const AdminSubscription = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { subscriptionPlans, fetchSubscriptionPlans } = useSuperAdminStore();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [usageData, setUsageData] = useState({
    menuItems: 0,
    branches: 0,
    orders: 0,
    categories: 0
  });
  const [currentPlan, setCurrentPlan] = useState(null);
  const [clock, setClock] = useState(Date.now());

  // Function to derive subscription status
  const deriveStatus = (sub) => {
    if (!sub) return 'none';
    if (sub.status === 'paused') return 'paused';
    const d = sub.endDate;
    const end = d?.seconds ? new Date(d.seconds * 1000) : d?.toDate ? d.toDate() : (d ? new Date(d) : null);
    if (end && end.getTime() <= Date.now()) return 'expired';
    return sub.status || 'active';
  };

  // Update clock every minute to refresh subscription status
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    return currentUser?.restaurantId || user?.restaurantId;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const restaurantId = getRestaurantId();
        if (!restaurantId) {
          setError('معرف المطعم غير موجود');
          setLoading(false);
          return;
        }
        
        // Fetch subscription plans from Super Admin store
        await fetchSubscriptionPlans();
        
        const subscriptionData = await subscriptionService.getRestaurantSubscription(restaurantId);
        const usageData = await subscriptionService.getSubscriptionUsage(restaurantId);
        
        setCurrentSubscription(subscriptionData);
        setUsageData(usageData || {
          menuItems: 0,
          branches: 0,
          orders: 0,
          categories: 0
        });
        
        // Fetch plan from database if subscription exists
        if (subscriptionData?.planId || subscriptionData?.plan_id) {
          try {
            const allPlans = await superAdminSubscriptionService.getSubscriptionPlans();
            const planId = subscriptionData.planId || subscriptionData.plan_id;
            const plan = allPlans.find(p => p.id === planId || p.id === planId);
            if (plan) {
              // Use plan limits as base, subscription limits only override if they have actual non-zero values
              const planLimits = plan.limits || {};
              const subscriptionLimits = subscriptionData.limits || {};
              
              console.log('📊 Plan limits from plan:', planLimits);
              console.log('📊 Subscription limits from subscription:', subscriptionLimits);
              
              // Merge limits: plan limits are base, subscription limits override only if they have meaningful values
              const mergedLimits = { ...planLimits };
              Object.keys(subscriptionLimits).forEach(key => {
                const subValue = subscriptionLimits[key];
                // Only override if subscription value is not null, not empty, and not 0 (unless it's a boolean)
                if (subValue !== null && subValue !== '' && (typeof subValue === 'boolean' || subValue !== 0)) {
                  mergedLimits[key] = subValue;
                }
              });
              
              console.log('📊 Merged limits:', mergedLimits);
              
              setCurrentPlan({
                ...plan,
                limits: mergedLimits
              });
            } else {
              // Fallback: create plan from subscription data
              setCurrentPlan({
                id: subscriptionData.planId || 'custom',
                name: subscriptionData.planName || 'خطة غير معروفة',
                price: subscriptionData.planPrice || subscriptionData.price || 0,
                currency: subscriptionData.currency || 'EGP',
                description: subscriptionData.description || '',
                features: subscriptionData.features || [],
                limits: subscriptionData.limits || {
                  maxProducts: 0,
                  maxCategories: 0,
                  maxBranches: 20,
                  maxUsers: 0,
                  maxOrders: 0,
                  analyticsRetention: 0,
                  themeCustomization: false,
                  advancedAnalytics: false
                }
              });
            }
          } catch (err) {
            console.error('Error fetching plan:', err);
            // Fallback: create plan from subscription data
            if (subscriptionData) {
              setCurrentPlan({
                id: subscriptionData.planId || 'custom',
                name: subscriptionData.planName || 'خطة غير معروفة',
                price: subscriptionData.planPrice || subscriptionData.price || 0,
                currency: subscriptionData.currency || 'EGP',
                description: subscriptionData.description || '',
                features: subscriptionData.features || [],
                limits: subscriptionData.limits || {
                  maxProducts: 0,
                  maxCategories: 0,
                  maxBranches: 20,
                  maxUsers: 0,
                  maxOrders: 0,
                  analyticsRetention: 0,
                  themeCustomization: false,
                  advancedAnalytics: false
                }
              });
            }
          }
        } else {
          setCurrentPlan(null);
        }
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, fetchSubscriptionPlans]);

  const handleUpgrade = (plan) => {
    // Check if user already has an active subscription
    if (currentSubscription && currentSubscription.status === 'active') {
      alert('⚠️ لديك اشتراك نشط بالفعل!\n\nلا يمكنك شراء خطة أخرى لأن لديك اشتراك نشط. يمكنك إدارة اشتراكك الحالي من خلال القسم أعلاه.');
      return;
    }
    
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan || !user) return;
    
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      alert('معرف المطعم غير موجود');
      return;
    }
    
    try {
      const subscriptionData = {
        restaurantId: restaurantId,
        status: 'active',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        currency: selectedPlan.currency,
        duration: selectedPlan.duration,
        startDate: new Date(),
        endDate: new Date(Date.now() + (selectedPlan.duration || 30) * 24 * 60 * 60 * 1000),
        limits: selectedPlan.limits || {},
        features: selectedPlan.features || []
      };
      
      // TODO: Implement API endpoint for creating/updating subscriptions
      // For now, just update local state
      if (currentSubscription?.id) {
        // await superAdminSubscriptionService.updateSubscription(currentSubscription.id, subscriptionData);
        setCurrentSubscription({ ...subscriptionData, id: currentSubscription.id });
      } else {
        // const newId = await superAdminSubscriptionService.createSubscription(subscriptionData);
        setCurrentSubscription({ ...subscriptionData, id: 'temp-id' });
      }
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      
      // Refresh usage data
      const restaurantId = getRestaurantId();
      if (restaurantId) {
        const newUsageData = await subscriptionService.getSubscriptionUsage(restaurantId);
      setUsageData(newUsageData || {
        menuItems: 0,
        branches: 0,
        orders: 0,
        categories: 0
      });
      }
      
      // Show success message
      alert('تم ترقية الاشتراك بنجاح!');
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      alert('حدث خطأ أثناء ترقية الاشتراك');
    }
  };

  // Fetch current plan from database
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!currentSubscription) {
        setCurrentPlan(null);
        return;
      }
      
      // First try to find plan in local state
      let plan = subscriptionPlans.find(plan => plan.id === currentSubscription.planId);
      
      // If not found, fetch from database
      if (!plan && currentSubscription.planId) {
        try {
          const allPlans = await superAdminSubscriptionService.getSubscriptionPlans();
          plan = allPlans.find(p => p.id === currentSubscription.planId || p.id === currentSubscription.plan_id);
        } catch (err) {
          console.error('Error fetching plan from database:', err);
        }
      }
      
      // If plan found, use it with subscription limits as fallback
      if (plan) {
        // Use plan limits as base, subscription limits only override if they have actual non-zero values
        const planLimits = plan.limits || {};
        const subscriptionLimits = currentSubscription.limits || {};
        
        // Merge limits: plan limits are base, subscription limits override only if they have meaningful values
        const mergedLimits = { ...planLimits };
        Object.keys(subscriptionLimits).forEach(key => {
          const subValue = subscriptionLimits[key];
          // Only override if subscription value is not null, not empty, and not 0 (unless it's a boolean)
          if (subValue !== null && subValue !== '' && (typeof subValue === 'boolean' || subValue !== 0)) {
            mergedLimits[key] = subValue;
          }
        });
        
        setCurrentPlan({
          ...plan,
          limits: mergedLimits
        });
      } else {
        // Fallback: create plan from subscription data
        setCurrentPlan({
          id: currentSubscription.planId || 'custom',
          name: currentSubscription.planName || 'خطة غير معروفة',
          price: currentSubscription.planPrice || currentSubscription.price || 0,
          currency: currentSubscription.currency || 'EGP',
          description: currentSubscription.description || '',
          features: currentSubscription.features || [],
          limits: currentSubscription.limits || {
            maxProducts: 0,
            maxCategories: 0,
            maxBranches: 20, // Default to 20
            maxUsers: 0,
            maxOrders: 0,
            analyticsRetention: 0,
            themeCustomization: false,
            advancedAnalytics: false
          }
        });
      }
    };
    
    fetchCurrentPlan();
  }, [currentSubscription, subscriptionPlans]);

  const getPlanUsage = () => {
    // Always return real data from database, even if no subscription
    return {
      products: usageData.menuItems || 0,
      categories: usageData.categories || 0,
      branches: usageData.branches || 0,
      orders: usageData.orders || 0
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
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
            className="btn-primary"
          >
            إعادة المحاولة
          </button>
        </div>
      </AdminLayout>
    );
  }

  const usage = getPlanUsage();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                إدارة الاشتراك
              </h1>
              <p className="mt-2 text-gray-600">
                إدارة خطة الاشتراك الخاصة بمطعمك
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const restaurantId = getRestaurantId();
                  if (!restaurantId) {
                    setError('معرف المطعم غير موجود');
                    return;
                  }
                  const newUsageData = await subscriptionService.getSubscriptionUsage(restaurantId);
                  setUsageData(newUsageData || {
                    menuItems: 0,
                    branches: 0,
                    orders: 0,
                    categories: 0
                  });
                } catch (err) {
                  console.error('Error refreshing data:', err);
                } finally {
                  setLoading(false);
                }
              }}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* Usage Statistics */}
        <SubscriptionUsageStats />

        {/* Subscription Status Messages */}
        {(() => { const st = deriveStatus(currentSubscription); return st === 'active'; })() ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  لديك اشتراك نشط
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  لا يمكنك شراء خطة أخرى لأن لديك اشتراك نشط بالفعل. يمكنك إدارة اشتراكك الحالي من خلال القسم أدناه.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  لا يوجد اشتراك نشط
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  لا يوجد لديك اشتراك نشط حالياً. يمكنك اختيار إحدى الخطط المتاحة أدناه لبدء استخدام الخدمة.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Usage Statistics - Always Show */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              إحصائيات الاستخدام الحالية
            </h2>
            {usage.products === 0 && usage.categories === 0 && usage.branches === 0 && usage.orders === 0 && (
              <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                ⚠️ لا توجد بيانات في قاعدة البيانات
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">المنتجات</p>
                  <p className="text-2xl font-bold text-blue-900">{usage.products}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">الفئات</p>
                  <p className="text-2xl font-bold text-green-900">{usage.categories}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">الفروع</p>
                  <p className="text-2xl font-bold text-purple-900">{usage.branches}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">الطلبات (30 يوم)</p>
                  <p className="text-2xl font-bold text-orange-900">{usage.orders}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Subscription */}
        {currentPlan && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              الاشتراك الحالي
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentPlan.name}
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    نشط
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatPrice(currentPlan.price, currentPlan.currency, 'ar')}
                  <span className="text-sm font-normal text-gray-500">/شهر</span>
                </div>
                <p className="text-gray-600 mb-4">
                  {currentPlan.description}
                </p>
                <div className="space-y-2">
                  {Array.isArray(currentPlan.features) ? currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{typeof feature === 'string' ? feature : JSON.stringify(feature)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">لا توجد ميزات متاحة</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Subscription Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">تفاصيل الاشتراك</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">نوع الاشتراك:</span>
                      <span className="font-medium text-gray-900">{currentSubscription?.planName || currentPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">حالة الاشتراك:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentSubscription?.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentSubscription?.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    {currentSubscription?.startDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ البداية:</span>
                        <span className="font-medium text-gray-900">
                          {(() => {
                            const d = currentSubscription.startDate;
                            const date = d?.seconds ? new Date(d.seconds * 1000) : d?.toDate ? d.toDate() : new Date(d);
                            return date.toLocaleDateString('ar-EG');
                          })()}
                        </span>
                      </div>
                    )}
                    {currentSubscription?.endDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ الانتهاء:</span>
                        <span className="font-medium text-gray-900">
                          {(() => {
                            const d = currentSubscription.endDate;
                            const date = d?.seconds ? new Date(d.seconds * 1000) : d?.toDate ? d.toDate() : new Date(d);
                            return date.toLocaleDateString('ar-EG');
                          })()}
                        </span>
                      </div>
                    )}
                    {currentSubscription?.paymentId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الدفع:</span>
                        <span className="font-medium text-gray-900 text-xs">
                          {currentSubscription.paymentId.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">استخدام الخطة</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>المنتجات</span>
                        <span>{usage.products} / {currentPlan.limits?.maxProducts === -1 ? '∞' : currentPlan.limits?.maxProducts || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${currentPlan.limits?.maxProducts === -1 ? 100 : Math.min((usage.products / (currentPlan.limits?.maxProducts || 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>الفئات</span>
                        <span>{usage.categories} / {currentPlan.limits?.maxCategories === -1 ? '∞' : currentPlan.limits?.maxCategories || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${currentPlan.limits?.maxCategories === -1 ? 100 : Math.min((usage.categories / (currentPlan.limits?.maxCategories || 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>الفروع</span>
                        <span>{usage.branches} / {currentPlan.limits?.maxBranches === -1 ? '∞' : currentPlan.limits?.maxBranches || 'غير محدود'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ 
                            width: `${currentPlan.limits?.maxBranches === -1 ? 100 : Math.min(((usage.branches || 0) / (currentPlan.limits?.maxBranches || 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>الطلبات (آخر 30 يوم)</span>
                        <span>{usage.orders} / {currentPlan.limits?.maxOrders === -1 ? '∞' : currentPlan.limits?.maxOrders || 'غير محدود'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${currentPlan.limits?.maxOrders === -1 ? 100 : Math.min(((usage.orders || 0) / (currentPlan.limits?.maxOrders || 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">إحصائيات الاستخدام</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>إجمالي المنتجات:</span>
                      <span className="font-medium">{usage.products}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الفئات:</span>
                      <span className="font-medium">{usage.categories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الفروع:</span>
                      <span className="font-medium">{usage.branches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الطلبات (آخر 30 يوم):</span>
                      <span className="font-medium">{usage.orders}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              خطط الاشتراك المتاحة
            </h2>
            {currentSubscription && currentSubscription.status === 'active' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                لديك اشتراك نشط
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Array.isArray(subscriptionPlans) ? subscriptionPlans : []).map((plan) => (
              <div 
                key={plan.id} 
                className={`relative rounded-xl p-6 border-2 ${
                  plan.isPopular 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 text-xs rounded-full">
                      الأكثر شعبية
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPrice(plan.price, plan.currency, 'ar')}
                    <span className="text-sm font-normal text-gray-500">/شهر</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  {Array.isArray(plan.features) ? plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{typeof feature === 'string' ? feature : JSON.stringify(feature)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">لا توجد ميزات متاحة</p>
                  )}
                </div>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={currentSubscription && currentSubscription.status === 'active'}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    currentSubscription && currentSubscription.status === 'active'
                      ? 'btn-disabled'
                      : plan.isPopular
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {currentPlan?.id === plan.id 
                    ? 'الخطة الحالية' 
                    : currentSubscription && currentSubscription.status === 'active'
                      ? 'لديك اشتراك نشط'
                      : 'اختيار هذه الخطة'
                  }
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                تأكيد ترقية الاشتراك
              </h2>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  هل أنت متأكد من ترقية الاشتراك إلى:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{selectedPlan.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(selectedPlan.price, selectedPlan.currency, 'ar')}/شهر
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmUpgrade}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  تأكيد الترقية
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedPlan(null);
            }}
            planData={selectedPlan}
            userData={user}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubscription;