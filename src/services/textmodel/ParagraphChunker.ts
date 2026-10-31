export interface TextChunk {
  text: string
  isCorrectable: boolean
}

export class ParagraphChunker {
  private static readonly PERSIAN_LETTER = /[\u0621-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]/

  private readonly maxChars: number

  constructor(maxChars: number = 450) {
    this.maxChars = maxChars
  }

  split(text: string): TextChunk[] {
    var chunks: TextChunk[] = []
    var parts = text.split(/(\n{2,})/)

    for (var part of parts) {
      if (part === '') continue
      if (/^\n+$/.test(part) || !this.isCorrectable(part)) {
        chunks.push({ text: part, isCorrectable: false })
        continue
      }
      this.splitLongParagraph(part).forEach((piece) => chunks.push(piece))
    }
    return chunks
  }

  private isCorrectable(paragraph: string): boolean {
    if (paragraph.includes('```')) return false
    return ParagraphChunker.PERSIAN_LETTER.test(paragraph)
  }

  private splitLongParagraph(paragraph: string): TextChunk[] {
    if (paragraph.length <= this.maxChars) return [{ text: paragraph, isCorrectable: true }]

    var pieces = paragraph.split(/([.!؟?۔]+\s+|\n)/)
    var result: TextChunk[] = []
    var buffer = ''

    for (var piece of pieces) {
      if (buffer.length + piece.length > this.maxChars && buffer) {
        result.push({ text: buffer, isCorrectable: this.isCorrectable(buffer) })
        buffer = ''
      }
      buffer += piece
    }
    if (buffer) result.push({ text: buffer, isCorrectable: this.isCorrectable(buffer) })
    return result
  }
}
