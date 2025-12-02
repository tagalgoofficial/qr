import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { formatPrice } from '../../utils/currencies';
import { getImageUrl } from '../../utils/imageUtils';
import 'react-lazy-load-image-component/src/effects/blur.css';

const ProductCard = ({ 
  product, 
  categoryName, 
  theme, 
  currency, 
  language,
  onAddToCart,
  onViewDetails,
  cartItem,
  onUpdateQuantity,
  index 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get localized name and description
  const productName = product.name_ar || product.nameAr || product.name || '';
  const productNameEn = product.name_en || product.nameEn || '';
  const productDescription = product.description_ar || product.descriptionAr || product.description || '';
  const productDescriptionEn = product.description_en || product.descriptionEn || '';
  
  const displayName = language === 'en' && productNameEn ? productNameEn : productName;
  const displayDescription = language === 'en' && productDescriptionEn ? productDescriptionEn : productDescription;
  
  // Get availability status
  const isAvailable = product.is_available !== undefined ? product.is_available : (product.isAvailable !== undefined ? product.isAvailable : true);
  
  // Get image URL and normalize it
  const productImage = getImageUrl(product.image_url || product.imageUrl || product.image || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(product)}
    >
      {/* Image Container - Modern Design */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {productImage && !imageError ? (
          <LazyLoadImage
            src={productImage}
            alt={displayName}
            effect="blur"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            threshold={100}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Price Badge - Modern Design with Discount Support */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg border border-white/50"
        >
          {(() => {
            // Check for discount prices in all possible field name formats
            const originalPrice = product.original_price || product.originalPrice;
            const discountedPrice = product.discounted_price || product.discountedPrice;
            
            // Debug: Log all products to check discount fields
            if (product.id) {
              console.log('🔍 ProductCard - Product Data:', {
                id: product.id,
                name: product.name_ar || product.nameAr || product.name,
                price: product.price,
                original_price: product.original_price,
                originalPrice: product.originalPrice,
                discounted_price: product.discounted_price,
                discountedPrice: product.discountedPrice,
                hasOriginal: !!originalPrice,
                hasDiscounted: !!discountedPrice
              });
            }
            
            // Check if both prices exist and are valid numbers (greater than 0)
            const hasDiscount = originalPrice && 
                               discountedPrice && 
                               originalPrice !== '' && 
                               discountedPrice !== '' &&
                               !isNaN(parseFloat(originalPrice)) && 
                               !isNaN(parseFloat(discountedPrice)) &&
                               parseFloat(originalPrice) > 0 &&
                               parseFloat(discountedPrice) > 0 &&
                               parseFloat(originalPrice) > parseFloat(discountedPrice);
            
            if (hasDiscount) {
              console.log('✅ Showing discount for product:', product.id, {
                original: originalPrice,
                discounted: discountedPrice
              });
              return (
                <div className="flex flex-col items-end gap-1">
                  <span 
                    className="text-xs sm:text-sm line-through opacity-60"
                    style={{ color: theme?.textSecondary || '#6b7280' }}
                  >
                    {formatPrice(parseFloat(originalPrice), currency, language)}
                  </span>
                  <span 
                    className="text-base sm:text-lg font-black"
                    style={{ color: theme?.primary || '#ff2d2d' }}
                  >
                    {formatPrice(parseFloat(discountedPrice), currency, language)}
                  </span>
                </div>
              );
            } else {
              return (
          <span 
            className="text-base sm:text-lg font-black"
            style={{ color: theme?.primary || '#ff2d2d' }}
          >
            {formatPrice(product.price, currency, language)}
          </span>
              );
            }
          })()}
        </motion.div>
        
        {/* Availability Badge - Modern */}
        {!isAvailable && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-red-500/95 backdrop-blur-md text-white rounded-xl sm:rounded-2xl px-3 py-1.5 text-xs sm:text-sm font-bold shadow-lg">
            غير متوفر
          </div>
        )}
      </div>
      
      {/* Content - Modern Design */}
      <div className="p-4 sm:p-5 md:p-6">
        {/* Category Badge - Top */}
        <span 
          className="inline-block px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold mb-2"
          style={{
            backgroundColor: theme?.primary ? `${theme.primary}15` : 'rgba(255, 45, 45, 0.15)',
            color: theme?.primary || '#ff2d2d',
          }}
        >
          {categoryName || 'غير محدد'}
        </span>
        
        <h3 
          className="text-base sm:text-lg md:text-xl font-black mb-2 line-clamp-1 transition-colors"
          style={{ color: theme?.text || '#1a1a1a' }}
        >
          {displayName}
        </h3>
        
        {displayDescription && (
          <p 
            className="text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed"
            style={{ color: theme?.textSecondary || '#6b7280' }}
          >
            {displayDescription}
          </p>
        )}
        
        {/* Action Section */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
          
          {/* Add to Cart Button */}
          {cartItem ? (
            <div 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  // Use cartItemKey if available, otherwise use product.id
                  const itemKey = cartItem.cartItemKey || cartItem.id;
                  onUpdateQuantity(itemKey, cartItem.quantity - 1);
                }}
                className="w-9 h-9 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </motion.button>
              <span className="w-10 text-center font-bold text-lg">{cartItem.quantity}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  // Use cartItemKey if available, otherwise use product.id
                  const itemKey = cartItem.cartItemKey || cartItem.id;
                  onUpdateQuantity(itemKey, cartItem.quantity + 1);
                }}
                disabled={!isAvailable}
                className="w-9 h-9 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                // Check if product has options (sizes, weights, or extras)
                // Handle both camelCase and snake_case field names
                const sizes = product.sizes || [];
                const weights = product.weights || [];
                const extras = product.extras || [];
                
                const hasOptions = (Array.isArray(sizes) && sizes.length > 0 && sizes.some(s => s && s.name && s.name.trim() !== '')) ||
                                  (Array.isArray(weights) && weights.length > 0 && weights.some(w => w && w.name && w.name.trim() !== '')) ||
                                  (Array.isArray(extras) && extras.length > 0 && extras.some(e => e && e.name && e.name.trim() !== ''));
                
                // If product has options, open modal instead of adding directly
                if (hasOptions) {
                  onViewDetails(product);
                } else {
                  // If no options, add directly to cart
                  onAddToCart(product);
                }
              }}
              disabled={!isAvailable}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-md hover:shadow-lg disabled:cursor-not-allowed relative overflow-hidden group/btn"
              style={isAvailable ? {
                background: theme?.primary 
                  ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})` 
                  : 'linear-gradient(135deg, #ff2d2d, #cc0000)',
                color: '#ffffff',
              } : {
                backgroundColor: '#d1d5db',
                color: '#6b7280',
              }}
            >
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                {isAvailable && (
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                {isAvailable 
                  ? (language === 'en' ? 'Add to Cart' : 'أضف للسلة')
                  : (language === 'en' ? 'Out of Stock' : 'غير متوفر')
                }
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

