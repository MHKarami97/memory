# ویرایش هوشمند آفلاین

## نصب (یک‌بار)

```bash
pnpm add nspell dictionary-fa
pnpm run prepare:dictionary
pnpm dev
```

`prepare:dictionary` فایل‌های `.aff` و `.dic` را از `node_modules/dictionary-fa` به `public/dictionaries/fa/fa.aff` و `fa.dic` کپی می‌کند
(اسکریپت‌های `dev` و `build` آن را خودکار اجرا می‌کنند). اگر دیکشنری پیدا نشود، فقط بخش غلط‌یابی املایی غیرفعال می‌شود و بقیه کار می‌کنند.

## لایه‌ها

1. قواعد قطعی (نیم‌فاصله، حروف عربی، علائم نگارشی، لغت‌نامه typo): `src/services/enhancement/*`
2. غلط‌یابی املایی Hunspell داخل Web Worker: `src/services/spell/*`
3. مدل زبانی محلی داخل Web Worker + اعتبارسنجی خروجی: `src/services/textmodel/*`
4. دیکشنری شخصی (IndexedDB، جدول `userWords`): `src/services/UserDictionaryService.ts`

## حریم خصوصی

- متن خاطره هیچ‌وقت به شبکه ارسال نمی‌شود؛ همه پردازش‌ها محلی است.
- مدل فقط هنگام دانلود از Hugging Face گرفته می‌شود؛ هنگام اجرا `env.allowRemoteModels = false` است.
- کد، URL، ایمیل و کلمه‌های دیکشنری شخصی قبل از اجرای هر مرحله قفل می‌شوند.
