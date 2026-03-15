'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Printer, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAgenda } from '@/hooks/useAgenda'
import { useSeizureStats } from '@/hooks/useSeizureStats'
import { StatsCards } from '@/components/doctor/StatsCards'
import { SeizureCharts } from '@/components/doctor/SeizureCharts'
import { DoctorAgendaView } from '@/components/doctor/DoctorAgendaView'
import { PageLoader } from '@/components/ui/Loading'
import { formatDate, getMonthLabel, toISODate, getDaysInMonth, calculateAge } from '@/lib/utils'
import type { PatientSummary } from '@/types'

export default function PatientDiaryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [activeTab, setActiveTab] = useState<'agenda' | 'stats'>('agenda')

  const startDate = toISODate(1, month, year)
  const endDate = toISODate(getDaysInMonth(year, month), month, year)

  useEffect(() => {
    supabase
      .from('patients_summary')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setPatient(data)
        setLoadingPatient(false)
      })
  }, [id, supabase])

  const { rows, seizureTypes, loading: agendaLoading } = useAgenda(id, year, month)
  const { stats, loading: statsLoading } = useSeizureStats(id, startDate, endDate)

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  if (loadingPatient) return <PageLoader />

  return (
    <div className="p-4 lg:p-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => router.push('/doctor')}
          className="mt-1 p-2 rounded-xl border border-surface-border bg-white hover:bg-lilac-50 transition-colors shadow-card flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-ink" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold text-ink">{patient?.full_name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-ink-muted">
            {patient?.birth_date && <span>{calculateAge(patient.birth_date)} anos</span>}
            {patient?.epilepsy_type && <span>🧠 {patient.epilepsy_type}</span>}
            {patient?.medications && <span>💊 {patient.medications}</span>}
          </div>
        </div>
        {/* Botão imprimir */}
        <button
          onClick={() => router.push(`/doctor/patients/${id}/report?month=${month}&year=${year}`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-border shadow-card hover:bg-lilac-50 text-ink text-sm font-medium transition-colors flex-shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Relatório</span>
        </button>
      </div>

      {/* ── Navegação de mês ── */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-surface-border bg-white flex items-center justify-center hover:bg-lilac-50 shadow-card transition-all">
          <ChevronLeft className="w-5 h-5 text-ink" />
        </button>
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-ink capitalize">
            {getMonthLabel(month, year)}
          </h2>
          {isCurrentMonth && <p className="text-xs text-ink-muted">Mês atual</p>}
        </div>
        <button onClick={nextMonth} disabled={isCurrentMonth} className="w-9 h-9 rounded-xl border border-surface-border bg-white flex items-center justify-center hover:bg-lilac-50 shadow-card transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-5 h-5 text-ink" />
        </button>
      </div>

      {/* ── Abas ── */}
      <div className="flex border-b border-surface-border mb-5">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
            activeTab === 'agenda'
              ? 'border-lilac-500 text-lilac-700'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
            activeTab === 'stats'
              ? 'border-lilac-500 text-lilac-700'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Análise
        </button>
      </div>

      {/* ── Aba Agenda ── */}
      {activeTab === 'agenda' && (
        agendaLoading
          ? <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
          : <DoctorAgendaView rows={rows} seizureTypes={seizureTypes} />
      )}

      {/* ── Aba Análise ── */}
      {activeTab === 'stats' && (
        statsLoading
          ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
          : stats && stats.total > 0
            ? (
              <div className="space-y-5">
                <StatsCards stats={stats} />
                <SeizureCharts stats={stats} />
              </div>
            )
            : (
              <div className="card text-center py-16">
                <p className="text-ink-muted text-sm">Nenhuma crise registrada neste período.</p>
              </div>
            )
      )}
    </div>
  )
}
