<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full sm:max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div class="space-y-1">
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wand2 class="w-4 h-4 text-indigo-500" />
              <span>ویرایش هوشمند متن</span>
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>همه مراحل روی همین دستگاه انجام می‌شود و متن شما به هیچ سرویسی ارسال نمی‌شود.</span>
            </p>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بستن"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          <div v-if="isAnalyzing" class="py-10 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">
            در حال بررسی متن...
          </div>

          <template v-else>
            <section class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">تغییرات پیشنهادی</h4>
                <span class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ hasChanges ? 'قرمز: حذف‌شده — سبز: افزوده‌شده' : 'متن شما نیازی به تغییر ندارد.' }}
                </span>
              </div>
              <div
                v-if="hasChanges"
                class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 max-h-56 overflow-y-auto text-xs leading-7 whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200"
              >
                <template v-for="(segment, index) in diffSegments" :key="index">
                  <span v-if="segment.kind === 'same'">{{ segment.text }}</span>
                  <del
                    v-else-if="segment.kind === 'removed'"
                    class="rounded px-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  >{{ segment.text }}</del>
                  <ins
                    v-else
                    class="rounded px-0.5 no-underline bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >{{ segment.text }}</ins>
                </template>
              </div>
            </section>

            <section class="space-y-2">
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <SpellCheck class="w-4 h-4 text-amber-500" />
                <span>غلط‌های املایی ({{ toPersianDigits(spellIssues.length) }})</span>
              </h4>

              <p v-if="spellError" class="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                {{ spellError }}
              </p>
              <p v-else-if="spellIssues.length === 0" class="text-[11px] text-slate-500 dark:text-slate-400">
                کلمه ناشناخته‌ای پیدا نشد.
              </p>

              <ul v-else class="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                <li
                  v-for="issue in spellIssues"
                  :key="issue.id"
                  class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-bold text-rose-600 dark:text-rose-400">{{ issue.word }}</span>
                    <div class="flex items-center gap-3 text-[11px]">
                      <button
                        type="button"
                        class="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                        @click="addToDictionary(issue.word)"
                      >
                        افزودن به دیکشنری من
                      </button>
                      <button
                        type="button"
                        class="text-slate-500 dark:text-slate-400 hover:underline"
                        @click="ignoreIssue(issue)"
                      >
                        نادیده
                      </button>
                    </div>
                  </div>

                  <div v-if="issue.suggestions.length > 0" class="flex flex-wrap gap-1.5">
                    <button
                      v-for="suggestion in issue.suggestions"
                      :key="suggestion"
                      type="button"
                      class="px-2.5 py-1 rounded-lg text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors"
                      @click="applySuggestion(issue, suggestion)"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                  <p v-else class="text-[11px] text-slate-400">پیشنهادی وجود ندارد.</p>
                </li>
              </ul>
            </section>

            <section class="space-y-2">
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-indigo-500" />
                <span>غلط‌گیری با مدل هوش مصنوعی محلی</span>
              </h4>

              <p v-if="!activeModel" class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                هنوز مدلی دانلود نشده است. از
                <button type="button" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold" @click="goToSettings">
                  تنظیمات ← ویرایش هوشمند
                </button>
                یک مدل فارسی‌پشتیبان دانلود کنید.
              </p>

              <template v-else>
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    :disabled="aiState === 'running'"
                    class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    @click="runAiCorrection"
                  >
                    <Sparkles class="w-3.5 h-3.5" />
                    <span>{{ aiState === 'running' ? 'در حال پردازش...' : `اجرا با ${activeModel.name}` }}</span>
                  </button>
                  <button
                    v-if="aiState === 'running'"
                    type="button"
                    class="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    @click="cancelAi"
                  >
                    لغو
                  </button>
                </div>

                <div v-if="aiState === 'running'" class="space-y-1.5">
                  <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div class="h-full bg-indigo-600 transition-all duration-300" :style="{ width: `${aiPercent}%` }"></div>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ aiMessage }}</p>
                </div>

                <p v-if="aiError" class="text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed">{{ aiError }}</p>

                <div
                  v-if="aiResult"
                  class="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-2"
                >
                  <p class="text-[11px] text-indigo-800 dark:text-indigo-200 leading-relaxed">
                    {{ toPersianDigits(aiResult.changedChunks) }} بخش اصلاح شد و
                    {{ toPersianDigits(aiResult.rejectedChunks) }} بخش به‌دلیل مغایرت با متن اصلی (عدد، کلمه لاتین یا واژه دیکشنری) رد شد.
                  </p>
                  <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 max-h-48 overflow-y-auto text-xs leading-7 whitespace-pre-wrap break-words">
                    <template v-for="(segment, index) in aiDiff" :key="index">
                  <span v-if="segment.kind === 'same'">{{ segment.text }}</span>
                  <del
                    v-else-if="segment.kind === 'removed'"
                    class="rounded px-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  >{{ segment.text }}</del>
                  <ins
                    v-else
                    class="rounded px-0.5 no-underline bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >{{ segment.text }}</ins>
                </template>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      @click="acceptAiResult"
                    >
                      پذیرفتن پیشنهاد مدل
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                      @click="aiResult = null"
                    >
                      رد کردن
                    </button>
                  </div>
                </div>
              </template>
            </section>
          </template>
        </div>

        <div class="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            @click="emit('close')"
          >
            انصراف
          </button>
          <button
            type="button"
            :disabled="isAnalyzing || !hasChanges"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
            @click="emit('apply', workingText)"
          >
            اعمال تغییرات
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, SpellCheck, Sparkles, Wand2, X } from 'lucide-vue-next'
import type { LocalTextModel } from '@/models/TextModel'
import { smartEditService } from '@/services/enhancement/SmartEditService'
import type { SpellIssue } from '@/services/spell/SpellCheckService'
import { localTextModelService, type AiCorrectionResult } from '@/services/textmodel/LocalTextModelService'
import { userDictionaryService } from '@/services/UserDictionaryService'
import { useSettingsStore } from '@/stores/settingsStore'
import { toPersianDigits } from '@/utils/format'
import { WordDiff } from '@/utils/WordDiff'

const props = defineProps<{ text: string }>()
const emit = defineEmits<{
  (e: 'apply', text: string): void
  (e: 'close'): void
}>()

const router = useRouter()
const settingsStore = useSettingsStore()

const isAnalyzing = ref(true)
const workingText = ref(props.text)
const spellIssues = ref<SpellIssue[]>([])
const spellError = ref<string | null>(null)

const activeModel = ref<LocalTextModel | null>(null)
const aiState = ref<'idle' | 'running'>('idle')
const aiPercent = ref(0)
const aiMessage = ref('')
const aiError = ref('')
const aiResult = ref<AiCorrectionResult | null>(null)

const diffSegments = computed(() => WordDiff.compute(props.text, workingText.value))
const hasChanges = computed(() => workingText.value !== props.text)
const aiDiff = computed(() => (aiResult.value ? WordDiff.compute(workingText.value, aiResult.value.text) : []))

onMounted(async () => {
  await Promise.all([analyzeText(), loadActiveModel()])
  isAnalyzing.value = false
})

onUnmounted(() => {
  localTextModelService.dispose()
})

async function analyzeText() {
  var analysis = await smartEditService.analyze(props.text, { autoFormat: settingsStore.settings.autoFormatting })
  workingText.value = analysis.rulesText
  spellIssues.value = analysis.issues
  spellError.value = analysis.errorMessage
}

async function loadActiveModel() {
  var models = await localTextModelService.getAvailableModels()
  var downloaded = models.filter((model) => model.isDownloaded)
  activeModel.value =
    downloaded.find((model) => model.id === settingsStore.settings.defaultTextModelId) ?? downloaded[0] ?? null
}

async function refreshSpelling() {
  var outcome = await smartEditService.checkSpelling(workingText.value)
  spellIssues.value = outcome.issues
  spellError.value = outcome.errorMessage
}

function applySuggestion(issue: SpellIssue, suggestion: string) {
  var resolution = smartEditService.resolveIssue(workingText.value, spellIssues.value, issue, suggestion)
  workingText.value = resolution.text
  spellIssues.value = resolution.issues
}

function ignoreIssue(issue: SpellIssue) {
  spellIssues.value = spellIssues.value.filter((candidate) => candidate.id !== issue.id)
}

async function addToDictionary(word: string) {
  await userDictionaryService.add(word)
  spellIssues.value = smartEditService.dismissWord(spellIssues.value, word)
}

async function runAiCorrection() {
  if (!activeModel.value) return

  aiState.value = 'running'
  aiError.value = ''
  aiResult.value = null
  aiPercent.value = 0

  try {
    aiResult.value = await localTextModelService.correct(
      workingText.value,
      activeModel.value.id,
      userDictionaryService.snapshot(),
      (percent, message) => {
        aiPercent.value = percent
        aiMessage.value = message
      }
    )
  } catch (error) {
    aiError.value = error instanceof Error ? error.message : 'خطا در اجرای مدل.'
  } finally {
    aiState.value = 'idle'
  }
}

function cancelAi() {
  localTextModelService.dispose()
  aiState.value = 'idle'
}

async function acceptAiResult() {
  if (!aiResult.value) return
  workingText.value = aiResult.value.text
  aiResult.value = null
  await refreshSpelling()
}

function goToSettings() {
  emit('close')
  router.push('/settings')
}
</script>
