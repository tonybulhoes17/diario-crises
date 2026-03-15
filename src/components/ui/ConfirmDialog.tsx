'use client'

import { Modal } from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6 text-center space-y-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
          variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <AlertTriangle className={`w-7 h-7 ${
            variant === 'danger' ? 'text-red-500' : 'text-amber-500'
          }`} />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <p className="text-ink-muted text-sm mt-1">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 btn-outline py-2.5 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-sm rounded-xl font-semibold text-white transition-all
              ${variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 active:scale-95'
                : 'bg-amber-500 hover:bg-amber-600 active:scale-95'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
