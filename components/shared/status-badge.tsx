import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  type?: "project" | "task"
  className?: string
}

export function StatusBadge({ status, type = "project", className }: StatusBadgeProps) {
  const getStatusConfig = (status: string, type: string) => {
    const configs = {
      project: {
        completed: {
          label: "Concluído",
          className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
        },
        in_progress: {
          label: "Em Andamento",
          className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
        },
        on_hold: {
          label: "Pausado",
          className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
        },
        cancelled: {
          label: "Cancelado",
          className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
        },
        planning: {
          label: "Planejamento",
          className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
        },
    commercial_proposal: {
      label: "Proposta Comercial",
      className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    },
      },
      task: {
        completed: {
          label: "Concluída",
          className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
        },
        in_progress: {
          label: "Em Andamento",
          className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
        },
        review: {
          label: "Em Revisão",
          className: "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20",
        },
        todo: {
          label: "A Fazer",
          className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
        },
      },
    }

    return (
      configs[type as keyof typeof configs]?.[status as keyof typeof configs.project] || {
        label: status,
        className: "bg-muted text-muted-foreground",
      }
    )
  }

  const config = getStatusConfig(status, type)

  return (
    <Badge
      variant="outline"
      className={cn("font-medium transition-colors duration-200 text-xs px-2.5 py-0.5", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
