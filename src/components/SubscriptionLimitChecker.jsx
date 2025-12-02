import React, { useState, useEffect } from 'react';
import useAuthStore from '../contexts/authStore';
import useSubscriptionStore from '../contexts/subscriptionStore';
import authService from '../services/authService';

const SubscriptionLimitChecker = ({ 
  itemType, 
  onLimitExceeded, 
  children, 
  showWarning = true 
}) => {
  const { user } = useAuthStore();
  const { canAddItem, getRemainingSlots, hasFeature } = useSubscriptionStore();
  const [canAdd, setCanAdd] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    // Prioritize restaurantId from JWT token, then from user object
    // Never use uid as it's user ID not restaurant ID
    return currentUser?.restaurantId || user?.restaurantId;
  };

  useEffect(() => {
    const checkLimit = async () => {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        const canAddItemResult = await canAddItem(restaurantId, itemType);
        const remainingSlots = await getRemainingSlots(restaurantId, itemType);
        
        setCanAdd(canAddItemResult);
        setRemaining(remainingSlots);
        
        if (!canAddItemResult && onLimitExceeded) {
          onLimitExceeded(itemType, remainingSlots);
        }
      } catch (error) {
        console.error('Error checking subscription limit:', error);
        // On error, allow adding to prevent blocking legitimate actions
        setCanAdd(true);
      } finally {
        setLoading(false);
      }
    };

    checkLimit();
    // Only re-check when user or itemType changes, not on every render
  }, [user, itemType]);

  // Note: Removed duplicate useEffect - limits are already checked in the first useEffect

  if (loading) {
    return <div className="text-sm text-gray-500">جاري التحقق...</div>;
  }

  if (!canAdd) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              تم الوصول للحد الأقصى
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              لقد وصلت للحد الأقصى المسموح به من {itemType === 'products' ? 'المنتجات' : 
                itemType === 'categories' ? 'الفئات' : 
                itemType === 'branches' ? 'الفروع' : 'العناصر'} في خطتك الحالية.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              ترقية خطتك لإضافة المزيد من {itemType === 'products' ? 'المنتجات' : 
                itemType === 'categories' ? 'الفئات' : 
                itemType === 'branches' ? 'الفروع' : 'العناصر'}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show warning message if remaining is low, but still allow adding items
  if (showWarning && remaining <= 2 && remaining > 0) {
    return (
      <>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                تحذير: قريب من الحد الأقصى
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                متبقي {remaining} {itemType === 'products' ? 'منتج' : 
                  itemType === 'categories' ? 'فئة' : 
                  itemType === 'branches' ? 'فرع' : 'عنصر'} في خطتك الحالية.
              </p>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return children;
};

export default SubscriptionLimitChecker;
