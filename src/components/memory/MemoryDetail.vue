<template>
  <div v-if="memory" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
    <!-- Top Action Bar -->
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap">
      <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span class="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
          <Calendar class="w-4 h-4 text-indigo-500" />
          <span>{{ formatJalaliFull(memory.date) }}</span>
        </span>
        <span v-if="memory.time">ساعت {{ toPersianDigits(memory.time) }}</span>
      </div>

      <div class="flex items-center gap-1.5 flex-wrap">
        <!-- Toggle Star/Important -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :class="memory.isImportant ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : ''"
          :title="memory.isImportant ? 'نشانه‌گذاری شده به عنوان مهم' : 'علامت‌گذاری به عنوان مهم'"
          @click="toggleImportant"
        >
          <Star class="w-4 h-4" :class="memory.isImportant ? 'fill-amber-400' : ''" />
        </button>

        <!-- Toggle Lock -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :class="memory.isLocked ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' : ''"
          :title="memory.isLocked ? 'خاطره قفل است' : 'قفل کردن خاطره'"
          @click="toggleLock"
        >
          <Lock class="w-4 h-4" />
        </button>

        <!-- PDF Export Button -->
        <button
          type="button"
          class="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
          title="خروجی PDF و اشتراک‌گذاری"
          @click="isPdfModalOpen = true"
        >
          <FileDown class="w-4 h-4" />
        </button>

        <!-- Edit Button -->
        <router-link
          :to="`/edit/${memory.id}`"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="ویرایش خاطره"
        >
          <Edit3 class="w-4 h-4" />
        </router-link>

        <!-- Delete Button -->
        <button
          type="button"
          class="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="حذف خاطره"
          @click="isDeleteModalOpen = true"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Locked Warning & Unlock Button -->
    <div
      v-if="memory.isLocked && !isUnlocked"
      class="p-8 text-center space-y-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800"
    >
      <div class="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
        <Lock class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">این خاطره قفل شده است</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">برای مشاهده کامل محتوا، قفل را باز کنید.</p>
      </div>
      <button
        type="button"
        class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        @click="authStore.unlockMemory(memory.id)"
      >
        مشاهده خاطره
      </button>
    </div>

    <!-- Memory Content (When Unlocked) -->
    <div v-else class="space-y-6">
      <!-- Title, Mood, & Meta Badges -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Mood Badge -->
          <span
            v-if="moodInfo"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm"
            :class="[moodInfo.bgColor, moodInfo.textColor, moodInfo.borderColor]"
          >
            <span>{{ moodInfo.emoji }}</span>
            <span>حال‌وهوا: {{ moodInfo.label }}</span>
          </span>

          <!-- Life Chapter -->
          <span
            v-if="memory.lifeChapter"
            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
          >
            📖 فصل زندگی: {{ memory.lifeChapter }}
          </span>

          <!-- Event Type -->
          <span
            v-if="memory.eventType"
            class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          >
            🎯 رویداد: {{ memory.eventType }}
          </span>
        </div>

        <h1 class="text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
          {{ memory.title || 'خاطره بدون عنوان' }}
        </h1>

        <div v-if="memory.location" class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{{ memory.location }}</span>
        </div>
      </div>

      <!-- Activities, Tags & People Badges -->
      <div v-if="memory.activities?.length || memory.tags?.length || memory.people?.length" class="flex items-center gap-2 flex-wrap">
        <span
          v-for="act in memory.activities"
          :key="act"
          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
        >
          ⚡ {{ act }}
        </span>

        <span
          v-for="t in memory.tags"
          :key="t"
          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
        >
          #{{ t }}
        </span>

        <span
          v-for="p in memory.people"
          :key="p"
          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400"
        >
          👤 {{ p }}
        </span>
      </div>

      <!-- Voice Player (if present) -->
      <div v-if="memory.voice" class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span class="flex items-center gap-1.5">
            <Mic class="w-4 h-4 text-rose-500" />
            <span>یادداشت صوتی پیوست</span>
          </span>
          <span class="text-slate-400 font-normal">{{ formatDuration(memory.voice.duration) }}</span>
        </div>
        <audio :src="memory.voice.audioUrl" controls class="w-full h-8 outline-none"></audio>
      </div>

      <!-- Rendered Markdown Body -->
      <div
        class="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed min-h-[80px]"
        dir="rtl"
        v-html="renderedContent"
      ></div>

      <!-- Daily Reflections: Gratitude, Lesson, Goals -->
      <div
        v-if="memory.gratitude || memory.dailyLesson || (memory.goals && memory.goals.length > 0)"
        class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"
      >
        <!-- Gratitude Card -->
        <div
          v-if="memory.gratitude"
          class="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1.5"
        >
          <div class="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Sparkles class="w-4 h-4 text-amber-500 shrink-0" />
            <span>سپاسگزاری امروز:</span>
          </div>
          <p class="text-xs text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
            {{ memory.gratitude }}
          </p>
        </div>

        <!-- Daily Lesson Card -->
        <div
          v-if="memory.dailyLesson"
          class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-1.5"
        >
          <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300">
            <Award class="w-4 h-4 text-indigo-500 shrink-0" />
            <span>نتیجه / درس گرفته شده:</span>
          </div>
          <p class="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
            {{ memory.dailyLesson }}
          </p>
        </div>

        <!-- Goals Card -->
        <div
          v-if="memory.goals && memory.goals.length > 0"
          class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1.5"
        >
          <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Target class="w-4 h-4 text-emerald-500 shrink-0" />
            <span>اهداف تعیین‌شده:</span>
          </div>
          <ul class="space-y-1 text-xs text-emerald-900 dark:text-emerald-200 pr-3 list-disc">
            <li v-for="g in memory.goals" :key="g">{{ g }}</li>
          </ul>
        </div>
      </div>

      <!-- Related Memories Section -->
      <div
        v-if="relatedMemories.length > 0"
        class="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800"
      >
        <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <LinkIcon class="w-4 h-4 text-indigo-500" />
          <span>خاطره‌های مرتبط:</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="rel in relatedMemories"
            :key="rel.id"
            type="button"
            class="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-right hover:border-indigo-400 transition-all group"
            @click="selectRelatedMemory(rel.id)"
          >
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
              {{ rel.title || 'خاطره بدون عنوان' }}
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">
              {{ formatJalaliFull(rel.date) }}
            </div>
          </button>
        </div>
      </div>

      <!-- Photos Gallery (Multi-column responsive grid) -->
      <div v-if="memory.photos && memory.photos.length > 0" class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ImageIcon class="w-4 h-4 text-indigo-500" />
          <span>عکس‌های ثبت‌شده ({{ toPersianDigits(memory.photos.length) }})</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="ph in memory.photos"
            :key="ph.id"
            class="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 group relative aspect-video"
          >
            <img
              :src="ph.dataUrl || ph.thumbnailUrl"
              :alt="ph.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
              @click="openPhotoPreview(ph.dataUrl || ph.thumbnailUrl)"
            />
          </div>
        </div>
      </div>

      <!-- Attachments List -->
      <div v-if="memory.attachments && memory.attachments.length > 0" class="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Paperclip class="w-4 h-4 text-emerald-500" />
          <span>فایل‌های پیوست ({{ toPersianDigits(memory.attachments.length) }})</span>
        </h4>

        <div class="space-y-1.5">
          <a
            v-for="att in memory.attachments"
            :key="att.id"
            :href="att.dataUrl"
            :download="att.name"
            class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs hover:border-indigo-400 transition-colors"
          >
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-slate-400" />
              <span class="font-medium text-slate-800 dark:text-slate-200">{{ att.name }}</span>
            </div>
            <span class="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              <Download class="w-3.5 h-3.5" />
              <span>دانلود</span>
            </span>
          </a>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :is-open="isDeleteModalOpen"
      title="حذف خاطره"
      message="آیا از حذف این خاطره مطمئن هستید؟ خاطره حذف‌شده تا چند ثانیه قابل بازگردانی (Undo) خواهد بود."
      :is-danger="true"
      confirm-text="بله، حذف شود"
      @confirm="executeDelete"
      @cancel="isDeleteModalOpen = false"
    />

    <!-- PDF Export Modal -->
    <PdfExportModal
      v-if="isPdfModalOpen && memory"
      :memory="memory"
      @close="isPdfModalOpen = false"
    />
  </div>

  <!-- Empty fallback if no memory selected -->
  <div v-else class="h-full flex items-center justify-center">
    <EmptyState
      title="هیچ خاطره‌ای انتخاب نشده"
      description="از لیست سمت راست یا خط زمانی یک خاطره را برای مشاهده انتخاب کنید."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calendar,
  Star,
  Lock,
  Edit3,
  Trash2,
  MapPin,
  Mic,
  Image as ImageIcon,
  Paperclip,
  FileText,
  Download,
  FileDown,
  Sparkles,
  Award,
  Target,
  Link as LinkIcon,
} from 'lucide-vue-next'
import type { Memory } from '@/models/Memory'
import { MOOD_DEFINITIONS } from '@/models/Memory'
import { formatJalaliFull } from '@/utils/jalali'
import { toPersianDigits, formatDuration } from '@/utils/format'
import { renderMarkdownToHtml } from '@/utils/sanitize'
import { useMemoryStore } from '@/stores/memoryStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PdfExportModal from '@/components/memory/PdfExportModal.vue'

const props = defineProps<{
  memory?: Memory | null
}>()

const router = useRouter()
const memoryStore = useMemoryStore()
const authStore = useAuthStore()
const { showToast } = useToast()

const isDeleteModalOpen = ref(false)
const isPdfModalOpen = ref(false)

const moodInfo = computed(() => {
  if (!props.memory?.mood) return null
  return MOOD_DEFINITIONS.find((m) => m.id === props.memory?.mood) || null
})

const relatedMemories = computed(() => {
  if (!props.memory?.relatedMemoryIds || props.memory.relatedMemoryIds.length === 0) return []
  var idSet = new Set(props.memory.relatedMemoryIds)
  return memoryStore.memories.filter((m) => idSet.has(m.id))
})

function selectRelatedMemory(id: string) {
  memoryStore.selectMemory(id)
}

const isUnlocked = computed(() => {
  if (!props.memory) return true
  return authStore.isMemoryUnlocked(props.memory.id) || !props.memory.isLocked
})

const renderedContent = computed(() => {
  return renderMarkdownToHtml(props.memory?.content || '')
})

async function toggleImportant() {
  if (!props.memory) return
  var updated = { ...props.memory, isImportant: !props.memory.isImportant }
  await memoryStore.updateMemory(updated)
}

async function toggleLock() {
  if (!props.memory) return
  var updated = { ...props.memory, isLocked: !props.memory.isLocked }
  await memoryStore.updateMemory(updated)
  if (updated.isLocked) {
    showToast({
      type: 'info',
      message: 'خاطره قفل شد.',
    })
  }
}

async function executeDelete() {
  if (!props.memory) return
  var id = props.memory.id
  isDeleteModalOpen.value = false
  await memoryStore.deleteMemory(id)

  showToast({
    type: 'success',
    message: 'خاطره حذف شد.',
    actionText: 'بازگردانی (Undo)',
    onAction: async () => {
      await memoryStore.undoDelete()
      showToast({ type: 'success', message: 'خاطره بازیابی شد.' })
    },
  })
}

function openPhotoPreview(url: string) {
  var w = window.open('')
  w?.document.write(`<img src="${url}" style="max-width:100%; height:auto; margin:auto; display:block;" />`)
}
</script>
