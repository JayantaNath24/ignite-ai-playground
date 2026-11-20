import { ChatMessage, GenerationSettings, ModelConfig, RequestMetrics } from '@/lib/types';
import { ProviderAdapter } from './adapter';

export class AnthropicAdapter implements ProviderAdapter {
  id = 'anthropic';
  name = 'Anthropic';

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
  }

  getSetupHint(model: ModelConfig): string {
    return `To enable "${model.name}", set ANTHROPIC_API_KEY in your .env.local file. (Get a key at console.anthropic.com)`;
  }

  async chat(
    model: ModelConfig,
    messages: ChatMessage[],
    settings: GenerationSettings,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(`Provider "anthropic" is not configured. Missing ANTHROPIC_API_KEY.`);
    }

    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    // Separate system messages for Anthropic
    const systemMessages = messages.filter((m) => m.role === 'system');
    const systemPrompt = systemMessages.map((m) => m.content).join('\n\n');

    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => {
        if (m.images && m.images.length > 0 && model.supportsVision) {
          const contentBlocks: any[] = [];
          for (const img of m.images) {
            // Check if base64 data url
            if (img.startsWith('data:')) {
              const [header, base64Data] = img.split(';base64,');
              const mediaType = header.replace('data:', '');
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              });
            } else {
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'url',
                  url: img,
                },
              });
            }
          }
          if (m.content) {
            contentBlocks.push({ type: 'text', text: m.content });
          }
          return {
            role: m.role,
            content: contentBlocks,
          };
        }
        return {
          role: m.role,
          content: m.content,
        };
      });

    const payload: Record<string, any> = {
      model: model.upstreamModelId,
      messages: conversationMessages,
      max_tokens: Math.min(settings.maxTokens, model.maxOutputTokens),
      temperature: settings.temperature,
      top_p: settings.topP,
      stream: settings.stream,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      let errorDetail = `Anthropic API returned HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch {
        // ignore parse error
      }
      throw new Error(errorDetail);
    }

    const encoder = new TextEncoder();

    if (!settings.stream) {
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const usage = data.usage;
      const totalTimeMs = Date.now() - startTime;

      let estimatedCost: number | null = null;
      if (model.pricing && usage) {
        const promptCost = ((usage.input_tokens || 0) / 1_000_000) * (model.pricing.promptPer1M || 0);
        const completionCost = ((usage.output_tokens || 0) / 1_000_000) * (model.pricing.completionPer1M || 0);
        estimatedCost = Number((promptCost + completionCost).toFixed(6));
      }

      const metrics: RequestMetrics = {
        timeToFirstTokenMs: totalTimeMs,
        totalTimeMs,
        promptTokens: usage?.input_tokens ?? null,
        completionTokens: usage?.output_tokens ?? null,
        totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0) || null,
        tokensPerSecond: usage?.output_tokens ? Number(((usage.output_tokens / (totalTimeMs / 1000))).toFixed(1)) : null,
        estimatedCostUsd: estimatedCost,
      };

      return new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`));
          controller.enqueue(encoder.encode(`event: metrics\ndata: ${JSON.stringify(metrics)}\n\n`));
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          controller.close();
        },
      });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Anthropic response body is not readable.');
    }

    return new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = '';
        let promptTokens: number | null = null;
        let completionTokens: number | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === 'message_start' && parsed.message?.usage) {
                    promptTokens = parsed.message.usage.input_tokens ?? promptTokens;
                  }
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    if (firstTokenTime === null) {
                      firstTokenTime = Date.now();
                    }
                    controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                  }
                  if (parsed.type === 'message_delta' && parsed.usage?.output_tokens) {
                    completionTokens = parsed.usage.output_tokens;
                  }
                } catch {
                  // Partial chunk
                }
              }
            }
          }

          const totalTimeMs = Date.now() - startTime;
          const ttft = firstTokenTime ? firstTokenTime - startTime : null;
          const totalTokens = (promptTokens || 0) + (completionTokens || 0) || null;

          let estimatedCost: number | null = null;
          if (model.pricing && promptTokens !== null && completionTokens !== null) {
            const promptCost = (promptTokens / 1_000_000) * (model.pricing.promptPer1M || 0);
            const completionCost = (completionTokens / 1_000_000) * (model.pricing.completionPer1M || 0);
            estimatedCost = Number((promptCost + completionCost).toFixed(6));
          }

          const speed = completionTokens && totalTimeMs > 0
            ? Number((completionTokens / (totalTimeMs / 1000)).toFixed(1))
            : null;

          const metrics: RequestMetrics = {
            timeToFirstTokenMs: ttft,
            totalTimeMs,
            promptTokens,
            completionTokens,
            totalTokens,
            tokensPerSecond: speed,
            estimatedCostUsd: estimatedCost,
          };

          controller.enqueue(encoder.encode(`event: metrics\ndata: ${JSON.stringify(metrics)}\n\n`));
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          controller.close();
        } catch (err: any) {
          if (err.name === 'AbortError') {
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Stream read error' })}\n\n`));
          controller.close();
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  }
}
