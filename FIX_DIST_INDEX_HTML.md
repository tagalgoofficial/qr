# إصلاح: Backend URL في dist/index.html بعد البناء
## Fix: Backend URL in dist/index.html After Build

---

## 🔴 المشكلة | Problem

بعد بناء المشروع (`npm run build`)، ملف `dist/index.html` قد لا يحتوي على `window.API_BACKEND_URL`، مما يؤدي إلى إرسال الطلبات إلى دومين Frontend بدلاً من Backend.

---

## ✅ الحل | Solution

### الطريقة 1: استخدام Script تلقائي (مُوصى به) ✅

استخدم الأمر الجديد الذي يضيف Backend URL تلقائياً:

```bash
npm run build:fix
```

أو بعد البناء العادي:

```bash
npm run build
npm run fix-dist
```

**هذا سيضيف `window.API_BACKEND_URL` تلقائياً إلى `dist/index.html`**

---

### الطريقة 2: تعديل `dist/index.html` يدوياً (بعد كل build)

بعد تشغيل `npm run build`:

1. **افتح `dist/index.html`**
2. **ابحث عن `<head>`**
3. **أضف قبل `</head>`:**

```html
<!-- Backend API Configuration -->
<script>
  (function() {
    window.API_BACKEND_URL = 'http://qr-algo-je.xo.je/backend/api';
    console.log('📡 [index.html] Backend API URL configured:', window.API_BACKEND_URL);
  })();
</script>
```

---

### الطريقة 2: استخدام Environment Variable (مُوصى به) ✅

#### أ. إنشاء ملف `.env.production`:

```bash
VITE_API_BACKEND_URL=http://qr-algo-je.xo.je/backend/api
```

#### ب. البناء مع Environment Variable:

```bash
npm run build
```

#### ج. الكود سيقرأ `import.meta.env.VITE_API_BACKEND_URL` تلقائياً

---

### الطريقة 3: استخدام Meta Tag (حل بديل)

يمكن استخدام meta tag بدلاً من script tag:

```html
<meta name="api-backend-url" content="http://qr-algo-je.xo.je/backend/api" />
```

ثم قراءته في الكود:
```javascript
const metaTag = document.querySelector('meta[name="api-backend-url"]');
const backendUrl = metaTag ? metaTag.getAttribute('content') : null;
```

---

## 🔧 إعداد Vercel (إذا كنت تستخدم Vercel)

### 1. إضافة Environment Variable في Vercel:

1. اذهب إلى Vercel Dashboard
2. اختر المشروع
3. Settings → Environment Variables
4. أضف:
   - **Name:** `VITE_API_BACKEND_URL`
   - **Value:** `http://qr-algo-je.xo.je/backend/api`
   - **Environment:** Production

### 2. إعادة النشر:

بعد إضافة Environment Variable، أعد نشر المشروع.

---

## 📝 ملاحظات | Notes

- **Vite ينسخ `index.html` إلى `dist/`** لكن قد لا يحافظ على script tags
- **Environment Variables** هي الطريقة الأفضل للإنتاج
- **تعديل `dist/index.html` يدوياً** يعمل لكن يجب تكراره بعد كل build

---

## 🧪 التحقق | Verification

بعد البناء، افتح `dist/index.html` وتحقق من:

1. وجود `window.API_BACKEND_URL` في script tag
2. أو وجود `VITE_API_BACKEND_URL` في الكود المبنى

في Console، يجب أن ترى:
```
📡 [index.html] Backend API URL configured: http://qr-algo-je.xo.je/backend/api
🔗 [Priority 1] Using window.API_BACKEND_URL: http://qr-algo-je.xo.je/backend/api
```

---

**آخر تحديث:** بعد إضافة دعم Environment Variables

