// Storage adapters: MemoryStore (default) and FileStore (optional)

import { DebateSession, DebateMessage, BestMessageEvent } from '@/types'

export interface StorageAdapter {
  // Sessions
  saveSession(session: DebateSession): Promise<void>
  getSession(id: string): Promise<DebateSession | null>
  getAllSessions(): Promise<DebateSession[]>
  deleteSession(id: string): Promise<void>

  // Messages
  saveMessage(message: DebateMessage): Promise<void>
  getMessages(debateId: string): Promise<DebateMessage[]>

  // Best message events
  saveBestMessageEvent(event: BestMessageEvent): Promise<void>
  getBestMessageEvents(debateId: string): Promise<BestMessageEvent[]>
}

// In-memory storage (default, resets on refresh)
class MemoryStore implements StorageAdapter {
  private sessions: Map<string, DebateSession> = new Map()
  private messages: Map<string, DebateMessage[]> = new Map()
  private bestMessageEvents: Map<string, BestMessageEvent[]> = new Map()

  async saveSession(session: DebateSession): Promise<void> {
    this.sessions.set(session.id, session)
  }

  async getSession(id: string): Promise<DebateSession | null> {
    return this.sessions.get(id) || null
  }

  async getAllSessions(): Promise<DebateSession[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.metadata.createdAt - a.metadata.createdAt
    )
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id)
    this.messages.delete(id)
    this.bestMessageEvents.delete(id)
  }

  async saveMessage(message: DebateMessage): Promise<void> {
    const messages = this.messages.get(message.debateId) || []
    messages.push(message)
    this.messages.set(message.debateId, messages)
  }

  async getMessages(debateId: string): Promise<DebateMessage[]> {
    return this.messages.get(debateId) || []
  }

  async saveBestMessageEvent(event: BestMessageEvent): Promise<void> {
    const events = this.bestMessageEvents.get(event.debateId) || []
    events.push(event)
    this.bestMessageEvents.set(event.debateId, events)
  }

  async getBestMessageEvents(debateId: string): Promise<BestMessageEvent[]> {
    return this.bestMessageEvents.get(debateId) || []
  }
}

// File-based storage (optional, for local dev only)
class FileStore implements StorageAdapter {
  private baseUrl = '/api/storage'

  async saveSession(session: DebateSession): Promise<void> {
    await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
  }

  async getSession(id: string): Promise<DebateSession | null> {
    const res = await fetch(`${this.baseUrl}/sessions/${id}`)
    if (!res.ok) return null
    return res.json()
  }

  async getAllSessions(): Promise<DebateSession[]> {
    const res = await fetch(`${this.baseUrl}/sessions`)
    if (!res.ok) return []
    return res.json()
  }

  async deleteSession(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/sessions/${id}`, { method: 'DELETE' })
  }

  async saveMessage(message: DebateMessage): Promise<void> {
    await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  }

  async getMessages(debateId: string): Promise<DebateMessage[]> {
    const res = await fetch(`${this.baseUrl}/messages/${debateId}`)
    if (!res.ok) return []
    return res.json()
  }

  async saveBestMessageEvent(event: BestMessageEvent): Promise<void> {
    await fetch(`${this.baseUrl}/best-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  }

  async getBestMessageEvents(debateId: string): Promise<BestMessageEvent[]> {
    const res = await fetch(`${this.baseUrl}/best-messages/${debateId}`)
    if (!res.ok) return []
    return res.json()
  }
}

// Singleton storage instance
let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    const useFileStore = process.env.NEXT_PUBLIC_USE_FILE_STORE === 'true'
    storageInstance = useFileStore ? new FileStore() : new MemoryStore()
  }
  return storageInstance
}

// Export helpers
export function exportDebateToJSON(session: DebateSession): string {
  return JSON.stringify(session, null, 2)
}

export function exportDebateToMarkdown(session: DebateSession): string {
  const lines: string[] = []
  lines.push(`# Debate Transcript: ${session.topic.title}`)
  if (session.topic.description) {
    lines.push('')
    lines.push(session.topic.description)
  }
  lines.push('')
  lines.push(`- Mode: ${session.mode === 'solo' ? 'Solo Panel' : 'Team Debate'}`)
  lines.push(`- Format: ${session.settings.format}`)
  lines.push(`- Duration: ${session.settings.duration} minutes`)
  lines.push('')
  lines.push('## Participants')
  session.participants.forEach((participant) => {
    const teamLabel = participant.team ? ` (Team ${participant.team})` : ''
    lines.push(`- ${participant.name}${teamLabel} — ${participant.provider}/${participant.model}`)
  })
  lines.push('')
  lines.push('## Messages')
  session.messages.forEach((message) => {
    const participant = session.participants.find((p) => p.id === message.participantId)
    const name = participant?.name || 'Unknown'
    lines.push('')
    lines.push(`### ${name}`)
    lines.push(`- Phase: ${message.phase}`)
    if (message.score) {
      lines.push(`- Score: ${message.score.total.toFixed(1)}/10`)
    }
    lines.push('')
    lines.push(message.content)
  })
  return lines.join('\n')
}

export function importDebateFromJSON(json: string): DebateSession {
  return JSON.parse(json)
}
