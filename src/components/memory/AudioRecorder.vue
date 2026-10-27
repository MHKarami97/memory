<template>
  <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        <Mic class="w-4 h-4 text-rose-500" />
        <span>یادداشت صوتی و تبدیل گفتار به متن فارسی</span>
      </label>

      <span v-if="voice" class="text-[11px] text-slate-500 dark:text-slate-400">
        مدت زمان: {{ formatDuration(voice.duration) }}
      </span>
    </div>

    <!-- Active Recording State -->
    <div v-if="isRecording" class="space-y-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
      <div class="flex items-center justify-between">
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

      <!-- Real-time live dictation transcription preview while speaking -->
      <div v-if="liveDetectedText" class="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-100 dark:border-rose-950 text-xs text-slate-700 dark:text-slate-300">
        <span class="text-[10px] text-rose-500 font-bold block mb-1">متن تشخیص داده‌شده زنده:</span>
        <p class="leading-relaxed">{{ liveDetectedText }}</p>
      </div>
    </div>

    <!-- Active Direct Dictation Mode (Without saving audio file) -->
    <div v-else-if="isDirectDictating" class="space-y-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
          <span>در حال گوش دادن به گفتار شما (فارسی)... صحبت کنید</span>
        </div>

        <button
          type="button"
          class="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
          @click="stopDirectDictation"
        >
          پایان دیکته
        </button>
      </div>

      <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 text-xs text-slate-800 dark:text-slate-200 min-h-[48px]">
        {{ liveDetectedText || 'صدا در حال دریافت است...' }}
      </div>
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

      <!-- Speech to Text Controls -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="isTranscribing"
            class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            @click="triggerVoiceToText"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ isTranscribing ? (transcriptionStatus || 'در حال تبدیل...') : 'تبدیل ویس به متن' }}</span>
          </button>

          <span class="text-[11px] text-slate-500 dark:text-slate-400">
            موتور: {{ settingsStore.settings.speechEngine === 'system' ? 'سیستم/مرورگر' : 'مدل محلی ویسپر' }}
          </span>
        </div>

        <span
          v-if="settingsStore.settings.speechEngine === 'system'"
          class="text-[10px] text-slate-500 dark:text-slate-400"
        >
          تشخیص با Web Speech API مرورگر
        </span>
      </div>

      <!-- Transcribed Text Box -->
      <div v-if="transcriptionResult" class="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
          <span>متن استخراج‌شده از گفتار:</span>
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
          class="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none leading-relaxed text-slate-800 dark:text-slate-200 resize-none h-20"
        ></textarea>
      </div>
    </div>

    <!-- Start Recording / Dictation Buttons -->
    <div v-else class="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        class="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
        @click="startRecording"
      >
        <Mic class="w-4 h-4 text-rose-500 hover:text-white" />
        <span>ضبط ویس و تبدیل متن</span>
      </button>

      <button
        v-if="speechRecognitionService.isWebSpeechSupported()"
        type="button"
        class="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-indigo-200 dark:border-indigo-800"
        @click="startDirectDictation"
      >
        <Sparkles class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>دیکته مستقیم گفتار به متن</span>
      </button>

      <span class="text-[11px] text-slate-500 dark:text-slate-400 pr-1">
        صدای خود را ضبط کنید یا با دیکته صوتی بدون تایپ بنویسید.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Mic, Sparkles, Trash2, CornerDownLeft } from 'lucide-vue-next'
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
const isDirectDictating = ref(false)
const isTranscribing = ref(false)
const transcriptionStatus = ref('')
const transcriptionResult = ref('')
const liveDetectedText = ref('')

var mediaRecorder: MediaRecorder | null = null
var audioChunks: Blob[] = []
var timerInterval: any = null
var currentStream: MediaStream | null = null
var liveDictationSession: { stop: () => void } | null = null

async function startRecording() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(currentStream)
    audioChunks = []
    recordingDuration.value = 0
    liveDetectedText.value = ''

    // Concurrently start live Web Speech recognition to capture words live during recording
    if (speechRecognitionService.isWebSpeechSupported()) {
      liveDictationSession = speechRecognitionService.startLiveSystemDictation({
        onResult: (text) => {
          liveDetectedText.value = text
        },
        onError: (err) => {
          console.warn('Live speech recognition warning:', err)
        },
        onEnd: () => {},
      })
    }

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
        transcript: liveDetectedText.value || undefined,
        createdAt: new Date().toISOString(),
      }

      if (liveDetectedText.value) {
        transcriptionResult.value = liveDetectedText.value
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
  if (liveDictationSession) {
    liveDictationSession.stop()
    liveDictationSession = null
  }

  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    if (timerInterval) clearInterval(timerInterval)
  }
}

function startDirectDictation() {
  if (!speechRecognitionService.isWebSpeechSupported()) {
    alert('مرورگر شما از Web Speech API پشتیبانی نمی‌کند.')
    return
  }

  liveDetectedText.value = ''
  isDirectDictating.value = true

  liveDictationSession = speechRecognitionService.startLiveSystemDictation({
    onResult: (text) => {
      liveDetectedText.value = text
    },
    onError: (err) => {
      alert(err)
      stopDirectDictation()
    },
    onEnd: () => {
      isDirectDictating.value = false
    },
  })
}

function stopDirectDictation() {
  if (liveDictationSession) {
    liveDictationSession.stop()
    liveDictationSession = null
  }
  isDirectDictating.value = false
  if (liveDetectedText.value) {
    emit('insertToMarkdown', liveDetectedText.value)
  }
}

function removeVoice() {
  voice.value = undefined
  transcriptionResult.value = ''
  liveDetectedText.value = ''
}

async function triggerVoiceToText() {
  if (!voice.value) return

  // If already transcribed during recording, reuse it
  if (voice.value.transcript && !transcriptionResult.value) {
    transcriptionResult.value = voice.value.transcript
    return
  }

  isTranscribing.value = true
  transcriptionStatus.value = 'در حال آماده‌سازی...'
  var engine = settingsStore.settings.speechEngine

  try {
    if (engine === 'local') {
      var blob = dataUrlToBlob(voice.value.audioUrl)
      var text = await speechRecognitionService.transcribeWithLocalModel(
        blob,
        settingsStore.settings.defaultLocalModelId,
        (status) => {
          transcriptionStatus.value = status
        }
      )
      transcriptionResult.value = text
      voice.value.transcript = text
      voice.value.transcriptionEngine = 'local-whisper'
    } else {
      // System Web Speech engine operates on live microphone stream
      if (liveDetectedText.value) {
        transcriptionResult.value = liveDetectedText.value
        voice.value.transcript = liveDetectedText.value
      } else {
        alert(
          'موتور سیستمی (Web Speech API) گفتار زنده را هنگام ضبط دریافت می‌کند. برای تبدیل مستقیم فایل‌های ذخیره شده، لطفاً در بخش تنظیمات مدل محلی ویسپر را فعال یا دانلود نمایید.'
        )
      }
    }
  } catch (err: any) {
    alert('خطا در تبدیل صدا: ' + err.message)
  } finally {
    isTranscribing.value = false
    transcriptionStatus.value = ''
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
  if (liveDictationSession) liveDictationSession.stop()
  currentStream?.getTracks().forEach((t) => t.stop())
})
</script>

