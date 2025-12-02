/**
 * Theme Service
 */
import api from './api';
import API_CONFIG from '../config';

class ThemeService {
  /**
   * Get Restaurant Theme
   * Public endpoint - no authentication required by default
   */
  async getRestaurantTheme(restaurantId, requireAuth = false) {
    try {
      // For public access, don't include auth token (includeAuth = false)
      const response = await api.get(API_CONFIG.ENDPOINTS.RESTAURANTS.THEME.GET, { restaurantId }, requireAuth);
      return response.data || response || this.getDefaultTheme();
    } catch (error) {
      console.error('Error getting restaurant theme:', error);
      // Return default theme on error instead of throwing
      return this.getDefaultTheme();
    }
  }

  /**
   * Update Restaurant Theme
   */
  async updateRestaurantTheme(restaurantId, themeData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.RESTAURANTS.THEME.UPDATE, {
        restaurantId,
        theme: themeData
      });
      return response.success || false;
    } catch (error) {
      console.error('Error updating restaurant theme:', error);
      return false;
    }
  }

  /**
   * Get Default Theme
   */
  getDefaultTheme() {
    return {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };
  }
}

export default new ThemeService();

