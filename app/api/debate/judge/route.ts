// API route for judge scoring

import { NextRequest, NextResponse } from 'next/server'
import { scoreMessage } from '@/lib/providers/judge'
import { AIProvider, DebateMessage, DebateRules } from '@/types'

interface JudgeRequestBody {
  message: DebateMessage
  context: {
    topic: string
    phase: string
    recentMessages: DebateMessage[]
  }
  rules: DebateRules
  judgeProvider: AIProvider
  judgeModel: string
  apiKey?: string
  demoMode?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, rules, judgeProvider, judgeModel, apiKey, demoMode } =
      (await request.json()) as JudgeRequestBody

    const score = await scoreMessage({
      message,
      context,
      rules,
      judgeProvider,
      judgeModel,
      apiKey: demoMode ? undefined : apiKey,
    })

    return NextResponse.json({ success: true, score })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
