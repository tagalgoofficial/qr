import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isSuperAdmin: false, // إضافة حالة Super Admin
      loading: false, // تغيير القيمة الافتراضية إلى false
      error: null,
      isOnline: navigator.onLine, // إضافة حالة الاتصال بالإنترنت
      
      // Initialize auth state
      initAuth: async () => {
        // فحص الاتصال بالإنترنت أولاً
        if (!navigator.onLine) {
          set({ loading: false, error: 'No internet connection' });
          return () => {}; // إرجاع دالة فارغة
        }

        set({ loading: true, error: null });
        
        try {
          // Check if token exists before verifying
          const token = localStorage.getItem('auth_token');
          if (!token) {
            // No token, user is not logged in
            set({ user: null, role: null, isSuperAdmin: false, loading: false, error: null });
            return () => {};
          }

          // Verify token and get user data
          const user = await authService.verifyToken();
          if (user) {
            const isSuperAdmin = user.role === 'super_admin';
            set({ 
              user: {
                id: user.id,
                uid: user.id,
                email: user.email,
                restaurantId: user.restaurantId || null
              }, 
              role: user.role, 
              isSuperAdmin, 
              loading: false, 
              error: null 
            });
          } else {
            set({ user: null, role: null, isSuperAdmin: false, loading: false, error: null });
          }
        } catch (error) {
          // 401 or "No token found" is expected when there's no token or token is invalid
          // Don't log it as an error, just clear the auth state
          if (error.status !== 401 && error.message !== 'No token found') {
            console.error('Error verifying token:', error);
          }
          set({ user: null, role: null, isSuperAdmin: false, loading: false, error: null });
        }
        
        // Return unsubscribe function (no-op for API)
        return () => {};
      },
      
      // Login
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const result = await authService.login(email, password);
          const user = result.user;
          const role = user.role;
          const isSuperAdmin = role === 'super_admin';
          
          set({ 
            user: {
              id: user.id,
              uid: user.id,
              email: user.email,
              restaurantId: user.restaurantId || null
            }, 
            role, 
            isSuperAdmin, 
            loading: false, 
            error: null 
          });
          return true;
        } catch (error) {
          console.error('Login error:', error);
          let errorMessage = 'فشل في تسجيل الدخول';
          
          if (error.status === 401) {
            errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
          } else if (error.status === 403) {
            errorMessage = 'تم تعطيل الحساب';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          set({ loading: false, error: errorMessage });
          return false;
        }
      },
      
      // Register
      register: async (email, password, restaurantName, ownerName, phone) => {
        set({ loading: true, error: null });
        try {
          const result = await authService.register(email, password, restaurantName, ownerName, phone);
          const user = result.user;
          const role = user.role;
          
          set({ 
            user: {
              id: user.id,
              uid: user.id,
              email: user.email,
              restaurantId: user.restaurantId || result.restaurant?.id || null
            }, 
            role, 
            isSuperAdmin: role === 'super_admin',
            loading: false, 
            error: null 
          });
          return true;
        } catch (error) {
          console.error('Registration error:', error);
          let errorMessage = 'فشل في التسجيل';
          
          if (error.status === 409) {
            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
          } else if (error.status === 400 && error.data?.errors) {
            errorMessage = Object.values(error.data.errors).join(', ');
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          set({ loading: false, error: errorMessage });
          return false;
        }
      },
      
      // Logout
      logout: async () => {
        set({ loading: true, error: null });
        try {
          await authService.logout();
          set({ user: null, role: null, isSuperAdmin: false, loading: false, error: null });
          return true;
        } catch (error) {
          console.error('Logout error:', error);
          // Clear local state even if API call fails
          set({ user: null, role: null, isSuperAdmin: false, loading: false, error: null });
          return true;
        }
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Set user manually (for Super Admin)
      setUser: (user) => set({ user }),
      
      // Set role manually (for Super Admin)
      setRole: (role) => set({ role }),
      
      // Set both user and role together (for Super Admin)
      setUserAndRole: (user, role) => set({ user, role, isSuperAdmin: role === 'super_admin' }),

      // Set online status
      setOnlineStatus: (isOnline) => set({ isOnline })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, role: state.role, isSuperAdmin: state.isSuperAdmin })
    }
  )
);

export default useAuthStore;