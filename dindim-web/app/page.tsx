// dindim-web/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getActiveProducts } from './actions/getProducts'
import { createOrder } from './actions/createOrder'

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  descricao?: string;
}

export default function VitrineDindim() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Estado para controlar a quantidade de cada produto { [productId]: quantidade }
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadProducts() {
      const result = await getActiveProducts()
      if (result.products) {
        setProducts(result.products)
        // Inicializa todos os produtos com quantidade 1
        const initialQuantities: Record<string, number> = {}
        result.products.forEach(p => initialQuantities[p.id] = 1)
        setQuantities(initialQuantities)
      }
      setLoading(false)
    }
    loadProducts()
  }, [])

  const handleQuantity = (id: string, delta: number, max: number) => {
    setQuantities(prev => {
      const current = prev[id] || 1
      const newVal = current + delta
      // Impede de pedir menos de 1 ou mais que o estoque disponível
      if (newVal < 1 || newVal > max) return prev
      return { ...prev, [id]: newVal }
    })
  }

  const handleBuy = async (productId: string) => {
    setProcessingId(productId)
    setStatus({ type: 'info', message: 'Verificando autenticação...' })
    
    // Como removemos o endereço da tela, vamos enviar um valor temporário
    // até criarmos a tela de Checkout/Perfil do usuário.
    const formData = new FormData()
    formData.append('endereco_entrega', 'Endereço vinculado ao Perfil (A implementar)')
    
    const quantity = quantities[productId] || 1
    const items = [{ productId, quantity }]

    try {
      const result = await createOrder(formData, items)
      
      if (result.error) {
        // Se a Server Action barrar por falta de login, exibimos a mensagem de erro
        setStatus({ type: 'error', message: `❌ ${result.error}` })
      } else {
        setStatus({ type: 'success', message: `✅ Sucesso! Pedido #${result.orderId.slice(0, 8)} recebido.` })
      }
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Erro de conexão. Tente novamente.' })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-gradient-to-r from-green-600 to-emerald-500 shadow-md py-12 px-6 text-center rounded-b-[2rem] sm:rounded-b-[4rem] mb-10">
        {/* Adicione isto logo abaixo da abertura da tag <header> */}
        <div className="flex justify-end mb-4">
          <a href="/perfil" className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-full backdrop-blur-sm transition flex items-center gap-2 text-sm">
            👤 Meu Perfil / Login
          </a>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm mb-3">
          Dindim Gourmet
        </h1>
        <p className="text-green-50 text-lg md:text-xl font-medium max-w-xl mx-auto">
          Faça login, acumule pontos e peça o seu!
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-20">
        {/* Alerta de Status Global */}
        {status.message && (
          <div className={`mb-8 p-4 rounded-xl text-center text-sm font-bold shadow-sm ${
            status.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 
            status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 
            'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {status.message}
            {/* Botão de atalho para login caso o erro seja de acesso negado */}
            {status.type === 'error' && status.message.includes('logado') && (
              <a href="/login" className="ml-4 underline text-red-800 hover:text-red-900">
                Fazer Login agora
              </a>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Cardápio do Dia</h2>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
            {products.length} sabores
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-lg">Estamos preparando novos sabores. Volte mais tarde!</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const isProcessing = processingId === product.id
              const isOutOfStock = product.estoque <= 0
              const currentQuantity = quantities[product.id] || 1

              return (
                <article key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-slate-100 overflow-hidden flex flex-col">
                  <div className="h-32 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                    <span className="text-5xl">🧊</span>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-slate-800 leading-tight">{product.nome}</h3>
                        <span className="text-lg font-black text-green-600">R$ {product.preco.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.descricao || 'Sabor irresistível.'}</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-400 mb-3 flex items-center justify-between">
                        <span>📦 Estoque: {isOutOfStock ? <span className="text-red-500">Esgotado</span> : `${product.estoque} un.`}</span>
                      </p>

                      {/* Controle de Quantidade */}
                      {!isOutOfStock && (
                        <div className="flex items-center justify-between mb-4 bg-slate-50 p-1 rounded-lg border border-slate-200">
                          <button 
                            onClick={() => handleQuantity(product.id, -1, product.estoque)}
                            className="w-10 h-10 flex items-center justify-center text-slate-600 text-xl font-bold bg-white rounded-md shadow-sm hover:bg-slate-100 active:scale-95 transition"
                          >-</button>
                          <span className="font-black text-lg text-slate-800">{currentQuantity}</span>
                          <button 
                            onClick={() => handleQuantity(product.id, 1, product.estoque)}
                            className="w-10 h-10 flex items-center justify-center text-green-600 text-xl font-bold bg-white rounded-md shadow-sm hover:bg-green-50 active:scale-95 transition"
                          >+</button>
                        </div>
                      )}

                      <button
                        onClick={() => handleBuy(product.id)}
                        disabled={isProcessing || isOutOfStock}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all transform active:scale-95 flex justify-center items-center gap-2 ${
                          isOutOfStock 
                            ? 'bg-slate-300 cursor-not-allowed' 
                            : isProcessing
                              ? 'bg-emerald-400 cursor-wait'
                              : 'bg-green-600 hover:bg-green-500 shadow-md hover:shadow-green-200'
                        }`}
                      >
                        {isProcessing ? 'Verificando...' : isOutOfStock ? 'Esgotado' : `Pedir ${currentQuantity}x`}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}