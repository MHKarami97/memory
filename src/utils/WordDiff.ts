export type DiffKind = 'same' | 'added' | 'removed'

export interface DiffSegment {
  kind: DiffKind
  text: string
}

export class WordDiff {
  private static readonly MAX_MATRIX_CELLS = 2_500_000

  static compute(before: string, after: string): DiffSegment[] {
    if (before === after) return before ? [{ kind: 'same', text: before }] : []

    var left = before.split(/(\s+)/).filter((token) => token !== '')
    var right = after.split(/(\s+)/).filter((token) => token !== '')

    var prefix = 0
    while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix++

    var suffix = 0
    while (
      suffix < left.length - prefix &&
      suffix < right.length - prefix &&
      left[left.length - 1 - suffix] === right[right.length - 1 - suffix]
    ) {
      suffix++
    }

    var leftMiddle = left.slice(prefix, left.length - suffix)
    var rightMiddle = right.slice(prefix, right.length - suffix)

    var segments: DiffSegment[] = []
    WordDiff.push(segments, 'same', left.slice(0, prefix).join(''))
    for (var segment of WordDiff.diffMiddle(leftMiddle, rightMiddle)) {
      WordDiff.push(segments, segment.kind, segment.text)
    }
    WordDiff.push(segments, 'same', left.slice(left.length - suffix).join(''))
    return segments
  }

  private static diffMiddle(left: string[], right: string[]): DiffSegment[] {
    if (left.length === 0 || right.length === 0 || left.length * right.length > WordDiff.MAX_MATRIX_CELLS) {
      return [
        { kind: 'removed', text: left.join('') },
        { kind: 'added', text: right.join('') },
      ]
    }

    var width = right.length + 1
    var table = new Uint32Array((left.length + 1) * width)

    for (var i = left.length - 1; i >= 0; i--) {
      for (var j = right.length - 1; j >= 0; j--) {
        table[i * width + j] =
          left[i] === right[j]
            ? table[(i + 1) * width + j + 1] + 1
            : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
      }
    }

    var result: DiffSegment[] = []
    var x = 0
    var y = 0
    while (x < left.length && y < right.length) {
      if (left[x] === right[y]) {
        result.push({ kind: 'same', text: left[x] })
        x++
        y++
      } else if (table[(x + 1) * width + y] >= table[x * width + y + 1]) {
        result.push({ kind: 'removed', text: left[x++] })
      } else {
        result.push({ kind: 'added', text: right[y++] })
      }
    }
    while (x < left.length) result.push({ kind: 'removed', text: left[x++] })
    while (y < right.length) result.push({ kind: 'added', text: right[y++] })
    return result
  }

  private static push(target: DiffSegment[], kind: DiffKind, text: string): void {
    if (!text) return
    var last = target[target.length - 1]
    if (last && last.kind === kind) {
      last.text += text
    } else {
      target.push({ kind, text })
    }
  }
}
