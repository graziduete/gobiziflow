import { createClient } from "@/lib/supabase/server"
import { UserForm } from "@/components/admin/user-form"
import { notFound } from "next/navigation"

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const supabase = await createClient()

  const { data: user } = await supabase.from("profiles").select("*").eq("id", params.id).single()

  if (!user) {
    notFound()
  }

  // Verificar permissões: apenas admin_master pode editar outros admin_master
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (currentUser) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    // Se o usuário sendo editado é admin_master e o usuário atual não é admin_master, negar acesso
    if (user.role === "admin_master" && currentProfile?.role !== "admin_master") {
      notFound() // Retorna 404 para não revelar a existência da página
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Editar Usuário</h2>
        <p className="text-muted-foreground">Atualize as informações do usuário</p>
      </div>

      <div className="flex justify-center">
        <UserForm user={user} />
      </div>
    </div>
  )
}
