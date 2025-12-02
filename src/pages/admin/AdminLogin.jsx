import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../contexts/authStore';

const AdminLogin = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    // منع التمرير على الصفحة
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // إعادة تفعيل التمرير عند الخروج من الصفحة
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/admin/dashboard');
    }
  };
  
  return (
    <div 
      className={`h-screen w-screen fixed inset-0 overflow-hidden ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      style={{ overflow: 'hidden' }}
    >
      {/* Background with animated elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 sm:top-20 left-2 sm:left-4 md:left-20 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div className="absolute top-20 sm:top-40 right-2 sm:right-4 md:right-20 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-4 sm:-bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
      </div>
      
      <div className="relative z-10 h-full w-full flex flex-col justify-center py-3 sm:py-6 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8" style={{ overflow: 'hidden' }}>
        <div className="mx-auto w-full max-w-md flex flex-col">
          {/* Logo/Brand */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8 flex-shrink-0">
            <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="mt-2 sm:mt-4 md:mt-6 text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold gradient-text">
              {t('auth.signInToYourAccount')}
            </h2>
            <p className="mt-2 sm:mt-3 md:mt-4 text-center text-xs sm:text-sm md:text-base lg:text-lg text-gray-600">
              {t('auth.orRegisterNew')}{' '}
              <Link to="/admin/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>

          <div className="card-glass py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6 lg:px-8 flex-shrink-0">
            <form className="space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4 animate-slideInDown mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <h3 className="text-xs sm:text-sm font-semibold text-red-800 break-words">{error}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email" className="form-label text-sm sm:text-base">
                  {t('auth.emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-9 sm:pl-10 text-sm sm:text-base"
                    placeholder={t('auth.emailAddress')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label text-sm sm:text-base">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-9 sm:pl-10 text-sm sm:text-base"
                    placeholder={t('auth.password')}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm font-medium text-gray-700">
                    {t('auth.rememberMe')}
                  </label>
                </div>

                <div className="text-xs sm:text-sm">
                  <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                    {t('auth.forgotPassword')}
                  </a>
                </div>
              </div>

              <div className="pt-3 sm:pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-sm sm:text-base py-2.5 sm:py-3"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      {t('auth.signIn')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;