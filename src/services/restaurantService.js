/**
 * Restaurant Service
 */
import api from './api';
import API_CONFIG from '../config';

class RestaurantService {
  /**
   * Get Restaurant by ID or Slug
   */
  async getRestaurant(id = null, slug = null) {
    try {
      const params = {};
      if (id) {
        params.id = id;
      }
      if (slug) {
        params.slug = slug;
      }

      const response = await api.get(API_CONFIG.ENDPOINTS.RESTAURANTS.GET, params);
      return response.data || response;
    } catch (error) {
      // Re-throw error so caller can handle 404 for slug availability check
      throw error;
    }
  }

  /**
   * Update Restaurant
   */
  async updateRestaurant(restaurantId, data) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.RESTAURANTS.UPDATE, {
        restaurantId,
        ...data
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Restaurant Settings
   */
  async getRestaurantSettings(restaurantId) {
    try {
      const restaurant = await this.getRestaurant(restaurantId);
      return {
        name: restaurant.restaurant_name || restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        description: restaurant.description,
        logo: restaurant.logo_url || restaurant.logo,
        coverImage: restaurant.background_url || restaurant.coverImage || restaurant.background,
        languages: restaurant.languages || ['en'],
        language: restaurant.default_language || restaurant.language || 'en',
        defaultLanguage: restaurant.default_language || 'en',
        currency: restaurant.currency || 'EGP',
        themeColors: restaurant.theme_colors || {},
        mainRestaurantNameAr: restaurant.main_restaurant_name_ar || null,
        mainRestaurantNameEn: restaurant.main_restaurant_name_en || null
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Restaurant Settings
   */
  async updateRestaurantSettings(restaurantId, settings) {
    try {
      return await this.updateRestaurant(restaurantId, {
        settings: {
          languages: settings.languages,
          defaultLanguage: settings.defaultLanguage,
          currency: settings.currency,
          themeColors: settings.themeColors,
          mainRestaurantNameAr: settings.mainRestaurantNameAr,
          mainRestaurantNameEn: settings.mainRestaurantNameEn
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Restaurant Slug
   */
  async updateRestaurantSlug(restaurantId, newSlug) {
    try {
      return await this.updateRestaurant(restaurantId, { slug: newSlug });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update User Email
   */
  async updateUserEmail(restaurantId, email) {
    try {
      // Email is updated through the restaurant update endpoint
      return await this.updateRestaurant(restaurantId, { email });
    } catch (error) {
      throw error;
    }
  }
}

export default new RestaurantService();

