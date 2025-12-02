import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../contexts/authStore';
import useThemeStore from '../../contexts/themeStore';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminThemes = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { theme, loading, updateTheme, updateColor, applyPredefinedTheme, resetTheme } = useThemeStore();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleColorChange = (colorKey, value) => {
    updateColor(colorKey, value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const success = await updateTheme(user.uid, theme);
      if (success) {
        setMessage('تم حفظ الثيم بنجاح!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('حدث خطأ في حفظ الثيم');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      setMessage('حدث خطأ في حفظ الثيم');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };


  const predefinedThemes = [
    {
      name: 'أزرق كلاسيكي',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    },
    {
      name: 'أخضر طبيعي',
      colors: {
        primary: '#10b981',
        secondary: '#6b7280',
        accent: '#f59e0b'
      }
    },
    {
      name: 'بنفسجي أنيق',
      colors: {
        primary: '#8b5cf6',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    },
    {
      name: 'وردي رومانسي',
      colors: {
        primary: '#ec4899',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    },
    {
      name: 'برتقالي دافئ',
      colors: {
        primary: '#f97316',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    },
    {
      name: 'أحمر جريء',
      colors: {
        primary: '#ef4444',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    }
  ];


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الثيمات...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                إدارة الثيمات
              </h1>
              <p className="text-gray-600 mt-3 text-lg">قم بتخصيص ألوان المطعم لتتماشى مع هويتك البصرية</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={resetTheme}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all duration-200 font-semibold"
              >
                إعادة تعيين
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الثيم'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {/* Predefined Themes */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">الثيمات الجاهزة</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {predefinedThemes.map((predefinedTheme, index) => (
              <button
                key={index}
                onClick={() => applyPredefinedTheme(predefinedTheme)}
                className="p-4 border border-gray-200 rounded-2xl hover:border-primary-500 transition-all duration-200 group"
              >
                <div className="flex space-x-2 mb-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: predefinedTheme.colors.primary }}
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: predefinedTheme.colors.secondary }}
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: predefinedTheme.colors.accent }}
                  ></div>
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                  {predefinedTheme.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Theme Editor */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">محرر الثيم المخصص</h2>
          
          {theme && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Primary Colors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">الألوان الأساسية</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    اللون الأساسي
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    اللون الثانوي
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    لون التمييز
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Background Colors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">ألوان الخلفية</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    خلفية الصفحة
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    خلفية العناصر
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.surface}
                      onChange={(e) => handleColorChange('surface', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.surface}
                      onChange={(e) => handleColorChange('surface', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    لون الحدود
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.border}
                      onChange={(e) => handleColorChange('border', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.border}
                      onChange={(e) => handleColorChange('border', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Text Colors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">ألوان النصوص</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    النص الأساسي
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.text}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.text}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    النص الثانوي
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={theme.textSecondary}
                      onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.textSecondary}
                      onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Preview */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">معاينة الثيم</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              className="p-6 rounded-2xl border-2"
              style={{ 
                backgroundColor: theme?.background || '#ffffff',
                borderColor: theme?.border || '#e5e7eb'
              }}
            >
              <h3 
                className="text-xl font-bold mb-4"
                style={{ color: theme?.text || '#1f2937' }}
              >
                عنوان المطعم
              </h3>
              <p 
                className="mb-4"
                style={{ color: theme?.textSecondary || '#6b7280' }}
              >
                وصف المطعم والخدمات المقدمة
              </p>
              <div className="flex space-x-3">
                <button 
                  className="px-4 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: theme?.primary || '#3b82f6' }}
                >
                  زر أساسي
                </button>
                <button 
                  className="px-4 py-2 rounded-lg font-semibold border-2"
                  style={{ 
                    color: theme?.primary || '#3b82f6',
                    borderColor: theme?.primary || '#3b82f6'
                  }}
                >
                  زر ثانوي
                </button>
              </div>
            </div>
            
            <div 
              className="p-6 rounded-2xl"
              style={{ backgroundColor: theme?.surface || '#f8fafc' }}
            >
              <h4 
                className="text-lg font-semibold mb-3"
                style={{ color: theme?.text || '#1f2937' }}
              >
                عنصر القائمة
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ color: theme?.text || '#1f2937' }}>طبق رئيسي</span>
                  <span 
                    className="font-bold"
                    style={{ color: theme?.primary || '#3b82f6' }}
                  >
                    50 ج.م
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: theme?.text || '#1f2937' }}>مشروب</span>
                  <span 
                    className="font-bold"
                    style={{ color: theme?.primary || '#3b82f6' }}
                  >
                    15 ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminThemes;
