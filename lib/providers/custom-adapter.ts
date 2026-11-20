import { ChatMessage, GenerationSettings, ModelConfig, RequestMetrics } from '@/lib/types';
import { ProviderAdapter } from './adapter';

export class CustomOpenAICompatibleAdapter implements ProviderAdapter {
  id = 'custom';
  name = 'Custom (OpenAI-Compatible)';

  isConfigured(): boolean {
    return Boolean(process.env.CUSTOM_BASE_URL && process.env.CUSTOM_BASE_URL.trim().length > 0);
  }

  getSetupHint(model: ModelConfig): string {
    return `To enable "${model.name}", set CUSTOM_BASE_URL (and optionally CUSTOM_API_KEY) in your .env.local file.`;
  }

  async chat(
    model: ModelConfig,
    messages: ChatMessage[],
    settings: GenerationSettings,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const baseUrl = (process.env.CUSTOM_BASE_URL || 'http://localhost:11434/v1').replace(/\/$/, '');
    const apiKey = process.env.CUSTOM_API_KEY || 'dummy-key';
    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const payload: Record<string, any> = {
      model: model.upstreamModelId,
      messages: formattedMessages,
      temperature: settings.temperature,
      max_tokens: Math.min(settings.maxTokens, model.maxOutputTokens),
      top_p: settings.topP,
      stream: settings.stream,
    };

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
      let errorDetail = `Custom API returned HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch {
        // ignore
      }
      throw new Error(errorDetail);
    }

    const encoder = new TextEncoder();

    if (!settings.stream) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const usage = data.usage;
      const totalTimeMs = Date.now() - startTime;

      const metrics: RequestMetrics = {
        timeToFirstTokenMs: totalTimeMs,
        totalTimeMs,
        promptTokens: usage?.prompt_tokens ?? null,
        completionTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        tokensPerSecond: usage?.completion_tokens ? Number(((usage.completion_tokens / (totalTimeMs / 1000))).toFixed(1)) : null,
        estimatedCostUsd: null,
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
      throw new Error('Custom provider response body is not readable.');
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
                  // Ignore parse error
                }
              }
            }
          }

          const totalTimeMs = Date.now() - startTime;
          const ttft = firstTokenTime ? firstTokenTime - startTime : null;
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
            estimatedCostUsd: null,
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
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Stream error' })}\n\n`));
          controller.close();
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  }
}
