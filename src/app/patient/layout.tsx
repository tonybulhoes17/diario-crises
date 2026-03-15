'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const [patientName, setPatientName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('patients')
        .select('full_name')
        .eq('auth_user_id', user.id)
        .single()
      if (data) setPatientName(data.full_name.split(' ')[0])
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-surface-border shadow-card sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-12">
              <Image src="/logo_monica.jpg" alt="Dra. Mônica Seixas" fill className="object-contain" priority />
            </div>
            <div className="hidden sm:block h-6 w-px bg-surface-border" />
            <div className="hidden sm:block">
              <p className="text-xs text-ink-muted font-medium">Diário de Crises</p>
              {patientName && (
                <p className="text-sm font-semibold text-ink">{patientName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/instrucoes"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Ajuda</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-2 sm:px-4 py-4 pb-safe">
        {children}
      </main>
    </div>
  )
}
