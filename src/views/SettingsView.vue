<template>
  <div class="max-w-4xl mx-auto p-4 sm:p-6 pb-28 md:pb-12 space-y-8">
    <div>
      <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Settings class="w-6 h-6 text-indigo-500" />
        <span>تنظیمات و پیکربندی برنامه</span>
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        شخصی‌سازی ظاهر، کیفیت عکس‌ها، موتور هوش مصنوعی تبدیل صدا، امنیت و نسخه پشتیبان
      </p>
    </div>

    <!-- 1. Appearance & Display -->
    <div class="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900 space-y-5 transition-colors">
      <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Palette class="w-4 h-4 text-indigo-500" />
        <span>ظاهر و چیدمان</span>
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Theme Mode -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">تم رنگی برنامه:</label>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <button
              v-for="t in [
                { id: 'light', label: 'روشن', icon: Sun },
                { id: 'dark', label: 'تاریک', icon: Moon },
                { id: 'system', label: 'سیستم', icon: Monitor },
              ]"
              :key="t.id"
              type="button"
              class="p-2.5 rounded-xl border flex flex-col items-center gap-1.5 font-medium transition-all"
              :class="settingsStore.settings.themeMode === t.id ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'"
              @click="settingsStore.updateSetting('themeMode', t.id as any)"
            >
              <component :is="t.icon" class="w-4 h-4" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">اندازه قلم (فونت):</label>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <button
              v-for="f in [
                { id: 'sm', label: 'کوچک' },
                { id: 'base', label: 'متوسط' },
                { id: 'lg', label: 'بزرگ' },
              ]"
              :key="f.id"
              type="button"
              class="p-2.5 rounded-xl border font-medium transition-all"
              :class="settingsStore.settings.fontSize === f.id ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'"
              @click="settingsStore.updateSetting('fontSize', f.id as any)"
            >
              <span>{{ f.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Photo Compression Quality -->
    <div class="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900 space-y-4 transition-colors">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ImageIcon class="w-4 h-4 text-emerald-500" />
            <span>کیفیت فشرده‌سازی عکس‌ها</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            همه تصاویر پیش از ذخیره‌سازی در دیتابیس دستگاه، بهینه‌سازی و فشرده می‌شوند تا حافظه پر نشود.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <label
          v-for="q in [
            { id: 'high', label: 'کیفیت بالا (ابعاد تا 1920px)', desc: 'بزرگنمایی بالا، حجم فایل کمی بیشتر' },
            { id: 'medium', label: 'کیفیت متعادل (پیشنهادی)', desc: 'بهترین تعادل میان وضوح و مصرف حافظه' },
            { id: 'low', label: 'فوق‌العاده سبک و کم‌حجم', desc: 'صرفه‌جویی حداکثری در حافظه گوشی' },
          ]"
          :key="q.id"
          class="p-3.5 rounded-2xl border cursor-pointer space-y-1 transition-all"
          :class="settingsStore.settings.photoQuality === q.id ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'"
        >
          <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <input
              type="radio"
              name="photoQuality"
              :value="q.id"
              :checked="settingsStore.settings.photoQuality === q.id"
              class="text-emerald-600 focus:ring-emerald-500"
              @change="settingsStore.updateSetting('photoQuality', q.id as any)"
            />
            <span>{{ q.label }}</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-normal pr-5">{{ q.desc }}</p>
        </label>
      </div>
    </div>

    <!-- 3. Smart Writing & Spell-Check -->
    <div class="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900 space-y-4 transition-colors">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wand2 class="w-4 h-4 text-indigo-500" />
            <span>نگارش و ویرایش هوشمند متن (Spell-Check & Formatting)</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تنظیمات تصحیح خودکار غلط املایی فارسی و انگلیسی، استانداردسازی نیم‌فاصله‌ها و فرمت‌بندی هوشمند مارک‌داون
          </p>
        </div>

        <!-- Help Guide Toggle Button -->
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
          @click="showEnhancementGuide = !showEnhancementGuide"
        >
          <HelpCircle class="w-3.5 h-3.5 text-indigo-500" />
          <span>راهنما و مثال‌های کاربردی</span>
          <ChevronUp v-if="showEnhancementGuide" class="w-3.5 h-3.5" />
          <ChevronDown v-else class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Collapsible Guide Panel -->
      <div
        v-if="showEnhancementGuide"
        class="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 space-y-4 animate-in fade-in duration-200"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
          <Sparkles class="w-4 h-4 text-amber-500 shrink-0" />
          <span>راهنمای استفاده و جدول تبدیل‌های هوشمند: چه بنویسید تا خودکار فرمت شود؟</span>
        </div>

        <!-- Guide Section A: Smart Markdown Formatting -->
        <div class="space-y-2">
          <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>۱. فرمت‌بندی خودکار لیست‌ها، بولد و نشانه‌ها:</span>
          </h5>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="text-slate-400 block font-medium">اگر این‌طور بنویسید (ورودی):</span>
              <p class="font-mono text-rose-600 dark:text-rose-400">۱- ورزش صبحگاهی<br>1) مطالعه کتاب<br>• تماس با دوستان</p>
              <span class="text-slate-400 block font-medium pt-1">تبدیل می‌شود به (خروجی استاندارد):</span>
              <p class="font-mono text-emerald-600 dark:text-emerald-400">1. ورزش صبحگاهی<br>1. مطالعه کتاب<br>- تماس با دوستان</p>
            </div>

            <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="text-slate-400 block font-medium">اگر کلمات کلیدی بنویسید (ورودی):</span>
              <p class="font-mono text-rose-600 dark:text-rose-400">نکته مهم: فردا زودتر بیدار شوم<br>یادآوری: داروها را بخرم<br>هشدار: درایو پر شده</p>
              <span class="text-slate-400 block font-medium pt-1">تبدیل می‌شود به (برجسته‌سازی خودکار):</span>
              <p class="font-mono text-emerald-600 dark:text-emerald-400">**نکته مهم:** فردا زودتر بیدار شوم<br>**یادآوری:** داروها را بخرم<br>**هشدار:** درایو پر شده</p>
            </div>
          </div>
        </div>

        <!-- Guide Section B: Persian & English Spell Check & Half-Space -->
        <div class="space-y-2">
          <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>۲. تصحیح خودکار غلط املایی و نیم‌فاصله‌های هوشمند:</span>
          </h5>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="font-bold text-indigo-600 dark:text-indigo-400 block">نیم‌فاصله‌گذاری (ZWNJ):</span>
              <ul class="space-y-1 text-slate-600 dark:text-slate-300">
                <li>می روم ➔ <strong class="text-slate-900 dark:text-slate-100">می‌روم</strong></li>
                <li>کتاب ها ➔ <strong class="text-slate-900 dark:text-slate-100">کتاب‌ها</strong></li>
                <li>عکس هایم ➔ <strong class="text-slate-900 dark:text-slate-100">عکس‌هایم</strong></li>
                <li>به عنوان ➔ <strong class="text-slate-900 dark:text-slate-100">به‌عنوان</strong></li>
                <li>فوق العاده ➔ <strong class="text-slate-900 dark:text-slate-100">فوق‌العاده</strong></li>
              </ul>
            </div>

            <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="font-bold text-indigo-600 dark:text-indigo-400 block">غلط‌های املایی فارسی:</span>
              <ul class="space-y-1 text-slate-600 dark:text-slate-300">
                <li>اصلا / اصلن ➔ <strong class="text-slate-900 dark:text-slate-100">اصلاً</strong></li>
                <li>خاهش / خاستم ➔ <strong class="text-slate-900 dark:text-slate-100">خواهش / خواستم</strong></li>
                <li>راجب / راجعبه ➔ <strong class="text-slate-900 dark:text-slate-100">راجع‌به</strong></li>
                <li>سپاسگذار ➔ <strong class="text-slate-900 dark:text-slate-100">سپاسگزار</strong></li>
                <li>مساله ➔ <strong class="text-slate-900 dark:text-slate-100">مسئله</strong></li>
              </ul>
            </div>

            <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="font-bold text-indigo-600 dark:text-indigo-400 block">انگلیسی و نگارشی:</span>
              <ul class="space-y-1 text-slate-600 dark:text-slate-300">
                <li>teh ➔ <strong class="text-slate-900 dark:text-slate-100">the</strong></li>
                <li>recieve ➔ <strong class="text-slate-900 dark:text-slate-100">receive</strong></li>
                <li>seperate ➔ <strong class="text-slate-900 dark:text-slate-100">separate</strong></li>
                <li>کجا رفتی ? ➔ <strong class="text-slate-900 dark:text-slate-100">کجا رفتی؟</strong></li>
                <li>سلام ! ➔ <strong class="text-slate-900 dark:text-slate-100">سلام!</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Interactive Playground / Test Box -->
        <div class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/70 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ArrowLeftRight class="w-3.5 h-3.5 text-indigo-500" />
              <span>کادر آزمایش زنده (Playground):</span>
            </span>

            <button
              type="button"
              class="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              @click="runPlaygroundTest"
            >
              امتحان کن و تصحیح کن
            </button>
          </div>

          <textarea
            v-model="playgroundInput"
            rows="2"
            class="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed"
            placeholder="یک متن با غلط املایی یا فرمت دلخواه بنویسید تا اصلاح شود..."
          ></textarea>

          <div v-if="playgroundResult" class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mb-1">نتیجه پس از ویرایش خودکار:</span>
            <p class="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{{ playgroundResult }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-3 pt-1">
        <!-- Spell Check Toggle -->
        <div class="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div class="space-y-0.5">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">
              تصحیح خودکار غلط املایی و نیم‌فاصله‌ها (فارسی و انگلیسی)
            </h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              اصلاح خودکار نیم‌فاصله‌های افعال و پسوندها (می‌روم، کتاب‌ها)، ی/ک عربی، علائم نگارشی و اصلاح اشتباهات رایج تایپی در زمان ثبت یا ذخیره خاطره
            </p>
          </div>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all"
            :class="settingsStore.settings.autoSpellCheck ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'"
            @click="settingsStore.updateSetting('autoSpellCheck', !settingsStore.settings.autoSpellCheck)"
          >
            {{ settingsStore.settings.autoSpellCheck ? 'فعال' : 'غیرفعال' }}
          </button>
        </div>

        <!-- Smart Formatting Toggle -->
        <div class="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div class="space-y-0.5">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">
              فرمت‌بندی خودکار هوشمند مارک‌داون (لیست‌ها و عبارات مهم)
            </h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تبدیل خودکار خطوط لیست (مانند ۱- یا •) به لیست استاندارد مارک‌داون، برجسته‌سازی کلمات تاکیدی (مانند نکته: یا یادآوری:) و فاصله‌بندی استاندارد
            </p>
          </div>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all"
            :class="settingsStore.settings.autoFormatting ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'"
            @click="settingsStore.updateSetting('autoFormatting', !settingsStore.settings.autoFormatting)"
          >
            {{ settingsStore.settings.autoFormatting ? 'فعال' : 'غیرفعال' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 4. Speech-to-Text & Local AI Models -->
    <div class="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900 space-y-5 transition-colors">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Mic class="w-4 h-4 text-rose-500" />
          <span>موتور تبدیل ویس به متن (Speech-to-Text)</span>
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          می‌توانید بین پردازش سیستمی مرورگر و اجرای کامل مدل‌های هوش مصنوعی روی دستگاه (بدون اینترنت) انتخاب کنید.
        </p>
      </div>

      <!-- Engine Selector -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <label
          class="p-3.5 rounded-2xl border cursor-pointer space-y-1 transition-all"
          :class="settingsStore.settings.speechEngine === 'system' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'"
        >
          <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <input
              type="radio"
              name="speechEngine"
              value="system"
              :checked="settingsStore.settings.speechEngine === 'system'"
              class="text-indigo-600"
              @change="settingsStore.updateSetting('speechEngine', 'system')"
            />
            <span>موتور سیستمی مرورگر (Web Speech API)</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-normal pr-5">
            سریع و بدون نیاز به دانلود فایل؛ اما ممکن است بسته به سیستم عامل صدا برای پردازش به سرور مرورگر ارسال شود.
          </p>
        </label>

        <label
          class="p-3.5 rounded-2xl border cursor-pointer space-y-1 transition-all"
          :class="settingsStore.settings.speechEngine === 'local' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'"
        >
          <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <input
              type="radio"
              name="speechEngine"
              value="local"
              :checked="settingsStore.settings.speechEngine === 'local'"
              class="text-indigo-600"
              @change="settingsStore.updateSetting('speechEngine', 'local')"
            />
            <span>مدل محلی ویسپر (۱۰۰٪ آفلاین و محرمانه)</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-normal pr-5">
            مدل هوش مصنوعی یک‌بار دانلود شده و به شکل محلی داخل پردازنده دستگاه بدون اینترنت اجرا می‌شود.
          </p>
        </label>
      </div>

      <!-- Local Models List -->
      <div v-if="settingsStore.settings.speechEngine === 'local'" class="space-y-3 pt-2">
        <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300">مدل‌های محلی قابل دانلود:</h4>
        <div class="space-y-3">
          <LocalModelCard
            v-for="model in availableModels"
            :key="model.id"
            :model="model"
            :is-default="settingsStore.settings.defaultLocalModelId === model.id"
            @downloaded="refreshModels"
            @set-default="setDefaultModel"
            @delete="deleteModel"
          />
        </div>
      </div>
    </div>

    <!-- 4. Daily Reminder (Notification API) -->
    <div class="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900 space-y-4 transition-colors">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell class="w-4 h-4 text-amber-500" />
            <span>یادآور روزانه ثبت خاطره</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ارسال اعلان در ساعت مشخص. اگر در آن روز قبلاً خاطره‌ای ثبت کرده باشید، اعلانی ارسال نخواهد شد.
          </p>
        </div>

        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          :class="settingsStore.settings.dailyReminderEnabled ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
          @click="toggleDailyReminder"
        >
          {{ settingsStore.settings.dailyReminderEnabled ? 'فعال' : 'غیرفعال' }}
        </button>
      </div>

      <div v-if="settingsStore.settings.dailyReminderEnabled" class="flex items-center justify-between gap-3 pt-2 flex-wrap">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">ساعت ارسال اعلان:</span>
          <input
            v-model="reminderTime"
            type="time"
            class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
            @change="onReminderTimeChanged"
          />
        </div>

        <button
          type="button"
          class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          @click="testReminderNotification"
        >
          ارسال اعلان آزمایشی
        </button>
      </div>
    </div>

    <!-- 5. Security & Biometrics -->
    <SecuritySettings />

    <!-- 6. Encrypted Backup & Restore -->
    <BackupManager />

    <!-- 7. Storage Breakdown -->
    <div class="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900 space-y-4 transition-colors">
      <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <HardDrive class="w-4 h-4 text-indigo-500" />
        <span>فضای اشغال‌شده توسط اپلیکیشن</span>
      </h3>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span class="text-slate-400 block text-[11px]">متن خاطرات:</span>
          <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ formatFileSize(storageBreakdown.memoriesTextBytes) }}</span>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span class="text-slate-400 block text-[11px]">عکس‌های فشرده:</span>
          <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ formatFileSize(storageBreakdown.photosBytes) }}</span>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span class="text-slate-400 block text-[11px]">فایل‌های صوتی:</span>
          <span class="text-sm font-bold text-rose-500">{{ formatFileSize(storageBreakdown.voiceBytes) }}</span>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span class="text-slate-400 block text-[11px]">کل حجم دیتابیس:</span>
          <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">{{ formatFileSize(storageBreakdown.totalBytes) }}</span>
        </div>
      </div>
    </div>

    <!-- 8. App Versions & Clear All Data -->
    <div class="border border-rose-200 dark:border-rose-950/60 rounded-3xl p-5 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <Trash2 class="w-4 h-4" />
            <span>پاکسازی کامل تمام اطلاعات</span>
          </h3>
          <p class="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            با این کار تمام خاطرات، تصاویر، فایل‌ها و پیش‌نویس‌ها برای همیشه از این دستگاه پاک می‌شوند.
          </p>
        </div>

        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
          @click="confirmClearAll"
        >
          پاکسازی همه داده‌ها
        </button>
      </div>

      <!-- Tech Stack Info -->
      <div class="pt-4 border-t border-rose-200/40 dark:border-rose-900/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-2">
        <span>خاطره‌نامه نسخه ۱.۰.۰</span>
        <span class="text-emerald-500 font-semibold">قابلیت کارکرد آفلاین</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Settings,
  Palette,
  Sun,
  Moon,
  Monitor,
  Image as ImageIcon,
  Mic,
  Bell,
  HardDrive,
  Trash2,
  Wand2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMemoryStore } from '@/stores/memoryStore'
import { speechRecognitionService } from '@/services/SpeechRecognitionService'
import { notificationService } from '@/services/NotificationService'
import { storageService, type StorageBreakdown } from '@/services/StorageService'
import { textEnhancementService } from '@/services/TextEnhancementService'
import { formatFileSize } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import type { LocalSpeechModel } from '@/models/SpeechModel'
import LocalModelCard from '@/components/settings/LocalModelCard.vue'
import SecuritySettings from '@/components/settings/SecuritySettings.vue'
import BackupManager from '@/components/settings/BackupManager.vue'

const settingsStore = useSettingsStore()
const memoryStore = useMemoryStore()
const { showToast } = useToast()

const showEnhancementGuide = ref(false)
const playgroundInput = ref('من اصلا خاهش نکردم و می روم . ۱- خرید کتاب ها و وسایل\nنکته مهم: فردا جلسه دارم')
const playgroundResult = ref('')

function runPlaygroundTest() {
  if (!playgroundInput.value.trim()) return
  playgroundResult.value = textEnhancementService.enhance(playgroundInput.value, {
    spellCheck: settingsStore.settings.autoSpellCheck,
    autoFormat: settingsStore.settings.autoFormatting,
  })
}

const availableModels = ref<LocalSpeechModel[]>([])
const reminderTime = ref(settingsStore.settings.dailyReminderTime || '21:00')
const storageBreakdown = ref<StorageBreakdown>({
  totalBytes: 0,
  memoriesTextBytes: 0,
  photosBytes: 0,
  voiceBytes: 0,
  attachmentsBytes: 0,
})

onMounted(async () => {
  await refreshModels()
  await refreshStorage()
})

async function refreshModels() {
  availableModels.value = await speechRecognitionService.getAvailableModels()
}

async function refreshStorage() {
  storageBreakdown.value = await storageService.getStorageUsage()
}

async function setDefaultModel(modelId: string) {
  await settingsStore.updateSetting('defaultLocalModelId', modelId)
  showToast({ type: 'success', message: 'مدل محلی پیش‌فرض تغییر یافت.' })
}

async function deleteModel(modelId: string) {
  if (confirm('آیا از حذف این مدل محلی و آزادسازی فضای ذخیره‌سازی مطمئن هستید؟')) {
    await speechRecognitionService.deleteModel(modelId)
    await refreshModels()
    showToast({ type: 'info', message: 'مدل محلی حذف شد.' })
  }
}

async function toggleDailyReminder() {
  var current = settingsStore.settings.dailyReminderEnabled
  var nextState = !current

  if (nextState) {
    if (notificationService.isSupported()) {
      var granted = await notificationService.requestPermission()
      if (!granted) {
        showToast({
          type: 'warning',
          message: 'اعلان‌های سیستم در مرورگر مسدود است؛ یادآور به شکل درون‌برنامه‌ای نمایش خواهد یافت.',
        })
      } else {
        showToast({
          type: 'success',
          message: 'یادآور روزانه با اعلان‌های سیستمی فعال شد.',
        })
      }
    } else {
      showToast({
        type: 'info',
        message: 'مرورگر از وب‌نوتیفیکیشن پشتیبانی نمی‌کند؛ یادآور درون‌برنامه‌ای فعال شد.',
      })
    }
  } else {
    showToast({
      type: 'info',
      message: 'یادآور روزانه غیرفعال شد.',
    })
  }

  await settingsStore.updateSetting('dailyReminderEnabled', nextState)
}

async function testReminderNotification() {
  var sent = await notificationService.sendTestNotification()
  if (sent) {
    showToast({ type: 'success', message: 'اعلان آزمایشی با موفقیت ارسال شد.' })
  } else {
    showToast({
      type: 'warning',
      message: 'امکان ارسال اعلان سیستمی نبود. لطفاً دسترسی Notification را در مرورگر فعال نمایید.',
    })
  }
}

function onReminderTimeChanged() {
  settingsStore.updateSetting('dailyReminderTime', reminderTime.value)
  showToast({ type: 'success', message: 'ساعت یادآور به‌روزرسانی شد.' })
}

async function confirmClearAll() {
  var step1 = confirm('هشدار جدی: آیا کاملاً مطمئن هستید که می‌خواهید تمام خاطرات و فایل‌ها را به طور کامل پاک کنید؟')
  if (step1) {
    var step2 = confirm('این عملیات غیرقابل بازگشت است. آیا ادامه می‌دهید؟')
    if (step2) {
      await storageService.clearAllStorage()
      await memoryStore.loadMemories()
      await refreshStorage()
      showToast({ type: 'info', message: 'تمام داده‌های برنامه با موفقیت پاکسازی شدند.' })
    }
  }
}
</script>
