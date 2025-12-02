/**
 * Super Admin Subscription Service
 */
import api from './api';
import API_CONFIG from '../config';

class SuperAdminSubscriptionService {
  /**
   * Get All Subscriptions
   */
  async getAllSubscriptions(status = null) {
    try {
      const params = {};
      if (status) params.status = status;
      
      const response = await api.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN.SUBSCRIPTIONS.LIST, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Subscription Plans
   */
  async getSubscriptionPlans() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN.SUBSCRIPTION_PLANS.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Subscription
   */
  async createSubscription(subscriptionData) {
    try {
      console.log('Sending subscription data to API:', subscriptionData);
      const response = await api.post(API_CONFIG.ENDPOINTS.SUPER_ADMIN.SUBSCRIPTIONS.CREATE, subscriptionData);
      console.log('API response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response[0] || response;
      }
      if (response && response.data) {
        return response.data;
      }
      return response;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update Subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      // Ensure planId is always a number (even if 0)
      const normalizedUpdateData = {
        ...updateData,
        planId: updateData.planId !== undefined && updateData.planId !== null 
          ? Number(updateData.planId) 
          : (updateData.planId === null ? 0 : updateData.planId)
      };
      
      const requestPayload = {
        id: subscriptionId,
        ...normalizedUpdateData
      };
      
      console.log('=== SERVICE UPDATE DEBUG ===');
      console.log('Request payload:', requestPayload);
      console.log('planId in payload:', requestPayload.planId, 'type:', typeof requestPayload.planId);
      console.log('planId value check:', requestPayload.planId === 0 ? 'ZERO' : requestPayload.planId);
      
      const apiResponse = await api.put(API_CONFIG.ENDPOINTS.SUPER_ADMIN.SUBSCRIPTIONS.UPDATE, requestPayload);
      
      console.log('API response:', apiResponse);
      console.log('API response keys:', Object.keys(apiResponse || {}));
      console.log('API response.data:', apiResponse?.data);
      
      // API returns {success: true, message: '...', data: {...}}
      if (apiResponse && apiResponse.success && apiResponse.data) {
        console.log('Returning apiResponse.data:', apiResponse.data);
        console.log('planId in response.data:', apiResponse.data.planId, apiResponse.data.plan_id);
        return apiResponse.data;
      }
      
      // If response doesn't have the expected structure, return it as-is
      // (might be the subscription object directly)
      if (apiResponse && (apiResponse.id || apiResponse.plan_id || apiResponse.planId)) {
        console.log('Returning apiResponse directly:', apiResponse);
        return apiResponse;
      }
      
      console.log('WARNING: No valid data in response, returning empty object');
      return {};
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Create Subscription Plan
   */
  async createSubscriptionPlan(planData) {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.SUPER_ADMIN.SUBSCRIPTION_PLANS.CREATE, planData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Subscription Plan
   */
  async updateSubscriptionPlan(planId, updateData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.SUPER_ADMIN.SUBSCRIPTION_PLANS.UPDATE, {
        id: planId,
        ...updateData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Subscription Plan
   */
  async deleteSubscriptionPlan(planId) {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.SUPER_ADMIN.SUBSCRIPTION_PLANS.DELETE, { id: planId });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new SuperAdminSubscriptionService();

