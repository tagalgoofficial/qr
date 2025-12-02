/**
 * Subscription Service
 */
import api from './api';
import API_CONFIG from '../config';

class SubscriptionService {
  /**
   * Get Restaurant Subscription
   */
  async getRestaurantSubscription(restaurantId) {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.GET, { restaurantId });
      // Handle different response formats
      // API returns { success: true, data: {...} } or { success: true, data: null } or { success: true, data: false }
      if (response && response.data !== undefined) {
        // If data is null or false, return null
        if (response.data === null || response.data === false) {
          console.log('Subscription not found for restaurantId:', restaurantId);
          return null;
        }
        return response.data;
      }
      // If response itself is the data (direct return)
      if (response && !response.success && !response.data) {
        return response;
      }
      // If response is null or undefined, return null
      return null;
    } catch (error) {
      // If error occurs, return null instead of throwing
      console.warn('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Check Subscription Limit
   */
  async checkSubscriptionLimit(restaurantId, limitType, currentCount = null) {
    try {
      const subscription = await this.getRestaurantSubscription(restaurantId);
      
      if (!subscription) {
        return { allowed: false, remaining: 0, reason: 'No subscription found' };
      }

      const now = new Date();
      const endDate = new Date(subscription.end_date);
      const isActive = subscription.status === 'active' && endDate > now;

      if (!isActive) {
        return { allowed: false, remaining: 0, reason: 'Subscription not active' };
      }

      const limits = subscription.limits || {};
      const limit = limits[limitType];

      if (limit === -1) {
        return { allowed: true, remaining: -1, currentCount, limit: -1, reason: 'OK' };
      }

      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount);

      return {
        allowed,
        remaining,
        currentCount,
        limit,
        reason: allowed ? 'OK' : 'Limit reached'
      };
    } catch (error) {
      return { allowed: false, remaining: 0, reason: 'Error checking limit' };
    }
  }

  /**
   * Get Subscription Usage
   */
  async getSubscriptionUsage(restaurantId) {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.USAGE, { restaurantId });
      // Handle different response formats
      if (response && response.data) {
        return response.data;
      }
      // If response itself is the data (direct return)
      if (response && !response.success && !response.data) {
        return response;
      }
      // Fallback to default if no data
      return {
        menuItems: 0,
        products: 0,
        branches: 0,
        orders: 0,
        categories: 0
      };
    } catch (error) {
      console.warn('Error fetching subscription usage:', error);
      // Return default usage on error
      return {
        menuItems: 0,
        products: 0,
        branches: 0,
        orders: 0,
        categories: 0
      };
    }
  }
}

export default new SubscriptionService();

