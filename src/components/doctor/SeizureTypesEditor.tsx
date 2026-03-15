'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { SeizureType } from '@/types'
import { GLOBAL_SEIZURE_TYPE } from '@/types'

interface Props {
  patientId: string
}

// ── Símbolos disponíveis com SVG próprio ──
const SYMBOL_OPTIONS = [
  {
    value: '○',
    label: 'Círculo',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    value: '△',
    label: 'Triângulo',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <polygon points="12,3 22,21 2,21" />
      </svg>
    ),
  },
  {
    value: '□',
    label: 'Quadrado',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" />
      </svg>
    ),
  },
  {
    value: '◇',
    label: 'Losango',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <polygon points="12,2 22,12 12,22 2,12" />
      </svg>
    ),
  },
  {
    value: '✱',
    label: 'Asterisco',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
      </svg>
    ),
  },
  {
    value: '⬡',
    label: 'Hexágono',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
      </svg>
    ),
  },
  {
    value: '★',
    label: 'Estrela',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
  {
    value: '⊕',
    label: 'Cruz',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
]

// SVG do símbolo + (padrão) no mesmo estilo
const PLUS_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
)

// Retorna o SVG de um símbolo pelo value
function SymbolSVG({ value, className = 'w-6 h-6' }: { value: string; className?: string }) {
  const found = SYMBOL_OPTIONS.find(s => s.value === value)
  if (found) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
        {/* Clonar o SVG filho do encontrado */}
        {(found.svg as React.ReactElement).props.children}
      </svg>
    )
  }
  // Fallback: texto
  return <span className="font-bold text-lg leading-none">{value}</span>
}

export function SeizureTypesEditor({ patientId }: Props) {
  const [types, setTypes] = useState<SeizureType[]>([])
  const [newName, setNewName] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const fetchTypes = useCallback(async () => {
    const { data } = await supabase
      .from('seizure_types')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_global', false)
      .order('created_at')
    setTypes(data ?? [])
  }, [patientId, supabase])

  useEffect(() => { fetchTypes() }, [fetchTypes])

  // Símbolos já em uso (para desabilitar duplicatas)
  const usedSymbols = types.map(t => t.value)

  const handleAdd = async () => {
    if (!newName.trim() || !selectedSymbol) {
      toast('warning', 'Selecione um símbolo e digite o nome da crise.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('seizure_types').insert({
      patient_id: patientId,
      name: newName.trim(),
      symbol: selectedSymbol,
      is_global: false,
    })
    if (error) {
      toast('error', 'Erro ao adicionar tipo de crise.')
    } else {
      setNewName('')
      setSelectedSymbol('')
      fetchTypes()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('seizure_types').delete().eq('id', id)
    if (error) {
      toast('error', 'Erro ao remover tipo de crise.')
    } else {
      fetchTypes()
    }
  }

  return (
    <div className="space-y-3">

      {/* ── Símbolo global fixo ── */}
      <div className="flex items-center gap-3 bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-lilac-200 flex items-center justify-center text-ink flex-shrink-0">
          {PLUS_SVG}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Convulsão</p>
          <p className="text-xs text-ink-muted">Crise tônico-clônica bilateral / generalizada · Símbolo fixo</p>
        </div>
        <span className="badge-lilac text-xs">Padrão</span>
      </div>

      {/* ── Tipos personalizados já cadastrados ── */}
      {types.map(t => {
        const option = SYMBOL_OPTIONS.find(s => s.value === t.symbol)
        return (
          <div key={t.id} className="flex items-center gap-3 bg-white border border-surface-border rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-lg bg-surface-muted border border-surface-border flex items-center justify-center text-ink flex-shrink-0">
              {option ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                  {(option.svg as React.ReactElement).props.children}
                </svg>
              ) : (
                <span className="font-bold text-lg">{t.symbol}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{t.name}</p>
              <p className="text-xs text-ink-muted">{option?.label ?? t.symbol}</p>
            </div>
            <button
              onClick={() => handleDelete(t.id)}
              className="p-1.5 rounded-lg text-ink-light hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      })}

      {/* ── Adicionar novo ── */}
      <div className="bg-surface-muted rounded-xl border border-surface-border p-4 space-y-3">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
          Adicionar tipo de crise
        </p>

        {/* Grade de símbolos */}
        <div>
          <p className="text-xs text-ink-muted mb-2">Escolha um símbolo:</p>
          <div className="grid grid-cols-4 gap-2">
            {SYMBOL_OPTIONS.map(option => {
              const isSelected = selectedSymbol === option.value
              const isUsed = usedSymbols.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => !isUsed && setSelectedSymbol(option.value)}
                  disabled={isUsed || loading}
                  title={option.label}
                  className={`
                    relative flex flex-col items-center justify-center gap-1
                    h-16 rounded-xl border-2 transition-all duration-150
                    ${isSelected
                      ? 'border-lilac-500 bg-lilac-50 text-lilac-700 shadow-focus'
                      : isUsed
                        ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'border-surface-border bg-white text-ink hover:border-lilac-300 hover:bg-lilac-50'
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-1">
                      <Check className="w-3 h-3 text-lilac-500" />
                    </span>
                  )}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                    {(option.svg as React.ReactElement).props.children}
                  </svg>
                  <span className="text-xs font-medium leading-none">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Nome da crise */}
        <div>
          <p className="text-xs text-ink-muted mb-1.5">Nome da crise:</p>
          <div className="flex gap-2">
            {/* Preview do símbolo selecionado */}
            <div className={`
              w-12 h-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all
              ${selectedSymbol
                ? 'border-lilac-400 bg-lilac-50 text-ink'
                : 'border-dashed border-surface-border bg-white text-ink-light'
              }
            `}>
              {selectedSymbol ? (
                (() => {
                  const opt = SYMBOL_OPTIONS.find(s => s.value === selectedSymbol)
                  return opt ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                      {(opt.svg as React.ReactElement).props.children}
                    </svg>
                  ) : <span className="font-bold">{selectedSymbol}</span>
                })()
              ) : (
                <span className="text-xl font-light">?</span>
              )}
            </div>

            <input
              className="input flex-1"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Crise focal, Ausência, Mioclonia..."
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />

            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim() || !selectedSymbol}
              className="btn-primary px-4 flex-shrink-0"
            >
              Adicionar
            </button>
          </div>
          {!selectedSymbol && newName && (
            <p className="text-xs text-amber-600 mt-1.5">⚠ Selecione um símbolo acima antes de adicionar.</p>
          )}
        </div>
      </div>
    </div>
  )
}
