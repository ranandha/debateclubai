// Secure local storage for API keys using IndexedDB + Web Crypto API

import { get, set, del } from 'idb-keyval'
import { AppSettings } from '@/types'

const STORAGE_KEY = 'debateai-settings-v2'
const SALT_KEY = 'debateai-salt-v2'

// Generate a cryptographic key from passphrase
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt data using AES-GCM
async function encryptData(data: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

// Decrypt data using AES-GCM
async function decryptData(encryptedData: string, passphrase: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const encrypted = combined.slice(28)

  const key = await deriveKey(passphrase, salt)

  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    throw new Error('Failed to decrypt. Wrong passphrase?')
  }
}

// Generate device-specific key (stored in IndexedDB)
async function getOrCreateDeviceKey(): Promise<string> {
  let deviceKey = await get<string>(SALT_KEY)
  if (!deviceKey) {
    deviceKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    await set(SALT_KEY, deviceKey)
  }
  return deviceKey
}

export async function saveSettings(
  settings: AppSettings,
  passphrase?: string
): Promise<void> {
  const json = JSON.stringify(settings)

  if (settings.useEncryption) {
    const key = passphrase || (await getOrCreateDeviceKey())
    const encrypted = await encryptData(json, key)
    await set(STORAGE_KEY, { encrypted: true, data: encrypted })
  } else {
    await set(STORAGE_KEY, { encrypted: false, data: json })
  }
}

export async function loadSettings(passphrase?: string): Promise<AppSettings | null> {
  const stored = await get<{ encrypted: boolean; data: string }>(STORAGE_KEY)
  if (!stored) return null

  try {
    if (stored.encrypted) {
      const key = passphrase || (await getOrCreateDeviceKey())
      const decrypted = await decryptData(stored.data, key)
      return JSON.parse(decrypted)
    } else {
      return JSON.parse(stored.data)
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    throw error
  }
}

export async function deleteSettings(): Promise<void> {
  await del(STORAGE_KEY)
  await del(SALT_KEY)
}

export function getDefaultSettings(): AppSettings {
  return {
    providers: {},
    defaultJudge: {
      provider: 'openai',
      model: 'gpt-4o-mini',
    },
    debateDefaults: {
      duration: 10,
      format: 'classic',
      judgeProvider: 'openai',
      judgeModel: 'gpt-4o-mini',
      rules: {
        maxMessageLength: 150,
        noPersonalAttacks: true,
        stayOnTopic: true,
        noFakeCitations: true,
      },
      firstTo100EndsEarly: false,
    },
    demoMode: false,
    useEncryption: false,
  }
}

// Test if we can access crypto APIs
export function isSecureStorageAvailable(): boolean {
  return typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto
}
