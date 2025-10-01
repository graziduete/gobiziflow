"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function RedirectToAdmin() {
  const router = useRouter()

  useEffect(() => {
    console.log("🔄 [RedirectToAdmin] Redirecting to /admin")
    router.push("/admin")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {/* Animação de raio moderna */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Raio animado */}
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <path 
              d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
              className="animate-pulse"
              style={{
                stroke: 'url(#lightning-gradient-redirect)',
                strokeWidth: 0.5,
                fill: 'url(#lightning-gradient-redirect)',
                filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
              }}
            />
            <defs>
              <linearGradient id="lightning-gradient-redirect" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          {/* Círculo pulsante ao fundo */}
          <div className="absolute inset-0 -z-10 animate-ping opacity-20">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-700 mb-1">Redirecionando para o painel administrativo...</p>
        <p className="text-sm text-slate-500">Aguarde um momento</p>
      </div>
    </div>
  )
}