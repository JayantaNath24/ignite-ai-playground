import { ModelConfig, ProviderType } from '@/lib/types';
import { ProviderAdapter } from './adapter';
import { GroqAdapter } from './groq-adapter';
import { OpenAIAdapter } from './openai-adapter';
import { AnthropicAdapter } from './anthropic-adapter';
import { CustomOpenAICompatibleAdapter } from './custom-adapter';

class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor() {
    this.register(new GroqAdapter());
    this.register(new OpenAIAdapter());
    this.register(new AnthropicAdapter());
    this.register(new CustomOpenAICompatibleAdapter());
  }

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(provider: string): ProviderAdapter | undefined {
    return this.adapters.get(provider);
  }

  checkModelStatus(model: ModelConfig): { isConfigured: boolean; setupHint?: string } {
    const adapter = this.get(model.provider);
    if (!adapter) {
      return {
        isConfigured: false,
        setupHint: `Unknown provider "${model.provider}". No adapter is registered.`,
      };
    }

    const configured = adapter.isConfigured();
    return {
      isConfigured: configured,
      setupHint: configured ? undefined : adapter.getSetupHint(model),
    };
  }
}

export const providerRegistry = new ProviderRegistry();
