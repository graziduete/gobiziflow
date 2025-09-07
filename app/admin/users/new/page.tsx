import { UserForm } from "@/components/admin/user-form"

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Novo Usuário</h2>
        <p className="text-muted-foreground">Cadastre um novo usuário no sistema</p>
      </div>

      <div className="flex justify-center">
        <UserForm />
      </div>
    </div>
  )
}
