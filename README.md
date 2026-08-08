# چک‌لیست هوشمند چند دسته‌ای (Smart Checklist PWA)

یک Progressive Web App برای مدیریت چک‌لیست‌های چند دسته‌ای (سفر، کار، خانه، سلامت و ...) ساخته‌شده با Vue 3، Vite و Pinia. تمام داده‌ها به‌صورت آفلاین در `localStorage` مرورگر نگهداری می‌شوند و هیچ بک‌اندی لازم نیست.

## نصب و اجرا

```bash
npm install
npm run dev
```

برای build نهایی (شامل Service Worker و Manifest):

```bash
npm run build
npm run preview
```

## استک فنی

| لایه | ابزار |
|---|---|
| Framework | Vue 3 + Composition API (`<script setup>`) |
| Build Tool | Vite |
| State Management | Pinia |
| Styling | Tailwind CSS (Mobile-First, RTL) |
| PWA | vite-plugin-pwa (`generateSW`, `autoUpdate`) |
| Persistence | localStorage از طریق Repository Pattern |

## معماری پروژه

```
src/
├── models/            # کلاس‌های دامنه (OOP core)
│   ├── ChecklistItem.js
│   ├── ChecklistCategory.js
│   └── ChecklistTemplate.js
├── services/          # لایه سرویس و الگوهای طراحی
│   ├── StorageService.js         # Wrapper روی localStorage
│   ├── ChecklistRepository.js    # Repository Pattern
│   ├── ChecklistFactory.js       # Factory Pattern
│   └── ItemFilterStrategies.js   # Strategy Pattern (فیلتر/مرتب‌سازی)
├── stores/
│   └── checklistStore.js         # Pinia store (Observer/Reactive Pattern)
├── composables/
│   ├── useDebounce.js
│   └── useConfirm.js
├── components/         # کامپوننت‌های reusable
├── views/               # صفحات (lazy-loaded via router)
├── data/
│   └── defaultChecklists.js      # ۱۷ چک‌لیست پیش‌فرض کامل
└── router/
```

## الگوهای طراحی به‌کاررفته

- **Repository Pattern:** `ChecklistRepository` تمام رفت‌وآمد داده با `localStorage` را از UI جدا می‌کند؛ جایگزینی با IndexedDB فقط نیاز به تغییر همین یک فایل دارد.
- **Factory Pattern:** `ChecklistFactory` مسئول ساخت `ChecklistTemplate`، `ChecklistCategory` و `ChecklistItem` از روی تعاریف خام یا ورودی کاربر است.
- **Strategy Pattern:** `ItemFilterStrategies` فیلتر (همه/باقی‌مانده/انجام‌شده) و مرتب‌سازی (پیش‌فرض/الفبایی/جدیدترین) را به‌صورت استراتژی‌های قابل‌تبادل پیاده می‌کند.
- **Observer/Reactive Pattern:** استور Pinia به‌عنوان منبع واحد حقیقت، تغییرات را به‌صورت reactive به همه کامپوننت‌های مشترک پخش می‌کند.

## ویژگی‌های عملکردی

- افزودن/حذف/تیک‌زدن آیتم با تایید حذف (Confirm Dialog)
- ریست کامل یک چک‌لیست و ساخت چک‌لیست شخصی از صفر
- Export/Import کامل داده‌ها به‌صورت JSON
- جستجو، فیلتر و مرتب‌سازی آیتم‌ها
- Dark/Light mode با ذخیره ترجیح کاربر
- Windowed rendering (`VirtualItemList.vue`) برای دسته‌بندی‌هایی با آیتم زیاد (بیش از ۴۰ آیتم)
- Debounced auto-save در `localStorage` (۴۰۰ میلی‌ثانیه) برای کاهش I/O
- Lazy loading ویوها از طریق `vue-router` dynamic import

## چک‌لیست‌های پیش‌فرض (۱۷ مورد)

سفر جاده‌ای، سفر هوایی/خارج از کشور، کمپینگ، اسباب‌کشی، روز اول کار جدید، مصاحبه شغلی، رزومه‌نویسی، شروع پروژه نرم‌افزاری، عروسی، ورزش و باشگاه، خرید هفتگی، امنیت دیجیتال، نگهداری خودرو، تعمیرات خانه، بارداری و نوزاد، امتحان و درس خواندن، سفر با حیوان خانگی.

## نکات پیاده‌سازی PWA

فایل `vite.config.js` شامل تنظیمات کامل `manifest` (نام، آیکون‌های ۱۹۲ و ۵۱۲، `theme_color`، `dir: rtl`) و استراتژی `generateSW` با `registerType: 'autoUpdate'` است؛ یعنی نسخه جدید Service Worker به‌صورت خودکار و بدون نیاز به تایید کاربر جایگزین می‌شود.
