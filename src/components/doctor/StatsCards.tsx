'use client'

import { Activity, Moon, Calendar, TrendingUp } from 'lucide-react'
import type { SeizureStats } from '@/types'

interface Props {
  stats: SeizureStats
}

export function StatsCards({ stats }: Props) {
  const sleepPct = stats.total > 0 ? Math.round((stats.during_sleep / stats.total) * 100) : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={Activity}
        label="Total de crises"
        value={stats.total}
        color="lilac"
      />
      <StatCard
        icon={Moon}
        label="Durante o sono"
        value={stats.during_sleep}
        sub={sleepPct > 0 ? `${sleepPct}% do total` : undefined}
        color="indigo"
      />
      <StatCard
        icon={Calendar}
        label="Dias com crise"
        value={stats.days_with_seizures}
        color="amber"
        warn={stats.days_with_seizures > 15}
      />
      <StatCard
        icon={TrendingUp}
        label="Dias sem crise"
        value={stats.days_without_seizures}
        color="green"
      />
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub, color, warn = false
}: {
  icon: React.ElementType
  label: string
  value: number
  sub?: string
  color: 'lilac' | 'indigo' | 'amber' | 'green'
  warn?: boolean
}) {
  const colors = {
    lilac:  { bg: 'bg-lilac-100',  icon: 'text-lilac-600',  val: 'text-lilac-700' },
    indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600', val: 'text-indigo-700' },
    amber:  { bg: warn ? 'bg-red-100' : 'bg-amber-100', icon: warn ? 'text-red-600' : 'text-amber-600', val: warn ? 'text-red-700' : 'text-amber-700' },
    green:  { bg: 'bg-green-100',  icon: 'text-green-600',  val: 'text-green-700' },
  }
  const c = colors[color]

  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${c.bg}`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
      <p className="text-xs text-ink-muted mt-0.5">{label}</p>
      {sub && <p className="text-xs text-ink-light mt-0.5">{sub}</p>}
    </div>
  )
}
