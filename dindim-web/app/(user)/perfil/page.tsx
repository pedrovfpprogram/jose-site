'use client'

import { useEffect, useState } from 'react'
import { getUserData, updateProfile, signOut } from '../../actions/profile'
import { getUserOrders } from '../../actions/getOrders'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [pontos, setPontos] = useState(0)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const data = await getUserData()
      if (!data.user) { window.location.href = '/login'; return; }
      
      setEmail(data.user.email || '')
      if (data.profile) {
        setNome(data.profile.nome || '')
        setTelefone(data.profile.telefone || '')
        setPontos(data.profile.pontos || 0)
      }

      const hist = await getUserOrders()
      setOrders(hist)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    if (result.error) setStatus({ type: 'error', message: result.error })
    else setStatus({ type: 'success', message: '✅ Atualizado com sucesso!' })
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-green-600">Carregando...</div>

  const freeDindins = Math.floor(pontos / 12)
  const pointsRemainder = pontos % 12

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <button onClick={() => window.location.href = '/'} className="text-slate-600 font-bold">← Voltar</button>
          <h1 className="text-2xl font-extrabold text-slate-800">Minha Conta</h1>
        </div>

        {/* CLUBE FIDELIDADE */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-3xl p-6 text-white shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black">Clube Dindim Fidelidade</h2>
              <p className="text-amber-100 font-medium text-sm">Cada 12 pontos = 1 Dindim Grátis!</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl text-center">
              <span className="block text-3xl font-black">{pontos}</span>
              <span className="block text-xs font-bold uppercase">Pontos</span>
            </div>
          </div>

          <div className="bg-black/10 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-xs uppercase font-extrabold text-amber-100">Dindins Grátis Disponíveis</p>
              <p className="text-2xl font-black">{freeDindins} 🎁</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-100 font-bold">Faltam {12 - pointsRemainder} pts</p>
              <p className="text-xs font-medium">para o próximo bônus</p>
            </div>
          </div>
        </div>

        {/* DADOS DO USUÁRIO */}
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Meus Dados</h2>
          {status.message && <div className="text-green-600 font-bold">{status.message}</div>}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
            <input 
              type="text" name="nome" value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold placeholder-slate-400 focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Celular</label>
            <input 
              type="tel" name="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)}
              placeholder="(86) 99999-9999"
              className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold placeholder-slate-400 focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800">
            {saving ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </form>

        {/* HISTÓRICO DE PEDIDOS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Histórico de Pedidos</h2>
          {orders.length === 0 ? (
            <p className="text-slate-500">Você ainda não fez nenhum pedido.</p>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">{o.quantidade}x {o.produto_nome || 'Dindim'}</p>
                    <p className="text-xs text-slate-500">{new Date(o.criado_em).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-600">R$ {o.total.toFixed(2)}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${o.status === 'entregue' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="button" onClick={async () => { await signOut(); window.location.href = '/' }} className="w-full text-red-500 font-bold py-2">
          Sair da Conta
        </button>

      </div>
    </div>
  )
}