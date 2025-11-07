"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Link2, Calendar, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Task {
  id: string
  name: string
  start_date?: string
  end_date?: string
  status: string
  dependency_type?: string
  predecessor_task_id?: string
}

interface TaskDependencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  allTasks: Task[]
  onSave: (taskId: string, dependencyType: string, predecessorId: string | null) => void
}

export function TaskDependencyModal({
  open,
  onOpenChange,
  task,
  allTasks,
  onSave,
}: TaskDependencyModalProps) {
  const [dependencyType, setDependencyType] = useState<string>(
    task.dependency_type || "independent"
  )
  const [predecessorId, setPredecessorId] = useState<string | null>(
    task.predecessor_task_id || null
  )

  // Atualizar state quando task mudar
  useEffect(() => {
    setDependencyType(task.dependency_type || "independent")
    setPredecessorId(task.predecessor_task_id || null)
  }, [task])

  // Filtrar tarefas disponíveis (não pode depender de si mesma)
  const availableTasks = allTasks.filter((t) => t.id !== task.id)

  // Encontrar tarefa predecessora selecionada
  const selectedPredecessor = predecessorId
    ? availableTasks.find((t) => t.id === predecessorId)
    : null

  const handleSave = () => {
    onSave(
      task.id,
      dependencyType,
      dependencyType === "finish_to_start" ? predecessorId : null
    )
    onOpenChange(false)
  }

  const formatDate = (date?: string) => {
    if (!date) return "Não definida"
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      not_started: { label: "Não Iniciado", color: "bg-slate-100 text-slate-700" },
      in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-700" },
      completed: { label: "Concluído", color: "bg-green-100 text-green-700" },
      completed_delayed: { label: "Concluído com Atraso", color: "bg-orange-100 text-orange-700" },
    }
    const config = statusMap[status] || statusMap.not_started
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Configurar Dependência</DialogTitle>
              <DialogDescription className="mt-1">
                Tarefa: <span className="font-semibold text-foreground">{task.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações da tarefa */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Status atual:</span>
              {getStatusBadge(task.status)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Data Início Planejada:</span>
              <span className="font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(task.start_date)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Data Fim Planejada:</span>
              <span className="font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(task.end_date)}
              </span>
            </div>
          </div>

          {/* Tipo de dependência */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Dependência</Label>
            <RadioGroup
              value={dependencyType}
              onValueChange={setDependencyType}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                <RadioGroupItem value="independent" id="independent" className="mt-0.5" />
                <Label
                  htmlFor="independent"
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="font-semibold">Independente</div>
                  <div className="text-sm text-slate-600">
                    Esta tarefa não depende de outras tarefas
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                <RadioGroupItem value="finish_to_start" id="finish_to_start" className="mt-0.5" />
                <Label
                  htmlFor="finish_to_start"
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="font-semibold">Aguardar término de outra tarefa</div>
                  <div className="text-sm text-slate-600">
                    Esta tarefa só pode iniciar após a conclusão da predecessora
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de tarefa predecessora */}
          {dependencyType === "finish_to_start" && (
            <div className="space-y-3 animate-in fade-in-50 duration-300">
              <Label htmlFor="predecessor" className="text-base font-semibold">
                Tarefa Predecessora
              </Label>
              <Select value={predecessorId || undefined} onValueChange={setPredecessorId}>
                <SelectTrigger id="predecessor" className="h-11">
                  <SelectValue placeholder="Selecione a tarefa predecessora..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Nenhuma outra tarefa disponível
                    </div>
                  ) : (
                    availableTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-xs text-slate-500">
                            {formatDate(t.start_date)} - {formatDate(t.end_date)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Alerta de dependência */}
              {predecessorId && selectedPredecessor && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    <div className="space-y-1">
                      <div>
                        <strong>Predecessora:</strong> {selectedPredecessor.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Status:</span>
                        {getStatusBadge(selectedPredecessor.status)}
                      </div>
                      {selectedPredecessor.status === "completed" ? (
                        <div className="flex items-center gap-1 text-green-700 font-medium mt-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Tarefa pode iniciar (predecessora concluída)
                        </div>
                      ) : (
                        <div className="text-amber-700 font-medium mt-2">
                          ⚠️ Aguardando conclusão da predecessora
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {dependencyType === "finish_to_start" && !predecessorId && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-900">
                    Por favor, selecione uma tarefa predecessora
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={dependencyType === "finish_to_start" && !predecessorId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Salvar Dependência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

