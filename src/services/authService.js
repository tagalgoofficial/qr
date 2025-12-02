/**
 * Authentication Service
 */
import api from './api';
import API_CONFIG from '../config';

class AuthService {
  /**
   * Register User
   */
  async register(email, password, restaurantName, ownerName, phone) {
    try {
      const response = await api.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        {
          email,
          password,
          restaurantName,
          ownerName,
          phone
        },
        false // No auth required for registration
      );

      if (response.success && response.data.token) {
        api.setToken(response.data.token);
        return {
          user: response.data.user,
          restaurant: response.data.restaurant,
          slug: response.data.restaurant.slug
        };
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login User
   */
  async login(email, password) {
    try {
      const response = await api.post(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        { email, password },
        false // No auth required for login
      );

      if (response.success && response.data.token) {
        api.setToken(response.data.token);
        return {
          user: response.data.user
        };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout User
   */
  async logout() {
    try {
      await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      api.setToken(null);
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear token locally
      api.setToken(null);
      return { success: true };
    }
  }

  /**
   * Verify Token
   */
  async verifyToken() {
    // Check if token exists before making request
    const token = api.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.AUTH.VERIFY);
      
      if (response.success && response.data.user) {
        return response.data.user;
      }

      throw new Error('Invalid token');
    } catch (error) {
      // Clear token if verification fails
      api.setToken(null);
      throw error;
    }
  }

  /**
   * Reset Password
   */
  async resetPassword(email) {
    try {
      const response = await api.post(
        API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
        { email },
        false
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Current User from Token
   */
  getCurrentUser() {
    const token = api.getToken();
    if (!token) {
      return null;
    }

    try {
      // Decode JWT token (basic decode without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();

