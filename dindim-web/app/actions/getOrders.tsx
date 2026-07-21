'use server'
import { createClient } from '@/utils/supabase/server'

export async function getUserOrders() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('cliente_id', session.user.id)
    .order('criado_em', { ascending: false })
  
  return data || []
}