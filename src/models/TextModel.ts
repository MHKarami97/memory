export type TextModelDtype = 'q4f16' | 'q4' | 'q8' | 'fp16' | 'fp32'

export interface LocalTextModel {
  id: string
  name: string
  family: string
  description: string
  approxSizeMb: number
  speedRating: 'سریع' | 'متوسط' | 'آرام'
  persianSupport: string
  ramUsageMb: number
  recommendedFor: string
  huggingFaceRepo: string
  supportsThinkingSwitch: boolean
  webGpuDtypes: TextModelDtype[]
  wasmDtypes: TextModelDtype[]
  isDownloaded: boolean
  downloadStatus?: 'idle' | 'downloading' | 'ready' | 'error'
  variant?: string // "device:dtype" that was cached on download
}

export const AVAILABLE_TEXT_MODELS: LocalTextModel[] = [
  {
    id: 'qwen3-0.6b',
    name: 'کوئن ۳ (Qwen3 0.6B)',
    family: 'Qwen3',
    description:
      'مدل زبانی کوچک با پشتیبانی رسمی از زبان فارسی (جزو ۱۱۹ زبان Qwen3). برای غلط‌گیری املایی و نگارشی جمله‌به‌جمله استفاده می‌شود و خروجی آن قبل از پیشنهاد اعتبارسنجی می‌شود.',
    approxSizeMb: 500,
    speedRating: 'متوسط',
    persianSupport: 'پشتیبانی رسمی، کیفیت متوسط',
    ramUsageMb: 1200,
    recommendedFor: 'گوشی‌های جدید و لپ‌تاپ',
    huggingFaceRepo: 'onnx-community/Qwen3-0.6B-ONNX',
    supportsThinkingSwitch: true,
    webGpuDtypes: ['q4f16', 'q4', 'fp16'],
    wasmDtypes: ['q4', 'q8', 'fp32'],
    isDownloaded: false,
    downloadStatus: 'idle',
  },
  {
    id: 'gemma3-270m',
    name: 'جما ۳ (Gemma 3 270M)',
    family: 'Gemma 3',
    description:
      'سبک‌ترین گزینه با پشتیبانی چندزبانه (بیش از ۱۴۰ زبان). سریع است اما در متن‌های طولانی یا پیچیده بیشتر پیشنهادهای رد‌شده تولید می‌کند.',
    approxSizeMb: 300,
    speedRating: 'سریع',
    persianSupport: 'چندزبانه، کیفیت پایین‌تر',
    ramUsageMb: 700,
    recommendedFor: 'گوشی‌های ضعیف‌تر',
    huggingFaceRepo: 'onnx-community/gemma-3-270m-it-ONNX',
    supportsThinkingSwitch: false,
    webGpuDtypes: ['q4f16', 'q4', 'fp32'],
    wasmDtypes: ['q4', 'q8', 'fp32'],
    isDownloaded: false,
    downloadStatus: 'idle',
  },
]
