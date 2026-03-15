'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { cleanCPF, formatCPF, validateCPF, generatePatientPassword, calculateAge } from '@/lib/utils'
import { SeizureTypesEditor } from './SeizureTypesEditor'
import type { PatientSummary, PatientFormData } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  patient: PatientSummary | null
  onSaved: (patient: PatientSummary | Partial<PatientSummary>) => void
}

const empty: PatientFormData = {
  full_name: '',
  cpf: '',
  birth_date: '',
  epilepsy_type: '',
  medications: '',
}

// Modo novo: steps sequenciais (form → seizures)
// Modo edição: abas (dados | crises)
type NewStep = 'form' | 'seizures'
type EditTab = 'data' | 'seizures'

export function PatientFormModal({ open, onClose, patient, onSaved }: Props) {
  const [form, setForm] = useState<PatientFormData>(empty)
  const [errors, setErrors] = useState<Partial<PatientFormData>>({})
  const [loading, setLoading] = useState(false)
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null)
  const [savedPatientData, setSavedPatientData] = useState<Partial<PatientSummary> | null>(null)

  // Novo paciente: step sequencial
  const [newStep, setNewStep] = useState<NewStep>('form')
  // Edição: aba ativa
  const [editTab, setEditTab] = useState<EditTab>('data')

  const { toast } = useToast()
  const isEditing = !!patient

  useEffect(() => {
    if (open) {
      if (patient) {
        setForm({
          full_name: patient.full_name,
          cpf: formatCPF(patient.cpf),
          birth_date: patient.birth_date,
          epilepsy_type: patient.epilepsy_type ?? '',
          medications: patient.medications ?? '',
        })
        setSavedPatientId(patient.id)
        setEditTab('data')
      } else {
        setForm(empty)
        setSavedPatientId(null)
        setSavedPatientData(null)
        setNewStep('form')
      }
      setErrors({})
    }
  }, [open, patient])

  const validate = (): boolean => {
    const e: Partial<PatientFormData> = {}
    if (!form.full_name.trim()) e.full_name = 'Nome obrigatório'
    const cpfDigits = cleanCPF(form.cpf)
    if (!validateCPF(cpfDigits)) e.cpf = 'CPF inválido'
    if (!form.birth_date) e.birth_date = 'Data de nascimento obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Salvar edição ──
  const handleSaveEdit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('patients')
        .update({
          full_name: form.full_name.trim(),
          birth_date: form.birth_date,
          epilepsy_type: form.epilepsy_type || null,
          medications: form.medications || null,
        })
        .eq('id', patient!.id)

      if (error) { toast('error', 'Erro ao salvar paciente.'); return }
      toast('success', 'Paciente atualizado com sucesso.')
      onSaved({ ...patient!, ...form, cpf: cleanCPF(form.cpf) })
      onClose()
    } catch {
      toast('error', 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  // ── Criar novo paciente ──
  const handleCreate = async () => {
    if (!validate()) return
    setLoading(true)
    const cpf = cleanCPF(form.cpf)
    try {
      const password = generatePatientPassword(form.full_name)
      const email = `${cpf}@diariodecrises.app`

      const res = await fetch('/api/create-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password,
          full_name: form.full_name.trim(),
          cpf,
          birth_date: form.birth_date,
          epilepsy_type: form.epilepsy_type || null,
          medications: form.medications || null,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        if (result.error?.includes('CPF') || result.error?.includes('already')) {
          setErrors({ cpf: 'Este CPF já está cadastrado.' })
        } else {
          toast('error', result.error ?? 'Erro ao cadastrar paciente.')
        }
        return
      }

      setSavedPatientId(result.patientId)
      setSavedPatientData({
        id: result.patientId,
        full_name: form.full_name.trim(),
        cpf,
        birth_date: form.birth_date,
        epilepsy_type: form.epilepsy_type || null,
        medications: form.medications || null,
      })
      setNewStep('seizures')
      toast('success', 'Paciente cadastrado! Configure os tipos de crise.')
    } catch {
      toast('error', 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    if (savedPatientData) onSaved(savedPatientData)
    onClose()
  }

  const age = form.birth_date ? calculateAge(form.birth_date) : null

  // ── Título dinâmico ──
  const modalTitle = isEditing
    ? `Editar — ${patient!.full_name.split(' ')[0]}`
    : newStep === 'form'
      ? 'Novo Paciente'
      : `Tipos de Crise — ${form.full_name.split(' ')[0]}`

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="lg">

      {/* ════════════════════════════════
          MODO EDIÇÃO — abas
      ════════════════════════════════ */}
      {isEditing ? (
        <>
          {/* Abas */}
          <div className="flex border-b border-surface-border px-6">
            <button
              onClick={() => setEditTab('data')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                editTab === 'data'
                  ? 'border-lilac-500 text-lilac-700'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Dados do Paciente
            </button>
            <button
              onClick={() => setEditTab('seizures')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                editTab === 'seizures'
                  ? 'border-lilac-500 text-lilac-700'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Tipos de Crise
            </button>
          </div>

          {/* Aba: Dados */}
          {editTab === 'data' && (
            <div className="px-6 py-4 space-y-4">
              <FormFields
                form={form}
                setForm={setForm}
                errors={errors}
                loading={loading}
                isEditing
                age={age}
              />
              <div className="flex gap-3 pt-2 pb-2">
                <button onClick={onClose} className="btn-outline flex-1" disabled={loading}>
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}

          {/* Aba: Tipos de Crise */}
          {editTab === 'seizures' && (
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-ink-muted">
                Gerencie os tipos de crise de{' '}
                <strong className="text-ink">{patient!.full_name.split(' ')[0]}</strong>.
                O símbolo <strong>+</strong> (Convulsão) é fixo e não pode ser removido.
              </p>
              <SeizureTypesEditor patientId={patient!.id} />
              <div className="pb-2">
                <button onClick={onClose} className="btn-primary w-full">
                  Fechar
                </button>
              </div>
            </div>
          )}
        </>

      ) : (
        /* ════════════════════════════════
            MODO CRIAÇÃO — steps
        ════════════════════════════════ */
        <>
          {newStep === 'form' ? (
            <div className="px-6 py-4 space-y-4">
              <FormFields
                form={form}
                setForm={setForm}
                errors={errors}
                loading={loading}
                isEditing={false}
                age={age}
              />
              <div className="flex gap-3 pt-2 pb-2">
                <button onClick={onClose} className="btn-outline flex-1" disabled={loading}>
                  Cancelar
                </button>
                <button onClick={handleCreate} className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Salvando...' : 'Próximo: Tipos de Crise →'}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-4 space-y-4">
              <div className="bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-sm text-lilac-700">
                Configure os tipos de crise específicos para este paciente.
                O símbolo <strong>+</strong> (Convulsão) já está incluído automaticamente.
              </div>
              <SeizureTypesEditor patientId={savedPatientId!} />
              <div className="pt-2 pb-2">
                <button onClick={handleFinish} className="btn-primary w-full">
                  Concluir e Ver Credenciais →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

// ── Campos do formulário (reutilizado nas duas situações) ──
function FormFields({
  form, setForm, errors, loading, isEditing, age
}: {
  form: PatientFormData
  setForm: React.Dispatch<React.SetStateAction<PatientFormData>>
  errors: Partial<PatientFormData>
  loading: boolean
  isEditing: boolean
  age: number | null
}) {
  return (
    <>
      {/* Nome */}
      <div>
        <label className="label">Nome completo *</label>
        <input
          className={`input ${errors.full_name ? 'input-error' : ''}`}
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          placeholder="João Antonio Bulhões"
          disabled={loading}
        />
        {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
        {!isEditing && form.full_name && (
          <p className="text-xs text-ink-light mt-1">
            Senha gerada automaticamente:{' '}
            <strong className="text-lilac-600 font-mono">{generatePatientPassword(form.full_name)}</strong>
          </p>
        )}
      </div>

      {/* CPF */}
      <div>
        <label className="label">CPF *</label>
        <input
          className={`input ${errors.cpf ? 'input-error' : ''}`}
          value={form.cpf}
          onChange={e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
            setForm(f => ({ ...f, cpf: formatCPF(digits) }))
          }}
          placeholder="000.000.000-00"
          disabled={loading || isEditing}
        />
        {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
        {isEditing && <p className="text-xs text-ink-light mt-1">O CPF não pode ser alterado.</p>}
      </div>

      {/* Data de nascimento */}
      <div>
        <label className="label">Data de nascimento *</label>
        <div className="flex items-center gap-3">
          <input
            type="date"
            className={`input flex-1 ${errors.birth_date ? 'input-error' : ''}`}
            value={form.birth_date}
            onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
            disabled={loading}
          />
          {age !== null && (
            <span className="badge-lilac whitespace-nowrap">{age} anos</span>
          )}
        </div>
        {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
      </div>

      {/* Tipo de epilepsia */}
      <div>
        <label className="label">Tipo de epilepsia</label>
        <input
          className="input"
          value={form.epilepsy_type}
          onChange={e => setForm(f => ({ ...f, epilepsy_type: e.target.value }))}
          placeholder="Ex: Epilepsia focal do lobo temporal"
          disabled={loading}
        />
      </div>

      {/* Medicamentos */}
      <div>
        <label className="label">Medicamentos em uso</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.medications}
          onChange={e => setForm(f => ({ ...f, medications: e.target.value }))}
          placeholder="Ex: Carbamazepina 200mg 2x/dia, Ácido Valpróico 500mg 1x/dia"
          disabled={loading}
        />
      </div>
    </>
  )
}
