import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatMessage, GenerationSettings, ModelConfig } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return 'unavailable';
  return new Intl.NumberFormat().format(val);
}

export function formatTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return 'unavailable';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return 'unavailable';
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return `<$0.0001`;
  return `$${cost.toFixed(4)}`;
}

/**
 * Generate reproducible API code snippets for cURL, Python, and TypeScript.
 * NEVER leaks actual secrets; always uses generic placeholders or environment references.
 */
export function generateCodeSnippets(
  model: ModelConfig,
  messages: ChatMessage[],
  settings: GenerationSettings
) {
  const sanitizedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // 1. cURL Snippet
  const curlCode = `curl https://api.groq.com/openai/v1/chat/completions \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    {
      model: model.upstreamModelId,
      messages: sanitizedMessages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      top_p: settings.topP,
      stream: settings.stream,
    },
    null,
    2
  )}'`;

  // 2. Python Snippet
  const pythonCode = `import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY", "<YOUR_API_KEY>")
)

response = client.chat.completions.create(
    model="${model.upstreamModelId}",
    messages=${JSON.stringify(sanitizedMessages, null, 4)},
    temperature=${settings.temperature},
    max_tokens=${settings.maxTokens},
    top_p=${settings.topP},
    stream=${settings.stream ? 'True' : 'False'},
)

${
  settings.stream
    ? `for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`
    : `print(response.choices[0].message.content)`
}`;

  // 3. TypeScript / Node.js Snippet
  const tsCode = `import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "<YOUR_API_KEY>",
});

async function main() {
  const completion = await groq.chat.completions.create({
    model: "${model.upstreamModelId}",
    messages: ${JSON.stringify(sanitizedMessages, null, 4)},
    temperature: ${settings.temperature},
    max_tokens: ${settings.maxTokens},
    top_p: ${settings.topP},
    stream: ${settings.stream},
  });

  ${
    settings.stream
      ? `for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }`
      : `console.log(completion.choices[0]?.message?.content);`
  }
}

main().catch(console.error);`;

  return { curlCode, pythonCode, tsCode };
}
