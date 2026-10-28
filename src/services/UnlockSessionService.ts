export class UnlockSessionService {
  private readonly storageKey = 'khatereh-unlock-session'

  constructor(private readonly storageProvider: () => Storage = () => window.sessionStorage) {}

  isActive(): boolean {
    try {
      return this.storageProvider().getItem(this.storageKey) === '1'
    } catch {
      return false
    }
  }

  start(): void {
    try {
      this.storageProvider().setItem(this.storageKey, '1')
    } catch {
      // Storage may be unavailable (private mode); the app simply locks on refresh.
    }
  }

  end(): void {
    try {
      this.storageProvider().removeItem(this.storageKey)
    } catch {
      // Nothing to clean up.
    }
  }
}

export const unlockSessionService = new UnlockSessionService()
