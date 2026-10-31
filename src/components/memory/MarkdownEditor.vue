<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-colors">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2 gap-1 flex-wrap">
      <div class="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="برجسته (Bold)"
          @click="insertMarkdown('**', '**')"
        >
          <Bold class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="مورب (Italic)"
          @click="insertMarkdown('*', '*')"
        >
          <Italic class="w-4 h-4" />
        </button>

        <div class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
          title="تیتر ۱ (Heading 1)"
          @click="insertMarkdown('# ')"
        >
          H1
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
          title="تیتر ۲ (Heading 2)"
          @click="insertMarkdown('## ')"
        >
          H2
        </button>

        <div class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="لیست نشانه‌دار (List)"
          @click="insertMarkdown('- ')"
        >
          <List class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="نقل قول (Quote)"
          @click="insertMarkdown('> ')"
        >
          <Quote class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="پیوند (Link)"
          @click="insertMarkdown('[', '](https://)')"
        >
          <LinkIcon class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="خط جداکننده (Divider)"
          @click="insertMarkdown('\n---\n')"
        >
          <Minus class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="کد (Code)"
          @click="insertMarkdown('`', '`')"
        >
          <Code class="w-4 h-4" />
        </button>

        <div v-if="speechRecognitionService.isWebSpeechSupported()" class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          v-if="speechRecognitionService.isWebSpeechSupported()"
          type="button"
          class="p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          :class="isDictating ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm animate-pulse' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'"
          :title="isDictating ? 'توقف دیکته صوتی' : 'دیکته صوتی زنده (تبدیل مستقیم گفتار به متن)'"
          @click="toggleDictation"
        >
          <Mic class="w-4 h-4" />
          <span v-if="isDictating" class="text-[11px] font-bold">در حال شنیدن... (توقف)</span>
        </button>

        <div class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          class="p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-semibold"
          title="تصحیح غلط‌های املایی، تنظیم نیم‌فاصله‌ها و فرمت‌بندی هوشمند"
          @click="applySmartEnhancement"
        >
          <Wand2 class="w-4 h-4" />
          <span class="hidden sm:inline text-[11px]">ویرایش هوشمند</span>
        </button>
      </div>

      <!-- Mode Switcher (Edit / Preview / Split) -->
      <div class="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition-all"
          :class="viewMode === 'edit' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
          @click="viewMode = 'edit'"
        >
          ویرایش
        </button>

        <button
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition-all"
          :class="viewMode === 'preview' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
          @click="viewMode = 'preview'"
        >
          پیش‌نمایش
        </button>

        <button
          type="button"
          class="hidden lg:inline-flex px-2.5 py-1 rounded-lg font-medium transition-all"
          :class="viewMode === 'split' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
          @click="viewMode = 'split'"
        >
          همزمان
        </button>
      </div>
    </div>

    <!-- Active Dictation Real-time Interim Indicator -->
    <div
      v-if="isDictating"
      class="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2"
    >
      <div class="flex items-center gap-2 truncate">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
        <span class="font-bold shrink-0">میکروفون فعال است:</span>
        <span class="truncate italic">{{ interimDictation }}</span>
      </div>

      <button
        type="button"
        class="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold shrink-0 mr-2"
        @click="toggleDictation"
      >
        اتمام دیکته
      </button>
    </div>

    <!-- Content Area -->
    <div class="relative min-h-[220px]">
      <!-- Edit Mode / Split Left -->
      <div
        v-show="viewMode === 'edit' || viewMode === 'split'"
        :class="viewMode === 'split' ? 'w-1/2 border-l border-slate-200 dark:border-slate-800 float-right' : 'w-full'"
      >
        <textarea
          ref="textareaRef"
          v-model="modelValue"
          :placeholder="isTextareaFocused || isDictating ? '' : TEXTAREA_PLACEHOLDER"
          @focus="isTextareaFocused = true"
          @blur="isTextareaFocused = false"
          spellcheck="true"
          lang="fa"
          class="w-full h-72 md:h-80 p-4 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm leading-relaxed outline-none resize-none font-sans"
          dir="rtl"
        ></textarea>
      </div>

      <!-- Preview Mode / Split Right -->
      <div
        v-show="viewMode === 'preview' || viewMode === 'split'"
        :class="viewMode === 'split' ? 'w-1/2 float-left' : 'w-full'"
        class="h-72 md:h-80 p-4 overflow-y-auto prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
        dir="rtl"
      >
        <div v-if="renderedHtml" v-html="renderedHtml"></div>
        <p v-else class="text-slate-400 text-xs italic">پیش‌نمایش متن خاطره در اینجا نمایش داده خواهد شد...</p>
      </div>
      <div class="clear-both"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import {
  Bold,
  Italic,
  List,
  Quote,
  Link as LinkIcon,
  Minus,
  Code,
  Mic,
  Wand2,
} from 'lucide-vue-next'
import { renderMarkdownToHtml } from '@/utils/sanitize'
import { speechRecognitionService } from '@/services/SpeechRecognitionService'
import { textEnhancementService } from '@/services/TextEnhancementService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/composables/useToast'

const modelValue = defineModel<string>({ default: '' })
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const viewMode = ref<'edit' | 'preview' | 'split'>('edit')

const settingsStore = useSettingsStore()
const { showToast } = useToast()

const TEXTAREA_PLACEHOLDER = 'شروع به نوشتن خاطره کن... چه احساسی داری؟ چه اتفاقاتی افتاد؟'

const isTextareaFocused = ref(false)
const isDictating = ref(false)
const interimDictation = ref('')
var dictationSession: { stop: () => void } | null = null

const renderedHtml = computed(() => {
  return renderMarkdownToHtml(modelValue.value)
})

function applySmartEnhancement() {
  if (!modelValue.value.trim()) {
    showToast({ type: 'warning', message: 'ابتدا متنی را در کادر خاطره بنویسید.' })
    return
  }

  var original = modelValue.value
  var enhanced = textEnhancementService.enhance(original, {
    spellCheck: settingsStore.settings.autoSpellCheck,
    autoFormat: settingsStore.settings.autoFormatting,
  })

  if (enhanced !== original) {
    modelValue.value = enhanced
    showToast({ type: 'success', message: 'متن با موفقیت ویرایش و تصحیح شد.' })
  } else {
    showToast({ type: 'info', message: 'متن از نظر نگارشی و فرمت‌بندی مرتب و استاندارد است.' })
  }
}

function toggleDictation() {
  if (isDictating.value) {
    dictationSession?.stop()
    dictationSession = null
    isDictating.value = false
    interimDictation.value = ''
    return
  }

  isDictating.value = true
  interimDictation.value = ''

  dictationSession = speechRecognitionService.startLiveSystemDictation({
    onSegment: (newSegment) => {
      appendDictatedSegment(newSegment)
      interimDictation.value = ''
    },
    onInterim: (interim) => {
      interimDictation.value = interim
    },
    onError: (err) => {
      alert(err)
      isDictating.value = false
      interimDictation.value = ''
    },
    onEnd: () => {
      isDictating.value = false
      interimDictation.value = ''
    },
  })
}

function appendDictatedSegment(segment: string) {
  var current = modelValue.value || ''
  var separator = current === '' || /\s$/.test(current) ? '' : ' '
  modelValue.value = current + separator + segment
}

async function insertMarkdown(prefix: string, suffix: string = '') {
  var el = textareaRef.value
  if (!el) return

  var start = el.selectionStart
  var end = el.selectionEnd
  var text = modelValue.value || ''
  var selected = text.substring(start, end)

  modelValue.value = text.substring(0, start) + prefix + selected + suffix + text.substring(end)

  await nextTick()
  el.focus()
  el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
}

onUnmounted(() => {
  if (dictationSession) {
    dictationSession.stop()
  }
})
</script>
