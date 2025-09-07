import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PriorityBadgeProps {
  priority: string
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: string) => {
    const configs = {
      urgent: {
        label: "Urgente",
        className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
      },
      high: {
        label: "Alta",
        className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
      },
      medium: {
        label: "Média",
        className: "bg-info/10 text-info border-info/20 hover:bg-info/20",
      },
      low: {
        label: "Baixa",
        className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
      },
    }

    return configs[priority as keyof typeof configs] || { label: priority, className: "bg-muted text-muted-foreground" }
  }

  const config = getPriorityConfig(priority)

  return (
    <Badge
      variant="outline"
      className={cn("font-medium transition-colors duration-200 text-xs px-2.5 py-0.5", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
