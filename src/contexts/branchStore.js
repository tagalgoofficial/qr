import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useBranchStore = create(
  persist(
    (set, get) => ({
      // Current selected branch
      selectedBranch: null,
      
      // Branch data
      branches: [],
      loading: false,
      error: null,
      
      // Set selected branch
      setSelectedBranch: (branch) => {
        set({ selectedBranch: branch });
        // Clear any cached data when switching branches
        set({ 
          categories: [],
          products: [],
          orders: []
        });
      },
      
      // Set branches list
      setBranches: (branches) => set({ branches }),
      
      // Get current branch ID
      getCurrentBranchId: () => {
        const { selectedBranch } = get();
        return selectedBranch?.id || null;
      },
      
      // Check if we're in main restaurant mode
      isMainRestaurant: () => {
        const { selectedBranch } = get();
        return !selectedBranch;
      },
      
      // Get branch display name
      getBranchDisplayName: () => {
        const { selectedBranch } = get();
        return selectedBranch?.name || 'المطعم الرئيسي';
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Reset store
      reset: () => set({
        selectedBranch: null,
        branches: [],
        loading: false,
        error: null
      })
    }),
    {
      name: 'branch-storage',
      partialize: (state) => ({ 
        selectedBranch: state.selectedBranch,
        branches: state.branches
      })
    }
  )
);

export default useBranchStore;
