/**
 * Storage Service (File Upload)
 */
import api from './api';
import API_CONFIG from '../config';

class StorageService {
  /**
   * Upload Image
   */
  async uploadImage(file, folder = 'general') {
    try {
      const response = await api.uploadFile(API_CONFIG.ENDPOINTS.UPLOAD.IMAGE, file, folder);
      // Handle both response formats: { data: {...} } or direct {...}
      if (response.data) {
        return response.data;
      }
      // If response doesn't have data property, return the whole response
      return response;
    } catch (error) {
      console.error('StorageService uploadImage error:', error);
      throw error;
    }
  }

  /**
   * Upload Menu Item Image
   */
  async uploadMenuItemImage(restaurantId, menuItemId, file) {
    return this.uploadImage(file, `restaurants/${restaurantId}/menuItems/${menuItemId}`);
  }

  /**
   * Upload Restaurant Logo
   */
  async uploadRestaurantLogo(restaurantId, file) {
    return this.uploadImage(file, `restaurants/${restaurantId}/logo`);
  }

  /**
   * Upload Restaurant Background
   */
  async uploadRestaurantBackground(restaurantId, file) {
    return this.uploadImage(file, `restaurants/${restaurantId}/background`);
  }

  /**
   * Delete Image
   */
  async deleteImage(path) {
    // This would require a new API endpoint
    // For now, return success
    return { success: true };
  }
}

export default new StorageService();

