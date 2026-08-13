# Visual Works Encyclopedia — Android APK workflow

هذا المجلد يضيف عميل Android خفيفًا مبنيًا على Expo، ويعرض النسخة المنشورة من موسوعة Visual Works داخل WebView. بهذه البنية تُعاد الاستفادة من البحث، خريطة العوالم، الخط الزمني لمارفل، بطاقات الشخصيات، وروابط المشاركة الحالية دون إعادة كتابة واجهة الويب بالكامل في React Native.

## التشغيل المحلي

من جذر المشروع شغّل:

```bash
cd mobile
pnpm install
pnpm start
```

بعد ذلك يمكن تشغيل Expo Go أو محاكي Android. يتطلب اختبار الجهاز الحقيقي اتصالًا بالإنترنت لأن التطبيق يقرأ من `https://visualworks-cnmtcefg.manus.space`.

## إنشاء APK تجريبي

ثبّت أداة EAS وسجّل الدخول إلى حساب Expo الخاص بك:

```bash
cd mobile
pnpm dlx eas-cli login
pnpm dlx eas-cli build:configure
pnpm build:apk
```

ملف `eas.json` يضبط ملف `preview` ليُنتج APK داخليًا قابلًا للتثبيت والمشاركة. بعد انتهاء البناء يعرض EAS رابط تنزيل الملف. لا يحتاج هذا المسار إلى مفتاح API داخل التطبيق.

## روابط المشاركة

يدعم التطبيق مخطط `visualworks://`. أمثلة:

```text
visualworks://marvel-timeline?order=event
visualworks://work/123?character=456
visualworks://universe?universe=789&character=456
```

عند فتح رابط مخطط الهاتف، يحوّله الغلاف إلى نطاق الموقع المنشور. ولضمان استعادة الحالة بشكل كامل يجب أن تبقى معاملات الرابط كما هي في روابط المشاركة التي يولدها الموقع.

## إعداد الإصدار الإنتاجي

قبل رفع التطبيق إلى Google Play، غيّر `android.versionCode` في `app.json` مع كل إصدار، وأضف أيقونة وsplash screen خاصين بالعلامة التجارية، ثم استخدم:

```bash
cd mobile
pnpm dlx eas-cli build --platform android --profile production
```

ينتج ملف AAB مناسبًا للمتجر بدل APK الاختبار الداخلي. هذا المجلد لا يحتوي على كلمات مرور أو رموز GitHub أو ملفات `.env`.
