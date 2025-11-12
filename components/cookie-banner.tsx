"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"
import Link from "next/link"

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verifica se o usuário já foi informado sobre os cookies
    const acknowledged = localStorage.getItem("gobiziflow_cookies_acknowledged")
    if (!acknowledged) {
      // Delay de 1s para não aparecer imediatamente
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const handleAcknowledge = () => {
    localStorage.setItem("gobiziflow_cookies_acknowledged", "true")
    localStorage.setItem("gobiziflow_cookies_acknowledged_date", new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-500"
      style={{
        background: "linear-gradient(to right, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))",
        backdropFilter: "blur(8px)",
        borderTop: "2px solid #3b82f6",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Ícone e Texto */}
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-50 rounded-lg shrink-0">
              <Cookie className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">
                🍪 Sobre Cookies
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Usamos apenas <strong>cookies essenciais</strong> para autenticação e segurança da plataforma. 
                Eles são necessários para o funcionamento do sistema e não rastreiam seu comportamento. 
                Saiba mais em nossa{" "}
                <Link 
                  href="/privacy-policy" 
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                  target="_blank"
                >
                  Política de Privacidade
                </Link>
                {" "}e{" "}
                <Link 
                  href="/terms-of-service" 
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                  target="_blank"
                >
                  Termos de Uso
                </Link>.
              </p>
            </div>
          </div>

          {/* Botão */}
          <div className="flex w-full md:w-auto shrink-0">
            <Button
              size="sm"
              onClick={handleAcknowledge}
              className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white text-xs whitespace-nowrap w-full md:w-auto"
            >
              Entendi ✓
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

