import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientNotificationSettings } from "@/components/client/client-notification-settings"

export default async function ClientProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="space-y-6 px-4 md:px-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">Gerencie suas informações e configurações</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Suas informações de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome Completo</label>
              <p className="text-sm text-muted-foreground">{profile?.full_name || "Não informado"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Usuário</label>
              <p className="text-sm text-muted-foreground">{profile?.role === "admin" ? "Administrador" : "Cliente"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Membro desde</label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile?.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>

        <div>
          <ClientNotificationSettings />
        </div>
      </div>
    </div>
  )
}
