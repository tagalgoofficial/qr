/**
 * Branch Service
 */
import api from './api';
import API_CONFIG from '../config';

class BranchService {
  /**
   * Get Branches List
   */
  async getBranches(restaurantId) {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.BRANCHES.LIST, { restaurantId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Single Branch
   */
  async getBranch(branchId) {
    try {
      const branches = await this.getBranches(null); // Will need to modify API to support single branch
      return branches.find(b => b.id == branchId) || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Branch
   */
  async addBranch(restaurantId, branchData) {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.BRANCHES.CREATE, {
        restaurantId,
        name: branchData.name,
        address: branchData.address,
        phone: branchData.phone,
        isActive: branchData.isActive !== undefined ? branchData.isActive : true
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Branch
   */
  async updateBranch(branchId, branchData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.BRANCHES.UPDATE, {
        id: branchId,
        name: branchData.name,
        address: branchData.address,
        phone: branchData.phone,
        isActive: branchData.isActive !== undefined ? branchData.isActive : (branchData.is_active !== undefined ? branchData.is_active : undefined)
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Branch
   */
  async deleteBranch(branchId) {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.BRANCHES.DELETE, { id: branchId });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Branch Categories
   */
  async getBranchCategories(restaurantId, branchId) {
    try {
      // Use the categories list endpoint with branchId parameter
      const response = await api.get(API_CONFIG.ENDPOINTS.CATEGORIES.LIST, { 
        restaurantId,
        branchId: branchId || null
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching branch categories:', error);
      return [];
    }
  }

  /**
   * Get Branch Products
   */
  async getBranchProducts(restaurantId, branchId) {
    try {
      // Use the products list endpoint with branchId parameter
      const response = await api.get(API_CONFIG.ENDPOINTS.PRODUCTS.LIST, { 
        restaurantId,
        branchId: branchId || null
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching branch products:', error);
      return [];
    }
  }
}

export default new BranchService();

