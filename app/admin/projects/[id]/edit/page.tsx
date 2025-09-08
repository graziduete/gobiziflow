import { createClient } from "@/lib/supabase/server"
import { ProjectForm } from "@/components/admin/project-form"
import { notFound } from "next/navigation"
import { ProjectDocsCard } from "@/components/admin/project-docs-card"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

interface EditProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single()

  if (!project) {
    notFound()
  }

  // Debug: verificar se há campos null
  console.log("Project data received:", project)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Editar Projeto</h2>
        <p className="text-muted-foreground">Atualize as informações do projeto</p>
      </div>

      <div className="flex justify-center">
        <ProjectForm project={project} />
      </div>

      {/* Documentos do Projeto */}
      <ProjectDocsCard projectId={project.id} userId={project.created_by || ""} />
    </div>
  )
}
