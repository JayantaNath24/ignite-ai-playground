'use client';

import React from 'react';
import { Plus, Trash2, Flame, Terminal, User, Bot } from 'lucide-react';
import { ChatMessage, MessageRole } from '@/lib/types';
import { MessageItem } from './MessageItem';

interface ConversationEditorProps {
  messages: ChatMessage[];
  supportsVision: boolean;
  onUpdateRole: (id: string, role: MessageRole) => void;
  onUpdateContent: (id: string, content: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (id: string) => void;
  onAddMessage: (role: MessageRole) => void;
  onClear: () => void;
  onAttachImage?: (id: string, base64Url: string) => void;
  onRemoveImage?: (id: string, imageIndex: number) => void;
  onApplyStarterPrompt?: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  'Compare key architectural differences between REST, GraphQL, and gRPC with code examples.',
  'Write an idiomatic TypeScript utility function to debounce async API queries with cancellation.',
  'Analyze the time complexity and edge cases of searching in a rotated sorted array.',
  'Explain how attention mechanisms work in transformer models in straightforward terms.',
];

export function ConversationEditor({
  messages, supportsVision, onUpdateRole, onUpdateContent,
  onMoveUp, onMoveDown, onDelete, onAddMessage, onClear,
  onAttachImage, onRemoveImage, onApplyStarterPrompt,
}: ConversationEditorProps) {
  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Messages</span>
          <span
            className="text-[11px] font-mono px-1.5 py-0.5 rounded border"
            style={{ background: '#221c15', borderColor: '#2e2419', color: '#94a3b8' }}
          >
            {messages.length}
          </span>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Messages or Empty State */}
      {messages.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center space-y-5 border border-dashed"
          style={{ background: 'rgba(249,115,22,0.04)', borderColor: 'rgba(249,115,22,0.2)' }}
        >
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <Flame className="w-6 h-6" style={{ color: '#f97316' }} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">Start your conversation</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add messages below, or pick a starter prompt to begin testing a model.
            </p>
          </div>

          {/* Starter Prompts */}
          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-xl mx-auto">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onApplyStarterPrompt?.(prompt)}
                className="p-3 rounded-xl text-xs text-slate-200 text-left transition-all group"
                style={{ background: '#221c15', border: '1px solid #2e2419' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#2e2419';
                }}
              >
                <span className="line-clamp-2 group-hover:text-orange-300 transition-colors">{prompt}</span>
              </button>
            ))}
          </div>

          {/* Add Buttons */}
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => onAddMessage('user')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-glow-sm transition-all flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add User Message
            </button>
            <button
              type="button"
              onClick={() => onAddMessage('system')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-amber-300 transition-all flex items-center gap-1.5"
              style={{ background: '#221c15', border: '1px solid #3d3020' }}
            >
              <Terminal className="w-3.5 h-3.5" />
              System Prompt
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <MessageItem
              key={msg.id}
              message={msg}
              index={index}
              totalMessages={messages.length}
              supportsVision={supportsVision}
              onUpdateRole={onUpdateRole}
              onUpdateContent={onUpdateContent}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onDelete={onDelete}
              onAttachImage={onAttachImage}
              onRemoveImage={onRemoveImage}
            />
          ))}

          {/* Add More Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAddMessage('user')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}
            >
              <User className="w-3.5 h-3.5" />+ User
            </button>
            <button
              type="button"
              onClick={() => onAddMessage('system')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
            >
              <Terminal className="w-3.5 h-3.5" />+ System
            </button>
            <button
              type="button"
              onClick={() => onAddMessage('assistant')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}
            >
              <Bot className="w-3.5 h-3.5" />+ Assistant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
