// Judge scoring logic

import { MessageScore, DebateMessage, DebateRules, AIProvider } from '@/types'
import { generateMessage } from './adapters'

export interface JudgeParams {
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
}

export async function scoreMessage(params: JudgeParams): Promise<MessageScore> {
  // Use AI judge if API key provided
  if (params.apiKey) {
    return scoreWithAI(params)
  }

  // Fallback to heuristic judge
  return scoreWithHeuristic(params)
}

async function scoreWithAI(params: JudgeParams): Promise<MessageScore> {
  const system = `You are an expert debate judge. Score the following debate message on a 0-10 scale using this rubric:
- Argument Quality (0-4): Strength and validity of reasoning
- Relevance (0-2): How well it addresses the topic and phase
- Evidence (0-2): Quality of examples and citations${params.rules.noFakeCitations ? ' (deduct for fake citations)' : ''}
- Clarity (0-2): How well-structured and concise the message is

Respond ONLY with valid JSON: {"argumentQuality": X, "relevance": X, "evidence": X, "clarity": X, "rationale": "brief explanation"}`

  const prompt = `Topic: ${params.context.topic}
Phase: ${params.context.phase}
Rules: Max ${params.rules.maxMessageLength} words${params.rules.stayOnTopic ? ', stay on topic' : ''}${params.rules.noPersonalAttacks ? ', no personal attacks' : ''}

Message to score:
"${params.message.content}"

Recent context:
${params.context.recentMessages.map((m) => `- ${m.content.substring(0, 100)}`).join('\n')}

Provide your score as JSON:`

  try {
    const result = await generateMessage({
      provider: params.judgeProvider,
      model: params.judgeModel,
      system,
      prompt,
      temperature: 0.3,
      maxTokens: 300,
      apiKey: params.apiKey!,
    })

    if (result.error) {
      throw new Error(result.error)
    }

    // Parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid judge response')
    }

    const scores = JSON.parse(jsonMatch[0])
    const total =
      scores.argumentQuality + scores.relevance + scores.evidence + scores.clarity

    return {
      total: Math.min(10, Math.max(0, total)),
      argumentQuality: scores.argumentQuality,
      relevance: scores.relevance,
      evidence: scores.evidence,
      clarity: scores.clarity,
      rationale: scores.rationale || 'AI judge score',
    }
  } catch (error) {
    console.error('AI judge error, falling back to heuristic:', error)
    return scoreWithHeuristic(params)
  }
}

function scoreWithHeuristic(params: JudgeParams): MessageScore {
  const content = params.message.content
  const words = content.split(/\s+/).length

  // Argument Quality (0-4): based on length and structure
  let argumentQuality = 0
  if (words >= 30) argumentQuality += 1
  if (words >= 60) argumentQuality += 1
  if (content.includes('because') || content.includes('therefore')) argumentQuality += 1
  if (content.match(/\b(research|study|data|evidence)\b/i)) argumentQuality += 1

  // Relevance (0-2): keyword matching with topic
  let relevance = 1 // baseline
  const topicWords = params.context.topic.toLowerCase().split(/\s+/)
  const contentLower = content.toLowerCase()
  const matchCount = topicWords.filter((word) => contentLower.includes(word)).length
  if (matchCount >= topicWords.length / 2) relevance = 2

  // Evidence (0-2): look for examples and citations
  let evidence = 0
  if (content.match(/\b(for example|such as|according to)\b/i)) evidence += 1
  if (content.match(/\b(study|research|report|survey)\b/i)) evidence += 1

  // Check for fake citations if rule is on
  if (params.rules.noFakeCitations) {
    if (content.match(/\b(study|research).*\b(showed|found|demonstrated)\b/i)) {
      // Penalize vague claims without specifics
      if (!content.match(/\b(university|journal|institute|organization)\b/i)) {
        evidence = Math.max(0, evidence - 1)
      }
    }
  }

  // Clarity (0-2): structure and brevity
  let clarity = 0
  if (words <= params.rules.maxMessageLength) clarity += 1
  if (content.match(/[.!?].*[.!?]/)) clarity += 1 // multiple sentences

  // Check for personal attacks
  if (params.rules.noPersonalAttacks) {
    if (content.match(/\b(stupid|idiot|fool|ignorant|dumb)\b/i)) {
      argumentQuality = Math.max(0, argumentQuality - 2)
    }
  }

  const total = argumentQuality + relevance + evidence + clarity

  return {
    total: Math.min(10, Math.max(0, total)),
    argumentQuality,
    relevance,
    evidence,
    clarity,
    rationale: 'Heuristic judge: scored based on structure, length, and keyword analysis',
  }
}

// Select best message from a batch
export function selectBestMessage(
  messages: DebateMessage[],
  scoredMessages: Map<string, MessageScore>
): DebateMessage | null {
  if (messages.length === 0) return null

  let bestMessage = messages[0]
  let bestScore = scoredMessages.get(bestMessage.id)?.total || 0

  for (const message of messages.slice(1)) {
    const score = scoredMessages.get(message.id)?.total || 0
    if (score > bestScore) {
      bestScore = score
      bestMessage = message
    }
  }

  return bestMessage
}
