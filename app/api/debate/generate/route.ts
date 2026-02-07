// API route for generating debate messages

import { NextRequest, NextResponse } from 'next/server'
import { generateMessage, generateMockMessage } from '@/lib/providers/adapters'
import { AIProvider, DebateRules } from '@/types'

interface RecentMessageInput {
  participantName: string
  content: string
}

interface GenerateRequestBody {
  provider: AIProvider
  model: string
  apiKey?: string
  participantName: string
  roleStyle: string
  temperature?: number
  topic: string
  phase: string
  recentMessages: RecentMessageInput[]
  avoidMessages?: string[]
  retry?: boolean
  rules: DebateRules
  demoMode?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const {
      provider,
      model,
      apiKey,
      participantName,
      roleStyle,
      temperature,
      topic,
      phase,
      recentMessages,
      avoidMessages,
      retry,
      rules,
      demoMode,
    } = (await request.json()) as GenerateRequestBody

    // Demo mode: return mock response
    if (demoMode || !apiKey) {
      const mockText = generateMockMessage(participantName, phase)
      return NextResponse.json({ success: true, text: mockText })
    }

    // Build system prompt based on role and rules
    const phaseGuidance = {
      'Opening Arguments': 'Present your INITIAL position with fresh reasoning. Establish your unique perspective.',
      'Rebuttals': 'DIRECTLY address opponent arguments. Counter with new evidence or logical flaws you identify.',
      'Cross-Examination': 'Ask probing questions OR answer with precision. Expose weaknesses or clarify your stance.',
      'Closing Statements': 'SYNTHESIZE the debate. Highlight what you won, acknowledge complexity, leave lasting impact.',
    }[phase] || 'Advance the discussion with NEW information, angles, or reasoning.'

    const diversityInstructions = `
CRITICAL DIVERSITY REQUIREMENTS:
- DO NOT repeat arguments already made (yours or others)
- Introduce NEW evidence, examples, or logical angles
- If ${recentMessages.length} messages exist, the debate has PROGRESSED - build on it, don't reset
- Vary your sentence structure and vocabulary from prior messages
- ${retry ? 'COMPLETELY DIFFERENT approach required - previous attempt was too similar' : ''}`

    const systemPrompt = `You are ${participantName}, a ${roleStyle} debater in a live structured debate.

Debate Topic: ${topic}
Current Phase: ${phase}
Your Role Style: ${roleStyle}
Messages so far: ${recentMessages.length}

Phase Goal: ${phaseGuidance}

Rules:
- Keep your response under ${rules.maxMessageLength} words
${rules.stayOnTopic ? '- Stay focused on the topic' : ''}
${rules.noPersonalAttacks ? '- Be respectful, no personal attacks' : ''}
${rules.noFakeCitations ? '- Only cite real, verifiable sources' : ''}${diversityInstructions}

Recent discussion (what's ALREADY been said):
${recentMessages.map((message, i) => `[${i + 1}] ${message.participantName}: ${message.content}`).join('\n')}

${avoidMessages?.length ? `
⚠️ FORBIDDEN - Do NOT echo these patterns:
${avoidMessages.map((message, index) => `${index + 1}. "${message.substring(0, 100)}..."`).join('\n')}
` : ''}

Provide a ${roleStyle} response that ADVANCES the debate with original thinking.`

    const userPrompt = `As ${participantName}, provide your next argument in this ${phase} phase of the debate on: "${topic}"`

    const result = await generateMessage({
      provider,
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: temperature || 0.7,
      maxTokens: rules.maxMessageLength * 2, // words to tokens rough estimate
      apiKey,
    })

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, text: result.text })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
