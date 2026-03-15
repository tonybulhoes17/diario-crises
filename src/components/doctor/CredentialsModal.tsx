'use client'

import { useState } from 'react'
import { Copy, Check, User, Lock, Link } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatCPF, generatePatientPassword } from '@/lib/utils'
import type { PatientSummary } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  patient: PatientSummary
}

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface-muted rounded-xl border border-surface-border p-4">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="flex-1 font-mono text-sm text-ink bg-white rounded-lg px-3 py-2 border border-surface-border overflow-hidden text-ellipsis">
          {value}
        </p>
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
            copied
              ? 'bg-green-100 text-green-600'
              : 'bg-white border border-surface-border text-ink-muted hover:text-lilac-600 hover:border-lilac-300'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export function CredentialsModal({ open, onClose, patient }: Props) {
  const [copiedAll, setCopiedAll] = useState(false)

  const cpf = patient.cpf
  const password = generatePatientPassword(patient.full_name)
  const loginUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/login`
    : '/login'

  const allText = `Acesso ao Diário de Crises — ${patient.full_name}\n\nLink: ${loginUrl}\nLogin (CPF): ${formatCPF(cpf)}\nSenha: ${password}`

  const handleCopyAll = () => {
    navigator.clipboard.writeText(allText)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2500)
  }

  return (
    <Modal open={open} onClose={onClose} title="Credenciais de Acesso" size="md">
      <div className="px-6 py-4 space-y-4">
        {/* Nome do paciente */}
        <div className="flex items-center gap-3 pb-2 border-b border-surface-border">
          <div className="w-10 h-10 rounded-xl bg-lilac-100 flex items-center justify-center">
            <span className="text-lilac-700 font-bold text-lg">{patient.full_name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-ink">{patient.full_name}</p>
            <p className="text-xs text-ink-muted">Credenciais de acesso ao diário</p>
          </div>
        </div>

        <CopyField label="Link de acesso" value={loginUrl} icon={Link} />
        <CopyField label="Login (CPF)" value={formatCPF(cpf)} icon={User} />
        <CopyField label="Senha" value={password} icon={Lock} />

        {/* Copiar tudo */}
        <button
          onClick={handleCopyAll}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            copiedAll
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'btn-primary'
          }`}
        >
          {copiedAll ? (
            <><Check className="w-4 h-4" /> Copiado!</>
          ) : (
            <><Copy className="w-4 h-4" /> Copiar tudo para WhatsApp</>
          )}
        </button>

        {copiedAll && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700 animate-slide-down">
            Credenciais copiadas! Cole no WhatsApp para enviar ao paciente.
          </div>
        )}

        <div className="pb-2">
          <button onClick={onClose} className="btn-outline w-full">Fechar</button>
        </div>
      </div>
    </Modal>
  )
}
