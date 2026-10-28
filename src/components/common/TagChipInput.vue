<template>
  <div class="relative w-full">
    <!-- Selected Badges & Input Box -->
    <div
      class="min-h-[38px] p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 flex-wrap focus-within:border-indigo-500 transition-colors"
    >
      <span
        v-for="(item, idx) in modelValue"
        :key="item"
        class="px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
        :class="badgeColorClass"
      >
        <span>{{ prefix }}{{ item }}</span>
        <button
          type="button"
          class="hover:text-rose-500 transition-colors"
          title="حذف"
          @click="removeItem(idx)"
        >
          ×
        </button>
      </span>

      <!-- Text Input -->
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="modelValue.length === 0 ? placeholder : 'افزودن...'"
        class="text-xs p-1 bg-transparent outline-none flex-1 min-w-[80px] text-slate-800 dark:text-slate-100 placeholder-slate-400"
        @focus="isOpen = true"
        @blur="onBlur"
        @keydown.enter.prevent="commitCurrentInput"
        @keydown.,.prevent="commitCurrentInput"
        @keydown.backspace="onBackspace"
      />
    </div>

    <!-- Dropdown of unused suggestions -->
    <div
      v-if="isOpen && availableSuggestions.length > 0"
      class="absolute z-30 right-0 left-0 mt-1 max-h-40 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1 text-xs space-y-0.5"
    >
      <div class="px-2 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
        انتخاب از موارد قبلی:
      </div>
      <button
        v-for="sug in availableSuggestions"
        :key="sug"
        type="button"
        class="w-full text-right px-3 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        @mousedown.prevent="addItem(sug)"
      >
        <span>{{ prefix }}{{ sug }}</span>
        <span class="text-[10px] text-indigo-500 font-semibold">+ افزودن</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    suggestions: string[]
    placeholder?: string
    prefix?: string
    badgeColorClass?: string
  }>(),
  {
    placeholder: 'افزودن...',
    prefix: '',
    badgeColorClass: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string[]): void
}>()

const inputValue = ref('')
const isOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const availableSuggestions = computed(() => {
  var currentSet = new Set(props.modelValue)
  var q = inputValue.value.trim().toLowerCase()
  return props.suggestions
    .filter((s) => !currentSet.has(s) && (q ? s.toLowerCase().includes(q) : true))
    .slice(0, 10)
})

function commitCurrentInput() {
  var val = inputValue.value.trim()
  if (val) {
    addItem(val)
    inputValue.value = ''
  }
}

function addItem(val: string) {
  var clean = val.replace(/^#/, '').trim()
  if (clean && !props.modelValue.includes(clean)) {
    emit('update:modelValue', [...props.modelValue, clean])
  }
  inputValue.value = ''
}

function removeItem(idx: number) {
  var list = [...props.modelValue]
  list.splice(idx, 1)
  emit('update:modelValue', list)
}

function onBackspace() {
  if (inputValue.value === '' && props.modelValue.length > 0) {
    removeItem(props.modelValue.length - 1)
  }
}

function onBlur() {
  if (inputValue.value.trim()) {
    commitCurrentInput()
  }
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}
</script>
