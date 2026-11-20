import { NextRequest, NextResponse } from 'next/server';
import { getModelById } from '@/config/models.config';
import { providerRegistry } from '@/lib/providers/registry';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ChatRequestSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Basic IP or session rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please try again in ${rateLimit.resetSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetSeconds),
        },
      }
    );
  }

  // 2. Request size limit check (approx 10MB)
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Payload too large. Maximum request size is 10MB.' },
      { status: 413 }
    );
  }

  // 3. Body parsing and validation
  let bodyJson: any;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload in request body.' },
      { status: 400 }
    );
  }

  const parseResult = ChatRequestSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const { modelId, messages, settings } = parseResult.data;

  // 4. Model configuration lookup
  const model = getModelById(modelId);
  if (!model) {
    return NextResponse.json(
      { error: `Model "${modelId}" is not recognized or not found in models.config.` },
      { status: 404 }
    );
  }

  // 5. Provider lookup and configuration check
  const adapter = providerRegistry.get(model.provider);
  if (!adapter) {
    return NextResponse.json(
      { error: `Provider "${model.provider}" has no registered adapter.` },
      { status: 500 }
    );
  }

  if (!adapter.isConfigured()) {
    const setupHint = adapter.getSetupHint(model);
    return NextResponse.json(
      {
        error: `Model "${model.name}" is currently unavailable because the provider "${model.provider}" is not configured.`,
        setupHint,
      },
      { status: 503 }
    );
  }

  // 6. Check vision capability
  const hasImages = messages.some((m) => m.images && m.images.length > 0);
  if (hasImages && !model.supportsVision) {
    return NextResponse.json(
      { error: `Model "${model.name}" does not support image inputs.` },
      { status: 400 }
    );
  }

  // 7. Route request to adapter with cancellation propagation
  try {
    const stream = await adapter.chat(
      model,
      messages.map((m, idx) => ({
        id: m.id || String(idx),
        role: m.role,
        content: m.content,
        images: m.images,
      })),
      settings,
      req.signal
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    // Sanitize error: never leak API keys or sensitive URLs
    let safeMessage = err.message || 'An error occurred while generating a response.';
    safeMessage = safeMessage.replace(/(Bearer\s+[A-Za-z0-9_.-]+)|(gsk_[A-Za-z0-9]+)|(sk-[A-Za-z0-9]+)/gi, '[REDACTED_KEY]');

    return NextResponse.json(
      { error: safeMessage },
      { status: 500 }
    );
  }
}
