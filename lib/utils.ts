import { type ClassValue, clsx } from 'clsx'
import { DebateSession } from '@/types'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function formatTimeRemaining(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    opening: 'Opening Arguments',
    rebuttals: 'Rebuttals',
    'cross-exam': 'Cross-Examination',
    closing: 'Closing Statements',
    finished: 'Debate Finished',
  }
  return labels[phase] || phase
}

export function getTeamColor(team: 'A' | 'B' | null | undefined): string {
  if (!team) return 'text-slate-600 bg-slate-100'
  return team === 'A' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'
}

export function getProviderName(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    mistral: 'Mistral AI',
    xai: 'xAI (Grok)',
    deepseek: 'DeepSeek',
  }
  return names[provider] || provider
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    openai: 'bg-emerald-500',
    gemini: 'bg-blue-500',
    mistral: 'bg-orange-500',
    xai: 'bg-gray-800',
    deepseek: 'bg-indigo-500',
  }
  return colors[provider] || 'bg-gray-500'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

export function sortByScore<T extends { score?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.score || 0) - (a.score || 0))
}

export function buildShareableSummary(session: DebateSession): string {
  const modeLabel = session.mode === 'solo' ? 'Solo Panel' : 'Team Debate'
  const leader = session.mode === 'solo'
    ? session.progress
        .map((progress) => ({
          progress,
          participant: session.participants.find((p) => p.id === progress.participantId),
        }))
        .sort((a, b) => b.progress.points - a.progress.points)[0]
    : null

  const teamScores = session.mode === 'team'
    ? {
        A: session.progress
          .filter((p) => session.participants.find((pt) => pt.id === p.participantId)?.team === 'A')
          .reduce((sum, p) => sum + p.points, 0),
        B: session.progress
          .filter((p) => session.participants.find((pt) => pt.id === p.participantId)?.team === 'B')
          .reduce((sum, p) => sum + p.points, 0),
      }
    : null

  const topMessages = session.messages
    .filter((message) => message.score)
    .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0))
    .slice(0, 3)

  const lines: string[] = []
  lines.push(`Topic: ${session.topic.title}`)
  if (session.topic.description) {
    lines.push(`Context: ${session.topic.description}`)
  }
  lines.push(`Mode: ${modeLabel}`)
  if (session.mode === 'team' && teamScores) {
    const winner = teamScores.A === teamScores.B ? 'Tie' : teamScores.A > teamScores.B ? 'Team A' : 'Team B'
    lines.push(`Winner: ${winner} (${teamScores.A} - ${teamScores.B})`)
  }
  if (session.mode === 'solo' && leader?.participant) {
    lines.push(
      `Leader: ${leader.participant.name} (${leader.progress.points} pts, Avg ${leader.progress.avgScore.toFixed(1)})`
    )
  }
  if (topMessages.length > 0) {
    lines.push('Highlights:')
    topMessages.forEach((message) => {
      const participant = session.participants.find((p) => p.id === message.participantId)
      const content = message.content.length > 140 ? `${message.content.slice(0, 140)}...` : message.content
      lines.push(`- ${participant?.name || 'Unknown'}: ${content}`)
    })
  }
  return lines.join('\n')
}
