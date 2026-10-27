import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Memory } from '@/models/Memory'
import { formatJalaliFull } from '@/utils/jalali'
import { toPersianDigits } from '@/utils/format'
import { renderMarkdownToHtml } from '@/utils/sanitize'

export interface PdfExportOptions {
  includePhotos: boolean
}

export class PdfExportService {
  async exportMemoryToPdf(memory: Memory, options: PdfExportOptions): Promise<Blob> {
    // Construct an offscreen HTML container for pixel-perfect Persian RTL PDF rendering
    var container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '750px'
    container.style.padding = '40px'
    container.style.backgroundColor = '#ffffff'
    container.style.color = '#0f172a'
    container.style.fontFamily = 'Vazirmatn, system-ui, sans-serif'
    container.style.direction = 'rtl'
    container.style.textAlign = 'right'
    container.style.boxSizing = 'border-box'

    var jalaliDate = formatJalaliFull(memory.date)
    var timeFormatted = toPersianDigits(memory.time)

    var tagsHtml = (memory.tags || [])
      .map(
        (t) =>
          `<span style="display:inline-block; background:#e0e7ff; color:#3730a3; padding:4px 10px; border-radius:9999px; font-size:12px; margin-left:6px; margin-bottom:6px;">#${t}</span>`
      )
      .join(' ')

    var peopleHtml = (memory.people || [])
      .map(
        (p) =>
          `<span style="display:inline-block; background:#fef3c7; color:#92400e; padding:4px 10px; border-radius:9999px; font-size:12px; margin-left:6px; margin-bottom:6px;">👤 ${p}</span>`
      )
      .join(' ')

    var photosHtml = ''
    if (options.includePhotos && memory.photos && memory.photos.length > 0) {
      var photoItems = memory.photos
        .map(
          (ph) =>
            `<div style="flex:1 1 45%; max-width:48%; margin-bottom:12px; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">
              <img src="${ph.dataUrl || ph.thumbnailUrl}" style="width:100%; height:auto; display:block; object-fit:cover;" />
            </div>`
        )
        .join('')
      photosHtml = `
        <div style="margin-top:24px; border-top:1px dashed #cbd5e1; padding-top:16px;">
          <h4 style="font-size:15px; font-weight:bold; color:#475569; margin-bottom:12px;">تصاویر خاطره:</h4>
          <div style="display:flex; flex-wrap:wrap; gap:12px;">
            ${photoItems}
          </div>
        </div>
      `
    }

    var locationHtml = memory.location
      ? `<div style="font-size:13px; color:#64748b; margin-top:6px;">📍 مکان: ${memory.location}</div>`
      : ''

    var renderedMarkdown = renderMarkdownToHtml(memory.content)

    container.innerHTML = `
      <div style="border-bottom:2px solid #4f46e5; padding-bottom:16px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:13px; color:#4f46e5; font-weight:bold;">خاطره‌نامه</span>
          <span style="font-size:13px; color:#64748b;">${jalaliDate} ${timeFormatted ? '• ساعت ' + timeFormatted : ''}</span>
        </div>
        <h1 style="font-size:24px; font-weight:800; color:#1e1b4b; margin:8px 0;">${memory.title || 'خاطره بدون عنوان'}</h1>
        ${locationHtml}
        ${tagsHtml || peopleHtml ? `<div style="margin-top:12px;">${tagsHtml} ${peopleHtml}</div>` : ''}
      </div>

      <div style="font-size:15px; line-height:1.9; color:#1e293b; min-height:120px;">
        ${renderedMarkdown}
      </div>

      ${photosHtml}

      <div style="margin-top:40px; padding-top:12px; border-top:1px solid #f1f5f9; text-align:center; font-size:11px; color:#94a3b8;">
        ثبت شده در خاطره‌نامه • ذخیره کاملاً امن و محرمانه سمت کاربر
      </div>
    `

    document.body.appendChild(container)

    try {
      var canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      var imgData = canvas.toDataURL('image/jpeg', 0.95)
      var pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      var pdfWidth = pdf.internal.pageSize.getWidth()
      var pdfHeight = pdf.internal.pageSize.getHeight()
      var imgWidth = pdfWidth
      var imgHeight = (canvas.height * imgWidth) / canvas.width

      var heightLeft = imgHeight
      var position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      return pdf.output('blob')
    } finally {
      document.body.removeChild(container)
    }
  }

  async shareOrDownloadPdf(pdfBlob: Blob, filename: string): Promise<boolean> {
    var file = new File([pdfBlob], filename, { type: 'application/pdf' })

    // Check if Web Share API with files is supported
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: filename,
          text: 'خاطره از اپلیکیشن خاطره‌نامه',
        })
        return true
      } catch (err: any) {
        if (err.name === 'AbortError') return true // User cancelled
      }
    }

    // Fallback: direct browser download
    var url = URL.createObjectURL(pdfBlob)
    var a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return false
  }
}

export const pdfExportService = new PdfExportService()
