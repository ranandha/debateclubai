'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  MessageSquare,
  Clock,
  TrendingUp,
  Plus,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { getStorage } from '@/lib/storage/debate-storage'
import { DebateSession } from '@/types'
import { formatDuration, getTeamColor } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [sessions, setSessions] = useState<DebateSession[]>([])

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    const storage = getStorage()
    const allSessions = await storage.getAllSessions()
    setSessions(allSessions.map((session) => ({ ...session, mode: session.mode || 'team' })))
  }

  const finishedSessions = sessions.filter((s) => s.status === 'finished')
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)
  const avgDuration =
    finishedSessions.length > 0
      ? finishedSessions.reduce(
          (sum, s) => sum + ((s.endTime || 0) - s.startTime),
          0
        ) / finishedSessions.length
      : 0

  const teamSessions = finishedSessions.filter((s) => s.mode === 'team')
  const teamAWins = teamSessions.filter((s) => s.winner?.team === 'A').length
  const teamBWins = teamSessions.filter((s) => s.winner?.team === 'B').length

  const recentSessions = sessions.slice(0, 5)

  const chartData = [
    { name: 'Team A', wins: teamAWins },
    { name: 'Team B', wins: teamBWins },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">DebateClubAI</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/settings">
              <Button variant="ghost">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/app/debates/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Debate
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Dashboard</h1>
          <p className="text-lg text-gray-600">Overview of your AI debates</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<MessageSquare className="h-6 w-6" />}
            label="Total Debates"
            value={sessions.length}
            color="blue"
          />
          <StatCard
            icon={<MessageSquare className="h-6 w-6" />}
            label="Total Messages"
            value={totalMessages}
            color="purple"
          />
          <StatCard
            icon={<Clock className="h-6 w-6" />}
            label="Avg Duration"
            value={formatDuration(avgDuration)}
            color="amber"
          />
          <StatCard
            icon={<Trophy className="h-6 w-6" />}
            label="Finished"
            value={finishedSessions.length}
            color="emerald"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Wins Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Team Wins</CardTitle>
              <CardDescription>Breakdown by team</CardDescription>
            </CardHeader>
            <CardContent>
              {teamSessions.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="wins" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-gray-500">
                  No completed debates yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Debates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Debates</CardTitle>
              <CardDescription>Your latest debate sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/app/debates/${session.id}`}
                      className="block rounded-lg border p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-semibold">{session.topic.title}</h4>
                        <Badge variant={session.status === 'finished' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{session.messages.length} messages</span>
                        {session.winner && session.mode === 'team' && session.winner.team && (
                          <span className={getTeamColor(session.winner.team)}>
                            Team {session.winner.team} won
                          </span>
                        )}
                        {session.winner && session.mode === 'solo' && session.winner.participantId && (
                          <span className="text-slate-600">
                            Winner: {session.participants.find((p) => p.id === session.winner?.participantId)?.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center text-center text-gray-500">
                  <TrendingUp className="mb-2 h-12 w-12 opacity-50" />
                  <p>No debates yet</p>
                  <Link href="/app/debates/new">
                    <Button className="mt-4" size="sm">
                      Start Your First Debate
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/app/debates/new">
              <Card className="cursor-pointer transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    New Debate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Set up a new AI debate with custom participants and rules
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="cursor-pointer transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Configure API keys and debate defaults
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }[color]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
          <div className={`rounded-full p-3 ${colorClasses}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
