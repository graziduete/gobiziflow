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
  safra?: string | null
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
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-sm"
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-sm"
      case "homologation":
        return "bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-sm"
      case "on_hold":
        return "bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold shadow-sm"
      case "delayed":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-sm"
      case "cancelled":
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white font-semibold shadow-sm"
      default:
        return "bg-gradient-to-r from-slate-500 to-gray-600 text-white font-semibold shadow-sm"
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
            {/* Animação de raio moderna */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Raio animado */}
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                  className="animate-pulse"
                  style={{
                    stroke: 'url(#lightning-gradient-project)',
                    strokeWidth: 0.5,
                    fill: 'url(#lightning-gradient-project)',
                    filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))'
                  }}
                />
                <defs>
                  <linearGradient id="lightning-gradient-project" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Círculo pulsante ao fundo */}
              <div className="absolute inset-0 -z-10 animate-ping opacity-20">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-1">Carregando projeto...</p>
            <p className="text-sm text-slate-500">Aguarde um momento</p>
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