import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../contexts/authStore';
import useSettingsStore from '../../contexts/settingsStore';
import { getCurrencyOptions } from '../../utils/currencies';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

const SuperAdminSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    settings,
    loading,
    error,
    statistics,
    loadSettings,
    updateSettings,
    resetSettings,
    updateSetting,
    toggleMaintenanceMode,
    updateTrialSettings,
    updateSecuritySettings,
    updateEmailSettings,
    updatePaymentSettings,
    updateNotificationSettings,
    updateBackupSettings,
    updateFeatureFlags,
    loadStatistics,
    clearError
  } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState('');
  const [localSettings, setLocalSettings] = useState(null);
  
  // Load settings on component mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        await loadSettings();
        await loadStatistics();
      } catch (error) {
        console.error('Error initializing settings:', error);
      }
    };
    
    initializeSettings();
  }, [loadSettings, loadStatistics]);
  
  // Update local settings when settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    } else {
      // Initialize with default settings if none exist
      setLocalSettings({
        general: {
          siteName: 'QR Menu System',
          siteDescription: 'نظام إدارة قوائم الطعام الرقمية',
          defaultLanguage: 'ar',
          timezone: 'Asia/Riyadh',
          currency: 'EGP',
          logoUrl: '',
          faviconUrl: ''
        },
        trial: {
          trialPeriodDays: 30,
          trialFeatures: ['basic_menu', 'qr_generation', 'analytics_basic'],
          trialLimits: {
            maxMenuItems: 50,
            maxCategories: 10,
            maxBranches: 1,
            maxUsers: 1
          }
        },
        security: {
          passwordMinLength: 8,
          requireSpecialChars: true,
          sessionTimeout: 30,
          twoFactorAuth: false,
          loginAttemptsLimit: 5,
          lockoutTime: 30
        },
        email: {
          smtpHost: '',
          smtpPort: 587,
          smtpUsername: '',
          smtpPassword: '',
          fromEmail: 'noreply@qrmenu.com',
          fromName: 'QR Menu System'
        },
        payment: {
          stripePublicKey: '',
          stripeSecretKey: '',
          paypalClientId: '',
          paypalClientSecret: ''
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true
        },
        maintenance: {
          maintenanceMode: false,
          maintenanceMessage: 'النظام قيد الصيانة، يرجى المحاولة لاحقاً'
        },
        backup: {
          autoBackup: true,
          backupFrequency: 'daily',
          backupRetention: 30
        },
        featureFlags: {
          customerLogin: true,
          superAdminLogin: true,
          restaurantLogin: true,
          multiLanguageSupport: true,
          onlineOrdering: true,
          tableOrdering: true,
          deliveryIntegration: false,
          pickupIntegration: false
        }
      });
    }
  }, [settings]);
  
  const handleSave = async () => {
    if (!localSettings) return;
    
    try {
      const success = await updateSettings(localSettings, user?.uid);
      if (success) {
      setMessage('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('حدث خطأ أثناء حفظ الإعدادات');
        setTimeout(() => setMessage(''), 3000);
      }
      } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('حدث خطأ أثناء حفظ الإعدادات');
      setTimeout(() => setMessage(''), 3000);
      }
    };
    
  const handleReset = async () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      try {
        const success = await resetSettings(user?.uid);
        if (success) {
      setMessage('تم إعادة تعيين الإعدادات');
      setTimeout(() => setMessage(''), 3000);
        } else {
          setMessage('حدث خطأ أثناء إعادة تعيين الإعدادات');
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        setMessage('حدث خطأ أثناء إعادة تعيين الإعدادات');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };
  
  const handleSettingChange = (key, value) => {
    if (localSettings) {
      setLocalSettings(prev => {
        const newSettings = {
          ...prev,
          [key]: value
        };
        console.log('Updated setting:', key, value);
        return newSettings;
      });
    }
  };
  
  const handleNestedSettingChange = (parentKey, childKey, value) => {
    if (localSettings) {
      setLocalSettings(prev => {
        const newSettings = {
          ...prev,
          [parentKey]: {
            ...(prev[parentKey] || {}),
            [childKey]: value
          }
        };
        console.log('Updated nested setting:', parentKey, childKey, value, newSettings[parentKey]);
        return newSettings;
      });
    }
  };
  
  const tabs = [
    { id: 'general', name: 'عام', icon: '⚙️' },
    { id: 'trial', name: 'إعدادات التجربة', icon: '🆓' },
    { id: 'security', name: 'الأمان', icon: '🔒' },
    { id: 'email', name: 'البريد الإلكتروني', icon: '📧' },
    { id: 'payment', name: 'المدفوعات', icon: '💳' },
    { id: 'notifications', name: 'الإشعارات', icon: '🔔' },
    { id: 'maintenance', name: 'الصيانة', icon: '🔧' },
    { id: 'backup', name: 'النسخ الاحتياطي', icon: '💾' }
  ];
  
  const renderTrialSettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">إعدادات الفترة التجريبية</h3>
        <p className="text-gray-600 mb-6">قم بتكوين إعدادات الفترة التجريبية للمطاعم الجديدة</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مدة التجربة (بالأيام)
            </label>
            <input
              type="number"
              min="1"
              max="365"
                value={localSettings.trialPeriodDays || 30}
                onChange={(e) => handleSettingChange('trialPeriodDays', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحد الأقصى لعناصر القائمة
            </label>
            <input
              type="number"
              min="1"
              max="1000"
                value={localSettings.trialLimits?.maxMenuItems || 50}
                onChange={(e) => handleNestedSettingChange('trialLimits', 'maxMenuItems', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحد الأقصى للفئات
            </label>
            <input
              type="number"
              min="1"
              max="50"
                value={localSettings.trialLimits?.maxCategories || 10}
                onChange={(e) => handleNestedSettingChange('trialLimits', 'maxCategories', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحد الأقصى للفروع
            </label>
            <input
              type="number"
              min="1"
              max="10"
                value={localSettings.trialLimits?.maxBranches || 1}
                onChange={(e) => handleNestedSettingChange('trialLimits', 'maxBranches', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            الميزات المتاحة في التجربة
          </label>
          <div className="space-y-3">
            {[
              { id: 'basic_menu', name: 'إدارة القائمة الأساسية', description: 'إضافة وتعديل عناصر القائمة' },
              { id: 'qr_generation', name: 'إنشاء رمز QR', description: 'إنشاء رموز QR للقائمة' },
              { id: 'analytics_basic', name: 'التحليلات الأساسية', description: 'عرض إحصائيات بسيطة' },
              { id: 'customization', name: 'التخصيص الأساسي', description: 'تخصيص الألوان والشعار' },
              { id: 'orders', name: 'إدارة الطلبات', description: 'استقبال وإدارة طلبات العملاء' }
            ].map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">{feature.name}</h4>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
                <input
                  type="checkbox"
                    checked={localSettings.trialFeatures?.includes(feature.id) || false}
                  onChange={(e) => {
                      const currentFeatures = localSettings.trialFeatures || [];
                    if (e.target.checked) {
                        handleSettingChange('trialFeatures', [...currentFeatures, feature.id]);
                    } else {
                        handleSettingChange('trialFeatures', currentFeatures.filter(f => f !== feature.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderGeneralSettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم الموقع
            </label>
            <input
              type="text"
              value={localSettings.siteName || ''}
              onChange={(e) => handleSettingChange('siteName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العملة الافتراضية
            </label>
            <select
              value={localSettings.currency || 'EGP'}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getCurrencyOptions('ar').map(currency => (
                <option key={currency.value} value={currency.value}>
                  {currency.label} ({currency.value})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            وصف الموقع
          </label>
          <textarea
            value={localSettings.siteDescription || ''}
            onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اللغة الافتراضية
            </label>
            <select
              value={localSettings.defaultLanguage || 'ar'}
              onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المنطقة الزمنية
            </label>
            <select
              value={localSettings.timezone || 'Asia/Riyadh'}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Asia/Riyadh">الرياض (GMT+3)</option>
              <option value="Asia/Dubai">دبي (GMT+4)</option>
              <option value="Europe/London">لندن (GMT+0)</option>
              <option value="America/New_York">نيويورك (GMT-5)</option>
            </select>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSecuritySettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحد الأدنى لطول كلمة المرور
            </label>
            <input
              type="number"
              value={localSettings.passwordMinLength || 8}
              onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="6"
              max="20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              انتهاء صلاحية الجلسة (بالدقائق)
            </label>
            <input
              type="number"
              value={localSettings.sessionTimeout || 30}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="5"
              max="480"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireSpecialChars"
              checked={localSettings.requireSpecialChars || false}
              onChange={(e) => handleSettingChange('requireSpecialChars', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requireSpecialChars" className="mr-2 block text-sm text-gray-900">
              تتطلب كلمة المرور أحرف خاصة
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactorAuth"
              checked={localSettings.twoFactorAuth || false}
              onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="twoFactorAuth" className="mr-2 block text-sm text-gray-900">
              تفعيل المصادقة الثنائية
            </label>
          </div>
        </div>
      </div>
    );
  };
  
  const renderEmailSettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              خادم SMTP
            </label>
            <input
              type="text"
              value={localSettings.smtpHost || ''}
              onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              منفذ SMTP
            </label>
            <input
              type="number"
              value={localSettings.smtpPort || 587}
              onChange={(e) => handleSettingChange('smtpPort', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="587"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={localSettings.smtpUsername || ''}
              onChange={(e) => handleSettingChange('smtpUsername', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={localSettings.smtpPassword || ''}
              onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني المرسل
            </label>
            <input
              type="email"
              value={localSettings.fromEmail || ''}
              onChange={(e) => handleSettingChange('fromEmail', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المرسل
            </label>
            <input
              type="text"
              value={localSettings.fromName || ''}
              onChange={(e) => handleSettingChange('fromName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    );
  };
  
  const renderPaymentSettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">إعدادات Stripe</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المفتاح العام
              </label>
              <input
                type="text"
                value={localSettings.stripePublicKey || ''}
                onChange={(e) => handleSettingChange('stripePublicKey', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="pk_test_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المفتاح السري
              </label>
              <input
                type="password"
                value={localSettings.stripeSecretKey || ''}
                onChange={(e) => handleSettingChange('stripeSecretKey', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk_test_..."
              />
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">إعدادات PayPal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                معرف العميل
              </label>
              <input
                type="text"
                value={localSettings.paypalClientId || ''}
                onChange={(e) => handleSettingChange('paypalClientId', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سر العميل
              </label>
              <input
                type="password"
                value={localSettings.paypalClientSecret || ''}
                onChange={(e) => handleSettingChange('paypalClientSecret', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
          
  const renderNotificationSettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={localSettings.emailNotifications || false}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emailNotifications" className="mr-2 block text-sm text-gray-900">
              تفعيل الإشعارات عبر البريد الإلكتروني
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smsNotifications"
              checked={localSettings.smsNotifications || false}
              onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="smsNotifications" className="mr-2 block text-sm text-gray-900">
              تفعيل الإشعارات عبر الرسائل النصية
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pushNotifications"
              checked={localSettings.pushNotifications || false}
              onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="pushNotifications" className="mr-2 block text-sm text-gray-900">
              تفعيل الإشعارات الفورية
            </label>
          </div>
        </div>
      </div>
    );
  };
  
  const renderMaintenanceSettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="maintenanceMode"
            checked={localSettings.maintenanceMode || false}
            onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="maintenanceMode" className="mr-2 block text-sm text-gray-900">
            تفعيل وضع الصيانة
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رسالة الصيانة
          </label>
          <textarea
            value={localSettings.maintenanceMessage || ''}
            onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </div>
    );
  };
  
  const renderBackupSettings = () => {
    if (!localSettings) return <div>جاري التحميل...</div>;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoBackup"
            checked={localSettings.autoBackup || false}
            onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoBackup" className="mr-2 block text-sm text-gray-900">
            تفعيل النسخ الاحتياطي التلقائي
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تكرار النسخ الاحتياطي
            </label>
            <select
              value={localSettings.backupFrequency || 'daily'}
              onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مدة الاحتفاظ (بالأيام)
            </label>
            <input
              type="number"
              value={localSettings.backupRetention || 30}
              onChange={(e) => handleSettingChange('backupRetention', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="365"
            />
          </div>
        </div>
      </div>
    );
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'trial':
        return renderTrialSettings();
      case 'security':
        return renderSecuritySettings();
      case 'email':
        return renderEmailSettings();
      case 'payment':
        return renderPaymentSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'maintenance':
        return renderMaintenanceSettings();
      case 'backup':
        return renderBackupSettings();
      default:
        return renderGeneralSettings();
    }
  };
  
  return (
    <SuperAdminLayout>
      <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-3xl p-8 text-white shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute w-40 h-40 bg-white/10 rounded-full -top-10 -left-10 animate-float"></div>
            <div className="absolute w-32 h-32 bg-white/5 rounded-full top-1/3 right-12 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute w-48 h-48 bg-white/10 rounded-full -bottom-16 -right-16 animate-float" style={{animationDelay: '4s'}}></div>
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold mb-3 animate-fadeIn">
                إعدادات النظام
              </h1>
              <p className="text-amber-100 text-lg mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}>
                إدارة إعدادات النظام العامة والمتقدمة
              </p>
              
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn" style={{animationDelay: '0.4s'}}>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{tabs.length}</div>
                  <div className="text-xs text-amber-100">أقسام الإعدادات</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{localSettings?.maintenanceMode ? 'مغلق' : 'مفتوح'}</div>
                  <div className="text-xs text-amber-100">حالة النظام</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{localSettings?.autoBackup ? 'نعم' : 'لا'}</div>
                  <div className="text-xs text-amber-100">نسخ احتياطي</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{localSettings?.twoFactorAuth ? 'مفعل' : 'معطل'}</div>
                  <div className="text-xs text-amber-100">المصادقة الثنائية</div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6 lg:mt-0 lg:ml-8 animate-fadeIn" style={{animationDelay: '0.6s'}}>
              <button
                onClick={handleReset}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium hover:bg-white/30 transition-colors duration-200"
              >
                إعادة تعيين
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-white text-amber-600 px-6 py-2 rounded-xl font-semibold hover:bg-amber-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">أقسام الإعدادات</h3>
                <p className="text-sm text-gray-500">اختر القسم الذي تريد تعديله</p>
              </div>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-right px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gray-100 hover:transform hover:scale-105'
                    }`}
                  >
                    <span className="text-lg mr-3">{tab.icon}</span>
                    {tab.name}
                    {activeTab === tab.id && (
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.includes('نجاح') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}
              
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800">
                  {error}
                  <button 
                    onClick={clearError}
                    className="mr-2 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {loading && (
                <div className="mb-6 p-4 rounded-lg bg-blue-100 text-blue-800">
                  جاري التحميل...
                </div>
              )}
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="text-gray-600">
                  {activeTab === 'general' && 'إعدادات النظام العامة'}
                  {activeTab === 'trial' && 'إعدادات الفترة التجريبية'}
                  {activeTab === 'security' && 'إعدادات الأمان والحماية'}
                  {activeTab === 'email' && 'إعدادات البريد الإلكتروني'}
                  {activeTab === 'payment' && 'إعدادات المدفوعات'}
                  {activeTab === 'notifications' && 'إعدادات الإشعارات'}
                  {activeTab === 'maintenance' && 'إعدادات الصيانة'}
                  {activeTab === 'backup' && 'إعدادات النسخ الاحتياطي'}
                </p>
              </div>
              
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;