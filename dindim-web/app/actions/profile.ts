'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Sessão expirada.' }

  const nome = formData.get('nome')?.toString().trim()
  const telefone = formData.get('telefone')?.toString().trim()

  const { error } = await supabase
    .from('profiles')
    .update({ nome, telefone })
    .eq('id', user.id)

  if (error) return { error: 'Falha ao salvar as informações.' }

  revalidatePath('/perfil')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}