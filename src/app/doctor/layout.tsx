'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Zap, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/doctor',          icon: Users,  label: 'Pacientes' },
  { href: '/doctor/triggers', icon: Zap,    label: 'Desencadeantes' },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-surface flex">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-surface-border shadow-card fixed h-full z-30">
        {/* Logo */}
        <div className="flex flex-col items-center py-8 px-6 border-b border-surface-border">
          <div className="relative w-24 h-16 mb-2">
            <Image src="/logo_monica.jpg" alt="Dra. Mônica Seixas" fill className="object-contain" priority />
          </div>
          <div className="divider-gold w-20 my-2" />
          <p className="text-xs font-semibold text-ink-muted tracking-widest uppercase">Painel Médico</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-lilac-100 to-lilac-50 text-lilac-700 shadow-sm'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-lilac-600' : ''}`} />
                {label}
                {active && <ChevronRight className="w-4 h-4 ml-auto text-lilac-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Header mobile ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-surface-border px-4 py-3 flex items-center justify-between shadow-card">
        <div className="relative w-20 h-10">
          <Image src="/logo_monica.jpg" alt="Dra. Mônica Seixas" fill className="object-contain" priority />
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-surface-muted transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5 text-ink" /> : <Menu className="w-5 h-5 text-ink" />}
        </button>
      </header>

      {/* ── Menu mobile overlay ── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-surface-border shadow-card-lg px-4 py-4 space-y-1 animate-slide-down">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  pathname === href
                    ? 'bg-lilac-100 text-lilac-700'
                    : 'text-ink-muted hover:bg-surface-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
