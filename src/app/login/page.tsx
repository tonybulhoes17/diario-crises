'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCPF, cleanCPF } from '@/lib/utils'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Detecta se é email: contém letra OU @
  const isEmail = /[a-zA-Z]/.test(identifier) || identifier.includes('@')

  const handleIdentifierChange = (value: string) => {
    const hasLetters = /[a-zA-Z]/.test(value)
    const hasAt = value.includes('@')
    if (!hasLetters && !hasAt) {
      const digits = value.replace(/\D/g, '').slice(0, 11)
      setIdentifier(digits.length === 0 ? '' : formatCPF(digits))
    } else {
      setIdentifier(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let email = identifier.trim()

      if (!isEmail) {
        // Paciente: monta o email diretamente do CPF sem consultar o banco
        // Isso evita o bloqueio do RLS antes do login
        const cpf = cleanCPF(identifier)
        if (cpf.length !== 11) {
          setError('CPF inválido. Verifique os números digitados.')
          setLoading(false)
          return
        }
        email = `${cpf}@diariodecrises.app`
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (!isEmail) {
          setError('CPF ou senha incorretos. Verifique com sua médica.')
        } else {
          setError('E-mail ou senha incorretos. Tente novamente.')
        }
        setLoading(false)
        return
      }

      // Busca role para redirecionar
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'doctor') {
        router.push('/doctor')
      } else {
        router.push('/patient/agenda')
      }

    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-lilac-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-card-lg border border-surface-border p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-28 h-20 mb-3">
              <Image src="/logo_monica.jpg" alt="Dra. Mônica Seixas" fill className="object-contain" priority />
            </div>
            <div className="divider-gold w-32 mb-3" />
            <h1 className="font-display text-2xl font-semibold text-ink text-center">
              Diário de Crises
            </h1>
            <p className="text-ink-light text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                {isEmail ? 'E-mail' : 'CPF do paciente'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => handleIdentifierChange(e.target.value)}
                  placeholder="000.000.000-00 ou e-mail"
                  className="input pl-10"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-ink-light mt-1">
                Pacientes usam o CPF. Dra. Mônica usa o e-mail.
              </p>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="input pl-10 pr-10"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-slide-down">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="btn-primary w-full mt-2 py-3.5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/instrucoes"
              className="text-sm text-lilac-500 hover:text-lilac-700 font-medium transition-colors"
            >
              Como funciona a plataforma? →
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-ink-light mt-4">
          Plataforma exclusiva — Dra. Mônica Seixas · Neurologista
        </p>
      </div>
    </div>
  )
}
