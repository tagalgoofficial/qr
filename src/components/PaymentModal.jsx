import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import superAdminPaymentMethodService from '../services/superAdminPaymentMethodService';
import superAdminPaymentService from '../services/superAdminPaymentService';
import storageService from '../services/storageService';

// Add custom CSS for animations
const successModalStyles = `
  @keyframes drawCheck {
    0% {
      stroke-dashoffset: 50;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes successPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .success-modal {
    animation: fadeInUp 0.5s ease-out;
  }
  
  .success-icon {
    animation: successPulse 2s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = successModalStyles;
  document.head.appendChild(styleSheet);
}

const PaymentModal = ({ isOpen, onClose, planData, userData }) => {
  const { t } = useTranslation();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  // Screenshot functionality removed due to CORS issues
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    userName: userData?.displayName || '',
    userEmail: userData?.email || '',
    userPhone: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await superAdminPaymentMethodService.getPaymentMethods();
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  // Screenshot functionality removed

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMethod) {
      alert('يرجى اختيار طريقة الدفع');
      return;
    }
    
    // Screenshot functionality removed due to CORS issues

    try {
      setLoading(true);
      
      // Screenshot functionality removed due to CORS issues
      let screenshotUrl = '';
      
      // Create payment request
      const paymentData = {
        userId: userData?.uid,
        restaurantId: userData?.uid, // Use userId as restaurantId for now
        userName: formData.userName,
        userEmail: formData.userEmail,
        userPhone: formData.userPhone,
        planId: planData.id,
        planName: planData.name,
        planPrice: planData.price, // Use planPrice instead of amount
        amount: planData.price,
        paymentMethod: selectedMethod.name,
        paymentMethodType: selectedMethod.type,
        accountInfo: selectedMethod.accountInfo,
        instructions: selectedMethod.instructions,
        screenshot: screenshotUrl,
        notes: formData.notes,
        status: 'pending'
      };

      // TODO: Implement API endpoint for creating payment requests
      // For now, we'll just show success
      // const paymentId = await createPaymentRequest(paymentData);
      
      // Send notification to user (handled by API)
      // await sendPaymentSubmittedNotification({
      //   ...paymentData,
      //   id: paymentId
      // });
      
      setLoading(false);
      setShowSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        
        // Reset form
        setFormData({
          userName: userData?.displayName || '',
          userEmail: userData?.email || '',
          userPhone: '',
          notes: ''
        });
        setSelectedMethod(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('حدث خطأ في إرسال طلب الدفع. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">إتمام عملية الدفع</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-96">
          {/* Plan Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">تفاصيل الخطة</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">الخطة:</span>
                <span className="text-blue-700 ml-2">{planData.name}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">السعر:</span>
                <span className="text-blue-700 ml-2">{planData.price} ج.م</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              اختر طريقة الدفع *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod?.id === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedMethod(method)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {method.type === 'instapay' ? (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{method.name}</h4>
                        <p className="text-sm text-gray-600">{method.accountInfo}</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod?.id === method.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod?.id === method.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                  
                  {method.instructions && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{method.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل *
              </label>
              <input
                type="text"
                required
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسمك الكامل"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                required
                value={formData.userEmail}
                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل بريدك الإلكتروني"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.userPhone}
                onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01234567890"
              />
            </div>
          </div>

          {/* Screenshot functionality removed due to CORS issues */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  ملاحظة مهمة
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    بعد إرسال طلب الدفع، يرجى إرسال صورة إثبات الدفع عبر البريد الإلكتروني إلى: 
                    <span className="font-semibold"> support@qrmenu.com</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات إضافية
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="أي ملاحظات إضافية..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedMethod}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{loading ? 'جاري الإرسال...' : 'إرسال طلب الدفع'}</span>
          </button>
        </div>
      </div>
    </div>

    {/* Success Modal */}
    {showSuccess && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 success-modal">
          <div className="text-center">
            {/* Success Icon with Advanced Animation */}
            <div className="mx-auto flex items-center justify-center w-24 h-24 mb-6">
              <div className="relative">
                {/* Outer Ring */}
                <div className="absolute inset-0 bg-green-200 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-green-300 rounded-full animate-pulse"></div>
                
                {/* Main Circle */}
                <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center transform transition-all duration-500 scale-100 hover:scale-105 success-icon">
                  {/* Checkmark with Draw Animation */}
                  <svg 
                    className="w-10 h-10 text-white transition-all duration-700 ease-in-out" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{
                      strokeDasharray: '50',
                      strokeDashoffset: '0',
                      animation: 'drawCheck 0.8s ease-in-out forwards'
                    }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                
                {/* Success Particles */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute top-1 -left-3 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4 animate-pulse">
              🎉 تم إرسال طلب الدفع بنجاح!
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium mb-2">
                ✅ سيتم مراجعته من قبل الإدارة خلال 24 ساعة
              </p>
              <p className="text-green-700 text-sm">
                📧 ستصلك رسالة تأكيد على بريدك الإلكتروني
              </p>
            </div>

            {/* Progress Bar with Countdown */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{width: '100%'}}
              ></div>
            </div>

            {/* Auto Close Message with Countdown */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>سيتم إغلاق هذا المودال تلقائياً خلال 3 ثوانٍ...</span>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default PaymentModal;
