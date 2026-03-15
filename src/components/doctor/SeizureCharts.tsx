'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts'
import type { SeizureStats } from '@/types'

const COLORS = ['#8b52f7', '#e69d0c', '#6366f1', '#10b981', '#f43f5e', '#0ea5e9', '#f97316', '#84cc16']

interface Props {
  stats: SeizureStats
}

export function SeizureCharts({ stats }: Props) {
  if (stats.total === 0) return null

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Pizza: proporção por tipo ── */}
        {stats.by_type.length > 0 && (
          <div className="card">
            <h3 className="font-display text-base font-semibold text-ink mb-4">Proporção por Tipo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.by_type}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) =>
                    `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {stats.by_type.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} crise(s)`, '']} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legenda manual */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {stats.by_type.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-ink-muted">{t.symbol} {t.name} ({t.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Barras: crises por turno ── */}
        <div className="card">
          <h3 className="font-display text-base font-semibold text-ink mb-4">Distribuição por Turno</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.by_period} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eaff" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b5b9a' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b5b9a' }} />
              <Tooltip formatter={(v: number) => [`${v} crise(s)`, 'Total']} />
              <Bar dataKey="count" fill="#8b52f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Barras: desencadeantes ── */}
      {stats.top_triggers.length > 0 && (
        <div className="card">
          <h3 className="font-display text-base font-semibold text-ink mb-4">Principais Desencadeantes</h3>
          <ResponsiveContainer width="100%" height={Math.max(160, stats.top_triggers.length * 40)}>
            <BarChart
              data={stats.top_triggers}
              layout="vertical"
              barSize={22}
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eaff" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6b5b9a' }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: '#6b5b9a' }}
              />
              <Tooltip formatter={(v: number) => [`${v} dia(s)`, 'Ocorrências']} />
              <Bar dataKey="count" fill="#e69d0c" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Linha: evolução temporal ── */}
      {stats.by_day.length > 1 && (
        <div className="card">
          <h3 className="font-display text-base font-semibold text-ink mb-4">Evolução no Período</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.by_day} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eaff" />
              <XAxis
                dataKey="date"
                tickFormatter={d => {
                  const parts = d.split('-')
                  return `${parts[2]}/${parts[1]}`
                }}
                tick={{ fontSize: 10, fill: '#6b5b9a' }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b5b9a' }} />
              <Tooltip
                labelFormatter={d => {
                  const parts = d.split('-')
                  return `${parts[2]}/${parts[1]}/${parts[0]}`
                }}
                formatter={(v: number) => [`${v} crise(s)`, 'Total']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b52f7"
                strokeWidth={2}
                dot={{ fill: '#8b52f7', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
