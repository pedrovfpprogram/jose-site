// dindim-web/app/actions/auth.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres')
})

export async function signIn(formData: FormData) {
  // ⚠️ Adicionado o await aqui:
  const supabase = await createClient()
  
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return { error: 'Credenciais inválidas.' }

  return { success: true }
}