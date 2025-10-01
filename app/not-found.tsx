import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animação de erro 404 */}
        <div className="relative mb-8">
          <div className="text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-500/10 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Título e descrição */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Página não encontrada
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Ops! A página que você está procurando não existe ou foi movida para outro lugar.
          </p>
        </div>

        {/* Ícone ilustrativo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 mb-4">
            <Search className="w-12 h-12" />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Home className="w-4 h-4" />
              Ir para Dashboard
            </Button>
          </Link>
          
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        {/* Links úteis */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Links úteis:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 hover:underline">
              Dashboard
            </Link>
            <Link href="/dashboard/projects" className="text-blue-600 hover:text-blue-700 hover:underline">
              Projetos
            </Link>
            <Link href="/admin" className="text-blue-600 hover:text-blue-700 hover:underline">
              Admin
            </Link>
            <Link href="/admin/responsaveis" className="text-blue-600 hover:text-blue-700 hover:underline">
              Responsáveis
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

