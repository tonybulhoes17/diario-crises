'use client'

import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-lilac-200 border-t-lilac-600 animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-ink-muted text-sm font-medium animate-pulse">Carregando...</p>
    </div>
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 rounded', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <SkeletonLine className="w-3/4 h-5" />
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-2/3" />
    </div>
  )
}
