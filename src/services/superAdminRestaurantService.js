/**
 * Super Admin Restaurant Service
 */
import api from './api';
import API_CONFIG from '../config';

class SuperAdminRestaurantService {
  /**
   * Get All Restaurants
   */
  async getAllRestaurants() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN.RESTAURANTS.LIST);
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      }
      if (response && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      // If response is an object but no data property, return empty array
      console.warn('Unexpected response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }

  /**
   * Get Restaurant by ID
   */
  async getRestaurantById(restaurantId) {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.RESTAURANTS.GET, { id: restaurantId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Restaurant
   */
  async updateRestaurant(restaurantId, updateData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.SUPER_ADMIN.RESTAURANTS.UPDATE, {
        id: restaurantId,
        ...updateData
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Restaurant (Soft Delete)
   */
  async deleteRestaurant(restaurantId) {
    try {
      return await this.updateRestaurant(restaurantId, { isActive: false });
    } catch (error) {
      throw error;
    }
  }
}

export default new SuperAdminRestaurantService();

