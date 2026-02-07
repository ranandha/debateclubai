// Core types for DebateClubAI v2

export type AIProvider = 'openai' | 'gemini' | 'mistral' | 'xai' | 'deepseek'

export type DebatePhase = 'opening' | 'rebuttals' | 'cross-exam' | 'closing' | 'finished'

export type Team = 'A' | 'B'

export type DebateMode = 'team' | 'solo'

export type RoleStyle = 'aggressive' | 'analytical' | 'diplomatic' | 'passionate'

export interface Participant {
  id: string
  name: string
  team: Team | null
  provider: AIProvider
  model: string
  roleStyle: RoleStyle
  temperature: number
  color: string
}

export interface DebateTopic {
  id: string
  title: string
  description?: string
}

export interface DebateRules {
  maxMessageLength: number // 120-180 words
  noPersonalAttacks: boolean
  stayOnTopic: boolean
  noFakeCitations: boolean
}

export interface DebateSettings {
  duration: number // minutes
  format: 'classic' | 'fast' | 'freeform'
  judgeProvider: AIProvider
  judgeModel: string
  rules: DebateRules
  firstTo100EndsEarly: boolean
}

export interface RaiseHandIntent {
  participantId: string
  timestamp: number
  intent: 'respond' | 'question' | 'clarify' | 'challenge'
  priority: number
}

export interface MessageScore {
  total: number // 0-10
  argumentQuality: number // 0-4
  relevance: number // 0-2
  evidence: number // 0-2
  clarity: number // 0-2
  rationale: string
}

export interface DebateMessage {
  id: string
  debateId: string
  participantId: string
  content: string
  timestamp: number
  phase: DebatePhase
  score?: MessageScore
  isBestMessage?: boolean
  bestMessageRank?: number
}

export interface ParticipantProgress {
  participantId: string
  points: number
  messagesCount: number
  bestMessagesCount: number
  avgScore: number
  lastSpeakTime?: number
}

export interface BestMessageEvent {
  id: string
  debateId: string
  messageId: string
  participantId: string
  timestamp: number
  batchNumber: number
}

export interface DebateSession {
  id: string
  topic: DebateTopic
  mode: DebateMode
  settings: DebateSettings
  participants: Participant[]
  startTime: number
  endTime?: number
  currentPhase: DebatePhase
  phaseStartTime: number
  status: 'setup' | 'active' | 'paused' | 'finished'
  winner?: {
    team?: Team
    participantId?: string
    participants: string[]
    finalScore: number
  }
  raiseHandQueue: RaiseHandIntent[]
  progress: ParticipantProgress[]
  messages: DebateMessage[]
  bestMessageEvents: BestMessageEvent[]
  metadata: {
    createdAt: number
    updatedAt: number
  }
}

export interface AppSettings {
  providers: {
    openai?: { apiKey: string; defaultModel: string }
    gemini?: { apiKey: string; defaultModel: string }
    mistral?: { apiKey: string; defaultModel: string }
    xai?: { apiKey: string; defaultModel: string }
    deepseek?: { apiKey: string; defaultModel: string }
  }
  defaultJudge: {
    provider: AIProvider
    model: string
  }
  debateDefaults: DebateSettings
  demoMode: boolean
  useEncryption: boolean
  encryptionPassphrase?: string
}

export interface ProviderTestResult {
  provider: AIProvider
  success: boolean
  message: string
  latency?: number
}

// Statistics
export interface DashboardStats {
  totalDebates: number
  totalMessages: number
  avgDebateDuration: number
  winsByTeam: { A: number; B: number }
  topParticipants: Array<{
    name: string
    wins: number
    avgScore: number
  }>
}
