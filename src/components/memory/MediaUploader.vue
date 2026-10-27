<template>
  <div class="space-y-4">
    <!-- Photos Section -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <ImageIcon class="w-4 h-4 text-indigo-500" />
          <span>عکس‌های خاطره</span>
          <span v-if="photos.length > 0" class="text-slate-400 font-normal">({{ toPersianDigits(photos.length) }} عکس)</span>
        </label>

        <button
          type="button"
          class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
          @click="photoInputRef?.click()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>افزودن عکس</span>
        </button>
      </div>

      <input
        ref="photoInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handlePhotoUpload"
      />

      <!-- Photos Grid -->
      <div v-if="photos.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-video flex flex-col justify-end"
        >
          <img
            :src="photo.thumbnailUrl || photo.dataUrl"
            :alt="photo.name"
            class="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />

          <!-- Gradient overlay for stats -->
          <div class="relative z-10 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-2 text-white flex items-center justify-between">
            <div class="text-[10px] leading-tight">
              <span class="block truncate max-w-[90px] font-medium">{{ photo.name }}</span>
              <span class="text-emerald-300 font-bold">{{ formatFileSize(photo.compressedSize) }}</span>
              <span class="text-slate-300 line-through text-[9px] mr-1">({{ formatFileSize(photo.originalSize) }})</span>
            </div>

            <button
              type="button"
              class="p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
              title="حذف عکس"
              @click="confirmRemovePhoto(index)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Compression in progress loading -->
      <div v-if="isCompressing" class="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
        <div class="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span>در حال بهینه‌سازی و فشرده‌سازی عکس‌ها...</span>
      </div>
    </div>

    <!-- Attachments Section (PDF, Document, Audio) -->
    <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Paperclip class="w-4 h-4 text-emerald-500" />
          <span>پیوست‌ها (PDF، فایل صوتی، سند)</span>
          <span v-if="attachments.length > 0" class="text-slate-400 font-normal">({{ toPersianDigits(attachments.length) }})</span>
        </label>

        <button
          type="button"
          class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          @click="fileInputRef?.click()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>افزودن فایل پیوست</span>
        </button>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden"
        @change="handleFileUpload"
      />

      <div v-if="attachments.length > 0" class="space-y-1.5">
        <div
          v-for="(att, idx) in attachments"
          :key="att.id"
          class="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
        >
          <div class="flex items-center gap-2 min-w-0">
            <FileText class="w-4 h-4 text-slate-400 shrink-0" />
            <span class="truncate font-medium text-slate-800 dark:text-slate-200">{{ att.name }}</span>
            <span class="text-[10px] text-slate-400 shrink-0">({{ formatFileSize(att.size) }})</span>
          </div>

          <button
            type="button"
            class="text-rose-500 hover:text-rose-600 p-1"
            title="حذف پیوست"
            @click="confirmRemoveAttachment(idx)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Remove Modal -->
    <ConfirmModal
      :is-open="confirmModal.isOpen"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :is-danger="true"
      confirm-text="بله، حذف شود"
      @confirm="executeRemoval"
      @cancel="confirmModal.isOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Image as ImageIcon, Plus, Trash2, Paperclip, FileText } from 'lucide-vue-next'
import type { MemoryPhoto, MemoryAttachment } from '@/models/Memory'
import { mediaCompressionService } from '@/services/MediaCompressionService'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatFileSize, toPersianDigits } from '@/utils/format'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const photos = defineModel<MemoryPhoto[]>('photos', { default: () => [] })
const attachments = defineModel<MemoryAttachment[]>('attachments', { default: () => [] })

const settingsStore = useSettingsStore()
const photoInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isCompressing = ref(false)

const confirmModal = ref({
  isOpen: false,
  title: '',
  message: '',
  type: 'photo' as 'photo' | 'attachment',
  targetIndex: -1,
})

async function handlePhotoUpload(e: Event) {
  var target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  isCompressing.value = true
  try {
    for (var file of Array.from(target.files)) {
      if (!file.type.startsWith('image/')) continue
      var compressed = await mediaCompressionService.compressImage(file, {
        quality: settingsStore.settings.photoQuality,
        customMaxWidth: settingsStore.settings.photoMaxWidth,
      })
      photos.value.push(compressed)
    }
  } finally {
    isCompressing.value = false
    target.value = ''
  }
}

async function handleFileUpload(e: Event) {
  var target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  for (var file of Array.from(target.files)) {
    var dataUrl = await readFileAsDataUrl(file)
    attachments.value.push({
      id: crypto.randomUUID ? crypto.randomUUID() : 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl,
      createdAt: new Date().toISOString(),
    })
  }
  target.value = ''
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    var reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function confirmRemovePhoto(index: number) {
  confirmModal.value = {
    isOpen: true,
    title: 'حذف تصویر',
    message: 'آیا از حذف این تصویر از خاطره مطمئن هستید؟',
    type: 'photo',
    targetIndex: index,
  }
}

function confirmRemoveAttachment(index: number) {
  confirmModal.value = {
    isOpen: true,
    title: 'حذف پیوست',
    message: 'آیا از حذف این فایل پیوست اطمینان دارید؟',
    type: 'attachment',
    targetIndex: index,
  }
}

function executeRemoval() {
  if (confirmModal.value.type === 'photo') {
    photos.value.splice(confirmModal.value.targetIndex, 1)
  } else {
    attachments.value.splice(confirmModal.value.targetIndex, 1)
  }
  confirmModal.value.isOpen = false
}
</script>
