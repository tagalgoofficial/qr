import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../contexts/authStore';
import { getCurrencyOptions } from '../../utils/currencies';
import restaurantService from '../../services/restaurantService';
import themeService from '../../services/themeService';
import storageService from '../../services/storageService';
import { slugify } from '../../utils/slugify';
import authService from '../../services/authService';

// Apply theme to CSS variables
const applyTheme = (theme) => {
  const root = document.documentElement;
  
  // Apply all theme colors as CSS variables
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply additional CSS variables for buttons and cart
  if (theme.buttonBg) {
    root.style.setProperty('--color-button-bg', theme.buttonBg);
  }
  if (theme.buttonText) {
    root.style.setProperty('--color-button-text', theme.buttonText);
  }
  if (theme.cartBg) {
    root.style.setProperty('--color-cart-bg', theme.cartBg);
  }
  if (theme.cartText) {
    root.style.setProperty('--color-cart-text', theme.cartText);
  }
  
  // Apply primary as button background if not specified
  if (!theme.buttonBg && theme.primary) {
    root.style.setProperty('--color-button-bg', theme.primary);
  }
  // Apply text as cart text if not specified
  if (!theme.cartText && theme.text) {
    root.style.setProperty('--color-cart-text', theme.text);
  }
};

const AdminSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    currency: 'EGP',
    language: 'ar',
    logo: '',
    coverImage: '',
    slug: '',
    mainRestaurantNameAr: '',
    mainRestaurantNameEn: ''
  });
  const [currentSlug, setCurrentSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  
  // Refs for file inputs
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  // Theme colors state
  const [themeColors, setThemeColors] = useState({
    primary: '#ff2d2d',
    secondary: '#000000',
    accent: '#ff2d2d',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    buttonBg: '#ff2d2d',
    buttonText: '#ffffff',
    cartBg: '#ffffff',
    cartText: '#1a1a1a'
  });

  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    // Prioritize restaurantId from JWT token, then from user object
    // Never use uid as it's user ID not restaurant ID
    return currentUser?.restaurantId || user?.restaurantId;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const restaurantId = getRestaurantId();
        if (!restaurantId) {
          setError('معرف المطعم غير موجود');
          setLoading(false);
          return;
        }
        
        const [restaurantData, settingsData, themeData] = await Promise.all([
          restaurantService.getRestaurant(restaurantId),
          restaurantService.getRestaurantSettings(restaurantId),
          themeService.getRestaurantTheme(restaurantId)
        ]);
        
        // Stats would need a separate API endpoint
        const statsData = null;
        
        const restaurantSlug = restaurantData?.slug || '';
        setCurrentSlug(restaurantSlug);
        
        const logoUrl = settingsData?.logo || restaurantData?.logo_url || '';
        const coverUrl = settingsData?.coverImage || restaurantData?.background_url || '';
        
        setFormData({
          name: settingsData?.name || restaurantData?.restaurant_name || restaurantData?.restaurantName || '',
          email: settingsData?.email || restaurantData?.email || '',
          phone: settingsData?.phone || restaurantData?.phone || '',
          address: settingsData?.address || restaurantData?.address || '',
          description: settingsData?.description || restaurantData?.description || '',
          currency: settingsData?.currency || 'EGP',
          language: settingsData?.language || settingsData?.defaultLanguage || 'ar',
          logo: logoUrl,
          coverImage: coverUrl,
          slug: restaurantSlug || restaurantData?.slug || '',
          mainRestaurantNameAr: settingsData?.mainRestaurantNameAr || restaurantData?.main_restaurant_name_ar || 'المطعم الرئيسي',
          mainRestaurantNameEn: settingsData?.mainRestaurantNameEn || restaurantData?.main_restaurant_name_en || 'Main Restaurant'
        });
        
        // Set preview images from loaded data
        if (logoUrl) {
          setLogoPreview(logoUrl);
        }
        if (coverUrl) {
          setCoverPreview(coverUrl);
        }
        
        // Set theme colors
        if (themeData) {
          setThemeColors({
            primary: themeData.primary || '#ff2d2d',
            secondary: themeData.secondary || '#000000',
            accent: themeData.accent || '#ff2d2d',
            background: themeData.background || '#ffffff',
            surface: themeData.surface || '#fafafa',
            text: themeData.text || '#1a1a1a',
            textSecondary: themeData.textSecondary || '#6b7280',
            border: themeData.border || '#e5e7eb',
            buttonBg: themeData.buttonBg || themeData.primary || '#ff2d2d',
            buttonText: themeData.buttonText || '#ffffff',
            cartBg: themeData.cartBg || themeData.background || '#ffffff',
            cartText: themeData.cartText || themeData.text || '#1a1a1a'
          });
        }
        
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle slug input - automatically slugify
    if (name === 'slug') {
      const normalizedSlug = slugify(value);
      setFormData(prev => ({ ...prev, [name]: normalizedSlug }));
      setSlugError('');
      
      // Check slug availability if changed
      if (normalizedSlug && normalizedSlug !== currentSlug) {
        checkSlugAvailability(normalizedSlug);
      }
    } else if (name === 'name') {
      // When restaurant name changes, suggest slug if slug is empty
      setFormData(prev => {
        const newFormData = { ...prev, [name]: value };
        if (!prev.slug || prev.slug === currentSlug) {
          // Only auto-suggest slug if slug is empty or unchanged
          const suggestedSlug = slugify(value);
          if (suggestedSlug) {
            newFormData.slug = suggestedSlug;
            // Check availability of suggested slug
            setTimeout(() => {
              if (suggestedSlug !== currentSlug) {
                checkSlugAvailability(suggestedSlug);
              }
            }, 500);
          }
        }
        return newFormData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelect = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('الملف المحدد ليس صورة. يرجى اختيار ملف صورة');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      if (fieldName === 'logo') {
        setLogoPreview(reader.result);
      } else {
        setCoverPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    
    // Upload the image - pass file directly instead of event
    handleImageUpload(file, fieldName);
  };

  const handleImageUpload = async (file, fieldName) => {
    if (!file) {
      setError('لم يتم اختيار ملف');
      return;
    }
    
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }
    
    try {
      // Set uploading state
      if (fieldName === 'logo') {
        setUploadingLogo(true);
      } else {
        setUploadingCover(true);
      }
      
      setError(null);
      
      const restaurantId = getRestaurantId();
      
      if (!restaurantId) {
        throw new Error('معرف المطعم غير موجود');
      }
      
      // Upload image based on field type
      let uploadResult;
      if (fieldName === 'logo') {
        uploadResult = await storageService.uploadRestaurantLogo(restaurantId, file);
      } else {
        uploadResult = await storageService.uploadRestaurantBackground(restaurantId, file);
      }
      
      // Update form data with uploaded image URL
      if (uploadResult && uploadResult.url) {
        const imageUrl = uploadResult.url;
        
        setFormData(prev => ({
          ...prev,
          [fieldName]: imageUrl
        }));
        
        // Update preview with actual URL
        if (fieldName === 'logo') {
          setLogoPreview(imageUrl);
        } else {
          setCoverPreview(imageUrl);
        }
        
        // Save image URL to database immediately
        const imageField = fieldName === 'logo' ? 'logo_url' : 'background_url';
        await restaurantService.updateRestaurant(restaurantId, {
          [imageField]: imageUrl
        });
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error('Invalid upload result:', uploadResult);
        throw new Error('لم يتم الحصول على رابط الصورة من الخادم');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      const errorMessage = err.message || err.data?.message || 'حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى';
      setError(errorMessage);
      
      // Clear preview on error
      if (fieldName === 'logo') {
        setLogoPreview(null);
      } else {
        setCoverPreview(null);
      }
    } finally {
      if (fieldName === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const checkSlugAvailability = async (slug) => {
    if (!slug || slug === currentSlug) {
      setSlugError('');
      return;
    }
    
    setSlugChecking(true);
    setSlugError('');
    
    try {
      // Check if slug is available by trying to get restaurant with this slug
      try {
        const restaurantId = getRestaurantId();
        const existing = await restaurantService.getRestaurant(null, slug);
        if (existing && existing.id !== restaurantId && existing.restaurant_id !== restaurantId) {
        setSlugError('هذا الـ URL مستخدم بالفعل. يرجى اختيار رابط آخر');
        } else {
          setSlugError('');
        }
      } catch (err) {
        // If restaurant not found (404), slug is available
        if (err.status === 404 || err.response?.status === 404) {
          setSlugError('');
        } else {
          console.error('Error checking slug availability:', err);
          setSlugError('حدث خطأ أثناء التحقق من توفر الـ URL');
        }
      }
    } catch (err) {
      console.error('Error checking slug availability:', err);
      setSlugError('حدث خطأ أثناء التحقق من توفر الـ URL');
    } finally {
      setSlugChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      setSlugError('');
      
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setError('معرف المطعم غير موجود');
        setSaving(false);
        return;
      }
      
      // Update slug if changed
      if (formData.slug && formData.slug !== currentSlug) {
        try {
          await restaurantService.updateRestaurantSlug(restaurantId, formData.slug);
          setCurrentSlug(formData.slug);
        } catch (slugErr) {
          setSlugError(slugErr.message || 'حدث خطأ أثناء تحديث الـ URL');
          setSaving(false);
          return;
        }
      }
      
      // Update other settings
      const { slug, ...settingsData } = formData;
      
      // Prepare settings object with all fields
      const updateData = {
        restaurantName: settingsData.name, // API expects restaurantName, not name
        email: settingsData.email, // Will be handled separately in users table
        phone: settingsData.phone,
        address: settingsData.address,
        description: settingsData.description,
        logo_url: settingsData.logo, // API expects logo_url, not logo
        background_url: settingsData.coverImage // API expects background_url, not coverImage
      };
      
      // Remove empty fields, but don't send image fields if they're empty
      // This prevents overwriting existing images in database with empty values
      // The backend will preserve existing images if image fields are not sent
      Object.keys(updateData).forEach(key => {
        // For image fields, remove if empty to preserve existing images in database
        if (key === 'logo_url' || key === 'background_url') {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
          }
        } else {
          // For other fields, remove if empty
          if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
            delete updateData[key];
          }
        }
      });
      
      // Update restaurant data (name, email, phone, address, description, logo, coverImage)
      // Email will be updated in users table by the API
      if (Object.keys(updateData).length > 0) {
        await restaurantService.updateRestaurant(restaurantId, updateData);
      }
      
      // Update currency and language in restaurant_settings
      const settingsUpdate = {
        currency: settingsData.currency,
        defaultLanguage: settingsData.language,
        mainRestaurantNameAr: formData.mainRestaurantNameAr || null,
        mainRestaurantNameEn: formData.mainRestaurantNameEn || null
      };
      
      // Remove empty settings (but keep null values for mainRestaurantName fields)
      Object.keys(settingsUpdate).forEach(key => {
        if (key !== 'mainRestaurantNameAr' && key !== 'mainRestaurantNameEn') {
        if (settingsUpdate[key] === '' || settingsUpdate[key] === null || settingsUpdate[key] === undefined) {
          delete settingsUpdate[key];
          }
        }
      });
      
      if (Object.keys(settingsUpdate).length > 0) {
        await restaurantService.updateRestaurantSettings(restaurantId, settingsUpdate);
      }
      
      // Update theme colors
      if (themeColors && Object.keys(themeColors).length > 0) {
        await themeService.updateRestaurantTheme(restaurantId, themeColors);
      }
      
      // Apply theme to CSS
      const root = document.documentElement;
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
      
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            خطأ في تحميل الإعدادات
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            إعادة المحاولة
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('admin.settings')}
              </h1>
              <p className="mt-2 text-gray-600">
                إدارة إعدادات مطعمك وتفضيلاتك
              </p>
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-sm text-gray-500">إجمالي المنتجات</div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800">تم حفظ الإعدادات بنجاح!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group md:col-span-2">
                  <label className="form-label flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>اسم المطعم في صفحة المنيو</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">مهم</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field text-lg font-semibold"
                    placeholder="مثال: مطعم الشام - المطعم الرئيسي"
                    required
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        هذا الاسم سيظهر للعملاء في صفحة المنيو في مكانين:
                        <br />
                        • في الهيدر الرئيسي (Hero Section) أعلى الصفحة
                        <br />
                        • في الفوتر (Footer) أسفل الصفحة
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="form-group md:col-span-2">
                  <label className="form-label flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>اسم "المطعم الرئيسي" في صفحة المنيو</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">اختياري</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">الاسم بالعربية</label>
                      <input
                        type="text"
                        name="mainRestaurantNameAr"
                        value={formData.mainRestaurantNameAr}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="المطعم الرئيسي"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">الاسم بالإنجليزية</label>
                      <input
                        type="text"
                        name="mainRestaurantNameEn"
                        value={formData.mainRestaurantNameEn}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Main Restaurant"
                      />
                    </div>
                  </div>
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm text-indigo-800 flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        هذا الاسم سيظهر في مؤشر الفرع (Branch Indicator) في صفحة المنيو عندما لا يكون هناك فرع محدد.
                        <br />
                        إذا تركت الحقل فارغاً، سيتم استخدام "المطعم الرئيسي" / "Main Restaurant" افتراضياً.
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="أدخل البريد الإلكتروني"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">العملة</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {getCurrencyOptions('ar').map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label} ({currency.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Menu URL Section */}
              <div className="form-group mt-6">
                <label className="form-label">
                  رابط المنيو (URL)
                  <span className="text-sm text-gray-500 mr-2">(يمكنك تخصيص رابط منيو مطعمك)</span>
                </label>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-r-none rounded-l-lg">
                        {window.location.origin}/menu/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className={`input-field rounded-l-none flex-1 ${slugError ? 'border-red-300' : ''}`}
                        placeholder="اسم-المطعم"
                      />
                    </div>
                    {slugChecking && (
                      <p className="text-sm text-blue-600 mt-1">جاري التحقق من توفر الـ URL...</p>
                    )}
                    {slugError && (
                      <p className="text-sm text-red-600 mt-1">{slugError}</p>
                    )}
                    {formData.slug && !slugError && !slugChecking && formData.slug !== currentSlug && (
                      <p className="text-sm text-green-600 mt-1">✓ الـ URL متاح</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      سيتم تحويل النص تلقائياً إلى رابط صالح (مثال: "مطعم الشام" → "مطعم-الشام")
                    </p>
                  </div>
                </div>
                {formData.slug && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 font-medium mb-1">رابط المنيو الحالي:</p>
                    <a 
                      href={`${window.location.origin}/menu/${formData.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {window.location.origin}/menu/{formData.slug}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">العنوان</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="أدخل عنوان المطعم"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">وصف المطعم</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="أدخل وصف مختصر عن المطعم"
                />
              </div>
            </div>

            {/* Language Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">إعدادات اللغة</h2>
              <div className="form-group">
                <label className="form-label">اللغة الافتراضية</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Color Customization Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">تخصيص ألوان صفحة المنيو</h2>
              <p className="text-sm text-gray-600 mb-6">قم بتخصيص ألوان صفحة المنيو لتتماشى مع هوية مطعمك</p>
              
              {/* Color Presets */}
              <div className="mb-6">
                <label className="form-label mb-3">قوالب الألوان الجاهزة</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[
                    { name: 'كلاسيكي أحمر', colors: { primary: '#ff2d2d', secondary: '#000000', accent: '#ff2d2d', background: '#ffffff', surface: '#fafafa' } },
                    { name: 'أزرق أنيق', colors: { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa', background: '#ffffff', surface: '#f0f9ff' } },
                    { name: 'أخضر طبيعي', colors: { primary: '#10b981', secondary: '#047857', accent: '#34d399', background: '#ffffff', surface: '#ecfdf5' } },
                    { name: 'بنفسجي راقي', colors: { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#a78bfa', background: '#ffffff', surface: '#faf5ff' } },
                    { name: 'برتقالي دافئ', colors: { primary: '#f97316', secondary: '#c2410c', accent: '#fb923c', background: '#ffffff', surface: '#fff7ed' } },
                    { name: 'وردي أنثوي', colors: { primary: '#ec4899', secondary: '#be185d', accent: '#f472b6', background: '#ffffff', surface: '#fdf2f8' } },
                    { name: 'ذهبي فاخر', colors: { primary: '#f59e0b', secondary: '#92400e', accent: '#fbbf24', background: '#ffffff', surface: '#fffbeb' } },
                    { name: 'رمادي عصري', colors: { primary: '#6b7280', secondary: '#374151', accent: '#9ca3af', background: '#ffffff', surface: '#f9fafb' } }
                  ].map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setThemeColors(prev => ({
                          ...prev,
                          ...preset.colors,
                          buttonBg: preset.colors.primary,
                          cartBg: preset.colors.background,
                          cartText: prev.cartText
                        }));
                        applyTheme({ ...themeColors, ...preset.colors, buttonBg: preset.colors.primary });
                      }}
                      className="p-3 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-all duration-200 text-right"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.primary }}></div>
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.secondary }}></div>
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.accent }}></div>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-gray-700">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="form-group">
                  <label className="form-label flex items-center justify-between mb-2">
                    <span>اللون الأساسي</span>
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{ backgroundColor: themeColors.primary }}></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.primary}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, primary: newColor, buttonBg: newColor }));
                        applyTheme({ ...themeColors, primary: newColor, buttonBg: newColor });
                      }}
                      className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeColors.primary}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, primary: newColor, buttonBg: newColor }));
                        applyTheme({ ...themeColors, primary: newColor, buttonBg: newColor });
                      }}
                      className="flex-1 input-field"
                      placeholder="#ff2d2d"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center justify-between mb-2">
                    <span>اللون الثانوي</span>
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{ backgroundColor: themeColors.secondary }}></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.secondary}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, secondary: newColor }));
                        applyTheme({ ...themeColors, secondary: newColor });
                      }}
                      className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeColors.secondary}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, secondary: newColor }));
                        applyTheme({ ...themeColors, secondary: newColor });
                      }}
                      className="flex-1 input-field"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center justify-between mb-2">
                    <span>لون التمييز</span>
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{ backgroundColor: themeColors.accent }}></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.accent}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, accent: newColor }));
                        applyTheme({ ...themeColors, accent: newColor });
                      }}
                      className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeColors.accent}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, accent: newColor }));
                        applyTheme({ ...themeColors, accent: newColor });
                      }}
                      className="flex-1 input-field"
                      placeholder="#ff2d2d"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center justify-between mb-2">
                    <span>لون الخلفية</span>
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{ backgroundColor: themeColors.background }}></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.background}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, background: newColor, cartBg: newColor }));
                        applyTheme({ ...themeColors, background: newColor, cartBg: newColor });
                      }}
                      className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeColors.background}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, background: newColor, cartBg: newColor }));
                        applyTheme({ ...themeColors, background: newColor, cartBg: newColor });
                      }}
                      className="flex-1 input-field"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center justify-between mb-2">
                    <span>لون السطح</span>
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{ backgroundColor: themeColors.surface }}></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.surface}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, surface: newColor }));
                        applyTheme({ ...themeColors, surface: newColor });
                      }}
                      className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeColors.surface}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, surface: newColor }));
                        applyTheme({ ...themeColors, surface: newColor });
                      }}
                      className="flex-1 input-field"
                      placeholder="#fafafa"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center justify-between mb-2">
                    <span>لون النص</span>
                    <div className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{ backgroundColor: themeColors.text }}></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.text}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, text: newColor, cartText: newColor }));
                        applyTheme({ ...themeColors, text: newColor, cartText: newColor });
                      }}
                      className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeColors.text}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setThemeColors(prev => ({ ...prev, text: newColor, cartText: newColor }));
                        applyTheme({ ...themeColors, text: newColor, cartText: newColor });
                      }}
                      className="flex-1 input-field"
                      placeholder="#1a1a1a"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="mt-6 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <h3 className="text-md font-semibold text-gray-900 mb-4">معاينة الألوان</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Button Preview */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">معاينة الأزرار</p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200"
                        style={{ 
                          backgroundColor: themeColors.buttonBg || themeColors.primary,
                          color: themeColors.buttonText || '#ffffff'
                        }}
                      >
                        زر أساسي
                      </button>
                      <button
                        type="button"
                        className="w-full py-2 px-4 rounded-lg font-medium border-2 transition-all duration-200"
                        style={{ 
                          borderColor: themeColors.primary,
                          color: themeColors.primary,
                          backgroundColor: 'transparent'
                        }}
                      >
                        زر ثانوي
                      </button>
                    </div>
                  </div>

                  {/* Card Preview */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">معاينة البطاقة</p>
                    <div 
                      className="p-4 rounded-lg shadow-md"
                      style={{ 
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                        borderWidth: '1px'
                      }}
                    >
                      <h4 className="font-semibold mb-2" style={{ color: themeColors.text }}>اسم المنتج</h4>
                      <p className="text-sm mb-2" style={{ color: themeColors.textSecondary }}>وصف المنتج</p>
                      <p className="font-bold" style={{ color: themeColors.primary }}>50 ج.م</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الصور والوسائط</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Section */}
                <div className="form-group">
                  <label className="form-label">الشعار</label>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, 'logo')}
                  />
                  
                  {/* Upload button and URL input */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="btn-secondary flex items-center justify-center gap-2 flex-1"
                      >
                        {uploadingLogo ? (
                          <>
                            <div className="loading-spinner w-4 h-4"></div>
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            رفع صورة
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500 text-center">أو</div>
                    
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="أدخل رابط الشعار"
                  />
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">معاينة الشعار:</p>
                    <div className="relative inline-block">
                      <img 
                        src={logoPreview || formData.logo || '/Logo-MR-QR.svg'} 
                        alt="الشعار" 
                        className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200 bg-white p-2"
                        onError={(e) => {
                          if (e.target.src !== '/Logo-MR-QR.svg') {
                            e.target.src = '/Logo-MR-QR.svg';
                          } else {
                            e.target.style.display = 'none';
                          }
                        }}
                      />
                      {(logoPreview || (formData.logo && formData.logo !== '/Logo-MR-QR.svg')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, logo: '' }));
                            setLogoPreview(null);
                            if (logoInputRef.current) {
                              logoInputRef.current.value = '';
                            }
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="حذف الصورة"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Cover Image Section */}
                <div className="form-group">
                  <label className="form-label">صورة الغلاف</label>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, 'coverImage')}
                  />
                  
                  {/* Upload button and URL input */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="btn-secondary flex items-center justify-center gap-2 flex-1"
                      >
                        {uploadingCover ? (
                          <>
                            <div className="loading-spinner w-4 h-4"></div>
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            رفع صورة
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500 text-center">أو</div>
                    
                  <input
                    type="url"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="أدخل رابط صورة الغلاف"
                  />
                  </div>
                  
                  {/* Preview */}
                  {(coverPreview || formData.coverImage) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">معاينة صورة الغلاف:</p>
                      <div className="relative inline-block w-full max-w-md">
                        <img 
                          src={coverPreview || formData.coverImage} 
                          alt="صورة الغلاف" 
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, coverImage: '' }));
                            setCoverPreview(null);
                            if (coverInputRef.current) {
                              coverInputRef.current.value = '';
                            }
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="حذف الصورة"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات المطعم</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
                    <div className="text-sm text-blue-800">إجمالي المنتجات</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.totalCategories}</div>
                    <div className="text-sm text-green-800">إجمالي الفئات</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
                    <div className="text-sm text-purple-800">إجمالي المشاهدات</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => window.location.reload()}
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    جاري الحفظ...
                  </div>
                ) : (
                  'حفظ الإعدادات'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;