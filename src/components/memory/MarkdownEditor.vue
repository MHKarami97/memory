<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-colors">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2 gap-1 flex-wrap">
      <div class="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="برجسته (Bold)"
          @click="insertMarkdown('**', '**', 'متن برجسته')"
        >
          <Bold class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="مورب (Italic)"
          @click="insertMarkdown('*', '*', 'متن مورب')"
        >
          <Italic class="w-4 h-4" />
        </button>

        <div class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
          title="تیتر ۱ (Heading 1)"
          @click="insertMarkdown('# ', '', 'عنوان اصلی')"
        >
          H1
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
          title="تیتر ۲ (Heading 2)"
          @click="insertMarkdown('## ', '', 'عنوان فرعی')"
        >
          H2
        </button>

        <div class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="لیست نشانه‌دار (List)"
          @click="insertMarkdown('- ', '', 'مورد لیست')"
        >
          <List class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="نقل قول (Quote)"
          @click="insertMarkdown('> ', '', 'متن نقل قول')"
        >
          <Quote class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="پیوند (Link)"
          @click="insertMarkdown('[عنوان پیوند](', ')', 'https://example.com')"
        >
          <LinkIcon class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="خط جداکننده (Divider)"
          @click="insertMarkdown('\n---\n', '', '')"
        >
          <Minus class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          title="کد (Code)"
          @click="insertMarkdown('`', '`', 'کد')"
        >
          <Code class="w-4 h-4" />
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
          placeholder="شروع به نوشتن خاطره کن... چه احساسی داری؟ چه اتفاقاتی افتاد؟"
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
import { ref, computed } from 'vue'
import {
  Bold,
  Italic,
  List,
  Quote,
  Link as LinkIcon,
  Minus,
  Code,
} from 'lucide-vue-next'
import { renderMarkdownToHtml } from '@/utils/sanitize'

const modelValue = defineModel<string>({ default: '' })
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const viewMode = ref<'edit' | 'preview' | 'split'>('edit')

const renderedHtml = computed(() => {
  return renderMarkdownToHtml(modelValue.value)
})

function insertMarkdown(prefix: string, suffix: string, defaultText: string) {
  var el = textareaRef.value
  if (!el) return

  var start = el.selectionStart
  var end = el.selectionEnd
  var text = modelValue.value || ''
  var selected = text.substring(start, end) || defaultText

  var replacement = prefix + selected + suffix
  modelValue.value = text.substring(0, start) + replacement + text.substring(end)

  // Reposition cursor
  setTimeout(() => {
    el.focus()
    el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
  }, 10)
}
</script>
