'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  Square,
  MessageSquare,
  Clock,
  Trophy,
  ArrowLeft,
  Download,
  FileText,
  Copy,
} from 'lucide-react'
import Link from 'next/link'
import { DebateSession, DebateMessage, Participant } from '@/types'
import { getStorage, exportDebateToJSON, exportDebateToMarkdown } from '@/lib/storage/debate-storage'
import {
  formatTimeRemaining,
  getPhaseLabel,
  getTeamColor,
  getProviderColor,
  buildShareableSummary,
} from '@/lib/utils'
import { PHASE_DURATIONS } from '@/lib/constants'
import { loadSettings } from '@/lib/storage/secure-storage'

export default function LiveDebatePage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<DebateSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [autoUpdate, setAutoUpdate] = useState(true)
  const isEndingRef = useRef(false)
  const isTickingRef = useRef(false)

  useEffect(() => {
    loadSession()
  }, [params.id])

  useEffect(() => {
    if (!session || !autoUpdate || session.status !== 'active') return

    const interval = setInterval(() => {
      tickDebate()
    }, 2000) // Tick every 2 seconds

    return () => clearInterval(interval)
  }, [session, autoUpdate])

  useEffect(() => {
    if (!session || session.status !== 'active') return

    const updateRemaining = () => {
      const elapsed = Date.now() - session.startTime
      const totalDuration = session.settings.duration * 60 * 1000
      setTimeRemaining(Math.max(0, totalDuration - elapsed))
    }

    updateRemaining()
    const timer = setInterval(updateRemaining, 1000)

    return () => clearInterval(timer)
  }, [session])

  useEffect(() => {
    if (!session || session.status !== 'active') return
    const totalDuration = session.settings.duration * 60 * 1000
    const elapsed = Date.now() - session.startTime
    if (elapsed < totalDuration) return
    if (isEndingRef.current) return
    isEndingRef.current = true
    endDebate()
  }, [timeRemaining, session])

  function normalizeContent(content: string) {
    return content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function contentSimilarity(a: string, b: string) {
    const aWords = new Set(normalizeContent(a).split(' ').filter((w) => w.length >= 4))
    const bWords = new Set(normalizeContent(b).split(' ').filter((w) => w.length >= 4))
    if (aWords.size === 0 || bWords.size === 0) return 0
    let intersection = 0
    for (const word of aWords) {
      if (bWords.has(word)) intersection++
    }
    const union = aWords.size + bWords.size - intersection
    return union === 0 ? 0 : intersection / union
  }

  function isDuplicateMessage(candidate: string, recent: string[]) {
    const normalizedCandidate = normalizeContent(candidate)
    return recent.some((message) => {
      const normalizedMessage = normalizeContent(message)
      if (!normalizedMessage) return false
      if (normalizedCandidate === normalizedMessage) return true
      return contentSimilarity(candidate, message) >= 0.65
    })
  }

  function splitSentences(text: string) {
    return text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
  }

  function getKeySentence(content: string) {
    const sentences = splitSentences(content)
    if (sentences.length === 0) return { key: '', rest: content }
    if (sentences.length === 1) return { key: sentences[0], rest: '' }

    let best = sentences[0]
    let bestScore = 0
    for (const sentence of sentences) {
      const wordCount = sentence.split(' ').length
      const score = Math.min(wordCount, 40) + Math.min(sentence.length / 10, 10)
      if (score > bestScore) {
        bestScore = score
        best = sentence
      }
    }

    const rest = sentences.filter((sentence) => sentence !== best).join(' ')
    return { key: best, rest }
  }

  async function loadSession() {
    const storage = getStorage()
    const loaded = await storage.getSession(params.id as string)
    if (loaded) {
      setSession({
        ...loaded,
        mode: loaded.mode || 'team',
      })
    }
    setLoading(false)
  }

  async function tickDebate() {
    if (!session || isTickingRef.current) return
    isTickingRef.current = true

    try {
      // Check for phase transition
      const now = Date.now()
      const phaseStartTime = session.phaseStartTime || session.startTime
      const elapsed = now - phaseStartTime
      const phaseDurations = PHASE_DURATIONS[session.settings.format]
      const phases = Object.keys(phaseDurations)
      const currentPhaseIndex = phases.indexOf(session.currentPhase)
      
      if (currentPhaseIndex >= 0 && currentPhaseIndex < phases.length) {
        const currentPhaseDuration = phaseDurations[session.currentPhase]
        
        if (elapsed >= currentPhaseDuration) {
          const nextPhaseIndex = currentPhaseIndex + 1
          if (nextPhaseIndex < phases.length) {
            // Transition to next phase
            session.currentPhase = phases[nextPhaseIndex]
            session.phaseStartTime = now
            const storage = getStorage()
            await storage.saveSession(session)
            setSession({ ...session })
            isTickingRef.current = false
            return
          }
        }
      }

      const cooldownMs = 10000
      const eligibleParticipants = session.participants.filter((p) => {
        const progress = session.progress.find((pr) => pr.participantId === p.id)
        const lastSpoke = progress?.lastSpeakTime || 0
        return now - lastSpoke > cooldownMs
      })

      if (eligibleParticipants.length === 0) {
        isTickingRef.current = false
        return
      }

    let participant: Participant

    if (session.mode === 'solo') {
      const queuedEligible = session.raiseHandQueue
        .map((intent) => ({
          intent,
          participant: session.participants.find((p) => p.id === intent.participantId),
        }))
        .filter(
          (entry): entry is { intent: typeof session.raiseHandQueue[number]; participant: Participant } =>
            Boolean(entry.participant) &&
            eligibleParticipants.some((p) => p.id === entry.participant!.id)
        )
        .sort((a, b) => b.intent.priority - a.intent.priority || a.intent.timestamp - b.intent.timestamp)

      if (queuedEligible.length > 0) {
        participant = queuedEligible[0].participant
        session.raiseHandQueue = session.raiseHandQueue.filter(
          (intent) => intent.participantId !== participant.id
        )
      } else {
        participant = [...eligibleParticipants]
          .map((p) => ({
            participant: p,
            lastSpoke: session.progress.find((pr) => pr.participantId === p.id)?.lastSpeakTime || 0,
          }))
          .sort((a, b) => a.lastSpoke - b.lastSpoke)[0].participant
      }
    } else {
      participant =
        eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)]
    }

      await generateMessage(participant)
      await loadSession() // Reload to get updated state
    } finally {
      isTickingRef.current = false
    }
  }

  async function generateMessage(participant: Participant) {
    const settings = await loadSettings()
    const apiKey = settings?.providers[participant.provider]?.apiKey
    const recentContents = session!.messages.slice(-8).map((m) => m.content)

    const result = await requestMessage(participant, apiKey, recentContents)

    if (!result?.success) return
    const trimmedText = String(result.text || '').trim()
    if (!trimmedText) return

    if (isDuplicateMessage(trimmedText, recentContents)) {
      const retryResult = await requestMessage(participant, apiKey, recentContents, true)
      if (!retryResult?.success) return
      const retryText = String(retryResult.text || '').trim()
      if (!retryText || isDuplicateMessage(retryText, recentContents)) return
      await saveGeneratedMessage(retryText, participant, apiKey)
      return
    }

    await saveGeneratedMessage(trimmedText, participant, apiKey)
  }

  async function requestMessage(
    participant: Participant,
    apiKey: string | undefined,
    recentContents: string[],
    retry = false
  ) {
    const settings = await loadSettings()

    const response = await fetch('/api/debate/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: participant.provider,
        model: participant.model,
        apiKey,
        participantName: participant.name,
        roleStyle: participant.roleStyle,
        temperature: participant.temperature,
        topic: session!.topic.title,
        phase: session!.currentPhase,
        recentMessages: session!.messages.slice(-8).map((m) => ({
          participantName: session!.participants.find((p) => p.id === m.participantId)?.name,
          content: m.content,
        })),
        avoidMessages: recentContents,
        retry,
        rules: session!.settings.rules,
        demoMode: settings?.demoMode || !apiKey,
      }),
    })

    return response.json()
  }

  async function saveGeneratedMessage(
    content: string,
    participant: Participant,
    _apiKey?: string
  ) {
    const message: DebateMessage = {
      id: `msg-${Date.now()}`,
      debateId: session!.id,
      participantId: participant.id,
      content,
      timestamp: Date.now(),
      phase: session!.currentPhase,
    }

    await scoreAndSaveMessage(message, participant)
  }

  async function scoreAndSaveMessage(
    message: DebateMessage,
    participant: Participant
  ) {
    const settings = await loadSettings()
    const judgeProvider = session!.settings.judgeProvider
    const judgeKey = settings?.providers[judgeProvider]?.apiKey

    const response = await fetch('/api/debate/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context: {
          topic: session!.topic.title,
          phase: session!.currentPhase,
          recentMessages: session!.messages.slice(-3),
        },
        rules: session!.settings.rules,
        judgeProvider: session!.settings.judgeProvider,
        judgeModel: session!.settings.judgeModel,
        apiKey: judgeKey,
        demoMode: settings?.demoMode || !judgeKey,
      }),
    })

    const result = await response.json()

    if (result.success) {
      message.score = result.score

      const storage = getStorage()
      await storage.saveMessage(message)

      // Update session
      session!.messages.push(message)
      const progress = session!.progress.find((p) => p.participantId === participant.id)!
      progress.messagesCount++
      progress.lastSpeakTime = Date.now()
      progress.points += 10 + Math.floor(result.score.total)
      progress.avgScore =
        (progress.avgScore * (progress.messagesCount - 1) + result.score.total) /
        progress.messagesCount

      if (session!.messages.length % 5 === 0) {
        const recentBatch = session!.messages.slice(-5).filter((m) => m.score)
        const bestMessage = recentBatch.sort(
          (a, b) => (b.score?.total || 0) - (a.score?.total || 0)
        )[0]
        if (bestMessage) {
          bestMessage.isBestMessage = true
          bestMessage.bestMessageRank = 1
          const bestProgress = session!.progress.find(
            (p) => p.participantId === bestMessage.participantId
          )
          if (bestProgress) {
            bestProgress.points += 5
            bestProgress.bestMessagesCount += 1
          }

          const event = {
            id: `best-${Date.now()}`,
            debateId: session!.id,
            messageId: bestMessage.id,
            participantId: bestMessage.participantId,
            timestamp: Date.now(),
            batchNumber: Math.floor(session!.messages.length / 5),
          }
          session!.bestMessageEvents.push(event)
          await storage.saveBestMessageEvent(event)
        }
      }

      session!.metadata.updatedAt = Date.now()
      await storage.saveSession(session!)
    }
  }

  async function endDebate() {
    if (!session) return

    const teamAScore = session.progress
      .filter((p) => session.participants.find((pt) => pt.id === p.participantId)?.team === 'A')
      .reduce((sum, p) => sum + p.points, 0)

    const teamBScore = session.progress
      .filter((p) => session.participants.find((pt) => pt.id === p.participantId)?.team === 'B')
      .reduce((sum, p) => sum + p.points, 0)

    const topSolo = session.progress
      .map((progress) => ({
        progress,
        participant: session.participants.find((p) => p.id === progress.participantId),
      }))
      .sort((a, b) => b.progress.points - a.progress.points)[0]

    session.status = 'finished'
    session.endTime = Date.now()
    session.winner = {
      team: session.mode === 'team' ? (teamAScore >= teamBScore ? 'A' : 'B') : undefined,
      participantId: session.mode === 'solo' ? topSolo?.participant?.id : undefined,
      participants:
        session.mode === 'team'
          ? session.participants
              .filter((p) => p.team === (teamAScore >= teamBScore ? 'A' : 'B'))
              .map((p) => p.id)
          : topSolo?.participant
            ? [topSolo.participant.id]
            : [],
      finalScore:
        session.mode === 'team'
          ? Math.max(teamAScore, teamBScore)
          : topSolo?.progress.points || 0,
    }

    const storage = getStorage()
    await storage.saveSession(session)

    router.push(`/app/debates/${session.id}/results`)
  }

  function downloadJSON() {
    if (!session) return
    const json = exportDebateToJSON(session)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `debate-${session.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function downloadMarkdown() {
    if (!session) return
    const markdown = exportDebateToMarkdown(session)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `debate-${session.id}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function copySummary() {
    if (!session) return
    const summary = buildShareableSummary(session)
    await navigator.clipboard.writeText(summary)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin text-blue-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">Debate not found</h2>
          <Link href="/app">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Top Bar */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Exit
                </Button>
              </Link>
              <div>
                <h2 className="font-semibold">{session.topic.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="secondary">{getPhaseLabel(session.currentPhase)}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
                {session.topic.description && (
                  <div className="text-xs text-gray-500">{session.topic.description}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadJSON}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                <FileText className="mr-2 h-4 w-4" />
                Export Markdown
              </Button>
              <Button variant="outline" size="sm" onClick={copySummary}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Summary
              </Button>
              {session.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoUpdate(!autoUpdate)}
                  >
                    {autoUpdate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={endDebate}>
                    <Square className="mr-2 h-4 w-4" />
                    End
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
        {/* Main Chat Feed */}
        <div>
          <Card className="h-[calc(100vh-200px)]">
            <CardContent className="flex h-full flex-col p-0">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {session.messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <MessageSquare className="mb-4 h-12 w-12 opacity-50" />
                    <p>Debate will begin shortly...</p>
                  </div>
                ) : (
                  session.messages.map((message) => {
                    const participant = session.participants.find(
                      (p) => p.id === message.participantId
                    )!
                    const participantIndex = session.participants.findIndex(
                      (p) => p.id === message.participantId
                    )
                    const isProSide = participant.team === 'A' || (!participant.team && participantIndex % 2 === 0)
                    const { key, rest } = getKeySentence(message.content)
                    return (
                      <div key={message.id} className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-8 w-8 rounded-full ${getProviderColor(participant.provider)}`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{participant.name}</span>
                                <Badge
                                  className={`${isProSide ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-bold text-xs px-2`}
                                >
                                  {isProSide ? 'PRO' : 'CON'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                {participant.team && (
                                  <Badge
                                    variant="outline"
                                    className={getTeamColor(participant.team)}
                                  >
                                    Team {participant.team}
                                  </Badge>
                                )}
                                <span>{getPhaseLabel(message.phase)}</span>
                              </div>
                            </div>
                          </div>
                          {message.score && (
                            <Badge variant="secondary">
                              {message.score.total.toFixed(1)}/10
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-gray-800">
                          {key && (
                            <div className="rounded-md border border-lime-200 bg-lime-100/80 px-3 py-2 text-base font-semibold text-gray-900 shadow-sm">
                              {key}
                            </div>
                          )}
                          {rest && <p className="text-sm leading-relaxed text-gray-700">{rest}</p>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoreboard */}
        <div className="space-y-4">
          {session.mode === 'team' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Scoreboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.participants.map((participant) => {
                  const progress = session.progress.find((p) => p.participantId === participant.id)!
                  return (
                    <div key={participant.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{participant.name}</span>
                        <Badge className={getTeamColor(participant.team)}>
                          {progress.points}
                        </Badge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full ${participant.team === 'A' ? 'bg-blue-600' : 'bg-purple-600'}`}
                          style={{ width: `${Math.min(100, (progress.points / 100) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {progress.messagesCount} msgs • Avg: {progress.avgScore.toFixed(1)}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...session.progress]
                  .map((progress) => ({
                    progress,
                    participant: session.participants.find((p) => p.id === progress.participantId),
                  }))
                  .sort((a, b) => b.progress.points - a.progress.points)
                  .map(({ participant, progress }, index) => (
                    <div key={progress.participantId} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">
                          #{index + 1} {participant?.name || 'Participant'}
                        </span>
                        <Badge className="text-slate-700 bg-slate-100">{progress.points}</Badge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${Math.min(100, (progress.points / 100) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {progress.messagesCount} msgs • Avg: {progress.avgScore.toFixed(1)}
                      </div>
                    </div>
                  ))}
                {session.messages.length > 0 && (
                  <div className="rounded-lg border bg-slate-50 p-3 text-sm text-gray-700">
                    Last best message:{' '}
                    {(() => {
                      const bestRecent = [...session.messages]
                        .filter((message) => message.score)
                        .slice(-5)
                        .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0))[0]
                      const participant = bestRecent
                        ? session.participants.find((p) => p.id === bestRecent.participantId)
                        : null
                      return participant?.name || 'N/A'
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
