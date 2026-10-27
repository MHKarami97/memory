import type { MemoryPhoto } from '@/models/Memory'
import type { PhotoQuality } from '@/models/Settings'

export interface CompressionOptions {
  quality: PhotoQuality
  customMaxWidth?: number
}

export class MediaCompressionService {
  private getQualityConfig(quality: PhotoQuality): { qualityRatio: number; maxWidth: number } {
    switch (quality) {
      case 'high':
        return { qualityRatio: 0.85, maxWidth: 1920 }
      case 'low':
        return { qualityRatio: 0.55, maxWidth: 1024 }
      case 'medium':
      default:
        return { qualityRatio: 0.72, maxWidth: 1440 }
    }
  }

  async compressImage(file: File, options: CompressionOptions): Promise<MemoryPhoto> {
    var originalSize = file.size
    var config = this.getQualityConfig(options.quality)
    var maxWidth = options.customMaxWidth || config.maxWidth

    var image = await this.loadImage(file)
    var origWidth = image.naturalWidth || image.width
    var origHeight = image.naturalHeight || image.height

    // Main compressed version
    var { width: compWidth, height: compHeight } = this.calculateDimensions(origWidth, origHeight, maxWidth)
    var compressedDataUrl = await this.renderToDataUrl(image, compWidth, compHeight, config.qualityRatio)
    var compressedSize = this.estimateDataUrlByteSize(compressedDataUrl)

    // Thumbnail version (max 260px)
    var { width: thumbWidth, height: thumbHeight } = this.calculateDimensions(origWidth, origHeight, 260)
    var thumbnailUrl = await this.renderToDataUrl(image, thumbWidth, thumbHeight, 0.6)

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: file.name,
      originalSize,
      compressedSize,
      thumbnailUrl,
      dataUrl: compressedDataUrl,
      width: compWidth,
      height: compHeight,
      createdAt: new Date().toISOString(),
    }
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      var reader = new FileReader()
      reader.onload = (e) => {
        var img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('خطا در بارگذاری تصویر'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر'))
      reader.readAsDataURL(file)
    })
  }

  private calculateDimensions(width: number, height: number, maxDimension: number): { width: number; height: number } {
    if (width <= maxDimension && height <= maxDimension) {
      return { width, height }
    }
    if (width > height) {
      return {
        width: maxDimension,
        height: Math.round((height * maxDimension) / width),
      }
    } else {
      return {
        width: Math.round((width * maxDimension) / height),
        height: maxDimension,
      }
    }
  }

  private renderToDataUrl(img: HTMLImageElement, width: number, height: number, quality: number): Promise<string> {
    return new Promise((resolve) => {
      var canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      var ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
      }
      // Prefer image/webp if supported, else fallback to image/jpeg
      try {
        var dataUrl = canvas.toDataURL('image/webp', quality)
        if (dataUrl.startsWith('data:image/webp')) {
          resolve(dataUrl)
          return
        }
      } catch {
        // Fallback
      }
      resolve(canvas.toDataURL('image/jpeg', quality))
    })
  }

  private estimateDataUrlByteSize(dataUrl: string): number {
    var base64 = dataUrl.split(',')[1] || ''
    return Math.round((base64.length * 3) / 4)
  }
}

export const mediaCompressionService = new MediaCompressionService()
