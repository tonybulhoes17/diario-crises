'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { AgendaRow, Trigger } from '@/types'

interface ObsCellProps {
  row: AgendaRow
  patientId: string
  triggers: Trigger[]
  onSaved: () => void
}

export function ObsCell({ row, patientId, triggers, onSaved }: ObsCellProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [customNote, setCustomNote] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setSelectedIds(row.triggers.filter(t => t.trigger_id).map(t => t.trigger_id!))
      setCustomNote(
        row.triggers.find(t => !t.trigger_id)?.custom_note ?? row.notes ?? ''
      )
    }
  }, [open, row])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

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
    setSaving(true)
    try {
      const diaryDayId = await getOrCreateDiaryDay()
      await supabase.from('diary_days').update({ notes: customNote }).eq('id', diaryDayId)
      await supabase.from('diary_day_triggers').delete().eq('diary_day_id', diaryDayId)
      const inserts = [
        ...selectedIds.map(id => ({ diary_day_id: diaryDayId, trigger_id: id, custom_note: null })),
        ...(customNote.trim() ? [{ diary_day_id: diaryDayId, trigger_id: null, custom_note: customNote.trim() }] : []),
      ]
      if (inserts.length > 0) await supabase.from('diary_day_triggers').insert(inserts)
      toast('success', 'Observações salvas!')
      setOpen(false)
      onSaved()
    } catch {
      toast('error', 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  // Nomes dos triggers selecionados para exibir na célula
  const selectedTriggers = row.triggers
    .filter(t => t.trigger_id)
    .map(t => triggers.find(tr => tr.id === t.trigger_id)?.name ?? '')
    .filter(Boolean)

  const hasCustomNote = row.triggers.find(t => !t.trigger_id)?.custom_note || row.notes

  return (
    <div ref={ref} className="relative w-full h-full min-h-[48px]">

      {/* ── Conteúdo da célula — triggers + botão lápis ── */}
      <div className="flex items-start gap-1 py-1 px-0.5 min-h-[48px]">

        {/* Lista de triggers selecionados */}
        <div className="flex-1 flex flex-col gap-0.5">
          {selectedTriggers.map((name, i) => (
            <span key={i} className="text-[14px] leading-tight text-ink-muted block">
              • {name}
            </span>
          ))}
          {hasCustomNote && !selectedTriggers.length && (
            <span className="text-[10px] leading-tight text-ink-muted italic block truncate">
              {String(hasCustomNote).slice(0, 30)}
            </span>
          )}
        </div>

        {/* Botão editar */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all mt-0.5 ${
            selectedTriggers.length > 0 || hasCustomNote
              ? 'bg-amber-50 border border-amber-200 text-amber-500 hover:bg-amber-100'
              : open
              ? 'bg-lilac-500 text-white'
              : 'bg-lilac-50 border border-lilac-200 text-lilac-400 hover:bg-lilac-100'
          }`}
          title="Editar observações"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      {/* ── Popover de edição ── */}
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-2xl shadow-card-lg border border-surface-border p-4 w-72 animate-slide-down">

          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Desencadeantes
          </p>

          <div className="space-y-1 max-h-52 overflow-y-auto scrollbar-thin mb-3">
            {triggers.filter(t => t.name !== 'Outros').map(trigger => {
              const sel = selectedIds.includes(trigger.id)
              return (
                <button
                  key={trigger.id}
                  onClick={() => toggle(trigger.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left ${
                    sel ? 'border-lilac-300 bg-lilac-50' : 'border-transparent hover:bg-surface-muted'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                    sel ? 'bg-lilac-500 border-lilac-500' : 'border-gray-300'
                  }`}>
                    {sel && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={`text-xs font-medium ${sel ? 'text-lilac-700' : 'text-ink'}`}>
                    {trigger.name}
                  </span>
                </button>
              )
            })}
          </div>

          <textarea
            className="input resize-none text-xs py-2 mb-3"
            rows={2}
            value={customNote}
            onChange={e => setCustomNote(e.target.value)}
            placeholder="Outras observações..."
          />

          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-surface-border text-xs font-semibold text-ink-muted hover:bg-surface-muted transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2 text-xs">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
