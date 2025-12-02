/**
 * Super Admin Service
 */
import api from './api';
import API_CONFIG from '../config';

class SuperAdminService {
  /**
   * Create Super Admin
   */
  async createSuperAdmin(email, password, displayName) {
    try {
      const response = await api.post(
        API_CONFIG.ENDPOINTS.SUPER_ADMIN.CREATE,
        {
          email,
          password,
          displayName
        },
        false // No auth required for creating super admin (should be protected in production)
      );

      if (response.success && response.data.token) {
        api.setToken(response.data.token);
        return {
          user: response.data.user,
          token: response.data.token
        };
      }

      throw new Error(response.message || 'Failed to create super admin');
    } catch (error) {
      throw error;
    }
  }
}

export default new SuperAdminService();

