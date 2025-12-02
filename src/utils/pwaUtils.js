// PWA Utilities for dynamic manifest generation

/**
 * Generate manifest.json dynamically based on restaurant settings
 */
export const generateManifest = (restaurantSettings = null, theme = null, currentUrl = null) => {
  const isRestaurantMenu = !!restaurantSettings;
  
  // Get current path for start_url - use the full current URL path
  const currentPath = currentUrl || window.location.pathname;
  const pathParts = currentPath.split('/').filter(p => p);
  
  // Build start_url with full restaurant URL including branch if exists
  // Use the current path which should be /menu/:restaurantId or /menu/:restaurantId/:branchId
  let startUrl = '/';
  if (isRestaurantMenu) {
    // Get the current pathname
    const pathname = currentPath || window.location.pathname;
    
    // Check if path starts with /menu/ (restaurant menu path)
    if (pathname.startsWith('/menu/')) {
      // Use the full path including branch ID if exists
      startUrl = pathname;
      // Remove trailing slash if exists
      if (startUrl.endsWith('/') && startUrl.length > 1) {
        startUrl = startUrl.slice(0, -1);
      }
    } else {
      // Fallback: try to construct from path parts
      const pathParts = pathname.split('/').filter(p => p);
      if (pathParts.length >= 2 && pathParts[0] === 'menu') {
        startUrl = `/${pathParts[0]}/${pathParts[1]}`;
        // Include branch ID if present
        if (pathParts.length >= 3) {
          startUrl = `/${pathParts[0]}/${pathParts[1]}/${pathParts[2]}`;
        }
      }
    }
  }
  
  const logo = restaurantSettings?.logo || '/Logo-MR-QR.svg';
  // Always use restaurant name if settings exist, never fallback to "QR Menu"
  const name = isRestaurantMenu 
    ? (restaurantSettings.name || restaurantSettings?.restaurant_name || 'قائمة المطعم')
    : 'QR Menu';
  const shortName = isRestaurantMenu
    ? (restaurantSettings.name?.substring(0, 12) || restaurantSettings?.restaurant_name?.substring(0, 12) || 'المنيو')
    : 'QR Menu';
  const themeColor = theme?.primary || restaurantSettings?.theme?.primary || '#ff2d2d';
  
  // Get address/location
  const address = restaurantSettings?.address || '';
  const description = isRestaurantMenu
    ? address
      ? `${name} - ${address}`
      : (restaurantSettings.description || `قائمة طعام ${name}`)
    : 'نظام قوائم الطعام الرقمية';
  
  const manifest = {
    name: name,
    short_name: shortName,
    description: description,
    start_url: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    orientation: 'portrait-primary',
    icons: [
      {
        src: logo,
        sizes: '192x192',
        type: logo.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
        purpose: 'any maskable'
      },
      {
        src: logo,
        sizes: '512x512',
        type: logo.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
        purpose: 'any maskable'
      }
    ]
  };

  // Debug: Log manifest for restaurant menus
  if (isRestaurantMenu && process.env.NODE_ENV === 'development') {
    console.log('📱 PWA Manifest generated:', {
      name: manifest.name,
      short_name: manifest.short_name,
      start_url: manifest.start_url,
      description: manifest.description
    });
  }

  return manifest;
};

/**
 * Update manifest link in document head
 */
export const updateManifest = (restaurantSettings = null, theme = null, currentUrl = null) => {
  // Remove existing manifest link
  const existingManifest = document.querySelector('link[rel="manifest"]');
  if (existingManifest) {
    // Clean up old blob URL if it exists
    const oldHref = existingManifest.href;
    if (oldHref.startsWith('blob:')) {
      URL.revokeObjectURL(oldHref);
    }
    existingManifest.remove();
  }

  // Create new manifest with current URL
  const manifest = generateManifest(restaurantSettings, theme, currentUrl || window.location.pathname);
  
  // Create blob URL for manifest
  const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json'
  });
  const manifestUrl = URL.createObjectURL(manifestBlob);

  // Create and add manifest link
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = manifestUrl;
  document.head.appendChild(manifestLink);

  // Update theme color
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = manifest.theme_color;

  // Update apple mobile web app title
  let appNameMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appNameMeta) {
    appNameMeta = document.createElement('meta');
    appNameMeta.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appNameMeta);
  }
  appNameMeta.content = manifest.short_name;

  // Update apple touch icon
  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = manifest.icons[0].src;

  // Update title - always use restaurant name, not system name
  if (restaurantSettings) {
    const restaurantName = restaurantSettings.name || restaurantSettings?.restaurant_name || 'قائمة المطعم';
    const address = restaurantSettings?.address || '';
    document.title = address 
      ? `${restaurantName} - ${address}`
      : restaurantName;
  } else {
    document.title = manifest.name;
  }

  return manifestUrl;
};

/**
 * Register service worker
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Check if app is installable
 */
export const isInstallable = () => {
  // Check if beforeinstallprompt event is supported
  return 'BeforeInstallPromptEvent' in window || 
         (navigator.standalone === false && 
          window.matchMedia('(display-mode: standalone)').matches === false);
};

