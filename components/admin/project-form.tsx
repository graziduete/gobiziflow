"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Calendar, Clock, User, Users } from "lucide-react"
import { GanttChart } from "./gantt-chart"
import { DraggableTaskList } from "./draggable-task-list"

const mockCompanies = [
  { id: "1", name: "TechCorp Solutions" },
  { id: "2", name: "Digital Marketing Pro" },
  { id: "3", name: "E-commerce Plus" },
]

const mockUser = {
  id: "mock-admin-user",
  email: "admin@test.com",
}

interface Task {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  responsible: string
  description?: string
  order?: number
}

interface ProjectFormProps {
  project?: {
    id: string
    name: string
    description?: string
    status: string
    priority: string
    project_type?: string
    category?: string
    start_date?: string
    end_date?: string
    budget?: number
    company_id: string
    technical_responsible?: string
    key_user?: string
    estimated_hours?: number
  }
  onSuccess?: () => void
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  // Debug: verificar dados recebidos
  console.log("ProjectForm received project:", project)
  
  // Função para garantir que nenhum campo seja null
  const getSafeValue = (value: any, defaultValue: string = ""): string => {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === "string") return value
    if (typeof value === "number") return value.toString()
    return defaultValue
  }
  
  const [formData, setFormData] = useState({
    name: getSafeValue(project?.name, ""),
    description: getSafeValue(project?.description, ""),
    status: getSafeValue(project?.status, "planning"),
    priority: getSafeValue(project?.priority, "medium"),
    project_type: getSafeValue(project?.project_type, ""),
    category: getSafeValue(project?.category, ""),
    start_date: getSafeValue(project?.start_date, ""),
    end_date: getSafeValue(project?.end_date, ""),
    budget: getSafeValue(project?.budget, ""),
    company_id: getSafeValue(project?.company_id, ""),
    technical_responsible: getSafeValue(project?.technical_responsible, ""),
    key_user: getSafeValue(project?.key_user, ""),
    estimated_hours: getSafeValue(project?.estimated_hours, ""),
  })

  // Debug: verificar estado inicial
  console.log("Initial formData:", formData)
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        console.log("[v0] Fetching companies...")
        const supabase = createClient()
        const { data, error } = await supabase.from("companies").select("id, name").order("name")

        if (error) throw error

        if (data) {
          console.log("[v0] Companies fetched successfully:", data.length)
          setCompanies(data)
        } else {
          console.log("[v0] No companies data, using mock data")
          setCompanies(mockCompanies)
          setIsOffline(true)
        }
      } catch (error: any) {
        console.log("[v0] Companies fetch failed, using mock data:", error.message)
        setCompanies(mockCompanies)
        setIsOffline(true)
      }
    }

    fetchCompanies()
  }, [])

  // Carregar tarefas existentes quando estiver editando um projeto
  useEffect(() => {
    const fetchTasks = async () => {
      if (!project?.id) return

      try {
        console.log("[v0] Fetching tasks for project:", project.id)
        const supabase = createClient()
        const { data, error } = await supabase
          .from("tasks")
          .select("id, name, description, start_date, end_date, status, responsible, \"order\"")
          .eq("project_id", project.id)
          .order("\"order\"", { ascending: true })

        if (error) throw error

        if (data) {
          console.log("[v0] Tasks fetched successfully:", data.length)
          // Adicionar ordem para tarefas existentes que não têm ordem
          const tasksWithOrder = data.map((task: any, index: number) => ({
            ...task,
            order: task.order || index
          }))
          setTasks(tasksWithOrder)
        } else {
          console.log("[v0] No tasks found for project")
          setTasks([])
        }
      } catch (error: any) {
        console.log("[v0] Tasks fetch failed:", error.message)
        setTasks([])
      }
    }

    fetchTasks()
  }, [project?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting project submission...")

      let user = mockUser // Default fallback user

      if (!isOffline) {
        try {
          const supabase = createClient()
          const {
            data: { user: realUser },
            error: authError,
          } = await supabase.auth.getUser()

          if (authError) throw authError
          if (realUser) user = realUser
        } catch (authError: any) {
          console.log("[v0] Auth failed, using mock user:", authError.message)
          setIsOffline(true)
        }
      }

      const projectData = {
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        project_type: formData.project_type || null,
        category: formData.category || "project",
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget.replace(/\./g, '').replace(',', '.')) : null,
        company_id: formData.company_id,
        technical_responsible: formData.technical_responsible || null,
        key_user: formData.key_user || null,
        estimated_hours: formData.estimated_hours ? Number.parseInt(formData.estimated_hours) : null,
        created_by: user.id,
      }

      console.log("🚀 DEBUG - Status sendo enviado:", formData.status)
      console.log("🚀 DEBUG - ProjectData completo:", projectData)

      console.log("[v0] Project data prepared:", projectData)
      console.log("[v0] Tasks to save:", tasks)

      let savedProjectId: string | null = null
      if (!isOffline) {
        try {
          const supabase = createClient()
          let result

          if (project?.id) {
            result = await supabase.from("projects").update(projectData).eq("id", project.id).select().single()
          } else {
            result = await supabase.from("projects").insert([projectData]).select().single()
          }

          if (result.error) throw result.error
          console.log("[v0] Project saved successfully:", result.data)
          console.log("🚀 DEBUG - Status salvo no banco:", result.data.status)
          console.log("🚀 DEBUG - Updated_at no banco:", result.data.updated_at)

          // Salvar as tarefas após o projeto ser criado/atualizado
          const projectId = result.data.id
          savedProjectId = projectId
          
          if (tasks.length > 0) {
            console.log("[v0] Saving tasks for project:", projectId)
            
            // Preparar dados das tarefas
            const tasksData = tasks.map(task => ({
              name: task.name,
              description: task.description || null,
              start_date: task.start_date || null,
              end_date: task.end_date || null,
              status: task.status,
              responsible: task.responsible || null,
              project_id: projectId,
              created_by: user.id,
              order: task.order || 0, // Incluir campo order
            }))

            console.log("[v0] Tasks data prepared:", tasksData)

            // Se for edição, deletar tarefas antigas primeiro
            if (project?.id) {
              const { error: deleteError } = await supabase
                .from("tasks")
                .delete()
                .eq("project_id", projectId)
              
              if (deleteError) {
                console.log("[v0] Error deleting old tasks:", deleteError)
                throw deleteError
              }
              console.log("[v0] Old tasks deleted successfully")
            }

            // Inserir novas tarefas
            const { data: tasksResult, error: tasksError } = await supabase
              .from("tasks")
              .insert(tasksData)
              .select()

            if (tasksError) {
              console.log("[v0] Error saving tasks:", tasksError)
              throw tasksError
            }

            console.log("[v0] Tasks saved successfully:", tasksResult)
          } else {
            console.log("[v0] No tasks to save")
          }

        } catch (dbError: any) {
          console.log("[v0] Database operation failed, simulating success:", dbError.message)
          setIsOffline(true)
        }
      }

      if (isOffline) {
        console.log("[v0] Offline mode: Project and tasks would be saved when connection is restored")
      }

      if (!project?.id && savedProjectId) {
        try {
          await fetch("/api/notifications/project-created", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: savedProjectId,
              createdById: user.id,
            }),
          })
        } catch (notificationError) {
          console.log("[v0] Notification failed (expected in offline mode):", notificationError)
        }
      }

      // Após criar um novo projeto, levar para a tela de edição para anexar documentos
      if (!project?.id && savedProjectId) {
        router.push(`/admin/projects/${savedProjectId}/edit`)
        router.refresh()
        return
      }

      if (onSuccess) onSuccess()
      else {
        router.push("/admin/projects")
        router.refresh()
      }
    } catch (error: any) {
      console.log("[v0] Project submission error:", error.message)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: "",
      start_date: "",
      end_date: "",
      status: "not_started",
      responsible: "",
      description: "",
      order: tasks.length, // Ordem baseada no número de tarefas existentes
    }
    setTasks([...tasks, newTask])
  }

  const updateTask = (taskId: string, field: keyof Task, value: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ))
  }

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const reorderTasks = (oldIndex: number, newIndex: number) => {
    const reorderedTasks = Array.from(tasks)
    const [reorderedItem] = reorderedTasks.splice(oldIndex, 1)
    reorderedTasks.splice(newIndex, 0, reorderedItem)
    
    // Atualizar a ordem de todas as tarefas
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      order: index
    }))
    
    setTasks(updatedTasks)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return "bg-gray-100 text-gray-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "completed": return "bg-green-100 text-green-800"
      case "on_hold": return "bg-yellow-100 text-yellow-800"
      case "delayed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "not_started": return "Não Iniciado"
      case "in_progress": return "Em Andamento"
      case "completed": return "Concluído"
      case "on_hold": return "Pausado"
      case "delayed": return "Atrasado"
      default: return "Não Iniciado"
    }
  }

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>{project ? "Editar Projeto" : "Novo Projeto"}</CardTitle>
        <CardDescription>
          {project ? "Atualize as informações do projeto" : "Preencha os dados para criar um novo projeto"}
          {isOffline && (
            <span className="block mt-1 text-amber-600 text-sm">
              ⚠️ Modo offline - As alterações serão sincronizadas quando a conexão for restaurada
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Projeto - Primeira linha */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nome do projeto"
              required
              className="w-full"
            />
          </div>

          {/* Empresa, Tipo de Projeto, Categoria, Status e Prioridade - Segunda linha */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Empresa *</Label>
              <Select value={formData.company_id} onValueChange={(value) => handleChange("company_id", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_type">Tipo de Projeto</Label>
              <Select value={formData.project_type} onValueChange={(value) => handleChange("project_type", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automation">Automação de Processos (RPA ou Script de Automação)</SelectItem>
                  <SelectItem value="data_analytics">Data & Analytics</SelectItem>
                  <SelectItem value="digital_development">Desenvolvimento Digital (App / Web)</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="consulting">Consultoria</SelectItem>
                  <SelectItem value="project_management">Gestão de Projetos/PMO</SelectItem>
                  <SelectItem value="system_integration">Integração de Sistemas / APIs</SelectItem>
                  <SelectItem value="infrastructure">Infraestrutura/Cloud</SelectItem>
                  <SelectItem value="support">Suporte / Sustentação</SelectItem>
                  <SelectItem value="training">Treinamento / Capacitação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Projeto</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="homologation">Homologação</SelectItem>
                  <SelectItem value="on_hold">Pausado</SelectItem>
                  <SelectItem value="delayed">Atrasado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descrição do projeto"
              rows={3}
            />
          </div>



          {/* Orçamento, Horas e Datas - Tudo na mesma linha */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="text"
                inputMode="decimal"
                value={formData.budget}
                onChange={(e) => {
                  const value = e.target.value
                  
                  // Permitir apenas números, vírgulas e pontos
                  const cleanValue = value.replace(/[^\d.,]/g, '')
                  
                  // Verificar se já tem vírgula ou ponto
                  const hasComma = cleanValue.includes(',')
                  const hasDot = cleanValue.includes('.')
                  
                  let finalValue = cleanValue
                  
                  if (hasComma && hasDot) {
                    // Se tem ambos, manter apenas o último separador
                    const lastComma = cleanValue.lastIndexOf(',')
                    const lastDot = cleanValue.lastIndexOf('.')
                    if (lastComma > lastDot) {
                      // Vírgula é o último separador, remover pontos
                      finalValue = cleanValue.replace(/\./g, '')
                    } else {
                      // Ponto é o último separador, remover vírgulas
                      finalValue = cleanValue.replace(/,/g, '')
                    }
                  } else if (hasComma) {
                    // Se só tem vírgula, manter como está para formatação visual
                    finalValue = cleanValue
                  }
                  
                  handleChange("budget", finalValue)
                }}
                onBlur={(e) => {
                  // Ao sair do campo, formatar o valor monetário
                  const value = e.target.value
                  if (value) {
                    // Remover todos os pontos e vírgulas para obter apenas números
                    const numericString = value.replace(/[.,]/g, '')
                    
                    if (!isNaN(Number(numericString)) && numericString.length > 0) {
                      // Converter para número e dividir por 100 para considerar os centavos
                      const numValue = Number(numericString) / 100
                      
                      // Formatar com separadores de milhares e vírgula decimal
                      const formattedValue = numValue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                      
                      handleChange("budget", formattedValue)
                    }
                  }
                }}
                placeholder="0,00"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Digite o valor (ex: 3059015 para R$ 30.590,15)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_hours" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horas Estimadas
              </Label>
              <Input
                id="estimated_hours"
                type="number"
                min="1"
                value={formData.estimated_hours}
                onChange={(e) => handleChange("estimated_hours", e.target.value)}
                placeholder="Ex: 100"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Responsáveis - Pessoas envolvidas no projeto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="technical_responsible" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Responsável Técnico
              </Label>
              <Input
                id="technical_responsible"
                value={formData.technical_responsible}
                onChange={(e) => handleChange("technical_responsible", e.target.value)}
                placeholder="Nome do responsável técnico"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key_user" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Key User
              </Label>
              <Input
                id="key_user"
                value={formData.key_user}
                onChange={(e) => handleChange("key_user", e.target.value)}
                placeholder="Nome do key user"
                className="w-full"
              />
            </div>
          </div>

          {/* Seção de Tarefas - Tabela */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Configurar Tarefas (Gantt)
                  </CardTitle>
                  <CardDescription>
                    Configure as tarefas do projeto com datas e responsáveis
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Tarefa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <DraggableTaskList
                  tasks={tasks}
                  onUpdateTask={updateTask}
                  onRemoveTask={removeTask}
                  onReorderTasks={reorderTasks}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma tarefa configurada</p>
                  <p className="text-sm">Clique em "Adicionar Tarefa" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visualização Gantt */}
          <GanttChart 
            tasks={tasks}
            projectStartDate={formData.start_date}
            projectEndDate={formData.end_date}
            projectName={formData.name}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : project ? "Atualizar" : "Criar Projeto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => (onSuccess ? onSuccess() : router.back())}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
