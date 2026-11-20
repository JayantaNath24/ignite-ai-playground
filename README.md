# 🔥 Ignite AI Playground

A polished, high-performance, responsive AI playground website inspired by the general workflow of modern LLM consoles (such as Groq Playground). Built with Next.js (App Router), TypeScript, and Tailwind CSS with a distinctive warm dark & orange aesthetic.

Features an **original visual design and branding**, a modular **provider-adapter architecture**, live streaming output with Server-Sent Events, real-time request metrics (TTFT, tokens/sec, cost estimation), local conversation history, and zero frontend secrets.

---

## Key Features

- **Four Configurable Model Slots**:
  1. **Fast Model**: Low-latency interactive dialogue (default: `llama-3.1-8b-instant` via Groq)
  2. **Reasoning Model**: Deep logical analysis and coding (default: `deepseek-r1-distill-llama-70b` via Groq)
  3. **Budget Model**: Cost-effective general workload (default: `llama-3.3-70b-versatile` via Groq)
  4. **Vision Model**: Multimodal image attachment processing (default: `llama-3.2-11b-vision-preview` via Groq)
- **Status & Setup Hint System**: If a provider API key is not configured, models are clearly tagged as *Setup Needed* with instructions on what key to add. Works smoothly with fewer than 4 configured models.
- **Provider-Adapter Architecture**: Supports Groq, OpenAI, Anthropic, and generic OpenAI-compatible backends (e.g., local Ollama, vLLM) through normalized interfaces without altering the UI.
- **Conversation Editor**: Add, edit, reorder (move up/down), and delete `system`, `user`, and `assistant` messages. Attach images to user prompts for vision models.
- **Real-Time Streaming**: Stream tokens as they arrive via Server-Sent Events (SSE) with immediate cancellation when the user clicks **Stop**.
- **Live Metrics**: Measures Total Time, Time to First Token (TTFT), Generation Speed (Tokens/s), Prompt/Completion tokens, and estimated cost. Shows "unavailable" if not returned by the provider.
- **API Code Panel**: Generates reproducible cURL, Python, and TypeScript/Node.js snippets for the current conversation and parameters. Never displays secrets.
- **Local History & Settings**: Automatically saves recent conversations and user parameter preferences in `localStorage` with rename, reload, and delete capabilities.
- **Security & Protection**: Server-side API key isolation, server input validation with Zod, and sliding-window rate limiting per IP.

---

## Getting Started

### 1. Prerequisites
- **Node.js** v18+ or v20+ / v22+
- **npm**, **pnpm**, or **yarn**

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment template to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your provider API key. For instance, to use Groq:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key
```

*(Optional: You can also configure `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `CUSTOM_BASE_URL` if you switch models to those providers.)*

### 4. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuring, Adding, or Replacing Models

All model definitions and display metadata are centralized in [`config/models.config.ts`](file:///Users/jayanta/GroqPlayground/config/models.config.ts).

### Modifying an Existing Model
Each model entry in `MODELS_CONFIG` contains:
```ts
{
  id: 'fast-model',
  name: 'Fast Model (Low Latency)',
  category: 'fast',
  provider: 'groq',                  // 'groq' | 'openai' | 'anthropic' | 'custom'
  upstreamModelId: 'llama-3.1-8b-instant', // Upstream provider model ID
  description: 'Ultra-low latency model engineered for instant interactive speed.',
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
}
```

### Adding a New Provider Adapter
To add a new provider (e.g., Mistral, Google Gemini, or a proprietary proxy):
1. Create a new adapter file in `lib/providers/your-provider-adapter.ts` implementing the `ProviderAdapter` interface defined in `lib/providers/adapter.ts`.
2. Register the adapter in `lib/providers/registry.ts`:
   ```ts
   this.register(new YourProviderAdapter());
   ```
3. Set `provider: 'your-provider'` on any model in `config/models.config.ts`.

---

## Production Disclaimer & Remaining Setup

> **Note**: This application is a fully functional MVP designed for local experimentation and playground workflows. It is **not claimed to be production-ready**.
> 
> Before deploying to a production environment:
> 1. **Provider Credentials**: Populate `.env.local` with verified provider API credentials with sufficient quota.
> 2. **Model Availability**: Ensure model IDs specified in `models.config.ts` are active and supported on your account tier.
> 3. **Persistent Rate Limiting & Auth**: For multi-user public deployments, replace the in-memory sliding window rate limiter (`lib/rate-limiter.ts`) with a distributed cache (such as Redis / Upstash) and integrate user authentication.
