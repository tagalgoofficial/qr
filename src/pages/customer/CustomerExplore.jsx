import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../../contexts/authStore';
import superAdminRestaurantService from '../../services/superAdminRestaurantService';
import { getImageUrl } from '../../utils/imageUtils';

const CustomerExplore = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: t('customer.explore.allCategories') },
    { id: 'fastfood', name: t('customer.explore.categories.fastfood') },
    { id: 'cafe', name: t('customer.explore.categories.cafe') },
    { id: 'finedining', name: t('customer.explore.categories.finedining') },
    { id: 'ethnic', name: t('customer.explore.categories.ethnic') },
  ];
  
  const fetchRestaurants = async (isInitial = false) => {
    try {
      setLoading(true);
      
      // TODO: Implement API endpoint for listing restaurants with pagination
      const restaurantsData = await superAdminRestaurantService.getAllRestaurants();
      
      // Filter by category if needed
      let filteredData = restaurantsData;
      if (selectedCategory !== 'all') {
        // Note: Category filtering would need to be implemented in API
        filteredData = restaurantsData.filter(r => r.category === selectedCategory);
        }
      
      // Filter active restaurants
      filteredData = filteredData.filter(r => r.is_active !== false);
      
      // Simple pagination (would need proper API pagination)
      const pageSize = 8;
      const startIndex = isInitial ? 0 : restaurants.length;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      if (isInitial) {
        setRestaurants(paginatedData);
      } else {
        setRestaurants(prev => [...prev, ...paginatedData]);
      }
      
      setHasMore(endIndex < filteredData.length);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRestaurants(true);
  }, [selectedCategory]);
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchRestaurants();
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setLastVisible(null);
    setHasMore(true);
  };
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };
  
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (restaurant.description && restaurant.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('customer.explore.title')}
          </h1>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/customer/dashboard" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('customer.explore.dashboard')}
            </Link>
            
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
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="w-full md:w-1/3">
              <label htmlFor="search" className="sr-only">{t('customer.explore.search')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('customer.explore.searchPlaceholder')}
                />
              </div>
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === category.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Restaurant List */}
        {loading && restaurants.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRestaurants.map(restaurant => (
              <Link 
                key={restaurant.id} 
                to={`/menu/${restaurant.slug || restaurant.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="h-40 bg-gray-200 relative">
                  {restaurant.background ? (
                    <img 
                      src={getImageUrl(restaurant.background)} 
                      alt={restaurant.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-4 transform translate-y-1/2 h-16 w-16 rounded-full overflow-hidden border-4 border-white bg-white">
                    <img 
                      src={restaurant.logo ? getImageUrl(restaurant.logo) : '/Logo-MR-QR.svg'} 
                      alt={`${restaurant.name} logo`} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // If restaurant logo fails, show fallback logo
                        if (e.target.src !== '/Logo-MR-QR.svg') {
                          e.target.src = '/Logo-MR-QR.svg';
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="p-4 pt-10">
                  <h3 className="font-medium text-lg">{restaurant.name}</h3>
                  
                  {restaurant.category && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t(`customer.explore.categories.${restaurant.category}`) || restaurant.category}
                    </p>
                  )}
                  
                  {restaurant.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {t('customer.explore.noResults')}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {t('customer.explore.tryDifferent')}
            </p>
          </div>
        )}
        
        {/* Load More */}
        {hasMore && filteredRestaurants.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('customer.explore.loading')}
                </>
              ) : t('customer.explore.loadMore')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerExplore;