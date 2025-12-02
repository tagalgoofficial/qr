/**
 * Order Service
 */
import api from './api';
import API_CONFIG from '../config';

class OrderService {
  /**
   * Create Order
   */
  async createOrder(restaurantId, branchId, orderData) {
    try {
      console.log('📤 OrderService.createOrder - Sending request:', {
        restaurantId,
        branchId,
        itemsCount: orderData.items?.length || 0,
        total: orderData.total
      });
      
      const response = await api.post(API_CONFIG.ENDPOINTS.ORDERS.CREATE, {
        restaurantId,
        branchId: branchId || null,
        items: orderData.items,
        subtotal: orderData.subtotal,
        tax: orderData.tax || 0,
        total: orderData.total,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        notes: orderData.notes
      });
      
      console.log('📥 OrderService.createOrder - Received response:', response);
      
      // API returns {success: true, message: '...', data: {...}}
      // handleResponse already returns the full response object
      // So we need to check if data exists, otherwise return the whole response
      const result = response.data || response;
      console.log('✅ OrderService.createOrder - Returning:', result);
      return result;
    } catch (error) {
      console.error('❌ OrderService.createOrder error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      throw error;
    }
  }

  /**
   * Get Orders List
   */
  async getOrders(restaurantId, branchId = null, status = null) {
    try {
      const params = { restaurantId };
      if (branchId) params.branchId = branchId;
      if (status) params.status = status;

      const response = await api.get(API_CONFIG.ENDPOINTS.ORDERS.LIST, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Order Status
   */
  async updateOrderStatus(orderId, status, notes = '') {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS, {
        id: orderId,
        status,
        notes
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark Order as Read
   */
  async markOrderAsRead(orderId) {
    // This would require a new API endpoint
    // For now, return success
    return { success: true };
  }
}

export default new OrderService();

