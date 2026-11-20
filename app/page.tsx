'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, RotateCcw, Command, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  ChatMessage,
  ConversationHistoryItem,
  GenerationSettings,
  MessageRole,
  ModelStatusSummary,
  RequestMetrics,
} from '@/lib/types';
import { MODELS_CONFIG } from '@/config/models.config';
import { generateId } from '@/lib/utils';
import { Header } from '@/components/Header';
import { ModelSelector } from '@/components/ModelSelector';
import { ConversationEditor } from '@/components/ConversationEditor';
import { SettingsPanel } from '@/components/SettingsPanel';
import { MetricsBar } from '@/components/MetricsBar';
import { ResponseViewer } from '@/components/ResponseViewer';
import { CodeSnippetModal } from '@/components/CodeSnippetModal';
import { HistoryDrawer } from '@/components/HistoryDrawer';

const STORAGE_KEY_SESSIONS = 'aether_conversations_v1';
const STORAGE_KEY_PREFS = 'aether_preferences_v1';

const DEFAULT_SETTINGS: GenerationSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  stream: true,
};

export default function PlaygroundPage() {
  const [models, setModels] = useState<ModelStatusSummary[]>(() =>
    MODELS_CONFIG.map((m) => ({ ...m, isConfigured: false }))
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(MODELS_CONFIG[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: generateId(), role: 'user', content: '' },
  ]);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [setupHint, setSetupHint] = useState<string | undefined>(undefined);

  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load models from API on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.models)) setModels(data.models);
        }
      } catch {
        // silent fallback to static config
      }
    }
    loadModels();
  }, []);

  // Load saved prefs and history on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.selectedModelId) setSelectedModelId(parsed.selectedModelId);
        if (parsed.settings) setSettings((prev) => ({ ...prev, ...parsed.settings }));
        if (typeof parsed.sidebarOpen === 'boolean') setIsSidebarOpen(parsed.sidebarOpen);
      }
    } catch {
      // private/incognito - ignore
    }
  }, []);

  const persistHistory = useCallback((items: ConversationHistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, []);

  const savePrefs = useCallback(
    (overrides: Partial<{ selectedModelId: string; settings: GenerationSettings; sidebarOpen: boolean }>) => {
      try {
        const current: Record<string, any> = JSON.parse(
          localStorage.getItem(STORAGE_KEY_PREFS) || '{}'
        );
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ ...current, ...overrides }));
      } catch {
        // ignore
      }
    },
    []
  );

  const handleUpdateSetting = useCallback(
    <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
      setSettings((prev) => {
        const updated = { ...prev, [key]: value };
        savePrefs({ settings: updated });
        return updated;
      });
    },
    [savePrefs]
  );

  const handleSelectModel = useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId);
      const targetModel = models.find((m) => m.id === modelId);
      if (targetModel) {
        setSettings((prev) => ({
          ...prev,
          maxTokens: Math.min(prev.maxTokens, targetModel.maxOutputTokens),
        }));
      }
      savePrefs({ selectedModelId: modelId });
    },
    [models, savePrefs]
  );

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((v) => {
      savePrefs({ sidebarOpen: !v });
      return !v;
    });
  }, [savePrefs]);

  const selectedModel =
    models.find((m) => m.id === selectedModelId) || models[0] || (MODELS_CONFIG[0] as ModelStatusSummary);

  const handleResetDefaults = () => {
    if (selectedModel?.defaultSettings) setSettings({ ...selectedModel.defaultSettings });
  };

  // ── Message Mutations ───────────────────────────────────────
  const handleUpdateRole = (id: string, role: MessageRole) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));

  const handleUpdateContent = (id: string, content: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setMessages((prev) => {
      const copy = [...prev];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= messages.length - 1) return;
    setMessages((prev) => {
      const copy = [...prev];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
  };

  const handleDeleteMessage = (id: string) =>
    setMessages((prev) => prev.filter((m) => m.id !== id));

  const handleAddMessage = (role: MessageRole) =>
    setMessages((prev) => [...prev, { id: generateId(), role, content: '' }]);

  const handleAttachImage = (id: string, base64Url: string) =>
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, images: [...(m.images || []), base64Url] } : m
      )
    );

  const handleRemoveImage = (id: string, imageIndex: number) =>
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, images: (m.images || []).filter((_, i) => i !== imageIndex) }
          : m
      )
    );

  const handleClearAll = () => {
    setMessages([]);
    setStreamingOutput('');
    setError(null);
    setSetupHint(undefined);
    setMetrics(null);
  };

  const handleApplyStarterPrompt = (prompt: string) =>
    setMessages([{ id: generateId(), role: 'user', content: prompt }]);

  // ── Run ──────────────────────────────────────────────────────
  const handleRun = async () => {
    const validMessages = messages.filter(
      (m) => m.content.trim().length > 0 || (m.images && m.images.length > 0)
    );
    if (validMessages.length === 0) {
      setError('Please enter at least one message before running.');
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setStreamingOutput('');
    setError(null);
    setSetupHint(undefined);
    setMetrics(null);

    let accumulatedText = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: selectedModelId, messages: validMessages, settings }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errMessage = `Server error (HTTP ${response.status})`;
        let hint: string | undefined;
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
          if (errData?.setupHint) hint = errData.setupHint;
        } catch { /* ignore */ }
        setError(errMessage);
        setSetupHint(hint);
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream is not readable.');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) { currentEvent = 'message'; continue; }

          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'chunk' && data.text) {
                accumulatedText += data.text;
                setStreamingOutput(accumulatedText);
              } else if (currentEvent === 'metrics') {
                setMetrics(data as RequestMetrics);
              } else if (currentEvent === 'error') {
                setError(data.error || 'Stream error.');
              }
            } catch { /* partial chunk */ }
          }
        }
      }

      if (accumulatedText) {
        const updatedMessages: ChatMessage[] = [
          ...validMessages,
          { id: generateId(), role: 'assistant', content: accumulatedText },
        ];
        setMessages(updatedMessages);

        const firstUser = validMessages.find((m) => m.role === 'user');
        const sessionTitle = firstUser?.content.slice(0, 50) || `Session – ${selectedModel.name}`;
        const sessionId = activeSessionId || generateId();
        setActiveSessionId(sessionId);

        const newSession: ConversationHistoryItem = {
          id: sessionId,
          title: sessionTitle,
          modelId: selectedModel.id,
          messages: updatedMessages,
          settings,
          updatedAt: Date.now(),
        };

        const existing = history.findIndex((h) => h.id === sessionId);
        const updated =
          existing >= 0
            ? history.map((h) => (h.id === sessionId ? newSession : h))
            : [newSession, ...history];
        persistHistory(updated);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (accumulatedText) {
          setMessages((prev) => [
            ...prev,
            { id: generateId(), role: 'assistant', content: accumulatedText + '\n\n[Stopped]' },
          ]);
        }
      } else {
        setError(err.message || 'Unexpected error during request.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  // Keyboard shortcut: ⌘/Ctrl + Enter
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) handleRun();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // ── History handlers ─────────────────────────────────────────
  const handleLoadSession = (session: ConversationHistoryItem) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setSelectedModelId(session.modelId);
    setSettings(session.settings);
    setStreamingOutput('');
    setError(null);
    setMetrics(null);
  };

  const handleRenameSession = (id: string, newTitle: string) =>
    persistHistory(history.map((h) => (h.id === id ? { ...h, title: newTitle } : h)));

  const handleDeleteSession = (id: string) => {
    persistHistory(history.filter((h) => h.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([{ id: generateId(), role: 'user', content: '' }]);
    setStreamingOutput('');
    setError(null);
    setMetrics(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#08090d', color: '#f8fafc' }}
    >
      {/* ── Header ── */}
      <Header
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCode={() => setIsCodeOpen(true)}
        historyCount={history.length}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Model Selector */}
        <section>
          <ModelSelector
            models={models}
            selectedModelId={selectedModelId}
            onSelectModel={handleSelectModel}
          />
        </section>

        {/* Workspace: Two-column layout */}
        <div
          className={`grid gap-5 ${
            isSidebarOpen
              ? 'grid-cols-1 lg:grid-cols-12'
              : 'grid-cols-1'
          }`}
        >
          {/* ── Left: Conversation Editor + Run Controls ── */}
          <div
            className={`space-y-4 ${isSidebarOpen ? 'lg:col-span-7' : ''}`}
          >
            <ConversationEditor
              messages={messages}
              supportsVision={selectedModel.supportsVision}
              onUpdateRole={handleUpdateRole}
              onUpdateContent={handleUpdateContent}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDelete={handleDeleteMessage}
              onAddMessage={handleAddMessage}
              onClear={handleClearAll}
              onAttachImage={handleAttachImage}
              onRemoveImage={handleRemoveImage}
              onApplyStarterPrompt={handleApplyStarterPrompt}
            />

            {/* Run Controls */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-surface-300 bg-surface-100 flex flex-wrap items-center justify-between gap-3 sticky bottom-4 z-20 shadow-lg">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRun}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-xs text-white transition-all shadow-glow"
                    style={{
                      background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                    }}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isLoading}
                  aria-label="Retry last prompt"
                  title="Retry"
                  className="p-2 rounded-xl border border-surface-300 hover:bg-surface-200 text-slate-300 transition-colors disabled:opacity-30"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Command className="w-3.5 h-3.5" />
                <span>+ Enter to run</span>
              </div>
            </div>
          </div>

          {/* ── Right: Settings + Metrics + Response ── */}
          {isSidebarOpen && (
            <div className="lg:col-span-5 space-y-4">
              <SettingsPanel
                settings={settings}
                model={selectedModel}
                onUpdateSetting={handleUpdateSetting}
                onResetDefaults={handleResetDefaults}
              />

              <MetricsBar metrics={metrics} isLoading={isLoading} />

              <ResponseViewer
                content={streamingOutput}
                isLoading={isLoading}
                error={error}
                setupHint={setupHint}
                onStop={handleStop}
                onRetry={handleRun}
              />
            </div>
          )}
        </div>

        {/* When sidebar is hidden, show response below */}
        {!isSidebarOpen && (
          <div className="space-y-4">
            <MetricsBar metrics={metrics} isLoading={isLoading} />
            <ResponseViewer
              content={streamingOutput}
              isLoading={isLoading}
              error={error}
              setupHint={setupHint}
              onStop={handleStop}
              onRetry={handleRun}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <CodeSnippetModal
        isOpen={isCodeOpen}
        onClose={() => setIsCodeOpen(false)}
        model={selectedModel}
        messages={messages}
        settings={settings}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoadSession={handleLoadSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onNewSession={handleNewSession}
      />
    </div>
  );
}
