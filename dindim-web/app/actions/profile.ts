// dindim-web/app/actions/profile.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Busca os dados do usuário atual
export async function getUserData() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return { user: session.user, profile }
}

// Atualiza Nome e Telefone
export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return { error: 'Sessão expirada.' }

  const nome = formData.get('nome')?.toString().trim()
  const telefone = formData.get('telefone')?.toString().trim()

  const { error } = await supabase
    .from('profiles')
    .update({ nome, telefone })
    .eq('id', session.user.id)

  if (error) return { error: 'Falha ao salvar as informações.' }

  revalidatePath('/perfil') // Atualiza o cache da página
  return { success: true }
}

// Encerra a sessão
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}