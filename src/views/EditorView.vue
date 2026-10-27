<template>
  <div class="max-w-4xl mx-auto p-4 sm:p-6 pb-28 md:pb-12 space-y-6">
    <!-- Top Bar with Back and Save -->
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="بازگشت"
          @click="handleCancel"
        >
          <ArrowRight class="w-5 h-5" />
        </button>

        <div>
          <h2 class="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {{ isEditing ? 'ویرایش خاطره' : 'ثبت خاطره جدید' }}
          </h2>
          <span v-if="draftSavedText" class="text-[11px] text-emerald-500 font-medium">
            {{ draftSavedText }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          @click="handleCancel"
        >
          انصراف
        </button>

        <button
          type="button"
          class="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          @click="saveMemory"
        >
          <Save class="w-4 h-4" />
          <span>{{ isEditing ? 'ذخیره تغییرات' : 'ثبت خاطره' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Form Fields -->
    <div class="space-y-4">
      <!-- Title Input (Optional) -->
      <div>
        <input
          v-model="form.title"
          type="text"
          placeholder="عنوان خاطره (اختیاری)"
          class="w-full text-lg sm:text-xl font-bold p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
          @input="scheduleDraftSave"
        />
      </div>

      <!-- Date, Time, and Quick Options Bar -->
      <div class="flex items-center gap-3 flex-wrap p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <!-- Date Selector (Shamsi) -->
        <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Calendar class="w-4 h-4 text-indigo-500 shrink-0" />
          <span class="font-semibold">تاریخ:</span>
          <input
            v-model="form.date"
            type="date"
            class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            @change="scheduleDraftSave"
          />
          <span class="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mr-1">
            ({{ formatJalaliShort(form.date) }})
          </span>
        </div>

        <!-- Time Selector -->
        <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Clock class="w-4 h-4 text-slate-400 shrink-0" />
          <span class="font-semibold">ساعت:</span>
          <input
            v-model="form.time"
            type="time"
            class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            @change="scheduleDraftSave"
          />
        </div>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        <!-- Important Toggle Button -->
        <button
          type="button"
          class="flex items-center gap-1 px-3 py-1 rounded-xl transition-all font-semibold"
          :class="form.isImportant ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
          @click="form.isImportant = !form.isImportant; scheduleDraftSave()"
        >
          <Star class="w-3.5 h-3.5" :class="form.isImportant ? 'fill-amber-400 text-amber-400' : ''" />
          <span>{{ form.isImportant ? 'خاطره مهم' : 'عادی' }}</span>
        </button>

        <!-- Lock Toggle Button -->
        <button
          type="button"
          class="flex items-center gap-1 px-3 py-1 rounded-xl transition-all font-semibold"
          :class="form.isLocked ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
          @click="form.isLocked = !form.isLocked; scheduleDraftSave()"
        >
          <Lock class="w-3.5 h-3.5" />
          <span>{{ form.isLocked ? 'قفل‌شده' : 'بدون قفل' }}</span>
        </button>
      </div>

      <!-- Markdown Text Editor -->
      <MarkdownEditor
        v-model="form.content"
        @update:model-value="scheduleDraftSave"
      />

      <!-- Voice Note & Speech to Text Component -->
      <AudioRecorder
        v-model:voice="form.voice"
        @insert-to-markdown="appendTranscribedText"
      />

      <!-- Photos and File Attachments Component -->
      <MediaUploader
        v-model:photos="form.photos"
        v-model:attachments="form.attachments"
      />

      <!-- Tags, People, and Location -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <!-- Tags Input -->
        <div class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Tag class="w-3.5 h-3.5 text-indigo-500" />
            <span>برچسب‌ها (با اینتر یا ویرگول)</span>
          </label>
          <div class="flex items-center gap-1 flex-wrap">
            <span
              v-for="(t, idx) in form.tags"
              :key="t"
              class="px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
            >
              #{{ t }}
              <button type="button" class="hover:text-rose-500" @click="removeTag(idx)">×</button>
            </span>
            <input
              v-model="newTagInput"
              type="text"
              placeholder="برچسب جدید..."
              class="text-xs p-1 bg-transparent outline-none flex-1 min-w-[70px] text-slate-800 dark:text-slate-200"
              @keydown.enter.prevent="addTag"
              @keydown.,.prevent="addTag"
            />
          </div>
        </div>

        <!-- People Input -->
        <div class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Users class="w-3.5 h-3.5 text-amber-500" />
            <span>افراد مرتبط (با اینتر یا ویرگول)</span>
          </label>
          <div class="flex items-center gap-1 flex-wrap">
            <span
              v-for="(p, idx) in form.people"
              :key="p"
              class="px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              👤 {{ p }}
              <button type="button" class="hover:text-rose-500" @click="removePerson(idx)">×</button>
            </span>
            <input
              v-model="newPersonInput"
              type="text"
              placeholder="نام شخص..."
              class="text-xs p-1 bg-transparent outline-none flex-1 min-w-[70px] text-slate-800 dark:text-slate-200"
              @keydown.enter.prevent="addPerson"
              @keydown.,.prevent="addPerson"
            />
          </div>
        </div>

        <!-- Location Input -->
        <div class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MapPin class="w-3.5 h-3.5 text-rose-500" />
            <span>مکان (اختیاری)</span>
          </label>
          <input
            v-model="form.location"
            type="text"
            placeholder="مثلاً: شیراز، باغ ارم"
            class="w-full text-xs p-1 bg-transparent outline-none text-slate-800 dark:text-slate-200"
            @input="scheduleDraftSave"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowRight,
  Save,
  Calendar,
  Clock,
  Star,
  Lock,
  Tag,
  Users,
  MapPin,
} from 'lucide-vue-next'
import type { Memory, MemoryPhoto, MemoryAttachment, MemoryVoice } from '@/models/Memory'
import { useMemoryStore } from '@/stores/memoryStore'
import { useToast } from '@/composables/useToast'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { getTodayIso, getCurrentTime, formatJalaliShort } from '@/utils/jalali'
import MarkdownEditor from '@/components/memory/MarkdownEditor.vue'
import MediaUploader from '@/components/memory/MediaUploader.vue'
import AudioRecorder from '@/components/memory/AudioRecorder.vue'

const props = defineProps<{
  id?: string
}>()

const router = useRouter()
const route = useRoute()
const memoryStore = useMemoryStore()
const { showToast } = useToast()

const isEditing = computed(() => !!props.id)

const form = ref<{
  title: string
  content: string
  date: string
  time: string
  tags: string[]
  people: string[]
  location?: string
  photos: MemoryPhoto[]
  attachments: MemoryAttachment[]
  voice?: MemoryVoice
  isImportant: boolean
  isLocked: boolean
}>({
  title: '',
  content: '',
  date: getTodayIso(),
  time: getCurrentTime(),
  tags: [],
  people: [],
  location: '',
  photos: [],
  attachments: [],
  voice: undefined,
  isImportant: false,
  isLocked: false,
})

const newTagInput = ref('')
const newPersonInput = ref('')
const draftSavedText = ref('')
var draftTimeout: any = null

onMounted(async () => {
  if (isEditing.value && props.id) {
    var existing = await memoryStore.memories.find((m) => m.id === props.id)
    if (existing) {
      form.value = {
        title: existing.title || '',
        content: existing.content || '',
        date: existing.date || getTodayIso(),
        time: existing.time || getCurrentTime(),
        tags: [...(existing.tags || [])],
        people: [...(existing.people || [])],
        location: existing.location || '',
        photos: [...(existing.photos || [])],
        attachments: [...(existing.attachments || [])],
        voice: existing.voice ? { ...existing.voice } : undefined,
        isImportant: !!existing.isImportant,
        isLocked: !!existing.isLocked,
      }
    }
  } else {
    // Check if there is an unsaved draft
    var draft = await memoryStore.loadDraft()
    if (draft && draft.content) {
      form.value.title = draft.title || ''
      form.value.content = draft.content || ''
      form.value.date = draft.date || getTodayIso()
      form.value.time = draft.time || getCurrentTime()
      form.value.tags = draft.tags || []
      form.value.people = draft.people || []
      form.value.location = draft.location || ''
      form.value.isImportant = !!draft.isImportant
      form.value.isLocked = !!draft.isLocked
      draftSavedText.value = 'پیش‌نویس ذخیره‌شده بازیابی شد'
    }
  }
})

function scheduleDraftSave() {
  if (isEditing.value) return // Don't overwrite new memory draft when editing
  if (draftTimeout) clearTimeout(draftTimeout)
  draftTimeout = setTimeout(async () => {
    await memoryStore.saveDraft({
      id: 'current-draft',
      title: form.value.title,
      content: form.value.content,
      date: form.value.date,
      time: form.value.time,
      tags: form.value.tags,
      people: form.value.people,
      location: form.value.location,
      isImportant: form.value.isImportant,
      isLocked: form.value.isLocked,
      updatedAt: new Date().toISOString(),
    })
    draftSavedText.value = 'پیش‌نویس خودکار ذخیره شد'
  }, 1000)
}

function appendTranscribedText(text: string) {
  if (!text) return
  form.value.content += (form.value.content ? '\n\n' : '') + text
  scheduleDraftSave()
}

function addTag() {
  var val = newTagInput.value.trim().replace(/^#/, '')
  if (val && !form.value.tags.includes(val)) {
    form.value.tags.push(val)
    newTagInput.value = ''
    scheduleDraftSave()
  }
}

function removeTag(idx: number) {
  form.value.tags.splice(idx, 1)
  scheduleDraftSave()
}

function addPerson() {
  var val = newPersonInput.value.trim()
  if (val && !form.value.people.includes(val)) {
    form.value.people.push(val)
    newPersonInput.value = ''
    scheduleDraftSave()
  }
}

function removePerson(idx: number) {
  form.value.people.splice(idx, 1)
  scheduleDraftSave()
}

async function saveMemory() {
  if (!form.value.content.trim() && !form.value.title.trim() && form.value.photos.length === 0) {
    showToast({ type: 'warning', message: 'لطفاً عنوان یا متن خاطره را وارد کنید.' })
    return
  }

  var nowIso = new Date().toISOString()

  if (isEditing.value && props.id) {
    var updated: Memory = {
      id: props.id,
      title: form.value.title.trim() || undefined,
      content: form.value.content,
      date: form.value.date,
      time: form.value.time,
      tags: form.value.tags,
      people: form.value.people,
      location: form.value.location?.trim() || undefined,
      photos: form.value.photos,
      attachments: form.value.attachments,
      voice: form.value.voice,
      isImportant: form.value.isImportant,
      isLocked: form.value.isLocked,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    await memoryStore.updateMemory(updated)
    showToast({ type: 'success', message: 'خاطره با موفقیت ویرایش شد.' })
  } else {
    var newMemory: Memory = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'm_' + Date.now(),
      title: form.value.title.trim() || undefined,
      content: form.value.content,
      date: form.value.date,
      time: form.value.time,
      tags: form.value.tags,
      people: form.value.people,
      location: form.value.location?.trim() || undefined,
      photos: form.value.photos,
      attachments: form.value.attachments,
      voice: form.value.voice,
      isImportant: form.value.isImportant,
      isLocked: form.value.isLocked,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    await memoryStore.addMemory(newMemory)
    await memoryStore.clearDraft()
    showToast({ type: 'success', message: 'خاطره جدید با موفقیت ثبت شد.' })
  }

  router.push('/')
}

function handleCancel() {
  router.back()
}

useKeyboardShortcuts({
  onSave: () => saveMemory(),
  onEscape: () => handleCancel(),
})

onUnmounted(() => {
  if (draftTimeout) clearTimeout(draftTimeout)
})
</script>
