/**
 * دالة لتنسيق التواريخ من MySQL DATETIME أو JavaScript Date
 * @param {any} date - التاريخ (MySQL DATETIME string, Date, string, أو number)
 * @param {Object} options - خيارات التنسيق
 * @returns {string} التاريخ المنسق
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'غير محدد';
  
  try {
    let dateObj;
    
    // إذا كان التاريخ Date object
    if (date instanceof Date) {
      dateObj = date;
    }
    // إذا كان التاريخ string (MySQL DATETIME أو ISO string)
    else if (typeof date === 'string') {
      // MySQL format: "2024-01-15 10:30:00" -> "2024-01-15T10:30:00"
      const dateStr = date.replace(' ', 'T');
      dateObj = new Date(dateStr);
    }
    // إذا كان التاريخ number (timestamp)
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    // Handle legacy timestamp formats (for backward compatibility)
    else if (date && typeof date === 'object') {
      if (date.seconds !== undefined) {
        dateObj = new Date(date.seconds * 1000);
      } else if (date.toDate && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else {
        dateObj = new Date(date);
      }
    }
    else {
      dateObj = new Date(date);
    }
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صحيح';
    }
    
    // الخيارات الافتراضية
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      locale: 'ar-EG'
    };
    
    // دمج الخيارات الممررة مع الافتراضية
    const formatOptions = { ...defaultOptions, ...options };
    
    return dateObj.toLocaleString(formatOptions.locale, formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'تاريخ غير صحيح';
  }
};

/**
 * دالة لتنسيق التاريخ فقط (بدون الوقت)
 * @param {any} date - التاريخ
 * @returns {string} التاريخ المنسق
 */
export const formatDateOnly = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * دالة لتنسيق الوقت فقط (بدون التاريخ)
 * @param {any} date - التاريخ
 * @returns {string} الوقت المنسق
 */
export const formatTimeOnly = (date) => {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * دالة للحصول على التاريخ النسبي (مثل "منذ ساعتين")
 * @param {any} date - التاريخ
 * @returns {string} التاريخ النسبي
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'غير محدد';
  
  try {
    let dateObj;
    
    // Handle different date formats
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      const dateStr = date.replace(' ', 'T');
      dateObj = new Date(dateStr);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else if (date && typeof date === 'object') {
      // Handle legacy timestamp formats (for backward compatibility)
      if (date.seconds !== undefined) {
        dateObj = new Date(date.seconds * 1000);
      } else if (date.toDate && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صحيح';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'الآن';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `منذ ${minutes} دقيقة`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `منذ ${hours} ساعة`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `منذ ${days} يوم`;
    } else {
      return formatDateOnly(date);
    }
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'تاريخ غير صحيح';
  }
};
