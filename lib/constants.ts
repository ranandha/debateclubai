import { DebateTopic } from '@/types'

export const DEBATE_TOPICS: DebateTopic[] = [
  {
    id: 'ai-jobs',
    title: 'AI will create more jobs than it destroys',
    description: 'Debate the economic impact of artificial intelligence on employment.',
  },
  {
    id: 'remote-work',
    title: 'Remote work is better for society than office work',
    description: 'Discuss the societal benefits and drawbacks of remote versus office work.',
  },
  {
    id: 'social-media',
    title: 'Social media does more harm than good',
    description: 'Examine the overall impact of social media on individuals and society.',
  },
  {
    id: 'electric-vehicles',
    title: 'Electric vehicles are the best path to reduce emissions',
    description: 'Evaluate electric vehicles as a solution to climate change.',
  },
  {
    id: 'ai-regulation',
    title: 'Governments should regulate AI models heavily',
    description: 'Debate the role of government regulation in AI development.',
  },
  {
    id: 'ubi',
    title: 'Universal basic income should be adopted',
    description: 'Discuss the feasibility and benefits of universal basic income.',
  },
  {
    id: 'privacy',
    title: 'Privacy is more important than personalization',
    description: 'Weigh the trade-offs between privacy and personalized services.',
  },
  {
    id: 'nuclear-energy',
    title: 'Nuclear energy is necessary for a clean future',
    description: 'Examine nuclear power as a solution to energy and climate challenges.',
  },
  {
    id: 'space-exploration',
    title: 'Space exploration funding is worth it',
    description: 'Debate the value and priorities of space exploration spending.',
  },
  {
    id: 'project-based-learning',
    title: 'Schools should replace exams with project-based evaluation',
    description: 'Discuss alternative assessment methods in education.',
  },
]

export const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.0-flash-lite', 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  mistral: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
  xai: ['grok-3-beta', 'grok-beta', 'grok-2-latest'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
}

export const ROLE_STYLES = [
  { value: 'aggressive', label: 'Aggressive', description: 'Direct and forceful arguments' },
  { value: 'analytical', label: 'Analytical', description: 'Data-driven and logical' },
  { value: 'diplomatic', label: 'Diplomatic', description: 'Balanced and respectful' },
  { value: 'passionate', label: 'Passionate', description: 'Emotional and compelling' },
]

export const DEBATE_FORMATS = [
  {
    value: 'classic',
    label: 'Classic',
    duration: 10,
    description: 'Traditional debate format with all phases',
  },
  {
    value: 'fast',
    label: 'Fast',
    duration: 5,
    description: 'Quick-fire debate with shorter phases',
  },
  {
    value: 'freeform',
    label: 'Freeform',
    duration: 15,
    description: 'Extended debate with flexible structure',
  },
]

export const PHASE_DURATIONS: Record<string, Record<string, number>> = {
  classic: {
    opening: 2 * 60 * 1000,
    rebuttals: 4 * 60 * 1000,
    'cross-exam': 2 * 60 * 1000,
    closing: 2 * 60 * 1000,
  },
  fast: {
    opening: 1 * 60 * 1000,
    rebuttals: 2 * 60 * 1000,
    'cross-exam': 1 * 60 * 1000,
    closing: 1 * 60 * 1000,
  },
  freeform: {
    opening: 3 * 60 * 1000,
    rebuttals: 6 * 60 * 1000,
    'cross-exam': 3 * 60 * 1000,
    closing: 3 * 60 * 1000,
  },
}

export const PARTICIPANT_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EF4444', // red
  '#06B6D4', // cyan
  '#F97316', // orange
]
