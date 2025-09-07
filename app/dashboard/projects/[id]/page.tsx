"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClientProjectDetail } from "@/components/client/client-project-detail"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  project_type: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  estimated_hours: number | null
  consumed_hours: number | null
  created_at: string
  company_id: string
  companies?: {
    id: string
    name: string
    logo_url: string | null
    has_hour_package: boolean
    contracted_hours: number | null
  } | null
  profiles?: {
    full_name: string
  } | null
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProject()
  }, [resolvedParams.id])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/client/project/${resolvedParams.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar projeto")
      }

      setProject(data.project)
    } catch (error) {
      console.error("Erro ao buscar projeto:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "homologation":
        return "bg-purple-100 text-purple-800"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800"
      case "delayed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "in_progress":
        return "Em Andamento"
      case "homologation":
        return "Homologação"
      case "on_hold":
        return "Pausado"
      case "delayed":
        return "Atrasado"
      case "cancelled":
        return "Cancelado"
      default:
        return "Planejamento"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgente"
      case "high":
        return "Alta"
      case "medium":
        return "Média"
      default:
        return "Baixa"
    }
  }

  const getProjectTypeText = (projectType: string | null) => {
    if (!projectType) return "Não definido"
    
    switch (projectType) {
      case "automation":
        return "Automação"
      case "data_analytics":
        return "Data & Analytics"
      case "digital_development":
        return "Desenvolvimento Digital"
      case "design":
        return "Design"
      case "consulting":
        return "Consultoria"
      case "project_management":
        return "Gestão de Projetos"
      case "system_integration":
        return "Integração de Sistemas"
      case "infrastructure":
        return "Infraestrutura/Cloud"
      case "support":
        return "Suporte"
      case "training":
        return "Treinamento"
      default:
        return projectType
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Carregando projeto...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Projetos
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Projeto não encontrado</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Projetos
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
        </div>
      </div>



      {/* Componente Cliente para Cronograma Expandido */}
      <ClientProjectDetail project={project} />
    </div>
  )
}