'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { SeizureType, AgendaRow, Period } from '@/types'

const SYMBOL_SVGS: Record<string, React.ReactNode> = {
  '+': <><line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="12" x2="21" y2="12" /></>,
  '○': <circle cx="12" cy="12" r="9" />,
  '△': <polygon points="12,3 22,21 2,21" />,
  '□': <rect x="3" y="3" width="18" height="18" />,
  '◇': <polygon points="12,2 22,12 12,22 2,12" />,
  '✱': <><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /><line x1="19.07" y1="4.93" x2="4.93" y2="19.07" /></>,
  '⬡': <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />,
  '★': <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />,
  '⊕': <><circle cx="12" cy="12" r="9" /><line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="12" x2="21" y2="12" /></>,
}

export function SymbolSVG({ symbol, className = 'w-5 h-5' }: { symbol: string; className?: string }) {
  const svg = SYMBOL_SVGS[symbol]
  if (!svg) return <span className="font-bold text-base leading-none">{symbol}</span>
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      {svg}
    </svg>
  )
}

interface SeizureCellProps {
  row: AgendaRow
  period: Period
  patientId: string
  seizureTypes: SeizureType[]
  onSaved: () => void
}

export function SeizureCell({ row, period, patientId, seizureTypes, onSaved }: SeizureCellProps) {
  const [open, setOpen] = useState(false)
  const [duringSleep, setDuringSleep] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const events =
    period === 'morning' ? row.morning_events :
    period === 'afternoon' ? row.afternoon_events :
    row.night_events

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setDuringSleep(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const getOrCreateDiaryDay = async (): Promise<string> => {
    if (row.diary_day?.id) return row.diary_day.id
    const { data, error } = await supabase
      .from('diary_days')
      .upsert({ patient_id: patientId, day_date: row.date, notes: '' }, { onConflict: 'patient_id,day_date' })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  const handleAdd = async (type: SeizureType) => {
    setSaving(true)
    try {
      const diaryDayId = await getOrCreateDiaryDay()
      const existing = events.find(e => e.seizure_type_id === type.id && e.during_sleep === duringSleep)
      if (existing) {
        await supabase.from('diary_events').update({ count: existing.count + 1 }).eq('id', existing.id)
      } else {
        await supabase.from('diary_events').insert({
          diary_day_id: diaryDayId,
          seizure_type_id: type.id,
          period,
          count: 1,
          during_sleep: duringSleep,
        })
      }
      onSaved()
    } catch {
      toast('error', 'Erro ao registrar crise.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (eventId: string) => {
    const ev = events.find(e => e.id === eventId)
    if (!ev) return
    if (ev.count > 1) {
      await supabase.from('diary_events').update({ count: ev.count - 1 }).eq('id', eventId)
    } else {
      await supabase.from('diary_events').delete().eq('id', eventId)
    }
    onSaved()
  }

  return (
    <div ref={ref} className="relative w-full min-h-[48px] py-1.5 flex flex-col items-center justify-center gap-1">

      {/* ── Símbolos EM LINHA HORIZONTAL centralizados ── */}
      {events.length > 0 && (
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-0.5 w-full">
          {events.map(ev => (
            <button
              key={ev.id}
              onClick={() => handleRemove(ev.id)}
              title="Toque para remover"
              className="inline-flex items-center gap-0.5 text-ink hover:text-red-400 transition-colors"
            >
              {/* Repete o símbolo a quantidade de vezes registrada */}
              {Array.from({ length: ev.count }).map((_, i) => (
                <SymbolSVG key={i} symbol={ev.seizure_type?.symbol ?? '+'} className="w-5 h-5" />
              ))}
              {ev.during_sleep && (
                <span className="text-xs font-bold text-indigo-400">zz</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Botão + ── */}
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
          open
            ? 'bg-lilac-500 text-white shadow-focus'
            : 'bg-lilac-50 border border-lilac-200 text-lilac-500 hover:bg-lilac-100'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* ── Popover ── */}
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white rounded-2xl shadow-card-lg border border-surface-border p-3 w-60 animate-slide-down">

          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Tipo de crise</p>
          <div className="space-y-1">
            {seizureTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleAdd(type)}
                disabled={saving}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-lilac-50 border border-transparent hover:border-lilac-200 transition-all text-left active:scale-95"
              >
                <span className="text-ink flex-shrink-0">
                  <SymbolSVG symbol={type.symbol} className="w-6 h-6" />
                </span>
                <span className="text-xs font-medium text-ink leading-tight flex-1">{type.name}</span>
                {duringSleep && <span className="text-xs font-bold text-indigo-400 flex-shrink-0">zz</span>}
              </button>
            ))}
          </div>

          {/* Toggle sono — abaixo da lista */}
          <div className="mt-2 pt-2 border-t border-surface-border">
            <button
              onClick={() => setDuringSleep(d => !d)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                duringSleep
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-surface-border hover:border-indigo-200 hover:bg-indigo-50/50'
              }`}
            >
              <span className={`text-sm font-bold ${duringSleep ? 'text-indigo-500' : 'text-ink-light'}`}>zz</span>
              <span className={`text-xs font-semibold flex-1 text-left ${duringSleep ? 'text-indigo-700' : 'text-ink-muted'}`}>
                Durante o sono
              </span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                duringSleep ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
              }`}>
                {duringSleep && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          <p className="text-xs text-ink-light mt-2 text-center">
            Toque no símbolo para remover
          </p>
        </div>
      )}
    </div>
  )
}
