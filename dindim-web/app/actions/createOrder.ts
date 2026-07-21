// dindim-web/app/actions/createOrder.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50)
  })).min(1),
  endereco_entrega: z.string().min(10).max(255).trim()
})

export async function createOrder(formData: FormData, rawItems: any) {
  // ⚠️ ADICIONE O AWAIT AQUI
  const supabase = await createClient()
  
  // BYPASS TEMPORÁRIO PARA TESTE (mantido como no passo anterior)
  // const { data: { session } } = await supabase.auth.getSession()
  // if (!session) throw new Error('Não autorizado')

  const parsedData = orderSchema.safeParse({
    items: rawItems,
    endereco_entrega: formData.get('endereco_entrega')
  })

  if (!parsedData.success) return { error: 'Dados inválidos detectados. Requisição abortada.' }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      cliente_id: '0cbeac94-91cb-4489-a468-0a74e16206f9', 
      endereco_entrega: parsedData.data.endereco_entrega,
      status: 'pendente'
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return { error: 'Falha ao registrar o pedido. (Veja o console)' }
  }

  return { success: true, orderId: order.id }
}