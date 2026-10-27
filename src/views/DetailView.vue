<template>
  <div class="max-w-3xl mx-auto p-4 sm:p-6 pb-24 space-y-4">
    <!-- Back Header -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors p-1"
        @click="router.back()"
      >
        <ArrowRight class="w-4 h-4" />
        <span>بازگشت به خط زمانی</span>
      </button>
    </div>

    <MemoryDetail :memory="targetMemory" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { useMemoryStore } from '@/stores/memoryStore'
import MemoryDetail from '@/components/memory/MemoryDetail.vue'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const memoryStore = useMemoryStore()

const targetMemory = computed(() => {
  return memoryStore.memories.find((m) => m.id === props.id) || null
})
</script>
