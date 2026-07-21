// dindim-web/app/actions/getProducts.ts
'use server'

import { createClient } from '@/utils/supabase/server'

export async function getActiveProducts() {
  const supabase = await createClient()
  
  // A nossa política de RLS já garante que apenas produtos ativos sejam retornados,
  // mas o filtro '.eq('ativo', true)' adiciona uma camada extra de defesa (Defense in Depth).
  const { data: products, error } = await supabase
    .from('products')
    .select('id, nome, descricao, preco, estoque')
    .eq('ativo', true)

  if (error) {
    console.error('Erro ao buscar catálogo:', error)
    return { error: 'Não foi possível carregar o cardápio no momento.' }
  }

  return { products }
}