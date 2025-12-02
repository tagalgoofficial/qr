import React, { useState, useEffect } from 'react';
import useAuthStore from '../contexts/authStore';
import useSubscriptionStore from '../contexts/subscriptionStore';
import authService from '../services/authService';

const SubscriptionUsageStats = () => {
  const { user } = useAuthStore();
  const { getUsage } = useSubscriptionStore();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    return currentUser?.restaurantId || user?.restaurantId;
  };

  useEffect(() => {
    const fetchUsage = async () => {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        const usageData = await getUsage(restaurantId);
        setUsage(usageData);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user, getUsage]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <p>لا توجد بيانات استخدام متاحة</p>
        </div>
      </div>
    );
  }

  // Add safety checks for usage object
  if (!usage.plan || !usage.usage || !usage.limits) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <p>بيانات الاشتراك غير مكتملة</p>
        </div>
      </div>
    );
  }

  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // unlimited
    return Math.round((current / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          استخدام الاشتراك
        </h3>
        <span className="text-sm text-gray-500">
          {usage.plan?.name || 'غير محدد'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Products Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">المنتجات</span>
            <span className="text-sm text-gray-500">
              {usage.usage.products} / {usage.limits.products === -1 ? '∞' : usage.limits.products}
            </span>
          </div>
          {usage.limits.products !== -1 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(usage.usage.products, usage.limits.products))}`}
                style={{ width: `${Math.min(getUsagePercentage(usage.usage.products, usage.limits.products), 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Categories Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">الفئات</span>
            <span className="text-sm text-gray-500">
              {usage.usage.categories} / {usage.limits.categories === -1 ? '∞' : usage.limits.categories}
            </span>
          </div>
          {usage.limits.categories !== -1 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(usage.usage.categories, usage.limits.categories))}`}
                style={{ width: `${Math.min(getUsagePercentage(usage.usage.categories, usage.limits.categories), 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Branches Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">الفروع</span>
            <span className="text-sm text-gray-500">
              {usage.usage.branches} / {usage.limits.branches === -1 ? '∞' : usage.limits.branches}
            </span>
          </div>
          {usage.limits.branches !== -1 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(usage.usage.branches, usage.limits.branches))}`}
                style={{ width: `${Math.min(getUsagePercentage(usage.usage.branches, usage.limits.branches), 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Features Status */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">المميزات المتاحة</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {usage.plan?.features && Object.entries(usage.plan.features).map(([feature, enabled]) => {
            if (typeof enabled !== 'boolean') return null;
            
            return (
              <div key={feature} className="flex items-center">
                <svg 
                  className={`w-3 h-3 mr-1 ${enabled ? 'text-green-500' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                  {feature === 'themeCustomization' ? 'تخصيص الثيمات' :
                   feature === 'advancedAnalytics' ? 'التحليلات المتقدمة' :
                   feature === 'apiAccess' ? 'الوصول للـ API' :
                   feature === 'prioritySupport' ? 'دعم أولوية' :
                   feature === 'customDomain' ? 'نطاق مخصص' :
                   feature === 'whiteLabel' ? 'علامة تجارية بيضاء' :
                   feature === 'multiLanguage' ? 'متعدد اللغات' :
                   feature === 'exportData' ? 'تصدير البيانات' :
                   feature === 'backupRestore' ? 'النسخ الاحتياطي' :
                   feature}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUsageStats;
