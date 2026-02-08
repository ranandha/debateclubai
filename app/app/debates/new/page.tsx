'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Play, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DebateSession, Participant, Team, AIProvider, RoleStyle, DebateMode } from '@/types'
import { DEBATE_TOPICS, DEFAULT_MODELS, ROLE_STYLES, DEBATE_FORMATS, PARTICIPANT_COLORS } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import { getStorage } from '@/lib/storage/debate-storage'
import { loadSettings, saveSettings, getDefaultSettings, isEncrypted } from '@/lib/storage/secure-storage'

const CUSTOM_TOPIC_ID = 'custom'
const STORAGE_KEYS = {
  topicId: 'debate_setup_topic_id',
  customTitle: 'debate_setup_custom_title',
  customDescription: 'debate_setup_custom_description',
  mode: 'debate_setup_mode',
}

export default function NewDebatePage() {
  const router = useRouter()
  const [topicId, setTopicId] = useState(DEBATE_TOPICS[0].id)
  const [customTopicTitle, setCustomTopicTitle] = useState('')
  const [customTopicDescription, setCustomTopicDescription] = useState('')
  const [mode, setMode] = useState<DebateMode>('team')
  const [format, setFormat] = useState<'classic' | 'fast' | 'freeform'>('classic')
  const [teamA, setTeamA] = useState<Participant[]>([])
  const [teamB, setTeamB] = useState<Participant[]>([])
  const [soloParticipants, setSoloParticipants] = useState<Participant[]>([])
  const [judgeProvider, setJudgeProvider] = useState<AIProvider>('openai')
  const [judgeModel, setJudgeModel] = useState('gpt-4o-mini')
  const [maxLength, setMaxLength] = useState(150)
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([])
  const [demoMode, setDemoMode] = useState(false)
  const [settingsLocked, setSettingsLocked] = useState(false)

  useEffect(() => {
    loadAvailableProviders()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedTopicId = localStorage.getItem(STORAGE_KEYS.topicId)
    const savedTitle = localStorage.getItem(STORAGE_KEYS.customTitle)
    const savedDescription = localStorage.getItem(STORAGE_KEYS.customDescription)
    const savedMode = localStorage.getItem(STORAGE_KEYS.mode)

    if (savedTopicId) setTopicId(savedTopicId)
    if (savedTitle) setCustomTopicTitle(savedTitle)
    if (savedDescription) setCustomTopicDescription(savedDescription)
    if (savedMode === 'team' || savedMode === 'solo') setMode(savedMode)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.topicId, topicId)
    localStorage.setItem(STORAGE_KEYS.customTitle, customTopicTitle)
    localStorage.setItem(STORAGE_KEYS.customDescription, customTopicDescription)
    localStorage.setItem(STORAGE_KEYS.mode, mode)
  }, [topicId, customTopicTitle, customTopicDescription, mode])

  async function loadAvailableProviders() {
    const settings = await loadSettings()
    const encrypted = await isEncrypted()
    
    if (!settings && encrypted) {
      // Settings exist but are encrypted and locked
      setSettingsLocked(true)
      setDemoMode(true)
      setAvailableProviders(['openai'])
      return
    }
    
    if (!settings) {
      setDemoMode(true)
      setAvailableProviders(['openai'])
      return
    }

    if (settings.demoMode) {
      setDemoMode(true)
      setAvailableProviders(['openai'])
      setJudgeProvider('openai')
      setJudgeModel(DEFAULT_MODELS.openai[0])
      return
    }

    const providers = Object.keys(settings.providers).filter(
      (p) => settings.providers[p as AIProvider]?.apiKey
    ) as AIProvider[]

    if (providers.length === 0) {
      setDemoMode(true)
      setAvailableProviders(['openai'])
    } else {
      setAvailableProviders(providers)
      if (providers.length > 0) {
        setJudgeProvider(providers[0])
        setJudgeModel(DEFAULT_MODELS[providers[0]][0])
      }
    }
  }

  async function enableDemoMode() {
    const current = (await loadSettings()) || getDefaultSettings()
    const updated = {
      ...current,
      demoMode: true,
      providers: {},
    }
    await saveSettings(updated)
    setDemoMode(true)
    setAvailableProviders(['openai'])
    setJudgeProvider('openai')
    setJudgeModel(DEFAULT_MODELS.openai[0])
  }

  function buildParticipant(team: Team | null, index: number): Participant {
    const provider = availableProviders[0] || 'openai'
    return {
      id: generateId(),
      name:
        team === 'A'
          ? `Alpha-${index}`
          : team === 'B'
            ? `Beta-${index}`
            : `Panelist-${index}`,
      team,
      provider,
      model: DEFAULT_MODELS[provider][0],
      roleStyle: 'analytical',
      temperature: 0.7,
      color: PARTICIPANT_COLORS[(index - 1) % PARTICIPANT_COLORS.length],
    }
  }

  function addParticipant(team: Team) {
    const participant = buildParticipant(
      team,
      team === 'A' ? teamA.length + 1 : teamB.length + 1
    )
    if (team === 'A') {
      setTeamA([...teamA, participant])
    } else {
      setTeamB([...teamB, participant])
    }
  }

  function addSoloParticipant() {
    const participant = buildParticipant(null, soloParticipants.length + 1)
    setSoloParticipants([...soloParticipants, participant])
  }

  function removeParticipant(team: Team, id: string) {
    if (team === 'A') {
      setTeamA(teamA.filter((p) => p.id !== id))
    } else {
      setTeamB(teamB.filter((p) => p.id !== id))
    }
  }

  function updateParticipant(team: Team, id: string, updates: Partial<Participant>) {
    if (team === 'A') {
      setTeamA(teamA.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    } else {
      setTeamB(teamB.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    }
  }

  function removeSoloParticipant(id: string) {
    setSoloParticipants(soloParticipants.filter((p) => p.id !== id))
  }

  function updateSoloParticipant(id: string, updates: Partial<Participant>) {
    setSoloParticipants(soloParticipants.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  async function startDebate() {
    const isCustomTopic = topicId === CUSTOM_TOPIC_ID
    if (isCustomTopic && !customTopicTitle.trim()) {
      alert('Please enter a custom topic title')
      return
    }

    if (mode === 'team') {
      if (teamA.length === 0 || teamB.length === 0) {
        alert('Please add at least one participant to each team')
        return
      }
    } else if (soloParticipants.length === 0) {
      alert('Please add at least one participant')
      return
    }

    const topic =
      topicId === CUSTOM_TOPIC_ID
        ? {
            id: CUSTOM_TOPIC_ID,
            title: customTopicTitle.trim(),
            description: customTopicDescription.trim() || undefined,
          }
        : DEBATE_TOPICS.find((t) => t.id === topicId)!
    const formatConfig = DEBATE_FORMATS.find((f) => f.value === format)!
    const participants = mode === 'team' ? [...teamA, ...teamB] : soloParticipants

    const session: DebateSession = {
      id: generateId(),
      topic,
      mode,
      settings: {
        duration: formatConfig.duration,
        format,
        judgeProvider,
        judgeModel,
        rules: {
          maxMessageLength: maxLength,
          noPersonalAttacks: true,
          stayOnTopic: true,
          noFakeCitations: true,
        },
        firstTo100EndsEarly: false,
      },
      participants,
      startTime: Date.now(),
      currentPhase: 'opening',
      phaseStartTime: Date.now(),
      status: 'active',
      raiseHandQueue: [],
      progress: participants.map((p) => ({
        participantId: p.id,
        points: 0,
        messagesCount: 0,
        bestMessagesCount: 0,
        avgScore: 0,
      })),
      messages: [],
      bestMessageEvents: [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }

    const storage = getStorage()
    await storage.saveSession(session)

    router.push(`/app/debates/${session.id}`)
  }

  const selectedTopic =
    topicId === CUSTOM_TOPIC_ID
      ? { title: customTopicTitle || 'Custom Topic', description: customTopicDescription }
      : DEBATE_TOPICS.find((t) => t.id === topicId)!

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/app" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>
          <div className="flex gap-2">
            {!demoMode && (
              <Button variant="outline" onClick={enableDemoMode} size="lg">
                Launch Demo Mode
              </Button>
            )}
            <Button onClick={startDebate} size="lg">
              <Play className="mr-2 h-5 w-5" />
              Start Debate
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">New Debate Setup</h1>
          <p className="text-lg text-gray-600">Configure your AI debate session</p>
        </div>

        {demoMode && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-900">
                {settingsLocked ? (
                  <>
                    🔒 <strong>Settings Locked</strong> - Your API keys are encrypted. {' '}
                    <Link href="/settings" className="underline">Unlock settings</Link> to access your configured providers, or use Demo Mode with mock responses.
                  </>
                ) : (
                  <>
                    🎭 <strong>Demo Mode</strong> - No API keys configured. The debate will use mock
                    responses. <Link href="/settings" className="underline">Configure API keys</Link> for
                    real AI debates.
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {!demoMode && availableProviders.length === 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-900">
                No provider keys detected. Enable Demo Mode or add API keys in{' '}
                <Link href="/settings" className="underline">Settings</Link>.
              </p>
              <Button variant="outline" className="mt-4" onClick={enableDemoMode}>
                Launch Demo Mode
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Topic Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Select Topic</CardTitle>
            <CardDescription>Choose what the AI agents will debate about</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            >
              {DEBATE_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
              <option value={CUSTOM_TOPIC_ID}>Custom Topic</option>
            </select>
            <p className="mt-2 text-sm text-gray-600">{selectedTopic.description}</p>
            {topicId === CUSTOM_TOPIC_ID && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">Custom Topic Title</label>
                  <Input
                    value={customTopicTitle}
                    onChange={(e) => setCustomTopicTitle(e.target.value)}
                    placeholder="Enter your debate topic"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Custom Description (optional)</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={customTopicDescription}
                    onChange={(e) => setCustomTopicDescription(e.target.value)}
                    placeholder="Add a short context or framing for the debate"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format & Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Format & Rules</CardTitle>
            <CardDescription>Configure debate timing and constraints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Format</label>
              <div className="grid grid-cols-3 gap-4">
                {DEBATE_FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value as 'classic' | 'fast' | 'freeform')}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      format === f.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="mb-1 font-semibold">{f.label}</div>
                    <div className="mb-2 text-sm text-gray-600">{f.duration} minutes</div>
                    <div className="text-xs text-gray-500">{f.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Max Message Length: {maxLength} words
              </label>
              <input
                type="range"
                min="120"
                max="180"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Debate Mode */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Debate Mode</CardTitle>
            <CardDescription>Choose between team or solo panel format</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setMode('team')}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                mode === 'team'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="mb-1 font-semibold">Team Debate</div>
              <div className="text-sm text-gray-600">Team A vs Team B</div>
            </button>
            <button
              onClick={() => setMode('solo')}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                mode === 'solo'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="mb-1 font-semibold">Solo Panel</div>
              <div className="text-sm text-gray-600">Independent participants</div>
            </button>
          </CardContent>
        </Card>

        {/* Participants */}
        {mode === 'team' ? (
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <TeamConfig
              team="A"
              participants={teamA}
              availableProviders={availableProviders}
              onAdd={() => addParticipant('A')}
              onRemove={(id) => removeParticipant('A', id)}
              onUpdate={(id, updates) => updateParticipant('A', id, updates)}
            />
            <TeamConfig
              team="B"
              participants={teamB}
              availableProviders={availableProviders}
              onAdd={() => addParticipant('B')}
              onRemove={(id) => removeParticipant('B', id)}
              onUpdate={(id, updates) => updateParticipant('B', id, updates)}
            />
          </div>
        ) : (
          <div className="mb-6">
            <ParticipantsConfig
              participants={soloParticipants}
              availableProviders={availableProviders}
              onAdd={addSoloParticipant}
              onRemove={removeSoloParticipant}
              onUpdate={updateSoloParticipant}
            />
          </div>
        )}

        {/* Judge */}
        <Card>
          <CardHeader>
            <CardTitle>4. Judge Configuration</CardTitle>
            <CardDescription>Select the AI model that will score messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Provider</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={judgeProvider}
                  onChange={(e) => {
                    const provider = e.target.value as AIProvider
                    setJudgeProvider(provider)
                    setJudgeModel(DEFAULT_MODELS[provider][0])
                  }}
                  disabled={demoMode}
                >
                  {(demoMode ? ['openai'] : availableProviders).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Model</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={judgeModel}
                  onChange={(e) => setJudgeModel(e.target.value)}
                  disabled={demoMode}
                >
                  {DEFAULT_MODELS[judgeProvider].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TeamConfig({
  team,
  participants,
  availableProviders,
  onAdd,
  onRemove,
  onUpdate,
}: {
  team: Team
  participants: Participant[]
  availableProviders: AIProvider[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Participant>) => void
}) {
  const borderColor = team === 'A' ? 'border-blue-200' : 'border-purple-200'
  const bgColor = team === 'A' ? 'bg-blue-50' : 'bg-purple-50'

  return (
    <Card className={borderColor}>
      <CardHeader className={bgColor}>
        <CardTitle>Team {team}</CardTitle>
        <CardDescription>Add and configure AI participants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {participants.map((p) => (
          <div key={p.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <Input
                value={p.name}
                onChange={(e) => onUpdate(p.id, { name: e.target.value })}
                className="max-w-xs"
              />
              <Button variant="ghost" size="sm" onClick={() => onRemove(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Provider</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={p.provider}
                  onChange={(e) => {
                    const provider = e.target.value as AIProvider
                    onUpdate(p.id, {
                      provider,
                      model: DEFAULT_MODELS[provider][0],
                    })
                  }}
                >
                  {availableProviders.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Model</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={p.model}
                  onChange={(e) => onUpdate(p.id, { model: e.target.value })}
                >
                  {DEFAULT_MODELS[p.provider].map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Role Style</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={p.roleStyle}
                  onChange={(e) =>
                    onUpdate(p.id, { roleStyle: e.target.value as RoleStyle })
                  }
                >
                  {ROLE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        <Button onClick={onAdd} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Participant to Team {team}
        </Button>
      </CardContent>
    </Card>
  )
}

function ParticipantsConfig({
  participants,
  availableProviders,
  onAdd,
  onRemove,
  onUpdate,
}: {
  participants: Participant[]
  availableProviders: AIProvider[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Participant>) => void
}) {
  return (
    <Card className="border-purple-200">
      <CardHeader className="bg-purple-50">
        <CardTitle>Participants</CardTitle>
        <CardDescription>Add and configure panelists</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {participants.map((p) => (
          <div key={p.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <Input
                value={p.name}
                onChange={(e) => onUpdate(p.id, { name: e.target.value })}
                className="max-w-xs"
              />
              <Button variant="ghost" size="sm" onClick={() => onRemove(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Provider</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={p.provider}
                  onChange={(e) => {
                    const provider = e.target.value as AIProvider
                    onUpdate(p.id, {
                      provider,
                      model: DEFAULT_MODELS[provider][0],
                    })
                  }}
                >
                  {availableProviders.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Model</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={p.model}
                  onChange={(e) => onUpdate(p.id, { model: e.target.value })}
                >
                  {DEFAULT_MODELS[p.provider].map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Role Style</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={p.roleStyle}
                  onChange={(e) =>
                    onUpdate(p.id, { roleStyle: e.target.value as RoleStyle })
                  }
                >
                  {ROLE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        <Button onClick={onAdd} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Participant
        </Button>
      </CardContent>
    </Card>
  )
}
