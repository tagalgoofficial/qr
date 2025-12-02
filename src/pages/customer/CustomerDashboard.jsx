import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../../contexts/authStore';
import { getImageUrl } from '../../utils/imageUtils';
// Customer dashboard data will be handled via API endpoints when available

const CustomerDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  
  const [recentVisits, setRecentVisits] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // TODO: Implement API endpoint for customer dashboard data
        const visitsData = [];
        
        setRecentVisits(visitsData);
        
        // TODO: Implement API endpoint for customer dashboard data
        const favoriteRestaurantsData = [];
        
        setFavoriteRestaurants(favoriteRestaurantsData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [user]);
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('customer.dashboard.title')}
          </h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </button>
            
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t('customer.dashboard.welcome', { name: user?.displayName || t('customer.dashboard.guest') })}
          </h2>
          <p className="text-gray-600">
            {t('customer.dashboard.welcomeMessage')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Favorite Restaurants */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">
              {t('customer.dashboard.favoriteRestaurants')}
            </h2>
            
            {favoriteRestaurants.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 divide-y">
                  {favoriteRestaurants.map(restaurant => (
                    <Link 
                      key={restaurant.id}
                      to={`/menu/${restaurant.slug || restaurant.id}`}
                      className="p-4 hover:bg-gray-50 flex items-center"
                    >
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                          <img 
                          src={restaurant.logo ? getImageUrl(restaurant.logo) : '/Logo-MR-QR.svg'} 
                            alt={restaurant.name} 
                            className="h-full w-full object-cover"
                          onError={(e) => {
                            // If restaurant logo fails, show fallback logo
                            if (e.target.src !== '/Logo-MR-QR.svg') {
                              e.target.src = '/Logo-MR-QR.svg';
                            } else {
                              // If fallback also fails, show default icon
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="h-full w-full flex items-center justify-center text-gray-400" style={{display: 'none'}}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                          </div>
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium">{restaurant.name}</h3>
                        <p className="text-xs text-gray-500">
                          {t('customer.dashboard.visitCount', { count: restaurant.visitCount })}
                        </p>
                      </div>
                      
                      <div className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                {t('customer.dashboard.noFavorites')}
              </div>
            )}
          </div>
          
          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {t('customer.dashboard.recentActivity')}
            </h2>
            
            {recentVisits.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 divide-y">
                  {recentVisits.map(visit => (
                    <div key={visit.id} className="p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                          {visit.restaurant.logo ? (
                            <img 
                              src={getImageUrl(visit.restaurant.logo)} 
                              alt={visit.restaurant.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-3">
                          <p className="text-sm font-medium">
                            {t('customer.dashboard.visitedRestaurant', { name: visit.restaurant.name })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(visit.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                {t('customer.dashboard.noActivity')}
              </div>
            )}
          </div>
        </div>
        
        {/* Explore Restaurants */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">
            {t('customer.dashboard.exploreRestaurants')}
          </h2>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 mb-4">
              {t('customer.dashboard.exploreMessage')}
            </p>
            <Link
              to="/customer/explore"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('customer.dashboard.exploreButton')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;