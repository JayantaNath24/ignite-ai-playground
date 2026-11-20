import { ChatMessage, GenerationSettings, ModelConfig, RequestMetrics } from '@/lib/types';
import { ProviderAdapter } from './adapter';

export class OpenAIAdapter implements ProviderAdapter {
  id = 'openai';
  name = 'OpenAI';

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
  }

  getSetupHint(model: ModelConfig): string {
    return `To enable "${model.name}", set OPENAI_API_KEY in your .env.local file. (Get a key at platform.openai.com)`;
  }

  async chat(
    model: ModelConfig,
    messages: ChatMessage[],
    settings: GenerationSettings,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(`Provider "openai" is not configured. Missing OPENAI_API_KEY.`);
    }

    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    const formattedMessages = messages.map((m) => {
      if (m.images && m.images.length > 0 && model.supportsVision) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content || '' },
            ...m.images.map((img) => ({
              type: 'image_url',
              image_url: { url: img },
            })),
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const payload: Record<string, any> = {
      model: model.upstreamModelId,
      messages: formattedMessages,
      temperature: settings.temperature,
      max_tokens: Math.min(settings.maxTokens, model.maxOutputTokens),
      top_p: settings.topP,
      stream: settings.stream,
    };

    if (settings.stream) {
      payload.stream_options = { include_usage: true };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      let errorDetail = `OpenAI API returned HTTP ${response.status}`;
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
      const text = data.choices?.[0]?.message?.content || '';
      const usage = data.usage;
      const totalTimeMs = Date.now() - startTime;

      let estimatedCost: number | null = null;
      if (model.pricing && usage) {
        const promptCost = ((usage.prompt_tokens || 0) / 1_000_000) * (model.pricing.promptPer1M || 0);
        const completionCost = ((usage.completion_tokens || 0) / 1_000_000) * (model.pricing.completionPer1M || 0);
        estimatedCost = Number((promptCost + completionCost).toFixed(6));
      }

      const metrics: RequestMetrics = {
        timeToFirstTokenMs: totalTimeMs,
        totalTimeMs,
        promptTokens: usage?.prompt_tokens ?? null,
        completionTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        tokensPerSecond: usage?.completion_tokens ? Number(((usage.completion_tokens / (totalTimeMs / 1000))).toFixed(1)) : null,
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
      throw new Error('OpenAI response body is not readable.');
    }

    return new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = '';
        let promptTokens: number | null = null;
        let completionTokens: number | null = null;
        let totalTokens: number | null = null;

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
                if (dataStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    if (firstTokenTime === null) {
                      firstTokenTime = Date.now();
                    }
                    controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: delta })}\n\n`));
                  }

                  if (parsed.usage) {
                    promptTokens = parsed.usage.prompt_tokens ?? promptTokens;
                    completionTokens = parsed.usage.completion_tokens ?? completionTokens;
                    totalTokens = parsed.usage.total_tokens ?? totalTokens;
                  }
                } catch {
                  // Partial or malformed SSE line
                }
              }
            }
          }

          const totalTimeMs = Date.now() - startTime;
          const ttft = firstTokenTime ? firstTokenTime - startTime : null;

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
