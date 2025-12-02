/**
 * Product Service
 */
import api from './api';
import API_CONFIG from '../config';

class ProductService {
  /**
   * Get Products List
   */
  async getProducts(restaurantId, categoryId = null) {
    try {
      const params = { restaurantId };
      if (categoryId) params.categoryId = categoryId;

      const response = await api.get(API_CONFIG.ENDPOINTS.PRODUCTS.LIST, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Single Product
   */
  async getProduct(productId) {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.PRODUCTS.GET, { id: productId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Product
   */
  async addProduct(restaurantId, productData, branchId = null) {
    try {
      const requestData = {
        restaurantId,
        nameAr: productData.nameAr || productData.name_ar,
        nameEn: productData.nameEn || productData.name_en,
        descriptionAr: productData.descriptionAr || productData.description_ar,
        descriptionEn: productData.descriptionEn || productData.description_en,
        price: productData.price,
        originalPrice: (productData.originalPrice && productData.originalPrice !== '' && productData.originalPrice !== null) 
          ? productData.originalPrice 
          : ((productData.original_price && productData.original_price !== '' && productData.original_price !== null) 
            ? productData.original_price 
            : null),
        discountedPrice: (productData.discountedPrice && productData.discountedPrice !== '' && productData.discountedPrice !== null) 
          ? productData.discountedPrice 
          : ((productData.discounted_price && productData.discounted_price !== '' && productData.discounted_price !== null) 
            ? productData.discounted_price 
            : null),
        categoryId: productData.categoryId || productData.category_id,
        imageUrl: productData.imageUrl || productData.image_url,
        orderIndex: productData.orderIndex || productData.order_index,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        isAvailable: productData.isAvailable !== undefined ? productData.isAvailable : true,
        sizes: productData.sizes || [],
        weights: productData.weights || [],
        extras: productData.extras || []
      };
      
      // Include branchId if provided
      if (branchId !== null && branchId !== undefined) {
        requestData.branchId = branchId;
      }
      
      const response = await api.post(API_CONFIG.ENDPOINTS.PRODUCTS.CREATE, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Product
   */
  async updateProduct(productId, productData) {
    try {
      const updateData = {
        id: productId
      };

      if (productData.nameAr || productData.name_ar) updateData.nameAr = productData.nameAr || productData.name_ar;
      if (productData.nameEn || productData.name_en) updateData.nameEn = productData.nameEn || productData.name_en;
      if (productData.descriptionAr || productData.description_ar) updateData.descriptionAr = productData.descriptionAr || productData.description_ar;
      if (productData.descriptionEn || productData.description_en) updateData.descriptionEn = productData.descriptionEn || productData.description_en;
      if (productData.price !== undefined) updateData.price = productData.price;
      
      // Handle discount prices - always send if present (even if null to clear them)
      if ('originalPrice' in productData || 'original_price' in productData) {
        const origPrice = productData.originalPrice || productData.original_price;
        updateData.originalPrice = (origPrice && origPrice !== '' && origPrice !== null) ? origPrice : null;
      }
      if ('discountedPrice' in productData || 'discounted_price' in productData) {
        const discPrice = productData.discountedPrice || productData.discounted_price;
        updateData.discountedPrice = (discPrice && discPrice !== '' && discPrice !== null) ? discPrice : null;
      }
      
      if (productData.categoryId || productData.category_id) updateData.categoryId = productData.categoryId || productData.category_id;
      // Only include imageUrl if it's provided and not empty
      // This prevents losing existing images when updating other fields
      const imageUrl = productData.imageUrl || productData.image_url;
      if (imageUrl && imageUrl.trim() !== '') {
        updateData.imageUrl = imageUrl;
      }
      // Handle orderIndex - allow 0 as a valid value
      if (productData.orderIndex !== undefined || productData.order_index !== undefined) {
        const orderIdx = productData.orderIndex !== undefined ? productData.orderIndex : productData.order_index;
        updateData.orderIndex = orderIdx;
      }
      if (productData.isActive !== undefined) updateData.isActive = productData.isActive;
      if (productData.isAvailable !== undefined) updateData.isAvailable = productData.isAvailable;
      
      // Add sizes, weights, and extras
      if (productData.sizes !== undefined) updateData.sizes = productData.sizes;
      if (productData.weights !== undefined) updateData.weights = productData.weights;
      if (productData.extras !== undefined) updateData.extras = productData.extras;

      // Debug: Log update data to verify orderIndex is included
      if (updateData.orderIndex !== undefined) {
        console.log('📝 Updating product orderIndex:', {
          productId: updateData.id,
          orderIndex: updateData.orderIndex,
          updateDataKeys: Object.keys(updateData)
        });
      }

      const response = await api.put(API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE, updateData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Product
   */
  async deleteProduct(productId) {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.PRODUCTS.DELETE, { id: productId });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Product Views
   */
  async updateProductViews(productId) {
    // This is handled automatically by the API when getting a product
    // But we can call getProduct to trigger the view increment
    try {
      await this.getProduct(productId);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reorder Products
   */
  async reorderProducts(restaurantId, products) {
    try {
      const promises = products.map((product, index) =>
        this.updateProduct(product.id, { orderIndex: index })
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export default new ProductService();

