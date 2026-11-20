'use client';

import React from 'react';
import { Clock, Zap, Gauge, Coins, BarChart3 } from 'lucide-react';
import { RequestMetrics } from '@/lib/types';
import { formatCost, formatNumber, formatTime } from '@/lib/utils';

interface MetricsBarProps {
  metrics: RequestMetrics | null;
  isLoading: boolean;
}

function MetricItem({
  icon, label, value, color, loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <span
        className={`text-xs font-mono font-semibold ${loading ? 'animate-pulse' : ''}`}
        style={{ color: color || '#faf5f0' }}
      >
        {value}
      </span>
    </div>
  );
}

export function MetricsBar({ metrics, isLoading }: MetricsBarProps) {
  const loading = isLoading && !metrics?.totalTimeMs;

  return (
    <div className="bg-surface-100 border border-surface-300 rounded-xl px-4 py-3 shadow-sm">
      <div
        className="flex items-center gap-2 pb-2 mb-3"
        style={{ borderBottom: '1px solid #2e2419' }}
      >
        <BarChart3 className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Request Metrics
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricItem
          icon={<Clock className="w-3 h-3" style={{ color: '#fb923c' }} />}
          label="Total Time"
          value={loading ? '...' : formatTime(metrics?.totalTimeMs)}
          color="#fdba74"
          loading={loading}
        />
        <MetricItem
          icon={<Zap className="w-3 h-3" style={{ color: '#fbbf24' }} />}
          label="TTFT"
          value={loading ? '...' : formatTime(metrics?.timeToFirstTokenMs)}
          color="#fde68a"
          loading={loading}
        />
        <MetricItem
          icon={<Gauge className="w-3 h-3 text-accent-violet" />}
          label="Speed"
          value={
            loading ? '...' :
            metrics?.tokensPerSecond != null ? `${metrics.tokensPerSecond} t/s` : 'unavailable'
          }
          color="#c4b5fd"
          loading={loading}
        />
        <MetricItem
          icon={<BarChart3 className="w-3 h-3 text-slate-400" />}
          label="Tokens In / Out"
          value={
            loading ? '...' :
            metrics?.promptTokens != null && metrics?.completionTokens != null
              ? `${formatNumber(metrics.promptTokens)} / ${formatNumber(metrics.completionTokens)}`
              : 'unavailable'
          }
          loading={loading}
        />
        <MetricItem
          icon={<Coins className="w-3 h-3 text-accent-emerald" />}
          label="Est. Cost"
          value={loading ? '...' : formatCost(metrics?.estimatedCostUsd)}
          color="#6ee7b7"
          loading={loading}
        />
      </div>
    </div>
  );
}
