import { ClientAdminForm } from "@/components/admin/client-admin-form"
import { UserCog, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewAdminPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/client-management/admins"
              className="absolute top-4 left-4 text-purple-600 hover:text-purple-700 text-lg font-medium p-1 rounded-md hover:bg-purple-50 transition-colors"
              title="Voltar para lista"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-4 ml-12">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <UserCog className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                  Novo Administrador
                </h2>
                <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Cadastre um novo administrador para uma empresa cliente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClientAdminForm />
    </div>
  )
}
