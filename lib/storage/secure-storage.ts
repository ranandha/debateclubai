// Secure local storage for API keys using IndexedDB

import { get, set, del } from 'idb-keyval'
import { AppSettings } from '@/types'

const STORAGE_KEY = 'debateai-settings-v2'

export async function saveSettings(settings: AppSettings): Promise<void> {
  const json = JSON.stringify(settings)
  await set(STORAGE_KEY, json)
}

export async function loadSettings(): Promise<AppSettings | null> {
  const stored = await get<string>(STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load settings:', error)
    return null
  }
}

export async function deleteSettings(): Promise<void> {
  await del(STORAGE_KEY)
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
  }
}
