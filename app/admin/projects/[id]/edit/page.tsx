import { createClient } from "@/lib/supabase/server"
import { ProjectForm } from "@/components/admin/project-form"
import { notFound } from "next/navigation"
import { ProjectDocsCard } from "@/components/admin/project-docs-card"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Edit, Sparkles } from "lucide-react"

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
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Edit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Editar Projeto
              </h2>
              <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Atualize as informações do projeto
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProjectForm project={project} />

      {/* Documentos do Projeto */}
      <ProjectDocsCard projectId={project.id} userId={project.created_by || ""} />
    </div>
  )
}
