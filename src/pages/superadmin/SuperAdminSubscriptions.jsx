import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSuperAdminStore from '../../contexts/superAdminStore';
import { getCurrencyOptions } from '../../utils/currencies';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';

const SuperAdminSubscriptions = () => {
  const { t } = useTranslation();
  const { 
    subscriptionPlans, 
    loading, 
    error, 
    fetchSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan
  } = useSuperAdminStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: 0,
    currency: 'EGP',
    duration: 30,
    features: [],
    featuresEn: [],
    limits: {
      maxProducts: 0,
      maxCategories: 0,
      maxBranches: 0,
      maxUsers: 0,
      analyticsRetention: 0,
      themeCustomization: false,
      advancedAnalytics: false,
      apiAccess: false,
      prioritySupport: false,
      customDomain: false,
      whiteLabel: false,
      multiLanguage: false,
      exportData: false,
      backupRestore: false
    }
  });
  
  useEffect(() => {
    fetchSubscriptionPlans();
  }, [fetchSubscriptionPlans]);
  
  const handleCreate = () => {
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      price: 0,
      currency: 'EGP',
      duration: 30,
      features: [],
      featuresEn: [],
      limits: {
        maxProducts: 0,
        maxCategories: 0,
        maxBranches: 0,
        maxUsers: 0,
        analyticsRetention: 0,
        themeCustomization: false,
        advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
        customDomain: false,
        whiteLabel: false,
        multiLanguage: false,
        exportData: false,
        backupRestore: false
      }
    });
    setIsCreateModalOpen(true);
  };
  
  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    
    // Convert features to array if it's an object
    let featuresArray = [];
    if (Array.isArray(plan.features)) {
      featuresArray = plan.features;
    } else if (plan.features && typeof plan.features === 'object') {
      // Convert object to array of feature names
      featuresArray = Object.entries(plan.features)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
    }
    
    let featuresEnArray = [];
    if (Array.isArray(plan.featuresEn)) {
      featuresEnArray = plan.featuresEn;
    } else if (plan.featuresEn && typeof plan.featuresEn === 'object') {
      featuresEnArray = Object.entries(plan.featuresEn)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
    }
    
    setFormData({
      name: plan.name || '',
      nameEn: plan.nameEn || plan.name_ar || '',
      description: plan.description || '',
      descriptionEn: plan.descriptionEn || '',
      price: plan.price || 0,
      currency: plan.currency || 'EGP',
      duration: plan.duration || plan.duration_days || 30,
      features: featuresArray,
      featuresEn: featuresEnArray,
      limits: plan.limits || {
        maxProducts: 0,
        maxCategories: 0,
        maxBranches: 0,
        maxUsers: 0,
        analyticsRetention: 0,
        themeCustomization: false,
        advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
        customDomain: false,
        whiteLabel: false,
        multiLanguage: false,
        exportData: false,
        backupRestore: false
      }
    });
    setIsEditModalOpen(true);
  };
  
  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const addFeatureEn = () => {
    setFormData({
      ...formData,
      featuresEn: [...formData.featuresEn, '']
    });
  };

  const removeFeatureEn = (index) => {
    setFormData({
      ...formData,
      featuresEn: formData.featuresEn.filter((_, i) => i !== index)
    });
  };

  const updateFeatureEn = (index, value) => {
    const newFeaturesEn = [...formData.featuresEn];
    newFeaturesEn[index] = value;
    setFormData({
      ...formData,
      featuresEn: newFeaturesEn
    });
  };

  const handleSubmit = async () => {
    try {
      if (isCreateModalOpen) {
        // Refresh plans after creation
        await createSubscriptionPlan(formData);
        await fetchSubscriptionPlans();
        setIsCreateModalOpen(false);
      } else {
        // Refresh plans after update
        await updateSubscriptionPlan(selectedPlan.id, formData);
        await fetchSubscriptionPlans();
        setIsEditModalOpen(false);
      }
      setFormData({
        name: '',
        nameEn: '',
        description: '',
        descriptionEn: '',
        price: 0,
        currency: 'EGP',
        duration: 30,
        features: [],
        featuresEn: [],
        limits: {
          maxProducts: 0,
          maxCategories: 0,
          maxBranches: 0,
          maxUsers: 0,
          analyticsRetention: 0,
          themeCustomization: false,
          advancedAnalytics: false,
          apiAccess: false,
          prioritySupport: false,
          customDomain: false,
          whiteLabel: false,
          multiLanguage: false,
          exportData: false,
          backupRestore: false
        }
      });
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };
  
  const handleDelete = async (planId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      try {
        await deleteSubscriptionPlan(planId);
        await fetchSubscriptionPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل خطط الاشتراك...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }
  
  return (
    <SuperAdminLayout>
      <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 text-white shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute w-36 h-36 bg-white/10 rounded-full -top-6 -left-6 animate-float"></div>
            <div className="absolute w-28 h-28 bg-white/5 rounded-full top-1/4 right-16 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute w-44 h-44 bg-white/10 rounded-full -bottom-14 -right-14 animate-float" style={{animationDelay: '4s'}}></div>
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold mb-3 animate-fadeIn">
                إدارة الاشتراكات
              </h1>
              <p className="text-violet-100 text-lg mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}>
                إدارة خطط الاشتراك المتاحة للمطاعم وتخصيص الميزات
              </p>
              
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fadeIn" style={{animationDelay: '0.4s'}}>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{subscriptionPlans.length}</div>
                  <div className="text-xs text-violet-100">إجمالي الخطط</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{subscriptionPlans.filter(p => p.isActive).length}</div>
                  <div className="text-xs text-violet-100">نشطة</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{subscriptionPlans.filter(p => p.isPopular).length}</div>
                  <div className="text-xs text-violet-100">شائعة</div>
                </div>
              </div>
            </div>
            
            {/* Action button */}
            <div className="mt-6 lg:mt-0 lg:ml-8 animate-fadeIn" style={{animationDelay: '0.6s'}}>
              <button
                onClick={handleCreate}
                className="bg-white text-violet-600 px-6 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                إضافة خطة جديدة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {plan.price} {plan.currency}
                </div>
                <div className="text-sm text-gray-500">شهرياً</div>
              </div>
              
              <div className="space-y-3 mb-6">
                {(() => {
                  // Convert features object to array if needed
                  let featuresList = [];
                  if (Array.isArray(plan.features)) {
                    featuresList = plan.features;
                  } else if (plan.features && typeof plan.features === 'object') {
                    // Convert object to array of feature names
                    featuresList = Object.entries(plan.features)
                      .filter(([key, value]) => value === true)
                      .map(([key]) => {
                        // Convert camelCase to readable text
                        const featureNames = {
                          basic_menu: 'قائمة أساسية',
                          qr_generation: 'إنشاء QR Code',
                          analytics_basic: 'تحليلات أساسية',
                          analytics_advanced: 'تحليلات متقدمة',
                          custom_themes: 'ثيمات مخصصة',
                          multi_language: 'متعدد اللغات',
                          themeCustomization: 'تخصيص الثيم',
                          advancedAnalytics: 'تحليلات متقدمة',
                          apiAccess: 'وصول API',
                          prioritySupport: 'دعم ذو أولوية',
                          customDomain: 'نطاق مخصص',
                          whiteLabel: 'علامة بيضاء',
                          multiLanguage: 'متعدد اللغات',
                          exportData: 'تصدير البيانات',
                          backupRestore: 'نسخ احتياطي'
                        };
                        return featureNames[key] || key;
                      });
                  }
                  
                  if (featuresList.length === 0) {
                    return <div className="text-sm text-gray-400">لا توجد ميزات محددة</div>;
                  }
                  
                  return featuresList.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Limits Display */}
              <div className="space-y-2 mb-6 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>المنتجات:</span>
                  <span className="font-medium">
                    {plan.limits?.maxProducts === -1 ? 'غير محدود' : plan.limits?.maxProducts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الفئات:</span>
                  <span className="font-medium">
                    {plan.limits?.maxCategories === -1 ? 'غير محدود' : plan.limits?.maxCategories || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الفروع:</span>
                  <span className="font-medium">
                    {plan.limits?.maxBranches === -1 ? 'غير محدود' : plan.limits?.maxBranches || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>المستخدمين:</span>
                  <span className="font-medium">
                    {plan.limits?.maxUsers === -1 ? 'غير محدود' : plan.limits?.maxUsers || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>التحليلات:</span>
                  <span className="font-medium">
                    {plan.limits?.analyticsRetention === -1 ? 'غير محدود' : `${plan.limits?.analyticsRetention || 0} يوم`}
                  </span>
                </div>
              </div>
              
              {/* Advanced Features Display */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">المميزات المتقدمة</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries({
                    themeCustomization: 'تخصيص الثيمات',
                    advancedAnalytics: 'التحليلات المتقدمة',
                    apiAccess: 'الوصول للـ API',
                    prioritySupport: 'دعم أولوية',
                    customDomain: 'نطاق مخصص',
                    whiteLabel: 'علامة تجارية بيضاء',
                    multiLanguage: 'متعدد اللغات',
                    exportData: 'تصدير البيانات',
                    backupRestore: 'النسخ الاحتياطي'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{label}</span>
                      <div className={`w-3 h-3 rounded-full ${plan.limits?.[key] ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 btn-secondary text-sm"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {subscriptionPlans.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد خطط اشتراك
            </h3>
            <p className="text-gray-500 mb-4">
              ابدأ بإنشاء أول خطة اشتراك
            </p>
            <button
              onClick={handleCreate}
              className="btn-primary"
            >
              إضافة خطة جديدة
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isCreateModalOpen ? 'إضافة خطة جديدة' : 'تعديل الخطة'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم (عربي)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                    placeholder="مثال: الخطة المميزة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم (إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                    className="input-field"
                    placeholder="Example: Premium Plan"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف (عربي)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-field"
                    rows="3"
                    placeholder="وصف الخطة باللغة العربية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف (إنجليزي)
                  </label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
                    className="input-field"
                    rows="3"
                    placeholder="Plan description in English"
                  />
                </div>
              </div>
          
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العملة
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
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
        
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المميزات (عربي)
                </label>
                {(Array.isArray(formData.features) ? formData.features : []).map((feature, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="مثال: عناصر غير محدودة"
                    />
                    <button
                      onClick={() => removeFeature(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFeature}
                  className="btn-secondary text-sm"
                >
                  إضافة ميزة
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المميزات (إنجليزي)
                </label>
                {(Array.isArray(formData.featuresEn) ? formData.featuresEn : []).map((feature, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeatureEn(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Example: Unlimited items"
                    />
                    <button
                      onClick={() => removeFeatureEn(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFeatureEn}
                  className="btn-secondary text-sm"
                >
                  إضافة ميزة
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحد الأقصى للمنتجات (-1 = غير محدود)
                  </label>
                  <input
                    type="number"
                    value={formData.limits.maxProducts}
                    onChange={(e) => setFormData({
                      ...formData, 
                      limits: {...formData.limits, maxProducts: parseInt(e.target.value) || 0}
                    })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحد الأقصى للفئات (-1 = غير محدود)
                  </label>
                  <input
                    type="number"
                    value={formData.limits.maxCategories}
                    onChange={(e) => setFormData({
                      ...formData, 
                      limits: {...formData.limits, maxCategories: parseInt(e.target.value) || 0}
                    })}
                    className="input-field"
                    placeholder="0"
                  />
          </div>
        </div>
        
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحد الأقصى للفروع (-1 = غير محدود)
                  </label>
                  <input
                    type="number"
                    value={formData.limits.maxBranches}
                    onChange={(e) => setFormData({
                      ...formData, 
                      limits: {...formData.limits, maxBranches: parseInt(e.target.value) || 0}
                    })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحد الأقصى للمستخدمين (-1 = غير محدود)
                  </label>
                  <input
                    type="number"
                    value={formData.limits.maxUsers}
                    onChange={(e) => setFormData({
                      ...formData, 
                      limits: {...formData.limits, maxUsers: parseInt(e.target.value) || 0}
                    })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مدة الاحتفاظ بالتحليلات (بالأيام)
                  </label>
                  <input
                    type="number"
                    value={formData.limits.analyticsRetention}
                    onChange={(e) => setFormData({
                      ...formData, 
                      limits: {...formData.limits, analyticsRetention: parseInt(e.target.value) || 0}
                    })}
                    className="input-field"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مدة الاشتراك (بالأيام)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({
                      ...formData, 
                      duration: parseInt(e.target.value) || 30
                    })}
                    className="input-field"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Advanced Features Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">المميزات المتقدمة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries({
                    themeCustomization: 'تخصيص الثيمات',
                    advancedAnalytics: 'التحليلات المتقدمة',
                    apiAccess: 'الوصول للـ API',
                    prioritySupport: 'دعم أولوية',
                    customDomain: 'نطاق مخصص',
                    whiteLabel: 'علامة تجارية بيضاء',
                    multiLanguage: 'متعدد اللغات',
                    exportData: 'تصدير البيانات',
                    backupRestore: 'النسخ الاحتياطي'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.limits[key] || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          limits: {
                            ...formData.limits,
                            [key]: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={key} className="text-sm font-medium text-gray-700">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مستوى الدعم
                  </label>
                  <select
                    value={formData.limits.supportLevel || 'email'}
                    onChange={(e) => setFormData({
                      ...formData, 
                      limits: {...formData.limits, supportLevel: e.target.value}
                    })}
                    className="input-field"
                  >
                    <option value="email">بريد إلكتروني</option>
                    <option value="priority">أولوية</option>
                    <option value="dedicated">مخصص</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setFormData({
                      name: '',
                      nameEn: '',
                      price: 0,
                      currency: 'EGP',
                      features: [],
                      limits: {
                        maxProducts: 0,
                        maxCategories: 0,
                        analyticsRetention: 0,
                        supportLevel: 'email'
                      }
                    });
                  }}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                >
                  {isCreateModalOpen ? 'إنشاء الخطة' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSubscriptions;