import { ProjectForm } from "@/components/admin/project-form"

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Novo Projeto</h2>
        <p className="text-muted-foreground">Cadastre um novo projeto no sistema</p>
      </div>

      <ProjectForm />
    </div>
  )
}
