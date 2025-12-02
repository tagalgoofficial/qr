import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import themeService from '../services/themeService';

// Default theme colors
const DEFAULT_THEME = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6'
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      loading: false,
      error: null,
      
      // Apply theme to CSS variables
      applyTheme: (theme) => {
        const root = document.documentElement;
        
        // Apply CSS variables
        Object.entries(theme).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
        
        // Apply Tailwind color overrides
        root.style.setProperty('--tw-color-primary', theme.primary);
        root.style.setProperty('--tw-color-secondary', theme.secondary);
        root.style.setProperty('--tw-color-accent', theme.accent);
        root.style.setProperty('--tw-color-success', theme.success);
        root.style.setProperty('--tw-color-warning', theme.warning);
        root.style.setProperty('--tw-color-error', theme.error);
        root.style.setProperty('--tw-color-info', theme.info);
        
        // Apply background gradients
        root.style.setProperty('--bg-gradient-primary', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`);
        root.style.setProperty('--bg-gradient-accent', `linear-gradient(135deg, ${theme.accent} 0%, ${theme.primary} 100%)`);
        
        // Apply text gradients
        root.style.setProperty('--text-gradient-primary', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`);
        
        // Apply shadow colors
        root.style.setProperty('--shadow-primary', `0 4px 15px ${theme.primary}20`);
        root.style.setProperty('--shadow-accent', `0 4px 15px ${theme.accent}20`);
        
        set({ theme });
      },
      
      // Initialize theme
      initTheme: async (restaurantId) => {
        if (!restaurantId) {
          get().applyTheme(DEFAULT_THEME);
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const themeData = await themeService.getRestaurantTheme(restaurantId);
          get().applyTheme(themeData);
        } catch (error) {
          console.error('Error loading theme:', error);
          set({ error: error.message });
          // Apply default theme on error
          get().applyTheme(DEFAULT_THEME);
        } finally {
          set({ loading: false });
        }
      },
      
      // Update theme
      updateTheme: async (restaurantId, newTheme) => {
        if (!restaurantId) return false;
        
        set({ loading: true, error: null });
        
        try {
          const success = await themeService.updateRestaurantTheme(restaurantId, newTheme);
          if (success) {
            get().applyTheme(newTheme);
            set({ theme: newTheme });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error updating theme:', error);
          set({ error: error.message });
          return false;
        } finally {
          set({ loading: false });
        }
      },
      
      // Update single color
      updateColor: (colorKey, value) => {
        const currentTheme = get().theme;
        const newTheme = {
          ...currentTheme,
          [colorKey]: value
        };
        get().applyTheme(newTheme);
        set({ theme: newTheme });
      },
      
      // Apply predefined theme
      applyPredefinedTheme: (predefinedTheme) => {
        const currentTheme = get().theme;
        const newTheme = {
          ...currentTheme,
          ...predefinedTheme.colors
        };
        get().applyTheme(newTheme);
        set({ theme: newTheme });
      },
      
      // Reset to default theme
      resetTheme: () => {
        get().applyTheme(DEFAULT_THEME);
        set({ theme: DEFAULT_THEME });
      },
      
      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme })
    }
  )
);

export default useThemeStore;
