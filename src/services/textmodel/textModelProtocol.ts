export interface ModelAttempt {
  device: 'webgpu' | 'wasm'
  dtype: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LoadRequest {
  id: number
  type: 'load'
  repo: string
  attempts: ModelAttempt[]
  allowRemote: boolean
}

export interface GenerateRequest {
  id: number
  type: 'generate'
  messages: ChatMessage[]
  maxNewTokens: number
}

export type TextModelRequest = LoadRequest | GenerateRequest

export interface DownloadProgress {
  percent: number
  loadedBytes: number
  totalBytes: number
  file?: string
}

export type TextModelResponse =
  | { id: number; kind: 'progress'; data: DownloadProgress }
  | { id: number; kind: 'result'; data: unknown }
  | { id: number; kind: 'error'; message: string }
