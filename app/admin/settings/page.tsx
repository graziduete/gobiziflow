import { NotificationSettings } from "@/components/admin/notification-settings"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import { Settings, Sparkles } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Configurações
              </h2>
              <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Gerencie as configurações do sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          }
        >
          <NotificationSettings />
        </Suspense>
      </div>
    </div>
  )
}
