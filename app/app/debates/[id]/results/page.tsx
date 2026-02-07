'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, ArrowLeft, Download, FileText, Copy } from 'lucide-react'
import Link from 'next/link'
import { DebateSession } from '@/types'
import { getStorage, exportDebateToJSON, exportDebateToMarkdown } from '@/lib/storage/debate-storage'
import { getTeamColor, formatDuration, buildShareableSummary } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ResultsPage() {
  const params = useParams()
  const [session, setSession] = useState<DebateSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [params.id])

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

  function downloadJSON() {
    if (!session) return
    const json = exportDebateToJSON(session)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debate-${session.id}.json`
    a.click()
  }

  function downloadMarkdown() {
    if (!session) return
    const markdown = exportDebateToMarkdown(session)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debate-${session.id}.md`
    a.click()
  }

  async function copySummary() {
    if (!session) return
    const summary = buildShareableSummary(session)
    await navigator.clipboard.writeText(summary)
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading results...</div>
      </div>
    )
  }

  const chartData = session.progress
    .map((p) => ({
      name: session.participants.find((pt) => pt.id === p.participantId)?.name || '',
      points: p.points,
      avgScore: p.avgScore,
      messages: p.messagesCount,
    }))
    .sort((a, b) => b.points - a.points)

  const topSolo = session.progress
    .map((progress) => ({
      progress,
      participant: session.participants.find((p) => p.id === progress.participantId),
    }))
    .sort((a, b) => b.progress.points - a.progress.points)[0]

  const duration = (session.endTime || Date.now()) - session.startTime

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/app" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>
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
            <Link href={`/app/debates/${session.id}`}>
              <Button variant="outline" size="sm">
                View Debate
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Winner Announcement */}
        <Card className="mb-8 border-4 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-20 w-20 text-amber-500" />
            {session.mode === 'team' ? (
              <>
                <h1 className="mb-2 text-4xl font-bold">
                  Team {session.winner?.team} Wins!
                </h1>
                <p className="text-xl text-gray-700">
                  Final Score: {session.winner?.finalScore} points
                </p>
              </>
            ) : (
              <>
                <h1 className="mb-2 text-4xl font-bold">
                  {topSolo?.participant?.name || 'Top Participant'} Wins!
                </h1>
                <p className="text-xl text-gray-700">
                  Final Score: {topSolo?.progress.points || 0} points
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="mt-2 text-2xl font-bold">{formatDuration(duration)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="mt-2 text-2xl font-bold">{session.messages.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="mt-2 text-2xl font-bold">{session.participants.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Participant Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey={session.mode === 'solo' ? 'avgScore' : 'points'} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Top 3 Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.messages
              .filter((m) => m.score)
              .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0))
              .slice(0, 3)
              .map((message, idx) => {
                const participant = session.participants.find(
                  (p) => p.id === message.participantId
                )!
                return (
                  <div key={message.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{idx + 1}</Badge>
                        <span className="font-semibold">{participant.name}</span>
                        {participant.team && (
                          <Badge className={getTeamColor(participant.team)}>
                            Team {participant.team}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="default">{message.score?.total.toFixed(1)}/10</Badge>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                    <p className="mt-2 text-sm italic text-gray-600">
                      {message.score?.rationale}
                    </p>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
