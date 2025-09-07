import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar, DollarSign, Clock } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import { PriorityBadge } from "@/components/shared/priority-badge"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string
    status: string
    priority: string
    start_date?: string
    end_date?: string
    budget?: number
    companies?: {
      name: string
    }
  }
  tasks: Array<{
    status: string
  }>
}

export function ProjectCard({ project, tasks }: ProjectCardProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const isOverdue = project.end_date && new Date(project.end_date) < new Date() && project.status !== "completed"

  return (
    <Card
      className={cn(
        "group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm",
        isOverdue && "border-destructive/30 hover:border-destructive/50",
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 truncate">
              {project.name}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              {project.companies?.name}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <StatusBadge status={project.status} type="project" />
            <PriorityBadge priority={project.priority} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{project.description}</p>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-foreground">Progresso</span>
            <span className="font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5 bg-muted/50" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {completedTasks} de {totalTasks} tarefas concluídas
            </span>
            {isOverdue && <span className="text-destructive font-medium">Atrasado</span>}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {project.start_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(project.start_date).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(project.end_date).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </div>
          {project.budget && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-success">
              <DollarSign className="h-3.5 w-3.5" />
              <span>R$ {Number(project.budget).toLocaleString("pt-BR")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
