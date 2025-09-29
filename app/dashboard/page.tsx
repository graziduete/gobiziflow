"use client"

import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FolderKanban, Clock, TrendingUp, AlertTriangle, Calendar, CheckCircle, PlayCircle, PauseCircle } from "lucide-react"
import Image from "next/image"
import { HourService } from "@/lib/hour-service"
import { ClientDashboardFilters } from "@/components/client/client-dashboard-filters"
import { useClientData } from "@/hooks/use-client-data"
import { useState, useEffect, useMemo } from "react"
import { GanttView } from "@/components/admin/gantt-view"
import { DashboardLoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function ClientDashboard() {
  const { projects, company, isLoading, error, stats } = useClientData()
  const [dashboardHourStats, setDashboardHourStats] = useState({
    totalContractedHours: 0,
    totalConsumedHours: 0,
    totalRemainingHours: 0,
    companiesWithPackages: 0
  })
  const [filteredProjects, setFilteredProjects] = useState(projects)

  useEffect(() => {
    if (company?.id) {
      loadHourStats()
    }
  }, [company?.id])

  useEffect(() => {
    setFilteredProjects(projects)
  }, [projects])

  const loadHourStats = async () => {
    if (!company?.id) return
    
    try {
      const hourStats = await HourService.getDashboardHourStats(company.id)
      setDashboardHourStats(hourStats)
    } catch (error) {
      console.error("Erro ao carregar estatísticas de horas:", error)
    }
  }

  if (isLoading) {
    return <DashboardLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar dados: {error}</p>
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload()
                }
              }} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium">Nenhuma empresa associada</h3>
          <p className="text-muted-foreground">Entre em contato com o administrador</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo, {company.name}
          </p>
        </div>
        {company.logo_url && (
          <div className="flex items-center space-x-4">
            <Image
              src={company.logo_url}
              alt={`Logo ${company.name}`}
              width={100}
              height={40}
              className="object-contain"
              style={{ 
                maxWidth: '100px', 
                maxHeight: '40px', 
                width: 'auto', 
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Projetos"
          value={stats.totalProjects.toString()}
          description="Projetos da empresa"
          icon={FolderKanban}
        />
        <StatsCard
          title="Projetos em Planejamento"
          value={stats.projectsInPlanning.toString()}
          description="Aguardando início"
          icon={Calendar}
        />
        <StatsCard
          title="Projetos em Andamento"
          value={stats.projectsInProgress.toString()}
          description="Em desenvolvimento"
          icon={PlayCircle}
        />
        <StatsCard
          title="Projetos Atrasados"
          value={stats.projectsDelayed.toString()}
          description="Fora do prazo"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Projetos Concluídos"
          value={stats.projectsCompleted.toString()}
          description="Finalizados"
          icon={CheckCircle}
        />
        <StatsCard
          title="Total de Horas Contratadas"
          value={dashboardHourStats.totalContractedHours.toString()}
          description="Horas"
          icon={Clock}
        />
        <StatsCard
          title="Total de Horas Consumidas"
          value={dashboardHourStats.totalConsumedHours.toString()}
          description="Horas utilizadas"
          icon={TrendingUp}
        />
        <StatsCard
          title="Total de Horas Restantes"
          value={dashboardHourStats.totalRemainingHours.toString()}
          description="Horas disponíveis"
          icon={Clock}
        />
      </div>

      {/* Filtros */}
      <ClientDashboardFilters
        projects={projects}
        companies={company ? [company] : []}
        defaultCompanyId={company?.id || ""}
        onProjectsChange={setFilteredProjects}
      />

      {/* Visão Geral dos Cronogramas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visão Geral dos Cronogramas
          </CardTitle>
          <CardDescription>
            Cronograma de todos os projetos da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GanttView 
            projects={filteredProjects} 
            allProjects={projects}
            companies={company ? [company] : []} 
          />
        </CardContent>
      </Card>
    </div>
  )
}