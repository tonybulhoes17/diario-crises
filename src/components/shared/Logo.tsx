'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

const sizes = {
  sm: { img: 60,  text: 'text-sm' },
  md: { img: 100, text: 'text-base' },
  lg: { img: 140, text: 'text-lg' },
}

export function Logo({ size = 'md', className, showText = false }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <Image
        src="/logo_monica.jpg"
        alt="Dra. Mônica Seixas — Neurologista"
        width={s.img}
        height={s.img}
        className="object-contain"
        priority
      />
      {showText && (
        <p className={cn('text-ink-muted font-semibold tracking-wider uppercase', s.text)}>
          Diário de Crises
        </p>
      )}
    </div>
  )
}
