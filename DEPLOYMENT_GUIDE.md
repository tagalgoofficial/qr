# دليل النشر - Backend و Frontend منفصلين
## Deployment Guide - Separate Backend and Frontend Hosting

---

## 📋 نظرة عامة | Overview

هذا الدليل يشرح كيفية رفع المشروع عندما يكون **Backend** و **Frontend** على استضافات مختلفة.

---

## 🔧 الإعدادات المطلوبة | Required Configuration

### 1. تعديل Backend URL في `index.html`

افتح ملف `index.html` وابحث عن:

```html
<!-- Backend API Configuration -->
<script>
  window.API_BACKEND_URL = 'http://qr-algo-je.xo.je/backend/api';
  // For local development, uncomment the line below and comment the line above:
  // window.API_BACKEND_URL = '/backend/api';
</script>
```

**غيّر `http://qr-algo-je.xo.je/backend/api` إلى دومين Backend الخاص بك.**

---

## 🚀 خطوات النشر | Deployment Steps

### الخطوة 1: رفع Backend

1. **ارفع مجلد `backend/` إلى الاستضافة:**
   ```
   /public_html/backend/
   أو
   /htdocs/backend/
   ```

2. **تأكد من أن المسار صحيح:**
   - يجب أن تكون ملفات PHP في: `backend/api/`
   - يجب أن تكون قاعدة البيانات متصلة

3. **تحقق من CORS في `backend/config.php`:**
   ```php
   define('ALLOWED_ORIGINS', [
       'http://localhost:5173',
       'http://localhost:3000',
       'http://localhost:8080',
       'https://your-frontend-domain.com',  // ← أضف دومين Frontend هنا
       'https://qr-algo-je.xo.je'           // ← مثال
   ]);
   ```

---

### الخطوة 2: رفع Frontend

1. **قم ببناء المشروع:**
   ```bash
   npm run build
   ```

2. **ارفع محتويات مجلد `dist/` إلى استضافة Frontend**

3. **عدّل `index.html` في مجلد `dist/`:**
   - افتح `dist/index.html`
   - غيّر `window.API_BACKEND_URL` إلى دومين Backend

---

### الخطوة 3: تحديث `index.html` في `dist/`

بعد البناء، يجب تعديل `dist/index.html`:

```html
<script>
  window.API_BACKEND_URL = 'https://your-backend-domain.com/backend/api';
</script>
```

**مثال:**
```html
<script>
  window.API_BACKEND_URL = 'http://qr-algo-je.xo.je/backend/api';
</script>
```

---

## 🔄 كيف يعمل النظام | How It Works

### أولوية تحديد Backend URL:

1. **الأولوية الأولى:** `window.API_BACKEND_URL` من `index.html`
   - إذا كان موجوداً، يتم استخدامه مباشرة

2. **الأولوية الثانية:** Vite Dev Server
   - إذا كان Frontend على port 5173, 3000, 8080
   - يستخدم `http://localhost/backend/api`

3. **الأولوية الثالثة:** المسار النسبي
   - يستخدم `/backend/api` (يعمل على نفس الدومين)

---

## ✅ التحقق من الإعدادات | Verification

### 1. تحقق من Backend:

افتح في المتصفح:
```
https://your-backend-domain.com/backend/api/test-cors.php
```

**النتيجة المتوقعة:** JSON response

---

### 2. تحقق من Frontend:

1. افتح Developer Tools → Console
2. اكتب:
   ```javascript
   console.log(window.API_BACKEND_URL);
   ```
3. يجب أن يظهر URL Backend الصحيح

---

### 3. تحقق من CORS:

1. افتح Developer Tools → Network
2. حاول تسجيل الدخول
3. تحقق من أن الطلبات تصل إلى Backend الصحيح
4. تحقق من عدم وجود أخطاء CORS

---

## 🔧 إعدادات Backend (`backend/config.php`)

```php
// API Configuration
define('API_BASE_URL', '/backend/api/');
define('BASE_URL', '/backend');

// CORS Configuration
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'https://your-frontend-domain.com',  // ← دومين Frontend
    'https://qr-algo-je.xo.je'           // ← مثال
]);
```

---

## 📝 ملاحظات مهمة | Important Notes

### ✅ المزايا:
- **مرونة كاملة:** يمكن تغيير Backend URL بسهولة
- **يعمل تلقائياً:** في التطوير والإنتاج
- **لا حاجة لتعديل الكود:** فقط `index.html`

### ⚠️ تحذيرات:
- **تأكد من CORS:** أضف دومين Frontend إلى `ALLOWED_ORIGINS`
- **تأكد من HTTPS:** في الإنتاج، استخدم HTTPS للـ Backend
- **تأكد من المسار:** Backend يجب أن يكون في `/backend/api/`

---

## 🆘 حل المشاكل | Troubleshooting

### مشكلة: CORS Error

**الحل:**
1. أضف دومين Frontend إلى `ALLOWED_ORIGINS` في `backend/config.php`
2. تأكد من أن `backend/bootstrap.php` يتم تحميله

---

### مشكلة: API لا يعمل

**الحل:**
1. تحقق من `window.API_BACKEND_URL` في Console
2. تحقق من أن Backend يعمل: `https://your-backend-domain.com/backend/api/test-cors.php`
3. تحقق من Network Tab في Developer Tools

---

### مشكلة: الصور لا تظهر

**الحل:**
1. تأكد من أن `BASE_URL` في `backend/config.php` صحيح
2. تأكد من أن الصور تستخدم مسارات نسبية
3. تحقق من أن `getImageUrl()` في `src/utils/imageUtils.js` يعمل

---

## 📚 الملفات المهمة | Important Files

- `index.html` - إعداد Backend URL
- `src/config.js` - إعدادات API الديناميكية
- `src/api/index.js` - API Service
- `src/services/api.js` - API Service الرئيسي
- `backend/config.php` - إعدادات Backend و CORS

---

## ✅ Checklist للنشر | Deployment Checklist

- [ ] رفع Backend إلى الاستضافة
- [ ] إضافة دومين Frontend إلى `ALLOWED_ORIGINS` في `backend/config.php`
- [ ] بناء Frontend (`npm run build`)
- [ ] رفع محتويات `dist/` إلى استضافة Frontend
- [ ] تعديل `window.API_BACKEND_URL` في `dist/index.html`
- [ ] اختبار Backend: `https://your-backend-domain.com/backend/api/test-cors.php`
- [ ] اختبار Frontend: فتح الموقع والتحقق من Console
- [ ] اختبار تسجيل الدخول
- [ ] اختبار رفع الصور
- [ ] اختبار جميع الوظائف الأساسية

---

## 💡 نصائح | Tips

1. **استخدم HTTPS في الإنتاج** - أكثر أماناً
2. **اختبر على localhost أولاً** - قبل النشر
3. **راقب Console** - للأخطاء والتحذيرات
4. **استخدم Network Tab** - لفحص الطلبات
5. **احتفظ بنسخة احتياطية** - قبل أي تعديل

---

**آخر تحديث:** بعد إضافة دعم Backend و Frontend منفصلين

**المساعدة:** إذا واجهت مشاكل، تحقق من Console و Network Tab في Developer Tools

