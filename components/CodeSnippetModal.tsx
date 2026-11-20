'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Code2, ShieldAlert, ChevronDown } from 'lucide-react';
import { ChatMessage, GenerationSettings, ModelConfig } from '@/lib/types';
import { generateCodeSnippets } from '@/lib/utils';

interface CodeSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelConfig;
  messages: ChatMessage[];
  settings: GenerationSettings;
}

type TabType = 'curl' | 'python' | 'ts';

const TAB_LABELS: Record<TabType, string> = {
  curl: 'cURL',
  python: 'Python',
  ts: 'TypeScript',
};

export function CodeSnippetModal({
  isOpen,
  onClose,
  model,
  messages,
  settings,
}: CodeSnippetModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { curlCode, pythonCode, tsCode } = generateCodeSnippets(model, messages, settings);

  const activeCode =
    activeTab === 'curl' ? curlCode : activeTab === 'python' ? pythonCode : tsCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-100 border border-surface-300 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-300">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-400" />
            <h3
              id="code-modal-title"
              className="font-semibold text-sm text-slate-100"
            >
              API Request Code
            </h3>
            <span className="text-xs text-slate-400 font-mono bg-surface-200 px-2 py-0.5 rounded border border-surface-300">
              {model.upstreamModelId}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-surface-200 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="px-5 py-2 bg-brand-500/10 border-b border-brand-500/20 flex items-center gap-2 text-xs text-brand-300">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-brand-400" />
          <span>
            API keys are server-side only. Code below uses safe placeholder tokens — never your real credentials.
          </span>
        </div>

        {/* Tab Row + Copy Button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface-300">
          <div className="flex items-center gap-0.5">
            {(['curl', 'python', 'ts'] as TabType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-surface-300 text-xs font-medium text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-accent-emerald" />
                <span className="text-accent-emerald">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block */}
        <div className="flex-1 overflow-y-auto bg-surface-50 p-5 rounded-b-2xl">
          <pre className="font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto whitespace-pre">
            {activeCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
