/**
 * Super Admin Payment Service
 */
import api from './api';
import API_CONFIG from '../config';

class SuperAdminPaymentService {
  /**
   * Get All Payments
   */
  async getPayments(status = null) {
    try {
      const params = {};
      if (status) params.status = status;
      
      const response = await api.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN.PAYMENTS.LIST, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Payment Status
   */
  async updatePaymentStatus(paymentId, status, adminNotes = '', createNotification = false) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.SUPER_ADMIN.PAYMENTS.UPDATE_STATUS, {
        id: paymentId,
        status,
        adminNotes,
        createNotification
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new SuperAdminPaymentService();

