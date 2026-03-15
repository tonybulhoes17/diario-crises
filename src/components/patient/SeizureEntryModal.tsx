'use client'

import { useState } from 'react'
import { Moon, Plus, Minus, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { SeizureType, Period, AgendaRow, DiaryEventWithType } from '@/types'
import { PERIOD_LABELS } from '@/types'

// SVGs dos símbolos (igual ao SeizureTypesEditor)
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

function SymbolIcon({ symbol, size = 'md' }: { symbol: string; size?: 'sm' | 'md' | 'lg' }) {
  const svgContent = SYMBOL_SVGS[symbol]
  const cls = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  if (!svgContent) return <span className="font-bold text-lg leading-none">{symbol}</span>
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
      {svgContent}
    </svg>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  row: AgendaRow
  patientId: string
  seizureTypes: SeizureType[]
  onSaved: () => void
}

const PERIODS: Period[] = ['morning', 'afternoon', 'night']

export function SeizureEntryModal({ open, onClose, row, patientId, seizureTypes, onSaved }: Props) {
  const [selectedType, setSelectedType] = useState<SeizureType | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('morning')
  const [count, setCount] = useState(1)
  const [duringSleep, setDuringSleep] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const resetForm = () => {
    setSelectedType(null)
    setSelectedPeriod('morning')
    setCount(1)
    setDuringSleep(false)
  }

  const handleClose = () => { resetForm(); onClose() }

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

  const handleSave = async () => {
    if (!selectedType) { toast('warning', 'Selecione o tipo de crise.'); return }
    setLoading(true)
    try {
      const diaryDayId = await getOrCreateDiaryDay()
      const { error } = await supabase.from('diary_events').insert({
        diary_day_id: diaryDayId,
        seizure_type_id: selectedType.id,
        period: selectedPeriod,
        count,
        during_sleep: duringSleep,
      })
      if (error) throw error
      toast('success', 'Crise registrada!')
      resetForm()
      onSaved()
      onClose()
    } catch {
      toast('error', 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (event: DiaryEventWithType) => {
    await supabase.from('diary_events').delete().eq('id', event.id)
    onSaved()
  }

  // Crises já registradas neste dia
  const allEvents = [
    ...row.morning_events,
    ...row.afternoon_events,
    ...row.night_events,
  ]

  return (
    <Modal open={open} onClose={handleClose} title={`Dia ${row.day} — Registrar Crise`} size="md">
      <div className="px-5 py-4 space-y-5">

        {/* Crises já registradas */}
        {allEvents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
              Registros deste dia
            </p>
            <div className="space-y-1.5">
              {allEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-2 bg-surface-muted rounded-lg px-3 py-2">
                  <span className="text-ink">
                    <SymbolIcon symbol={ev.seizure_type?.symbol ?? '+'} size="sm" />
                  </span>
                  <span className="text-xs font-medium text-ink flex-1">
                    {ev.seizure_type?.name} · {PERIOD_LABELS[ev.period]}
                    {ev.count > 1 && <span className="text-lilac-600"> ×{ev.count}</span>}
                    {ev.during_sleep && <span className="text-ink-muted"> · 🌙 sono</span>}
                  </span>
                  <button
                    onClick={() => handleDeleteEvent(ev)}
                    className="text-ink-light hover:text-red-500 transition-colors text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="divider-gold mt-3" />
          </div>
        )}

        {/* Tipo de crise */}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Tipo de crise *
          </p>
          <div className="grid grid-cols-2 gap-2">
            {seizureTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                  selectedType?.id === type.id
                    ? 'border-lilac-500 bg-lilac-50'
                    : 'border-surface-border bg-white hover:border-lilac-200 hover:bg-lilac-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedType?.id === type.id ? 'bg-lilac-100 text-lilac-700' : 'bg-surface-muted text-ink'
                }`}>
                  <SymbolIcon symbol={type.symbol} size="md" />
                </div>
                <span className="text-xs font-semibold text-ink leading-tight">{type.name}</span>
                {selectedType?.id === type.id && (
                  <Check className="w-4 h-4 text-lilac-500 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Turno */}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Turno *</p>
          <div className="grid grid-cols-3 gap-2">
            {PERIODS.map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  selectedPeriod === period
                    ? 'border-lilac-500 bg-lilac-50 text-lilac-700'
                    : 'border-surface-border bg-white text-ink-muted hover:border-lilac-200'
                }`}
              >
                {period === 'morning' ? '🌅 Manhã' : period === 'afternoon' ? '☀️ Tarde' : '🌙 Noite'}
              </button>
            ))}
          </div>
        </div>

        {/* Quantidade */}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Quantidade</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount(c => Math.max(1, c - 1))}
              className="w-10 h-10 rounded-xl border-2 border-surface-border flex items-center justify-center hover:border-lilac-300 hover:bg-lilac-50 transition-all"
            >
              <Minus className="w-4 h-4 text-ink" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold text-ink">{count}</span>
              {count > 1 && (
                <p className="text-xs text-ink-muted mt-0.5">
                  {selectedType ? `${selectedType.symbol.repeat(Math.min(count, 3))}${count > 3 ? `×${count}` : ''}` : ''}
                </p>
              )}
            </div>
            <button
              onClick={() => setCount(c => c + 1)}
              className="w-10 h-10 rounded-xl border-2 border-surface-border flex items-center justify-center hover:border-lilac-300 hover:bg-lilac-50 transition-all"
            >
              <Plus className="w-4 h-4 text-ink" />
            </button>
          </div>
        </div>

        {/* Durante o sono */}
        <button
          onClick={() => setDuringSleep(d => !d)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
            duringSleep
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-surface-border bg-white hover:border-indigo-200'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            duringSleep ? 'bg-indigo-100' : 'bg-surface-muted'
          }`}>
            <Moon className={`w-5 h-5 ${duringSleep ? 'text-indigo-600' : 'text-ink-muted'}`} />
          </div>
          <div className="flex-1 text-left">
            <p className={`text-sm font-semibold ${duringSleep ? 'text-indigo-700' : 'text-ink'}`}>
              Ocorreu durante o sono
            </p>
            <p className="text-xs text-ink-muted">Marque se a crise aconteceu dormindo</p>
          </div>
          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
            duringSleep ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
          }`}>
            {duringSleep && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>

        {/* Botões */}
        <div className="flex gap-3 pb-1">
          <button onClick={handleClose} className="btn-outline flex-1" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedType}
            className="btn-primary flex-1"
          >
            {loading ? 'Salvando...' : 'Registrar Crise'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
