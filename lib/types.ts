export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  images?: string[]; // base64 data URLs or image URLs for vision models
}

export interface GenerationSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  stream: boolean;
}

export type ModelCategory = 'fast' | 'reasoning' | 'budget' | 'vision';
export type ProviderType = 'groq' | 'openai' | 'anthropic' | 'custom';

export interface ModelPricing {
  promptPer1M?: number;     // USD per million prompt tokens
  completionPer1M?: number; // USD per million completion tokens
}

export interface ModelConfig {
  id: string;
  name: string;
  category: ModelCategory;
  provider: ProviderType;
  upstreamModelId: string;
  description: string;
  badge?: string;
  contextWindow?: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  pricing?: ModelPricing;
  supportedSettings: {
    temperature: boolean;
    topP: boolean;
    maxTokens: boolean;
  };
  defaultSettings: GenerationSettings;
}

export interface ModelStatusSummary extends ModelConfig {
  isConfigured: boolean;
  setupHint?: string;
}

export interface RequestMetrics {
  timeToFirstTokenMs: number | null;
  totalTimeMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  tokensPerSecond: number | null;
  estimatedCostUsd: number | null;
}

export interface ConversationHistoryItem {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
  settings: GenerationSettings;
  updatedAt: number;
}
