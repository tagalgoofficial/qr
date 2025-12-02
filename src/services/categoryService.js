/**
 * Category Service
 */
import api from './api';
import API_CONFIG from '../config';

class CategoryService {
  /**
   * Get Categories List
   */
  async getCategories(restaurantId) {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.CATEGORIES.LIST, { restaurantId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Category
   */
  async addCategory(restaurantId, categoryData, branchId = null) {
    try {
      // Always include nameEn, even if empty string, so it can be saved to database
      const requestData = {
        restaurantId,
        nameAr: categoryData.nameAr || categoryData.name_ar,
        description: categoryData.description,
        imageUrl: categoryData.imageUrl || categoryData.image_url,
        orderIndex: categoryData.orderIndex || categoryData.order_index
      };
      
      // Include branchId if provided
      if (branchId !== null && branchId !== undefined) {
        requestData.branchId = branchId;
      }
      
      // Include nameEn if it exists in categoryData (even if empty string)
      if ('nameEn' in categoryData || 'name_en' in categoryData) {
        requestData.nameEn = categoryData.nameEn || categoryData.name_en || '';
      }
      
      // Include isActive if it exists in categoryData
      if ('isActive' in categoryData || 'is_active' in categoryData) {
        requestData.isActive = categoryData.isActive !== undefined ? categoryData.isActive : (categoryData.is_active !== undefined ? categoryData.is_active : true);
      }
      
      const response = await api.post(API_CONFIG.ENDPOINTS.CATEGORIES.CREATE, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Category
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const updateData = { id: categoryId };

      if (categoryData.nameAr || categoryData.name_ar) updateData.nameAr = categoryData.nameAr || categoryData.name_ar;
      // Always include nameEn if it exists in categoryData (even if empty string)
      // This allows clearing the English name by sending an empty string
      if ('nameEn' in categoryData || 'name_en' in categoryData) {
        updateData.nameEn = categoryData.nameEn || categoryData.name_en || '';
      }
      if (categoryData.description) updateData.description = categoryData.description;
      // Only include imageUrl if it's provided and not empty
      // This prevents losing existing images when updating other fields
      const imageUrl = categoryData.imageUrl || categoryData.image_url;
      if (imageUrl && imageUrl.trim() !== '') {
        updateData.imageUrl = imageUrl;
      }
      if (categoryData.orderIndex !== undefined || categoryData.order_index !== undefined) updateData.orderIndex = categoryData.orderIndex || categoryData.order_index;

      const response = await api.put(API_CONFIG.ENDPOINTS.CATEGORIES.UPDATE, updateData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Category
   */
  async deleteCategory(categoryId) {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.CATEGORIES.DELETE, { id: categoryId });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reorder Categories
   */
  async reorderCategories(restaurantId, categories) {
    try {
      const promises = categories.map((category, index) =>
        this.updateCategory(category.id, { orderIndex: index })
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export default new CategoryService();

