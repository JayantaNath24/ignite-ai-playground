import { ModelConfig } from '@/lib/types';

/**
 * MODELS CONFIGURATION
 * 
 * Replace or customize these four model placeholders according to your providers,
 * accounts, and budget. Model IDs and capabilities are read from this file and
 * can be overridden via environment variables.
 */
export const MODELS_CONFIG: ModelConfig[] = [
  // =========================================================================
  // 1. FAST MODEL — Optimized for ultra-low latency interactive dialogue
  // =========================================================================
  {
    id: 'fast-model',
    name: 'Fast Model (Low Latency)',
    category: 'fast',
    provider: (process.env.MODEL_FAST_PROVIDER as any) || 'groq',
    // PLACEHOLDER: Replace with your fast model ID (e.g. llama-3.1-8b-instant, gpt-4o-mini)
    upstreamModelId: process.env.MODEL_FAST_ID || 'llama-3.1-8b-instant',
    description: 'Ultra-low latency model engineered for instant interactive speed.',
    badge: 'Fast / Sub-second',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    pricing: {
      promptPer1M: 0.05,
      completionPer1M: 0.08,
    },
    supportedSettings: {
      temperature: true,
      topP: true,
      maxTokens: true,
    },
    defaultSettings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      stream: true,
    },
  },

  // =========================================================================
  // 2. REASONING MODEL — Optimized for coding, math, and deep logical analysis
  // =========================================================================
  {
    id: 'reasoning-model',
    name: 'Reasoning Model (Deep Thought)',
    category: 'reasoning',
    provider: (process.env.MODEL_REASONING_PROVIDER as any) || 'groq',
    // PLACEHOLDER: Replace with your reasoning model ID (e.g. deepseek-r1-distill-llama-70b, o1-mini)
    upstreamModelId: process.env.MODEL_REASONING_ID || 'deepseek-r1-distill-llama-70b',
    description: 'Excels at complex coding, step-by-step logic, and analytical problem-solving.',
    badge: 'Reasoning & Code',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    pricing: {
      promptPer1M: 0.59,
      completionPer1M: 0.79,
    },
    supportedSettings: {
      temperature: true,
      topP: true,
      maxTokens: true,
    },
    defaultSettings: {
      temperature: 0.6,
      maxTokens: 4096,
      topP: 0.95,
      stream: true,
    },
  },

  // =========================================================================
  // 3. BUDGET MODEL — Optimized for cost efficiency and general-purpose tasks
  // =========================================================================
  {
    id: 'budget-model',
    name: 'Budget Model (Cost Efficient)',
    category: 'budget',
    provider: (process.env.MODEL_BUDGET_PROVIDER as any) || 'groq',
    // PLACEHOLDER: Replace with your budget model ID (e.g. llama-3.3-70b-versatile, gpt-3.5-turbo)
    upstreamModelId: process.env.MODEL_BUDGET_ID || 'llama-3.3-70b-versatile',
    description: 'High capability model with cost-effective pricing for everyday workloads.',
    badge: 'Economical',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    pricing: {
      promptPer1M: 0.15,
      completionPer1M: 0.30,
    },
    supportedSettings: {
      temperature: true,
      topP: true,
      maxTokens: true,
    },
    defaultSettings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      stream: true,
    },
  },

  // =========================================================================
  // 4. VISION MODEL — Accepts image input alongside text
  // =========================================================================
  {
    id: 'vision-model',
    name: 'Vision Model (Multimodal)',
    category: 'vision',
    provider: (process.env.MODEL_VISION_PROVIDER as any) || 'groq',
    // PLACEHOLDER: Replace with your vision model ID (e.g. llama-3.2-11b-vision-preview, gpt-4o)
    upstreamModelId: process.env.MODEL_VISION_ID || 'llama-3.2-11b-vision-preview',
    description: 'Multimodal model capable of processing and analyzing image attachments.',
    badge: 'Multimodal / Vision',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: true,
    pricing: {
      promptPer1M: 0.18,
      completionPer1M: 0.18,
    },
    supportedSettings: {
      temperature: true,
      topP: true,
      maxTokens: true,
    },
    defaultSettings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      stream: true,
    },
  },
];

export function getModelById(id: string): ModelConfig | undefined {
  return MODELS_CONFIG.find((m) => m.id === id);
}
