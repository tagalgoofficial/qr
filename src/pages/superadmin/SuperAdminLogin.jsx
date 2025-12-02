import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/authService';
import useAuthStore from '../../contexts/authStore';

const SuperAdminLogin = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUserAndRole, user, role } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    if (user && role === 'super_admin') {
      navigate('/superadmin/dashboard');
    }
  }, [user, role, navigate]);

  // Prevent scroll on mount and set initial direction
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const currentLang = i18n.language || 'ar';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    return () => {
      document.body.style.overflow = '';
    };
  }, [i18n.language]);
  
  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authService.login(email, password);
      const user = result.user;
      
      if (user.role !== 'super_admin') {
        throw new Error(t('auth.notSuperAdmin') || 'هذا الحساب ليس لديه صلاحيات Super Admin');
      }
      
      setUserAndRole({
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.displayName
      }, 'super_admin');
      
      navigate('/superadmin/dashboard');
    } catch (err) {
      let errorMessage = t('auth.loginFailed') || 'فشل في تسجيل الدخول';
      
      if (err.status === 401) {
        errorMessage = t('auth.invalidCredentials') || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (err.status === 403) {
        errorMessage = t('auth.accountDisabled') || 'تم تعطيل الحساب';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const isRTL = i18n.language === 'ar';
  
  return (
    <div 
      className={`min-h-screen w-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
        {/* Language Toggle */}
          <motion.div
            variants={itemVariants}
            className={`absolute top-4 sm:top-6 z-20 ${isRTL ? 'left-4 sm:left-6' : 'right-4 sm:right-6'}`}
          >
            <motion.button
            onClick={handleLanguageToggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium transition-all duration-300 hover:bg-white/20 hover:border-white/30 shadow-lg"
          >
              <span className="relative z-10">
              {i18n.language === 'en' ? 'عربي' : 'English'}
            </span>
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                layoutId="languageBg"
              />
            </motion.button>
          </motion.div>

          {/* Logo and Brand */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8"
          >
            <motion.div
              className="mx-auto mb-6 relative"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Glowing Background Circle */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {/* Logo Container */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/20 backdrop-blur-sm">
                <motion.svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </motion.svg>
            </div>
            </motion.div>
            
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent"
            >
              Mr QR Menu
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-purple-300/80 text-lg font-medium"
            >
              by Tag algo
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="text-white/60 text-sm mt-2"
            >
              Super Admin Portal
            </motion.p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            variants={cardVariants}
            className="relative"
          >
            {/* Glassmorphism Card */}
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 overflow-hidden">
              {/* Animated Gradient Border */}
              <motion.div
                className="absolute inset-0 rounded-3xl opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                <motion.h2
                  variants={itemVariants}
                  className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center"
                >
                  {t('auth.signIn') || 'تسجيل الدخول'}
                </motion.h2>

            <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="relative bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-2xl p-4"
                      >
                        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <motion.div
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5 }}
                            className="flex-shrink-0"
                          >
                            <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </motion.div>
                          <p className={`text-sm text-red-200 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

              {/* Email Field */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                      {t('auth.emailAddress') || 'البريد الإلكتروني'}
                </label>
                    <motion.div
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                        <motion.svg
                          className={`h-5 w-5 transition-colors duration-300 ${
                            focusedField === 'email' ? 'text-purple-400' : 'text-white/50'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          animate={focusedField === 'email' ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </motion.svg>
                  </div>
                      <motion.input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full py-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                        placeholder={t('auth.emailAddress') || 'أدخل بريدك الإلكتروني'}
                        whileFocus={{ borderColor: "rgba(196, 181, 253, 0.5)" }}
                  />
                    </motion.div>
                  </motion.div>

              {/* Password Field */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">
                      {t('auth.password') || 'كلمة المرور'}
                </label>
                    <motion.div
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                        <motion.svg
                          className={`h-5 w-5 transition-colors duration-300 ${
                            focusedField === 'password' ? 'text-purple-400' : 'text-white/50'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          animate={focusedField === 'password' ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </motion.svg>
                  </div>
                      <motion.input
                    id="password"
                    name="password"
                        type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full py-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300 ${isRTL ? 'pr-12 pl-12' : 'pl-12 pr-12'}`}
                        placeholder={t('auth.password') || 'أدخل كلمة المرور'}
                        whileFocus={{ borderColor: "rgba(196, 181, 253, 0.5)" }}
                  />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`absolute inset-y-0 flex items-center text-white/50 hover:text-white/80 transition-colors duration-200 ${isRTL ? 'left-0 pl-4' : 'right-0 pr-4'}`}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m1.17 1.17L3 3m0 0l18 18m-3.29-3.29a9.97 9.97 0 01-1.17-1.17M21 21l-3.29-3.29" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
              )}
                      </motion.button>
                    </motion.div>
                  </motion.div>

              {/* Submit Button */}
                  <motion.div variants={itemVariants} className="pt-2">
                    <motion.button
                  type="submit"
                  disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {/* Animated Gradient Background */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{
                          backgroundSize: '200% 200%',
                        }}
                      />
                      
                      {/* Shine Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={loading ? {} : { x: '200%' }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Button Content */}
                      <div className={`relative z-10 flex items-center justify-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {loading ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            />
                            <span>{t('auth.signingIn') || 'جاري تسجيل الدخول...'}</span>
                          </>
                  ) : (
                          <>
                            <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                            <span>{t('auth.signIn') || 'تسجيل الدخول'}</span>
                          </>
                        )}
                    </div>
                    </motion.button>
                  </motion.div>
                </form>
              </div>
          </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-8 text-center"
          >
            <p className="text-white/40 text-sm">
              © 2024 Tag algo. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
