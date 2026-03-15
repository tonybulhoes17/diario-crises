import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usa service role para criar usuários Auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, cpf, birth_date, epilepsy_type, medications } = await req.json()

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already')) {
        return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Criar perfil
    await supabaseAdmin.from('profiles').insert({ id: userId, role: 'patient' })

    // 3. Criar registro do paciente
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({ full_name, cpf, birth_date, epilepsy_type, medications, auth_user_id: userId })
      .select()
      .single()

    if (patientError) {
      // Rollback: remove usuário auth criado
      await supabaseAdmin.auth.admin.deleteUser(userId)
      if (patientError.code === '23505') {
        return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 400 })
      }
      return NextResponse.json({ error: patientError.message }, { status: 400 })
    }

    // 4. Inserir o tipo de crise global (símbolo +) para este paciente
    await supabaseAdmin.from('seizure_types').insert({
      patient_id: patient.id,
      name: 'Convulsão (crise tônico-clônica bilateral / generalizada)',
      symbol: '+',
      is_global: true,
    })

    return NextResponse.json({ patientId: patient.id, userId })
  } catch (err) {
    console.error('create-patient error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
