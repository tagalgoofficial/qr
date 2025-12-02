import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import restaurantService from '../../services/restaurantService';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import branchService from '../../services/branchService';
import orderService from '../../services/orderService';
import themeService from '../../services/themeService';
import { formatPrice } from '../../utils/currencies';
import { getImageUrl } from '../../utils/imageUtils';
import CategorySlider from '../../components/menu/CategorySlider';
import ProductCard from '../../components/menu/ProductCard';
import ProductModal from '../../components/menu/ProductModal';
import SkeletonLoader from '../../components/menu/SkeletonLoader';
import BranchCard from '../../components/menu/BranchCard';
import PWAInstaller from '../../components/PWAInstaller';
import { updateManifest } from '../../utils/pwaUtils';

const CustomerMenu = () => {
  const { restaurantId: restaurantSlug, branchId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Actual restaurant ID (UID) after lookup
  const [restaurantId, setRestaurantId] = useState(null);
  
  // Basic state
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantLogo, setRestaurantLogo] = useState('/Logo-MR-QR.svg');
  
  // Branch management state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isBranchLoading, setIsBranchLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Menu data state
  const [categoriesData, setCategoriesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  
  // Cart and order state
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: ''
  });
  
  // Load saved language preference on component mount only
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
    }
  }, []); // Empty dependency array - only run on mount

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchFocused]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch restaurant by slug or ID
        const restaurant = await restaurantService.getRestaurant(null, restaurantSlug).catch(() => 
          restaurantService.getRestaurant(restaurantSlug)
        );
        
        if (!restaurant) {
          setError('المطعم غير موجود');
          setLoading(false);
          return;
        }
        
        // Set the actual restaurant ID (UID)
        const actualRestaurantId = restaurant.id;
        setRestaurantId(actualRestaurantId);
        
        // Set logo early for loading screen
        const earlyLogo = restaurant?.logo_url || restaurant?.logo;
        const normalizedEarlyLogo = earlyLogo ? getImageUrl(earlyLogo) : '/Logo-MR-QR.svg';
        setRestaurantLogo(normalizedEarlyLogo);
        
        // Optimized: Fetch everything in parallel for faster loading
        const [restaurantSettings, restaurantTheme, branchesData] = await Promise.all([
          restaurantService.getRestaurantSettings(actualRestaurantId).catch(() => null),
          themeService.getRestaurantTheme(actualRestaurantId).catch(() => null),
          branchService.getBranches(actualRestaurantId).catch(() => [])
        ]);
        
        // Merge restaurant data with settings to include logo and coverImage
        const logoUrl = restaurantSettings?.logo || restaurant?.logo_url || restaurant?.logo;
        const coverImageUrl = restaurantSettings?.coverImage || restaurant?.background_url || restaurant?.background;
        const mergedSettings = {
          ...restaurantSettings,
          logo: logoUrl ? getImageUrl(logoUrl) : null,
          coverImage: coverImageUrl ? getImageUrl(coverImageUrl) : null,
          name: restaurantSettings?.name || restaurant?.restaurant_name || restaurant?.name,
          description: restaurant?.description,
          phone: restaurant?.phone,
          address: restaurant?.address,
          mainRestaurantNameAr: restaurantSettings?.mainRestaurantNameAr || restaurant?.main_restaurant_name_ar || null,
          mainRestaurantNameEn: restaurantSettings?.mainRestaurantNameEn || restaurant?.main_restaurant_name_en || null
        };
        
        // Set settings and theme immediately for faster UI rendering
        setSettings(mergedSettings);
        setTheme(restaurantTheme);
        
        // Update logo if available in settings
        if (mergedSettings?.logo) {
          setRestaurantLogo(mergedSettings.logo);
        }
        
        // Update PWA manifest immediately with restaurant info
        if (mergedSettings) {
          // Use current URL path for start_url
          const currentPath = window.location.pathname;
          updateManifest(mergedSettings, restaurantTheme, currentPath);
        }
        
        // Apply theme immediately
        if (restaurantTheme) {
          const root = document.documentElement;
          Object.entries(restaurantTheme).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
          });
        }
        
        // Set language immediately
        if (restaurantSettings?.language) {
          i18n.changeLanguage(restaurantSettings.language);
        }
        
        // Set branches
        setBranches(branchesData || []);
        
        // Mark as initialized early so we can start loading data
        setIsInitialized(true);
        setLoading(false);
        
        // Load menu data in background (non-blocking)
        initializeBranchSystemFast(actualRestaurantId, branchesData || [], branchId);
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('خطأ في تحميل بيانات المنيو');
        setLoading(false);
      }
    };
    
    if (restaurantSlug) {
      fetchData();
    }
  }, [restaurantSlug, branchId]);

  // Optimized: Fast branch system initialization (non-blocking)
  const initializeBranchSystemFast = async (actualRestaurantId, branchesData, branchIdParam) => {
    if (!actualRestaurantId) return;
    
    try {
      if (branchesData.length > 0) {
        if (branchIdParam) {
          // Specific branch in URL
          const specificBranch = branchesData.find(b => b.id === branchIdParam);
          if (specificBranch) {
            setSelectedBranch(specificBranch.id);
            loadBranchDataFast(actualRestaurantId, specificBranch.id);
          } else {
            // Branch not found, load main restaurant
            setSelectedBranch(null);
            loadMainRestaurantDataFast(actualRestaurantId);
          }
        } else {
          // No specific branch, load main restaurant by default
          setSelectedBranch(null);
          loadMainRestaurantDataFast(actualRestaurantId);
        }
      } else {
        // No branches, load main restaurant
        setSelectedBranch(null);
        loadMainRestaurantDataFast(actualRestaurantId);
      }
    } catch (error) {
      console.error('Error initializing branch system:', error);
      // Fallback to main restaurant
      setSelectedBranch(null);
      loadMainRestaurantDataFast(actualRestaurantId);
    }
  };

  // Optimized: Fast branch data loading (non-blocking, progressive)
  const loadBranchDataFast = async (actualRestaurantId, branchIdParam) => {
    if (!actualRestaurantId || !branchIdParam) return;
    
    setIsBranchLoading(true);
    
    try {
      // Load in parallel for faster performance
      const [categories, products] = await Promise.all([
        branchService.getBranchCategories(actualRestaurantId, branchIdParam).catch(() => []),
        branchService.getBranchProducts(actualRestaurantId, branchIdParam).catch(() => [])
      ]);
      
      // Debug: Log products to check if options are present
      if (products && products.length > 0) {
        console.log('📦 Branch Products Loaded:', products.length);
        products.forEach(product => {
          if (product.sizes || product.weights || product.extras) {
            const productName = product.name_ar || product.nameAr || product.name || 'Unknown';
            console.log(`✅ Product "${productName}" has options:`, {
              sizes: product.sizes,
              weights: product.weights,
              extras: product.extras
            });
          }
        });
      }
      
      // Set data immediately
      setCategoriesData(categories || []);
      setProductsData(products || []);
    } catch (error) {
      console.error('Error loading branch data:', error);
      setCategoriesData([]);
      setProductsData([]);
    } finally {
      setIsBranchLoading(false);
    }
  };

  // Optimized: Fast main restaurant data loading (non-blocking, progressive)
  const loadMainRestaurantDataFast = async (actualRestaurantId) => {
    if (!actualRestaurantId) return;
    
    setIsBranchLoading(true);
    
    try {
      // Load in parallel for faster performance
      const [categories, products] = await Promise.all([
        categoryService.getCategories(actualRestaurantId).catch(() => []),
        productService.getProducts(actualRestaurantId).catch(() => [])
      ]);
      
      // Debug: Log products to check if options are present
      if (products && products.length > 0) {
        console.log('📦 Main Products Loaded:', products.length);
        products.forEach(product => {
          if (product.sizes || product.weights || product.extras) {
            const productName = product.name_ar || product.nameAr || product.name || 'Unknown';
            console.log(`✅ Product "${productName}" has options:`, {
              sizes: product.sizes,
              weights: product.weights,
              extras: product.extras
            });
          }
        });
      }
      
      // Set data immediately
      setCategoriesData(categories || []);
      setProductsData(products || []);
    } catch (error) {
      console.error('Error loading main restaurant data:', error);
      setCategoriesData([]);
      setProductsData([]);
    } finally {
      setIsBranchLoading(false);
    }
  };

  // Legacy functions for backward compatibility
  const loadBranchData = loadBranchDataFast;
  const loadMainRestaurantData = loadMainRestaurantDataFast;

  // Handle branch selection
  const handleBranchChange = (branchId) => {
    if (!isInitialized) {
      return;
    }
    setSelectedBranch(branchId);
    // useEffect will handle loading the data
  };

  // Load data when selectedBranch changes (only after initialization)
  // Optimized: Use ref to prevent unnecessary reloads
  const prevBranchRef = useRef(null);
  useEffect(() => {
    // Skip if still loading or not initialized
    if (loading || !isInitialized || !restaurantId) return;
    
    // Skip if branch hasn't actually changed
    if (prevBranchRef.current === selectedBranch) return;
    prevBranchRef.current = selectedBranch;
    
    // Load data based on selection
    if (selectedBranch !== null) {
      loadBranchDataFast(restaurantId, selectedBranch);
    } else {
      loadMainRestaurantDataFast(restaurantId);
    }
  }, [selectedBranch, loading, isInitialized, restaurantId]);
  
  // Optimized: Memoized category names to prevent recalculation
  // Support both Arabic and English based on current language
  const categoryNames = useMemo(() => {
    const isEnglish = i18n.language === 'en';
    const names = categoriesData.length > 0 
      ? ['all', ...categoriesData.map(cat => {
          if (isEnglish) {
            // Use English name if available, fallback to Arabic
            return cat.name_en || cat.nameEn || cat.name_ar || cat.nameAr || cat.name || 'Unnamed';
          } else {
            // Use Arabic name
            return cat.name_ar || cat.nameAr || cat.name || 'بدون اسم';
          }
        })]
      : ['all'];
    
    // Debug: Log category names when language changes
    console.log('🌐 Category names updated:', {
      language: i18n.language,
      isEnglish,
      categoryNames: names,
      categoriesData: categoriesData.map(cat => ({
        id: cat.id,
        name_ar: cat.name_ar || cat.nameAr,
        name_en: cat.name_en || cat.nameEn,
        allKeys: Object.keys(cat)
      }))
    });
    
    return names;
  }, [categoriesData, i18n.language]);
  
  // Optimized: Memoized filtered products to prevent unnecessary filtering
  const filteredProducts = useMemo(() => {
    if (!productsData.length) return [];
    
    const lowerSearchQuery = searchQuery.toLowerCase();
    const isEnglish = i18n.language === 'en';
    
    // Find category ID by matching the selected category name (in current language)
      const selectedCategoryId = selectedCategory === 'all' 
      ? null 
      : categoriesData.find(cat => {
          if (isEnglish) {
            const catNameEn = cat.name_en || cat.nameEn || cat.name_ar || cat.nameAr || cat.name;
            return catNameEn === selectedCategory;
          } else {
            const catNameAr = cat.name_ar || cat.nameAr || cat.name;
            return catNameAr === selectedCategory;
          }
        })?.id;
    
    return productsData.filter(product => {
      // Fast early returns for better performance
      const isActive = product.is_active !== undefined ? product.is_active : (product.isActive !== undefined ? product.isActive : true);
      if (!isActive) return false;
      
      // Category filter
      const productCategoryId = product.category_id || product.categoryId;
      if (selectedCategoryId !== null && productCategoryId !== selectedCategoryId) {
        return false;
      }
      
      // Search filter
      if (lowerSearchQuery) {
        const productName = product.name_ar || product.nameAr || product.name || '';
        const productDescription = product.description_ar || product.descriptionAr || product.description || '';
        const matchesName = productName.toLowerCase().includes(lowerSearchQuery);
        const matchesDescription = productDescription.toLowerCase().includes(lowerSearchQuery);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by order_index when "all" category is selected
      if (selectedCategory === 'all' || selectedCategoryId === null) {
        const orderA = a.order_index || a.orderIndex || 0;
        const orderB = b.order_index || b.orderIndex || 0;
        return orderA - orderB;
      }
      // Otherwise, maintain original order
      return 0;
    });
  }, [productsData, selectedCategory, searchQuery, categoriesData, i18n.language]);
  
  // Update selectedCategory when language changes to match the new category name
  useEffect(() => {
    if (selectedCategory === 'all' || !categoriesData.length) return;
    
    const isEnglish = i18n.language === 'en';
    
    // Try to find the category by matching the current selectedCategory name with any name (Arabic or English)
    const foundCategory = categoriesData.find(cat => {
      const catNameAr = cat.name_ar || cat.nameAr || cat.name;
      const catNameEn = cat.name_en || cat.nameEn;
      return catNameAr === selectedCategory || catNameEn === selectedCategory;
    });
    
    if (foundCategory) {
      // Update to the name in the new language
      const newCategoryName = isEnglish
        ? (foundCategory.name_en || foundCategory.nameEn || foundCategory.name_ar || foundCategory.nameAr || foundCategory.name)
        : (foundCategory.name_ar || foundCategory.nameAr || foundCategory.name);
      
      if (newCategoryName !== selectedCategory) {
        setSelectedCategory(newCategoryName);
      }
    } else {
      // If category not found, reset to 'all'
      setSelectedCategory('all');
    }
  }, [i18n.language, categoriesData, selectedCategory]);

  // Update PWA manifest when URL or branch changes
  useEffect(() => {
    if (settings && theme) {
      // Include branch address if available
      const selectedBranchData = selectedBranch 
        ? branches.find(b => b.id === selectedBranch)
        : null;
      const settingsWithBranch = selectedBranchData && selectedBranchData.address
        ? { ...settings, address: selectedBranchData.address }
        : settings;
      
      // Get current URL path
      const currentPath = window.location.pathname;
      updateManifest(settingsWithBranch, theme, currentPath);
    }
  }, [settings, theme, selectedBranch, branches, branchId]);
  
  // Debug logging - only when there are issues (reduced frequency)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && error) {
      console.log('📊 Current state:', {
        selectedBranch,
        branchesCount: branches.length,
        categoriesCount: categoriesData.length,
        productsCount: productsData.length,
        isBranchLoading,
        loading,
        isInitialized,
        error
      });
    }
  }, [error]); // Only log when there's an error

  // Optimized: Non-blocking product view tracking
  const handleProductView = useCallback(async (productId) => {
    // Product views are tracked automatically when getting a product
    // No need for separate tracking call
    if (!restaurantId || !productId) return;
    
    // Optimistic update - update UI immediately
    setProductsData(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, views: (product.views || 0) + 1 }
          : product
      )
    );
    
    // Product views are tracked automatically when getting a product via API
  }, [restaurantId]);

  // Helper function to create a unique key for cart items with options
  const getCartItemKey = useCallback((item) => {
    if (!item || !item.id) return '';
    const sizeKey = item.selectedSize?.name || '';
    const weightKey = item.selectedWeight?.name || '';
    const extrasKey = item.selectedExtras?.map(e => e?.name).filter(Boolean).sort().join(',') || '';
    return `${item.id}-${sizeKey}-${weightKey}-${extrasKey}`;
  }, []);

  // Optimized: Memoized cart functions
  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prevCart => {
      // Calculate the price per unit including options
      let itemPrice = parseFloat(product.price || 0);
      
      // Add size price if selected
      if (product.selectedSize && product.selectedSize.price) {
        itemPrice += parseFloat(product.selectedSize.price || 0);
      }
      
      // Add weight price if selected
      if (product.selectedWeight && product.selectedWeight.price) {
        itemPrice += parseFloat(product.selectedWeight.price || 0);
      }
      
      // Add extras prices if selected
      if (product.selectedExtras && Array.isArray(product.selectedExtras) && product.selectedExtras.length > 0) {
        product.selectedExtras.forEach(extra => {
          if (extra && extra.price) {
            itemPrice += parseFloat(extra.price || 0);
          }
        });
      }

      // Get product name - support both camelCase and snake_case
      const productName = product.name_ar || product.nameAr || product.name_en || product.nameEn || product.name || 'Unknown Product';

      // Ensure all options are preserved
      const cartItem = {
        ...product,
        name: productName, // Add normalized name field for easier access
        quantity: quantity || 1,
        selectedSize: product.selectedSize || null,
        selectedWeight: product.selectedWeight || null,
        selectedExtras: product.selectedExtras || [],
        calculatedPrice: itemPrice, // Price per unit including options
        cartItemKey: getCartItemKey(product) // Unique key for items with different options
      };

      // Log for debugging
      console.log('🛒 Adding/Updating cart item:', {
        id: cartItem.id,
        name: cartItem.name,
        quantity: cartItem.quantity,
        selectedSize: cartItem.selectedSize,
        selectedWeight: cartItem.selectedWeight,
        selectedExtras: cartItem.selectedExtras,
        calculatedPrice: cartItem.calculatedPrice,
        cartItemKey: cartItem.cartItemKey
      });

      // Check if item with same options already exists
      const existingItemIndex = prevCart.findIndex(item => {
        const itemKey = item.cartItemKey || getCartItemKey(item);
        return itemKey === cartItem.cartItemKey;
      });

      if (existingItemIndex >= 0) {
        // Update quantity if same item with same options exists
        console.log('✅ Updating existing cart item quantity');
        return prevCart.map((item, index) => 
          index === existingItemIndex
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                // Preserve all options in case they're updated
                selectedSize: cartItem.selectedSize,
                selectedWeight: cartItem.selectedWeight,
                selectedExtras: cartItem.selectedExtras,
                calculatedPrice: cartItem.calculatedPrice
              }
            : item
        );
      } else {
        // Add new item to cart
        console.log('➕ Adding new cart item');
        return [...prevCart, cartItem];
      }
    });
  }, [getCartItemKey]);

  const handleViewProduct = useCallback((product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
    handleProductView(product.id);
  }, [handleProductView]);

  // Handle viewing product from cart to edit options
  const handleViewCartItem = useCallback((cartItem) => {
    // Find the original product from productsData
    const originalProduct = productsData.find(p => p.id === cartItem.id);
    if (originalProduct) {
      // Merge cart item options with original product
      const productWithCartOptions = {
        ...originalProduct,
        // Preserve cart item selections for display in modal
        _cartItem: cartItem
      };
      setSelectedProduct(productWithCartOptions);
      setShowProductModal(true);
      setShowCart(false); // Close cart when opening product modal
      handleProductView(cartItem.id);
    } else {
      // If product not found in productsData, use cart item as product
      setSelectedProduct({
        ...cartItem,
        _cartItem: cartItem
      });
      setShowProductModal(true);
      setShowCart(false);
    }
  }, [productsData, handleProductView]);

  const removeFromCart = useCallback((itemKey) => {
    setCart(prevCart => prevCart.filter(item => {
      const cartItemKey = item.cartItemKey || getCartItemKey(item);
      return cartItemKey !== itemKey;
    }));
  }, [getCartItemKey]);

  const updateQuantity = useCallback((itemKey, quantity) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => {
        const cartItemKey = item.cartItemKey || getCartItemKey(item);
        return cartItemKey !== itemKey;
      }));
    } else {
      setCart(prevCart => 
        prevCart.map(item => {
          const cartItemKey = item.cartItemKey || getCartItemKey(item);
          // Also check by id for backward compatibility
          return (cartItemKey === itemKey || item.id === itemKey)
            ? { ...item, quantity }
            : item;
        })
      );
    }
  }, [getCartItemKey]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const itemPrice = item.calculatedPrice || item.price || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Order functions
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (!restaurantId) {
      console.error('❌ Restaurant ID is missing');
      setError('المطعم غير موجود');
      return;
    }
    
    if (!cart || cart.length === 0) {
      console.error('❌ Cart is empty');
      alert('السلة فارغة. يرجى إضافة منتجات قبل إتمام الطلب.');
      return;
    }
    
    try {
      // Generate order number
      const orderNum = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const orderData = {
        ...orderForm,
        items: cart.map(item => {
          const itemPrice = item.calculatedPrice || item.price || 0;
          // Get product name - support both camelCase and snake_case
          const productName = item.name_ar || item.nameAr || item.name_en || item.nameEn || item.name || 'Unknown Product';
          return {
            id: item.id,
            name: productName,
            price: itemPrice,
            quantity: item.quantity,
            selectedSize: item.selectedSize || null,
            selectedWeight: item.selectedWeight || null,
            selectedExtras: item.selectedExtras || [],
            totalPrice: itemPrice * item.quantity
          };
        }),
        total: getCartTotal(),
        branchId: selectedBranch || 'main',
        orderNumber: orderNum
      };

      // Log order data before sending
      console.log('📤 Sending order:', {
        restaurantId,
        branchId: selectedBranch && branches.length > 0 ? selectedBranch : null,
        itemsCount: orderData.items.length,
        total: orderData.total,
        customerName: orderData.customerName
      });

      const response = await orderService.createOrder(
        restaurantId,
        selectedBranch && branches.length > 0 ? selectedBranch : null,
        {
          items: orderData.items,
          subtotal: orderData.total,
          tax: 0,
          total: orderData.total,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail || '',
          notes: orderData.notes || ''
        }
      );
      
      console.log('✅ Order created successfully:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'response is null/undefined');
      
      // Use order number from response if available, otherwise use generated one
      const finalOrderNumber = response?.data?.order_number || response?.data?.orderNumber || orderNum;
      
      // Set order number and show confirmation modal
      setOrderNumber(finalOrderNumber);
      setShowOrderConfirmation(true);
      
      // Clear cart and form
      setCart([]);
      setOrderForm({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        notes: ''
      });
      setShowOrderForm(false);
      setShowCart(false);
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.data
      });
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ في إرسال الطلب';
      alert(`خطأ في إرسال الطلب: ${errorMessage}\n\nيرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.`);
    }
  };
  
  // Toggle language between English and Arabic
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    console.log('Current language:', i18n.language, 'Switching to:', newLang);
    
    // Change language
    i18n.changeLanguage(newLang);
    
    // Update document direction and language
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    
    // Save language preference
    localStorage.setItem('preferred-language', newLang);
    
    // Force re-render by updating a state
    setSettings(prev => ({ ...prev }));
  };

  if (loading) {
    // Show loading with restaurant logo
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-white rounded-3xl shadow-2xl flex items-center justify-center p-4 animate-pulse">
              <img 
                src={restaurantLogo} 
                alt="Restaurant Logo" 
                className="w-full h-full object-contain rounded-2xl"
                onError={(e) => {
                  if (e.target.src !== '/Logo-MR-QR.svg') {
                    e.target.src = '/Logo-MR-QR.svg';
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#ff2d2d] to-[#ff5555] rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-gray-600 text-sm">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">عذراً!</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            حاول مرة أخرى
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`min-h-screen ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`} 
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      style={{
        backgroundColor: theme?.background || '#ffffff',
        backgroundImage: theme?.surface ? `linear-gradient(to bottom right, ${theme.surface}, ${theme.background})` : undefined
      }}
    >
      
      {/* Modern Hero Section - Similar to Talabat App */}
      <div className="relative overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div 
          className="h-56 min-[375px]:h-64 sm:h-72 md:h-80 lg:h-96 bg-cover bg-center relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          style={{ 
            backgroundImage: `url(${settings?.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'})`,
          }}
        >
          {/* Modern Gradient Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: theme?.primary 
                ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7) 50%, ${theme.primary}40 100%)`
                : 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7) 50%, rgba(255, 45, 45, 0.4) 100%)'
            }}
          />
          
          {/* Top Bar - Compact Design */}
          <div className="absolute top-0 left-0 right-0 z-20 p-3 min-[375px]:p-4 sm:p-6">
            <div className="flex items-center justify-between">
              {/* Language Toggle - Compact */}
              <button 
                onClick={toggleLanguage}
                className="bg-white/95 backdrop-blur-md p-1.5 min-[375px]:p-2 sm:p-2.5 rounded-lg min-[375px]:rounded-xl shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-105 group"
              >
                <span className="text-[10px] min-[375px]:text-xs sm:text-sm font-bold" style={{ color: theme?.primary || '#3b82f6' }}>
                  {i18n.language === 'en' ? 'AR' : 'EN'}
                </span>
              </button>
              
              {/* Restaurant Stats - Compact */}
            </div>
          </div>
          
          {/* Restaurant Info - Bottom Aligned - Improved Mobile Responsiveness */}
          <div className="absolute bottom-0 left-0 right-0 p-3 min-[375px]:p-4 sm:p-6 md:p-8 pb-3 min-[375px]:pb-4 sm:pb-6 md:pb-8 pt-24 sm:pt-6 md:pt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 min-[375px]:gap-4 sm:gap-6">
              {/* Logo - Smaller on Mobile */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="relative flex-shrink-0 self-start"
              >
                <div className="h-16 w-16 min-[375px]:h-20 min-[375px]:w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 bg-white rounded-xl min-[375px]:rounded-2xl sm:rounded-3xl flex items-center justify-center p-1.5 min-[375px]:p-2 shadow-2xl border-2 min-[375px]:border-4 border-white/50">
                  <img 
                    src={settings?.logo || '/Logo-MR-QR.svg'} 
                    alt={settings?.name || 'Restaurant'} 
                    className="h-full w-full rounded-lg min-[375px]:rounded-xl sm:rounded-2xl object-cover"
                    onError={(e) => {
                      if (e.target.src !== '/Logo-MR-QR.svg') {
                        e.target.src = '/Logo-MR-QR.svg';
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                </div>
                {/* Online Badge - Smaller on Mobile */}
                <div className="absolute -bottom-0.5 -right-0.5 min-[375px]:-bottom-1 min-[375px]:-right-1 w-4 h-4 min-[375px]:w-5 min-[375px]:h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 min-[375px]:border-4 border-white shadow-lg"></div>
              </motion.div>
              
              {/* Restaurant Details - Improved Mobile Spacing */}
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg min-[375px]:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-1.5 min-[375px]:mb-2 drop-shadow-lg leading-tight"
                >
                  {settings?.name || 'قائمة المطعم'}
                </motion.h1>
                
                {settings?.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs min-[375px]:text-sm sm:text-base md:text-lg text-white/90 mb-2 min-[375px]:mb-3 line-clamp-2 drop-shadow-md leading-snug"
                  >
                    {settings.description}
                  </motion.p>
                )}

                {/* Address Display - Based on Selected Branch */}
                {(() => {
                  const selectedBranchData = selectedBranch 
                    ? branches.find(b => String(b.id) === String(selectedBranch) || b.id === selectedBranch)
                    : null;
                  const displayAddress = selectedBranchData?.address || settings?.address;
                  
                  // Debug: Log address data
                  if (selectedBranch) {
                    console.log('📍 Branch Address Debug:', {
                      selectedBranch,
                      branches: branches.map(b => ({ id: b.id, name: b.name, address: b.address })),
                      selectedBranchData,
                      displayAddress
                    });
                  }
                  
                  return displayAddress ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="flex items-start gap-1.5 min-[375px]:gap-2 mb-2 min-[375px]:mb-3"
                    >
                      <svg 
                        className="w-3.5 h-3.5 min-[375px]:w-4 min-[375px]:h-4 sm:w-5 sm:h-5 text-white/90 mt-0.5 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-[11px] min-[375px]:text-xs sm:text-sm md:text-base text-white/90 drop-shadow-md line-clamp-2 leading-snug">
                        {displayAddress}
                      </p>
                    </motion.div>
                  ) : null;
                })()}

                {/* Branch Selector - Compact Modern Design - Better Mobile */}
                {branches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="inline-block w-full sm:w-auto"
                  >
                    <select
                      value={selectedBranch || ''}
                      onChange={(e) => {
                        const branchId = e.target.value === '' ? null : e.target.value;
                        handleBranchChange(branchId);
                      }}
                      disabled={isBranchLoading}
                      className={`bg-white/95 backdrop-blur-md text-gray-900 border-0 rounded-lg min-[375px]:rounded-xl sm:rounded-2xl px-3 min-[375px]:px-4 py-1.5 min-[375px]:py-2 sm:px-5 sm:py-2.5 text-xs min-[375px]:text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-lg w-full sm:w-auto ${
                        isBranchLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
                      }`}
                    >
                      <option value="">📍 {i18n.language === 'en' 
                        ? (settings?.mainRestaurantNameEn || 'Main Restaurant')
                        : (settings?.mainRestaurantNameAr || 'المطعم الرئيسي')}</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          📍 {branch.name}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modern Categories and Search Section - Sticky */}
      <div 
        className="sticky top-0 z-40 backdrop-blur-xl shadow-xl border-b"
        style={{
          backgroundColor: theme?.background ? `${theme.background}ED` : 'rgba(255,255,255,0.98)',
          borderColor: theme?.border || '#e5e7eb'
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            
            {/* Branch Indicator */}
            {branches.length > 0 && (
              <div className="flex items-center space-x-3 mb-4 lg:mb-0">
                <div 
                  className="flex items-center rounded-xl px-4 py-2"
                  style={{
                    background: theme?.primary ? `linear-gradient(to right, ${theme.primary}15, ${theme.primary}25)` : undefined
                  }}
                >
                  <svg 
                    className="w-5 h-5 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: theme?.primary || '#3b82f6' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme?.primary || '#3b82f6' }}
                  >
                    {selectedBranch ? 
                      branches.find(b => b.id === selectedBranch)?.name || 
                      (i18n.language === 'en' 
                        ? (settings?.mainRestaurantNameEn || 'Main Restaurant')
                        : (settings?.mainRestaurantNameAr || 'المطعم الرئيسي')) : 
                      (i18n.language === 'en' 
                        ? (settings?.mainRestaurantNameEn || 'Main Restaurant')
                        : (settings?.mainRestaurantNameAr || 'المطعم الرئيسي'))
                    }
                  </span>
                </div>
              </div>
            )}
            
            {/* Categories Filter - Modern Slider */}
            <div className="flex-1 relative">
              {isBranchLoading ? (
                <SkeletonLoader type="category" count={5} />
              ) : (
                <CategorySlider
                  key={`category-slider-${i18n.language}-${categoryNames.join('-')}`}
                  categories={categoryNames}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  theme={theme}
                />
                    )}
            </div>
            
            {/* Modern Search - Always Visible */}
            <div className="relative flex-1 max-w-md" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder={i18n.language === 'en' ? 'Search for a dish, category, or product...' : 'ابحث عن طبق، فئة، أو منتج...'}
                  className="w-full p-3 sm:p-4 pr-12 sm:pr-14 pl-4 text-sm sm:text-base border-2 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  style={{
                    borderColor: isSearchFocused 
                      ? (theme?.primary || '#3b82f6') 
                      : (theme?.border || '#e5e7eb'),
                    color: theme?.text || '#1a1a1a',
                    focusRingColor: theme?.primary ? `${theme.primary}25` : undefined
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: isSearchFocused ? (theme?.primary || '#3b82f6') : '#9ca3af' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Search Results Count - Below input */}
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs sm:text-sm text-center"
                  style={{ color: theme?.textSecondary || '#6b7280' }}
                >
                  {i18n.language === 'en' 
                    ? `${filteredProducts.length} result${filteredProducts.length !== 1 ? 's' : ''} for "${searchQuery}"`
                    : `${filteredProducts.length} نتيجة للبحث عن "${searchQuery}"`
                  }
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Branches Section - Compact */}
      {branches.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 
                className="text-xl sm:text-2xl md:text-3xl font-black"
                style={{ color: theme?.text || '#1a1a1a' }}
              >
                {i18n.language === 'en' ? 'Available Branches' : 'الفروع المتاحة'}
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBranches(!showBranches)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm"
                style={{
                  backgroundColor: theme?.primary ? `${theme.primary}15` : 'rgba(255, 45, 45, 0.15)',
                  color: theme?.primary || '#ff2d2d',
                }}
              >
                {showBranches 
                  ? (i18n.language === 'en' ? 'Hide' : 'إخفاء')
                  : (i18n.language === 'en' ? 'Show All Branches' : 'عرض جميع الفروع')
                }
              </motion.button>
            </div>
            
            {showBranches && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              >
                {branches.map((branch, index) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    theme={theme}
                    onSelect={handleBranchChange}
                    isSelected={selectedBranch === branch.id}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Modern Menu Items Section - Like Talabat */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 sm:py-20"
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: theme?.text || '#1a1a1a' }}>
              {i18n.language === 'en' ? 'No Products Found' : 'لا توجد منتجات'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              {i18n.language === 'en' 
                ? 'Try searching in another category or use different keywords' 
                : 'جرب البحث في فئة أخرى أو استخدم كلمات مختلفة'
              }
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              style={{
                background: theme?.primary 
                  ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})` 
                  : 'linear-gradient(135deg, #ff2d2d, #cc0000)'
              }}
            >
              {i18n.language === 'en' ? 'Show All Products' : 'عرض جميع المنتجات'}
            </button>
          </motion.div>
        ) : isBranchLoading ? (
          <SkeletonLoader type="product" count={6} />
        ) : filteredProducts.length === 0 && productsData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: theme?.text || '#1a1a1a' }}>
              {i18n.language === 'en' ? 'No Products' : 'لا توجد منتجات'}
            </h3>
            <p className="text-sm sm:text-base" style={{ color: theme?.textSecondary || '#6b7280' }}>
              {i18n.language === 'en' 
                ? 'No products available in this branch' 
                : 'لا توجد منتجات متاحة في هذا الفرع'
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-8">
            {filteredProducts.map((product, index) => {
              const productCategoryId = product.category_id || product.categoryId;
              const category = categoriesData.find(cat => cat.id === productCategoryId);
              const isEnglish = i18n.language === 'en';
              const categoryName = category 
                ? (isEnglish 
                    ? (category.name_en || category.nameEn || category.name_ar || category.nameAr || category.name || 'Unspecified')
                    : (category.name_ar || category.nameAr || category.name || 'غير محدد'))
                : (isEnglish ? 'Unspecified' : 'غير محدد');
              // Find cart item - for ProductCard, we'll show the first matching item by product ID
              // (since we can't know which options the user will choose until they open the modal)
              const cartItem = cart.find(item => item.id === product.id);
              
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={categoryName}
                  theme={theme}
                  currency={settings?.currency || 'EGP'}
                  language={i18n.language}
                  onAddToCart={addToCart}
                  onViewDetails={handleViewProduct}
                  cartItem={cartItem}
                  onUpdateQuantity={(itemKey, quantity) => updateQuantity(itemKey, quantity)}
                  index={index}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Floating Cart Button - Like Talabat */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50"
        >
          <motion.button
            onClick={() => setShowCart(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-6 sm:px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 relative overflow-hidden group flex items-center justify-between gap-4 sm:gap-6"
            style={{
              background: theme?.primary 
                ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})`
                : 'linear-gradient(135deg, #ff2d2d, #cc0000)',
              color: '#ffffff'
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <div className="relative">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-black shadow-lg">
                  {getCartItemCount()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm font-medium opacity-90">سلة الطلبات</div>
                <div className="text-base sm:text-lg font-black">
                  {formatPrice(getCartTotal(), settings?.currency || 'EGP', i18n.language)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 relative z-10">
              <span className="text-sm sm:text-base font-bold">اطلب الآن</span>
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Modern Cart Modal - Like Talabat */}
      {showCart && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setShowCart(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-md max-h-[85vh] overflow-hidden bg-white rounded-t-3xl shadow-2xl"
            style={{
              backgroundColor: theme?.cartBg || theme?.background || '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header */}
            <div className="p-4 sm:p-6 border-b-2 bg-gradient-to-r from-gray-50 to-white" style={{ borderColor: theme?.border || '#e5e7eb' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background: theme?.primary 
                        ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})`
                        : 'linear-gradient(135deg, #ff2d2d, #cc0000)'
                    }}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    {getCartItemCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[10px] sm:text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-black shadow-md">
                        {getCartItemCount()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 
                      className="text-xl sm:text-2xl font-black"
                      style={{ color: theme?.cartText || theme?.text || '#1a1a1a' }}
                    >
                      سلة الطلبات
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">{getCartItemCount()} منتج</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Cart Items - Modern Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[55vh]">
              {cart.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-gray-600">السلة فارغة</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">أضف منتجات للسلة لبدء الطلب</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {cart.map((item, index) => {
                    const itemPrice = item.calculatedPrice || item.price || 0;
                    const cartKey = item.cartItemKey || getCartItemKey(item);
                    return (
                      <motion.div
                        key={cartKey || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col gap-3 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 
                              className="font-semibold text-base mb-1"
                              style={{ color: theme?.cartText || theme?.text || '#1a1a1a' }}
                            >
                              {item.name}
                            </h3>
                            
                            {/* Display Selected Options */}
                            <div className="space-y-1 mb-2">
                              {item.selectedSize && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg">
                                  <span className="text-xs">📏</span>
                                  <span className="text-xs font-medium text-gray-700">{item.selectedSize.name}</span>
                                  {item.selectedSize.price && parseFloat(item.selectedSize.price) > 0 && (
                                    <span className="text-xs font-semibold text-blue-600">+{formatPrice(item.selectedSize.price, settings?.currency || 'EGP', i18n.language)}</span>
                                  )}
                                </div>
                              )}
                              {item.selectedWeight && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-lg mr-2">
                                  <span className="text-xs">⚖️</span>
                                  <span className="text-xs font-medium text-gray-700">{item.selectedWeight.name}</span>
                                  {item.selectedWeight.price && parseFloat(item.selectedWeight.price) > 0 && (
                                    <span className="text-xs font-semibold text-purple-600">+{formatPrice(item.selectedWeight.price, settings?.currency || 'EGP', i18n.language)}</span>
                                  )}
                                </div>
                              )}
                              {item.selectedExtras && item.selectedExtras.length > 0 && (
                                <div className="inline-flex flex-wrap items-center gap-1.5">
                                  {item.selectedExtras.map((extra, idx) => (
                                    <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
                                      <span className="text-xs">➕</span>
                                      <span className="text-xs font-medium text-gray-700">{extra.name}</span>
                                      {extra.price && parseFloat(extra.price) > 0 && (
                                        <span className="text-xs font-semibold text-green-600">+{formatPrice(extra.price, settings?.currency || 'EGP', i18n.language)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Price */}
                            <div className="flex items-center gap-2 mt-2">
                              <p 
                                className="font-black text-base sm:text-lg"
                                style={{ color: theme?.primary || '#ff2d2d' }}
                              >
                                {formatPrice(itemPrice * item.quantity, settings?.currency || 'EGP', i18n.language)}
                              </p>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-500 font-medium">
                                  ({formatPrice(itemPrice, settings?.currency || 'EGP', i18n.language)} × {item.quantity})
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {/* Delete Button - Modern */}
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const itemKey = item.cartItemKey || getCartItemKey(item);
                                setCart(prevCart => prevCart.filter(cartItem => {
                                  const cartItemKey = cartItem.cartItemKey || getCartItemKey(cartItem);
                                  return cartItemKey !== itemKey;
                                }));
                              }}
                              className="w-9 h-9 sm:w-10 sm:h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                              title="حذف"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </motion.button>
                            
                            {/* Edit Options Button - Modern */}
                            {(item.selectedSize || item.selectedWeight || (item.selectedExtras && item.selectedExtras.length > 0) || 
                              productsData.find(p => p.id === item.id && ((p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0 && p.sizes.some(s => s && s.name && s.name.trim() !== '')) || 
                                                                          (p.weights && Array.isArray(p.weights) && p.weights.length > 0 && p.weights.some(w => w && w.name && w.name.trim() !== '')) || 
                                                                          (p.extras && Array.isArray(p.extras) && p.extras.length > 0 && p.extras.some(e => e && e.name && e.name.trim() !== ''))))) && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleViewCartItem(item)}
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors shadow-sm"
                                title="تعديل الخيارات"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </motion.button>
                            )}
                          </div>
                        </div>
                        
                        {/* Quantity Controls - Modern */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleViewCartItem(item)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            style={{
                              backgroundColor: theme?.primary ? `${theme.primary}10` : 'rgba(59, 130, 246, 0.1)',
                              color: theme?.primary || '#3b82f6',
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            تعديل
                          </button>
                          
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const itemKey = item.cartItemKey || getCartItemKey(item);
                                updateQuantity(itemKey, item.quantity - 1);
                              }}
                              className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-300 transition-colors font-bold shadow-sm"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                              </svg>
                            </motion.button>
                            
                            <span className="w-10 text-center font-black text-lg sm:text-xl">{item.quantity}</span>
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const itemKey = item.cartItemKey || getCartItemKey(item);
                                updateQuantity(itemKey, item.quantity + 1);
                              }}
                              className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-300 transition-colors font-bold shadow-sm"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modern Footer with Total and Order Button */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-6 border-t-2 bg-gradient-to-r from-gray-50 to-white shadow-lg" style={{ borderColor: theme?.border || '#e5e7eb' }}>
                <div className="flex justify-between items-center mb-4 sm:mb-5">
                  <span 
                    className="text-base sm:text-lg font-black"
                    style={{ color: theme?.cartText || theme?.text || '#1a1a1a' }}
                  >
                    المجموع الإجمالي:
                  </span>
                  <span 
                    className="text-xl sm:text-2xl md:text-3xl font-black"
                    style={{ color: theme?.primary || '#ff2d2d' }}
                  >
                    {formatPrice(getCartTotal(), settings?.currency || 'EGP', i18n.language)}
                  </span>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setShowCart(false);
                    setShowOrderForm(true);
                  }}
                  className="w-full px-6 py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg text-white transition-all duration-300 shadow-xl flex items-center justify-center gap-3 relative overflow-hidden group"
                  style={{
                    background: theme?.primary 
                      ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})`
                      : 'linear-gradient(135deg, #ff2d2d, #cc0000)'
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <span className="relative z-10">إتمام الطلب</span>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden"
            style={{ backgroundColor: theme?.background || '#ffffff' }}
          >
            <div className="p-6 border-b" style={{ borderColor: theme?.border || '#e5e7eb' }}>
              <h2 
                className="text-2xl font-bold"
                style={{ color: theme?.text || '#1a1a1a' }}
              >
                إتمام الطلب
              </h2>
            </div>

            <form onSubmit={handleOrderSubmit} className="p-6 space-y-4" style={{ backgroundColor: theme?.background || '#ffffff' }}>
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme?.text || '#1a1a1a' }}
                >
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  className="w-full p-3 border rounded-2xl focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: theme?.border || '#e5e7eb',
                    color: theme?.text || '#1a1a1a',
                    '--tw-ring-color': theme?.primary || '#ff2d2d'
                  }}
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme?.text || '#1a1a1a' }}
                >
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  required
                  value={orderForm.customerPhone}
                  onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                  className="w-full p-3 border rounded-2xl focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: theme?.border || '#e5e7eb',
                    color: theme?.text || '#1a1a1a',
                    '--tw-ring-color': theme?.primary || '#ff2d2d'
                  }}
                  placeholder="01234567890"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme?.text || '#1a1a1a' }}
                >
                  العنوان
                </label>
                <textarea
                  value={orderForm.customerAddress}
                  onChange={(e) => setOrderForm({ ...orderForm, customerAddress: e.target.value })}
                  className="w-full p-3 border rounded-2xl focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: theme?.border || '#e5e7eb',
                    color: theme?.text || '#1a1a1a',
                    '--tw-ring-color': theme?.primary || '#ff2d2d'
                  }}
                  rows="3"
                  placeholder="عنوان التسليم (اختياري)"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme?.text || '#1a1a1a' }}
                >
                  ملاحظات إضافية
                </label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="w-full p-3 border rounded-2xl focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: theme?.border || '#e5e7eb',
                    color: theme?.text || '#1a1a1a',
                    '--tw-ring-color': theme?.primary || '#ff2d2d'
                  }}
                  rows="3"
                  placeholder="أي ملاحظات خاصة بالطلب"
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="px-6 py-3 rounded-2xl transition-colors"
                  style={{
                    backgroundColor: theme?.surface || '#fafafa',
                    color: theme?.text || '#1a1a1a'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl transition-colors"
                  style={{
                    backgroundColor: loading ? '#d1d5db' : (theme?.buttonBg || theme?.primary || '#ff2d2d'),
                    color: theme?.buttonText || '#ffffff'
                  }}
                >
                  {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Compact Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            
            {/* Restaurant Name and Language */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: theme?.primary ? `linear-gradient(to right, ${theme.primary}, ${theme.secondary || theme.primary})` : undefined
                  }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {settings?.name || 'قائمة المطعم'}
                </h3>
              </div>
              
              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
              >
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: theme?.primary ? `${theme.primary}30` : undefined }}
                >
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: theme?.primary || '#60a5fa' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <span className="text-white font-medium text-sm">
                  {i18n.language === 'en' ? 'العربية' : 'English'}
                </span>
              </button>
            </div>
            
            {/* Contact Info */}
            <div className="flex items-center space-x-6 text-sm text-gray-300">
              {settings?.phone && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{settings.phone}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>متاح 24/7</span>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-6 pt-4 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {settings?.name || 'قائمة المطعم'}. جميع الحقوق محفوظة
            </p>
            <p className="text-gray-500 text-xs mt-1">
              مدعوم بواسطة <span 
                className="font-semibold"
                style={{ color: theme?.primary || '#60a5fa' }}
              >
                QR Menu
              </span>
            </p>
          </div>
        </div>
      </footer>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct && selectedProduct._cartItem ? {
          ...selectedProduct,
          // Remove the _cartItem flag before passing to modal
          _cartItem: undefined
        } : selectedProduct}
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
        }}
        onAddToCart={(product, quantity = 1) => {
          // If this is an update from cart, remove old item first
          if (selectedProduct?._cartItem) {
            const oldCartItem = selectedProduct._cartItem;
            const oldItemKey = oldCartItem.cartItemKey || getCartItemKey(oldCartItem);
            setCart(prevCart => {
              return prevCart.filter(item => {
                const itemKey = item.cartItemKey || getCartItemKey(item);
                return itemKey !== oldItemKey;
              });
            });
          }
          // Add new/updated item
          addToCart(product, quantity);
        }}
        cartItem={selectedProduct ? (() => {
          // If product has _cartItem, use it (editing from cart)
          if (selectedProduct._cartItem) {
            console.log('✅ Using _cartItem from selectedProduct:', selectedProduct._cartItem);
            return selectedProduct._cartItem;
          }
          // Otherwise find cart item by matching product ID
          const matchingItems = cart.filter(item => item.id === selectedProduct.id);
          console.log('🔍 Looking for cart item:', {
            productId: selectedProduct.id,
            matchingItemsCount: matchingItems.length,
            matchingItems: matchingItems
          });
          // Return the first match (ProductModal will show the correct one based on current selections)
          const foundItem = matchingItems.length > 0 ? matchingItems[0] : null;
          console.log('📦 Found cart item:', foundItem);
          return foundItem;
        })() : null}
        onUpdateQuantity={updateQuantity}
        theme={theme}
        currency={settings?.currency || 'EGP'}
        language={i18n.language}
        categoryName={selectedProduct ? (() => {
          const productCategoryId = selectedProduct.category_id || selectedProduct.categoryId;
          const category = categoriesData.find(cat => cat.id === productCategoryId);
          return category?.name_ar || category?.nameAr || category?.name || null;
        })() : null}
      />

      {/* Order Confirmation Modal */}
      {showOrderConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-3xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 scale-100"
            style={{ backgroundColor: theme?.background || '#ffffff' }}
          >
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Success Message */}
              <h2 
                className="text-2xl font-bold mb-4"
                style={{ color: theme?.text || '#1a1a1a' }}
              >
                تم إرسال الطلب بنجاح! 🎉
              </h2>
              
              {/* Order Number */}
              <div 
                className="rounded-2xl p-6 mb-6"
                style={{ backgroundColor: theme?.surface || '#f9fafb' }}
              >
                <p 
                  className="text-sm mb-2"
                  style={{ color: theme?.textSecondary || '#6b7280' }}
                >
                  رقم طلبك
                </p>
                <p 
                  className="text-3xl font-bold font-mono"
                  style={{ color: theme?.primary || '#ff2d2d' }}
                >
                  {orderNumber}
                </p>
                <p 
                  className="text-sm mt-2"
                  style={{ color: theme?.textSecondary || '#6b7280' }}
                >
                  احتفظ برقم الطلب للمتابعة
                </p>
              </div>
              
              {/* Additional Info */}
              <div 
                className="space-y-3 text-sm"
                style={{ color: theme?.textSecondary || '#6b7280' }}
              >
                <p>✅ سنتواصل معك قريباً لتأكيد الطلب</p>
                <p>⏰ وقت التحضير المتوقع: 30-45 دقيقة</p>
                <p>📞 في حالة الاستفسار، استخدم رقم الطلب أعلاه</p>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setShowOrderConfirmation(false)}
                className="mt-8 w-full text-white py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{
                  background: theme?.primary ? `linear-gradient(to right, ${theme.primary}, ${theme.accent || theme.primary})` : undefined
                }}
              >
                شكراً لك! 😊
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Installer */}
      {settings && (
        <PWAInstaller 
          restaurantSettings={settings}
          theme={theme}
          selectedBranch={selectedBranch ? branches.find(b => b.id === selectedBranch) : null}
        />
      )}
    </div>
  );
};

export default CustomerMenu;