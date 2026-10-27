import {
  hashPasscode,
  verifyPasscode,
  encryptAesGcm,
  decryptAesGcm,
  hashSha256,
} from '@/utils/crypto'

export class EncryptionService {
  async hashUserPasscode(passcode: string): Promise<{ hash: string; salt: string }> {
    return hashPasscode(passcode)
  }

  async verifyUserPasscode(passcode: string, storedHash: string, storedSalt: string): Promise<boolean> {
    return verifyPasscode(passcode, storedHash, storedSalt)
  }

  async encryptData(dataString: string, secretKey: string) {
    return encryptAesGcm(dataString, secretKey)
  }

  async decryptData(ciphertext: string, secretKey: string, salt: string, iv: string, iterations?: number): Promise<string> {
    return decryptAesGcm(ciphertext, secretKey, salt, iv, iterations)
  }

  async calculateChecksum(content: string): Promise<string> {
    return hashSha256(content)
  }
}

export const encryptionService = new EncryptionService()
