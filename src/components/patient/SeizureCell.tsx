'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
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

const PERIOD_LABELS: Record<Period, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
}

export function SeizureCell({ row, period, patientId, seizureTypes, onSaved }: SeizureCellProps) {
  const [open, setOpen] = useState(false)
  const [duringSleep, setDuringSleep] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const events =
    period === 'morning' ? row.morning_events :
    period === 'afternoon' ? row.afternoon_events :
    row.night_events

  // Fecha com ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setDuringSleep(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Trava scroll quando aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
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

  const handleClose = () => { setOpen(false); setDuringSleep(false) }

  return (
    <>
      {/* ── Célula da tabela ── */}
      <div className="relative w-full min-h-[48px] py-1.5 flex flex-col items-center justify-center gap-1">

        {/* Símbolos em linha */}
        {events.length > 0 && (
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-0.5 w-full">
            {events.map(ev => (
              <button
                key={ev.id}
                onClick={() => handleRemove(ev.id)}
                title="Toque para remover"
                className="inline-flex items-center gap-0.5 text-ink hover:text-red-400 transition-colors"
              >
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

        {/* Botão + */}
        <button
          onClick={() => setOpen(true)}
          disabled={saving}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            open
              ? 'bg-lilac-500 text-white shadow-focus'
              : 'bg-lilac-50 border border-lilac-200 text-lilac-500 hover:bg-lilac-100'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Modal centralizado na tela ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade-in"
            onClick={handleClose}
          />

          {/* Painel */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-card-lg border border-surface-border animate-slide-up overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-surface-border">
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Dia {String(row.day).padStart(2, '0')} · {PERIOD_LABELS[period]}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink mt-0.5">
                  Registrar Crise
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl bg-surface-muted flex items-center justify-center text-ink-muted hover:text-ink hover:bg-lilac-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tipos de crise */}
            <div className="px-6 py-4">
              <p className="text-sm font-semibold text-ink-muted mb-3">Tipo de crise</p>
              <div className="space-y-2">
                {seizureTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleAdd(type)}
                    disabled={saving}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-lilac-50 border-2 border-transparent hover:border-lilac-200 transition-all text-left active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0">
                      <SymbolSVG symbol={type.symbol} className="w-7 h-7" />
                    </div>
                    <span className="text-base font-medium text-ink leading-tight flex-1">
                      {type.name}
                    </span>
                    {duringSleep && (
                      <span className="text-sm font-bold text-indigo-400 flex-shrink-0">zz</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle durante o sono */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setDuringSleep(d => !d)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all ${
                  duringSleep
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-surface-border hover:border-indigo-200 hover:bg-indigo-50/40'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  duringSleep ? 'bg-indigo-100' : 'bg-surface-muted'
                }`}>
                  <span className={`text-xl font-black ${duringSleep ? 'text-indigo-500' : 'text-ink-light'}`}>
                    zz
                  </span>
                </div>
                <span className={`text-base font-semibold flex-1 text-left ${
                  duringSleep ? 'text-indigo-700' : 'text-ink-muted'
                }`}>
                  Durante o sono
                </span>
                {/* Toggle visual */}
                <div className={`w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                  duringSleep ? 'bg-indigo-500' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-all ${
                    duringSleep ? 'ml-6' : 'ml-0.5'
                  }`} />
                </div>
              </button>

              <p className="text-xs text-ink-light mt-3 text-center">
                Toque no símbolo na tabela para remover
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
