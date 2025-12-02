import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../contexts/authStore';
import useMenuStore from '../../contexts/menuStore';
import useBranchStore from '../../contexts/branchStore';
import useSubscriptionStore from '../../contexts/subscriptionStore';
import { formatPrice } from '../../utils/currencies';
import SubscriptionLimitChecker from '../../components/SubscriptionLimitChecker';
import ProductFormModal from '../../components/admin/ProductFormModal';
import authService from '../../services/authService';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { motion } from 'framer-motion';

const AdminMenuItems = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { selectedBranch, getCurrentBranchId } = useBranchStore();
  const { canAddItem, getRemainingSlots } = useSubscriptionStore();
  const {
    categories,
    products,
    categoriesLoading,
    productsLoading,
    categoriesError,
    productsError,
    fetchCategories,
    fetchProducts,
    addCategory,
    addProduct,
    updateCategory,
    updateProduct,
    deleteCategory,
    deleteProduct,
    clearCategoriesError,
    clearProductsError
  } = useMenuStore();

  const [activeTab, setActiveTab] = useState('categories');
  const [reorderingProducts, setReorderingProducts] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showCategoryProductsModal, setShowCategoryProductsModal] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState(null);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState(null); // 'import' or 'export'
  const [importing, setImporting] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    image: '',
    isActive: true
  });

  // Helper function to get restaurantId from JWT token
  const getRestaurantId = () => {
    const currentUser = authService.getCurrentUser();
    // Prioritize restaurantId from JWT token, then from user object
    // Never use uid as it's user ID not restaurant ID
    return currentUser?.restaurantId || user?.restaurantId;
  };

  const [productForm, setProductForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: '',
    image: '',
    categoryId: '',
    isActive: true,
    isAvailable: true,
    sizes: [],
    weights: [],
    extras: []
  });

  useEffect(() => {
    if (user) {
      const branchId = getCurrentBranchId();
      const restaurantId = getRestaurantId();
      if (restaurantId) {
        fetchCategories(restaurantId, branchId);
        fetchProducts(restaurantId, branchId);
      }
    }
  }, [user, selectedBranch, fetchCategories, fetchProducts, getCurrentBranchId]);

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        alert('معرف المطعم غير موجود');
        return;
      }
      
      const branchId = getCurrentBranchId();
      
      // Debug: Log branchId to verify it's being sent correctly
      console.log('📤 Creating category with branchId:', branchId);
      
      // Prepare category data with nameAr (required by API)
      const categoryData = {
        nameAr: categoryForm.name || categoryForm.name,
        nameEn: categoryForm.nameEn || '', // Always include nameEn, even if empty
        description: categoryForm.description || '',
        imageUrl: categoryForm.image || categoryForm.imageUrl || '',
        isActive: categoryForm.isActive !== false
      };
      
      // Debug: Log category data being sent
      console.log('📤 Sending category data:', categoryData);
      
      // If adding a new category (not editing), check subscription limit first
      if (!editingCategory) {
        const canAdd = await canAddItem(restaurantId, 'categories');
        if (!canAdd) {
          alert('تم الوصول للحد الأقصى من الفئات المسموح بها في خطتك. يرجى ترقية اشتراكك لإضافة المزيد من الفئات.');
          return;
        }
      }
      
      if (editingCategory) {
        await updateCategory(restaurantId, editingCategory.id, categoryData, branchId);
        setEditingCategory(null);
      } else {
        await addCategory(restaurantId, categoryData, branchId);
      }
      setCategoryForm({ name: '', nameEn: '', description: '', image: '', isActive: true });
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('حدث خطأ أثناء حفظ الفئة. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleProductSubmit = async (formData) => {
    try {
      const branchId = getCurrentBranchId();
      
      // Debug: Log branchId to verify it's being sent correctly
      console.log('📤 Creating product with branchId:', branchId);
      
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        alert('معرف المطعم غير موجود');
        return;
      }
      
      // If adding a new product (not editing), check subscription limit first
      if (!editingProduct) {
        const canAdd = await canAddItem(restaurantId, 'products');
        if (!canAdd) {
          alert('تم الوصول للحد الأقصى من المنتجات المسموح بها في خطتك. يرجى ترقية اشتراكك لإضافة المزيد من المنتجات.');
          return;
        }
      }
      
      // Prepare product data with correct field names for API
      const productData = {
        nameAr: formData.name || '',
        nameEn: formData.nameEn || '',
        descriptionAr: formData.description || '',
        descriptionEn: formData.descriptionEn || '',
        price: formData.price || '',
        originalPrice: (formData.originalPrice && formData.originalPrice.trim() !== '') ? formData.originalPrice : null,
        discountedPrice: (formData.discountedPrice && formData.discountedPrice.trim() !== '') ? formData.discountedPrice : null,
        categoryId: formData.categoryId || '',
        imageUrl: formData.image || formData.imageUrl || '',
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
        sizes: formData.sizes || [],
        weights: formData.weights || [],
        extras: formData.extras || []
      };
      
      if (editingProduct) {
        await updateProduct(restaurantId, editingProduct.id, productData, branchId);
        setEditingProduct(null);
      } else {
        await addProduct(restaurantId, productData, branchId);
      }
      setProductForm({ 
        name: '', 
        nameEn: '',
        description: '', 
        descriptionEn: '',
        price: '', 
        image: '', 
        categoryId: selectedCategoryId || '', 
        isActive: true, 
        isAvailable: true,
        sizes: [],
        weights: [],
        extras: []
      });
      setShowProductForm(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name_ar || category.nameAr || category.name || '',
      nameEn: category.name_en || category.nameEn || '',
      description: category.description || '',
      image: category.image_url || category.imageUrl || category.image || '',
      isActive: category.is_active !== undefined ? category.is_active : (category.isActive !== undefined ? category.isActive : true)
    });
    setShowCategoryForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name_ar || product.nameAr || product.name || '',
      nameEn: product.name_en || product.nameEn || '',
      description: product.description_ar || product.descriptionAr || product.description || '',
      descriptionEn: product.description_en || product.descriptionEn || '',
      price: product.price || '',
      originalPrice: product.original_price || product.originalPrice || '',
      discountedPrice: product.discounted_price || product.discountedPrice || '',
      image: product.image_url || product.imageUrl || product.image || '',
      categoryId: product.category_id || product.categoryId || '',
      isActive: product.is_active !== undefined ? product.is_active : (product.isActive !== undefined ? product.isActive : true),
      isAvailable: product.is_available !== undefined ? product.is_available : (product.isAvailable !== undefined ? product.isAvailable : true),
      sizes: product.sizes || [],
      weights: product.weights || [],
      extras: product.extras || []
    });
    setShowProductForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      try {
        const restaurantId = getRestaurantId();
        if (!restaurantId) {
          alert('معرف المطعم غير موجود');
          return;
        }
        const branchId = getCurrentBranchId();
        await deleteCategory(restaurantId, categoryId, branchId);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        const branchId = getCurrentBranchId();
        const restaurantId = getRestaurantId();
        if (restaurantId) {
          await deleteProduct(restaurantId, productId, branchId);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleViewCategoryProducts = (category) => {
    setSelectedCategoryForModal(category);
    setShowCategoryProductsModal(true);
  };

  // Reorder functions
  const moveProductUp = (index) => {
    if (index === 0) return;
    const newOrder = [...reorderingProducts];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setReorderingProducts(newOrder);
  };

  const moveProductDown = (index) => {
    if (index === reorderingProducts.length - 1) return;
    const newOrder = [...reorderingProducts];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setReorderingProducts(newOrder);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        alert('معرف المطعم غير موجود');
        return;
      }

      // Update order_index for each product
      const branchId = getCurrentBranchId();
      const promises = reorderingProducts.map((product, index) => {
        console.log('🔄 Updating product order:', {
          productId: product.id,
          productName: product.name_ar || product.nameAr || product.name,
          orderIndex: index
        });
        return updateProduct(restaurantId, product.id, { orderIndex: index }, branchId);
      });

      await Promise.all(promises);
      
      // Refresh products list
      await fetchProducts(restaurantId, branchId);
      
      // Update reorderingProducts with fresh data
      const sortedProducts = [...products].sort((a, b) => {
        const orderA = a.order_index || a.orderIndex || 0;
        const orderB = b.order_index || b.orderIndex || 0;
        return orderA - orderB;
      });
      setReorderingProducts(sortedProducts);
      
      alert('تم حفظ الترتيب بنجاح!');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('حدث خطأ أثناء حفظ الترتيب. يرجى المحاولة مرة أخرى.');
    } finally {
      setSavingOrder(false);
    }
  };

  const filteredProducts = selectedCategoryId 
    ? products.filter(product => (product.category_id || product.categoryId) === selectedCategoryId)
    : products;

  // Export functions
  const exportToJSON = (data, filename) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCategories = () => {
    const categoriesData = categories.map(cat => ({
      name_ar: cat.name_ar || cat.nameAr || cat.name || '',
      name_en: cat.name_en || cat.nameEn || '',
      description: cat.description || '',
      image_url: cat.image_url || cat.imageUrl || cat.image || '',
      is_active: cat.is_active !== undefined ? cat.is_active : (cat.isActive !== undefined ? cat.isActive : true),
      order_index: cat.order_index || cat.orderIndex || 0
    }));
    
    const filename = prompt('أدخل اسم الملف (بدون .json):', `categories_${new Date().toISOString().split('T')[0]}`);
    if (filename) {
      exportToJSON(categoriesData, `${filename}.json`);
      alert('تم تصدير الفئات بنجاح!');
    }
  };

  const handleExportProducts = () => {
    const productsData = products.map(prod => ({
      name_ar: prod.name_ar || prod.nameAr || prod.name || '',
      name_en: prod.name_en || prod.nameEn || '',
      description_ar: prod.description_ar || prod.descriptionAr || prod.description || '',
      description_en: prod.description_en || prod.descriptionEn || '',
      price: prod.price || 0,
      original_price: prod.original_price || prod.originalPrice || null,
      discounted_price: prod.discounted_price || prod.discountedPrice || null,
      image_url: prod.image_url || prod.imageUrl || prod.image || '',
      category_id: prod.category_id || prod.categoryId || null,
      is_active: prod.is_active !== undefined ? prod.is_active : (prod.isActive !== undefined ? prod.isActive : true),
      is_available: prod.is_available !== undefined ? prod.is_available : (prod.isAvailable !== undefined ? prod.isAvailable : true),
      order_index: prod.order_index || prod.orderIndex || 0,
      sizes: prod.sizes || [],
      weights: prod.weights || [],
      extras: prod.extras || []
    }));
    
    const filename = prompt('أدخل اسم الملف (بدون .json):', `products_${new Date().toISOString().split('T')[0]}`);
    if (filename) {
      exportToJSON(productsData, `${filename}.json`);
      alert('تم تصدير المنتجات بنجاح!');
    }
  };

  const handleExportAll = () => {
    const allData = {
      categories: categories.map(cat => ({
        name_ar: cat.name_ar || cat.nameAr || cat.name || '',
        name_en: cat.name_en || cat.nameEn || '',
        description: cat.description || '',
        image_url: cat.image_url || cat.imageUrl || cat.image || '',
        is_active: cat.is_active !== undefined ? cat.is_active : (cat.isActive !== undefined ? cat.isActive : true),
        order_index: cat.order_index || cat.orderIndex || 0
      })),
      products: products.map(prod => ({
        name_ar: prod.name_ar || prod.nameAr || prod.name || '',
        name_en: prod.name_en || prod.nameEn || '',
        description_ar: prod.description_ar || prod.descriptionAr || prod.description || '',
        description_en: prod.description_en || prod.descriptionEn || '',
        price: prod.price || 0,
        original_price: prod.original_price || prod.originalPrice || null,
        discounted_price: prod.discounted_price || prod.discountedPrice || null,
        image_url: prod.image_url || prod.imageUrl || prod.image || '',
        category_id: prod.category_id || prod.categoryId || null,
        is_active: prod.is_active !== undefined ? prod.is_active : (prod.isActive !== undefined ? prod.isActive : true),
        is_available: prod.is_available !== undefined ? prod.is_available : (prod.isAvailable !== undefined ? prod.isAvailable : true),
        order_index: prod.order_index || prod.orderIndex || 0,
        sizes: prod.sizes || [],
        weights: prod.weights || [],
        extras: prod.extras || []
      }))
    };
    
    const filename = prompt('أدخل اسم الملف (بدون .json):', `menu_export_${new Date().toISOString().split('T')[0]}`);
    if (filename) {
      exportToJSON(allData, `${filename}.json`);
      alert('تم تصدير جميع البيانات بنجاح!');
    }
  };

  // Import functions
  const handleImportFile = async (file, type) => {
    try {
      setImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);
      const restaurantId = getRestaurantId();
      const branchId = getCurrentBranchId();
      
      if (!restaurantId) {
        alert('معرف المطعم غير موجود');
        return;
      }

      if (type === 'categories') {
        if (!Array.isArray(data)) {
          alert('تنسيق الملف غير صحيح. يجب أن يكون مصفوفة من الفئات.');
          return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const category of data) {
          try {
            await categoryService.addCategory(restaurantId, {
              nameAr: category.name_ar || category.nameAr || '',
              nameEn: category.name_en || category.nameEn || '',
              description: category.description || '',
              imageUrl: category.image_url || category.imageUrl || category.image || '',
              isActive: category.is_active !== undefined ? category.is_active : (category.isActive !== undefined ? category.isActive : true),
              orderIndex: category.order_index || category.orderIndex || 0
            }, branchId);
            successCount++;
          } catch (error) {
            console.error('Error importing category:', error);
            errorCount++;
          }
        }
        
        alert(`تم استيراد ${successCount} فئة بنجاح${errorCount > 0 ? `، وحدث خطأ في ${errorCount} فئة` : ''}`);
      } else if (type === 'products') {
        if (!Array.isArray(data)) {
          alert('تنسيق الملف غير صحيح. يجب أن يكون مصفوفة من المنتجات.');
          return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const product of data) {
          try {
            await productService.addProduct(restaurantId, {
              nameAr: product.name_ar || product.nameAr || '',
              nameEn: product.name_en || product.nameEn || '',
              descriptionAr: product.description_ar || product.descriptionAr || product.description || '',
              descriptionEn: product.description_en || product.descriptionEn || '',
              price: product.price || 0,
              originalPrice: product.original_price || product.originalPrice || null,
              discountedPrice: product.discounted_price || product.discountedPrice || null,
              imageUrl: product.image_url || product.imageUrl || product.image || '',
              categoryId: product.category_id || product.categoryId || null,
              isActive: product.is_active !== undefined ? product.is_active : (product.isActive !== undefined ? product.isActive : true),
              isAvailable: product.is_available !== undefined ? product.is_available : (product.isAvailable !== undefined ? product.isAvailable : true),
              orderIndex: product.order_index || product.orderIndex || 0,
              sizes: product.sizes || [],
              weights: product.weights || [],
              extras: product.extras || []
            }, branchId);
            successCount++;
          } catch (error) {
            console.error('Error importing product:', error);
            errorCount++;
          }
        }
        
        alert(`تم استيراد ${successCount} منتج بنجاح${errorCount > 0 ? `، وحدث خطأ في ${errorCount} منتج` : ''}`);
      } else if (type === 'all') {
        if (!data.categories || !data.products) {
          alert('تنسيق الملف غير صحيح. يجب أن يحتوي على categories و products.');
          return;
        }
        
        let categoriesSuccess = 0;
        let categoriesError = 0;
        let productsSuccess = 0;
        let productsError = 0;
        
        // Import categories first
        for (const category of data.categories) {
          try {
            await categoryService.addCategory(restaurantId, {
              nameAr: category.name_ar || category.nameAr || '',
              nameEn: category.name_en || category.nameEn || '',
              description: category.description || '',
              imageUrl: category.image_url || category.imageUrl || category.image || '',
              isActive: category.is_active !== undefined ? category.is_active : (category.isActive !== undefined ? category.isActive : true),
              orderIndex: category.order_index || category.orderIndex || 0
            }, branchId);
            categoriesSuccess++;
          } catch (error) {
            console.error('Error importing category:', error);
            categoriesError++;
          }
        }
        
        // Then import products
        for (const product of data.products) {
          try {
            await productService.addProduct(restaurantId, {
              nameAr: product.name_ar || product.nameAr || '',
              nameEn: product.name_en || product.nameEn || '',
              descriptionAr: product.description_ar || product.descriptionAr || product.description || '',
              descriptionEn: product.description_en || product.descriptionEn || '',
              price: product.price || 0,
              originalPrice: product.original_price || product.originalPrice || null,
              discountedPrice: product.discounted_price || product.discountedPrice || null,
              imageUrl: product.image_url || product.imageUrl || product.image || '',
              categoryId: product.category_id || product.categoryId || null,
              isActive: product.is_active !== undefined ? product.is_active : (product.isActive !== undefined ? product.isActive : true),
              isAvailable: product.is_available !== undefined ? product.is_available : (product.isAvailable !== undefined ? product.isAvailable : true),
              orderIndex: product.order_index || product.orderIndex || 0,
              sizes: product.sizes || [],
              weights: product.weights || [],
              extras: product.extras || []
            }, branchId);
            productsSuccess++;
          } catch (error) {
            console.error('Error importing product:', error);
            productsError++;
          }
        }
        
        alert(`تم الاستيراد بنجاح:\n- ${categoriesSuccess} فئة${categoriesError > 0 ? ` (${categoriesError} خطأ)` : ''}\n- ${productsSuccess} منتج${productsError > 0 ? ` (${productsError} خطأ)` : ''}`);
      }
      
      // Refresh data
      await fetchCategories(restaurantId, branchId);
      await fetchProducts(restaurantId, branchId);
      
      setShowImportExportModal(false);
      setImportExportMode(null);
    } catch (error) {
      console.error('Error importing file:', error);
      alert('حدث خطأ أثناء استيراد الملف. يرجى التحقق من تنسيق الملف.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('admin.menu_items')}
              </h1>
              <p className="mt-2 text-gray-600">
                إدارة فئات القائمة والمنتجات
                {selectedBranch && (
                  <span className="mr-2 text-blue-600 font-semibold">
                    - {selectedBranch.name}
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setImportExportMode(null);
                  setShowImportExportModal(true);
                }}
                className="btn-secondary flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                استيراد / تصدير
              </button>
              <SubscriptionLimitChecker itemType="categories">
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="btn-secondary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة فئة
                </button>
              </SubscriptionLimitChecker>
              <SubscriptionLimitChecker itemType="products">
                <button
                  onClick={() => setShowProductForm(true)}
                  className="btn-primary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة منتج
                </button>
              </SubscriptionLimitChecker>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              الفئات ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              المنتجات ({products.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('reorder');
                // Initialize reordering products with current products sorted by order_index
                const sortedProducts = [...products].sort((a, b) => {
                  const orderA = a.order_index || a.orderIndex || 0;
                  const orderB = b.order_index || b.orderIndex || 0;
                  return orderA - orderB;
                });
                setReorderingProducts(sortedProducts);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'reorder'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ترتيب العناصر
            </button>
          </div>

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {categoriesLoading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto"></div>
                  <p className="mt-2 text-gray-500">جاري تحميل الفئات...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد فئات بعد
                  </h3>
                  <p className="text-gray-500 mb-6">
                    ابدأ بإضافة فئات جديدة لتنظيم منتجاتك
                  </p>
                  <button
                    onClick={() => setShowCategoryForm(true)}
                    className="btn-primary"
                  >
                    إضافة أول فئة
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map((category) => {
                    const categoryImage = category.image_url || category.imageUrl || category.image || '';
                    const categoryName = category.name_ar || category.nameAr || category.name || 'بدون اسم';
                    const categoryNameEn = category.name_en || category.nameEn || '';
                    const categoryDescription = category.description || '';
                    const isActive = category.is_active !== undefined ? category.is_active : (category.isActive !== undefined ? category.isActive : true);
                    const productsCount = products.filter(p => (p.category_id || p.categoryId) === category.id).length;
                    
                    return (
                      <div 
                        key={category.id} 
                        className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 cursor-pointer"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setActiveTab('products');
                        }}
                      >
                        {/* Category Image */}
                        <div className="relative h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 overflow-hidden">
                          {categoryImage ? (
                            <img 
                              src={categoryImage} 
                              alt={categoryName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`absolute inset-0 flex items-center justify-center ${categoryImage ? 'hidden' : ''}`}
                            style={{ display: categoryImage ? 'none' : 'flex' }}
                          >
                            <div className="text-center">
                              <svg className="w-20 h-20 text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <p className="text-xs text-purple-500 font-medium">بدون صورة</p>
                            </div>
                          </div>
                          
                          {/* Status Badge - Overlay */}
                          <div className="absolute top-3 left-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                              isActive 
                                ? 'bg-green-500/90 text-white' 
                                : 'bg-red-500/90 text-white'
                            }`}>
                              {isActive ? '✓ نشط' : '✗ غير نشط'}
                            </span>
                          </div>
                          
                          {/* Products Count Badge */}
                          <div className="absolute top-3 right-3">
                            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="text-sm font-bold text-purple-600">{productsCount}</span>
                        </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons - Overlay on Hover */}
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCategoryProducts(category);
                              }}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="عرض المنتجات"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCategory(category);
                              }}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="تعديل الفئة"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(category.id);
                              }}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="حذف الفئة"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                        
                        {/* Category Content */}
                        <div className="p-5">
                          {/* Category Name */}
                          <div className="mb-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
                              {categoryName}
                            </h3>
                            {categoryNameEn && (
                              <p className="text-xs text-gray-500 italic">
                                {categoryNameEn}
                              </p>
                            )}
                    </div>
                          
                          {/* Category Description */}
                          {categoryDescription && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                              {categoryDescription}
                            </p>
                          )}
                          
                          {/* Stats */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="font-semibold text-gray-900">{productsCount}</span>
                                <span className="text-gray-500">منتج</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>انقر للعرض</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-sm font-medium text-gray-700">تصفية حسب الفئة:</label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                  className="input-field w-48"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name_ar || category.nameAr || category.name || 'بدون اسم'}
                    </option>
                  ))}
                </select>
              </div>

              {productsLoading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto"></div>
                  <p className="mt-2 text-gray-500">جاري تحميل المنتجات...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد منتجات بعد
                  </h3>
                  <p className="text-gray-500 mb-6">
                    ابدأ بإضافة منتجات جديدة لقائمة مطعمك
                  </p>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="btn-primary"
                  >
                    إضافة أول منتج
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => {
                    const productImage = product.image_url || product.imageUrl || product.image || '';
                    const productName = product.name_ar || product.nameAr || product.name || 'بدون اسم';
                    const productDescription = product.description_ar || product.descriptionAr || product.description || '';
                    const isActive = product.is_active !== undefined ? product.is_active : (product.isActive !== undefined ? product.isActive : true);
                    const isAvailable = product.is_available !== undefined ? product.is_available : (product.isAvailable !== undefined ? product.isAvailable : true);
                    
                    return (
                      <div 
                        key={product.id} 
                        className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
                      >
                        {/* Product Image */}
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={productName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`absolute inset-0 flex items-center justify-center ${productImage ? 'hidden' : ''}`}
                            style={{ display: productImage ? 'none' : 'flex' }}
                          >
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          
                          {/* Status Badges - Overlay */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                              isActive 
                                ? 'bg-green-500/90 text-white' 
                                : 'bg-red-500/90 text-white'
                              }`}>
                              {isActive ? '✓ نشط' : '✗ غير نشط'}
                              </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                              isAvailable 
                                ? 'bg-blue-500/90 text-white' 
                                : 'bg-gray-500/90 text-white'
                              }`}>
                              {isAvailable ? '✓ متوفر' : '✗ غير متوفر'}
                              </span>
                            </div>
                          
                          {/* Action Buttons - Overlay on Hover */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                        
                        {/* Product Content */}
                        <div className="p-5">
                          {/* Product Name */}
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {productName}
                          </h3>
                          
                          {/* Product Description */}
                          {productDescription && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                              {productDescription}
                            </p>
                          )}
                          
                          {/* Price and Stats */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <span className="text-2xl font-bold text-blue-600">
                                {formatPrice(product.price, 'EGP', 'ar')}
                              </span>
                    </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{product.views || 0}</span>
                            </div>
                          </div>
                          
                          {/* Category Badge */}
                          {product.category_id && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {categories.find(cat => cat.id === (product.category_id || product.categoryId))?.name_ar || 
                                 categories.find(cat => cat.id === (product.category_id || product.categoryId))?.nameAr || 
                                 categories.find(cat => cat.id === (product.category_id || product.categoryId))?.name || 
                                 'غير محدد'}
                              </span>
                </div>
              )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reorder Tab */}
          {activeTab === 'reorder' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📋</span>
                  ترتيب العناصر في صفحة المنيو
                </h3>
                <p className="text-gray-600 text-sm">
                  قم بترتيب المنتجات بالطريقة التي تريد أن تظهر بها في صفحة المنيو عند اختيار فئة "الكل".
                  استخدم الأزرار للأعلى/لأسفل لترتيب المنتجات.
                </p>
              </div>

              {productsLoading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto"></div>
                  <p className="mt-2 text-gray-500">جاري تحميل المنتجات...</p>
                </div>
              ) : reorderingProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد منتجات للترتيب
                  </h3>
                  <p className="text-gray-500">
                    أضف منتجات أولاً ثم قم بترتيبها
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleSaveOrder}
                      disabled={savingOrder}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {savingOrder ? (
                        <>
                          <div className="loading-spinner w-4 h-4"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          حفظ الترتيب
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {reorderingProducts.map((product, index) => {
                      const productImage = product.image_url || product.imageUrl || product.image || '';
                      const productName = product.name_ar || product.nameAr || product.name || 'بدون اسم';
                      const productCategoryId = product.category_id || product.categoryId;
                      const category = categories.find(cat => cat.id === productCategoryId);
                      const categoryName = category?.name_ar || category?.nameAr || category?.name || 'غير محدد';
                      
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 p-4 flex items-center gap-4"
                        >
                          {/* Order Number */}
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {index + 1}
                          </div>

                          {/* Product Image */}
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            {productImage ? (
                              <img 
                                src={productImage} 
                                alt={productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                              {productName}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="font-semibold text-blue-600">
                                {formatPrice(product.price, 'EGP', 'ar')}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="truncate">{categoryName}</span>
                            </div>
                          </div>

                          {/* Move Buttons */}
                          <div className="flex-shrink-0 flex flex-col gap-2">
                            <button
                              onClick={() => moveProductUp(index)}
                              disabled={index === 0}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="نقل للأعلى"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveProductDown(index)}
                              disabled={index === reorderingProducts.length - 1}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="نقل للأسفل"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveOrder}
                      disabled={savingOrder}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                    >
                      {savingOrder ? (
                        <>
                          <div className="loading-spinner w-4 h-4"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          حفظ الترتيب
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h2>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="form-label">اسم الفئة (عربي)</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="input-field"
                    required
                    placeholder="مثال: المشروبات"
                  />
                </div>
                <div>
                  <label className="form-label">اسم الفئة (إنجليزي) - اختياري</label>
                  <input
                    type="text"
                    value={categoryForm.nameEn}
                    onChange={(e) => setCategoryForm({...categoryForm, nameEn: e.target.value})}
                    className="input-field"
                    placeholder="مثال: Beverages"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    سيتم استخدام الاسم الإنجليزي عند تغيير اللغة في صفحة المنيو
                  </p>
                </div>
                <div>
                  <label className="form-label">الوصف</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="form-label">رابط الصورة</label>
                  <input
                    type="url"
                    value={categoryForm.image}
                    onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="categoryActive"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({...categoryForm, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="categoryActive" className="text-sm text-gray-700">
                    فئة نشطة
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      setCategoryForm({ name: '', nameEn: '', description: '', image: '', isActive: true });
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    {editingCategory ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        <ProductFormModal
          isOpen={showProductForm}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
            setProductForm({ 
              name: '', 
              nameEn: '',
              description: '', 
              descriptionEn: '',
              price: '', 
              image: '', 
              categoryId: selectedCategoryId || '', 
              isActive: true, 
              isAvailable: true,
              sizes: [],
              weights: [],
              extras: []
            });
          }}
          onSubmit={handleProductSubmit}
          product={editingProduct ? productForm : null}
          categories={categories}
        />

        {/* Category Products Modal */}
        {showCategoryProductsModal && selectedCategoryForModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    منتجات فئة: {selectedCategoryForModal.name}
                  </h2>
                  <button
                    onClick={() => setShowCategoryProductsModal(false)}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  {selectedCategoryForModal.description || 'لا يوجد وصف للفئة'}
                </p>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const categoryProducts = products.filter(p => (p.category_id || p.categoryId) === selectedCategoryForModal.id);
                  return categoryProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        لا توجد منتجات في هذه الفئة
                      </h3>
                      <p className="text-gray-500">
                        قم بإضافة منتجات جديدة لهذه الفئة
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto p-2">
                      {categoryProducts.map((product) => {
                        const productImage = product.image_url || product.imageUrl || product.image || '';
                        const productName = product.name_ar || product.nameAr || product.name || 'بدون اسم';
                        const productDescription = product.description_ar || product.descriptionAr || product.description || '';
                        const isActive = product.is_active !== undefined ? product.is_active : (product.isActive !== undefined ? product.isActive : true);
                        const isAvailable = product.is_available !== undefined ? product.is_available : (product.isAvailable !== undefined ? product.isAvailable : true);
                        
                        return (
                          <div 
                            key={product.id} 
                            className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
                          >
                            {/* Product Image */}
                            <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                              {productImage ? (
                                <img 
                                  src={productImage} 
                                  alt={productName}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`absolute inset-0 flex items-center justify-center ${productImage ? 'hidden' : ''}`}
                                style={{ display: productImage ? 'none' : 'flex' }}
                              >
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              
                              {/* Status Badges */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                                  isActive 
                                    ? 'bg-green-500/90 text-white' 
                                    : 'bg-red-500/90 text-white'
                                  }`}>
                                  {isActive ? '✓' : '✗'}
                                  </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                                  isAvailable 
                                    ? 'bg-blue-500/90 text-white' 
                                    : 'bg-gray-500/90 text-white'
                                  }`}>
                                  {isAvailable ? '✓' : '✗'}
                                  </span>
                                </div>
                              
                              {/* Action Buttons */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                                <button
                                  onClick={() => {
                                    handleEditProduct(product);
                                    setShowCategoryProductsModal(false);
                                  }}
                                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title="تعديل"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="حذف"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            {/* Product Content */}
                            <div className="p-4">
                              <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {productName}
                              </h3>
                              
                              {productDescription && (
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                  {productDescription}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-xl font-bold text-blue-600">
                                  {formatPrice(product.price, 'EGP', 'ar')}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>{product.views || 0}</span>
                          </div>
                        </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    إجمالي المنتجات: {products.filter(p => (p.category_id || p.categoryId) === selectedCategoryForModal.id).length}
                  </span>
                  <button
                    onClick={() => setShowCategoryProductsModal(false)}
                    className="btn-secondary"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import/Export Modal */}
        {showImportExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    استيراد / تصدير البيانات
                  </h2>
                  <button
                    onClick={() => {
                      setShowImportExportModal(false);
                      setImportExportMode(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {!importExportMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Export Section */}
                      <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-blue-500 rounded-lg text-white mr-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">تصدير البيانات</h3>
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">
                          تصدير الفئات والمنتجات إلى ملفات JSON
                        </p>
                        <div className="space-y-2">
                          <button
                            onClick={handleExportCategories}
                            className="w-full btn-secondary text-right flex items-center justify-between"
                          >
                            <span>تصدير الفئات</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={handleExportProducts}
                            className="w-full btn-secondary text-right flex items-center justify-between"
                          >
                            <span>تصدير المنتجات</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={handleExportAll}
                            className="w-full btn-primary text-right flex items-center justify-between"
                          >
                            <span>تصدير الكل</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Import Section */}
                      <div className="border-2 border-dashed border-green-300 rounded-xl p-6 bg-green-50">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-green-500 rounded-lg text-white mr-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">استيراد البيانات</h3>
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">
                          استيراد الفئات والمنتجات من ملفات JSON
                        </p>
                        <div className="space-y-2">
                          <label className="w-full btn-secondary text-right flex items-center justify-between cursor-pointer">
                            <span>استيراد الفئات</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <input
                              type="file"
                              accept=".json"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleImportFile(file, 'categories');
                                }
                              }}
                              disabled={importing}
                            />
                          </label>
                          <label className="w-full btn-secondary text-right flex items-center justify-between cursor-pointer">
                            <span>استيراد المنتجات</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <input
                              type="file"
                              accept=".json"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleImportFile(file, 'products');
                                }
                              }}
                              disabled={importing}
                            />
                          </label>
                          <label className="w-full btn-primary text-right flex items-center justify-between cursor-pointer">
                            <span>استيراد الكل</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <input
                              type="file"
                              accept=".json"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleImportFile(file, 'all');
                                }
                              }}
                              disabled={importing}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {importing && (
                      <div className="text-center py-4">
                        <div className="loading-spinner mx-auto mb-2"></div>
                        <p className="text-gray-600">جاري الاستيراد...</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMenuItems;