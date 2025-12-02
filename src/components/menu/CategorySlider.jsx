import React from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { motion } from 'framer-motion';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

const CategorySlider = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  theme 
}) => {
  const { i18n } = useTranslation();
  
  // Debug: Log categories when they change
  React.useEffect(() => {
    console.log('📋 CategorySlider received categories:', {
      language: i18n.language,
      categories,
      selectedCategory,
      categoriesCount: categories.length
    });
  }, [categories, i18n.language, selectedCategory]);
  
  return (
    <div className="relative w-full">
      <Swiper
        key={`swiper-${i18n.language}-${categories.join('-')}`}
        modules={[FreeMode]}
        freeMode={{
          enabled: true,
          sticky: false,
          momentumBounce: false,
        }}
        slidesPerView="auto"
        spaceBetween={12}
        className="!pb-1 sm:!pb-2"
        style={{
          '--swiper-navigation-color': theme?.primary || '#ff2d2d',
        }}
      >
        {categories.map((category, index) => {
          // Use category name + language as key to force re-render on language change
          const categoryKey = `${category}-${i18n.language}-${index}`;
          const isSelected = selectedCategory === category;
          
          return (
            <SwiperSlide key={categoryKey} style={{ width: 'auto' }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectCategory(category)}
                className={`
                  relative px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm
                  whitespace-nowrap transition-all duration-300 shadow-sm
                  ${isSelected 
                    ? 'text-white shadow-lg' 
                    : 'bg-white border-2 hover:border-gray-300 hover:shadow-md'
                  }
                `}
                style={isSelected ? {
                  background: theme?.primary 
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})`
                    : 'linear-gradient(135deg, #ff2d2d, #cc0000)',
                  boxShadow: theme?.primary 
                    ? `0 4px 16px ${theme.primary}50, 0 0 0 2px ${theme.primary}20` 
                    : '0 4px 16px rgba(255, 45, 45, 0.5)',
                } : {
                  color: theme?.text || '#1a1a1a',
                  borderColor: theme?.border || '#e5e7eb',
                  backgroundColor: '#ffffff',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                {/* Active indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 w-1/2 h-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    }}
                    layoutId="activeIndicator"
                  />
                )}
                
                {/* Content */}
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  {category === 'all' ? (
                    <svg 
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  ) : (
                    <svg 
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  )}
                  <span>{category === 'all' ? (i18n.language === 'en' ? 'All' : 'الكل') : category}</span>
                </span>
              </motion.button>
            </SwiperSlide>
          );
        })}
      </Swiper>
      
      {/* Modern Gradient fade effects */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default CategorySlider;


