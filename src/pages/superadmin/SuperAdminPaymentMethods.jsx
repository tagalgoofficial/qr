import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import superAdminPaymentMethodService from '../../services/superAdminPaymentMethodService';

const SuperAdminPaymentMethods = () => {
  const { t } = useTranslation();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [addingSamples, setAddingSamples] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'instapay',
    accountInfo: '',
    instructions: '',
    isActive: true
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await superAdminPaymentMethodService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await superAdminPaymentMethodService.updatePaymentMethod(editingMethod.id, {
          name: formData.name,
          nameAr: formData.nameAr,
          type: formData.type,
          accountInfo: formData.accountInfo,
          instructions: formData.instructions,
          isActive: formData.isActive
        });
      } else {
        await superAdminPaymentMethodService.createPaymentMethod({
          name: formData.name,
          nameAr: formData.nameAr,
          type: formData.type,
          accountInfo: formData.accountInfo,
          instructions: formData.instructions
        });
      }
      
      setFormData({
        name: '',
        type: 'instapay',
        accountInfo: '',
        instructions: '',
        isActive: true
      });
      setShowAddModal(false);
      setEditingMethod(null);
      loadPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      accountInfo: method.account_info,
      instructions: method.instructions,
      isActive: method.is_active
    });
    setShowAddModal(true);
  };

  const handleDelete = async (methodId) => {
    if (window.confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
      try {
        await superAdminPaymentMethodService.deletePaymentMethod(methodId);
        loadPaymentMethods();
      } catch (error) {
        console.error('Error deleting payment method:', error);
      }
    }
  };

  const handleAddSamples = async () => {
    if (window.confirm('هل تريد إضافة طرق دفع تجريبية؟')) {
      try {
        setAddingSamples(true);
        const sampleMethods = [
          { name: 'Instapay', nameAr: 'إنستاباي', type: 'instapay', accountInfo: '01000000000', instructions: 'استخدم رقم الهاتف للتحويل' },
          { name: 'Vodafone Cash', nameAr: 'فودافون كاش', type: 'vodafone_cash', accountInfo: '01000000000', instructions: 'استخدم رقم الهاتف للتحويل' },
          { name: 'Orange Money', nameAr: 'أورانج موني', type: 'orange_money', accountInfo: '01000000000', instructions: 'استخدم رقم الهاتف للتحويل' }
        ];
        
        for (const method of sampleMethods) {
          await superAdminPaymentMethodService.createPaymentMethod(method);
        }
        
        await loadPaymentMethods();
        alert('تم إضافة طرق الدفع التجريبية بنجاح!');
      } catch (error) {
        console.error('Error adding sample payment methods:', error);
        alert('حدث خطأ أثناء إضافة طرق الدفع التجريبية');
      } finally {
        setAddingSamples(false);
      }
    }
  };

  const toggleActive = async (method) => {
    try {
      await superAdminPaymentMethodService.updatePaymentMethod(method.id, { isActive: !method.is_active });
      loadPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method:', error);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل طرق الدفع...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة طرق الدفع</h1>
            <p className="text-gray-600 mt-2">إدارة طرق الدفع المتاحة للمستخدمين</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddSamples}
              disabled={addingSamples}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{addingSamples ? 'جاري الإضافة...' : 'إضافة بيانات تجريبية'}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>إضافة طريقة دفع</span>
            </button>
          </div>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paymentMethods.map((method) => (
            <div key={method.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {method.type === 'instapay' ? (
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{method.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(method)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      method.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">معلومات الحساب:</label>
                  <p className="text-sm text-gray-600 mt-1">{method.accountInfo}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">التعليمات:</label>
                  <p className="text-sm text-gray-600 mt-1">{method.instructions}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    method.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {method.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(method)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {paymentMethods.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طرق دفع</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة طريقة دفع جديدة</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              إضافة طريقة دفع
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم طريقة الدفع *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: انستا باي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع طريقة الدفع *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="instapay">انستا باي</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="vodafone_cash">فودافون كاش</option>
                  <option value="orange_money">اورنج موني</option>
                  <option value="etisalat_cash">اتصالات كاش</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  معلومات الحساب *
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountInfo}
                  onChange={(e) => setFormData({ ...formData, accountInfo: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: @tagalgo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التعليمات للمستخدم
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="تعليمات إضافية للمستخدم..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  طريقة دفع نشطة
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMethod(null);
                    setFormData({
                      name: '',
                      type: 'instapay',
                      accountInfo: '',
                      instructions: '',
                      isActive: true
                    });
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingMethod ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default SuperAdminPaymentMethods;
