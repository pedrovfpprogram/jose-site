'use client'

import { useEffect, useState } from 'react'
import { getActiveProducts } from './actions/getProducts'
import { createCartOrder } from './actions/createOrder'
import { getUserData } from './actions/profile'
import { createClient } from '@/utils/supabase/client'

interface Product {
  id: string; nome: string; preco: number; estoque: number; descricao?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function VitrineDindim() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [processing, setProcessing] = useState(false)
  
  const [cart, setCart] = useState<Record<string, CartItem>>({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loyaltyCount, setLoyaltyCount] = useState(0)

  const supabase = createClient()

  const loadData = async () => {
    const [productsResult, userResult] = await Promise.all([getActiveProducts(), getUserData()])
    if (productsResult.products) setProducts(productsResult.products)
    if (userResult.user) {
      setIsLoggedIn(true)
      setUserId(userResult.user.id)
      if (userResult.profile) {
        setUserPoints(userResult.profile.pontos || 0)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    // ⚡ REALTIME DE PRODUTOS
    const productsChannel = supabase
      .channel('realtime-products-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(productsChannel)
    }
  }, [])

  // ⚡ REALTIME DE PERFIL (Atualiza os pontos instantaneamente)
  useEffect(() => {
    if (!userId) return

    const profileChannel = supabase
      .channel(`realtime-profile-${userId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${userId}` 
      }, (payload) => {
        if (payload.new && typeof payload.new.pontos === 'number') {
          setUserPoints(payload.new.pontos)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profileChannel)
    }
  }, [userId])

  const addToCart = (product: Product) => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    setCart(prev => {
      const currentQty = prev[product.id] ? prev[product.id].quantity : 0
      if (currentQty + 1 > product.estoque) return prev
      return {
        ...prev,
        [product.id]: { product, quantity: currentQty + 1 }
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const current = prev[productId]
      if (!current) return prev
      if (current.quantity > 1) {
        return {
          ...prev,
          [productId]: { ...current, quantity: current.quantity - 1 }
        }
      } else {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      }
    })
  }

  const cartItemsArray = Object.values(cart)
  const totalItemsCount = cartItemsArray.reduce((acc, item) => acc + item.quantity, 0)
  const cartTotalPrice = cartItemsArray.reduce((acc, item) => acc + (item.product.preco * item.quantity), 0)

  const freeDindinsAvailable = Math.floor(userPoints / 12)

  useEffect(() => {
    const maxPossible = Math.min(freeDindinsAvailable, totalItemsCount)
    setLoyaltyCount(maxPossible)
  }, [freeDindinsAvailable, totalItemsCount])

  const unitPrices = cartItemsArray.flatMap(item => Array(item.quantity).fill(item.product.preco)).sort((a, b) => a - b)
  const discountAmount = unitPrices.slice(0, loyaltyCount).reduce((sum, price) => sum + price, 0)
  const finalPrice = Math.max(0, cartTotalPrice - discountAmount)

  const handleCheckout = async () => {
    if (cartItemsArray.length === 0) return
    setProcessing(true)
    setStatus({ type: 'info', message: 'Finalizando pedido...' })

    const payload = cartItemsArray.map(item => ({
      productId: item.product.id,
      name: item.product.nome,
      price: item.product.preco,
      quantity: item.quantity
    }))

    try {
      const result = await createCartOrder(payload, loyaltyCount)
      if (result.error) {
        setStatus({ type: 'error', message: `❌ ${result.error}` })
      } else {
        setStatus({ type: 'success', message: `✅ Pedido #${result.orderId?.slice(0, 6)} realizado com sucesso! Seus pontos foram atualizados.` })
        setCart({})
        setLoyaltyCount(0)
        setIsCartOpen(false)
        await loadData() // Força recarga imediata dos dados do usuário e pontos
      }
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Erro de conexão.' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <header className="bg-gradient-to-r from-green-600 to-emerald-500 shadow-md py-12 px-6 text-center rounded-b-[2rem] sm:rounded-b-[4rem] mb-10 relative">
        <div className="absolute top-6 right-6 flex gap-3">
          <a href="/perfil" className="bg-white/25 hover:bg-white/35 text-white font-bold py-2 px-4 rounded-full backdrop-blur-sm transition flex items-center gap-2 text-sm shadow-sm">
            {isLoggedIn ? `👤 Perfil (${userPoints} pts)` : '🔒 Entrar'}
          </a>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm mb-3 mt-4">
          Dindim Gourmet
        </h1>
        <p className="text-green-50 text-lg md:text-xl font-medium max-w-xl mx-auto">
          Monte seu carrinho e resgate seus prêmios de fidelidade!
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {status.message && (
          <div className={`mb-8 p-4 rounded-xl text-center text-sm font-bold shadow-sm ${
            status.type === 'error' ? 'bg-red-100 text-red-700' : status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>{status.message}</div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800">Cardápio do Dia</h2>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
            {products.length} sabores
          </span>
        </div>
        
        {loading ? <div className="text-center py-20 font-bold text-green-600">Carregando cardápio...</div> : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const isOutOfStock = product.estoque <= 0
              const inCart = cart[product.id]?.quantity || 0

              return (
                <article key={product.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <div className="h-28 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl mb-4 flex items-center justify-center">
                      <span className="text-xl font-black text-green-700 uppercase tracking-wider">{product.nome}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{product.nome}</h3>
                    <span className="text-lg font-black text-green-600">R$ {product.preco.toFixed(2)}</span>
                    <p className="text-xs font-bold text-slate-400 mt-1">Estoque: {product.estoque} un.</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isOutOfStock ? (
                      <button disabled className="w-full py-3.5 bg-slate-200 text-slate-500 rounded-2xl font-bold cursor-not-allowed">
                        Esgotado
                      </button>
                    ) : !isLoggedIn ? (
                      <button onClick={() => window.location.href = '/login'} className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-md hover:bg-slate-800 transition">
                        🔒 Faça Login para Comprar
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        {inCart > 0 ? (
                          <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-1.5 flex-1 border border-slate-200">
                            <button onClick={() => removeFromCart(product.id)} className="w-10 h-10 bg-white rounded-xl font-black text-slate-800 shadow-sm">-</button>
                            <span className="font-extrabold text-slate-900 text-sm">{inCart} no carrinho</span>
                            <button onClick={() => addToCart(product)} className="w-10 h-10 bg-green-600 rounded-xl font-black text-white shadow-sm">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(product)} className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold shadow-md shadow-green-100 transition">
                            Adicionar ao Carrinho 🛒
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* BARRA FLUTUANTE INFERIOR */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 shadow-2xl border-t border-slate-800 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Carrinho ({totalItemsCount} itens)</p>
              <p className="text-2xl font-black text-green-400">R$ {finalPrice.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsCartOpen(true)} className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-2xl font-bold text-sm border border-slate-700 transition">
                Ver Carrinho
              </button>
              <button onClick={handleCheckout} disabled={processing} className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-green-900 transition">
                {processing ? 'Enviando...' : 'Finalizar Pedido 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHADA DO CARRINHO */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900">Seu Carrinho 🛒</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl p-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-2">
              {cartItemsArray.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="font-extrabold text-slate-900">{product.nome}</h4>
                    <p className="text-xs font-bold text-slate-500">R$ {product.preco.toFixed(2)} un.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <button onClick={() => removeFromCart(product.id)} className="font-bold text-slate-600">-</button>
                      <span className="font-black text-slate-900">{quantity}</span>
                      <button onClick={() => addToCart(product)} className="font-bold text-green-600">+</button>
                    </div>
                    <span className="font-black text-green-600 w-20 text-right">R$ {(product.preco * quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {freeDindinsAvailable > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-sm">🎁 Cartão Fidelidade Aplicado!</h4>
                    <p className="text-xs font-bold text-amber-700">Você tem {freeDindinsAvailable} dindim(ns) grátis disponíveis.</p>
                  </div>
                  <span className="bg-amber-200 text-amber-900 text-xs font-black px-3 py-1 rounded-full">
                    {loyaltyCount} aplicado(s)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                  <span className="text-xs font-bold text-amber-800">Usar quantos cupons neste pedido?</span>
                  <select 
                    value={loyaltyCount} 
                    onChange={(e) => setLoyaltyCount(Number(e.target.value))}
                    className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-black text-amber-900 focus:outline-none"
                  >
                    {Array.from({ length: Math.min(freeDindinsAvailable, totalItemsCount) + 1 }, (_, i) => (
                      <option key={i} value={i}>{i} cupom(ns)</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-xl font-black text-slate-900">
                <span>Total a Pagar:</span>
                <span className="text-green-600">R$ {finalPrice.toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} disabled={processing} className="w-full bg-green-600 hover:bg-green-500 text-white font-extrabold py-4 rounded-2xl shadow-lg transition">
                {processing ? 'Processando...' : 'Confirmar e Enviar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}