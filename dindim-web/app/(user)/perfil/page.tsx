// dindim-web/app/(user)/perfil/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getUserData, updateProfile, signOut } from '../../actions/profile'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  useEffect(() => {
    async function loadData() {
      const data = await getUserData()
      if (!data.user) {
        window.location.href = '/login' // Redireciona se não estiver logado
        return
      }
      setEmail(data.user.email || '')
      if (data.profile) {
        setNome(data.profile.nome || '')
        setTelefone(data.profile.telefone || '')
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setStatus({ type: 'info', message: 'Salvando...' })

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    if (result.error) {
      setStatus({ type: 'error', message: `❌ ${result.error}` })
    } else {
      setStatus({ type: 'success', message: '✅ Perfil atualizado com sucesso!' })
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/' // Volta pra vitrine
  }

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center bg-slate-50 text-green-600 font-bold text-xl">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* Cabeçalho de Navegação */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => window.location.href = '/'} className="text-slate-500 hover:text-green-600 font-bold transition">
            ← Voltar à Vitrine
          </button>
          <h1 className="text-2xl font-extrabold text-slate-800">Minha Conta</h1>
        </div>

        {/* Card do Perfil */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Avatar e Boas vindas */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-md mb-3">
              {nome ? nome.charAt(0).toUpperCase() : '👤'}
            </div>
            <h2 className="text-xl font-bold text-white">{nome || 'Novo Cliente'}</h2>
            <p className="text-green-100 text-sm">Membro Dindim Fidelidade</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {status.message && (
              <div className={`p-3 rounded-lg text-sm font-bold text-center ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {status.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">E-mail (Login)</label>
              <input 
                type="email" 
                value={email} 
                disabled 
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                title="Para mudar o e-mail é necessário verificação de segurança."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como quer ser chamado?"
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Celular</label>
              <input 
                type="tel" 
                name="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 space-y-3">
              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-md transition disabled:bg-slate-400"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>

              <button 
                type="button" 
                onClick={handleLogout}
                className="w-full bg-white border-2 border-red-100 hover:bg-red-50 text-red-600 font-bold py-3 rounded-xl transition"
              >
                Sair da Conta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}