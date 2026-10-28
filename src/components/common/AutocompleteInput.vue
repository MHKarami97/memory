<template>
  <div class="relative w-full">
    <div class="relative">
      <input
        ref="inputRef"
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        class="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
        @input="onInput"
        @focus="isOpen = true"
        @blur="onBlur"
        @keydown.down.prevent="navigateSuggestions(1)"
        @keydown.up.prevent="navigateSuggestions(-1)"
        @keydown.enter.prevent="selectHighlighted"
      />

      <ChevronDown
        v-if="filteredSuggestions.length > 0"
        class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </div>

    <!-- Dropdown Suggestions -->
    <div
      v-if="isOpen && filteredSuggestions.length > 0"
      class="absolute z-30 right-0 left-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1 text-xs space-y-0.5"
    >
      <button
        v-for="(item, idx) in filteredSuggestions"
        :key="item"
        type="button"
        class="w-full text-right px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors"
        :class="idx === highlightedIndex ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
        @mousedown.prevent="selectItem(item)"
      >
        <span>{{ item }}</span>
        <span class="text-[10px] text-slate-400">پیشنهادی</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string
    suggestions: string[]
    placeholder?: string
  }>(),
  {
    placeholder: '',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'select', val: string): void
}>()

const isOpen = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)

const filteredSuggestions = computed(() => {
  var q = (props.modelValue || '').trim().toLowerCase()
  if (!q) {
    return props.suggestions.slice(0, 8)
  }
  return props.suggestions
    .filter((s) => s.toLowerCase().includes(q))
    .slice(0, 8)
})

function onInput(e: Event) {
  var val = (e.target as HTMLInputElement).value
  emit('update:modelValue', val)
  isOpen.value = true
  highlightedIndex.value = -1
}

function selectItem(val: string) {
  emit('update:modelValue', val)
  emit('select', val)
  isOpen.value = false
  highlightedIndex.value = -1
}

function onBlur() {
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

function navigateSuggestions(dir: number) {
  if (!isOpen.value || filteredSuggestions.value.length === 0) {
    isOpen.value = true
    return
  }
  var next = highlightedIndex.value + dir
  if (next < 0) next = filteredSuggestions.value.length - 1
  if (next >= filteredSuggestions.value.length) next = 0
  highlightedIndex.value = next
}

function selectHighlighted() {
  if (isOpen.value && highlightedIndex.value >= 0 && highlightedIndex.value < filteredSuggestions.value.length) {
    selectItem(filteredSuggestions.value[highlightedIndex.value])
  }
}
</script>
