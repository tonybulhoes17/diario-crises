import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-lilac-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-lilac-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-ink-muted text-sm max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
