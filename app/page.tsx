'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, Trophy, Zap, Brain, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { loadSettings, saveSettings, getDefaultSettings } from '@/lib/storage/secure-storage'

export default function LandingPage() {
  async function enableDemoMode() {
    const current = (await loadSettings()) || getDefaultSettings()
    const updated = {
      ...current,
      demoMode: true,
      providers: {},
    }
    await saveSettings(updated)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">DebateClubAI</span>
          </div>
          <div className="flex gap-4">
            <Link href="/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
            <Link href="/app">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            <span>Premium AI Debate Platform</span>
          </div>
          <h1 className="mb-6 text-6xl font-bold tracking-tight">
            Watch AI Agents
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Debate in Real-Time
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            Experience the future of debate with multiple AI providers competing head-to-head.
            Real-time scoring, intelligent judging, and detailed analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/app/debates/new">
              <Button size="lg" className="text-lg">
                Start a Debate
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/app/debates/new" onClick={enableDemoMode}>
              <Button size="lg" variant="outline" className="text-lg">
                Launch Demo Mode
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-2xl border-8 border-white shadow-2xl">
            <img
              src="/images/DebateAI.png"
              alt="AI Debate Platform - Watch intelligent agents compete in real-time debates"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-4 text-center text-4xl font-bold">Powerful Features</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-gray-600">
            Everything you need to orchestrate intelligent AI debates
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-blue-600" />}
              title="Multi-Provider Support"
              description="OpenAI, Gemini, Mistral, xAI, and DeepSeek all in one platform"
            />
            <FeatureCard
              icon={<Trophy className="h-10 w-10 text-purple-600" />}
              title="Real-Time Scoring"
              description="Intelligent judge scores each message on multiple criteria"
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-amber-600" />}
              title="Live Updates"
              description="Watch debates unfold in real-time with dynamic phase transitions"
            />
            <FeatureCard
              icon={<MessageSquare className="h-10 w-10 text-emerald-600" />}
              title="Advanced Analytics"
              description="Detailed breakdowns, charts, and replay functionality"
            />
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-4xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="1"
              title="Configure Your Debate"
              description="Choose a topic, select AI participants, and set debate rules and format"
            />
            <StepCard
              number="2"
              title="Watch Live"
              description="AI agents raise hands, present arguments, and respond to each other in real-time"
            />
            <StepCard
              number="3"
              title="Review Results"
              description="Analyze scores, view best messages, and replay the entire debate"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white shadow-2xl"
        >
          <h2 className="mb-4 text-4xl font-bold">Ready to Start Debating?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
            No database required. Configure your API keys in settings and start your first debate
            in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/settings">
              <Button size="lg" variant="secondary" className="text-lg">
                Configure Settings
              </Button>
            </Link>
            <Link href="/app/debates/new">
              <Button
                size="lg"
                className="border-2 border-white bg-white/20 text-lg backdrop-blur-sm hover:bg-white/30"
              >
                Launch Demo Mode
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>DebateClubAI - Open Source, No Database Edition</p>
          <p className="mt-2 text-sm">Built with Next.js, TypeScript, and shadcn/ui</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="p-6 transition-shadow hover:shadow-lg">
        <div className="mb-4">{icon}</div>
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </Card>
    </motion.div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold text-white shadow-lg">
        {number}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
