/**
 * Super Admin Payment Method Service
 */
import api from './api';
import API_CONFIG from '../config';

class SuperAdminPaymentMethodService {
  /**
   * Get Payment Methods
   */
  async getPaymentMethods() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN.PAYMENT_METHODS.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Payment Method
   */
  async createPaymentMethod(methodData) {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.SUPER_ADMIN.PAYMENT_METHODS.CREATE, methodData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Payment Method
   */
  async updatePaymentMethod(methodId, updateData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.SUPER_ADMIN.PAYMENT_METHODS.UPDATE, {
        id: methodId,
        ...updateData
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Payment Method
   */
  async deletePaymentMethod(methodId) {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.SUPER_ADMIN.PAYMENT_METHODS.DELETE, { id: methodId });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new SuperAdminPaymentMethodService();

