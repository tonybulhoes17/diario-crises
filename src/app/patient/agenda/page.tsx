'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAgenda } from '@/hooks/useAgenda'
import { SeizureCell, SymbolSVG } from '@/components/patient/SeizureCell'
import { ObsCell } from '@/components/patient/ObsCell'
import { PageLoader } from '@/components/ui/Loading'
import { getMonthLabel } from '@/lib/utils'

export default function AgendaPage() {
  const [patientId, setPatientId] = useState<string | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('patients')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (data) setPatientId(data.id)
      setLoadingPatient(false)
    })
  }, [supabase])

  const { rows, seizureTypes, triggers, loading, refetch } = useAgenda(
    patientId ?? '', year, month
  )

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
  const today = now.getDate()

  if (loadingPatient) return <PageLoader />

  return (
    <div className="animate-fade-in">

      {/* ── Navegação de mês ── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-surface-border bg-white flex items-center justify-center hover:bg-lilac-50 hover:border-lilac-300 transition-all shadow-card">
          <ChevronLeft className="w-5 h-5 text-ink" />
        </button>
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-ink capitalize">
            {getMonthLabel(month, year)}
          </h2>
          {isCurrentMonth && <p className="text-xs text-ink-muted">Mês atual</p>}
        </div>
        <button onClick={nextMonth} disabled={isCurrentMonth} className="w-9 h-9 rounded-xl border border-surface-border bg-white flex items-center justify-center hover:bg-lilac-50 hover:border-lilac-300 transition-all shadow-card disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-5 h-5 text-ink" />
        </button>
      </div>

      {/* ── Legenda dos tipos ── */}
      {seizureTypes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 px-1">
          {seizureTypes.map(st => (
            <div key={st.id} className="flex items-center gap-1.5 bg-white rounded-lg border border-surface-border px-2.5 py-1.5 shadow-card">
              <span className="text-ink">
                <SymbolSVG symbol={st.symbol} className="w-4 h-4" />
              </span>
              <span className="text-xs text-ink-muted">{st.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 bg-white rounded-lg border border-surface-border px-2.5 py-1.5 shadow-card">
            <span className="text-xs font-bold text-indigo-400">zz</span>
            <span className="text-xs text-ink-muted">Durante o sono</span>
          </div>
        </div>
      )}

      {/* ── Tabela ── */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              {/* Dia — fixo estreito */}
              <col style={{ width: '36px' }} />
              {/* Manhã, Tarde, Noite — estreitos */}
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              {/* OBS — ocupa o restante (~28%) */}
              <col />
            </colgroup>
            <thead>
              <tr>
                <th className="bg-lilac-100 text-ink font-semibold text-xs py-2.5 text-center border-b border-surface-border">Dia</th>
                <th className="bg-lilac-100 text-ink font-semibold text-xs py-2.5 text-center border-b border-l border-surface-border">Manhã</th>
                <th className="bg-lilac-100 text-ink font-semibold text-xs py-2.5 text-center border-b border-l border-surface-border">Tarde</th>
                <th className="bg-lilac-100 text-ink font-semibold text-xs py-2.5 text-center border-b border-l border-surface-border">Noite</th>
                <th className="bg-lilac-100 text-ink font-semibold text-xs py-2.5 text-center border-b border-l border-surface-border">Obs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isToday = isCurrentMonth && row.day === today
                return (
                  <tr
                    key={row.day}
                    className={`border-b border-surface-border last:border-0 ${
                      isToday ? 'bg-gold-50' : row.has_entries ? 'bg-lilac-50/30' : ''
                    }`}
                  >
                    {/* Dia */}
                    <td className="text-center py-1.5 px-1 border-r border-surface-border align-middle">
                      <div className={`text-sm font-bold ${isToday ? 'text-gold-600' : 'text-ink'}`}>
                        {String(row.day).padStart(2, '0')}
                      </div>
                      {isToday && <div className="w-1 h-1 rounded-full bg-gold-500 mx-auto mt-0.5" />}
                    </td>

                    {/* Manhã */}
                    <td className="border-r border-surface-border px-0.5 align-middle">
                      <SeizureCell row={row} period="morning" patientId={patientId!} seizureTypes={seizureTypes} onSaved={refetch} />
                    </td>

                    {/* Tarde */}
                    <td className="border-r border-surface-border px-0.5 align-middle">
                      <SeizureCell row={row} period="afternoon" patientId={patientId!} seizureTypes={seizureTypes} onSaved={refetch} />
                    </td>

                    {/* Noite */}
                    <td className="border-r border-surface-border px-0.5 align-middle">
                      <SeizureCell row={row} period="night" patientId={patientId!} seizureTypes={seizureTypes} onSaved={refetch} />
                    </td>

                    {/* OBS — mostra triggers + botão editar */}
                    <td className="px-1.5 py-1.5 align-middle">
                      <ObsCell row={row} patientId={patientId!} triggers={triggers} onSaved={refetch} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-ink-light mt-4 px-2">
        Toque em <strong>+</strong> para registrar · Toque no símbolo para remover
      </p>
    </div>
  )
}
