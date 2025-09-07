import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FolderKanban } from "lucide-react"

interface TaskCardProps {
  task: {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    estimated_hours?: number
    actual_hours?: number
    projects?: {
      name: string
      companies?: {
        name: string
      }
    }
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluída"
      case "in_progress":
        return "Em Andamento"
      case "review":
        return "Em Revisão"
      default:
        return "A Fazer"
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

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed"

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? "border-red-200" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              {task.projects?.name} - {task.projects?.companies?.name}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(task.status)}>{getStatusText(task.status)}</Badge>
            <Badge className={getPriorityColor(task.priority)}>{getPriorityText(task.priority)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600" : ""}`}>
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.due_date).toLocaleDateString("pt-BR")}</span>
                {isOverdue && <span className="text-xs">(Atrasada)</span>}
              </div>
            )}
            {task.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimated_hours}h estimadas</span>
              </div>
            )}
          </div>
        </div>

        {task.status !== "completed" && (
          <div className="flex gap-2">
            {task.status === "todo" && (
              <Button size="sm" className="w-full">
                Iniciar Tarefa
              </Button>
            )}
            {task.status === "in_progress" && (
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                Marcar como Concluída
              </Button>
            )}
            {task.status === "review" && (
              <Button size="sm" variant="outline" className="w-full bg-transparent" disabled>
                Aguardando Revisão
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
