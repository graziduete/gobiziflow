"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateProjectProgress, getProgressStats } from "@/lib/calculate-progress"

interface ProjectProgressProps {
  project: {
    id: string
    name: string
    status: string
    priority: string
    start_date?: string
    end_date?: string
    budget?: number
  }
  tasks: Array<{
    id: string
    status: string
  }>
}

export function ProjectProgress({ project, tasks }: ProjectProgressProps) {
  // Usar cálculo inteligente baseado em status das tasks
  const progress = calculateProjectProgress(tasks)
  const stats = getProgressStats(tasks)
  
  const totalTasks = stats.total
  const completedTasks = stats.completed
  const inProgressTasks = stats.inProgress

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription>Progresso do projeto</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
            <Badge className={getPriorityColor(project.priority)}>{getPriorityText(project.priority)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso Geral</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-600">{inProgressTasks}</p>
            <p className="text-xs text-muted-foreground">Em Andamento</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
        </div>

        {(project.start_date || project.end_date || project.budget) && (
          <div className="pt-2 border-t space-y-2">
            {project.start_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Início:</span>
                <span>{new Date(project.start_date).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Término:</span>
                <span>{new Date(project.end_date).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {project.budget && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Orçamento:</span>
                <span>R$ {Number(project.budget).toLocaleString("pt-BR")}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
