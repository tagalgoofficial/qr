import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import branchService from '../../services/branchService';
import themeService from '../../services/themeService';
import useAuthStore from '../../contexts/authStore';
import AdminLayout from '../../components/admin/AdminLayout';
import SubscriptionLimitChecker from '../../components/SubscriptionLimitChecker';
import AnimatedCard from '../../components/AnimatedCard';
import FadeIn from '../../components/FadeIn';
import Modal from '../../components/Modal';
import AnimatedButton from '../../components/AnimatedButton';
import useSubscriptionStore from '../../contexts/subscriptionStore';

const AdminBranches = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { canAddItem } = useSubscriptionStore();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [theme, setTheme] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchBranches();
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const themeData = await themeService.getRestaurantTheme(user.uid);
      setTheme(themeData);
    } catch (error) {
      console.error('Error fetching theme:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const branchesData = await branchService.getBranches(user.uid);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // If adding a new branch (not editing), check subscription limit first
      if (!editingBranch) {
        const canAdd = await canAddItem(user.uid, 'branches');
        if (!canAdd) {
          alert('تم الوصول للحد الأقصى من الفروع المسموح بها في خطتك. يرجى ترقية اشتراكك لإضافة المزيد من الفروع.');
          return;
        }
      }
      
      if (editingBranch) {
        await branchService.updateBranch(editingBranch.id, formData);
      } else {
        await branchService.addBranch(user.uid, formData);
      }
      
      setShowModal(false);
      setEditingBranch(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        isActive: true
      });
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('حدث خطأ أثناء حفظ الفرع. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      description: branch.description || '',
      isActive: branch.isActive !== undefined ? branch.isActive : (branch.is_active !== undefined ? branch.is_active : true)
    });
    setShowModal(true);
  };

  const handleDelete = async (branchId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      try {
        await branchService.deleteBranch(branchId);
        fetchBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
      }
    }
  };

  const openModal = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      isActive: true
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div
              className="w-16 h-16 border-4 border-[#ff2d2d]/20 rounded-full border-t-[#ff2d2d] mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p 
              className="mt-6 text-lg font-semibold text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
            >
              جاري تحميل الفروع...
            </motion.p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <FadeIn delay={0.1}>
          <AnimatedCard glass className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold gradient-text">
                  إدارة الفروع
                </h1>
                <p className="text-gray-600 mt-3 text-lg">إدارة فروع المطعم المختلفة ومراقبة أدائها</p>
              </div>
              <SubscriptionLimitChecker itemType="branches">
                <AnimatedButton
                  onClick={openModal}
                  variant="primary"
                  className="flex items-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-semibold">إضافة فرع جديد</span>
                </AnimatedButton>
              </SubscriptionLimitChecker>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((branch, index) => (
            <AnimatedCard key={branch.id} delay={0.1 + index * 0.1} glass>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <motion.h3 
                      className="text-2xl font-bold text-gray-900 mb-2"
                      whileHover={{ color: '#ff2d2d' }}
                      transition={{ duration: 0.3 }}
                    >
                      {branch.name}
                    </motion.h3>
                    <motion.div 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        (branch.isActive !== undefined ? branch.isActive : branch.is_active !== undefined ? branch.is_active : true)
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-[#ff2d2d]/10 text-[#ff2d2d]'
                      }`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <motion.div 
                        className={`w-2 h-2 rounded-full mr-2 ${
                          (branch.isActive !== undefined ? branch.isActive : branch.is_active !== undefined ? branch.is_active : true) ? 'bg-green-500' : 'bg-[#ff2d2d]'
                        }`}
                        animate={(branch.isActive !== undefined ? branch.isActive : branch.is_active !== undefined ? branch.is_active : true) ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      ></motion.div>
                      {(branch.isActive !== undefined ? branch.isActive : branch.is_active !== undefined ? branch.is_active : true) ? 'نشط' : 'غير نشط'}
                    </motion.div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEdit(branch)}
                      className="p-3 text-[#ff2d2d] hover:text-[#cc0000] hover:bg-[#ff2d2d]/10 rounded-xl transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(branch.id)}
                      className="p-3 text-[#ff2d2d] hover:text-[#cc0000] hover:bg-[#ff2d2d]/10 rounded-xl transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {branch.description && (
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">{branch.description}</p>
                )}

                <div className="space-y-4">
                  {branch.address && (
                    <motion.div 
                      className="flex items-start text-sm text-gray-600"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <div className="flex-shrink-0 w-5 h-5 bg-[#ff2d2d]/10 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-3 h-3 text-[#ff2d2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="flex-1">{branch.address}</span>
                    </motion.div>
                  )}

                  {branch.phone && (
                    <motion.div 
                      className="flex items-center text-sm text-gray-600"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.1 }}
                    >
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <span>{branch.phone}</span>
                    </motion.div>
                  )}

                  {branch.email && (
                    <motion.div 
                      className="flex items-center text-sm text-gray-600"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span>{branch.email}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        {branches.length === 0 && (
          <FadeIn delay={0.2}>
            <AnimatedCard glass className="p-12 text-center">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-[#ff2d2d]/10 to-[#cc0000]/10 rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg className="w-12 h-12 text-[#ff2d2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">لا توجد فروع</h3>
              <p className="text-gray-600 mb-8 text-lg">ابدأ بإضافة فرع جديد للمطعم لتوسيع نطاق عملك</p>
              <SubscriptionLimitChecker itemType="branches">
                <AnimatedButton onClick={openModal} variant="primary">
                  إضافة فرع جديد
                </AnimatedButton>
              </SubscriptionLimitChecker>
            </AnimatedCard>
          </FadeIn>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}
          size="lg"
        >

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                اسم الفرع
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="مثال: فرع المقطم"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                العنوان
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="عنوان الفرع الكامل"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="01234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="branch@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="وصف مختصر للفرع"
              />
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-5 w-5 text-[#ff2d2d] focus:ring-[#ff2d2d] border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="mr-3 block text-sm font-medium text-gray-700">
                فرع نشط
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <AnimatedButton
                type="button"
                onClick={() => setShowModal(false)}
                variant="secondary"
              >
                إلغاء
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                variant="primary"
              >
                {editingBranch ? 'تحديث الفرع' : 'إضافة الفرع'}
              </AnimatedButton>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminBranches;
