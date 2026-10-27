/**
 * Cryptographic helpers using browser-native Web Crypto API.
 * Never leaks data to servers, strictly client-side.
 */

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length')
  }
  var bytes = new Uint8Array(hex.length / 2)
  for (var i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export function getRandomBytes(length: number): Uint8Array {
  var bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export async function hashSha256(data: string): Promise<string> {
  var encoder = new TextEncoder()
  var buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return bufferToHex(buffer)
}

export async function hashPasscode(passcode: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  var salt = saltHex ? hexToBuffer(saltHex) : getRandomBytes(16)
  var encoder = new TextEncoder()
  var passcodeBytes = encoder.encode(passcode)

  var keyMaterial = await crypto.subtle.importKey(
    'raw',
    passcodeBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  var derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  return {
    hash: bufferToHex(derived),
    salt: bufferToHex(salt),
  }
}

export async function verifyPasscode(passcode: string, expectedHash: string, saltHex: string): Promise<boolean> {
  try {
    var result = await hashPasscode(passcode, saltHex)
    return result.hash === expectedHash
  } catch {
    return false
  }
}

export async function deriveAesKey(password: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  var encoder = new TextEncoder()
  var keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptAesGcm(plainText: string, password: string): Promise<{
  ciphertext: string
  salt: string
  iv: string
  iterations: number
}> {
  var salt = getRandomBytes(16)
  var iv = getRandomBytes(12)
  var iterations = 100000
  var key = await deriveAesKey(password, salt, iterations)

  var encoder = new TextEncoder()
  var encodedData = encoder.encode(plainText)

  var cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  )

  return {
    ciphertext: bufferToHex(cipherBuffer),
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    iterations,
  }
}

export async function decryptAesGcm(
  ciphertextHex: string,
  password: string,
  saltHex: string,
  ivHex: string,
  iterations = 100000
): Promise<string> {
  var salt = hexToBuffer(saltHex)
  var iv = hexToBuffer(ivHex)
  var cipherBytes = hexToBuffer(ciphertextHex)
  var key = await deriveAesKey(password, salt, iterations)

  var decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    cipherBytes
  )

  var decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}
