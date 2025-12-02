/**
 * تحويل النص إلى slug صالح للـ URL
 * @param {string} text - النص المراد تحويله
 * @returns {string} - الـ slug
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // تحويل الأحرف العربية إلى أحرف لاتينية أو إبقاؤها كما هي
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (char) => {
      // يمكن إضافة تحويل أفضل هنا إذا لزم الأمر
      return char;
    })
    // استبدال المسافات بـ -
    .replace(/\s+/g, '-')
    // إزالة الأحرف الخاصة
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    // إزالة - المتعددة
    .replace(/-+/g, '-')
    // إزالة - من البداية والنهاية
    .replace(/^-+|-+$/g, '');
};

/**
 * إنشاء slug فريد بإضافة رقم في حالة التكرار
 * @param {string} baseSlug - الـ slug الأساسي
 * @param {number} counter - العداد
 * @returns {string} - الـ slug الفريد
 */
export const generateUniqueSlug = (baseSlug, counter = 0) => {
  if (counter === 0) {
    return baseSlug;
  }
  return `${baseSlug}-${counter}`;
};

