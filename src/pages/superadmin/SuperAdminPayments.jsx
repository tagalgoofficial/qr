import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import superAdminPaymentService from '../../services/superAdminPaymentService';
import subscriptionService from '../../services/subscriptionService';
import superAdminSubscriptionService from '../../services/superAdminSubscriptionService';

const SuperAdminPayments = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadData();
    
    // Poll for updates instead of real-time
    const interval = setInterval(loadData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const paymentsData = await superAdminPaymentService.getPayments(filter === 'all' ? null : filter);
      setPayments(paymentsData);
      
      // Calculate stats
      const statsData = {
        total: paymentsData.length,
        pending: paymentsData.filter(p => p.status === 'pending').length,
        approved: paymentsData.filter(p => p.status === 'approved').length,
        rejected: paymentsData.filter(p => p.status === 'rejected').length,
        totalAmount: paymentsData
          .filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error loading payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSubscription = async (payment) => {
    try {
      console.log('=== Starting subscription update ===');
      console.log('Payment data received:', payment);
      
      // Validate required payment data
      if (!payment.restaurant_id) {
        throw new Error('Restaurant ID is missing from payment data');
      }
      
      if (!payment.plan_id) {
        throw new Error('Plan information is missing from payment data');
      }
      
      console.log('Payment data validation passed');
      
      // Get current subscription
      console.log('Getting current subscription for restaurant:', payment.restaurant_id);
      const currentSubscription = await subscriptionService.getRestaurantSubscription(payment.restaurant_id);
      console.log('Current subscription found:', currentSubscription);
      
      // Calculate subscription end date (1 month from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      const subscriptionData = {
        restaurantId: payment.restaurant_id,
        planId: payment.plan_id,
        planName: payment.plan_name,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      
      console.log('Subscription data prepared:', subscriptionData);
      
      if (currentSubscription?.id) {
        // Update existing subscription
        console.log('Updating existing subscription with ID:', currentSubscription.id);
        await superAdminSubscriptionService.updateSubscription(currentSubscription.id, subscriptionData);
        console.log('Existing subscription updated successfully');
      } else {
        // Create new subscription - will be handled by API
        console.log('Creating new subscription');
        await superAdminSubscriptionService.updateSubscription(null, subscriptionData);
        console.log('New subscription created');
      }
      
      console.log('=== Subscription update completed successfully ===');
    } catch (error) {
      console.error('=== Error in subscription update ===');
      console.error('Error details:', error);
      throw error;
    }
  };

  const handleStatusChange = async (paymentId, status) => {
    try {
      console.log('Starting payment status update:', { paymentId, status });
      
      await superAdminPaymentService.updatePaymentStatus(paymentId, status, adminNotes, true);
      console.log('Payment status updated successfully');
      
      // Get payment details
      const payment = payments.find(p => p.id == paymentId);
      console.log('Found payment:', payment);
      
      if (payment) {
        // If approved, update user subscription
        if (status === 'approved') {
          console.log('Approving payment, updating subscription...');
          try {
            await updateUserSubscription(payment);
            console.log('Subscription updated successfully');
          } catch (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
            alert('تم تحديث حالة الدفع بنجاح، لكن حدث خطأ في تحديث الاشتراك. يرجى مراجعة البيانات يدوياً.');
          }
        }
      } else {
        console.error('Payment not found with ID:', paymentId);
      }
      
      // Reload data
      loadData();
      
      setShowDetailsModal(false);
      setAdminNotes('');
      setSelectedPayment(null);
      
      // Show success message
      alert(`تم تحديث حالة الدفع إلى "${getStatusText(status)}" بنجاح`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`حدث خطأ في تحديث حالة الدفع: ${error.message}`);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'approved':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'غير محدد';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل المدفوعات...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">إدارة المدفوعات</h1>
            <p className="text-gray-600 mt-2">مراجعة وإدارة طلبات الدفع</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">في الانتظار</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">مقبول</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">مرفوض</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي المبلغ</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAmount} ج.م</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">تصفية حسب الحالة:</span>
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'الكل' : getStatusText(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    طريقة الدفع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {payment.userName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.userName || 'غير محدد'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.userEmail || 'غير محدد'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.paymentMethod}</div>
                      <div className="text-sm text-gray-500">{payment.accountInfo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.amount} ج.م
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مدفوعات</h3>
              <p className="text-gray-600">لم يتم العثور على أي مدفوعات تطابق المعايير المحددة</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">تفاصيل الدفع</h2>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-96">
              {/* Payment Screenshot */}
              {selectedPayment.screenshot && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">صورة إثبات الدفع:</label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <img 
                      src={selectedPayment.screenshot} 
                      alt="Payment Screenshot" 
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم:</label>
                  <p className="text-sm text-gray-900">{selectedPayment.userName || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني:</label>
                  <p className="text-sm text-gray-900">{selectedPayment.userEmail || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع:</label>
                  <p className="text-sm text-gray-900">{selectedPayment.paymentMethod || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">معلومات الحساب:</label>
                  <p className="text-sm text-gray-900">{selectedPayment.accountInfo || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ:</label>
                  <p className="text-sm text-gray-900">{selectedPayment.amount} ج.م</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة:</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusText(selectedPayment.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الطلب:</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ المعالجة:</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedPayment.processedAt)}</p>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الإدارة:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="أضف ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-white">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                  setAdminNotes('');
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                إغلاق
              </button>
              
              {selectedPayment.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedPayment.id, 'rejected')}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    رفض
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedPayment.id, 'approved')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    قبول
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default SuperAdminPayments;
