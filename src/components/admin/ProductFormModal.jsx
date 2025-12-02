import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import storageService from '../../services/storageService';
import authService from '../../services/authService';

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product = null,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: '',
    originalPrice: '',
    discountedPrice: '',
    image: '',
    categoryId: '',
    isActive: true,
    isAvailable: true,
    sizes: [],
    weights: [],
    extras: []
  });

  // Ensure all form values are always defined (not undefined) to avoid uncontrolled input warnings
  const safeFormData = {
    name: formData.name || '',
    nameEn: formData.nameEn || '',
    description: formData.description || '',
    descriptionEn: formData.descriptionEn || '',
    price: formData.price || '',
    originalPrice: formData.originalPrice || '',
    discountedPrice: formData.discountedPrice || '',
    image: formData.image || '',
    categoryId: formData.categoryId || '',
    isActive: formData.isActive !== undefined ? formData.isActive : true,
    isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
    sizes: formData.sizes || [],
    weights: formData.weights || [],
    extras: formData.extras || []
  };

  const [activeSection, setActiveSection] = useState('basic');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    return currentUser?.restaurantId;
  };

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      const imageUrl = product.image_url || product.imageUrl || product.image || '';
      setFormData({
        name: product.name_ar || product.nameAr || product.name || '',
        nameEn: product.name_en || product.nameEn || '',
        description: product.description_ar || product.descriptionAr || product.description || '',
        descriptionEn: product.description_en || product.descriptionEn || '',
        price: product.price || '',
        originalPrice: product.original_price || product.originalPrice || '',
        discountedPrice: product.discounted_price || product.discountedPrice || '',
        image: imageUrl,
        categoryId: product.category_id || product.categoryId || '',
        isActive: product.is_active !== undefined ? product.is_active : (product.isActive !== undefined ? product.isActive : true),
        isAvailable: product.is_available !== undefined ? product.is_available : (product.isAvailable !== undefined ? product.isAvailable : true),
        sizes: product.sizes || [],
        weights: product.weights || [],
        extras: product.extras || []
      });
      setImagePreview(imageUrl);
    } else {
      setFormData({
        name: '',
        nameEn: '',
        description: '',
        descriptionEn: '',
        price: '',
        originalPrice: '',
        discountedPrice: '',
        image: '',
        categoryId: '',
        isActive: true,
        isAvailable: true,
        sizes: [],
        weights: [],
        extras: []
      });
      setImagePreview(null);
    }
    setActiveSection('basic');
  }, [product, isOpen]);

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار ملف صورة صحيح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    handleImageUpload(file);
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const restaurantId = getRestaurantId();
      
      if (!restaurantId) {
        throw new Error('معرف المطعم غير موجود');
      }

      // Upload image using storageService
      const uploadResult = await storageService.uploadMenuItemImage(restaurantId, 'temp', file);
      
      if (uploadResult && uploadResult.url) {
        setFormData(prev => ({
          ...prev,
          image: uploadResult.url
        }));
      } else {
        throw new Error('لم يتم الحصول على رابط الصورة من الخادم');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure all values are defined before submitting
    const submitData = {
      name: safeFormData.name,
      nameEn: safeFormData.nameEn,
      description: safeFormData.description,
      descriptionEn: safeFormData.descriptionEn,
      price: safeFormData.price,
      originalPrice: safeFormData.originalPrice || null,
      discountedPrice: safeFormData.discountedPrice || null,
      image: safeFormData.image,
      categoryId: safeFormData.categoryId,
      isActive: safeFormData.isActive,
      isAvailable: safeFormData.isAvailable,
      sizes: safeFormData.sizes,
      weights: safeFormData.weights,
      extras: safeFormData.extras
    };
    onSubmit(submitData);
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...(safeFormData.sizes || []), { name: '', price: '' }]
    });
  };

  const removeSize = (index) => {
    setFormData({
      ...formData,
      sizes: (safeFormData.sizes || []).filter((_, i) => i !== index)
    });
  };

  const updateSize = (index, field, value) => {
    const newSizes = [...(safeFormData.sizes || [])];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData({ ...formData, sizes: newSizes });
  };

  const addWeight = () => {
    setFormData({
      ...formData,
      weights: [...(safeFormData.weights || []), { name: '', price: '' }]
    });
  };

  const removeWeight = (index) => {
    setFormData({
      ...formData,
      weights: (safeFormData.weights || []).filter((_, i) => i !== index)
    });
  };

  const updateWeight = (index, field, value) => {
    const newWeights = [...(safeFormData.weights || [])];
    newWeights[index] = { ...newWeights[index], [field]: value };
    setFormData({ ...formData, weights: newWeights });
  };

  const addExtra = () => {
    setFormData({
      ...formData,
      extras: [...(safeFormData.extras || []), { name: '', price: '' }]
    });
  };

  const removeExtra = (index) => {
    setFormData({
      ...formData,
      extras: (safeFormData.extras || []).filter((_, i) => i !== index)
    });
  };

  const updateExtra = (index, field, value) => {
    const newExtras = [...(safeFormData.extras || [])];
    newExtras[index] = { ...newExtras[index], [field]: value };
    setFormData({ ...formData, extras: newExtras });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                </h2>
                <p className="text-white/90 text-sm">
                  {product ? 'قم بتحديث معلومات المنتج' : 'أضف منتج جديد مع خيارات متقدمة'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-50 border-b border-gray-200 px-6">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { id: 'basic', label: 'المعلومات الأساسية', icon: '📝' },
                { id: 'sizes', label: 'الأحجام', icon: '📏' },
                { id: 'weights', label: 'الأوزان', icon: '⚖️' },
                { id: 'extras', label: 'الإضافات', icon: '➕' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeSection === tab.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              {activeSection === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  {/* Product Names */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-2xl border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🌐</span>
                      اسم المنتج
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          الاسم بالعربية <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            🇸🇦
                          </div>
                          <input
                            type="text"
                            value={safeFormData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="مثال: برجر لحم"
                            required
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          الاسم بالإنجليزية
                        </label>
                        <div className="relative">
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            🇬🇧
                          </div>
                          <input
                            type="text"
                            value={safeFormData.nameEn}
                            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                            className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Example: Beef Burger"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📝</span>
                      وصف المنتج
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          الوصف بالعربية
                        </label>
                        <textarea
                          value={safeFormData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                          rows={4}
                          placeholder="وصف المنتج بالعربية..."
                          dir="rtl"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          الوصف بالإنجليزية
                        </label>
                        <textarea
                          value={safeFormData.descriptionEn}
                          onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                          rows={4}
                          placeholder="Product description in English..."
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        السعر الأساسي <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={safeFormData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">السعر النهائي الذي سيظهر للعميل</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        الفئة <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={safeFormData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        required
                      >
                        <option value="">اختر الفئة</option>
                        {categories && categories.length > 0 ? (
                          categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name_ar || category.nameAr || category.name || 'بدون اسم'}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>لا توجد فئات متاحة</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Discount Fields */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🎁</span>
                      خيارات الخصم
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          السعر قبل الخصم
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={safeFormData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">السعر الأصلي (سيظهر مشطوباً)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          السعر بعد الخصم
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={safeFormData.discountedPrice}
                          onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">السعر بعد الخصم (سيظهر بخط عريض)</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800">
                        💡 <strong>ملاحظة:</strong> إذا قمت بإدخال السعر قبل وبعد الخصم، سيتم عرضهما في صفحة المنيو. 
                        السعر الأساسي أعلاه سيستخدم كسعر افتراضي إذا لم يتم إدخال خصم.
                      </p>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-5 rounded-2xl border-2 border-pink-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🖼️</span>
                      صورة المنتج
                    </h3>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-4">
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image: '' }));
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
                          uploadingImage
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg'
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {imagePreview ? 'تغيير الصورة' : 'رفع صورة'}
                          </>
                        )}
                      </label>
                      
                      <p className="text-xs text-gray-500 text-center mt-2">
                        الصور المدعومة: JPG, PNG, GIF, WebP (حد أقصى 5 ميجابايت)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={safeFormData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm font-medium text-gray-700">منتج نشط</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={safeFormData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm font-medium text-gray-700">متوفر</span>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Sizes Section */}
              {activeSection === 'sizes' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">أحجام المنتج</h3>
                      <p className="text-sm text-gray-600 mt-1">أضف أحجام مختلفة للمنتج مع أسعار مختلفة</p>
                    </div>
                    <button
                      type="button"
                      onClick={addSize}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      إضافة حجم
                    </button>
                  </div>

                  {(safeFormData.sizes || []).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📏</span>
                      </div>
                      <p className="text-gray-600 mb-4">لا توجد أحجام مضافة</p>
                      <button
                        type="button"
                        onClick={addSize}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        إضافة أول حجم
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(safeFormData.sizes || []).map((size, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                اسم الحجم
                              </label>
                              <input
                                type="text"
                                value={size.name}
                                onChange={(e) => updateSize(index, 'name', e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="مثال: صغير، متوسط، كبير"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                السعر الإضافي
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={size.price}
                                  onChange={(e) => updateSize(index, 'price', e.target.value)}
                                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  placeholder="0.00"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSize(index)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Weights Section */}
              {activeSection === 'weights' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">أوزان المنتج</h3>
                      <p className="text-sm text-gray-600 mt-1">أضف أوزان مختلفة للمنتج مع أسعار مختلفة</p>
                    </div>
                    <button
                      type="button"
                      onClick={addWeight}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      إضافة وزن
                    </button>
                  </div>

                  {(safeFormData.weights || []).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚖️</span>
                      </div>
                      <p className="text-gray-600 mb-4">لا توجد أوزان مضافة</p>
                      <button
                        type="button"
                        onClick={addWeight}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        إضافة أول وزن
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(safeFormData.weights || []).map((weight, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                اسم الوزن
                              </label>
                              <input
                                type="text"
                                value={weight.name}
                                onChange={(e) => updateWeight(index, 'name', e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                placeholder="مثال: 250 جرام، 500 جرام"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                السعر الإضافي
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={weight.price}
                                  onChange={(e) => updateWeight(index, 'price', e.target.value)}
                                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                  placeholder="0.00"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeWeight(index)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Extras Section */}
              {activeSection === 'extras' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">إضافات المنتج</h3>
                      <p className="text-sm text-gray-600 mt-1">أضف إضافات اختيارية للمنتج مع أسعار</p>
                    </div>
                    <button
                      type="button"
                      onClick={addExtra}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      إضافة إضافة
                    </button>
                  </div>

                  {(safeFormData.extras || []).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">➕</span>
                      </div>
                      <p className="text-gray-600 mb-4">لا توجد إضافات مضافة</p>
                      <button
                        type="button"
                        onClick={addExtra}
                        className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                      >
                        إضافة أول إضافة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(safeFormData.extras || []).map((extra, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                اسم الإضافة
                              </label>
                              <input
                                type="text"
                                value={extra.name}
                                onChange={(e) => updateExtra(index, 'name', e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="مثال: جبن إضافي، صلصة خاصة"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                السعر
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={extra.price}
                                  onChange={(e) => updateExtra(index, 'price', e.target.value)}
                                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  placeholder="0.00"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExtra(index)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
              >
                {product ? 'تحديث المنتج' : 'إضافة المنتج'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductFormModal;

