'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, GripVertical, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Trigger } from '@/types'

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Trigger | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const fetchTriggers = useCallback(async () => {
    const { data } = await supabase
      .from('triggers')
      .select('*')
      .order('sort_order')
    setTriggers(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTriggers() }, [fetchTriggers])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const maxOrder = Math.max(0, ...triggers.map(t => t.sort_order))
    const { error } = await supabase.from('triggers').insert({
      name: newName.trim(),
      sort_order: maxOrder + 1,
      is_active: true,
    })
    if (error) {
      toast('error', 'Erro ao adicionar desencadeante.')
    } else {
      setNewName('')
      fetchTriggers()
      toast('success', 'Desencadeante adicionado.')
    }
    setAdding(false)
  }

  const toggleActive = async (trigger: Trigger) => {
    await supabase
      .from('triggers')
      .update({ is_active: !trigger.is_active })
      .eq('id', trigger.id)
    fetchTriggers()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('triggers').delete().eq('id', deleteTarget.id)
    if (error) {
      toast('error', 'Erro ao excluir.')
    } else {
      toast('success', 'Desencadeante excluído.')
      setDeleteTarget(null)
      fetchTriggers()
    }
    setDeleting(false)
  }

  return (
    <div className="p-4 lg:p-8 animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Fatores Desencadeantes</h1>
        <p className="text-ink-muted text-sm mt-1">
          Estes fatores aparecem para os pacientes na agenda. Você pode ativar, desativar ou excluir.
        </p>
      </div>

      {/* Adicionar novo */}
      <div className="card mb-6">
        <p className="text-sm font-semibold text-ink mb-3">Adicionar novo desencadeante</p>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Ex: Uso de cafeína excessiva..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            disabled={adding}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="btn-primary px-4"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : triggers.length === 0 ? (
        <EmptyState icon={Zap} title="Nenhum desencadeante cadastrado" />
      ) : (
        <div className="space-y-2">
          {triggers.map(trigger => (
            <div
              key={trigger.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                trigger.is_active
                  ? 'bg-white border-surface-border shadow-card'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <GripVertical className="w-4 h-4 text-ink-light flex-shrink-0 cursor-grab" />

              <div className="flex-1">
                <p className={`text-sm font-medium ${trigger.is_active ? 'text-ink' : 'text-gray-400 line-through'}`}>
                  {trigger.name}
                </p>
              </div>

              {/* Toggle ativo/inativo */}
              <button
                onClick={() => toggleActive(trigger)}
                className={`relative w-10 h-5 rounded-full transition-all ${
                  trigger.is_active ? 'bg-lilac-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  trigger.is_active ? 'left-5' : 'left-0.5'
                }`} />
              </button>

              <button
                onClick={() => setDeleteTarget(trigger)}
                className="p-1.5 rounded-lg text-ink-light hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir desencadeante"
        message={`Excluir "${deleteTarget?.name}"? Registros existentes que usam este fator não serão afetados.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
