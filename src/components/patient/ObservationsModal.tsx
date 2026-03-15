'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { AgendaRow, Trigger } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  row: AgendaRow
  patientId: string
  triggers: Trigger[]
  onSaved: () => void
}

export function ObservationsModal({ open, onClose, row, patientId, triggers, onSaved }: Props) {
  const [notes, setNotes] = useState('')
  const [selectedTriggerIds, setSelectedTriggerIds] = useState<string[]>([])
  const [customNote, setCustomNote] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Carrega dados existentes ao abrir
  useEffect(() => {
    if (open) {
      setNotes(row.notes ?? '')
      setSelectedTriggerIds(
        row.triggers
          .filter(t => t.trigger_id)
          .map(t => t.trigger_id!)
      )
      setCustomNote(
        row.triggers.find(t => !t.trigger_id)?.custom_note ?? ''
      )
    }
  }, [open, row])

  const toggleTrigger = (id: string) => {
    setSelectedTriggerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const getOrCreateDiaryDay = async (): Promise<string> => {
    if (row.diary_day?.id) return row.diary_day.id
    const { data, error } = await supabase
      .from('diary_days')
      .upsert(
        { patient_id: patientId, day_date: row.date, notes: '' },
        { onConflict: 'patient_id,day_date' }
      )
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const diaryDayId = await getOrCreateDiaryDay()

      // Atualiza notes
      await supabase
        .from('diary_days')
        .update({ notes })
        .eq('id', diaryDayId)

      // Remove desencadeantes antigos
      await supabase
        .from('diary_day_triggers')
        .delete()
        .eq('diary_day_id', diaryDayId)

      // Insere os novos
      const inserts = []
      for (const triggerId of selectedTriggerIds) {
        inserts.push({ diary_day_id: diaryDayId, trigger_id: triggerId, custom_note: null })
      }
      if (customNote.trim()) {
        inserts.push({ diary_day_id: diaryDayId, trigger_id: null, custom_note: customNote.trim() })
      }
      if (inserts.length > 0) {
        await supabase.from('diary_day_triggers').insert(inserts)
      }

      toast('success', 'Observações salvas!')
      onSaved()
      onClose()
    } catch {
      toast('error', 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Separa "Outros" dos demais
  const regularTriggers = triggers.filter(t => t.name !== 'Outros')
  const hasOthers = triggers.some(t => t.name === 'Outros')

  return (
    <Modal open={open} onClose={onClose} title={`Dia ${row.day} — Observações`} size="md">
      <div className="px-5 py-4 space-y-5">

        {/* Desencadeantes */}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Fatores desencadeantes
          </p>
          <p className="text-xs text-ink-muted mb-3">
            Selecione se algum fator pode ter provocado ou contribuído para as crises de hoje.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {regularTriggers.map(trigger => {
              const selected = selectedTriggerIds.includes(trigger.id)
              return (
                <button
                  key={trigger.id}
                  onClick={() => toggleTrigger(trigger.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? 'border-lilac-400 bg-lilac-50'
                      : 'border-surface-border bg-white hover:border-lilac-200 hover:bg-lilac-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                    selected ? 'bg-lilac-500 border-lilac-500' : 'border-gray-300'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${selected ? 'text-lilac-700' : 'text-ink'}`}>
                    {trigger.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Outros / texto livre */}
        {hasOthers && (
          <div>
            <label className="label">Outros fatores (texto livre)</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="Descreva outros fatores que possam ter contribuído..."
            />
          </div>
        )}

        {/* Observações gerais */}
        <div>
          <label className="label">Observações gerais</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anote qualquer informação adicional sobre o dia..."
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pb-1">
          <button onClick={onClose} className="btn-outline flex-1" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Observações'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
