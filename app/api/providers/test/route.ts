import { NextRequest, NextResponse } from 'next/server'
import { generateMessage } from '@/lib/providers/adapters'

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, model } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, message: 'Missing provider or API key' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    const result = await generateMessage({
      provider,
      model: model || 'default',
      system: 'You are a helpful assistant.',
      prompt: 'Say "API test successful" in exactly 3 words.',
      temperature: 0.3,
      maxTokens: 20,
      apiKey,
    })

    const latency = Date.now() - startTime

    if (result.error) {
      return NextResponse.json({
        success: false,
        message: result.error,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      latency,
      response: result.text,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: String(error),
      },
      { status: 500 }
    )
  }
}
