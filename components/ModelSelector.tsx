'use client';

import React from 'react';
import { Zap, Brain, DollarSign, Eye, AlertCircle } from 'lucide-react';
import { ModelCategory, ModelStatusSummary } from '@/lib/types';

interface ModelSelectorProps {
  models: ModelStatusSummary[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

const CATEGORY_ICONS: Record<ModelCategory, React.ElementType> = {
  fast: Zap,
  reasoning: Brain,
  budget: DollarSign,
  vision: Eye,
};

const CATEGORY_THEMES: Record<
  ModelCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  fast: {
    label: 'Fast',
    color: '#fb923c',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.35)',
  },
  reasoning: {
    label: 'Reasoning',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.35)',
  },
  budget: {
    label: 'Budget',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
  },
  vision: {
    label: 'Vision',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.35)',
  },
};

export function ModelSelector({ models, selectedModelId, onSelectModel }: ModelSelectorProps) {
  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <div className="space-y-3">
      {/* 4 Models Segmented Bar */}
      <div
        role="radiogroup"
        aria-label="Select model"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-xl border border-surface-300"
        style={{ background: '#18140f' }}
      >
        {models.map((model) => {
          const isSelected = model.id === selectedModelId;
          const theme = CATEGORY_THEMES[model.category] || CATEGORY_THEMES.fast;
          const Icon = CATEGORY_ICONS[model.category] || Zap;

          return (
            <button
              key={model.id}
              role="radio"
              aria-checked={isSelected}
              type="button"
              onClick={() => onSelectModel(model.id)}
              className="p-2.5 rounded-lg text-left transition-all flex flex-col gap-1.5"
              style={
                isSelected
                  ? {
                      background: '#221c15',
                      border: `1px solid rgba(249,115,22,0.6)`,
                      boxShadow: '0 0 12px -3px rgba(249,115,22,0.2)',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                    }
              }
            >
              {/* Badge row */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                  style={{ color: theme.color, background: theme.bg, borderColor: theme.border }}
                >
                  <Icon className="w-3 h-3" />
                  {theme.label}
                </span>
                <span
                  title={model.isConfigured ? 'Ready' : 'API key required'}
                  className="w-2 h-2 rounded-full ring-2"
                  style={
                    model.isConfigured
                      ? { background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }
                      : { background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.4)' }
                  }
                />
              </div>

              {/* Name & ID */}
              <div>
                <p className="font-semibold text-xs text-slate-100 truncate">{model.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{model.upstreamModelId}</p>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between text-[10px] text-slate-400 pt-1"
                style={{ borderTop: '1px solid #2e2419' }}
              >
                <span className="uppercase font-medium">{model.provider}</span>
                <span>{model.contextWindow ? `${Math.round(model.contextWindow / 1000)}k ctx` : 'Std'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Setup warning for selected model */}
      {selectedModel && !selectedModel.isConfigured && (
        <div
          className="p-3 rounded-xl flex items-start gap-2.5 text-xs"
          style={{
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.3)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f97316' }} />
          <div>
            <span className="font-semibold" style={{ color: '#fb923c' }}>
              Setup Required — {selectedModel.name}:{' '}
            </span>
            <span style={{ color: '#fde8d0' }}>
              {selectedModel.setupHint || 'Add required provider API key to .env.local to enable this model.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
