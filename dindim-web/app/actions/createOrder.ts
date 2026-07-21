'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export async function createCartOrder(items: CartItem[], loyaltyCreditsToUse: number) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Sessão inválida ou expirada. Faça login novamente.' }
  }

  if (!items || items.length === 0) {
    return { error: 'O carrinho está vazio.' }
  }

  // Se for usar créditos de fidelidade, valida e desconta no banco
  if (loyaltyCreditsToUse > 0) {
    const { data: success, error: rpcError } = await supabase.rpc('use_loyalty_credits', {
      target_user_id: user.id,
      credits_to_use: loyaltyCreditsToUse
    })

    if (rpcError || !success) {
      return { error: 'Pontos insuficientes para a quantidade de cupons selecionados.' }
    }
  }

  // Expande todos os itens unitariamente para ordenar e aplicar o desconto nos mais baratos
  const unitItems: { name: string; price: number }[] = []
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      unitItems.push({ name: item.name, price: item.price })
    }
  }

  // Ordena do mais barato para o mais caro
  unitItems.sort((a, b) => a.price - b.price)

  let total = 0
  const summaryMap: Record<string, { paidQty: number; freeQty: number; price: number }> = {}

  unitItems.forEach((unit, index) => {
    const isFree = index < loyaltyCreditsToUse
    const effectivePrice = isFree ? 0 : unit.price

    total += effectivePrice

    if (!summaryMap[unit.name]) {
      summaryMap[unit.name] = { paidQty: 0, freeQty: 0, price: unit.price }
    }
    if (isFree) {
      summaryMap[unit.name].freeQty += 1
    } else {
      summaryMap[unit.name].paidQty += 1
    }
  })

  const descricoes: string[] = []
  for (const [name, data] of Object.entries(summaryMap)) {
    let parts = []
    if (data.paidQty > 0) parts.push(`${data.paidQty}x ${name}`)
    if (data.freeQty > 0) parts.push(`${data.freeQty}x ${name} (GRÁTIS - Fidelidade)`)
    descricoes.push(parts.join(' + '))
  }

  const produtoNomeResumo = descricoes.join(', ')
  const totalQuantidade = unitItems.length

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      cliente_id: user.id,
      status: 'pendente',
      total: total,
      quantidade: totalQuantidade,
      produto_nome: produtoNomeResumo,
      endereco_entrega: 'Retirada/Local'
    })
    .select()
    .single()

  if (orderError) {
    console.error('Erro ao inserir pedido:', orderError)
    return { error: 'Erro ao registrar o pedido no banco.' }
  }

  revalidatePath('/')
  return { success: true, orderId: order.id }
}