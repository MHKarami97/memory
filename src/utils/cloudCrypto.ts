import { bufferToHex, getRandomBytes, hexToBuffer, deriveAesKey } from '@/utils/crypto'

export function bufferFromHex(hex: string): Uint8Array {
  return hexToBuffer(hex)
}

export function newSaltHex(): string {
  return bufferToHex(getRandomBytes(16))
}

export function deriveKey(passphrase: string, saltHex: string, iterations: number): Promise<CryptoKey> {
  return deriveAesKey(passphrase, hexToBuffer(saltHex), iterations)
}

export async function encryptWithKey(plainText: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  var iv = getRandomBytes(12)
  var data = new TextEncoder().encode(plainText)
  var cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    data as unknown as BufferSource
  )
  return { ciphertext: bufferToHex(cipher), iv: bufferToHex(iv) }
}

export async function decryptWithKey(ciphertextHex: string, ivHex: string, key: CryptoKey): Promise<string> {
  var plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBuffer(ivHex) as unknown as BufferSource },
    key,
    hexToBuffer(ciphertextHex) as unknown as BufferSource
  )
  return new TextDecoder().decode(plain)
}

// Deterministic JSON (sorted keys) so equal data always yields an equal hash across devices.
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return '[' + value.map((item) => stableStringify(item)).join(',') + ']'
  var record = value as Record<string, unknown>
  var parts: string[] = []
  for (var key of Object.keys(record).sort()) {
    if (record[key] === undefined) continue
    parts.push(JSON.stringify(key) + ':' + stableStringify(record[key]))
  }
  return '{' + parts.join(',') + '}'
}
