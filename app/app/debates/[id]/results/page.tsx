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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

  // Compute per-participant sub-score averages from individual messages
  const subScoreData = session.participants.map((participant) => {
    const scoredMessages = session.messages.filter(
      (m) => m.participantId === participant.id && m.score
    )
    const avg = (key: keyof NonNullable<typeof scoredMessages[0]['score']>) =>
      scoredMessages.length
        ? +(scoredMessages.reduce((sum, m) => sum + ((m.score as any)[key] || 0), 0) / scoredMessages.length).toFixed(2)
        : 0
    const progress = session.progress.find((pr) => pr.participantId === participant.id)
    return {
      name: participant.name,
      team: participant.team,
      totalPoints: progress?.points || 0,
      messagesCount: progress?.messagesCount || 0,
      avgScore: progress?.avgScore || 0,
      argumentQuality: avg('argumentQuality'),
      relevance: avg('relevance'),
      evidence: avg('evidence'),
      clarity: avg('clarity'),
    }
  }).sort((a, b) => b.totalPoints - a.totalPoints)

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
            <CardTitle>Score Breakdown by Criteria</CardTitle>
            <p className="text-sm text-gray-500">
              Average score per criterion across all judged messages.{' '}
              <span className="font-medium text-gray-700">
                Argument Quality (0–4) · Relevance (0–2) · Evidence (0–2) · Clarity (0–2)
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={subScoreData} barCategoryGap="25%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 4]} />
                <Tooltip
                  formatter={(value: number, name: string) => [value.toFixed(2), name]}
                />
                <Legend />
                <Bar dataKey="argumentQuality" name="Arg Quality (0–4)" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="relevance" name="Relevance (0–2)" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="evidence" name="Evidence (0–2)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clarity" name="Clarity (0–2)" fill="#EC4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Score Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Participant Score Details</CardTitle>
            <p className="text-sm text-gray-500">
              Total Points = sum of per-message scores (0–10 each). Higher quality per message beats higher message count.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="pb-3 pr-4 font-semibold">Participant</th>
                    {session.mode === 'team' && <th className="pb-3 pr-4 font-semibold">Team</th>}
                    <th className="pb-3 pr-4 font-semibold text-right">Messages</th>
                    <th className="pb-3 pr-4 font-semibold text-right">Avg Score</th>
                    <th className="pb-3 pr-4 font-semibold text-right">
                      <span className="text-indigo-600">Arg Quality</span>
                      <br /><span className="font-normal text-gray-400">/4</span>
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-right">
                      <span className="text-green-600">Relevance</span>
                      <br /><span className="font-normal text-gray-400">/2</span>
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-right">
                      <span className="text-amber-600">Evidence</span>
                      <br /><span className="font-normal text-gray-400">/2</span>
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-right">
                      <span className="text-pink-600">Clarity</span>
                      <br /><span className="font-normal text-gray-400">/2</span>
                    </th>
                    <th className="pb-3 font-semibold text-right">Total Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {subScoreData.map((row, idx) => (
                    <tr key={row.name} className={`border-b last:border-0 ${idx === 0 ? 'bg-amber-50' : ''}`}>
                      <td className="py-3 pr-4 font-medium">
                        {idx === 0 && <span className="mr-1">🏆</span>}
                        {row.name}
                      </td>
                      {session.mode === 'team' && (
                        <td className="py-3 pr-4">
                          {row.team && (
                            <Badge className={getTeamColor(row.team)}>Team {row.team}</Badge>
                          )}
                        </td>
                      )}
                      <td className="py-3 pr-4 text-right text-gray-600">{row.messagesCount}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{row.avgScore.toFixed(2)}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-indigo-700">{row.argumentQuality.toFixed(2)}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-green-700">{row.relevance.toFixed(2)}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-amber-700">{row.evidence.toFixed(2)}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-pink-700">{row.clarity.toFixed(2)}</td>
                      <td className="py-3 text-right text-lg font-bold">{row.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
