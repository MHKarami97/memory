export interface LocalSpeechModel {
  id: string
  name: string
  family: string // e.g. 'Whisper'
  description: string
  approxSizeMb: number
  speedRating: 'خیلی سریع' | 'سریع' | 'متوسط' | 'آرام'
  qualityRating: 'خوب' | 'خیلی خوب' | 'عالی'
  ramUsageMb: number
  recommendedFor: 'موبایل و پردازنده‌های سبک' | 'تبلت و لپ‌تاپ معمولی' | 'دسکتاپ قوی'
  isDownloaded: boolean
  downloadProgress?: number // 0-100
  downloadStatus?: 'idle' | 'downloading' | 'ready' | 'error'
  errorMessage?: string
  huggingFaceRepo?: string
}

export const AVAILABLE_SPEECH_MODELS: LocalSpeechModel[] = [
  {
    id: 'whisper-tiny-fa',
    name: 'ویسپر کوچک (Whisper Tiny - FA)',
    family: 'Whisper',
    description: 'مدل فشرده و سبک، بهینه‌شده برای مرورگر و دستگاه‌های همراه. سرعت بالا و مصرف حداقل حافظه با دقت قابل قبول برای یادداشت‌برداری روزانه.',
    approxSizeMb: 75,
    speedRating: 'خیلی سریع',
    qualityRating: 'خوب',
    ramUsageMb: 250,
    recommendedFor: 'موبایل و پردازنده‌های سبک',
    isDownloaded: false,
    downloadStatus: 'idle',
    huggingFaceRepo: 'onnx-community/whisper-tiny',
  },
  {
    id: 'whisper-base-fa',
    name: 'ویسپر استاندارد (Whisper Base - FA)',
    family: 'Whisper',
    description: 'تعادل ایده‌آل میان دقت واژگان فارسی و سرعت پردازش. مناسب برای تبلت‌ها و لپ‌تاپ‌های مدرن با پشتیبانی از جملات محاوره‌ای.',
    approxSizeMb: 145,
    speedRating: 'سریع',
    qualityRating: 'خیلی خوب',
    ramUsageMb: 500,
    recommendedFor: 'تبلت و لپ‌تاپ معمولی',
    isDownloaded: false,
    downloadStatus: 'idle',
    huggingFaceRepo: 'onnx-community/whisper-base',
  },
  {
    id: 'whisper-small-fa',
    name: 'ویسپر پیشرفته (Whisper Small - FA)',
    family: 'Whisper',
    description: 'بالاترین دقت در تشخیص کلمات پیچیده، اصطلاحات ادبی و پس‌زمینه‌های صوتی شلوغ. نیازمند رم و پردازنده قدرتمندتر روی سیستم‌های دسکتاپ.',
    approxSizeMb: 460,
    speedRating: 'متوسط',
    qualityRating: 'عالی',
    ramUsageMb: 1200,
    recommendedFor: 'دسکتاپ قوی',
    isDownloaded: false,
    downloadStatus: 'idle',
    huggingFaceRepo: 'onnx-community/whisper-small',
  },
]
