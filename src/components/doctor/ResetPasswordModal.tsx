'use client'

import { useState } from 'react'
import { RefreshCw, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { generatePatientPassword } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import type { PatientSummary } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  patient: PatientSummary
  onReset: () => void
}

export function ResetPasswordModal({ open, onClose, patient, onReset }: Props) {
  const [customPassword, setCustomPassword] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const defaultPassword = generatePatientPassword(patient.full_name)
  const finalPassword = useCustom ? customPassword : defaultPassword

  const handleReset = async () => {
    if (!finalPassword.trim()) {
      toast('warning', 'Informe uma senha.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: patient.auth_user_id,
          password: finalPassword,
        }),
      })
      if (!res.ok) throw new Error()
      onReset()
      onClose()
    } catch {
      toast('error', 'Erro ao redefinir senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Redefinir Senha" size="sm">
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-ink">{patient.full_name}</p>
            <p className="text-xs text-ink-muted">Redefinição de senha</p>
          </div>
        </div>

        {/* Opção padrão */}
        <div
          onClick={() => setUseCustom(false)}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            !useCustom ? 'border-lilac-400 bg-lilac-50' : 'border-surface-border hover:border-lilac-200'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            !useCustom ? 'border-lilac-500 bg-lilac-500' : 'border-gray-300'
          }`}>
            {!useCustom && <Check className="w-3 h-3 text-white" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Usar senha padrão</p>
            <p className="text-xs text-ink-muted font-mono">{defaultPassword}</p>
          </div>
        </div>

        {/* Opção customizada */}
        <div
          onClick={() => setUseCustom(true)}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            useCustom ? 'border-lilac-400 bg-lilac-50' : 'border-surface-border hover:border-lilac-200'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            useCustom ? 'border-lilac-500 bg-lilac-500' : 'border-gray-300'
          }`}>
            {useCustom && <Check className="w-3 h-3 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink mb-1">Definir senha personalizada</p>
            {useCustom && (
              <input
                className="input text-sm py-2"
                value={customPassword}
                onChange={e => setCustomPassword(e.target.value)}
                placeholder="Nova senha..."
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 pb-2">
          <button onClick={onClose} className="btn-outline flex-1" disabled={loading}>Cancelar</button>
          <button onClick={handleReset} className="btn-primary flex-1" disabled={loading || !finalPassword.trim()}>
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
