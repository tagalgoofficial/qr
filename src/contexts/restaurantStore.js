import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import restaurantService from '../services/restaurantService';
import productService from '../services/productService';

const useRestaurantStore = create(
  persist(
    (set, get) => ({
      menuItems: [],
      settings: null,
      loading: false,
      error: null,
      selectedCategory: 'all',
      searchQuery: '',
      
      // Fetch menu items
      fetchMenuItems: async (restaurantId, category = null) => {
        set({ loading: true, error: null });
        try {
          const items = await productService.getProducts(restaurantId, category === 'all' ? null : category);
          set({ menuItems: items, loading: false });
          return items;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to fetch menu items' });
          return [];
        }
      },
      
      // Fetch restaurant settings
      fetchSettings: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
          const settings = await restaurantService.getRestaurantSettings(restaurantId);
          set({ settings, loading: false });
          return settings;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to fetch settings' });
          return null;
        }
      },
      
      // Update restaurant settings
      updateSettings: async (restaurantId, newSettings) => {
        set({ loading: true, error: null });
        try {
          await restaurantService.updateRestaurantSettings(restaurantId, newSettings);
          set({ settings: newSettings, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to update settings' });
          return { success: false, error: error.message };
        }
      },
      
      // Set selected category
      setCategory: (category) => set({ selectedCategory: category }),
      
      // Set search query
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Get filtered menu items
      getFilteredMenuItems: () => {
        const { menuItems, selectedCategory, searchQuery } = get();
        
        return menuItems.filter(item => {
          // Filter by category if not 'all'
          const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
          
          // Filter by search query
          const searchMatch = searchQuery === '' || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
          
          return categoryMatch && searchMatch;
        });
      },
      
      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'restaurant-storage',
      partialize: (state) => ({ settings: state.settings })
    }
  )
);

export default useRestaurantStore;