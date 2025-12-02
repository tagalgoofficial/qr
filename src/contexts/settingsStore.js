import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Settings will be handled via API endpoints when available
// For now, we'll provide placeholder functions

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // State
      settings: null,
      loading: false,
      error: null,
      statistics: null,
      
      // Actions
      
      // Load all system settings
      loadSettings: async () => {
        set({ loading: true, error: null });
        try {
          // TODO: Implement API endpoint for system settings
          const settings = null;
          set({ settings, loading: false, error: null });
          return settings;
        } catch (error) {
          console.error('Error loading settings:', error);
          set({ loading: false, error: error.message || 'Failed to load settings' });
          return null;
        }
      },
      
      // Update all settings
      updateSettings: async (newSettings, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          const updatedSettings = await updateSystemSettings(newSettings, updatedBy);
          set({ settings: updatedSettings, loading: false, error: null });
          return updatedSettings;
        } catch (error) {
          console.error('Error updating settings:', error);
          set({ loading: false, error: error.message });
          return null;
        }
      },
      
      // Reset settings to default
      resetSettings: async (updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          const resetSettings = await resetSystemSettings(updatedBy);
          set({ settings: resetSettings, loading: false, error: null });
          return resetSettings;
        } catch (error) {
          console.error('Error resetting settings:', error);
          set({ loading: false, error: error.message });
          return null;
        }
      },
      
      // Get specific setting
      getSetting: async (key) => {
        try {
          const value = await getSystemSetting(key);
          return value;
        } catch (error) {
          console.error('Error getting setting:', error);
          return null;
        }
      },
      
      // Update specific setting
      updateSetting: async (key, value, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updateSystemSetting(key, value, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { ...currentSettings, [key]: value },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating setting:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Maintenance mode
      checkMaintenanceMode: async () => {
        try {
          const isEnabled = await isMaintenanceModeEnabled();
          return isEnabled;
        } catch (error) {
          console.error('Error checking maintenance mode:', error);
          return false;
        }
      },
      
      toggleMaintenanceMode: async (enabled, message = null, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await toggleMaintenanceMode(enabled, message, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                maintenanceMode: enabled,
                maintenanceMessage: message || currentSettings.maintenanceMessage
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error toggling maintenance mode:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Trial settings
      loadTrialSettings: async () => {
        try {
          const trialSettings = await getTrialSettings();
          return trialSettings;
        } catch (error) {
          console.error('Error loading trial settings:', error);
          return null;
        }
      },
      
      updateTrialSettings: async (trialSettings, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updateTrialSettings(trialSettings, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                trialPeriodDays: trialSettings.trialPeriodDays,
                trialFeatures: trialSettings.trialFeatures,
                trialLimits: trialSettings.trialLimits
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating trial settings:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Security settings
      loadSecuritySettings: async () => {
        try {
          const securitySettings = await getSecuritySettings();
          return securitySettings;
        } catch (error) {
          console.error('Error loading security settings:', error);
          return null;
        }
      },
      
      updateSecuritySettings: async (securitySettings, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updateSecuritySettings(securitySettings, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                passwordMinLength: securitySettings.passwordMinLength,
                requireSpecialChars: securitySettings.requireSpecialChars,
                sessionTimeout: securitySettings.sessionTimeout,
                twoFactorAuth: securitySettings.twoFactorAuth,
                rateLimits: securitySettings.rateLimits
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating security settings:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Email settings
      loadEmailSettings: async () => {
        try {
          const emailSettings = await getEmailSettings();
          return emailSettings;
        } catch (error) {
          console.error('Error loading email settings:', error);
          return null;
        }
      },
      
      updateEmailSettings: async (emailSettings, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updateEmailSettings(emailSettings, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                smtpHost: emailSettings.smtpHost,
                smtpPort: emailSettings.smtpPort,
                smtpUsername: emailSettings.smtpUsername,
                smtpPassword: emailSettings.smtpPassword,
                fromEmail: emailSettings.fromEmail,
                fromName: emailSettings.fromName
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating email settings:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Payment settings
      loadPaymentSettings: async () => {
        try {
          const paymentSettings = await getPaymentSettings();
          return paymentSettings;
        } catch (error) {
          console.error('Error loading payment settings:', error);
          return null;
        }
      },
      
      updatePaymentSettings: async (paymentSettings, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updatePaymentSettings(paymentSettings, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                stripePublicKey: paymentSettings.stripePublicKey,
                stripeSecretKey: paymentSettings.stripeSecretKey,
                paypalClientId: paymentSettings.paypalClientId,
                paypalClientSecret: paymentSettings.paypalClientSecret
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating payment settings:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Notification settings
      loadNotificationSettings: async () => {
        try {
          const notificationSettings = await getNotificationSettings();
          return notificationSettings;
        } catch (error) {
          console.error('Error loading notification settings:', error);
          return null;
        }
      },
      
      updateNotificationSettings: async (notificationSettings, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updateNotificationSettings(notificationSettings, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                emailNotifications: notificationSettings.emailNotifications,
                smsNotifications: notificationSettings.smsNotifications,
                pushNotifications: notificationSettings.pushNotifications
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating notification settings:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Backup settings
      loadBackupSettings: async () => {
        try {
          const backupSettings = await getBackupSettings();
          return backupSettings;
        } catch (error) {
          console.error('Error loading backup settings:', error);
          return null;
        }
      },
      
      updateBackupSettings: async (backupSettings, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updateBackupSettings(backupSettings, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                autoBackup: backupSettings.autoBackup,
                backupFrequency: backupSettings.backupFrequency,
                backupRetention: backupSettings.backupRetention
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating backup settings:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Feature flags
      loadFeatureFlags: async () => {
        try {
          const features = await getFeatureFlags();
          return features;
        } catch (error) {
          console.error('Error loading feature flags:', error);
          return {};
        }
      },
      
      updateFeatureFlags: async (features, updatedBy = null) => {
        set({ loading: true, error: null });
        try {
          await updateFeatureFlags(features, updatedBy);
          
          // Update local state
          const currentSettings = get().settings;
          if (currentSettings) {
            set({ 
              settings: { 
                ...currentSettings, 
                features: features
              },
              loading: false,
              error: null 
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error updating feature flags:', error);
          set({ loading: false, error: error.message });
          return false;
        }
      },
      
      // Check if feature is enabled
      isFeatureEnabled: async (featureName) => {
        try {
          const enabled = await isFeatureEnabled(featureName);
          return enabled;
        } catch (error) {
          console.error('Error checking feature flag:', error);
          return false;
        }
      },
      
      // Load system statistics
      loadStatistics: async () => {
        set({ loading: true, error: null });
        try {
          const statistics = await getSystemStatistics();
          set({ statistics, loading: false, error: null });
          return statistics;
        } catch (error) {
          console.error('Error loading statistics:', error);
          set({ loading: false, error: error.message });
          return null;
        }
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Clear all data
      clearAll: () => set({ 
        settings: null, 
        statistics: null, 
        loading: false, 
        error: null 
      })
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({ 
        settings: state.settings 
      })
    }
  )
);

export default useSettingsStore;