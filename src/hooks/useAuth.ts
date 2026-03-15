'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

interface AuthState {
  user: User | null
  role: UserRole | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  })
  const router = useRouter()
  const supabase = createClient()

  const fetchRole = useCallback(async (userId: string): Promise<UserRole | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    return (data?.role as UserRole) ?? null
  }, [supabase])

  useEffect(() => {
    // Carrega sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const role = await fetchRole(session.user.id)
        setState({ user: session.user, role, loading: false })
      } else {
        setState({ user: null, role: null, loading: false })
      }
    })

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const role = await fetchRole(session.user.id)
          setState({ user: session.user, role, loading: false })
        } else {
          setState({ user: null, role: null, loading: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchRole, supabase.auth])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [supabase, router])

  return { ...state, signIn, signOut }
}
