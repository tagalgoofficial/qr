/**
 * Notification Service
 */
import api from './api';
import API_CONFIG from '../config';

class NotificationService {
  /**
   * Get Notifications
   */
  async getUserNotifications() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark Notification as Read
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ, {
        id: notificationId
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark All Notifications as Read
   */
  async markAllNotificationsAsRead() {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ, {});
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Unread Notifications Count
   */
  async getUnreadNotificationsCount() {
    try {
      const notifications = await this.getUserNotifications();
      return notifications.filter(n => !n.is_read).length;
    } catch (error) {
      return 0;
    }
  }
}

export default new NotificationService();

