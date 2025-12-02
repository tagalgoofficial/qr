import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import productService from '../services/productService';

const useProductsStore = create(
  persist(
    (set, get) => ({
      products: [],
      currentProduct: null,
      loading: false,
      error: null,
      searchQuery: '',
      selectedCategory: 'all',
      filters: {
        priceRange: [0, 1000],
        isAvailable: true,
        isVegetarian: null
      },
      
      // Fetch products
      fetchProducts: async (restaurantId, categoryId = null) => {
        set({ loading: true, error: null });
        try {
          const products = await productService.getProducts(restaurantId, categoryId);
          set({ products, loading: false });
          return products;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to fetch products' });
          return [];
        }
      },
      
      // Fetch single product
      fetchProduct: async (restaurantId, productId) => {
        set({ loading: true, error: null });
        try {
          const product = await productService.getProduct(productId);
          set({ currentProduct: product, loading: false });
          return product;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to fetch product' });
          throw error;
        }
      },
      
      // Create product
      createProduct: async (restaurantId, productData) => {
        set({ loading: true, error: null });
        try {
          const newProduct = await productService.addProduct(restaurantId, productData);
          const currentProducts = get().products;
          set({ 
            products: [newProduct, ...currentProducts],
            loading: false 
          });
          return newProduct;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to create product' });
          throw error;
        }
      },
      
      // Update product
      updateProduct: async (restaurantId, productId, updateData) => {
        set({ loading: true, error: null });
        try {
          await productService.updateProduct(productId, updateData);
          const currentProducts = get().products;
          const updatedProducts = currentProducts.map(product => 
            product.id === productId ? { ...product, ...updateData } : product
          );
          set({ products: updatedProducts, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to update product' });
          throw error;
        }
      },
      
      // Delete product
      deleteProduct: async (restaurantId, productId) => {
        set({ loading: true, error: null });
        try {
          await productService.deleteProduct(productId);
          const currentProducts = get().products;
          const filteredProducts = currentProducts.filter(product => product.id !== productId);
          set({ products: filteredProducts, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to delete product' });
          throw error;
        }
      },
      
      // Search products
      searchProducts: async (restaurantId, searchTerm) => {
        set({ loading: true, error: null, searchQuery: searchTerm });
        try {
          // Filter products locally for now, can be enhanced with API endpoint
          const products = await productService.getProducts(restaurantId);
          const filtered = products.filter(p => 
            (p.name_ar && p.name_ar.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.name_en && p.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          set({ products: filtered, loading: false });
          return filtered;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to search products' });
          return [];
        }
      },
      
      // Filter products by category
      filterByCategory: async (restaurantId, categoryId) => {
        set({ loading: true, error: null, selectedCategory: categoryId });
        try {
          const products = await productService.getProducts(restaurantId, categoryId);
          set({ products, loading: false });
          return products;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to filter products' });
          return [];
        }
      },
      
      // Apply filters
      applyFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
      },
      
      // Clear filters
      clearFilters: () => {
        set({ 
          filters: {
            priceRange: [0, 1000],
            isAvailable: true,
            isVegetarian: null
          },
          searchQuery: '',
          selectedCategory: 'all'
        });
      },
      
      // Set current product
      setCurrentProduct: (product) => {
        set({ currentProduct: product });
      },
      
      // Clear current product
      clearCurrentProduct: () => {
        set({ currentProduct: null });
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Reset store
      reset: () => set({ 
        products: [], 
        currentProduct: null,
        loading: false, 
        error: null,
        searchQuery: '',
        selectedCategory: 'all',
        filters: {
          priceRange: [0, 1000],
          isAvailable: true,
          isVegetarian: null
        }
      })
    }),
    {
      name: 'products-storage',
      partialize: (state) => ({ 
        products: state.products,
        currentProduct: state.currentProduct,
        searchQuery: state.searchQuery,
        selectedCategory: state.selectedCategory,
        filters: state.filters
      })
    }
  )
);

export default useProductsStore;
