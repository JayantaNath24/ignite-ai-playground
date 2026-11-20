'use client';

import React, { useRef, useState } from 'react';
import {
  Play,
  Square,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  CornerDownLeft,
  X,
} from 'lucide-react';

interface PromptEditorProps {
  promptText: string;
  onChangePrompt: (text: string) => void;
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
  isLoading: boolean;
  supportsVision: boolean;
  images: string[];
  onAddImage: (base64Url: string) => void;
  onRemoveImage: (index: number) => void;
}

export function PromptEditor({
  promptText,
  onChangePrompt,
  onRun,
  onStop,
  onClear,
  isLoading,
  supportsVision,
  images,
  onAddImage,
  onRemoveImage,
}: PromptEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAddImage(reader.result);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && (promptText.trim() || images.length > 0)) {
        onRun();
      }
    }
  };

  return (
    <div className="bg-surface-100 border border-surface-300 rounded-2xl p-3 sm:p-4 shadow-lg space-y-3">
      {/* Image Previews if any */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-1">
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden border border-surface-300 w-16 h-16 bg-black/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Attached ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                aria-label="Remove image"
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Multiline Prompt Textarea */}
      <textarea
        ref={textareaRef}
        value={promptText}
        onChange={(e) => onChangePrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Type your prompt here... (Press ⌘ + Enter to run)"
        className="w-full bg-surface-50 border border-surface-300 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-y leading-relaxed"
      />

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-surface-300/40">
        <div className="flex items-center gap-1.5">
          {supportsVision && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image to prompt"
                aria-label="Attach image"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-surface-300 text-xs font-medium text-slate-300 hover:text-amber-400 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attach</span> Image
              </button>
            </>
          )}

          {promptText && (
            <button
              type="button"
              onClick={onClear}
              title="Clear prompt text"
              aria-label="Clear prompt text"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-200 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <span>⌘ + Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </span>

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRun}
              disabled={!promptText.trim() && images.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white font-semibold text-xs shadow-glow transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
