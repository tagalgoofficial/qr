import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import useSuperAdminStore from '../../contexts/superAdminStore';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import subscriptionService from '../../services/subscriptionService';
import superAdminSubscriptionService from '../../services/superAdminSubscriptionService';

const SuperAdminRestaurants = () => {
  const { t } = useTranslation();
  const { 
    restaurants, 
    loading, 
    error, 
    fetchRestaurants, 
    updateRestaurant, 
    deleteRestaurant,
    subscriptions,
    fetchSubscriptions,
    subscriptionPlans,
    fetchSubscriptionPlans
  } = useSuperAdminStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [subscriptionMap, setSubscriptionMap] = useState({});
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({ 
    status: 'active', 
    planId: '', 
    startDate: null, 
    endDate: null,
    planName: '',
    planPrice: 0
  });
  const [subSaving, setSubSaving] = useState(false);
  const [subTargetRestaurant, setSubTargetRestaurant] = useState(null);
  const [subsUnsubscribe, setSubsUnsubscribe] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const deriveStatus = (sub) => {
    if (!sub) return 'none';
    if (sub.status === 'paused') return 'paused';
    // Handle both camelCase and snake_case
    const endDate = sub.endDate || sub.end_date;
    const end = toDateValue(endDate);
    if (end && end.getTime() <= Date.now()) return 'expired';
    return sub.status || 'active';
  };
  
  useEffect(() => {
    const loadData = async () => {
      await fetchRestaurants();
      await fetchSubscriptions();
      await fetchSubscriptionPlans();
    };
    loadData();
  }, [fetchRestaurants, fetchSubscriptions, fetchSubscriptionPlans]);

  // Update subscriptionMap from subscriptions array
  useEffect(() => {
    const map = {};
    subscriptions?.forEach((s) => {
      // Handle both camelCase and snake_case field names
      const restaurantId = s.restaurantId || s.restaurant_id;
      if (restaurantId) {
        map[restaurantId] = {
          ...s,
          restaurantId: restaurantId,
          restaurant_id: restaurantId,
          planId: s.planId || s.plan_id,
          plan_id: s.planId || s.plan_id,
          planName: s.planName || s.plan_name,
          plan_name: s.planName || s.plan_name,
          startDate: s.startDate || s.start_date,
          start_date: s.startDate || s.start_date,
          endDate: s.endDate || s.end_date,
          end_date: s.endDate || s.end_date
        };
      }
    });
    setSubscriptionMap(prev => ({ ...prev, ...map }));
  }, [subscriptions]);
  
  // Also update subscriptionMap from restaurants data (restaurants come with subscription data)
  useEffect(() => {
    const map = {};
    restaurants.forEach((restaurant) => {
      if (restaurant.subscription) {
        const sub = restaurant.subscription;
        const restaurantId = restaurant.id;
        map[restaurantId] = {
          ...sub,
          restaurantId: restaurantId,
          restaurant_id: restaurantId,
          planId: sub.planId || sub.plan_id,
          plan_id: sub.planId || sub.plan_id,
          planName: sub.planName || sub.plan_name,
          plan_name: sub.planName || sub.plan_name,
          startDate: sub.startDate || sub.start_date,
          start_date: sub.startDate || sub.start_date,
          endDate: sub.endDate || sub.end_date,
          end_date: sub.endDate || sub.end_date
        };
      }
    });
    setSubscriptionMap(prev => ({ ...prev, ...map }));
  }, [restaurants]);

  // Poll subscriptions instead of real-time listener
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const subs = await fetchSubscriptions();
        const map = {};
        subs.forEach((s) => {
          // Handle both camelCase and snake_case field names
          const restaurantId = s.restaurantId || s.restaurant_id;
          if (restaurantId) {
            map[restaurantId] = {
              ...s,
              restaurantId: restaurantId,
              restaurant_id: restaurantId,
              planId: s.planId || s.plan_id,
              plan_id: s.planId || s.plan_id,
              planName: s.planName || s.plan_name,
              plan_name: s.planName || s.plan_name,
              startDate: s.startDate || s.start_date,
              start_date: s.startDate || s.start_date,
              endDate: s.endDate || s.end_date,
              end_date: s.endDate || s.end_date
            };
          }
        });
        setSubscriptionMap(map);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      }
    };
    
    fetchSubs();
    const interval = setInterval(fetchSubs, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchSubscriptions]);

  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Object.values(subscriptionMap).forEach(async (sub) => {
      const derived = deriveStatus(sub);
      if (derived === 'expired' && sub.status !== 'expired' && sub.id) {
        try {
          await superAdminSubscriptionService.updateSubscription(sub.id, { status: 'expired' });
          setSubscriptionMap((m) => ({ ...m, [sub.restaurant_id]: { ...sub, status: 'expired' } }));
        } catch (e) {
          console.error('Auto-expire update failed', e);
        }
      }
    });
  }, [subscriptionMap, clock]);
  
  const handleEdit = (restaurant) => {
    setSelectedRestaurant(restaurant);
    // Map is_active (0/1) to status ('active'/'inactive')
    const status = restaurant.is_active === 1 ? 'active' : 
                   restaurant.is_active === 0 ? 'inactive' : 
                   restaurant.status || 'active';
    setEditData({
      restaurantName: restaurant.restaurant_name || restaurant.restaurantName || '',
      email: restaurant.email || '',
      phone: restaurant.phone || '',
      address: restaurant.address || '',
      description: restaurant.description || '',
      status: status
    });
    setIsEditModalOpen(true);
  };

  const toDateValue = (d) => {
    if (!d) return null;
    if (d.seconds) return new Date(d.seconds * 1000);
    if (d.toDate) return d.toDate();
    // Handle MySQL DATETIME strings and ISO strings
    if (typeof d === 'string') {
      // MySQL DATETIME format: "2024-01-15 10:30:00"
      // ISO format: "2024-01-15T10:30:00.000Z"
      const dateStr = d.replace(' ', 'T'); // Convert MySQL format to ISO-like format
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatGregorianDate = (date) => {
    if (!date) return 'غير محدد';
    try {
      const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return 'غير محدد';
    }
  };

  const openSubModal = async (restaurant) => {
    setSubTargetRestaurant(restaurant);
    try {
      // Use subscription from restaurant object, subscriptionMap, or fetch from API
      const existing = restaurant.subscription || subscriptionMap[restaurant.id] || await subscriptionService.getRestaurantSubscription(restaurant.id);
      // Handle both camelCase and snake_case
      const startDate = existing?.startDate || existing?.start_date;
      const endDate = existing?.endDate || existing?.end_date;
      const planId = existing?.planId || existing?.plan_id;
      const planName = existing?.planName || existing?.plan_name;
      const planPrice = existing?.planPrice || existing?.plan_price;
      
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const plan = subscriptionPlans.find(p => p.id == planId);
      
      setSubForm({
        status: existing?.status || 'active',
        planId: planId !== undefined && planId !== null ? (typeof planId === 'string' ? parseInt(planId, 10) : Number(planId)) : '',
        planName: planName || plan?.name || '',
        planPrice: planPrice || plan?.price || 0,
        startDate: start,
        endDate: end
      });
      setIsSubModalOpen(true);
    } catch (error) {
      console.error('Error opening subscription modal:', error);
      // Still open modal with default values
      setSubForm({
        status: 'active',
        planId: '',
        planName: '',
        planPrice: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      setIsSubModalOpen(true);
    }
  };

  const saveSubscription = async () => {
    if (!subTargetRestaurant) return;
    try {
      setSubSaving(true);
      
      // Get plan from database directly to ensure we have all fields
      let selectedPlan = subscriptionPlans.find(p => p.id == subForm.planId || p.id === subForm.planId);
      
      // If plan not found in local state, fetch it directly from database
      if (!selectedPlan && subForm.planId && subForm.planId !== 0) {
        try {
          const allPlans = await superAdminSubscriptionService.getSubscriptionPlans();
          selectedPlan = allPlans.find(p => p.id == subForm.planId || p.id === subForm.planId);
        } catch (err) {
          console.error('Error fetching plan from database:', err);
        }
      }
      
      // Get limits from plan, existing subscription, or use defaults
      const existing = subscriptionMap[subTargetRestaurant.id];
      const planLimits = selectedPlan?.limits || existing?.limits || {};
      
      // Merge limits: plan limits take priority, then existing, then defaults
      // Ensure dates are Date objects
      const startDate = subForm.startDate instanceof Date ? subForm.startDate : new Date(subForm.startDate);
      const endDate = subForm.endDate instanceof Date ? subForm.endDate : new Date(subForm.endDate);
      
      // Ensure planId is a number (can be 0 if no plan selected)
      // Handle empty string, null, undefined, and 0 values correctly
      let planIdValue = 0;
      if (subForm.planId !== '' && subForm.planId !== null && subForm.planId !== undefined) {
        if (typeof subForm.planId === 'string') {
          planIdValue = subForm.planId.trim() === '' ? 0 : parseInt(subForm.planId, 10);
        } else {
          planIdValue = Number(subForm.planId);
        }
        // Ensure it's a valid number
        if (isNaN(planIdValue)) {
          planIdValue = 0;
        }
      }
      
      console.log('=== PLAN ID CONVERSION DEBUG ===');
      console.log('subForm.planId:', subForm.planId, 'type:', typeof subForm.planId);
      console.log('Converted planIdValue:', planIdValue, 'type:', typeof planIdValue);
      
      // Ensure planName is set correctly - prioritize form value, then selected plan, then existing
      const finalPlanName = subForm.planName || selectedPlan?.name || existing?.planName || existing?.plan_name || 'غير محدد';
      
      const payload = {
        restaurantId: subTargetRestaurant.id,
        status: subForm.status,
        planId: planIdValue,
        planName: finalPlanName,
        planPrice: subForm.planPrice || selectedPlan?.price || existing?.planPrice || 0,
        startDate: startDate,
        endDate: endDate,
        limits: {
          // Use plan limits first, then existing limits, then defaults
          maxProducts: planLimits.maxProducts ?? existing?.limits?.maxProducts ?? 0,
          maxCategories: planLimits.maxCategories ?? existing?.limits?.maxCategories ?? 0,
          maxBranches: planLimits.maxBranches ?? existing?.limits?.maxBranches ?? 20, // Default to 20 if not specified
          maxUsers: planLimits.maxUsers ?? existing?.limits?.maxUsers ?? 0,
          maxOrders: planLimits.maxOrders ?? existing?.limits?.maxOrders ?? 0,
          analyticsRetention: planLimits.analyticsRetention ?? existing?.limits?.analyticsRetention ?? 0,
          themeCustomization: planLimits.themeCustomization ?? existing?.limits?.themeCustomization ?? false,
          advancedAnalytics: planLimits.advancedAnalytics ?? existing?.limits?.advancedAnalytics ?? false,
          apiAccess: planLimits.apiAccess ?? existing?.limits?.apiAccess ?? false,
          prioritySupport: planLimits.prioritySupport ?? existing?.limits?.prioritySupport ?? false,
          customDomain: planLimits.customDomain ?? existing?.limits?.customDomain ?? false,
          whiteLabel: planLimits.whiteLabel ?? existing?.limits?.whiteLabel ?? false,
          multiLanguage: planLimits.multiLanguage ?? existing?.limits?.multiLanguage ?? false,
          exportData: planLimits.exportData ?? existing?.limits?.exportData ?? false,
          backupRestore: planLimits.backupRestore ?? existing?.limits?.backupRestore ?? false,
          supportLevel: (planLimits.supportLevel ?? existing?.limits?.supportLevel) || 'email',
          // Preserve any other limits that might exist
          ...planLimits,
          ...existing?.limits
        },
        features: selectedPlan?.features || existing?.features || []
      };
      if (existing?.id) {
        // Ensure planId is always a number, even if 0
        const finalPlanId = (payload.planId !== undefined && payload.planId !== null && payload.planId !== '') 
          ? Number(payload.planId) 
          : 0;
        
        // Double-check planId is a valid number
        const validatedPlanId = isNaN(finalPlanId) ? 0 : finalPlanId;
        
        const updateData = {
          status: payload.status,
          startDate: payload.startDate.toISOString(),
          endDate: payload.endDate.toISOString(),
          planId: validatedPlanId,
          planName: payload.planName,
          planPrice: payload.planPrice,
          features: payload.features,
          limits: payload.limits
        };
        
        console.log('=== FRONTEND UPDATE DEBUG ===');
        console.log('Update data:', updateData);
        console.log('planId value:', updateData.planId, 'type:', typeof updateData.planId);
        console.log('Subscription ID:', existing.id);
        console.log('Payload planId:', payload.planId, 'type:', typeof payload.planId);
        
        const updatedSubscription = await superAdminSubscriptionService.updateSubscription(existing.id, updateData);
        
        console.log('Updated subscription response:', updatedSubscription);
        console.log('planId in response:', updatedSubscription?.planId, updatedSubscription?.plan_id);
        
        // Update subscriptionMap with the response data
        if (updatedSubscription && updatedSubscription.id) {
          const restaurantId = updatedSubscription.restaurantId || updatedSubscription.restaurant_id || subTargetRestaurant.id;
          if (restaurantId) {
            setSubscriptionMap(prev => ({
              ...prev,
              [restaurantId]: {
                ...updatedSubscription,
                restaurantId: restaurantId,
                restaurant_id: restaurantId,
                planId: updatedSubscription.planId || updatedSubscription.plan_id || 0,
                plan_id: updatedSubscription.planId || updatedSubscription.plan_id || 0,
                planName: updatedSubscription.planName || updatedSubscription.plan_name,
                plan_name: updatedSubscription.planName || updatedSubscription.plan_name,
                startDate: updatedSubscription.startDate || updatedSubscription.start_date,
                start_date: updatedSubscription.startDate || updatedSubscription.start_date,
                endDate: updatedSubscription.endDate || updatedSubscription.end_date,
                end_date: updatedSubscription.endDate || updatedSubscription.end_date
              }
            }));
          }
        }
        
        // Refresh subscriptions from database to ensure consistency
        const refreshedSubs = await fetchSubscriptions();
        const refreshedMap = {};
        refreshedSubs.forEach((s) => {
          const restaurantId = s.restaurantId || s.restaurant_id;
          if (restaurantId) {
            refreshedMap[restaurantId] = {
              ...s,
              restaurantId: restaurantId,
              restaurant_id: restaurantId,
              planId: s.planId !== undefined ? Number(s.planId) : (s.plan_id !== undefined ? Number(s.plan_id) : 0),
              plan_id: s.plan_id !== undefined ? Number(s.plan_id) : (s.planId !== undefined ? Number(s.planId) : 0),
              planName: s.planName || s.plan_name,
              plan_name: s.plan_name || s.planName,
              startDate: s.startDate || s.start_date,
              start_date: s.start_date || s.startDate,
              endDate: s.endDate || s.end_date,
              end_date: s.end_date || s.endDate,
              status: s.status || 'active'
            };
          }
        });
        setSubscriptionMap(refreshedMap);
        await fetchRestaurants();
        
        // Show success message
        alert('تم حفظ الاشتراك بنجاح!');
        setIsSubModalOpen(false);
      } else {
        // Create new subscription
        const subscriptionData = {
          restaurantId: payload.restaurantId,
          status: payload.status,
          startDate: payload.startDate instanceof Date ? payload.startDate.toISOString() : payload.startDate,
          endDate: payload.endDate instanceof Date ? payload.endDate.toISOString() : payload.endDate,
          planId: payload.planId || 0,
          planName: payload.planName || selectedPlan?.name || 'غير محدد',
          features: payload.features || [],
          limits: payload.limits || {}
        };
        
        console.log('Creating subscription with data:', subscriptionData);
        console.log('Plan Name in subscriptionData:', subscriptionData.planName);
        
        const newSubscription = await superAdminSubscriptionService.createSubscription(subscriptionData);
        
        console.log('Subscription created:', newSubscription);
        console.log('Plan Name in response:', newSubscription?.planName || newSubscription?.plan_name);
        
        // Refresh subscriptions to ensure data is synced from database
        const refreshedSubs = await fetchSubscriptions();
        console.log('Refreshed subscriptions after create:', refreshedSubs);
        
        // Update subscription map from refreshed data
        const refreshedMap = {};
        refreshedSubs.forEach((s) => {
          const restaurantId = s.restaurantId || s.restaurant_id;
          if (restaurantId) {
            refreshedMap[restaurantId] = {
              ...s,
              restaurantId: restaurantId,
              restaurant_id: restaurantId,
              planId: s.planId || s.plan_id,
              plan_id: s.planId || s.plan_id,
              planName: s.planName || s.plan_name,
              plan_name: s.planName || s.plan_name,
              startDate: s.startDate || s.start_date,
              start_date: s.startDate || s.start_date,
              endDate: s.endDate || s.end_date,
              end_date: s.endDate || s.end_date
            };
          }
        });
        setSubscriptionMap(refreshedMap);
        
        // Also refresh restaurants to get updated subscription data
        await fetchRestaurants();
      }
      setIsSubModalOpen(false);
      setSubTargetRestaurant(null);
      
      // Also activate the restaurant if subscription is active and restaurant is not active
      if (payload.status === 'active' && subTargetRestaurant.is_active !== 1) {
        try {
          await updateRestaurant(subTargetRestaurant.id, { isActive: true });
          // Refresh restaurants list
          await fetchRestaurants();
        } catch (e) {
          console.error('Error activating restaurant:', e);
        }
      }
      
      alert('تم حفظ الاشتراك بنجاح!');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حفظ الاشتراك');
    } finally {
      setSubSaving(false);
    }
  };

  const handleActivate = async (restaurant) => {
    try {
      const existing = subscriptionMap[restaurant.id];
      const now = new Date();
      const baseEnd = existing?.endDate ? toDateValue(existing.endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Ensure endDate is in the future
      if (baseEnd <= now) {
        baseEnd.setTime(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
      
      // Get plan from database to ensure we have all limits
      let planFromDB = null;
      if (existing?.plan_id) {
        try {
          const allPlans = await superAdminSubscriptionService.getSubscriptionPlans();
          planFromDB = allPlans.find(p => p.id == existing.plan_id);
        } catch (err) {
          console.error('Error fetching plan from database:', err);
        }
      }
      
      // Merge limits: plan limits take priority, then existing, then defaults
      const existingLimits = existing?.limits || {};
      const planLimits = planFromDB?.limits || {};
      
      const payload = {
        restaurantId: restaurant.id,
        status: 'active',
        startDate: existing?.start_date ? new Date(existing.start_date) : now,
        endDate: baseEnd,
        planId: existing?.plan_id || '',
        planName: existing?.plan_name || planFromDB?.name || 'غير محدد',
        planPrice: existing?.plan_price || planFromDB?.price || 0,
        limits: {
          // Use plan limits first, then existing limits, then defaults
          maxProducts: planLimits.maxProducts ?? existingLimits.maxProducts ?? 0,
          maxCategories: planLimits.maxCategories ?? existingLimits.maxCategories ?? 0,
          maxBranches: planLimits.maxBranches ?? existingLimits.maxBranches ?? 20, // Default to 20 if not specified
          maxUsers: planLimits.maxUsers ?? existingLimits.maxUsers ?? 0,
          maxOrders: planLimits.maxOrders ?? existingLimits.maxOrders ?? 0,
          analyticsRetention: planLimits.analyticsRetention ?? existingLimits.analyticsRetention ?? 0,
          themeCustomization: planLimits.themeCustomization ?? existingLimits.themeCustomization ?? false,
          advancedAnalytics: planLimits.advancedAnalytics ?? existingLimits.advancedAnalytics ?? false,
          apiAccess: planLimits.apiAccess ?? existingLimits.apiAccess ?? false,
          prioritySupport: planLimits.prioritySupport ?? existingLimits.prioritySupport ?? false,
          customDomain: planLimits.customDomain ?? existingLimits.customDomain ?? false,
          whiteLabel: planLimits.whiteLabel ?? existingLimits.whiteLabel ?? false,
          multiLanguage: planLimits.multiLanguage ?? existingLimits.multiLanguage ?? false,
          exportData: planLimits.exportData ?? existingLimits.exportData ?? false,
          backupRestore: planLimits.backupRestore ?? existingLimits.backupRestore ?? false,
          supportLevel: (planLimits.supportLevel ?? existingLimits.supportLevel) || 'email',
          // Preserve any other limits that might exist
          ...planLimits,
          ...existingLimits
        },
        features: planFromDB?.features || existing?.features || []
      };
      
    if (existing?.id) {
      await superAdminSubscriptionService.updateSubscription(existing.id, {
        status: 'active',
        startDate: payload.startDate.toISOString(),
        endDate: payload.endDate.toISOString(),
        planId: payload.planId,
        features: payload.features,
        limits: payload.limits
      });
      setSubscriptionMap({ ...subscriptionMap, [restaurant.id]: { ...existing, ...payload } });
    } else {
        // Create new subscription
        const newSubscription = await superAdminSubscriptionService.createSubscription({
          restaurantId: restaurant.id,
          status: 'active',
          startDate: payload.startDate.toISOString(),
          endDate: payload.endDate.toISOString(),
          planId: payload.planId,
          planName: planFromDB?.name,
          features: payload.features,
          limits: payload.limits
        });
        setSubscriptionMap({ ...subscriptionMap, [restaurant.id]: newSubscription });
        await fetchSubscriptions();
      }
      
      // Also activate the restaurant if it's not active
      if (restaurant.is_active !== 1) {
        try {
          await updateRestaurant(restaurant.id, { isActive: true });
          // Refresh restaurants list
          fetchRestaurants();
        } catch (e) {
          console.error('Error activating restaurant:', e);
        }
      }
      
      alert('تم تفعيل الاشتراك والمطعم بنجاح!');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تفعيل الاشتراك');
    }
  };

  const handlePause = async (restaurant) => {
    try {
    const existing = subscriptionMap[restaurant.id];
      if (!existing?.id) {
        alert('لا يوجد اشتراك لهذا المطعم');
        return;
      }
    await superAdminSubscriptionService.updateSubscription(existing.id, { status: 'paused' });
    setSubscriptionMap({ ...subscriptionMap, [restaurant.id]: { ...existing, status: 'paused' } });
      alert('تم إيقاف الاشتراك بنجاح!');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إيقاف الاشتراك');
    }
  };

  const handleExtendDays = async (restaurant, days) => {
    try {
    const existing = subscriptionMap[restaurant.id];
      if (!existing?.id) {
        alert('لا يوجد اشتراك لهذا المطعم');
        return;
      }
    const end = existing.end_date ? new Date(existing.end_date) : new Date();
    const newEnd = new Date(end.getTime() + days * 24 * 60 * 60 * 1000);
    await superAdminSubscriptionService.updateSubscription(existing.id, { endDate: newEnd.toISOString() });
    setSubscriptionMap({ ...subscriptionMap, [restaurant.id]: { ...existing, end_date: newEnd.toISOString() } });
      alert(`تم تمديد الاشتراك ${days} يوم بنجاح!`);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تمديد الاشتراك');
    }
  };
  
  const handleUpdate = async () => {
    try {
      await updateRestaurant(selectedRestaurant.id, editData);
      setIsEditModalOpen(false);
      setSelectedRestaurant(null);
      setEditData({});
      alert('تم تحديث بيانات المطعم بنجاح!');
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('حدث خطأ أثناء تحديث بيانات المطعم');
    }
  };
  
  const handleDelete = async (restaurantId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المطعم؟ سيتم حذف جميع البيانات المرتبطة به.')) {
      try {
        await deleteRestaurant(restaurantId);
        alert('تم حذف المطعم بنجاح!');
        fetchRestaurants();
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('حدث خطأ أثناء حذف المطعم');
      }
    }
  };
  
  const filteredRestaurants = restaurants.filter(restaurant => {
    const restaurantName = restaurant.restaurant_name || restaurant.restaurantName || '';
    const matchesSearch = restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && restaurant.is_active === 1) || (filterStatus === 'inactive' && restaurant.is_active === 0);
    // Use subscription from restaurant object or subscriptionMap
    const sub = restaurant.subscription || subscriptionMap[restaurant.id];
    const subStatus = deriveStatus(sub);
    const matchesSubscription = filterSubscription === 'all' || 
                                (filterSubscription === 'active' && subStatus === 'active') ||
                                (filterSubscription === 'expired' && subStatus === 'expired') ||
                                (filterSubscription === 'paused' && subStatus === 'paused') ||
                                (filterSubscription === 'none' && subStatus === 'none');
    return matchesSearch && matchesStatus && matchesSubscription;
  });

  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.is_active === 1).length,
    inactive: restaurants.filter(r => r.is_active === 0).length,
    withActiveSub: restaurants.filter(r => {
      const sub = r.subscription || subscriptionMap[r.id];
      return deriveStatus(sub) === 'active';
    }).length,
    expired: restaurants.filter(r => {
      const sub = r.subscription || subscriptionMap[r.id];
      return deriveStatus(sub) === 'expired';
    }).length
  };
  
  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600 text-lg">جاري تحميل المطاعم...</p>
        </div>
      </div>
      </SuperAdminLayout>
    );
  }
  
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">خطأ في تحميل المطاعم: {error}</span>
            </div>
          </motion.div>
        )}
        {/* Header Section with Animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl"
        >
        {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-64 h-64 bg-white/10 rounded-full"
              style={{ top: '-50px', left: '-50px' }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute w-48 h-48 bg-white/5 rounded-full"
              style={{ bottom: '-30px', right: '20%' }}
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            />
        </div>
        
        <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl lg:text-5xl font-bold mb-3"
                >
                إدارة المطاعم
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-indigo-100 text-lg mb-6"
                >
                  إدارة جميع المطاعم المسجلة في النظام ومراقبة أدائها واشتراكاتها
                </motion.p>
                
                {/* Quick stats with animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 sm:grid-cols-5 gap-4"
                >
                  {[
                    { label: 'إجمالي', value: stats.total, color: 'bg-white/20' },
                    { label: 'نشطة', value: stats.active, color: 'bg-green-500/30' },
                    { label: 'غير نشطة', value: stats.inactive, color: 'bg-red-500/30' },
                    { label: 'اشتراك نشط', value: stats.withActiveSub, color: 'bg-blue-500/30' },
                    { label: 'منتهية', value: stats.expired, color: 'bg-yellow-500/30' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`${stat.color} backdrop-blur-sm rounded-xl p-4 text-center`}
                    >
                      <div className="text-3xl font-bold mb-1">{stat.value}</div>
                      <div className="text-xs text-indigo-100">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
                </div>
                </div>
                </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900">فلترة المطاعم</h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {filteredRestaurants.length} من {restaurants.length} مطعم
              </div>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
              </button>
          </div>
        </div>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">البحث</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="ابحث بالاسم أو البريد..."
              />
            </div>
          </div>
          
          <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">حالة المطعم</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="suspended">معلق</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">حالة الاشتراك</label>
              <select
                value={filterSubscription}
                onChange={(e) => setFilterSubscription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="all">جميع الاشتراكات</option>
                <option value="active">نشط</option>
                <option value="expired">منتهي</option>
                <option value="paused">موقوف</option>
                <option value="none">بدون اشتراك</option>
              </select>
            </div>
          
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterSubscription('all');
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
                مسح الفلاتر
              </button>
            </div>
          </div>
        </motion.div>

        {/* Restaurants List/Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        >
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مطاعم</h3>
              <p className="text-gray-500">
                {searchQuery || filterStatus !== 'all' || filterSubscription !== 'all' 
                  ? 'لم يتم العثور على مطاعم تطابق البحث' 
                  : 'لم يتم تسجيل أي مطاعم بعد'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6' 
              : 'space-y-4 p-6'
            }>
              <AnimatePresence>
                {filteredRestaurants.map((restaurant, index) => {
                  // Use subscription from restaurant object or subscriptionMap
                  const sub = restaurant.subscription || subscriptionMap[restaurant.id];
                  const subStatus = deriveStatus(sub);
                  // Handle both camelCase and snake_case for dates
                  const endDateValue = sub?.endDate || sub?.end_date;
                  const endDate = toDateValue(endDateValue);
                  const daysLeft = endDate ? Math.ceil((endDate.getTime() - clock) / (1000 * 60 * 60 * 24)) : null;
                  
                  return (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      subscription={sub}
                      subscriptionStatus={subStatus}
                      daysLeft={daysLeft}
                      subscriptionPlans={subscriptionPlans}
                      index={index}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onSubscription={openSubModal}
                      onActivate={handleActivate}
                      onPause={handlePause}
                      onExtendDays={handleExtendDays}
                      toDateValue={toDateValue}
                      formatGregorianDate={formatGregorianDate}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditRestaurantModal
            restaurant={selectedRestaurant}
            editData={editData}
            setEditData={setEditData}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedRestaurant(null);
              setEditData({});
            }}
            onSave={handleUpdate}
          />
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {isSubModalOpen && (
          <SubscriptionModal
            restaurant={subTargetRestaurant}
            subscription={subscriptionMap[subTargetRestaurant?.id]}
            subscriptionPlans={subscriptionPlans}
            form={subForm}
            setForm={setSubForm}
            saving={subSaving}
            onClose={() => {
              setIsSubModalOpen(false);
              setSubTargetRestaurant(null);
            }}
            onSave={saveSubscription}
            toDateValue={toDateValue}
          />
        )}
      </AnimatePresence>
    </SuperAdminLayout>
  );
};

// Restaurant Card Component
const RestaurantCard = ({ 
  restaurant, 
  subscription, 
  subscriptionStatus, 
  daysLeft, 
  subscriptionPlans,
  index,
  viewMode,
  onEdit,
  onDelete,
  onSubscription,
  onActivate,
  onPause,
  onExtendDays,
  toDateValue,
  formatGregorianDate
}) => {
  // Handle both camelCase and snake_case
  const planId = subscription?.planId || subscription?.plan_id;
  const plan = subscriptionPlans.find(p => p.id == planId);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden ${
        viewMode === 'list' ? 'flex items-center gap-6 p-6' : 'p-6'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${viewMode === 'list' ? 'hidden' : ''}`} />
      
      <div className={`relative z-10 ${viewMode === 'list' ? 'flex-1 flex items-center gap-6' : 'space-y-4'}`}>
        {/* Header */}
        <div className={`flex items-center ${viewMode === 'list' ? 'gap-4 min-w-[300px]' : 'justify-between'}`}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {(restaurant.restaurant_name || restaurant.restaurantName)?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{restaurant.restaurant_name || restaurant.restaurantName || 'بدون اسم'}</h3>
              <p className="text-sm text-gray-500">{restaurant.email || 'بدون بريد'}</p>
                        </div>
                      </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            restaurant.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : restaurant.status === 'inactive' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {restaurant.status || 'غير محدد'}
          </span>
                    </div>

        {/* Subscription Info */}
        <div className={`grid ${viewMode === 'list' ? 'grid-cols-4 gap-4' : 'grid-cols-2 gap-3'}`}>
                      <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">خطة الاشتراك</div>
            <div className="text-sm font-semibold text-gray-900">
              {subscription?.planName || subscription?.plan_name || plan?.name || 'بدون خطة'}
                      </div>
          </div>
          
                      <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">حالة الاشتراك</div>
            <div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                subscriptionStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : subscriptionStatus === 'expired' 
                  ? 'bg-red-100 text-red-800' 
                  : subscriptionStatus === 'paused' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {subscriptionStatus === 'none' ? 'بدون اشتراك' : subscriptionStatus === 'active' ? 'نشط' : subscriptionStatus === 'expired' ? 'منتهي' : subscriptionStatus === 'paused' ? 'موقوف' : subscriptionStatus}
              </span>
                      </div>
                    </div>

          {viewMode === 'list' && (
            <>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">تاريخ البداية</div>
                <div className="text-sm font-medium text-gray-900">
                  {(() => {
                    if (!subscription) return 'غير محدد';
                    const startDateValue = subscription.startDate || subscription.start_date;
                    if (!startDateValue) return 'غير محدد';
                    const startDate = toDateValue(startDateValue);
                    if (!startDate) return 'غير محدد';
                    return formatGregorianDate(startDate);
                  })()}
                        </div>
                      </div>
              
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</div>
                <div className="text-sm font-medium text-gray-900">
                  {(() => {
                    if (!subscription) return 'غير محدد';
                    const endDateValue = subscription.endDate || subscription.end_date;
                    if (!endDateValue) return 'غير محدد';
                    const endDate = toDateValue(endDateValue);
                    if (!endDate) return 'غير محدد';
                    return formatGregorianDate(endDate);
                  })()}
                      </div>
                      </div>
            </>
          )}

          {viewMode !== 'list' && (
            <>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">تاريخ البداية</div>
                <div className="text-sm font-medium text-gray-900">
                  {(() => {
                    if (!subscription) return 'غير محدد';
                    const startDateValue = subscription.startDate || subscription.start_date;
                    if (!startDateValue) return 'غير محدد';
                    const startDate = toDateValue(startDateValue);
                    if (!startDate) return 'غير محدد';
                    return formatGregorianDate(startDate);
                  })()}
                      </div>
                      </div>
              
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</div>
                <div className="text-sm font-medium text-gray-900">
                  {(() => {
                    if (!subscription) return 'غير محدد';
                    const endDateValue = subscription.endDate || subscription.end_date;
                    if (!endDateValue) return 'غير محدد';
                    const endDate = toDateValue(endDateValue);
                    if (!endDate) return 'غير محدد';
                    return formatGregorianDate(endDate);
                  })()}
                    </div>
                  </div>
            </>
          )}
                </div>

        {/* Days Left */}
        {daysLeft !== null && (
          <div className="flex items-center justify-center">
            <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
              daysLeft <= 0 
                ? 'bg-red-100 text-red-800' 
                : daysLeft <= 7 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {daysLeft <= 0 ? 'منتهي' : `${daysLeft} يوم متبقي`}
            </span>
            </div>
          )}

        {/* Actions */}
        <div className={`flex items-center gap-2 flex-wrap ${viewMode === 'list' ? 'min-w-[400px]' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(restaurant)}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            تعديل
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSubscription(restaurant)}
            className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4m8 0a4 4 0 11-8 0 4 4 0 018 0zm6 0a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            اشتراك
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onActivate(restaurant)}
            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            title="تفعيل"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPause(restaurant)}
            className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
            title="إيقاف"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6M4 12a8 8 0 1016 0 8 8 0 00-16 0z" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onExtendDays(restaurant, 30)}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            title="تمديد 30 يوم"
          >
            +30
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(restaurant.id)}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            title="حذف"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m4-2h2a2 2 0 012 2H7a2 2 0 012-2h2z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Edit Restaurant Modal Component
const EditRestaurantModal = ({ restaurant, editData, setEditData, onClose, onSave }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">تعديل بيانات المطعم</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المطعم</label>
                  <input
                    type="text"
                    value={editData.restaurantName}
                    onChange={(e) => setEditData({...editData, restaurantName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الهاتف</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                  <textarea
                    value={editData.address}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    rows={3}
                  />
                </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
              </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                onClick={onSave}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
        </motion.div>
      </motion.div>
    </>
  );
};

// Subscription Modal Component
const SubscriptionModal = ({ restaurant, subscription, subscriptionPlans, form, setForm, saving, onClose, onSave, toDateValue }) => {
  const handlePlanChange = (planId) => {
    // Convert to number if it's a string, or 0 if empty
    const planIdNum = planId && planId !== '' ? (typeof planId === 'string' ? parseInt(planId, 10) : Number(planId)) : 0;
    const plan = subscriptionPlans.find(p => p.id == planIdNum);
    setForm({
      ...form,
      planId: planIdNum,
      planName: plan?.name || '',
      planPrice: plan?.price || 0
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">إدارة الاشتراك</h3>
                <p className="text-sm text-gray-500 mt-1">{restaurant?.restaurantName}</p>
          </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
        </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الخطة</label>
                  <select
                  value={form.planId || ''}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">اختر خطة</option>
                  {subscriptionPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} - {plan.price} {plan.currency || 'EGP'}</option>
                    ))}
                  </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="active">نشط</option>
                    <option value="expired">منتهي</option>
                    <option value="trial">تجريبي</option>
                    <option value="paused">موقوف</option>
                  </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية</label>
                  <input
                    type="date"
                  value={form.startDate ? new Date(form.startDate).toISOString().slice(0,10) : ''}
                  onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء</label>
                  <input
                    type="date"
                  value={form.endDate ? new Date(form.endDate).toISOString().slice(0,10) : ''}
                  onChange={(e) => setForm({ ...form, endDate: new Date(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

            {subscription && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">معلومات الاشتراك الحالي</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">الخطة:</span>
                    <span className="mr-2 font-medium">{subscription.planName || 'غير محدد'}</span>
              </div>
                  <div>
                    <span className="text-gray-500">الحالة:</span>
                    <span className="mr-2 font-medium">{subscription.status || 'غير محدد'}</span>
            </div>
          </div>
        </div>
      )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? 'جاري الحفظ...' : 'حفظ الاشتراك'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SuperAdminRestaurants;
