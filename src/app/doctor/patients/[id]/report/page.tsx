'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAgenda } from '@/hooks/useAgenda'
import { useSeizureStats } from '@/hooks/useSeizureStats'
import { PageLoader } from '@/components/ui/Loading'
import { calculateAge, getMonthLabel, toISODate, getDaysInMonth, formatDate } from '@/lib/utils'
import type { PatientSummary } from '@/types'

const SYMBOL_SVGS: Record<string, string> = {
  '+': 'M12 3v18M3 12h18',
  '○': 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  '△': 'M12 3L22 21H2z',
  '□': 'M3 3h18v18H3z',
  '◇': 'M12 2l10 10-10 10L2 12z',
  '✱': 'M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07',
  '★': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  '⊕': 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 3v18M3 12h18',
}

function Sym({ symbol, size = 13 }: { symbol: string; size?: number }) {
  const d = SYMBOL_SVGS[symbol]
  if (!d) return <span style={{ fontWeight: 700, fontSize: size }}>{symbol}</span>
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))

  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)

  const startDate = toISODate(1, month, year)
  const endDate   = toISODate(getDaysInMonth(year, month), month, year)

  useEffect(() => {
    supabase.from('patients_summary').select('*').eq('id', id).single()
      .then(({ data }) => { setPatient(data); setLoadingPatient(false) })
  }, [id, supabase])

  const { rows, seizureTypes, loading: agendaLoading } = useAgenda(id, year, month)
  const { stats, loading: statsLoading } = useSeizureStats(id, startDate, endDate)

  if (loadingPatient || agendaLoading || statsLoading) return <PageLoader />

  const age = patient ? calculateAge(patient.birth_date) : 0
  const monthLabel = getMonthLabel(month, year)

  // Divide os dias em duas metades para colunas lado a lado
  const half = Math.ceil(rows.length / 2)
  const leftRows  = rows.slice(0, half)
  const rightRows = rows.slice(half)

  const td: React.CSSProperties = {
    border: '1px solid #d4cce8',
    padding: '3px 5px',
    textAlign: 'center' as const,
    fontSize: '10px',
    verticalAlign: 'middle' as const,
    color: '#2d1b69',
  }
  const tdObs: React.CSSProperties = { ...td, textAlign: 'left' as const, fontSize: '9px', color: '#6b5b9a' }
  const th: React.CSSProperties = {
    ...td,
    background: '#ede5ff',
    fontWeight: 700,
    fontSize: '9px',
    color: '#2d1b69',
  }

  function AgendaTable({ tableRows }: { tableRows: typeof rows }) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '20px' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '18%' }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            {['Dia','Manhã','Tarde','Noite','Observações'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, idx) => (
            <tr key={row.day} style={{ background: idx % 2 === 0 ? '#fff' : '#faf8ff' }}>
              <td style={{ ...td, fontWeight: 700 }}>{String(row.day).padStart(2,'0')}</td>
              {(['morning_events','afternoon_events','night_events'] as const).map(p => (
                <td key={p} style={td}>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center', alignItems: 'center' }}>
                    {row[p].map(ev =>
                      Array.from({ length: ev.count }).map((_, i) => (
                        <span key={`${ev.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
                          <Sym symbol={ev.seizure_type?.symbol ?? '+'} size={11} />
                          {ev.during_sleep && i === 0 && (
                            <span style={{ fontSize: '8px', fontWeight: 700, color: '#6366f1' }}>zz</span>
                          )}
                        </span>
                      ))
                    )}
                  </span>
                </td>
              ))}
              <td style={tdObs}>
                {row.triggers.filter(t => t.trigger_id).map((t, i) => (
                  <span key={i} style={{ display: 'block', lineHeight: 1.3 }}>• {t.trigger?.name}</span>
                ))}
                {row.notes && <span style={{ display: 'block', fontStyle: 'italic', lineHeight: 1.3 }}>{row.notes}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <>
      {/* Barra de controle — some na impressão */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-border shadow-card px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-surface-border hover:bg-lilac-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-ink" />
        </button>
        <p className="text-sm font-semibold text-ink flex-1">
          Relatório — {patient?.full_name} · {monthLabel}
        </p>
        <div className="flex flex-col items-end gap-1">
          <button onClick={() => window.print()} className="btn-primary gap-2 py-2.5">
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
          <p className="text-xs text-ink-muted">
            ⚠️ Na janela de impressão: desmarque <strong>"Cabeçalhos e rodapés"</strong>
          </p>
        </div>
      </div>

      {/* Fundo da prévia */}
      <div style={{ paddingTop: '64px', background: '#e5e7eb', minHeight: '100vh' }} className="no-print-bg">

        {/* Folha A4 */}
        <div className="report-sheet" style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          background: '#fff',
          padding: '14mm 14mm 10mm',
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
        }}>

          {/* ══ CABEÇALHO ══ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #8b52f7', paddingBottom: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#2d1b69', margin: 0 }}>Dra. Mônica Seixas · Neurologista</p>
              <span style={{ fontSize: '11px', color: '#9b8cc0' }}>CRM 28539</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#2d1b69', margin: 0 }}>DIÁRIOS DE CRISES EPILÉPTICAS</p>
              <p style={{ fontSize: '10px', color: '#9b8cc0', margin: '2px 0 0' }}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* ══ PACIENTE + RESUMO lado a lado ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>

            {/* Identificação */}
            <div style={{ background: '#f8f4ff', borderRadius: '8px', padding: '9px 12px', fontSize: '10px' }}>
              <p style={{ fontWeight: 700, color: '#6b5b9a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Paciente</p>
              <p style={{ fontWeight: 700, fontSize: '12px', color: '#2d1b69', margin: '0 0 4px' }}>{patient?.full_name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                <span style={{ color: '#9b8cc0' }}>Nascimento: <strong style={{ color: '#2d1b69' }}>{patient ? formatDate(patient.birth_date) : ''}</strong></span>
                <span style={{ color: '#9b8cc0' }}>Idade: <strong style={{ color: '#2d1b69' }}>{age} anos</strong></span>
                {patient?.epilepsy_type && <span style={{ color: '#9b8cc0', gridColumn: '1/-1' }}>Epilepsia: <strong style={{ color: '#2d1b69' }}>{patient.epilepsy_type}</strong></span>}
                {patient?.medications && <span style={{ color: '#9b8cc0', gridColumn: '1/-1' }}>Medicamentos: <strong style={{ color: '#2d1b69' }}>{patient.medications}</strong></span>}
                <span style={{ color: '#9b8cc0', gridColumn: '1/-1' }}>Período: <strong style={{ color: '#2d1b69' }}>{monthLabel}</strong></span>
              </div>
            </div>

            {/* Resumo numérico */}
            {stats && stats.total > 0 ? (
              <div style={{ background: '#f8f4ff', borderRadius: '8px', padding: '9px 12px', fontSize: '10px' }}>
                <p style={{ fontWeight: 700, color: '#6b5b9a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Resumo do Período</p>
                {/* 4 números */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px' }}>
                  {[
                    { v: stats.total, l: 'Total', c: '#8b52f7' },
                    { v: stats.during_sleep, l: 'Sono', c: '#6366f1' },
                    { v: stats.days_with_seizures, l: 'Dias c/', c: '#e69d0c' },
                    { v: stats.days_without_seizures, l: 'Dias s/', c: '#10b981' },
                  ].map(({ v, l, c }) => (
                    <div key={l} style={{ textAlign: 'center', background: '#fff', borderRadius: '6px', padding: '4px 2px', borderTop: `3px solid ${c}` }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: c, margin: 0, lineHeight: 1 }}>{v}</p>
                      <p style={{ fontSize: '8px', color: '#6b5b9a', margin: '2px 0 0' }}>{l}</p>
                    </div>
                  ))}
                </div>
                {/* Por tipo e turno em duas colunas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                  <div>
                    <p style={{ fontSize: '8px', fontWeight: 700, color: '#9b8cc0', textTransform: 'uppercase', margin: '0 0 3px' }}>Por tipo</p>
                    {stats.by_type.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <Sym symbol={t.symbol} size={10} />
                        <span style={{ flex: 1, fontSize: '9px', color: '#2d1b69', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                        <strong style={{ fontSize: '9px', color: '#8b52f7' }}>{t.count}</strong>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontSize: '8px', fontWeight: 700, color: '#9b8cc0', textTransform: 'uppercase', margin: '0 0 3px' }}>Por turno</p>
                    {stats.by_period.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
                        <span style={{ flex: 1, fontSize: '9px', color: '#2d1b69' }}>{p.label}</span>
                        <strong style={{ fontSize: '9px', color: '#8b52f7' }}>{p.count}</strong>
                      </div>
                    ))}
                    {stats.top_triggers.length > 0 && (
                      <>
                        <p style={{ fontSize: '8px', fontWeight: 700, color: '#9b8cc0', textTransform: 'uppercase', margin: '5px 0 3px' }}>Desencadeantes</p>
                        {stats.top_triggers.slice(0, 4).map((t, i) => (
                          <div key={i} style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
                            <span style={{ flex: 1, fontSize: '9px', color: '#2d1b69', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                            <strong style={{ fontSize: '9px', color: '#e69d0c' }}>{t.count}x</strong>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8f4ff', borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '11px', color: '#9b8cc0' }}>Nenhuma crise registrada no período.</p>
              </div>
            )}
          </div>

          {/* ══ LEGENDA DOS SÍMBOLOS ══ */}
          {seizureTypes.length > 0 && (
            <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '5px 8px', background: '#f8f4ff', borderRadius: '6px' }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: '#9b8cc0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Símbolos:</span>
              {seizureTypes.map(st => (
                <span key={st.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#2d1b69' }}>
                  <Sym symbol={st.symbol} size={10} /> {st.name}
                </span>
              ))}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#6366f1' }}>
                <strong>zz</strong> Durante o sono
              </span>
            </div>
          )}

          {/* ══ TABELA EM 2 COLUNAS ══ */}
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#6b5b9a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px', borderBottom: '1px solid #e2d9f5', paddingBottom: '3px' }}>
            Registro Mensal — {monthLabel.toUpperCase()}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <AgendaTable tableRows={leftRows} />
            <AgendaTable tableRows={rightRows} />
          </div>

          {/* ══ RODAPÉ ══ */}
          <div style={{ marginTop: '10px', paddingTop: '6px', borderTop: '1px solid #e2d9f5', display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '8px', color: '#9b8cc0', margin: 0 }}>Diário de Crises Epilépticas · Dra. Mônica Seixas · Neurologista</p>
            <p style={{ fontSize: '8px', color: '#9b8cc0', margin: 0 }}>{patient?.full_name} · {monthLabel}</p>
          </div>
        </div>
      </div>

      <style>{`
        @page {
          size: A4;
          margin: 10mm 12mm;
        }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .no-print-bg { padding-top: 0 !important; background: white !important; }
          body, html { margin: 0 !important; background: white !important; }
          /* Esconde o header nativo do Chrome (URL, data, título) */
          .report-sheet {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  )
}
