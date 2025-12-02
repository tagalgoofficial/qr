import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import categoryService from '../services/categoryService';

const useCategoriesStore = create(
  persist(
    (set, get) => ({
      categories: [],
      loading: false,
      error: null,
      selectedCategory: null,
      
      // Fetch categories
      fetchCategories: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
          const categories = await categoryService.getCategories(restaurantId);
          set({ categories, loading: false });
          return categories;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to fetch categories' });
          return [];
        }
      },
      
      // Create category
      createCategory: async (restaurantId, categoryData) => {
        set({ loading: true, error: null });
        try {
          const newCategory = await categoryService.addCategory(restaurantId, categoryData);
          const currentCategories = get().categories;
          set({ 
            categories: [newCategory, ...currentCategories],
            loading: false 
          });
          return newCategory;
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to create category' });
          throw error;
        }
      },
      
      // Update category
      updateCategory: async (restaurantId, categoryId, updateData) => {
        set({ loading: true, error: null });
        try {
          await categoryService.updateCategory(categoryId, updateData);
          const currentCategories = get().categories;
          const updatedCategories = currentCategories.map(cat => 
            cat.id === categoryId ? { ...cat, ...updateData } : cat
          );
          set({ categories: updatedCategories, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to update category' });
          throw error;
        }
      },
      
      // Delete category
      deleteCategory: async (restaurantId, categoryId) => {
        set({ loading: true, error: null });
        try {
          await categoryService.deleteCategory(categoryId);
          const currentCategories = get().categories;
          const filteredCategories = currentCategories.filter(cat => cat.id !== categoryId);
          set({ categories: filteredCategories, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message || 'Failed to delete category' });
          throw error;
        }
      },
      
      // Set selected category
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Reset store
      reset: () => set({ 
        categories: [], 
        loading: false, 
        error: null, 
        selectedCategory: null 
      })
    }),
    {
      name: 'categories-storage',
      partialize: (state) => ({ 
        categories: state.categories,
        selectedCategory: state.selectedCategory
      })
    }
  )
);

export default useCategoriesStore;
