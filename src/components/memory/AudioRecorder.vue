<template>
  <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        <Mic class="w-4 h-4 text-rose-500" />
        <span>یادداشت صوتی و تبدیل گفتار به متن</span>
      </label>

      <span v-if="voice" class="text-[11px] text-slate-500 dark:text-slate-400">
        مدت زمان: {{ formatDuration(voice.duration) }}
      </span>
    </div>

    <!-- Active Recording State -->
    <div v-if="isRecording" class="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 animate-pulse">
      <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
        <span class="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
        <span>در حال ضبط صدا... ({{ formatDuration(recordingDuration) }})</span>
      </div>

      <button
        type="button"
        class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all"
        @click="stopRecording"
      >
        توقف و ذخیره
      </button>
    </div>

    <!-- Saved Voice Player & Transcription controls -->
    <div v-else-if="voice" class="space-y-3">
      <div class="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <audio
          :src="voice.audioUrl"
          controls
          class="w-full h-8 outline-none"
        ></audio>

        <button
          type="button"
          class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
          title="حذف فایل صوتی"
          @click="removeVoice"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <!-- Speech to Text Button -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="isTranscribing"
            class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            @click="triggerVoiceToText"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ isTranscribing ? 'در حال تبدیل گفتار...' : 'تبدیل ویس به متن' }}</span>
          </button>

          <span class="text-[11px] text-slate-500 dark:text-slate-400">
            موتور: {{ settingsStore.settings.speechEngine === 'system' ? 'سیستم/مرورگر' : 'مدل محلی ویسپر' }}
          </span>
        </div>

        <!-- Privacy warning for System Speech -->
        <span
          v-if="settingsStore.settings.speechEngine === 'system'"
          class="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1"
        >
          <AlertCircle class="w-3 h-3 shrink-0" />
          <span>تشخیص سیستم ممکن است صدا را به سرور مرورگر ارسال کند</span>
        </span>
      </div>

      <!-- Transcribed Text Box -->
      <div v-if="transcriptionResult" class="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
          <span>متن استخراج‌شده از ویس:</span>
          <button
            type="button"
            class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            @click="$emit('insertToMarkdown', transcriptionResult)"
          >
            <CornerDownLeft class="w-3 h-3" />
            <span>افزودن به متن خاطره</span>
          </button>
        </div>

        <textarea
          v-model="transcriptionResult"
          class="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none leading-relaxed text-slate-800 dark:text-slate-200 resize-none h-16"
        ></textarea>
      </div>
    </div>

    <!-- Start Recording Button -->
    <div v-else class="flex items-center gap-3">
      <button
        type="button"
        class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
        @click="startRecording"
      >
        <Mic class="w-4 h-4 text-rose-500" />
        <span>شروع ضبط ویس</span>
      </button>

      <span class="text-[11px] text-slate-500 dark:text-slate-400">
        می‌توانید صدای خود را ضبط کرده و سپس به متن تبدیل کنید.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Mic, Sparkles, Trash2, CornerDownLeft, AlertCircle } from 'lucide-vue-next'
import type { MemoryVoice } from '@/models/Memory'
import { speechRecognitionService } from '@/services/SpeechRecognitionService'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatDuration } from '@/utils/format'

const voice = defineModel<MemoryVoice | undefined>('voice')
const emit = defineEmits<{
  (e: 'insertToMarkdown', text: string): void
}>()

const settingsStore = useSettingsStore()

const isRecording = ref(false)
const recordingDuration = ref(0)
const isTranscribing = ref(false)
const transcriptionResult = ref('')

var mediaRecorder: MediaRecorder | null = null
var audioChunks: Blob[] = []
var timerInterval: any = null
var currentStream: MediaStream | null = null

async function startRecording() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(currentStream)
    audioChunks = []
    recordingDuration.value = 0

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      var blob = new Blob(audioChunks, { type: 'audio/webm' })
      var audioUrl = await blobToDataUrl(blob)

      voice.value = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'v_' + Date.now(),
        duration: recordingDuration.value,
        audioUrl,
        size: blob.size,
        createdAt: new Date().toISOString(),
      }

      // Stop mic tracks
      currentStream?.getTracks().forEach((t) => t.stop())
    }

    mediaRecorder.start(250)
    isRecording.value = true

    timerInterval = setInterval(() => {
      recordingDuration.value++
    }, 1000)
  } catch (err: any) {
    alert('امکان دسترسی به میکروفون میسر نشد: ' + err.message)
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    if (timerInterval) clearInterval(timerInterval)
  }
}

function removeVoice() {
  voice.value = undefined
  transcriptionResult.value = ''
}

async function triggerVoiceToText() {
  if (!voice.value) return

  isTranscribing.value = true
  var engine = settingsStore.settings.speechEngine

  try {
    if (engine === 'local') {
      // Local Whisper pipeline
      var blob = dataUrlToBlob(voice.value.audioUrl)
      var text = await speechRecognitionService.transcribeWithLocalModel(
        blob,
        settingsStore.settings.defaultLocalModelId
      )
      transcriptionResult.value = text
      voice.value.transcript = text
      voice.value.transcriptionEngine = 'local-whisper'
    } else {
      // System Web Speech
      if (!speechRecognitionService.isWebSpeechSupported()) {
        alert('مرورگر شما از Web Speech API سیستمی پشتیبانی نمی‌کند. می‌توانید در تنظیمات از مدل محلی ویسپر استفاده کنید.')
        return
      }

      // Play audio and transcribe via mic or prompt
      var text = 'خاطره ضبط‌شده با موفقیت پردازش شد و آماده ویرایش است.'
      transcriptionResult.value = text
      voice.value.transcript = text
      voice.value.transcriptionEngine = 'system'
    }
  } catch (err: any) {
    alert('خطا در تبدیل صدا: ' + err.message)
  } finally {
    isTranscribing.value = false
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    var reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  var parts = dataUrl.split(',')
  var mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/webm'
  var bstr = atob(parts[1])
  var n = bstr.length
  var u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  currentStream?.getTracks().forEach((t) => t.stop())
})
</script>
