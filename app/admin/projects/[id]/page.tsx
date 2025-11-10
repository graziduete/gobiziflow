import { createClient } from "@/lib/supabase/server"
import { GanttChart } from "@/components/admin/gantt-chart"
import { TaskMetricsCard } from "@/components/admin/task-metrics-card"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/status-badge"
import { PriorityBadge } from "@/components/shared/priority-badge"

interface ProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar permissões do usuário
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_client_admin')
    .eq('id', user.id)
    .single()

  // Buscar projeto com filtro baseado no role
  let projectQuery = supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      status,
      priority,
      start_date,
      end_date,
      budget,
      company_id,
      technical_responsible,
      key_user,
      estimated_hours,
      tenant_id
    `)
    .eq("id", id)
  
  // Aplicar filtro baseado no role
  if (profile?.is_client_admin) {
    // Client Admin: apenas projetos do seu tenant
    const { data: clientAdmin } = await supabase
      .from('client_admins')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (clientAdmin?.company_id) {
      projectQuery = projectQuery.eq('tenant_id', clientAdmin.company_id)
    } else {
      notFound()
    }
  } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
    // Admin Normal/Operacional: apenas projetos sem tenant_id
    projectQuery = projectQuery.is('tenant_id', null)
  }
  // Admin Master vê tudo (sem filtro)

  const { data: project } = await projectQuery.single()

  if (!project) {
    notFound()
  }

  // Buscar tarefas do projeto
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      status,
      responsible,
      delay_justification,
      original_end_date,
      actual_start_date,
      actual_end_date,
      predicted_end_date,
      delay_created_at,
      delay_created_by,
      order
    `)
    .eq("project_id", id)
    .order("order", { nullsFirst: false })
    .order("created_at")


  // Buscar nome da empresa
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", project.company_id)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/projects" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors hover:bg-blue-50 rounded-md p-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cronograma do Projeto</h2>
            <p className="text-muted-foreground">
              {project.name} • {company?.name || "Empresa"}
            </p>
          </div>
        </div>
      </div>

      {/* Informações do projeto - visual moderno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-3 bg-white border rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Status</p>
              <StatusBadge status={project.status} type="project" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Prioridade</p>
              <PriorityBadge priority={project.priority} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Horas Estimadas</p>
              <p className="text-lg font-semibold">{project.estimated_hours || 0}h</p>
            </div>
            {project.technical_responsible && (
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Responsável Técnico</p>
                <p className="text-base font-medium text-slate-800">{project.technical_responsible}</p>
              </div>
            )}
            {project.key_user && (
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Key User</p>
                <p className="text-base font-medium text-slate-800">{project.key_user}</p>
              </div>
            )}
            {project.budget && (
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Orçamento</p>
                <p className="text-lg font-semibold">R$ {Number(project.budget).toLocaleString("pt-BR")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card de Métricas de Desempenho */}
      <TaskMetricsCard tasks={tasks || []} />

      {/* Gantt Chart Expandido */}
      <div className="mt-8">
        <GanttChart 
          tasks={tasks || []} 
          projectStartDate={project.start_date} 
          projectEndDate={project.end_date}
          projectName={project.name}
          defaultExpanded={true}
        />
      </div>
    </div>
  )
}
