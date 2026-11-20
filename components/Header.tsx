'use client';

import React from 'react';
import { Flame, Code2, History, SlidersHorizontal, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { ModelStatusSummary } from '@/lib/types';

interface HeaderProps {
  models: ModelStatusSummary[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onOpenHistory: () => void;
  onOpenCode: () => void;
  historyCount: number;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({
  models,
  selectedModelId,
  onSelectModel,
  onOpenHistory,
  onOpenCode,
  historyCount,
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <header className="border-b border-surface-300 bg-surface-100/90 backdrop-blur-md px-4 sm:px-6 py-2.5 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-glow"
            style={{ background: 'linear-gradient(135deg, #c2410c 0%, #f97316 60%, #fbbf24 100%)' }}
          >
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white">Ignite</span>
            <span
              className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase border"
              style={{
                background: 'rgba(249,115,22,0.12)',
                color: '#fb923c',
                borderColor: 'rgba(249,115,22,0.30)',
              }}
            >
              Playground
            </span>
          </div>
        </div>

        {/* Model Selector Dropdown */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm mx-2">
          <select
            aria-label="Select AI Model"
            value={selectedModelId}
            onChange={(e) => onSelectModel(e.target.value)}
            className="w-full appearance-none bg-surface-200 hover:bg-surface-300 border border-surface-300 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-slate-100 focus:outline-none transition-colors cursor-pointer"
            style={{ '--tw-ring-color': '#f97316' } as React.CSSProperties}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-surface-100 text-slate-100">
                {m.name}{!m.isConfigured ? ' — (Setup Needed)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-200 border border-surface-300 text-xs">
            {selectedModel?.isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                <span className="text-accent-emerald font-medium">Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
                <span className="font-medium" style={{ color: '#fb923c' }}>Setup Needed</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenCode}
            aria-label="View API code"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-surface-300 text-xs font-medium text-slate-200 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
            <span className="hidden sm:inline">API</span> Code
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="Conversation history"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-surface-300 text-xs font-medium text-slate-200 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-accent-violet" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border"
                style={{
                  background: 'rgba(249,115,22,0.15)',
                  color: '#fb923c',
                  borderColor: 'rgba(249,115,22,0.3)',
                }}
              >
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle settings sidebar"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors"
            style={
              isSidebarOpen
                ? { background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)', color: '#fb923c' }
                : { background: '#221c15', borderColor: '#2e2419', color: '#cbd5e1' }
            }
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
