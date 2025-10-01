"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Círculos animados de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full animate-blob" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full animate-blob animation-delay-2000" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full animate-blob animation-delay-4000" />
        </div>

        {/* Animação de erro 404 */}
        <div className="relative mb-12">
          <div className="text-[200px] md:text-[250px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 leading-none select-none animate-pulse">
            404
          </div>
          
          {/* Pontos flutuantes decorativos */}
          <div className="absolute top-10 left-1/4 w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="absolute top-20 right-1/4 w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          <div className="absolute bottom-10 left-1/3 w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Título e descrição */}
        <div className="space-y-4 mb-12 relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Página não encontrada
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
            Ops! A página que você está procurando não existe ou foi movida para outro lugar.
          </p>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
          <Link href="/dashboard">
            <Button 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Voltar para o Dashboard
            </Button>
          </Link>
          
          <Button
            size="lg"
            variant="outline"
            className="gap-2 border-2 hover:bg-slate-50 transition-all duration-300 transform hover:scale-105"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
            Página Anterior
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-sm text-gray-400 relative z-10">
          <p>© {new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

