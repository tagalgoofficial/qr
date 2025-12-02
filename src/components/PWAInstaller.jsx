import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateManifest } from '../utils/pwaUtils';
import { getImageUrl } from '../utils/imageUtils';

const PWAInstaller = ({ restaurantSettings, theme, selectedBranch = null }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check if running as PWA
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setIsStandalone(true);
        return;
      }
      
      // Check iOS standalone mode
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        setIsStandalone(true);
        return;
      }

      setIsInstalled(false);
    };

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
      setIsIOS(isIOSDevice);
      
      if (isIOSDevice && !isInStandaloneMode) {
        setShowInstallButton(true);
      }
    };

    checkInstalled();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check again after a delay
    const timer = setTimeout(() => {
      checkInstalled();
      checkIOS();
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [restaurantSettings, theme]);

  // Update manifest when settings, theme, or selected branch change
  useEffect(() => {
    if (restaurantSettings || theme) {
      // Include branch address in settings if available
      const settingsWithBranch = selectedBranch && selectedBranch.address
        ? { ...restaurantSettings, address: selectedBranch.address }
        : restaurantSettings;
      
      // Get current URL path
      const currentUrl = window.location.pathname;
      updateManifest(settingsWithBranch, theme, currentUrl);
    }
  }, [restaurantSettings, theme, selectedBranch]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showInstallButton) {
    return null;
  }

  const restaurantName = restaurantSettings?.name || 'المطعم';
  const restaurantLogo = restaurantSettings?.logo ? getImageUrl(restaurantSettings.logo) : '/Logo-MR-QR.svg';
  const primaryColor = theme?.primary || '#ff2d2d';
  
  // Get address - prefer branch address, then restaurant address
  const displayAddress = selectedBranch?.address || restaurantSettings?.address || null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 border-2 overflow-hidden"
          style={{
            borderColor: primaryColor,
            boxShadow: `0 8px 32px ${primaryColor}40`
          }}
        >
          {isIOS ? (
            // iOS Install Instructions
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <img 
                    src={restaurantLogo} 
                    alt={restaurantName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/Logo-MR-QR.svg';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg" style={{ color: primaryColor }}>
                    {restaurantName}
                  </h3>
                  {displayAddress && (
                    <div className="flex items-start gap-1 mt-1">
                      <svg 
                        className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                        {displayAddress}
                      </p>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
                    ثبت التطبيق على جهازك
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold">1.</span>
                  <span>اضغط على</span>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: primaryColor }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold">2.</span>
                  <span>اختر "إضافة إلى الشاشة الرئيسية"</span>
                </div>
              </div>

              <button
                onClick={() => setShowInstallButton(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            // Android/Desktop Install Button
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <img 
                    src={restaurantLogo} 
                    alt={restaurantName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/Logo-MR-QR.svg';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg" style={{ color: primaryColor }}>
                    {restaurantName}
                  </h3>
                  {displayAddress && (
                    <div className="flex items-start gap-1 mt-1">
                      <svg 
                        className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                        {displayAddress}
                      </p>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
                    ثبت التطبيق على جهازك للوصول السريع
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleInstallClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl font-bold text-white text-sm sm:text-base shadow-lg transition-all duration-300 flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                تثبيت التطبيق
              </motion.button>

              <button
                onClick={() => setShowInstallButton(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstaller;

