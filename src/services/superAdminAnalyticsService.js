/**
 * Super Admin Analytics Service
 */
import api from './api';
import API_CONFIG from '../config';

class SuperAdminAnalyticsService {
  /**
   * Get System Analytics
   */
  async getSystemAnalytics() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN.ANALYTICS.GET);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new SuperAdminAnalyticsService();

