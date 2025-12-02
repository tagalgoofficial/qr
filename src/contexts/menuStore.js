import { create } from 'zustand';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import branchService from '../services/branchService';

const useMenuStore = create((set, get) => ({
  // Categories state
  categories: [],
  categoriesLoading: false,
  categoriesError: null,
  
  // Products state
  products: [],
  productsLoading: false,
  productsError: null,
  
  // Selected category for products
  selectedCategoryId: null,
  
  // Actions for categories
  fetchCategories: async (restaurantId, branchId = null) => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      let categories;
      if (branchId) {
        categories = await branchService.getBranchCategories(restaurantId, branchId);
      } else {
        categories = await categoryService.getCategories(restaurantId);
      }
      set({ categories, categoriesLoading: false });
      return categories;
    } catch (error) {
      set({ 
        categoriesError: error.message || 'Failed to fetch categories', 
        categoriesLoading: false 
      });
      throw error;
    }
  },
  
  addCategory: async (restaurantId, categoryData, branchId = null) => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      // Always pass branchId to categoryService.addCategory
      // The service will handle whether to include it in the request or not
      const newCategory = await categoryService.addCategory(restaurantId, categoryData, branchId);
      set(state => ({
        categories: [...state.categories, newCategory],
        categoriesLoading: false
      }));
      return newCategory;
    } catch (error) {
      set({ 
        categoriesError: error.message || 'Failed to create category', 
        categoriesLoading: false 
      });
      throw error;
    }
  },
  
  updateCategory: async (restaurantId, categoryId, updateData, branchId = null) => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      await categoryService.updateCategory(categoryId, updateData);
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === categoryId ? { ...cat, ...updateData } : cat
        ),
        categoriesLoading: false
      }));
      return { success: true };
    } catch (error) {
      set({ 
        categoriesError: error.message || 'Failed to update category', 
        categoriesLoading: false 
      });
      throw error;
    }
  },
  
  deleteCategory: async (restaurantId, categoryId, branchId = null) => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      await categoryService.deleteCategory(categoryId);
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== categoryId),
        categoriesLoading: false
      }));
      return { success: true };
    } catch (error) {
      set({ 
        categoriesError: error.message || 'Failed to delete category', 
        categoriesLoading: false 
      });
      throw error;
    }
  },
  
  reorderCategories: async (restaurantId, categories) => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      await categoryService.reorderCategories(restaurantId, categories);
      set({ categories, categoriesLoading: false });
      return { success: true };
    } catch (error) {
      set({ 
        categoriesError: error.message || 'Failed to reorder categories', 
        categoriesLoading: false 
      });
      throw error;
    }
  },
  
  // Actions for products
  fetchProducts: async (restaurantId, branchId = null) => {
    set({ productsLoading: true, productsError: null });
    try {
      let products;
      if (branchId) {
        products = await branchService.getBranchProducts(restaurantId, branchId);
      } else {
        products = await productService.getProducts(restaurantId);
      }
      set({ products, productsLoading: false });
      return products;
    } catch (error) {
      set({ 
        productsError: error.message || 'Failed to fetch products', 
        productsLoading: false 
      });
      throw error;
    }
  },
  
  fetchProductsByCategory: async (restaurantId, categoryId) => {
    set({ productsLoading: true, productsError: null, selectedCategoryId: categoryId });
    try {
      const products = await productService.getProducts(restaurantId, categoryId);
      set({ products, productsLoading: false });
      return products;
    } catch (error) {
      set({ 
        productsError: error.message || 'Failed to fetch products by category', 
        productsLoading: false 
      });
      throw error;
    }
  },
  
  addProduct: async (restaurantId, productData, branchId = null) => {
    set({ productsLoading: true, productsError: null });
    try {
      // Always pass branchId to productService.addProduct
      // The service will handle whether to include it in the request or not
      const newProduct = await productService.addProduct(restaurantId, productData, branchId);
      set(state => ({
        products: [...state.products, newProduct],
        productsLoading: false
      }));
      return newProduct;
    } catch (error) {
      set({ 
        productsError: error.message || 'Failed to create product', 
        productsLoading: false 
      });
      throw error;
    }
  },
  
  updateProduct: async (restaurantId, productId, updateData, branchId = null) => {
    set({ productsLoading: true, productsError: null });
    try {
      await productService.updateProduct(productId, updateData);
      set(state => ({
        products: state.products.map(product => 
          product.id === productId ? { ...product, ...updateData } : product
        ),
        productsLoading: false
      }));
      return { success: true };
    } catch (error) {
      set({ 
        productsError: error.message || 'Failed to update product', 
        productsLoading: false 
      });
      throw error;
    }
  },
  
  deleteProduct: async (restaurantId, productId, branchId = null) => {
    set({ productsLoading: true, productsError: null });
    try {
      await productService.deleteProduct(productId);
      set(state => ({
        products: state.products.filter(product => product.id !== productId),
        productsLoading: false
      }));
      return { success: true };
    } catch (error) {
      set({ 
        productsError: error.message || 'Failed to delete product', 
        productsLoading: false 
      });
      throw error;
    }
  },
  
  updateProductViews: async (restaurantId, productId) => {
    try {
      await productService.updateProductViews(productId);
      set(state => ({
        products: state.products.map(product => 
          product.id === productId 
            ? { ...product, views: (product.views || 0) + 1 }
            : product
        )
      }));
      return { success: true };
    } catch (error) {
      console.error('Error updating product views:', error);
      throw error;
    }
  },
  
  reorderProducts: async (restaurantId, products) => {
    set({ productsLoading: true, productsError: null });
    try {
      await productService.reorderProducts(restaurantId, products);
      set({ products, productsLoading: false });
      return { success: true };
    } catch (error) {
      set({ 
        productsError: error.message || 'Failed to reorder products', 
        productsLoading: false 
      });
      throw error;
    }
  },
  
  // Clear errors
  clearCategoriesError: () => set({ categoriesError: null }),
  clearProductsError: () => set({ productsError: null }),
  
  // Reset state
  resetMenuStore: () => set({
    categories: [],
    products: [],
    categoriesLoading: false,
    productsLoading: false,
    categoriesError: null,
    productsError: null,
    selectedCategoryId: null
  })
}));

export default useMenuStore;
