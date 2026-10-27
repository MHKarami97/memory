import { bufferToHex, getRandomBytes } from '@/utils/crypto'

export class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) return false
    try {
      var isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return isAvailable
    } catch {
      return false
    }
  }

  async registerBiometric(): Promise<{ credentialId: string }> {
    if (!window.PublicKeyCredential) {
      throw new Error('دستگاه یا مرورگر شما از قابلیت ورود بیومتریک پشتیبانی نمی‌کند.')
    }

    var challenge = getRandomBytes(32)
    var userId = getRandomBytes(16)

    var createOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge as unknown as BufferSource,
      rp: {
        name: 'خاطره‌نامه',
        id: window.location.hostname,
      },
      user: {
        id: userId as unknown as BufferSource,
        name: 'user@khatereh',
        displayName: 'کاربر خاطره‌نامه',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
    }

    var credential = (await navigator.credentials.create({
      publicKey: createOptions,
    })) as PublicKeyCredential

    if (!credential) {
      throw new Error('احراز هویت بیومتریک لغو شد.')
    }

    return {
      credentialId: bufferToHex(credential.rawId),
    }
  }

  async verifyBiometric(credentialIdHex?: string): Promise<boolean> {
    if (!window.PublicKeyCredential) return false

    try {
      var challenge = getRandomBytes(32)
      var getOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge as unknown as BufferSource,
        userVerification: 'required',
        timeout: 60000,
      }

      if (credentialIdHex) {
        // Hex to Uint8Array
        var bytes = new Uint8Array(credentialIdHex.length / 2)
        for (var i = 0; i < credentialIdHex.length; i += 2) {
          bytes[i / 2] = parseInt(credentialIdHex.substring(i, i + 2), 16)
        }
        getOptions.allowCredentials = [
          {
            id: bytes as unknown as BufferSource,
            type: 'public-key',
            transports: ['internal'],
          },
        ]
      }

      var assertion = await navigator.credentials.get({
        publicKey: getOptions,
      })

      return !!assertion
    } catch (err: any) {
      console.warn('Biometric verification failed or cancelled:', err)
      return false
    }
  }
}

export const biometricService = new BiometricService()
