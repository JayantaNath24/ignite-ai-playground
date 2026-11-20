'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  Trash2,
  Edit2,
  Check,
  Plus,
  MessageSquare,
  Clock,
  Bot,
} from 'lucide-react';
import { ConversationHistoryItem } from '@/lib/types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ConversationHistoryItem[];
  onLoadSession: (session: ConversationHistoryItem) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onLoadSession,
  onRenameSession,
  onDeleteSession,
  onNewSession,
}: HistoryDrawerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const startRename = (session: ConversationHistoryItem) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-surface-100 border-l border-surface-300 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-300">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent-violet" />
            <h3 id="history-title" className="font-semibold text-sm text-slate-100">
              Conversation History
            </h3>
            {history.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-200 border border-surface-300 text-slate-400">
                {history.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="p-1.5 rounded-lg hover:bg-surface-200 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-4 border-b border-surface-300">
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-400">No history yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Completed sessions are saved automatically in your browser.
                </p>
              </div>
            </div>
          ) : (
            history.map((item) => {
              const isEditing = editingId === item.id;
              const formattedDate = new Date(item.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-surface-300 bg-surface-50 hover:bg-surface-200 transition-colors space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(item.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="flex-1 min-w-0 bg-surface-100 border border-brand-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveRename(item.id)}
                          className="p-1 rounded bg-brand-500 text-white hover:bg-brand-400 flex-shrink-0"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSession(item);
                          onClose();
                        }}
                        className="text-left font-medium text-xs text-slate-200 hover:text-brand-300 transition-colors truncate flex-1 min-w-0"
                      >
                        {item.title}
                      </button>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startRename(item)}
                          aria-label="Rename"
                          className="p-1 rounded hover:bg-surface-300 text-slate-400 hover:text-slate-200"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSession(item.id)}
                          aria-label="Delete"
                          className="p-1 rounded hover:bg-rose-500/15 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1 font-mono truncate">
                      <Bot className="w-2.5 h-2.5" />
                      <span className="truncate">{item.modelId}</span>
                      <span className="text-slate-500">· {item.messages.length} msgs</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
