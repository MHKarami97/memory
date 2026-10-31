<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        <BookMarked class="w-4 h-4 text-emerald-500" />
        <span>دیکشنری شخصی ({{ toPersianDigits(words.length) }} کلمه)</span>
      </h4>
      <button
        v-if="words.length > 0"
        type="button"
        class="text-[11px] text-rose-500 hover:underline font-medium"
        @click="clearAll"
      >
        پاک کردن همه
      </button>
    </div>
    <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
      کلمه‌های این فهرست (نام افراد، شهرها، اصطلاحات خودتان) هرگز توسط قواعد خودکار، غلط‌گیر املایی یا مدل هوش مصنوعی تغییر نمی‌کنند.
    </p>

    <form class="flex items-center gap-2" @submit.prevent="addFromInput">
      <input
        v-model="draft"
        type="text"
        placeholder="یک یا چند کلمه (با ویرگول جدا کنید)"
        class="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
      />
      <button
        type="submit"
        :disabled="!draft.trim()"
        class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>افزودن</span>
      </button>
    </form>

    <ul v-if="words.length > 0" class="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
      <li
        v-for="entry in words"
        :key="entry.id"
        class="flex items-center gap-1 pl-1 pr-2.5 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
      >
        <span>{{ entry.word }}</span>
        <button
          type="button"
          class="p-0.5 rounded-full hover:bg-emerald-200/70 dark:hover:bg-emerald-800/60"
          :title="`حذف «${entry.word}»`"
          @click="remove(entry.word)"
        >
          <X class="w-3 h-3" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { BookMarked, Plus, X } from 'lucide-vue-next'
import type { UserDictionaryEntry } from '@/models/UserDictionary'
import { userDictionaryService } from '@/services/UserDictionaryService'
import { useToast } from '@/composables/useToast'
import { toPersianDigits } from '@/utils/format'

const { showToast } = useToast()

const words = ref<UserDictionaryEntry[]>([])
const draft = ref('')
var unsubscribe: (() => void) | null = null

onMounted(async () => {
  await userDictionaryService.ensureLoaded()
  refresh()
  unsubscribe = userDictionaryService.subscribe(refresh)
})

onUnmounted(() => {
  unsubscribe?.()
})

function refresh() {
  words.value = userDictionaryService.list()
}

async function addFromInput() {
  var candidates = draft.value.split(/[,،\n]+/).map((word) => word.trim()).filter(Boolean)
  var added = await userDictionaryService.addMany(candidates)
  draft.value = ''
  showToast({
    type: added > 0 ? 'success' : 'info',
    message: added > 0 ? `${toPersianDigits(added)} کلمه به دیکشنری اضافه شد.` : 'کلمه جدیدی برای افزودن نبود.',
  })
}

async function remove(word: string) {
  await userDictionaryService.remove(word)
}

async function clearAll() {
  if (!confirm('همه کلمه‌های دیکشنری شخصی حذف شوند؟')) return
  await userDictionaryService.clear()
}
</script>
