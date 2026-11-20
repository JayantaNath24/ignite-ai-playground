'use client';

import React, { useRef, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Image as ImageIcon,
  X,
  User,
  Bot,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { ChatMessage, MessageRole } from '@/lib/types';

interface MessageItemProps {
  message: ChatMessage;
  index: number;
  totalMessages: number;
  supportsVision: boolean;
  onUpdateRole: (id: string, role: MessageRole) => void;
  onUpdateContent: (id: string, content: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (id: string) => void;
  onAttachImage?: (id: string, base64Url: string) => void;
  onRemoveImage?: (id: string, imageIndex: number) => void;
}

const ROLE_CONFIG: Record<
  MessageRole,
  { label: string; icon: React.ElementType; badgeClass: string; borderClass: string }
> = {
  system: {
    label: 'System',
    icon: Terminal,
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    borderClass: 'border-l-2 border-l-amber-500/60',
  },
  user: {
    label: 'User',
    icon: User,
    badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    borderClass: 'border-l-2 border-l-cyan-500/60',
  },
  assistant: {
    label: 'Assistant',
    icon: Bot,
    badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    borderClass: 'border-l-2 border-l-purple-500/60',
  },
};

export function MessageItem({
  message,
  index,
  totalMessages,
  supportsVision,
  onUpdateRole,
  onUpdateContent,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAttachImage,
  onRemoveImage,
}: MessageItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const roleCfg = ROLE_CONFIG[message.role] || ROLE_CONFIG.user;
  const RoleIcon = roleCfg.icon;

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAttachImage) return;

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
        onAttachImage(message.id, reader.result);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      role="group"
      aria-label={`${roleCfg.label} message ${index + 1}`}
      className={`p-3.5 sm:p-4 rounded-xl border border-surface-300 bg-surface-100 hover:bg-surface-100/90 transition-all space-y-2.5 ${roleCfg.borderClass}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Role Selector */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${roleCfg.badgeClass}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <select
              aria-label="Change message role"
              value={message.role}
              onChange={(e) => onUpdateRole(message.id, e.target.value as MessageRole)}
              className="bg-surface-200 text-slate-100 text-xs font-semibold rounded px-1.5 py-0.5 border border-surface-300 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            #{index + 1}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy message content"
              title="Copy content"
              className="p-1.5 rounded-md hover:bg-surface-200 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-accent-emerald" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {supportsVision && message.role === 'user' && onAttachImage && (
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
                title="Attach image"
                aria-label="Attach image"
                className="p-1.5 rounded-md hover:bg-surface-200 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            aria-label="Move message up"
            title="Move up"
            className="p-1.5 rounded-md hover:bg-surface-200 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={index === totalMessages - 1}
            onClick={() => onMoveDown(index)}
            aria-label="Move message down"
            title="Move down"
            className="p-1.5 rounded-md hover:bg-surface-200 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(message.id)}
            aria-label="Delete message"
            title="Delete message"
            className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors ml-0.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Previews */}
      {message.images && message.images.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {message.images.map((imgUrl, imgIdx) => (
            <div
              key={imgIdx}
              className="relative group rounded-lg overflow-hidden border border-surface-300 w-20 h-20 bg-black/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Attachment ${imgIdx + 1}`}
                className="w-full h-full object-cover"
              />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(message.id, imgIdx)}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={message.content}
        onChange={(e) => onUpdateContent(message.id, e.target.value)}
        placeholder={
          message.role === 'system'
            ? 'Set system behavior, tone, or instructions...'
            : message.role === 'user'
            ? 'Enter your message or question...'
            : 'Assistant response...'
        }
        rows={Math.max(2, Math.min(10, message.content.split('\n').length))}
        className="w-full bg-surface-50 border border-surface-300 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors leading-relaxed resize-y font-sans"
      />
    </div>
  );
}
