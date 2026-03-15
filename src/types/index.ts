// ============================================================
// TIPOS TYPESCRIPT — Diário de Crises
// Alinhados 100% com a modelagem do Supabase (Etapa 1)
// ============================================================

export type UserRole = 'doctor' | 'patient'

export interface Profile {
  id: string
  role: UserRole
  created_at: string
}

// ------------------------------------------------------------
// PACIENTE
// ------------------------------------------------------------
export interface Patient {
  id: string
  full_name: string
  cpf: string
  birth_date: string       // ISO date: "1990-05-20"
  epilepsy_type: string | null
  medications: string | null
  auth_user_id: string | null
  created_at: string
  updated_at: string
}

export interface PatientSummary extends Patient {
  age: number
  total_diary_days: number
  last_entry_date: string | null
}

// Dados para criar/editar paciente
export interface PatientFormData {
  full_name: string
  cpf: string
  birth_date: string
  epilepsy_type: string
  medications: string
}

// Credenciais geradas automaticamente
export interface PatientCredentials {
  cpf: string
  password: string
  login_url: string
}

// ------------------------------------------------------------
// TIPOS DE CRISE
// ------------------------------------------------------------
export interface SeizureType {
  id: string
  patient_id: string
  name: string
  symbol: string
  is_global: boolean
  created_at: string
}

// O símbolo global fixo
export const GLOBAL_SEIZURE_TYPE = {
  symbol: '+',
  name: 'Convulsão (crise tônico-clônica bilateral / generalizada)',
  is_global: true,
} as const

// ------------------------------------------------------------
// DESENCADEANTES
// ------------------------------------------------------------
export interface Trigger {
  id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
}

// ------------------------------------------------------------
// DIÁRIO
// ------------------------------------------------------------
export type Period = 'morning' | 'afternoon' | 'night'

export const PERIOD_LABELS: Record<Period, string> = {
  morning:   'Manhã',
  afternoon: 'Tarde',
  night:     'Noite',
}

export interface DiaryDay {
  id: string
  patient_id: string
  day_date: string         // ISO date: "2025-06-15"
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DiaryEvent {
  id: string
  diary_day_id: string
  seizure_type_id: string
  period: Period
  count: number
  during_sleep: boolean
  created_at: string
}

export interface DiaryDayTrigger {
  id: string
  diary_day_id: string
  trigger_id: string | null
  custom_note: string | null
  created_at: string
}

// ------------------------------------------------------------
// AGENDA — estrutura agregada para exibição
// ------------------------------------------------------------
export interface DiaryEventWithType extends DiaryEvent {
  seizure_type: SeizureType
}

export interface DiaryDayTriggerWithTrigger extends DiaryDayTrigger {
  trigger: Trigger | null
}

export interface DiaryDayFull extends DiaryDay {
  events: DiaryEventWithType[]
  day_triggers: DiaryDayTriggerWithTrigger[]
}

// Linha da agenda mensal (uma por dia do mês)
export interface AgendaRow {
  day: number
  date: string              // "2025-06-15"
  diary_day: DiaryDayFull | null
  morning_events: DiaryEventWithType[]
  afternoon_events: DiaryEventWithType[]
  night_events: DiaryEventWithType[]
  triggers: DiaryDayTriggerWithTrigger[]
  notes: string
  has_entries: boolean
}

// ------------------------------------------------------------
// ANÁLISE QUANTITATIVA
// ------------------------------------------------------------
export interface SeizureStats {
  total: number
  by_type: { name: string; symbol: string; count: number }[]
  by_period: { period: Period; label: string; count: number }[]
  during_sleep: number
  days_with_seizures: number
  days_without_seizures: number
  top_triggers: { name: string; count: number }[]
  by_day: { date: string; count: number }[]   // para gráfico de linha
}

// ------------------------------------------------------------
// FILTRO DE PERÍODO
// ------------------------------------------------------------
export interface DateRange {
  start: string   // ISO date
  end: string     // ISO date
}

// ------------------------------------------------------------
// ESTADO DE UI
// ------------------------------------------------------------
export interface LoadingState {
  loading: boolean
  error: string | null
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}
