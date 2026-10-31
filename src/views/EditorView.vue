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

      <!-- Mood Selection (حال‌وهوا) -->
      <div
        v-if="isFieldVisible('mood')"
        class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors"
      >
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Smile class="w-4 h-4 text-amber-500" />
            <span>حال‌وهوای امروز شما:</span>
          </label>
          <span v-if="form.mood" class="text-[11px] text-slate-400 font-medium">
            انتخاب‌شده: {{ selectedMoodLabel }}
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-for="m in MOOD_DEFINITIONS"
            :key="m.id"
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
            :class="[
              form.mood === m.id
                ? `${m.bgColor} ${m.textColor} ${m.borderColor} shadow-sm ring-2 ${m.ringColor}`
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300',
            ]"
            @click="selectMood(m.id)"
          >
            <span class="text-base">{{ m.emoji }}</span>
            <span>{{ m.label }}</span>
          </button>
        </div>
      </div>

      <!-- Guided Prompts (پرسش راهنما برای روزهایی که نمیدانند چی بنویسند) -->
      <GuidedPrompts
        v-if="isFieldVisible('guidedPrompts')"
        @select-prompt="insertPromptToContent"
      />

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

      <!-- Tags, People, and Location with autocomplete -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <!-- Tags Input with Suggestions -->
        <div
          v-if="isFieldVisible('tags')"
          class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Tag class="w-3.5 h-3.5 text-indigo-500" />
            <span>برچسب‌ها</span>
          </label>
          <TagChipInput
            v-model="form.tags"
            :suggestions="memoryStore.availableTags"
            placeholder="برچسب جدید..."
            prefix="#"
            badge-color-class="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
            @update:model-value="scheduleDraftSave"
          />
        </div>

        <!-- People Input with Suggestions -->
        <div
          v-if="isFieldVisible('people')"
          class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Users class="w-3.5 h-3.5 text-amber-500" />
            <span>افراد مرتبط</span>
          </label>
          <TagChipInput
            v-model="form.people"
            :suggestions="memoryStore.availablePeople"
            placeholder="نام شخص..."
            prefix="👤 "
            badge-color-class="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
            @update:model-value="scheduleDraftSave"
          />
        </div>

        <!-- Location Input with Suggestions -->
        <div
          v-if="isFieldVisible('location')"
          class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MapPin class="w-3.5 h-3.5 text-rose-500" />
            <span>مکان (اختیاری)</span>
          </label>
          <AutocompleteInput
            v-model="form.location"
            :suggestions="memoryStore.availableLocations"
            placeholder="مثلاً: شیراز، باغ ارم"
            @update:model-value="scheduleDraftSave"
          />
        </div>
      </div>

      <!-- Life Chapter, Event Type, and Activities with Suggestions -->
      <div
        v-if="isFieldVisible('lifeChapter') || isFieldVisible('eventType') || isFieldVisible('activities')"
        class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1"
      >
        <!-- Life Chapter Input (فصل زندگی) -->
        <div
          v-if="isFieldVisible('lifeChapter')"
          class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <BookOpen class="w-3.5 h-3.5 text-purple-500" />
            <span>فصل زندگی (دانشگاه، شغل، مهاجرت...)</span>
          </label>
          <AutocompleteInput
            v-model="form.lifeChapter"
            :suggestions="defaultChaptersCombined"
            placeholder="مثلاً: دوران دانشجویی"
            @update:model-value="scheduleDraftSave"
          />
        </div>

        <!-- Event Type Input (نوع رویداد) -->
        <div
          v-if="isFieldVisible('eventType')"
          class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Compass class="w-3.5 h-3.5 text-emerald-500" />
            <span>نوع رویداد (جشن، سفر، جلسه...)</span>
          </label>
          <AutocompleteInput
            v-model="form.eventType"
            :suggestions="defaultEventTypesCombined"
            placeholder="مثلاً: سفر دوستانه"
            @update:model-value="scheduleDraftSave"
          />
        </div>

        <!-- Activities Input (فعالیت‌ها) -->
        <div
          v-if="isFieldVisible('activities')"
          class="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Zap class="w-3.5 h-3.5 text-teal-500" />
            <span>فعالیت‌ها (ورزش، مطالعه، خرید...)</span>
          </label>
          <TagChipInput
            v-model="form.activities"
            :suggestions="defaultActivitiesCombined"
            placeholder="افزودن فعالیت..."
            prefix="⚡ "
            badge-color-class="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400"
            @update:model-value="scheduleDraftSave"
          />
        </div>
      </div>

      <!-- Reflection & Growth Fields: Gratitude, Daily Lesson, Goals -->
      <div
        v-if="isFieldVisible('gratitude') || isFieldVisible('dailyLesson') || isFieldVisible('goals')"
        class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1"
      >
        <!-- Gratitude (سپاسگزاری) -->
        <div
          v-if="isFieldVisible('gratitude')"
          class="space-y-1.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-amber-500" />
            <span>سپاسگزاری امروز:</span>
          </label>
          <textarea
            v-model="form.gratitude"
            rows="2"
            placeholder="امروز بابت چه چیزی سپاسگزاری؟"
            class="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 resize-none leading-relaxed"
            @input="scheduleDraftSave"
          ></textarea>
        </div>

        <!-- Daily Lesson (نتیجه گرفته شده از روز) -->
        <div
          v-if="isFieldVisible('dailyLesson')"
          class="space-y-1.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Award class="w-3.5 h-3.5 text-indigo-500" />
            <span>نتیجه / درس گرفته شده از روز:</span>
          </label>
          <textarea
            v-model="form.dailyLesson"
            rows="2"
            placeholder="امروز چه درسی گرفتی یا به چه بینشی رسیدی؟"
            class="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 resize-none leading-relaxed"
            @input="scheduleDraftSave"
          ></textarea>
        </div>

        <!-- Goals (اهداف گرفته شده) -->
        <div
          v-if="isFieldVisible('goals')"
          class="space-y-1.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Target class="w-3.5 h-3.5 text-emerald-500" />
            <span>اهداف گرفته شده (با اینتر):</span>
          </label>
          <TagChipInput
            v-model="form.goals"
            :suggestions="memoryStore.availableGoals"
            placeholder="هدف یا تصمیم جدید..."
            prefix="🎯 "
            badge-color-class="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
            @update:model-value="scheduleDraftSave"
          />
        </div>
      </div>

      <!-- Related Memories Linker (خاطره‌های مرتبط) -->
      <div
        v-if="isFieldVisible('relatedMemories') && candidateRelatedMemories.length > 0"
        class="space-y-2.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <LinkIcon class="w-4 h-4 text-indigo-500" />
            <span>ارتباط با خاطره‌های دیگر (پیوستگی داستان زندگی):</span>
          </label>
          <span class="text-[11px] text-slate-400">
            {{ toPersianDigits(form.relatedMemoryIds.length) }} خاطره پیوند خورده
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap max-h-36 overflow-y-auto p-1">
          <button
            v-for="cand in candidateRelatedMemories"
            :key="cand.id"
            type="button"
            class="text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all text-right"
            :class="[
              form.relatedMemoryIds.includes(cand.id)
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300',
            ]"
            @click="toggleRelatedMemory(cand.id)"
          >
            <span>🔗 {{ cand.title || 'خاطره ' + formatJalaliShort(cand.date) }}</span>
            <span v-if="form.relatedMemoryIds.includes(cand.id)">✓</span>
          </button>
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
  Smile,
  BookOpen,
  Compass,
  Zap,
  Sparkles,
  Award,
  Target,
  Link as LinkIcon,
} from 'lucide-vue-next'
import type { Memory, MemoryPhoto, MemoryAttachment, MemoryVoice, MemoryMood } from '@/models/Memory'
import { MOOD_DEFINITIONS } from '@/models/Memory'
import { useMemoryStore } from '@/stores/memoryStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { textEnhancementService } from '@/services/TextEnhancementService'
import { userDictionaryService } from '@/services/UserDictionaryService'
import { useToast } from '@/composables/useToast'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { getTodayIso, getCurrentTime, formatJalaliShort } from '@/utils/jalali'
import { toPersianDigits } from '@/utils/format'
import MarkdownEditor from '@/components/memory/MarkdownEditor.vue'
import MediaUploader from '@/components/memory/MediaUploader.vue'
import AudioRecorder from '@/components/memory/AudioRecorder.vue'
import GuidedPrompts from '@/components/memory/GuidedPrompts.vue'
import TagChipInput from '@/components/common/TagChipInput.vue'
import AutocompleteInput from '@/components/common/AutocompleteInput.vue'

const props = defineProps<{
  id?: string
}>()

const router = useRouter()
const route = useRoute()
const memoryStore = useMemoryStore()
const settingsStore = useSettingsStore()
const { showToast } = useToast()

const isEditing = computed(() => !!props.id)

const form = ref<{
  title: string
  content: string
  date: string
  time: string
  tags: string[]
  people: string[]
  location: string
  photos: MemoryPhoto[]
  attachments: MemoryAttachment[]
  voice?: MemoryVoice
  isImportant: boolean
  isLocked: boolean
  mood?: MemoryMood
  lifeChapter: string
  activities: string[]
  eventType: string
  gratitude: string
  dailyLesson: string
  goals: string[]
  relatedMemoryIds: string[]
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
  mood: undefined,
  lifeChapter: '',
  activities: [],
  eventType: '',
  gratitude: '',
  dailyLesson: '',
  goals: [],
  relatedMemoryIds: [],
})

const draftSavedText = ref('')
var draftTimeout: any = null

function isFieldVisible(field: keyof typeof settingsStore.settings.editorFields): boolean {
  if (!settingsStore.settings.editorFields) return true
  return settingsStore.settings.editorFields[field] !== false
}

// Default suggestions combined with user history
const DEFAULT_CHAPTERS = ['دوران مدرسه', 'دانشگاه', 'سربازی', 'ازدواج', 'شغل جدید', 'سفر و ماجراجویی', 'دوران کرونا', 'مهاجرت']
const defaultChaptersCombined = computed(() => {
  var set = new Set([...DEFAULT_CHAPTERS, ...memoryStore.availableLifeChapters])
  return Array.from(set).sort()
})

const DEFAULT_EVENT_TYPES = ['جشن تولد', 'مهمانی خانوادگی', 'سفر', 'جلسه کاری', 'ورزش و پیاده‌روی', 'خرید', 'کنسرت و سینما', 'کتاب‌خوانی']
const defaultEventTypesCombined = computed(() => {
  var set = new Set([...DEFAULT_EVENT_TYPES, ...memoryStore.availableEventTypes])
  return Array.from(set).sort()
})

const DEFAULT_ACTIVITIES = ['ورزش صبحگاهی', 'مطالعه کتاب', 'برنامه‌نویسی', 'آشپزی', 'طبیعت‌گردی', 'رانندگی', 'موسیقی', 'کارهای خانه']
const defaultActivitiesCombined = computed(() => {
  var set = new Set([...DEFAULT_ACTIVITIES, ...memoryStore.availableActivities])
  return Array.from(set).sort()
})

const selectedMoodLabel = computed(() => {
  if (!form.value.mood) return ''
  var item = MOOD_DEFINITIONS.find((m) => m.id === form.value.mood)
  return item ? `${item.emoji} ${item.label}` : ''
})

const candidateRelatedMemories = computed(() => {
  return memoryStore.memories
    .filter((m) => (props.id ? m.id !== props.id : true))
    .slice(0, 25)
})

onMounted(async () => {
  if (isEditing.value && props.id) {
    var existing = memoryStore.memories.find((m) => m.id === props.id)
    if (!existing) {
      existing = await memoryStore.memories.find((m) => m.id === props.id)
    }
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
        mood: existing.mood,
        lifeChapter: existing.lifeChapter || '',
        activities: [...(existing.activities || [])],
        eventType: existing.eventType || '',
        gratitude: existing.gratitude || '',
        dailyLesson: existing.dailyLesson || '',
        goals: [...(existing.goals || [])],
        relatedMemoryIds: [...(existing.relatedMemoryIds || [])],
      }
    }
  } else {
    // Check if there is an unsaved draft
    var draft = await memoryStore.loadDraft()
    if (draft && (draft.content || draft.title)) {
      form.value.title = draft.title || ''
      form.value.content = draft.content || ''
      form.value.date = draft.date || getTodayIso()
      form.value.time = draft.time || getCurrentTime()
      form.value.tags = draft.tags || []
      form.value.people = draft.people || []
      form.value.location = draft.location || ''
      form.value.isImportant = !!draft.isImportant
      form.value.isLocked = !!draft.isLocked
      form.value.mood = draft.mood as MemoryMood | undefined
      form.value.lifeChapter = draft.lifeChapter || ''
      form.value.activities = draft.activities || []
      form.value.eventType = draft.eventType || ''
      form.value.gratitude = draft.gratitude || ''
      form.value.dailyLesson = draft.dailyLesson || ''
      form.value.goals = draft.goals || []
      form.value.relatedMemoryIds = draft.relatedMemoryIds || []
      draftSavedText.value = 'پیش‌نویس ذخیره‌شده بازیابی شد'
    }
  }
})

function selectMood(mood: MemoryMood) {
  if (form.value.mood === mood) {
    form.value.mood = undefined
  } else {
    form.value.mood = mood
  }
  scheduleDraftSave()
}

function toggleRelatedMemory(id: string) {
  var list = [...form.value.relatedMemoryIds]
  var idx = list.indexOf(id)
  if (idx !== -1) {
    list.splice(idx, 1)
  } else {
    list.push(id)
  }
  form.value.relatedMemoryIds = list
  scheduleDraftSave()
}

function insertPromptToContent(prompt: string) {
  var insertText = `\n\n> 💡 **${prompt}**\n\n`
  form.value.content += insertText
  scheduleDraftSave()
}

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
      mood: form.value.mood,
      lifeChapter: form.value.lifeChapter,
      activities: form.value.activities,
      eventType: form.value.eventType,
      gratitude: form.value.gratitude,
      dailyLesson: form.value.dailyLesson,
      goals: form.value.goals,
      relatedMemoryIds: form.value.relatedMemoryIds,
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

async function saveMemory() {
  if (!form.value.content.trim() && !form.value.title.trim() && form.value.photos.length === 0) {
    showToast({ type: 'warning', message: 'لطفاً عنوان یا متن خاطره را وارد کنید.' })
    return
  }

  var nowIso = new Date().toISOString()

  // Apply auto spell-check and smart formatting if enabled in settings
  var contentToSave = form.value.content
  await userDictionaryService.ensureLoaded()
  if (settingsStore.settings.autoSpellCheck || settingsStore.settings.autoFormatting) {
    contentToSave = textEnhancementService.enhance(contentToSave, {
      spellCheck: settingsStore.settings.autoSpellCheck,
      autoFormat: settingsStore.settings.autoFormatting,
    })
  }

  try {
    if (isEditing.value && props.id) {
      var updated: Memory = JSON.parse(
        JSON.stringify({
          id: props.id,
          title: form.value.title.trim() || undefined,
          content: contentToSave,
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
          mood: form.value.mood || undefined,
          lifeChapter: form.value.lifeChapter?.trim() || undefined,
          activities: form.value.activities,
          eventType: form.value.eventType?.trim() || undefined,
          gratitude: form.value.gratitude?.trim() || undefined,
          dailyLesson: form.value.dailyLesson?.trim() || undefined,
          goals: form.value.goals,
          relatedMemoryIds: form.value.relatedMemoryIds,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      )
      await memoryStore.updateMemory(updated)
      showToast({ type: 'success', message: 'خاطره با موفقیت ویرایش شد.' })
    } else {
      var newMemory: Memory = JSON.parse(
        JSON.stringify({
          id: crypto.randomUUID ? crypto.randomUUID() : 'm_' + Date.now(),
          title: form.value.title.trim() || undefined,
          content: contentToSave,
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
          mood: form.value.mood || undefined,
          lifeChapter: form.value.lifeChapter?.trim() || undefined,
          activities: form.value.activities,
          eventType: form.value.eventType?.trim() || undefined,
          gratitude: form.value.gratitude?.trim() || undefined,
          dailyLesson: form.value.dailyLesson?.trim() || undefined,
          goals: form.value.goals,
          relatedMemoryIds: form.value.relatedMemoryIds,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      )
      await memoryStore.addMemory(newMemory)
      await memoryStore.clearDraft()
      showToast({ type: 'success', message: 'خاطره جدید با موفقیت ثبت شد.' })
    }

    router.push('/')
  } catch (err: any) {
    console.error('Error saving memory:', err)
    showToast({ type: 'error', message: 'خطا در ثبت خاطره: ' + (err.message || 'خطای پایگاه داده') })
  }
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
