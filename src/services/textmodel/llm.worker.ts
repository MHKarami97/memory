import type {
  GenerateRequest,
  LoadRequest,
  ModelAttempt,
  TextModelRequest,
  TextModelResponse,
} from '@/services/textmodel/textModelProtocol'

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<TextModelRequest>) => void) | null
  postMessage(message: TextModelResponse): void
}

var generator: any = null

async function loadModel(request: LoadRequest): Promise<ModelAttempt> {
  var { pipeline, env } = await import('@huggingface/transformers')

  env.allowLocalModels = false
  env.useBrowserCache = true
  // After the download step the weights are read from the browser cache only; no request can leave the device.
  env.allowRemoteModels = request.allowRemote

  var lastError: unknown = null
  for (var attempt of request.attempts) {
    if (attempt.device === 'webgpu' && !('gpu' in navigator)) continue

    try {
      generator = await pipeline('text-generation', request.repo, {
        device: attempt.device,
        dtype: attempt.dtype as any,
        progress_callback: createProgressReporter(request.id),
      } as any)
      return attempt
    } catch (error) {
      lastError = error
    }
  }
  throw lastError ?? new Error('هیچ‌کدام از حالت‌های اجرای مدل روی این دستگاه در دسترس نیست.')
}

function createProgressReporter(id: number): (item: any) => void {
  var files: Record<string, { loaded: number; total: number }> = {}

  return (item) => {
    if (!item || item.status !== 'progress' || !item.file) return

    files[item.file] = { loaded: item.loaded || 0, total: item.total || 0 }
    var loaded = 0
    var total = 0
    for (var file in files) {
      loaded += files[file].loaded
      total += files[file].total
    }
    var percent = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0
    scope.postMessage({ id, kind: 'progress', data: { percent, loadedBytes: loaded, totalBytes: total, file: item.file } })
  }
}

async function generate(request: GenerateRequest): Promise<string> {
  if (!generator) throw new Error('مدل هنوز بارگذاری نشده است.')

  var output = await generator(request.messages, { max_new_tokens: request.maxNewTokens, do_sample: false })
  var generated = output?.[0]?.generated_text
  if (Array.isArray(generated)) return String(generated[generated.length - 1]?.content ?? '')
  return String(generated ?? '')
}

scope.onmessage = async (event) => {
  var request = event.data
  try {
    var data = request.type === 'load' ? await loadModel(request) : await generate(request)
    scope.postMessage({ id: request.id, kind: 'result', data })
  } catch (error) {
    scope.postMessage({
      id: request.id,
      kind: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
