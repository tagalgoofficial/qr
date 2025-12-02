import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import subscriptionService from '../services/subscriptionService';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import branchService from '../services/branchService';

// Helper function to get current item count
const getCurrentItemCount = async (restaurantId, itemType) => {
  try {
    const normalizedType = itemType.toLowerCase();
    
    switch (normalizedType) {
      case 'product':
      case 'products':
        const products = await productService.getProducts(restaurantId);
        return products.length;
      case 'category':
      case 'categories':
        const categories = await categoryService.getCategories(restaurantId);
        return categories.length;
      case 'branch':
      case 'branches':
        const branches = await branchService.getBranches(restaurantId);
        return branches.length;
      default:
        console.warn('Unknown itemType for getCurrentItemCount:', itemType);
      return 0;
    }
  } catch (error) {
    console.error('Error getting current item count:', error);
    return 0;
  }
};

const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      currentSubscription: null,
      subscriptionHistory: [],
      availablePlans: [],
      limits: {},
      loading: false,
      error: null,
      
      // Fetch current subscription
      fetchCurrentSubscription: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
          // Use subscriptionService which uses MySQL API
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          
          // Normalize subscription data to handle both camelCase and snake_case
          if (subscription) {
            const normalized = {
              ...subscription,
              // Ensure both formats are available
              endDate: subscription.endDate || subscription.end_date,
              end_date: subscription.end_date || subscription.endDate,
              startDate: subscription.startDate || subscription.start_date,
              start_date: subscription.start_date || subscription.startDate,
              planId: subscription.planId !== undefined ? Number(subscription.planId) : (subscription.plan_id !== undefined ? Number(subscription.plan_id) : 0),
              plan_id: subscription.plan_id !== undefined ? Number(subscription.plan_id) : (subscription.planId !== undefined ? Number(subscription.planId) : 0),
              planName: subscription.planName || subscription.plan_name,
              plan_name: subscription.plan_name || subscription.planName,
              restaurantId: subscription.restaurantId || subscription.restaurant_id,
              restaurant_id: subscription.restaurant_id || subscription.restaurantId,
              status: subscription.status || 'active'
            };
            
            set({ currentSubscription: normalized, loading: false });
            return normalized;
          }
          
          set({ currentSubscription: null, loading: false });
          return null;
        } catch (error) {
          console.error('Error fetching subscription:', error);
          set({ loading: false, error: error.message });
          return null;
        }
      },
      
      // Create subscription
      createSubscription: async (restaurantId, planId, paymentData = {}) => {
        set({ loading: true, error: null });
        try {
          // TODO: Implement API endpoint for creating subscription
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          set({ 
            currentSubscription: subscription,
            loading: false 
          });
          return subscription;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to create subscription' });
          throw error;
        }
      },
      
      // Upgrade subscription
      upgradeSubscription: async (restaurantId, newPlanId, paymentData = {}) => {
        set({ loading: true, error: null });
        try {
          // TODO: Implement API endpoint for upgrading subscription
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          set({ 
            currentSubscription: subscription,
            loading: false 
          });
          return subscription;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to upgrade subscription' });
          throw error;
        }
      },
      
      // Cancel subscription
      cancelSubscription: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
          // TODO: Implement API endpoint for cancelling subscription
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          set({ 
            currentSubscription: subscription,
            loading: false 
          });
          return subscription;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to cancel subscription' });
          throw error;
        }
      },
      
      // Check subscription limits
      checkLimits: async (restaurantId, limitType) => {
        set({ loading: true, error: null });
        try {
          const limits = await subscriptionService.checkSubscriptionLimit(restaurantId, limitType);
          set({ 
            limits: { ...get().limits, [limitType]: limits },
            loading: false 
          });
          return limits;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to check limits' });
          return { allowed: false, remaining: 0 };
        }
      },
      
      // Fetch subscription history
      fetchSubscriptionHistory: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
          // For now, return empty array as we don't have history function
          const history = [];
          set({ subscriptionHistory: history, loading: false });
          return history;
        } catch (error) {
          set({ loading: false, error: error.message });
          return [];
        }
      },
      
      // Fetch available plans
      fetchAvailablePlans: async () => {
        set({ loading: true, error: null });
        try {
          // TODO: Implement API endpoint for getting subscription plans
          const plans = [];
          set({ availablePlans: plans, loading: false });
          return plans;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to fetch plans' });
          return [];
        }
      },
      
      // Check if user can perform action
      canPerformAction: (actionType) => {
        const subscription = get().currentSubscription;
        if (!subscription) return false;
        
        const limits = subscription.limits;
        
        switch (actionType) {
          case 'create_product':
            return limits.maxProducts === -1 || limits.maxProducts > 0;
          case 'create_category':
            return limits.maxCategories === -1 || limits.maxCategories > 0;
          case 'view_analytics':
            return subscription.planId !== 'free' || limits.analyticsRetention > 0;
          case 'export_data':
            return subscription.planId === 'premium' || subscription.planId === 'enterprise';
          case 'api_access':
            return subscription.planId === 'enterprise';
          default:
            return true;
        }
      },
      
      // Get plan features
      getPlanFeatures: () => {
        const subscription = get().currentSubscription;
        if (!subscription) return [];
        
        return subscription.features || [];
      },
      
      // Get plan limits
      getPlanLimits: () => {
        const subscription = get().currentSubscription;
        if (!subscription) return {};
        
        return subscription.limits || {};
      },
      
      // Check if subscription is active
      isSubscriptionActive: () => {
        const subscription = get().currentSubscription;
        if (!subscription) return false;
        
        return subscription.status === 'active';
      },
      
      // Check if subscription is expired
      isSubscriptionExpired: () => {
        const subscription = get().currentSubscription;
        if (!subscription) return true;
        
        if (!subscription.endDate) return false;
        
        const endDate = subscription.endDate.toDate();
        const now = new Date();
        
        return endDate < now;
      },
      
      // Get days until expiry
      getDaysUntilExpiry: () => {
        const subscription = get().currentSubscription;
        if (!subscription || !subscription.endDate) return null;
        
        const endDate = subscription.endDate.toDate();
        const now = new Date();
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
      },
      
      // Check subscription limit for specific item type
      checkLimit: async (restaurantId, limitType, currentCount = 0) => {
        try {
          const result = await subscriptionService.checkSubscriptionLimit(restaurantId, limitType, currentCount);
          return result;
        } catch (error) {
          console.error('Error checking limit:', error);
          return { allowed: false, reason: 'Error checking limit' };
        }
      },
      
      // Get subscription usage statistics
      getUsage: async (restaurantId) => {
        try {
          const [usageData, subscription] = await Promise.all([
            subscriptionService.getSubscriptionUsage(restaurantId),
            subscriptionService.getRestaurantSubscription(restaurantId)
          ]);
          
          // Get plan information
          const plan = subscription ? {
            id: subscription.planId || subscription.plan_id,
            name: subscription.planName || subscription.plan_name || 'غير محدد',
            limits: subscription.limits || {},
            features: subscription.features || {}
          } : { name: 'غير محدد', limits: {}, features: {} };
          
          // Transform usage data to expected format
          const usage = {
            products: usageData?.menuItems || usageData?.products || 0,
            categories: usageData?.categories || 0,
            branches: usageData?.branches || 0,
            orders: usageData?.orders || 0
          };
          
          // Get limits from subscription or use defaults
          const limits = subscription?.limits || {};
          const formattedLimits = {
            products: limits.maxProducts ?? 0,
            categories: limits.maxCategories ?? 0,
            branches: limits.maxBranches ?? 0,
            orders: limits.maxOrders ?? 0
          };
          
          return {
            plan,
            usage,
            limits: formattedLimits
          };
        } catch (error) {
          console.error('Error getting usage:', error);
          return {
            plan: { name: 'غير محدد', limits: {} },
            usage: { products: 0, branches: 0, orders: 0, categories: 0 },
            limits: { products: 0, branches: 0, orders: 0, categories: 0 }
          };
        }
      },
      
      // Check if feature is available
      hasFeature: async (restaurantId, feature) => {
        try {
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          if (!subscription) return false;
          
          const features = subscription.features || {};
          return features[feature] === true;
        } catch (error) {
          console.error('Error checking feature:', error);
          return false;
        }
      },
      
      // Check if can add more items
      canAddItem: async (restaurantId, itemType) => {
        try {
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          
          // If no subscription, allow basic operations (trial mode)
          if (!subscription || subscription.status !== 'active') {
            // Trial limits
            const trialLimits = {
              maxProducts: 1,
              maxCategories: 2,
              maxBranches: 2,
              maxUsers: 1
            };
            
            const itemTypeMap = {
              'product': 'maxProducts',
              'products': 'maxProducts',
              'category': 'maxCategories',
              'categories': 'maxCategories',
              'branch': 'maxBranches',
              'branches': 'maxBranches'
            };
            
            const limitType = itemTypeMap[itemType] || `max${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s`;
            const limit = trialLimits[limitType];
            
            if (limit === undefined) {
              return true;
            }
            
            const currentCount = await getCurrentItemCount(restaurantId, itemType);
            return currentCount < limit;
          }
          
          // Regular subscription check
          const itemTypeMap = {
            'product': 'maxProducts',
            'products': 'maxProducts',
            'category': 'maxCategories',
            'categories': 'maxCategories',
            'branch': 'maxBranches',
            'branches': 'maxBranches'
          };
          
          const limitType = itemTypeMap[itemType] || `max${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s`;
          const currentCount = await getCurrentItemCount(restaurantId, itemType);
          
          const result = await subscriptionService.checkSubscriptionLimit(restaurantId, limitType, currentCount);
          return result.allowed;
        } catch (error) {
          console.error('Error checking if can add item:', error);
          return false;
        }
      },
      
      // Get remaining slots for item type
      getRemainingSlots: async (restaurantId, itemType) => {
        try {
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          
          // If no subscription, use trial limits
          if (!subscription || subscription.status !== 'active') {
            const trialLimits = {
              maxProducts: 1,
              maxCategories: 2,
              maxBranches: 2,
              maxUsers: 1
            };
            
            const itemTypeMap = {
              'product': 'maxProducts',
              'products': 'maxProducts',
              'category': 'maxCategories',
              'categories': 'maxCategories',
              'branch': 'maxBranches',
              'branches': 'maxBranches'
            };
            
            const limitType = itemTypeMap[itemType] || `max${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s`;
            const limit = trialLimits[limitType];
            
            if (limit === undefined) {
              return 0;
            }
            
            const currentCount = await getCurrentItemCount(restaurantId, itemType);
            return Math.max(0, limit - currentCount);
          }
          
          // Regular subscription check
          const itemTypeMap = {
            'product': 'maxProducts',
            'products': 'maxProducts',
            'category': 'maxCategories',
            'categories': 'maxCategories',
            'branch': 'maxBranches',
            'branches': 'maxBranches'
          };
          
          const limitType = itemTypeMap[itemType] || `max${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s`;
          const currentCount = await getCurrentItemCount(restaurantId, itemType);
          
          const result = await subscriptionService.checkSubscriptionLimit(restaurantId, limitType, currentCount);
          return result.remaining || 0;
        } catch (error) {
          console.error('Error getting remaining slots:', error);
          return 0;
        }
      },
      
      // Check if restaurant is in trial period
      isInTrial: async (restaurantId) => {
        try {
          const subscription = await subscriptionService.getRestaurantSubscription(restaurantId);
          return !subscription || subscription.status !== 'active';
        } catch (error) {
          console.error('Error checking trial period:', error);
          return false;
        }
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Reset store
      reset: () => set({ 
        currentSubscription: null,
        subscriptionHistory: [],
        availablePlans: [],
        limits: {},
        loading: false, 
        error: null
      })
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({ 
        currentSubscription: state.currentSubscription,
        availablePlans: state.availablePlans
      })
    }
  )
);

export default useSubscriptionStore;
