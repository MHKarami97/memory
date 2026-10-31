<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900 space-y-5 transition-colors">
    <div>
      <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Wand2 class="w-4 h-4 text-indigo-500" />
        <span>ویرایش هوشمند متن (آفلاین)</span>
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
        قواعد نگارشی، دیکشنری املایی فارسی و مدل هوش مصنوعی اختیاری، همگی روی دستگاه شما اجرا می‌شوند. فقط دانلود اولیه مدل به اینترنت نیاز دارد.
      </p>
    </div>

    <div class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
      <div class="text-xs">
        <span class="font-bold text-slate-800 dark:text-slate-200">دیکشنری املایی فارسی</span>
        <span class="block text-[11px] mt-0.5" :class="spellStatusClass">{{ spellStatusText }}</span>
      </div>
      <button
        type="button"
        :disabled="isCheckingSpell"
        class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 text-xs font-medium"
        @click="checkSpellDictionary"
      >
        {{ isCheckingSpell ? 'در حال بررسی...' : 'بررسی دیکشنری' }}
      </button>
    </div>

    <UserDictionaryManager />

    <div class="space-y-3">
      <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300">مدل‌های هوش مصنوعی محلی (اختیاری):</h4>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        خروجی مدل همیشه به‌صورت پیش‌نمایش نمایش داده می‌شود و فقط با تأیید شما اعمال می‌شود. بخش‌هایی که عدد، کلمه لاتین یا واژه دیکشنری شما را تغییر دهند خودکار رد می‌شوند.
        {{ webGpuText }}
      </p>
      <TextModelCard
        v-for="model in models"
        :key="model.id"
        :model="model"
        :is-default="settingsStore.settings.defaultTextModelId === model.id"
        @downloaded="refreshModels"
        @set-default="setDefaultModel"
        @delete="deleteModel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Wand2 } from 'lucide-vue-next'
import type { LocalTextModel } from '@/models/TextModel'
import { spellCheckService } from '@/services/spell/SpellCheckService'
import { localTextModelService } from '@/services/textmodel/LocalTextModelService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/composables/useToast'
import TextModelCard from '@/components/settings/TextModelCard.vue'
import UserDictionaryManager from '@/components/settings/UserDictionaryManager.vue'

const settingsStore = useSettingsStore()
const { showToast } = useToast()

const models = ref<LocalTextModel[]>([])
const isCheckingSpell = ref(false)
const spellState = ref<'unknown' | 'ready' | 'missing'>('unknown')
const spellMessage = ref('')

const webGpuText = computed(() =>
  localTextModelService.isWebGpuAvailable()
    ? 'شتاب‌دهنده WebGPU روی این دستگاه در دسترس است.'
    : 'WebGPU در دسترس نیست؛ مدل با پردازنده اجرا می‌شود و کندتر خواهد بود.'
)

const spellStatusText = computed(() => {
  if (spellState.value === 'ready') return 'آماده و آفلاین'
  if (spellState.value === 'missing') return spellMessage.value
  return 'بررسی نشده'
})

const spellStatusClass = computed(() => {
  if (spellState.value === 'ready') return 'text-emerald-600 dark:text-emerald-400'
  if (spellState.value === 'missing') return 'text-rose-600 dark:text-rose-400'
  return 'text-slate-500 dark:text-slate-400'
})

onMounted(refreshModels)

async function refreshModels() {
  models.value = await localTextModelService.getAvailableModels()
}

async function setDefaultModel(modelId: string) {
  await settingsStore.updateSetting('defaultTextModelId', modelId)
  showToast({ type: 'success', message: 'مدل پیش‌فرض ویرایش هوشمند تغییر یافت.' })
}

async function deleteModel(modelId: string) {
  if (!confirm('این مدل حذف شود و فضای آن آزاد شود؟')) return
  await localTextModelService.deleteModel(modelId)
  await refreshModels()
  showToast({ type: 'info', message: 'مدل حذف شد.' })
}

async function checkSpellDictionary() {
  isCheckingSpell.value = true
  try {
    await spellCheckService.ensureReady()
    spellState.value = 'ready'
  } catch (error) {
    spellState.value = 'missing'
    spellMessage.value = error instanceof Error ? error.message : 'دیکشنری در دسترس نیست.'
  } finally {
    isCheckingSpell.value = false
  }
}
</script>
