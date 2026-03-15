'use client'

import { Moon } from 'lucide-react'
import type { AgendaRow, SeizureType } from '@/types'

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

function SymbolSVG({ symbol }: { symbol: string }) {
  const svg = SYMBOL_SVGS[symbol]
  if (!svg) return <span className="font-bold text-sm">{symbol}</span>
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 inline-block">
      {svg}
    </svg>
  )
}

interface Props {
  rows: AgendaRow[]
  seizureTypes: SeizureType[]
}

export function DoctorAgendaView({ rows, seizureTypes }: Props) {
  return (
    <div className="card p-0 overflow-hidden">
      {/* Legenda */}
      {seizureTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-surface-border bg-surface">
          {seizureTypes.map(st => (
            <div key={st.id} className="flex items-center gap-1 text-xs text-ink-muted">
              <SymbolSVG symbol={st.symbol} />
              <span>{st.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-xs text-ink-muted">
            <span className="font-bold text-indigo-400">zz</span>
            <span>sono</span>
          </div>
        </div>
      )}

      <table className="w-full border-collapse table-fixed text-sm">
        <colgroup>
          <col style={{ width: '36px' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '18%' }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th className="bg-lilac-100 text-ink font-semibold text-xs py-2 text-center border-b border-surface-border">Dia</th>
            <th className="bg-lilac-100 text-ink font-semibold text-xs py-2 text-center border-b border-l border-surface-border">Manhã</th>
            <th className="bg-lilac-100 text-ink font-semibold text-xs py-2 text-center border-b border-l border-surface-border">Tarde</th>
            <th className="bg-lilac-100 text-ink font-semibold text-xs py-2 text-center border-b border-l border-surface-border">Noite</th>
            <th className="bg-lilac-100 text-ink font-semibold text-xs py-2 text-center border-b border-l border-surface-border">Obs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.day} className={`border-b border-surface-border last:border-0 ${row.has_entries ? 'bg-lilac-50/30' : ''}`}>
              {/* Dia */}
              <td className="text-center py-1.5 px-1 border-r border-surface-border align-middle">
                <span className="text-xs font-bold text-ink">{String(row.day).padStart(2, '0')}</span>
              </td>

              {/* Turno */}
              {(['morning_events', 'afternoon_events', 'night_events'] as const).map(period => (
                <td key={period} className="border-r border-surface-border px-1 py-1.5 align-middle">
                  <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 min-h-[24px]">
                    {row[period].map(ev =>
                      Array.from({ length: ev.count }).map((_, i) => (
                        <span key={`${ev.id}-${i}`} className="inline-flex items-center gap-0.5 text-ink">
                          <SymbolSVG symbol={ev.seizure_type?.symbol ?? '+'} />
                          {ev.during_sleep && i === 0 && (
                            <span className="text-[10px] font-bold text-indigo-400">zz</span>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                </td>
              ))}

              {/* Obs */}
              <td className="px-2 py-1.5 align-middle">
                <div className="flex flex-col gap-0.5">
                  {row.triggers.filter(t => t.trigger_id).map((t, i) => (
                    <span key={i} className="text-[11px] text-ink-muted leading-tight">
                      • {t.trigger?.name}
                    </span>
                  ))}
                  {row.notes && (
                    <span className="text-[11px] text-ink-light italic leading-tight">{row.notes}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
