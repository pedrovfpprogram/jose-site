// dindim-web/app/actions/auth.ts
'use server'

import { createClient } from '@/utils/supabase/server'

export async function loginAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()

  if (!email || !password) return { error: 'Preencha todos os campos.' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'E-mail ou senha incorretos.' }
  }
  
  return { success: true }
}

export async function signupAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()

  if (!email || !password) return { error: 'Preencha todos os campos.' }
  if (password.length < 6) return { error: 'A senha deve ter no mínimo 6 caracteres.' }

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    // Tratamento amigável para erro comum
    if (error.message.includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado. Faça login.' }
    }
    return { error: error.message }
  }

  return { success: true }
}