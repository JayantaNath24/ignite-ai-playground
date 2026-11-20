'use client';

import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Square, AlertTriangle, Flame, ChevronDown, ChevronUp } from 'lucide-react';

interface ResponseViewerProps {
  content: string;
  isLoading: boolean;
  error: string | null;
  setupHint?: string;
  onStop: () => void;
  onRetry: () => void;
}

export function ResponseViewer({ content, isLoading, error, setupHint, onStop, onRetry }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  return (
    <div className="bg-surface-100 border border-surface-300 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-300">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4" style={{ color: '#f97316' }} />
          <span className="font-semibold text-xs text-slate-200">Model Output</span>
          {isLoading && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', borderColor: 'rgba(249,115,22,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Streaming...
            </span>
          )}
          {!isLoading && content && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.25)' }}
            >
              <Check className="w-2.5 h-2.5" />
              Done
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.3)' }}
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          ) : content ? (
            <>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-200 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-200 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                {copied ? (
                  <><Check className="w-3 h-3 text-accent-emerald" /><span className="text-accent-emerald">Copied</span></>
                ) : (
                  <><Copy className="w-3 h-3" />Copy</>
                )}
              </button>
            </>
          ) : null}

          {content && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              className="p-1 rounded-lg hover:bg-surface-200 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 sm:p-5 min-h-[220px] max-h-[520px] overflow-y-auto text-sm leading-relaxed text-slate-100">
          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl space-y-2 text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}>
              <div className="flex items-center gap-2 font-semibold text-rose-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Request Failed
              </div>
              <p className="text-rose-200/90 whitespace-pre-wrap">{error}</p>
              {setupHint && (
                <div className="pt-2 text-[11px]" style={{ borderTop: '1px solid rgba(248,113,113,0.2)', color: '#d1d5db' }}>
                  <span className="font-semibold" style={{ color: '#fdba74' }}>Setup hint: </span>
                  {setupHint}
                </div>
              )}
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#fca5a5' }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!error && !content && !isLoading && (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center space-y-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border"
                style={{ background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' }}
              >
                <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">Response will appear here</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-200 border border-surface-300 text-slate-300 font-mono text-[10px]">⌘</kbd>
                  {' '}+{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-200 border border-surface-300 text-slate-300 font-mono text-[10px]">Enter</kbd>
                  {' '}or click <strong className="text-orange-400">Run</strong> to generate.
                </p>
              </div>
            </div>
          )}

          {/* Output */}
          {!error && (content || isLoading) && (
            <div className="whitespace-pre-wrap font-sans" style={{ color: '#fdf4e7' }}>
              {content}
              {isLoading && (
                <span
                  className="inline-block w-2 h-[1.1em] ml-0.5 align-middle rounded-sm animate-pulse"
                  style={{ background: '#f97316' }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {collapsed && content && (
        <div className="px-4 py-2 text-xs text-slate-400 italic truncate border-t border-surface-300">
          {content.slice(0, 150)}...
        </div>
      )}
    </div>
  );
}
