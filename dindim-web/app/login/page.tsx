// dindim-web/app/login/page.tsx
'use client'

import { useState } from 'react'
import { loginAction, signupAction } from '../actions/auth'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true) // Alterna entre Entrar e Criar Conta
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: 'info', message: 'Verificando...' })

    const formData = new FormData(e.currentTarget)
    
    // Chama a ação correspondente baseada no estado da tela
    const result = isLogin 
      ? await loginAction(formData) 
      : await signupAction(formData)

    if (result.error) {
      setStatus({ type: 'error', message: `❌ ${result.error}` })
      setLoading(false)
    } else {
      setStatus({ type: 'success', message: '✅ Acesso liberado! Redirecionando...' })
      // Redireciona para o perfil onde ele pode colocar nome e telefone
      window.location.href = '/perfil' 
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Dindim Gourmet
          </h1>
          <p className="text-green-100 font-medium">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta e ganhe pontos.'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {status.message && (
            <div className={`p-3 rounded-xl text-sm font-bold text-center ${
              status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 
              status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 
              'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              {status.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="seu@email.com"
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              name="password"
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl shadow-md transition disabled:bg-slate-400 mt-2"
          >
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        {/* Rodapé - Alternador de Tela */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-slate-600 text-sm">
            {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
          </p>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setStatus({ type: '', message: '' }) // Limpa os erros ao trocar de tela
            }}
            className="text-green-600 font-bold mt-2 hover:underline"
          >
            {isLogin ? 'Criar uma conta agora' : 'Fazer login'}
          </button>
        </div>
      </div>
      
      {/* Botão flutuante para voltar à loja */}
      <a href="/" className="absolute top-6 left-6 text-slate-500 hover:text-green-600 font-bold transition flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-sm">
        ← Voltar à Loja
      </a>
    </div>
  )
}