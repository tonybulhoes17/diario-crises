'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDaysInMonth, toISODate } from '@/lib/utils'
import type { AgendaRow, DiaryDayFull, SeizureType, Trigger } from '@/types'

export function useAgenda(patientId: string, year: number, month: number) {
  const [rows, setRows] = useState<AgendaRow[]>([])
  const [seizureTypes, setSeizureTypes] = useState<SeizureType[]>([])
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchSeizureTypes = useCallback(async () => {
    const { data } = await supabase
      .from('seizure_types')
      .select('*')
      .eq('patient_id', patientId)
      .order('is_global', { ascending: false })
    setSeizureTypes(data ?? [])
  }, [patientId, supabase])

  const fetchTriggers = useCallback(async () => {
    const { data } = await supabase
      .from('triggers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    setTriggers(data ?? [])
  }, [supabase])

  const fetchAgenda = useCallback(async () => {
    setLoading(true)
    const daysInMonth = getDaysInMonth(year, month)
    const startDate = toISODate(1, month, year)
    const endDate = toISODate(daysInMonth, month, year)

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

    // ── Normaliza o retorno do Supabase ──
    // O Supabase retorna joins com o nome da tabela (plural):
    //   diary_events[].seizure_types  →  precisamos de  .seizure_type  (singular)
    //   diary_day_triggers[].triggers →  precisamos de  .trigger       (singular)
    const dayMap = new Map<string, DiaryDayFull>()

    for (const d of diaryDays ?? []) {
      const events = (d.diary_events ?? []).map((ev: Record<string, unknown>) => ({
        id:               ev.id,
        diary_day_id:     ev.diary_day_id,
        seizure_type_id:  ev.seizure_type_id,
        period:           ev.period,
        count:            ev.count,
        during_sleep:     ev.during_sleep,
        created_at:       ev.created_at,
        // Aqui está a correção: mapeia "seizure_types" → "seizure_type"
        seizure_type:     (ev.seizure_types as SeizureType) ?? null,
      }))

      const day_triggers = (d.diary_day_triggers ?? []).map((dt: Record<string, unknown>) => ({
        id:            dt.id,
        diary_day_id:  dt.diary_day_id,
        trigger_id:    dt.trigger_id,
        custom_note:   dt.custom_note,
        created_at:    dt.created_at,
        // Aqui está a correção: mapeia "triggers" → "trigger"
        trigger:       (dt.triggers as Trigger) ?? null,
      }))

      dayMap.set(d.day_date, { ...d, events, day_triggers })
    }

    // Gera todas as linhas do mês
    const agendaRows: AgendaRow[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = toISODate(day, month, year)
      const dd = dayMap.get(date) ?? null

      const events = dd?.events ?? []
      const morning   = events.filter(e => e.period === 'morning')
      const afternoon = events.filter(e => e.period === 'afternoon')
      const night     = events.filter(e => e.period === 'night')

      agendaRows.push({
        day,
        date,
        diary_day: dd,
        morning_events:   morning,
        afternoon_events: afternoon,
        night_events:     night,
        triggers:         dd?.day_triggers ?? [],
        notes:            dd?.notes ?? '',
        has_entries:      events.length > 0 || (dd?.day_triggers?.length ?? 0) > 0 || !!dd?.notes,
      })
    }

    setRows(agendaRows)
    setLoading(false)
  }, [patientId, year, month, supabase])

  useEffect(() => {
    fetchSeizureTypes()
    fetchTriggers()
  }, [fetchSeizureTypes, fetchTriggers])

  useEffect(() => {
    if (patientId) fetchAgenda()
  }, [fetchAgenda, patientId])

  return { rows, seizureTypes, triggers, loading, refetch: fetchAgenda }
}
