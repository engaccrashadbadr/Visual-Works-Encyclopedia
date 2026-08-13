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

## إنشاء APK تجريبي عبر GitHub Actions

بيئة البناء الحالية لا تحتوي على Android SDK أو `adb`، لذلك لا يمكن إنتاج APK محليًا من هذه الجلسة. أُضيف workflow في `.github/workflows/android-apk.yml` ليبني APK تلقائيًا باستخدام EAS ثم يرفعه كـ Artifact قابل للتنزيل.

للتشغيل، افتح إعدادات المستودع على GitHub ثم اذهب إلى **Settings → Secrets and variables → Actions → New repository secret**. أنشئ سرًا باسم `EXPO_TOKEN` وضع فيه رمز وصول Expo/EAS فقط. لا تضع الرمز داخل المستودع أو في هذا الملف. بعد ذلك افتح **Actions → Build Android APK → Run workflow**، وانتظر انتهاء المهمة، ثم نزّل `visual-works-encyclopedia-apk` من قسم **Artifacts**.

يمكن تشغيل البناء أيضًا تلقائيًا عند دفع تعديل داخل `mobile/`. ويستخدم workflow ملف `eas.json` الحالي، حيث يضبط ملف `preview` لإنتاج APK داخلي قابلًا للتثبيت والمشاركة.

## البناء المحلي عند توفر Android SDK

إذا كان Android SDK وGradle مثبتين، يمكن البناء محليًا بالأوامر التالية:

```bash
cd mobile
pnpm install
pnpm exec expo prebuild --platform android --no-install
pnpm exec expo run:android --variant release --no-bundler
```

أما بناء EAS من جهاز محلي فيتطلب جلسة Expo أو المتغير `EXPO_TOKEN`:

```bash
cd mobile
export EXPO_TOKEN="ضَع الرمز في مدير أسرار محلي فقط"
pnpm dlx eas-cli build --platform android --profile preview --non-interactive
```

لا يحتاج التطبيق إلى مفتاح API داخل الهاتف، ولا يجب حفظ `EXPO_TOKEN` في Git أو ملفات `.env` المرفوعة.

## روابط المشاركة

يدعم التطبيق مخطط `visualworks://`. أمثلة:

```text
visualworks://marvel-timeline?order=event
visualworks://work/123?character=456
visualworks://universe?universe=789&character=456
```

عند فتح رابط مخطط الهاتف، يحوّله الغلاف إلى نطاق الموقع المنشور. ولضمان استعادة الحالة بشكل كامل يجب أن تبقى معاملات الرابط كما هي في روابط المشاركة التي يولدها الموقع.

## إعداد الإصدار الإنتاجي

قبل رفع التطبيق إلى Google Play، غيّر `android.versionCode` في `app.json` مع كل إصدار. الأيقونة وشاشة البداية موجودتان في `mobile/assets/` ومربوطتان في `app.json`. بعد إضافة `EXPO_TOKEN` إلى أسرار GitHub يمكن تعديل ملف workflow إلى ملف `production` إذا أُريد إنشاء AAB للمتجر بدل APK الاختبار الداخلي.

ينتج ملف AAB مناسبًا للمتجر باستخدام:

```bash
cd mobile
pnpm dlx eas-cli build --platform android --profile production --non-interactive
```

هذا المجلد لا يحتوي على كلمات مرور أو رموز GitHub أو ملفات `.env`.
