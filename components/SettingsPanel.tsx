'use client';

import React from 'react';
import { Sliders, RotateCcw, Info } from 'lucide-react';
import { GenerationSettings, ModelConfig } from '@/lib/types';

interface SettingsPanelProps {
  settings: GenerationSettings;
  model: ModelConfig;
  onUpdateSetting: <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => void;
  onResetDefaults: () => void;
}

export function SettingsPanel({ settings, model, onUpdateSetting, onResetDefaults }: SettingsPanelProps) {
  const supported = model.supportedSettings;

  const inputClass =
    'px-2 py-0.5 rounded text-right font-mono text-xs focus:outline-none transition-colors bg-surface-200 border border-surface-300 text-orange-300';

  return (
    <div className="bg-surface-100 border border-surface-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-300 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4" style={{ color: '#f97316' }} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Parameters</h2>
        </div>
        <button
          type="button"
          onClick={onResetDefaults}
          aria-label="Reset to defaults"
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-orange-400 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="space-y-5">
        {/* Temperature */}
        {supported.temperature && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="param-temperature" className="font-medium text-slate-300 flex items-center gap-1">
                Temperature
                <span title="Controls randomness: lower = deterministic, higher = creative.">
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </label>
              <input
                type="number" min={0} max={2} step={0.05}
                value={settings.temperature}
                onChange={(e) => onUpdateSetting('temperature', Math.max(0, Math.min(2, parseFloat(e.target.value) || 0)))}
                className={`w-16 ${inputClass}`}
              />
            </div>
            <input
              id="param-temperature" type="range" min={0} max={2} step={0.05}
              value={settings.temperature}
              onChange={(e) => onUpdateSetting('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 (Precise)</span><span>1.0</span><span>2.0 (Creative)</span>
            </div>
          </div>
        )}

        {/* Max Tokens */}
        {supported.maxTokens && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="param-maxtokens" className="font-medium text-slate-300 flex items-center gap-1">
                Max Output Tokens
                <span title="Upper limit on completion tokens generated.">
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </label>
              <input
                type="number" min={1} max={model.maxOutputTokens} step={128}
                value={settings.maxTokens}
                onChange={(e) => onUpdateSetting('maxTokens', Math.max(1, Math.min(model.maxOutputTokens, parseInt(e.target.value, 10) || 1)))}
                className={`w-20 ${inputClass}`}
              />
            </div>
            <input
              id="param-maxtokens" type="range" min={1} max={model.maxOutputTokens} step={128}
              value={settings.maxTokens}
              onChange={(e) => onUpdateSetting('maxTokens', parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1</span><span>Max: {model.maxOutputTokens}</span>
            </div>
          </div>
        )}

        {/* Top P */}
        {supported.topP && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="param-topp" className="font-medium text-slate-300 flex items-center gap-1">
                Top P
                <span title="Nucleus sampling probability threshold.">
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </label>
              <input
                type="number" min={0} max={1} step={0.05}
                value={settings.topP}
                onChange={(e) => onUpdateSetting('topP', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                className={`w-16 ${inputClass}`}
              />
            </div>
            <input
              id="param-topp" type="range" min={0} max={1} step={0.05}
              value={settings.topP}
              onChange={(e) => onUpdateSetting('topP', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {/* Stream Toggle */}
        {model.supportsStreaming ? (
          <div className="pt-3 border-t border-surface-300 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Stream Output</span>
              <span className="text-[11px] text-slate-400">Live real-time token delivery</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.stream}
              onClick={() => onUpdateSetting('stream', !settings.stream)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none"
              style={{ background: settings.stream ? '#f97316' : '#2e2419' }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
                style={{ transform: settings.stream ? 'translateX(1.1rem)' : 'translateX(0.1rem)' }}
              />
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-surface-300 text-xs text-slate-500 italic">
            Streaming not supported by this model.
          </div>
        )}
      </div>
    </div>
  );
}
