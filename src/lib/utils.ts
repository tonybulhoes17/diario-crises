import { type ClassValue, clsx } from 'clsx'

// Combina classes Tailwind de forma segura
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

// ------------------------------------------------------------
// FORMATAÇÃO DE CPF
// ------------------------------------------------------------
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function validateCPF(cpf: string): boolean {
  const digits = cleanCPF(cpf)
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(digits[10])
}

// ------------------------------------------------------------
// GERAÇÃO DE SENHA PADRÃO
// Replica a lógica do banco: primeiro_nome + "123"
// ------------------------------------------------------------
export function generatePatientPassword(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0]
  const normalized = firstName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
    .replace(/[^a-z]/g, '')           // Remove não-letras
  return normalized + '123'
}

// ------------------------------------------------------------
// DATAS
// ------------------------------------------------------------
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getMonthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function toISODate(day: number, month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ------------------------------------------------------------
// SÍMBOLOS DE CRISE
// ------------------------------------------------------------
export function renderSeizureCount(symbol: string, count: number): string {
  if (count === 1) return symbol
  if (count <= 3) return symbol.repeat(count)
  return `${symbol}x${count}`
}

// ------------------------------------------------------------
// TRUNCAR TEXTO
// ------------------------------------------------------------
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ------------------------------------------------------------
// GERAR ID ÚNICO (client-side)
// ------------------------------------------------------------
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
