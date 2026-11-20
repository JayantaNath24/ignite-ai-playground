import { ChatMessage, GenerationSettings, ModelConfig, RequestMetrics } from '@/lib/types';

export interface ProviderStreamChunk {
  type: 'chunk' | 'metrics' | 'error';
  text?: string;
  metrics?: Partial<RequestMetrics>;
  error?: string;
}

export interface ProviderAdapter {
  id: string;
  name: string;
  isConfigured(): boolean;
  getSetupHint(model: ModelConfig): string;
  chat(
    model: ModelConfig,
    messages: ChatMessage[],
    settings: GenerationSettings,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
}
