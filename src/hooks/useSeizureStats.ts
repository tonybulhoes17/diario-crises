'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDaysInMonth, toISODate } from '@/lib/utils'
import type { SeizureStats, Period } from '@/types'
import { PERIOD_LABELS } from '@/types'

export function useSeizureStats(patientId: string, startDate: string, endDate: string) {
  const [stats, setStats] = useState<SeizureStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    if (!patientId || !startDate || !endDate) return
    setLoading(true)

    const { data: diaryDays } = await supabase
      .from('diary_days')
      .select(`
        *,
        diary_events (
          *,
          seizure_types (*)
        ),
        diary_day_triggers (
          *,
          triggers (*)
        )
      `)
      .eq('patient_id', patientId)
      .gte('day_date', startDate)
      .lte('day_date', endDate)

    if (!diaryDays) { setLoading(false); return }

    // Normaliza eventos
    const allEvents = diaryDays.flatMap(d =>
      (d.diary_events ?? []).map((ev: any) => ({
        ...ev,
        seizure_type: ev.seizure_types ?? null,
        day_date: d.day_date,
      }))
    )

    const allDayTriggers = diaryDays.flatMap(d =>
      (d.diary_day_triggers ?? []).map((dt: any) => ({
        ...dt,
        trigger: dt.triggers ?? null,
      }))
    )

    // Total de crises (somando counts)
    const total = allEvents.reduce((sum, ev) => sum + ev.count, 0)

    // Por tipo
    const typeMap = new Map<string, { name: string; symbol: string; count: number }>()
    for (const ev of allEvents) {
      const key = ev.seizure_type_id
      const name = ev.seizure_type?.name ?? 'Desconhecido'
      const symbol = ev.seizure_type?.symbol ?? '+'
      const existing = typeMap.get(key)
      if (existing) existing.count += ev.count
      else typeMap.set(key, { name, symbol, count: ev.count })
    }
    const by_type = Array.from(typeMap.values()).sort((a, b) => b.count - a.count)

    // Por turno
    const periodMap: Record<Period, number> = { morning: 0, afternoon: 0, night: 0 }
    for (const ev of allEvents) periodMap[ev.period as Period] += ev.count
    const by_period = (Object.keys(periodMap) as Period[]).map(p => ({
      period: p,
      label: PERIOD_LABELS[p],
      count: periodMap[p],
    }))

    // Durante o sono
    const during_sleep = allEvents
      .filter(ev => ev.during_sleep)
      .reduce((sum, ev) => sum + ev.count, 0)

    // Dias com e sem crises
    const daysWithSeizures = new Set(allEvents.map(ev => ev.day_date)).size
    const totalDays = diaryDays.length
    const days_without_seizures = Math.max(0, totalDays - daysWithSeizures)

    // Desencadeantes
    const triggerMap = new Map<string, { name: string; count: number }>()
    for (const dt of allDayTriggers) {
      if (!dt.trigger) continue
      const key = dt.trigger_id
      const name = dt.trigger.name
      const existing = triggerMap.get(key)
      if (existing) existing.count++
      else triggerMap.set(key, { name, count: 1 })
    }
    const top_triggers = Array.from(triggerMap.values()).sort((a, b) => b.count - a.count)

    // Por dia (para gráfico de linha)
    const dayCountMap = new Map<string, number>()
    for (const ev of allEvents) {
      dayCountMap.set(ev.day_date, (dayCountMap.get(ev.day_date) ?? 0) + ev.count)
    }
    const by_day = Array.from(dayCountMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setStats({
      total,
      by_type,
      by_period,
      during_sleep,
      days_with_seizures: daysWithSeizures,
      days_without_seizures,
      top_triggers,
      by_day,
    })
    setLoading(false)
  }, [patientId, startDate, endDate, supabase])

  useEffect(() => { fetchStats() }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}
