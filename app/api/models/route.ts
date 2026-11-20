import { NextResponse } from 'next/server';
import { MODELS_CONFIG } from '@/config/models.config';
import { providerRegistry } from '@/lib/providers/registry';
import { ModelStatusSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models: ModelStatusSummary[] = MODELS_CONFIG.map((model) => {
    const status = providerRegistry.checkModelStatus(model);
    return {
      ...model,
      isConfigured: status.isConfigured,
      setupHint: status.setupHint,
    };
  });

  return NextResponse.json({
    models,
  });
}
