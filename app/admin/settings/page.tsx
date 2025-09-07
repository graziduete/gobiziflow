import { NotificationSettings } from "@/components/admin/notification-settings"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
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
