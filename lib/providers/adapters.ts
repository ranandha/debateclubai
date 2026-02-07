// AI Provider adapters

import { AIProvider } from '@/types'

export interface GenerateMessageParams {
  provider: AIProvider
  model: string
  system: string
  prompt: string
  temperature: number
  maxTokens: number
  apiKey: string
}

export interface GenerateMessageResult {
  text: string
  error?: string
}

// OpenAI adapter
export async function generateOpenAI(
  params: Omit<GenerateMessageParams, 'provider'>
): Promise<GenerateMessageResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return { text: data.choices[0].message.content }
  } catch (error) {
    return { text: '', error: String(error) }
  }
}

// Gemini adapter
export async function generateGemini(
  params: Omit<GenerateMessageParams, 'provider'>
): Promise<GenerateMessageResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${params.system}\n\n${params.prompt}` }],
            },
          ],
          generationConfig: {
            temperature: params.temperature,
            maxOutputTokens: params.maxTokens,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return { text: data.candidates[0].content.parts[0].text }
  } catch (error) {
    return { text: '', error: String(error) }
  }
}

// Mistral adapter
export async function generateMistral(
  params: Omit<GenerateMessageParams, 'provider'>
): Promise<GenerateMessageResult> {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`)
    }

    const data = await response.json()
    return { text: data.choices[0].message.content }
  } catch (error) {
    return { text: '', error: String(error) }
  }
}

// xAI adapter
export async function generateXAI(
  params: Omit<GenerateMessageParams, 'provider'>
): Promise<GenerateMessageResult> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`xAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return { text: data.choices[0].message.content }
  } catch (error) {
    return { text: '', error: String(error) }
  }
}

// DeepSeek adapter
export async function generateDeepSeek(
  params: Omit<GenerateMessageParams, 'provider'>
): Promise<GenerateMessageResult> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`)
    }

    const data = await response.json()
    return { text: data.choices[0].message.content }
  } catch (error) {
    return { text: '', error: String(error) }
  }
}

// Main generate function
export async function generateMessage(
  params: GenerateMessageParams
): Promise<GenerateMessageResult> {
  switch (params.provider) {
    case 'openai':
      return generateOpenAI(params)
    case 'gemini':
      return generateGemini(params)
    case 'mistral':
      return generateMistral(params)
    case 'xai':
      return generateXAI(params)
    case 'deepseek':
      return generateDeepSeek(params)
    default:
      return { text: '', error: `Unknown provider: ${params.provider}` }
  }
}

// Mock response for demo mode
export function generateMockMessage(participantName: string, _phase: string): string {
  const templates = [
    `As ${participantName}, I believe this topic requires careful consideration. The evidence clearly shows...`,
    `Let me address the previous point. While I understand the concern, the data suggests...`,
    `This is a critical issue. From my perspective, we need to examine...`,
    `I respectfully disagree with the previous argument. Here's why...`,
    `Building on that point, I'd like to add that research indicates...`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}
