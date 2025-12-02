import { create } from 'zustand';
import superAdminRestaurantService from '../services/superAdminRestaurantService';

const useAdminStore = create((set, get) => ({
  restaurants: [],
  subscriptions: [],
  loading: false,
  error: null,
  
  // Fetch all restaurants (for super admin)
  fetchAllRestaurants: async () => {
    set({ loading: true, error: null });
    try {
      const restaurants = await superAdminRestaurantService.getAllRestaurants();
      const restaurantsArray = Array.isArray(restaurants) ? restaurants : [];
      set({ restaurants: restaurantsArray, loading: false });
      return restaurantsArray;
    } catch (error) {
      set({ loading: false, error: error.message || 'Failed to fetch restaurants' });
      return [];
    }
  },
  
  // Fetch active subscriptions
  fetchActiveSubscriptions: async () => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement API endpoint for active subscriptions
      const subscriptions = [];
      set({ subscriptions, loading: false });
      return subscriptions;
    } catch (error) {
      set({ loading: false, error: error.message || 'Failed to fetch subscriptions' });
      return [];
    }
  },
  
  // Update restaurant subscription status
  updateSubscriptionStatus: async (restaurantId, isActive) => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement API endpoint for updating subscription status
      const { restaurants, subscriptions } = get();
      
      const updatedRestaurants = restaurants.map(restaurant => {
        if (restaurant.id === restaurantId) {
          return {
            ...restaurant,
            subscription: {
              ...restaurant.subscription,
              active: isActive,
              updatedAt: new Date()
            }
          };
        }
        return restaurant;
      });
      
      const updatedSubscriptions = subscriptions.map(subscription => {
        if (subscription.id === restaurantId) {
          return {
            ...subscription,
            subscription: {
              ...subscription.subscription,
              active: isActive,
              updatedAt: new Date()
            }
          };
        }
        return subscription;
      });
      
      set({ 
        restaurants: updatedRestaurants, 
        subscriptions: updatedSubscriptions,
        loading: false 
      });
      
      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message || 'Failed to update subscription' });
      return { success: false, error: error.message };
    }
  },
  
  // Clear error
  clearError: () => set({ error: null })
}));

export default useAdminStore;