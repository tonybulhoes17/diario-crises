'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Users, BookOpen,
  Edit2, Copy, RefreshCw, Eye, ChevronRight,
  Calendar, Pill
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCPF, formatDate, calculateAge, truncate } from '@/lib/utils'
import { PatientFormModal } from '@/components/doctor/PatientFormModal'
import { CredentialsModal } from '@/components/doctor/CredentialsModal'
import { ResetPasswordModal } from '@/components/doctor/ResetPasswordModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import type { PatientSummary } from '@/types'

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [filtered, setFiltered] = useState<PatientSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [showForm, setShowForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientSummary | null>(null)
  const [credentialsPatient, setCredentialsPatient] = useState<PatientSummary | null>(null)
  const [resetPatient, setResetPatient] = useState<PatientSummary | null>(null)
  const [deletePatient, setDeletePatient] = useState<PatientSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('patients_summary')
      .select('*')
      .order('full_name')

    if (error) {
      toast('error', 'Erro ao carregar pacientes.')
    } else {
      setPatients(data ?? [])
      setFiltered(data ?? [])
    }
    setLoading(false)
  }, [supabase, toast])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  // Filtro de busca
  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) {
      setFiltered(patients)
    } else {
      setFiltered(patients.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.cpf.includes(q)
      ))
    }
    setPage(1)
  }, [search, patients])

  const handleDelete = async () => {
    if (!deletePatient) return
    setDeleting(true)
    try {
      // Deleta o usuário auth se existir
      if (deletePatient.auth_user_id) {
        await fetch('/api/delete-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: deletePatient.auth_user_id }),
        })
      }
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', deletePatient.id)
      if (error) throw error
      toast('success', 'Paciente excluído com sucesso.')
      setDeletePatient(null)
      fetchPatients()
    } catch {
      toast('error', 'Erro ao excluir paciente.')
    } finally {
      setDeleting(false)
    }
  }

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = filtered.length > paginated.length

  return (
    <div className="p-4 lg:p-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Pacientes</h1>
        <p className="text-ink-muted text-sm mt-1">
          {patients.length} paciente{patients.length !== 1 ? 's' : ''} cadastrado{patients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Barra de ações ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 bg-white"
          />
        </div>
        {/* Novo paciente */}
        <button
          onClick={() => { setEditingPatient(null); setShowForm(true) }}
          className="btn-primary whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Paciente
        </button>
      </div>

      {/* ── Indicadores ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total de pacientes" value={patients.length} icon={Users} />
        <StatCard
          label="Com registro este mês"
          value={patients.filter(p => {
            if (!p.last_entry_date) return false
            const d = new Date(p.last_entry_date)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length}
          icon={Calendar}
        />
        <StatCard
          label="Sem registro recente"
          value={patients.filter(p => {
            if (!p.last_entry_date) return true
            const d = new Date(p.last_entry_date)
            const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
            return diff > 30
          }).length}
          icon={BookOpen}
          warn
        />
        <StatCard
          label="Dias registrados (total)"
          value={patients.reduce((s, p) => s + (p.total_diary_days ?? 0), 0)}
          icon={Pill}
        />
      </div>

      {/* ── Lista de pacientes ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          description={search ? 'Tente outro nome ou CPF.' : 'Clique em "Novo Paciente" para começar.'}
          action={
            !search ? (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Cadastrar primeiro paciente
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onEdit={() => { setEditingPatient(patient); setShowForm(true) }}
                onViewDiary={() => router.push(`/doctor/patients/${patient.id}`)}
                onCredentials={() => setCredentialsPatient(patient)}
                onResetPassword={() => setResetPatient(patient)}
                onDelete={() => setDeletePatient(patient)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn-outline"
              >
                Carregar mais ({filtered.length - paginated.length} restantes)
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Modais ── */}
      <PatientFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingPatient(null) }}
        patient={editingPatient}
        onSaved={(p) => {
          setShowForm(false)
          setEditingPatient(null)
          fetchPatients()
          if (!editingPatient) setCredentialsPatient(p as PatientSummary)
        }}
      />

      {credentialsPatient && (
        <CredentialsModal
          open={!!credentialsPatient}
          onClose={() => setCredentialsPatient(null)}
          patient={credentialsPatient}
        />
      )}

      {resetPatient && (
        <ResetPasswordModal
          open={!!resetPatient}
          onClose={() => setResetPatient(null)}
          patient={resetPatient}
          onReset={() => { setResetPatient(null); toast('success', 'Senha redefinida com sucesso.') }}
        />
      )}

      <ConfirmDialog
        open={!!deletePatient}
        onClose={() => setDeletePatient(null)}
        onConfirm={handleDelete}
        title="Excluir paciente"
        message={`Tem certeza que deseja excluir ${deletePatient?.full_name}? Todos os registros do diário serão perdidos.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}

// ── Componente: card de paciente ──
function PatientCard({ patient, onEdit, onViewDiary, onCredentials, onResetPassword, onDelete }: {
  patient: PatientSummary
  onEdit: () => void
  onViewDiary: () => void
  onCredentials: () => void
  onResetPassword: () => void
  onDelete: () => void
}) {
  const age = calculateAge(patient.birth_date)

  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card hover:shadow-card-lg transition-all duration-200 p-4 lg:p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-lilac-100 to-lilac-200 flex items-center justify-center flex-shrink-0">
          <span className="text-lilac-700 font-bold text-lg">
            {patient.full_name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-ink truncate">{patient.full_name}</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                {age} anos · CPF: {formatCPF(patient.cpf)}
              </p>
            </div>
            {/* Badge último registro */}
            <div className="flex-shrink-0">
              {patient.last_entry_date ? (
                <span className="badge-lilac text-xs">
                  {formatDate(patient.last_entry_date)}
                </span>
              ) : (
                <span className="badge bg-gray-100 text-gray-500 text-xs">Sem registro</span>
              )}
            </div>
          </div>

          {/* Detalhes */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            {patient.epilepsy_type && (
              <span>🧠 {truncate(patient.epilepsy_type, 40)}</span>
            )}
            {patient.medications && (
              <span>💊 {truncate(patient.medications, 40)}</span>
            )}
            <span>📅 {patient.total_diary_days ?? 0} dias registrados</span>
          </div>

          {/* Ações */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onViewDiary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lilac-50 text-lilac-700 text-xs font-semibold hover:bg-lilac-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Ver Diário
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-ink-muted text-xs font-semibold hover:bg-lilac-50 hover:text-lilac-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={onCredentials}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-ink-muted text-xs font-semibold hover:bg-lilac-50 hover:text-lilac-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Credenciais
            </button>
            <button
              onClick={onResetPassword}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-ink-muted text-xs font-semibold hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Redefinir Senha
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-ink-muted text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente: card de estatística ──
function StatCard({ label, value, icon: Icon, warn = false }: {
  label: string; value: number; icon: React.ElementType; warn?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${warn ? 'bg-amber-100' : 'bg-lilac-100'}`}>
        <Icon className={`w-5 h-5 ${warn ? 'text-amber-600' : 'text-lilac-600'}`} />
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted mt-0.5">{label}</p>
    </div>
  )
}
