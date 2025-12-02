import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { formatPrice } from '../../utils/currencies';
import { getImageUrl } from '../../utils/imageUtils';
import 'react-lazy-load-image-component/src/effects/blur.css';

const ProductModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  cartItem,
  onUpdateQuantity,
  theme,
  currency,
  language,
  categoryName
}) => {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);

  useEffect(() => {
    if (cartItem && isOpen) {
      // Update state when cart item exists and modal is open
      setQuantity(cartItem.quantity || 1);
      setSelectedSize(cartItem.selectedSize || null);
      setSelectedWeight(cartItem.selectedWeight || null);
      setSelectedExtras(cartItem.selectedExtras || []);
    } else if (!cartItem && isOpen) {
      // Reset to defaults when modal opens without cart item
      setQuantity(1);
      setSelectedSize(null);
      setSelectedWeight(null);
      setSelectedExtras([]);
    }
  }, [cartItem, product, isOpen]);

  // Debug: Log product data to check if options are present
  useEffect(() => {
    if (product && isOpen) {
      const productName = product.name_ar || product.nameAr || product.name || 'Unknown';
      console.log('🔍 Product Modal - Product Data:', {
        id: product.id,
        name: productName,
        sizes: product.sizes,
        weights: product.weights,
        extras: product.extras,
        hasSizes: product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && product.sizes.some(s => s && s.name && s.name.trim() !== ''),
        hasWeights: product.weights && Array.isArray(product.weights) && product.weights.length > 0 && product.weights.some(w => w && w.name && w.name.trim() !== ''),
        hasExtras: product.extras && Array.isArray(product.extras) && product.extras.length > 0 && product.extras.some(e => e && e.name && e.name.trim() !== '')
      });
    }
  }, [product, isOpen]);

  if (!product) return null;

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

  // Calculate total price including options
  const calculateTotalPrice = () => {
    let total = parseFloat(product.price || 0);
    
    if (selectedSize && selectedSize.price) {
      total += parseFloat(selectedSize.price || 0);
    }
    
    if (selectedWeight && selectedWeight.price) {
      total += parseFloat(selectedWeight.price || 0);
    }
    
    selectedExtras.forEach(extra => {
      if (extra.price) {
        total += parseFloat(extra.price || 0);
      }
    });
    
    return total * quantity;
  };

  const handleExtraToggle = (extra) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.name === extra.name);
      if (exists) {
        return prev.filter(e => e.name !== extra.name);
      } else {
        return [...prev, extra];
      }
    });
  };

  const handleAddToCart = () => {
    // Ensure all options are properly saved
    // Preserve cart item key if updating existing item from cart
    const existingCartItemKey = cartItem?.cartItemKey || undefined;
    
    const cartItemToAdd = {
      ...product,
      quantity,
      selectedSize: selectedSize || null,
      selectedWeight: selectedWeight || null,
      selectedExtras: selectedExtras || [],
      calculatedPrice: calculateTotalPrice() / quantity, // Price per unit
      // Preserve cart item key if updating existing item
      cartItemKey: existingCartItemKey
    };
    
    // Log for debugging
    console.log('💾 Saving cart item with options:', {
      id: cartItemToAdd.id,
      name: cartItemToAdd.name,
      quantity: cartItemToAdd.quantity,
      selectedSize: cartItemToAdd.selectedSize,
      selectedWeight: cartItemToAdd.selectedWeight,
      selectedExtras: cartItemToAdd.selectedExtras,
      calculatedPrice: cartItemToAdd.calculatedPrice,
      cartItemKey: cartItemToAdd.cartItemKey
    });
    
    onAddToCart(cartItemToAdd, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              style={{ backgroundColor: theme?.background || '#ffffff' }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl border border-gray-100"
                aria-label="إغلاق"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Section - Responsive */}
              <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 overflow-hidden">
                {productImage && !imageError ? (
                  <LazyLoadImage
                    src={productImage}
                    alt={displayName}
                    effect="blur"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Price Badge - Responsive */}
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-2 sm:px-6 sm:py-3 shadow-xl border border-white/50">
                  <span 
                    className="text-lg sm:text-xl md:text-2xl font-bold"
                    style={{ color: theme?.primary || '#ff2d2d' }}
                  >
                    {formatPrice(product.price, currency, language)}
                  </span>
                </div>
              </div>

              {/* Content Section - Scrollable & Responsive */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-6" style={{ maxHeight: 'calc(95vh - 12rem)' }}>
                {/* Category Badge - Responsive */}
                <div className="mb-3 sm:mb-4">
                  <span 
                    className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold"
                    style={{
                      backgroundColor: theme?.primary ? `${theme.primary}15` : 'rgba(255, 45, 45, 0.15)',
                      color: theme?.primary || '#ff2d2d',
                    }}
                  >
                    {categoryName || 'غير محدد'}
                  </span>
                </div>

                {/* Product Name - Responsive */}
                <h2 
                  className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 leading-tight"
                  style={{ color: theme?.text || '#1a1a1a' }}
                >
                  {displayName}
                </h2>

                {/* Description - Responsive */}
                {displayDescription && (
                  <p 
                    className="text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 text-gray-600"
                    style={{ color: theme?.textSecondary || '#6b7280' }}
                  >
                    {displayDescription}
                  </p>
                )}

                {/* Availability Status - Responsive */}
                {!isAvailable && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl">
                    <p className="text-sm sm:text-base text-red-600 font-semibold">⚠️ هذا المنتج غير متوفر حالياً</p>
                  </div>
                )}

                {/* Sizes Selection - Responsive */}
                {product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && product.sizes.some(size => size && size.name && size.name.trim() !== '') && (
                  <div className="mb-4 sm:mb-6">
                    <label 
                      className="block text-sm sm:text-base font-bold mb-2 sm:mb-3"
                      style={{ color: theme?.text || '#1a1a1a' }}
                    >
                      اختر الحجم 📏
                    </label>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {product.sizes.filter(size => size && size.name && size.name.trim() !== '').map((size, index) => (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 border-2 ${
                            selectedSize?.name === size.name
                              ? 'shadow-lg shadow-black/10'
                              : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                          }`}
                          style={
                            selectedSize?.name === size.name
                              ? {
                                  backgroundColor: theme?.primary || '#ff2d2d',
                                  color: '#ffffff',
                                  borderColor: theme?.primary || '#ff2d2d',
                                }
                              : {
                                  color: theme?.text || '#1a1a1a',
                                  borderColor: '#e5e7eb',
                                }
                          }
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span>{size.name}</span>
                            {size.price && parseFloat(size.price) > 0 && (
                              <span className="text-xs opacity-90 whitespace-nowrap">
                                +{formatPrice(size.price, currency, language)}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weights Selection - Responsive */}
                {product.weights && Array.isArray(product.weights) && product.weights.length > 0 && product.weights.some(weight => weight && weight.name && weight.name.trim() !== '') && (
                  <div className="mb-4 sm:mb-6">
                    <label 
                      className="block text-sm sm:text-base font-bold mb-2 sm:mb-3"
                      style={{ color: theme?.text || '#1a1a1a' }}
                    >
                      اختر الوزن ⚖️
                    </label>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {product.weights.filter(weight => weight && weight.name && weight.name.trim() !== '').map((weight, index) => (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedWeight(weight)}
                          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 border-2 ${
                            selectedWeight?.name === weight.name
                              ? 'shadow-lg shadow-black/10'
                              : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                          }`}
                          style={
                            selectedWeight?.name === weight.name
                              ? {
                                  backgroundColor: theme?.primary || '#ff2d2d',
                                  color: '#ffffff',
                                  borderColor: theme?.primary || '#ff2d2d',
                                }
                              : {
                                  color: theme?.text || '#1a1a1a',
                                  borderColor: '#e5e7eb',
                                }
                          }
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span>{weight.name}</span>
                            {weight.price && parseFloat(weight.price) > 0 && (
                              <span className="text-xs opacity-90 whitespace-nowrap">
                                +{formatPrice(weight.price, currency, language)}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extras Selection - Responsive */}
                {product.extras && Array.isArray(product.extras) && product.extras.length > 0 && product.extras.some(extra => extra && extra.name && extra.name.trim() !== '') && (
                  <div className="mb-4 sm:mb-6">
                    <label 
                      className="block text-sm sm:text-base font-bold mb-2 sm:mb-3"
                      style={{ color: theme?.text || '#1a1a1a' }}
                    >
                      الإضافات ➕
                    </label>
                    <div className="space-y-2 sm:space-y-2.5">
                      {product.extras.filter(extra => extra && extra.name && extra.name.trim() !== '').map((extra, index) => {
                        const isSelected = selectedExtras.some(e => e.name === extra.name);
                        return (
                          <motion.button
                            key={index}
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => handleExtraToggle(extra)}
                            className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 border-2 flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'shadow-md shadow-black/5'
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: theme?.primary ? `${theme.primary}15` : 'rgba(255, 45, 45, 0.15)',
                                    color: theme?.primary || '#ff2d2d',
                                    borderColor: theme?.primary || '#ff2d2d',
                                  }
                                : {
                                    color: theme?.text || '#1a1a1a',
                                    borderColor: '#e5e7eb',
                                  }
                            }
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-current' : ''
                                }`}
                                style={
                                  isSelected
                                    ? { borderColor: theme?.primary || '#ff2d2d' }
                                    : { borderColor: '#9ca3af' }
                                }
                              >
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span>{extra.name}</span>
                            </div>
                            {extra.price && parseFloat(extra.price) > 0 && (
                              <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                                +{formatPrice(extra.price, currency, language)}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Selector - Responsive */}
                <div className="mb-4 sm:mb-6">
                  <label 
                    className="block text-sm sm:text-base font-bold mb-2 sm:mb-3"
                    style={{ color: theme?.text || '#1a1a1a' }}
                  >
                    الكمية 🔢
                  </label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 font-bold shadow-md"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </motion.button>
                    <span 
                      className="text-xl sm:text-2xl md:text-3xl font-bold w-12 sm:w-16 text-center"
                      style={{ color: theme?.text || '#1a1a1a' }}
                    >
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 font-bold shadow-md"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Total Price - Responsive */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: theme?.textSecondary || '#6b7280' }}
                      >
                        السعر الأساسي:
                      </span>
                      <span 
                        className="text-base font-semibold"
                        style={{ color: theme?.text || '#1a1a1a' }}
                      >
                        {formatPrice(product.price, currency, language)}
                      </span>
                    </div>
                    {selectedSize && selectedSize.price && parseFloat(selectedSize.price) > 0 && (
                      <div className="flex justify-between items-center gap-2">
                        <span 
                          className="text-xs sm:text-sm font-medium truncate"
                          style={{ color: theme?.textSecondary || '#6b7280' }}
                        >
                          الحجم ({selectedSize.name}):
                        </span>
                        <span 
                          className="text-sm sm:text-base font-semibold whitespace-nowrap"
                          style={{ color: theme?.text || '#1a1a1a' }}
                        >
                          +{formatPrice(selectedSize.price, currency, language)}
                        </span>
                      </div>
                    )}
                    {selectedWeight && selectedWeight.price && parseFloat(selectedWeight.price) > 0 && (
                      <div className="flex justify-between items-center gap-2">
                        <span 
                          className="text-xs sm:text-sm font-medium truncate"
                          style={{ color: theme?.textSecondary || '#6b7280' }}
                        >
                          الوزن ({selectedWeight.name}):
                        </span>
                        <span 
                          className="text-sm sm:text-base font-semibold whitespace-nowrap"
                          style={{ color: theme?.text || '#1a1a1a' }}
                        >
                          +{formatPrice(selectedWeight.price, currency, language)}
                        </span>
                      </div>
                    )}
                    {selectedExtras.length > 0 && selectedExtras.map((extra, index) => (
                      extra.price && parseFloat(extra.price) > 0 && (
                        <div key={index} className="flex justify-between items-center gap-2">
                          <span 
                            className="text-xs sm:text-sm font-medium truncate"
                            style={{ color: theme?.textSecondary || '#6b7280' }}
                          >
                            {extra.name}:
                          </span>
                          <span 
                            className="text-sm sm:text-base font-semibold whitespace-nowrap"
                            style={{ color: theme?.text || '#1a1a1a' }}
                          >
                            +{formatPrice(extra.price, currency, language)}
                          </span>
                        </div>
                      )
                    ))}
                    <div className="border-t border-gray-300 pt-2 sm:pt-3 mt-2 sm:mt-3">
                      <div className="flex justify-between items-center gap-2">
                        <span 
                          className="text-sm sm:text-base md:text-lg font-bold"
                          style={{ color: theme?.text || '#1a1a1a' }}
                        >
                          المجموع ({quantity} {quantity === 1 ? 'قطعة' : 'قطع'}):
                        </span>
                        <span 
                          className="text-xl sm:text-2xl md:text-3xl font-bold"
                          style={{ color: theme?.primary || '#ff2d2d' }}
                        >
                          {formatPrice(calculateTotalPrice(), currency, language)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Responsive */}
              <div className="p-4 sm:p-6 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50/80 sticky bottom-0">
                {/* Check if product has options */}
                {(() => {
                  const hasOptions = (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && product.sizes.some(s => s && s.name && s.name.trim() !== '')) ||
                                    (product.weights && Array.isArray(product.weights) && product.weights.length > 0 && product.weights.some(w => w && w.name && w.name.trim() !== '')) ||
                                    (product.extras && Array.isArray(product.extras) && product.extras.length > 0 && product.extras.some(e => e && e.name && e.name.trim() !== ''));
                  
                  // Always show save button if product has options OR if it's in cart
                  if (cartItem || hasOptions) {
                    return (
                      <div className="space-y-3 sm:space-y-4">
                        {/* Header - Responsive */}
                        {cartItem ? (
                          <div className="text-center mb-2">
                            <p className="text-xs sm:text-sm font-bold" style={{ color: theme?.textSecondary || '#6b7280' }}>
                              ✏️ تعديل خيارات المنتج
                            </p>
                          </div>
                        ) : (
                          <div className="text-center mb-2">
                            <p className="text-xs sm:text-sm font-bold" style={{ color: theme?.textSecondary || '#6b7280' }}>
                              📝 اختر الخيارات المفضلة
                            </p>
                          </div>
                        )}
                    
                        {/* Quantity Controls - Only show if in cart - Responsive */}
                        {cartItem && (
                          <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => {
                                // Get cart item key for update
                                const getCartItemKeyForUpdate = (item) => {
                                  const sizeKey = item.selectedSize?.name || '';
                                  const weightKey = item.selectedWeight?.name || '';
                                  const extrasKey = item.selectedExtras?.map(e => e.name).sort().join(',') || '';
                                  return `${item.id}-${sizeKey}-${weightKey}-${extrasKey}`;
                                };
                                const itemKey = cartItem.cartItemKey || getCartItemKeyForUpdate(cartItem);
                                onUpdateQuantity(itemKey, cartItem.quantity - 1);
                              }}
                              className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-all duration-200 shadow-lg shadow-red-500/30"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                              </svg>
                            </motion.button>
                            <span className="text-lg sm:text-xl md:text-2xl font-bold w-12 sm:w-16 text-center">{cartItem.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => {
                                // Get cart item key for update
                                const getCartItemKeyForUpdate = (item) => {
                                  const sizeKey = item.selectedSize?.name || '';
                                  const weightKey = item.selectedWeight?.name || '';
                                  const extrasKey = item.selectedExtras?.map(e => e.name).sort().join(',') || '';
                                  return `${item.id}-${sizeKey}-${weightKey}-${extrasKey}`;
                                };
                                const itemKey = cartItem.cartItemKey || getCartItemKeyForUpdate(cartItem);
                                onUpdateQuantity(itemKey, cartItem.quantity + 1);
                              }}
                              disabled={!isAvailable}
                              className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 text-white rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-green-600 active:bg-green-700 transition-all duration-200 shadow-lg shadow-green-500/30 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </motion.button>
                          </div>
                        )}
                        
                        {/* Save Button - Responsive & Modern */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            // Validate selections before saving
                            console.log('💾 Saving cart item with current selections:', {
                              quantity,
                              selectedSize,
                              selectedWeight,
                              selectedExtras
                            });
                            // Update cart with new selections
                            handleAddToCart();
                          }}
                          disabled={!isAvailable}
                          className="w-full px-4 py-4 sm:px-6 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg text-white transition-all duration-300 shadow-xl shadow-black/10 flex items-center justify-center gap-2 sm:gap-3 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none relative overflow-hidden group"
                          style={isAvailable ? {
                            background: theme?.primary 
                              ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})` 
                              : 'linear-gradient(135deg, #ff2d2d, #cc0000)',
                          } : {}}
                        >
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          {/* Icon */}
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          
                          {/* Text - Responsive */}
                          <span className="relative z-10 text-sm sm:text-base md:text-lg">
                            {cartItem ? 'حفظ التعديلات والخيارات' : 'حفظ الخيارات وإضافة للسلة'}
                          </span>
                        </motion.button>
                        
                        {/* Info text - Responsive */}
                        <p className="text-[10px] sm:text-xs text-center leading-relaxed px-2" style={{ color: theme?.textSecondary || '#9ca3af' }}>
                          {cartItem 
                            ? 'سيتم حفظ جميع الخيارات المختارة (الأحجام، الأوزان، الإضافات) وتحديث السعر في السلة'
                            : 'سيتم حفظ جميع الخيارات المختارة (الأحجام، الأوزان، الإضافات) وإضافة المنتج للسلة'
                          }
                        </p>
                      </div>
                    );
                  } else {
                    // Product has no options - simple add to cart - Responsive
                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={handleAddToCart}
                        disabled={!isAvailable}
                        className="w-full px-4 py-4 sm:px-6 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg text-white transition-all duration-300 shadow-xl shadow-black/10 flex items-center justify-center gap-2 sm:gap-3 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none relative overflow-hidden group"
                        style={isAvailable ? {
                          background: theme?.primary 
                            ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})` 
                            : 'linear-gradient(135deg, #ff2d2d, #cc0000)',
                        } : {}}
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        {isAvailable ? (
                          <>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="relative z-10 text-sm sm:text-base md:text-lg">
                              {quantity > 0 ? `أضف ${quantity} للسلة` : 'أضف للسلة'}
                            </span>
                          </>
                        ) : (
                          <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">غير متوفر</span>
                        )}
                      </motion.button>
                    );
                  }
                })()}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;

