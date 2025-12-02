import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import './i18n/i18n'
import LoadingPage from './components/LoadingPage'

// Customer Pages
import CustomerMenu from './pages/customer/CustomerMenu'
import CustomerLogin from './pages/customer/CustomerLogin'
import CustomerRegister from './pages/customer/CustomerRegister'
import CustomerForgotPassword from './pages/customer/CustomerForgotPassword'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerExplore from './pages/customer/CustomerExplore'

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminRegister from './pages/admin/AdminRegister'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMenuItems from './pages/admin/AdminMenuItems'
import AdminBranches from './pages/admin/AdminBranches'
import AdminOrders from './pages/admin/AdminOrders'
import AdminThemes from './pages/admin/AdminThemes'
import AdminSettings from './pages/admin/AdminSettings'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminSubscription from './pages/admin/AdminSubscription'
import AdminRevenue from './pages/admin/AdminRevenue'

// Super Admin Pages
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin'
import SuperAdminRegister from './pages/superadmin/SuperAdminRegister'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SuperAdminRestaurants from './pages/superadmin/SuperAdminRestaurants'
import SuperAdminSubscriptions from './pages/superadmin/SuperAdminSubscriptions'
import SuperAdminAnalytics from './pages/superadmin/SuperAdminAnalytics'
import SuperAdminSettings from './pages/superadmin/SuperAdminSettings'
import SuperAdminPaymentMethods from './pages/superadmin/SuperAdminPaymentMethods'
import SuperAdminPayments from './pages/superadmin/SuperAdminPayments'

// Auth Store
import useAuthStore from './contexts/authStore'
import useThemeStore from './contexts/themeStore'

// Components
import ConnectionStatus from './components/ConnectionStatus'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, isSuperAdmin, loading, isOnline } = useAuthStore()
  
  // Don't show loading here - let the app handle it
  if (loading) {
    return null; // Return null while loading, App.jsx will show LoadingPage
  }
  
  // Additional check for super admin routes
  if (window.location.pathname.startsWith('/superadmin') && user && role === 'super_admin' && !isSuperAdmin) {
    console.log('Super admin user but isSuperAdmin is false, updating state');
    // Force update the state
    const { setUserAndRole } = useAuthStore.getState();
    setUserAndRole(user, 'super_admin');
  }
  
  if (!isOnline) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">لا يوجد اتصال بالإنترنت</h2>
          <p className="text-gray-600">يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى</p>
        </div>
      </div>
    )
  }
  
  if (!user || !allowedRoles.includes(role)) {
    console.log('ProtectedRoute: Access denied', { user: !!user, role, allowedRoles, isSuperAdmin });
    
    // Check if trying to access superadmin routes with wrong role
    if (window.location.pathname.startsWith('/superadmin')) {
      if (role === 'restaurant_owner') {
        console.log('Restaurant owner trying to access superadmin, redirecting to admin dashboard');
        return <Navigate to="/admin/dashboard" replace />
      } else if (role === 'customer') {
        console.log('Customer trying to access superadmin, redirecting to customer menu');
        return <Navigate to="/customer/menu" replace />
      } else if (role !== 'super_admin' || !isSuperAdmin) {
        console.log('User is not super admin, redirecting to /superadmin/login', { role, isSuperAdmin });
        return <Navigate to="/superadmin/login" replace />
      } else {
        console.log('Redirecting to /superadmin/login for superadmin route');
        return <Navigate to="/superadmin/login" replace />
      }
    }
    
    // Redirect based on user role or to appropriate login page
    if (role === 'super_admin') {
      console.log('Redirecting super_admin to /superadmin/login');
      return <Navigate to="/superadmin/login" replace />
    } else if (role === 'customer') {
      console.log('Redirecting customer to /customer/login');
      return <Navigate to="/customer/login" replace />
    } else if (role === 'restaurant_owner') {
      console.log('Redirecting restaurant_owner to /admin/login');
      return <Navigate to="/admin/login" replace />
    } else {
      console.log('Redirecting unknown role to /admin/login');
      return <Navigate to="/admin/login" replace />
    }
  }
  
  return children
}

function App() {
  const { initAuth, setOnlineStatus, user } = useAuthStore()
  const { initTheme } = useThemeStore()
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showApp, setShowApp] = useState(false)
  const [restaurantLogo, setRestaurantLogo] = useState('/Logo-MR-QR.svg')
  
  useEffect(() => {
    // إضافة مستمعين لحالة الاتصال بالإنترنت
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initialize auth (async function)
    let unsubscribe = () => {}; // Default no-op function
    initAuth().then((unsub) => {
      unsubscribe = unsub || (() => {});
    }).catch(() => {
      unsubscribe = () => {};
    });
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [initAuth, setOnlineStatus])
  
  useEffect(() => {
    // تحميل الثيم عند تسجيل الدخول
    if (user?.restaurantId || user?.id) {
      initTheme(user.restaurantId || user.id)
    }
  }, [user, initTheme])

  // Handle initial loading complete - show only once on app start
  const handleInitialLoadingComplete = () => {
    setIsInitialLoading(false)
    // Small delay before showing app for smooth transition
    setTimeout(() => {
      setShowApp(true)
    }, 100)
  }

  return (
    <>
      {isInitialLoading && (
        <LoadingPage 
          onComplete={handleInitialLoadingComplete}
          duration={2500}
          logo="/Logo-MR-QR.svg"
        />
      )}
      {showApp && (
        <Router>
          <ConnectionStatus />
          <Routes>
        {/* Customer Routes */}
        <Route path="/menu/:restaurantId" element={<CustomerMenu />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        <Route path="/customer/forgot-password" element={<CustomerForgotPassword />} />
        <Route path="/customer/dashboard" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer/explore" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerExplore />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/menu-items" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminMenuItems />
          </ProtectedRoute>
        } />
        <Route path="/admin/branches" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminBranches />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/themes" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminThemes />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/subscription" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminSubscription />
          </ProtectedRoute>
        } />
        <Route path="/admin/revenue" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <AdminRevenue />
          </ProtectedRoute>
        } />
        
        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route path="/superadmin/register" element={<SuperAdminRegister />} />
        <Route path="/superadmin/dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/restaurants" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminRestaurants />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/subscriptions" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminSubscriptions />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/analytics" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/settings" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminSettings />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/payment-methods" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminPaymentMethods />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/payments" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminPayments />
          </ProtectedRoute>
        } />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </Router>
      )}
    </>
  )
}

export default App
