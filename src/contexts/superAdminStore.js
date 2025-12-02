import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import superAdminRestaurantService from '../services/superAdminRestaurantService';
import superAdminAnalyticsService from '../services/superAdminAnalyticsService';
import superAdminSubscriptionService from '../services/superAdminSubscriptionService';
import superAdminPaymentMethodService from '../services/superAdminPaymentMethodService';
import superAdminPaymentService from '../services/superAdminPaymentService';

const useSuperAdminStore = create(
  persist(
    (set, get) => ({
      // Restaurants
      restaurants: [],
      currentRestaurant: null,
      
      // Subscriptions
      subscriptions: [],
      subscriptionPlans: [],
      currentPlan: null,
      
      // Analytics
      systemAnalytics: [],
      
      // Users
      users: [],
      currentUser: null,
      
      // UI State
      loading: false,
      error: null,
      
      // Fetch all restaurants
      fetchRestaurants: async () => {
        set({ loading: true, error: null });
        try {
          const restaurants = await superAdminRestaurantService.getAllRestaurants();
          // Ensure restaurants is always an array
          const restaurantsArray = Array.isArray(restaurants) ? restaurants : [];
          console.log('Fetched restaurants:', restaurantsArray.length);
          set({ restaurants: restaurantsArray, loading: false });
          return restaurantsArray;
        } catch (error) {
          console.error('Error in fetchRestaurants:', error);
          set({ loading: false, error: error.message });
          return [];
        }
      },
      
      // Get restaurant by ID
      fetchRestaurant: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
          const restaurant = await superAdminRestaurantService.getRestaurantById(restaurantId);
          set({ currentRestaurant: restaurant, loading: false });
          return restaurant;
        } catch (error) {
          set({ loading: false, error: error.message });
          return null;
        }
      },
      
      // Update restaurant
      updateRestaurant: async (restaurantId, updateData) => {
        set({ loading: true, error: null });
        try {
          await superAdminRestaurantService.updateRestaurant(restaurantId, updateData);
          const restaurants = get().restaurants;
          const updatedRestaurants = restaurants.map(restaurant => 
            restaurant.id == restaurantId ? { ...restaurant, ...updateData } : restaurant
          );
          set({ restaurants: updatedRestaurants, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      
      // Delete restaurant
      deleteRestaurant: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
          await superAdminRestaurantService.deleteRestaurant(restaurantId);
          const restaurants = get().restaurants;
          const filteredRestaurants = restaurants.filter(restaurant => restaurant.id != restaurantId);
          set({ restaurants: filteredRestaurants, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      
      // Fetch all subscriptions
      fetchSubscriptions: async () => {
        set({ loading: true, error: null });
        try {
          const subscriptions = await superAdminSubscriptionService.getAllSubscriptions();
          set({ subscriptions, loading: false });
          return subscriptions;
        } catch (error) {
          set({ loading: false, error: error.message });
          return [];
        }
      },
      
      // Fetch subscription plans
      fetchSubscriptionPlans: async () => {
        set({ loading: true, error: null });
        try {
          const plans = await superAdminSubscriptionService.getSubscriptionPlans();
          set({ subscriptionPlans: plans, loading: false });
          return plans;
        } catch (error) {
          set({ loading: false, error: error.message });
          return [];
        }
      },
      
      // Create subscription plan
      createSubscriptionPlan: async (planData) => {
        set({ loading: true, error: null });
        try {
          const plan = await superAdminSubscriptionService.createSubscriptionPlan(planData);
          const plans = get().subscriptionPlans;
          set({ subscriptionPlans: [...plans, plan], loading: false });
          return plan;
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      
      // Update subscription plan
      updateSubscriptionPlan: async (planId, updateData) => {
        set({ loading: true, error: null });
        try {
          const updatedPlan = await superAdminSubscriptionService.updateSubscriptionPlan(planId, updateData);
          const plans = get().subscriptionPlans;
          const updatedPlans = plans.map(plan => 
            plan.id == planId ? { ...plan, ...updatedPlan } : plan
          );
          set({ subscriptionPlans: updatedPlans, loading: false });
          return updatedPlan;
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      
      // Delete subscription plan
      deleteSubscriptionPlan: async (planId) => {
        set({ loading: true, error: null });
        try {
          await superAdminSubscriptionService.deleteSubscriptionPlan(planId);
          const plans = get().subscriptionPlans;
          const filteredPlans = plans.filter(plan => plan.id != planId);
          set({ subscriptionPlans: filteredPlans, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      
      // Fetch system analytics
      fetchSystemAnalytics: async () => {
        set({ loading: true, error: null });
        try {
          const analytics = await superAdminAnalyticsService.getSystemAnalytics();
          set({ systemAnalytics: analytics, loading: false });
          return analytics;
        } catch (error) {
          set({ loading: false, error: error.message });
          return null;
        }
      },
      
      // Alias for fetchSystemAnalytics
      fetchAnalytics: async () => {
        return get().fetchSystemAnalytics();
      },
      
      // Create system analytics entry (placeholder)
      createSystemAnalytics: async (analyticsData) => {
        try {
          // TODO: Create API endpoint for this if needed
          return { success: true };
        } catch (error) {
          console.error('Error creating system analytics:', error);
          return { success: false, error: error.message };
        }
      },
      
      // Fetch all users (placeholder - needs API endpoint)
      fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
          // TODO: Create API endpoint for this
          set({ users: [], loading: false });
          return [];
        } catch (error) {
          set({ loading: false, error: error.message });
          return [];
        }
      },
      
      // Update user (placeholder - needs API endpoint)
      updateUser: async (userId, updateData) => {
        set({ loading: true, error: null });
        try {
          // TODO: Create API endpoint for this
          throw new Error('Not implemented yet');
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      
      // Delete user (placeholder - needs API endpoint)
      deleteUser: async (userId) => {
        set({ loading: true, error: null });
        try {
          // TODO: Create API endpoint for this
          throw new Error('Not implemented yet');
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
      
      // Set current restaurant
      setCurrentRestaurant: (restaurant) => {
        set({ currentRestaurant: restaurant });
      },
      
      // Set current plan
      setCurrentPlan: (plan) => {
        set({ currentPlan: plan });
      },
      
      // Set current user
      setCurrentUser: (user) => {
        set({ currentUser: user });
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Reset store
      reset: () => set({ 
        restaurants: [],
        currentRestaurant: null,
        subscriptions: [],
        subscriptionPlans: [],
        currentPlan: null,
        systemAnalytics: [],
        users: [],
        currentUser: null,
        loading: false, 
        error: null
      })
    }),
    {
      name: 'super-admin-storage',
      partialize: (state) => ({ 
        restaurants: state.restaurants,
        subscriptionPlans: state.subscriptionPlans,
        users: state.users
      })
    }
  )
);

export default useSuperAdminStore;
