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
import { Plus, Trash2, Calendar, Clock, User, Users, FileText, AlertTriangle } from "lucide-react"
import { GanttChart } from "./gantt-chart"
import { DraggableTaskList } from "./draggable-task-list"
import { formatDateBrazil } from "@/lib/utils/status-translation"

// Removidos os mocks - usando apenas dados reais

// ID da Copersucar para campos condicionais
const COPERSUCAR_ID = '443a6a0e-768f-48e4-a9ea-0cd972375a30'

interface Task {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  responsible: string
  description?: string
  order?: number
  project_id?: string // ← ADICIONAR project_id!
  delay_justification?: string
  original_end_date?: string
  actual_end_date?: string
  delay_created_at?: string
  delay_created_by?: string
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
    hourly_rate?: number
    safra?: string
  }
  onSuccess?: () => void
  preloadedCompanies?: any[]
}

export function ProjectForm({ project, onSuccess, preloadedCompanies }: ProjectFormProps) {
  // Debug: verificar dados recebidos
  console.log("ProjectForm received project:", project)
  
  // Estado para controlar o perfil do usuário
  const [userRole, setUserRole] = useState<string | null>(null)
  
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
    hourly_rate: getSafeValue(project?.hourly_rate, ""),
    safra: getSafeValue(project?.safra, ""),
  })

  // Debug: verificar estado inicial
  console.log("Initial formData:", formData)
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true)
  const [companiesLoaded, setCompaniesLoaded] = useState(false)
  
  // Cache global para empresas - evita recarregamento
  const [globalCompaniesCache, setGlobalCompaniesCache] = useState<any[]>([])
  
  // Estado para rastrear qual campo foi calculado automaticamente
  const [calculatedField, setCalculatedField] = useState<'budget' | 'hourly_rate' | 'estimated_hours' | null>(null)
  const [lastEditedField, setLastEditedField] = useState<'budget' | 'hourly_rate' | 'estimated_hours' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalidTasks, setInvalidTasks] = useState<Set<string>>(new Set())
  const [showDateValidationModal, setShowDateValidationModal] = useState(false)
  // Removido isOffline - não usando mais mocks
  const router = useRouter()

  // Carregar empresas IMEDIATAMENTE - antes de qualquer coisa
  useEffect(() => {
    // PRIORIDADE MÁXIMA: Se temos empresas pré-carregadas do servidor, usar IMEDIATAMENTE
    if (preloadedCompanies && preloadedCompanies.length > 0) {
      console.log("[v0] Using PRELOADED companies from server:", preloadedCompanies.length)
      setCompanies(preloadedCompanies)
      setGlobalCompaniesCache(preloadedCompanies) // Cache global também
      setIsLoadingCompanies(false)
      setCompaniesLoaded(true)
      return
    }

    // Se já temos cache global, usar imediatamente
    if (globalCompaniesCache.length > 0) {
      console.log("[v0] Using global companies cache:", globalCompaniesCache.length)
      setCompanies(globalCompaniesCache)
      setIsLoadingCompanies(false)
      setCompaniesLoaded(true)
      return
    }

    // Se já carregou empresas antes, usar cache local
    if (companiesLoaded) {
      setIsLoadingCompanies(false)
      return
    }

    // Carregar empresas com MÁXIMA PRIORIDADE
    const fetchCompaniesImmediately = async () => {
      try {
        console.log("[v0] Fetching companies IMMEDIATELY...")
        const supabase = createClient()
        
        // Query ultra otimizada - buscar empresas primeiro, sem filtros complexos
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Usuário não autenticado')
        }

        // PRIMEIRA QUERY: Buscar todas as empresas (mais rápido)
        const { data: allCompanies, error: companiesError } = await supabase
          .from("companies")
          .select("id, name, tenant_id")
          .order("name")

        if (companiesError) throw companiesError

        // SEGUNDA QUERY: Buscar perfil do usuário (em paralelo)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_client_admin')
          .eq('id', user.id)
          .single()

        let filteredCompanies = allCompanies || []

        // Aplicar filtros localmente (mais rápido)
        if (profile?.is_client_admin) {
          const { data: clientAdmin } = await supabase
            .from('client_admins')
            .select('company_id')
            .eq('id', user.id)
            .single()
          
          if (clientAdmin?.company_id) {
            filteredCompanies = allCompanies?.filter(c => c.tenant_id === clientAdmin.company_id) || []
          }
        } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
          filteredCompanies = allCompanies?.filter(c => c.tenant_id === null) || []
        }

        // Limpar dados (remover tenant_id)
        const cleanCompanies = filteredCompanies.map(c => ({ id: c.id, name: c.name }))

        if (cleanCompanies.length > 0) {
          console.log("[v0] Companies loaded IMMEDIATELY:", cleanCompanies.length)
          setCompanies(cleanCompanies)
          setGlobalCompaniesCache(cleanCompanies) // Cache global
          setCompaniesLoaded(true)
        } else {
          console.log("[v0] No companies found")
          setCompanies([])
        }
      } catch (error: any) {
        console.error("[v0] Companies fetch failed:", error.message)
        setCompanies([])
      } finally {
        setIsLoadingCompanies(false)
      }
    }

    // Executar IMEDIATAMENTE - máxima prioridade
    fetchCompaniesImmediately()
  }, [])

  // Carregar role do usuário em paralelo (não bloqueia empresas)
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            setUserRole(profile.role)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
      }
    }

    fetchUserRole()
  }, [])

  // Função para recarregar tasks do banco
  const fetchTasks = async () => {
    if (!project?.id) return

    try {
      console.log("[v0] Fetching tasks for project:", project.id)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tasks")
        .select("id, name, description, start_date, end_date, status, responsible, \"order\", delay_justification, original_end_date, actual_end_date, delay_created_at, delay_created_by")
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

  // Carregar tarefas existentes quando estiver editando um projeto
  useEffect(() => {
    fetchTasks()
  }, [project?.id])

  // Função inteligente bidirecional: calcula o campo faltante baseado nos outros dois
  const calculateMissingField = (editedField: 'budget' | 'hourly_rate' | 'estimated_hours') => {
    const hoursValue = formData.estimated_hours ? parseFloat(formData.estimated_hours) : 0
    const rateValue = formData.hourly_rate ? parseFloat(formData.hourly_rate.replace(/\./g, '').replace(',', '.')) : 0
    const budgetValue = formData.budget ? parseFloat(formData.budget.replace(/\./g, '').replace(',', '.')) : 0
    
    console.log('🧮 Campo editado:', editedField, { hoursValue, rateValue, budgetValue })
    
    // Determinar qual campo calcular (o que NÃO foi editado e está vazio/zero)
    const hasHours = hoursValue > 0
    const hasRate = rateValue > 0
    const hasBudget = budgetValue > 0
    
    // Cenário 1: Editou HORAS → Calcular baseado no que existe
    if (editedField === 'estimated_hours') {
      if (hasHours && hasRate) {
        // Tem Horas + Valor Hora → Calcular Orçamento
        const calculatedBudget = hoursValue * rateValue
        const formattedBudget = calculatedBudget.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
        setFormData(prev => ({ ...prev, budget: formattedBudget }))
        setCalculatedField('budget')
        console.log('💰 Calculado Orçamento:', formattedBudget)
      } else if (hasHours && hasBudget) {
        // Tem Horas + Orçamento → Calcular Valor Hora
        const calculatedRate = budgetValue / hoursValue
        const formattedRate = calculatedRate.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
        setFormData(prev => ({ ...prev, hourly_rate: formattedRate }))
        setCalculatedField('hourly_rate')
        console.log('💵 Calculado Valor Hora:', formattedRate)
      }
    }
    
    // Cenário 2: Editou VALOR HORA → Calcular baseado no que existe
    else if (editedField === 'hourly_rate') {
      if (hasRate && hasHours) {
        // Tem Valor Hora + Horas → Calcular Orçamento
        const calculatedBudget = hoursValue * rateValue
        const formattedBudget = calculatedBudget.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
        setFormData(prev => ({ ...prev, budget: formattedBudget }))
        setCalculatedField('budget')
        console.log('💰 Calculado Orçamento:', formattedBudget)
      } else if (hasRate && hasBudget) {
        // Tem Valor Hora + Orçamento → Calcular Horas
        const calculatedHours = Math.round(budgetValue / rateValue)
        setFormData(prev => ({ ...prev, estimated_hours: calculatedHours.toString() }))
        setCalculatedField('estimated_hours')
        console.log('⏰ Calculado Horas:', calculatedHours)
      }
    }
    
    // Cenário 3: Editou ORÇAMENTO → Calcular baseado no que existe
    else if (editedField === 'budget') {
      if (hasBudget && hasHours) {
        // Tem Orçamento + Horas → Calcular Valor Hora
        const calculatedRate = budgetValue / hoursValue
        const formattedRate = calculatedRate.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
        setFormData(prev => ({ ...prev, hourly_rate: formattedRate }))
        setCalculatedField('hourly_rate')
        console.log('💵 Calculado Valor Hora:', formattedRate)
      } else if (hasBudget && hasRate) {
        // Tem Orçamento + Valor Hora → Calcular Horas
        const calculatedHours = Math.round(budgetValue / rateValue)
        setFormData(prev => ({ ...prev, estimated_hours: calculatedHours.toString() }))
        setCalculatedField('estimated_hours')
        console.log('⏰ Calculado Horas:', calculatedHours)
      }
    }
    
    setLastEditedField(editedField)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting project submission...")

      let user = null

      try {
        const supabase = createClient()
        const {
          data: { user: realUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError
        if (realUser) user = realUser
      } catch (authError: any) {
        console.log("[v0] Auth failed:", authError.message)
        throw new Error('Usuário não autenticado')
      }

      // Verificar se é Client Admin para definir tenant_id
      let tenantId = null
      if (user?.id) {
        try {
          const supabase = createClient()
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_client_admin')
            .eq('id', user.id)
            .single()
          
          if (profile?.is_client_admin) {
            const { data: clientAdmin } = await supabase
              .from('client_admins')
              .select('company_id')
              .eq('id', user.id)
              .single()
            
            tenantId = clientAdmin?.company_id
          }
        } catch (error) {
          console.log('Erro ao buscar tenant_id:', error)
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
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate.replace(/\./g, '').replace(',', '.')) : null,
        safra: formData.safra || null,
        created_by: user.id,
        tenant_id: tenantId, // Auto-preencher tenant_id se for Client Admin
      }

      console.log("🚀 DEBUG - Status sendo enviado:", formData.status)
      console.log("🚀 DEBUG - ProjectData completo:", projectData)

      // Validação final das datas das tarefas antes de salvar
      const invalidTasks = tasks.filter(task => {
        if (task.start_date && task.end_date) {
          const startDate = new Date(task.start_date)
          const endDate = new Date(task.end_date)
          return startDate > endDate
        }
        return false
      })

      if (invalidTasks.length > 0) {
        setShowDateValidationModal(true)
        setIsLoading(false)
        return
      }

      console.log("[v0] Project data prepared:", projectData)
      console.log("[v0] Tasks to save:", tasks)

      let savedProjectId: string | null = null
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
              // Preservar campos de justificativa de atraso
              delay_justification: task.delay_justification || null,
              original_end_date: task.original_end_date || null,
              actual_end_date: task.actual_end_date || null,
              delay_created_at: task.delay_created_at || null,
              delay_created_by: task.delay_created_by || null,
            }))

            console.log("[v0] Tasks data prepared:", tasksData)

            // ===== NOTIFICAÇÕES ANTES DE SALVAR =====
            // Se for um projeto novo (não tem ID), notificar todas as tarefas
            const isNewProject = !project?.id
            
            if (isNewProject) {
              console.log(`[v0] Projeto novo - notificando todas as tarefas`)
              await notifyTasksByResponsible(tasks, formData.name, projectId, supabase)
            } else {
              // Projeto existente - verificar apenas tarefas novas ou alteradas
              console.log(`[v0] Projeto existente - verificando tarefas alteradas`)
              console.log(`[v0] Tarefas atuais:`, tasks.map(t => ({ id: t.id, name: t.name, responsible: t.responsible })))
              
              // Buscar tarefas existentes no banco ANTES de salvar
              const { data: existingTasks, error: existingTasksError } = await supabase
                .from('tasks')
                .select('id, name, responsible')
                .eq('project_id', projectId)

              if (existingTasksError) {
                console.error(`[v0] Erro ao buscar tarefas existentes:`, existingTasksError)
              } else {
                console.log(`[v0] Tarefas existentes no banco:`, existingTasks?.map(t => ({ id: t.id, name: t.name, responsible: t.responsible })))
                
                // Coletar tarefas que precisam de notificação
                const tasksToNotify = []
                for (const task of tasks) {
                  if (task.responsible) {
                    const existingTask = existingTasks?.find(et => et.id === task.id)
                    
                    // Notificar se:
                    // 1. É uma tarefa nova (não existe no banco)
                    // 2. É uma tarefa existente mas o responsável mudou
                    const isNewTask = !existingTask
                    const responsibleChanged = existingTask && existingTask.responsible !== task.responsible
                    const shouldNotify = isNewTask || responsibleChanged
                    
                    console.log(`[v0] Análise da tarefa ${task.name}:`, {
                      taskId: task.id,
                      existingTask: existingTask ? { id: existingTask.id, responsible: existingTask.responsible } : null,
                      currentResponsible: task.responsible,
                      isNew: isNewTask,
                      responsibleChanged: responsibleChanged,
                      shouldNotify
                    })
                    
                    if (shouldNotify) {
                      console.log(`[v0] ✅ Tarefa ${task.name} precisa de notificação:`, {
                        isNew: isNewTask,
                        responsibleChanged: responsibleChanged,
                        oldResponsible: existingTask?.responsible,
                        newResponsible: task.responsible
                      })
                      tasksToNotify.push(task)
                    } else {
                      console.log(`[v0] ❌ Tarefa ${task.name} não precisa de notificação (sem alterações)`)
                    }
                  }
                }

                // Notificar tarefas agrupadas por responsável
                if (tasksToNotify.length > 0) {
                  await notifyTasksByResponsible(tasksToNotify, formData.name, projectId, supabase)
                }
              }
            }

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
          console.log("[v0] Database operation failed:", dbError.message)
          throw dbError
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

      if (onSuccess) {
        onSuccess()
      } else {
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
      id: crypto.randomUUID(),
      name: "",
      start_date: "",
      end_date: "",
      status: "not_started",
      responsible: "",
      description: "",
      order: tasks.length, // Ordem baseada no número de tarefas existentes
      project_id: project?.id || "", // ← ADICIONAR project_id!
    }
    setTasks([...tasks, newTask])
  }

  // Usar a função formatDateBrazil do utilitário (importada no topo do arquivo)
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Não definida'
    return formatDateBrazil(dateString) || 'Não definida'
  }

  // Função auxiliar para notificar tarefas agrupadas por responsável
  const notifyTasksByResponsible = async (tasks: any[], projectName: string, projectId: string, supabaseClient: any) => {
    try {
      console.log(`[v0] 🔔 NOTIFICAÇÃO AGRUPADA INICIADA para ${tasks.length} tarefas`)
      
      // Agrupar tarefas por responsável
      const tasksByResponsible = new Map<string, any[]>()
      
      for (const task of tasks) {
        if (task.responsible) {
          if (!tasksByResponsible.has(task.responsible)) {
            tasksByResponsible.set(task.responsible, [])
          }
          tasksByResponsible.get(task.responsible)!.push(task)
        }
      }

      console.log(`[v0] Tarefas agrupadas por responsável:`, Array.from(tasksByResponsible.entries()).map(([responsible, tasks]) => ({
        responsible,
        taskCount: tasks.length,
        tasks: tasks.map(t => ({ name: t.name, start_date: t.start_date, end_date: t.end_date }))
      })))

      // Notificar cada responsável com suas tarefas
      for (const [responsibleName, responsibleTasks] of tasksByResponsible) {
        await notifyResponsibleWithTasks(responsibleName, responsibleTasks, projectName, projectId, supabaseClient)
      }
    } catch (error) {
      console.error(`[v0] Erro na notificação agrupada:`, error)
    }
  }

  // Função auxiliar para notificar um responsável com múltiplas tarefas
  const notifyResponsibleWithTasks = async (responsibleName: string, tasks: any[], projectName: string, projectId: string, supabaseClient: any) => {
    try {
      console.log(`[v0] 🔔 NOTIFICANDO RESPONSÁVEL: ${responsibleName} com ${tasks.length} tarefas`)
      
      // Buscar ID do responsável pelo nome
      const { data: responsavel, error: responsavelError } = await supabaseClient
        .from('responsaveis')
        .select('id, nome, email')
        .eq('nome', responsibleName)
        .single()

      if (responsavelError) {
        console.error(`[v0] Erro ao buscar responsável ${responsibleName}:`, responsavelError)
        return
      }

      if (responsavel) {
        console.log(`[v0] Responsável encontrado:`, responsavel)
        
        // Criar mensagem com todas as tarefas
        const taskDetails = tasks.map(task => ({
          name: task.name,
          start_date: task.start_date,
          end_date: task.end_date
        }))

        const taskList = tasks.map(task => {
          const startDate = task.start_date ? formatDate(task.start_date) : 'Não definida'
          const endDate = task.end_date ? formatDate(task.end_date) : 'Não definida'
          return `• ${task.name} (Início: ${startDate}, Fim: ${endDate})`
        }).join('\n')

        const message = `Você foi designado para ${tasks.length} tarefa(s) no projeto "${projectName}":\n\n${taskList}`

        // Notificar responsável sobre as tarefas atribuídas
        const response = await fetch('/api/notifications/responsaveis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responsavelId: responsavel.id,
            type: 'project_assigned',
            title: `Nova(s) Tarefa(s) Atribuída(s)`,
            message: message,
            projectId: projectId,
            taskId: undefined, // Não passar taskId para tarefas novas
            taskDetails: taskDetails // Enviar detalhes das tarefas
          })
        })

        if (response.ok) {
          console.log(`[v0] ✅ Notificação enviada com sucesso para ${responsibleName}`)
        } else {
          const errorData = await response.json()
          console.error(`[v0] ❌ Erro ao enviar notificação para ${responsibleName}:`, errorData)
        }
      }
    } catch (error) {
      console.error(`[v0] Erro ao notificar responsável ${responsibleName}:`, error)
    }
  }

  // Função auxiliar para notificar responsável de uma tarefa (mantida para compatibilidade)
  const notifyTaskResponsible = async (task: any, projectName: string, projectId: string, supabaseClient: any) => {
    try {
      console.log(`[v0] 🔔 NOTIFICAÇÃO INICIADA para tarefa: ${task.name} (${task.id}) - Responsável: ${task.responsible}`)
      
      // Buscar ID do responsável pelo nome
      const { data: responsavel, error: responsavelError } = await supabaseClient
        .from('responsaveis')
        .select('id, nome, email')
        .eq('nome', task.responsible)
        .single()

      if (responsavelError) {
        console.error(`[v0] Erro ao buscar responsável ${task.responsible}:`, responsavelError)
        return
      }

      if (responsavel) {
        console.log(`[v0] Responsável encontrado:`, responsavel)
        
            // Notificar responsável sobre nova tarefa atribuída
            const response = await fetch('/api/notifications/responsaveis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                responsavelId: responsavel.id,
                type: 'project_assigned',
                title: `Nova Tarefa Atribuída`,
                message: `Você foi designado para a tarefa "${task.name}" no projeto "${projectName}".`,
                projectId: projectId,
                taskId: undefined // Não passar taskId para tarefas novas (ainda não salvas no banco)
              })
            })
        
        const result = await response.json()
        console.log(`[v0] Resultado da notificação para ${task.responsible}:`, result)
      } else {
        console.log(`[v0] Responsável não encontrado: ${task.responsible}`)
      }
    } catch (notificationError) {
      console.error(`[v0] Erro ao notificar responsável ${task.responsible}:`, notificationError)
    }
  }

  const updateTask = async (taskId: string, field: keyof Task, value: string) => {
    // SEMPRE atualiza a tarefa primeiro para permitir digitação
    const updatedTasks = tasks.map((task: Task) => 
      task.id === taskId ? { ...task, [field]: value } : task
    )
    setTasks(updatedTasks)
    
    // Validação básica de datas APÓS atualizar (não bloqueia digitação)
    if (field === 'start_date' || field === 'end_date') {
      const updatedTask = updatedTasks.find(t => t.id === taskId)
      if (updatedTask) {
        const newStartDate = updatedTask.start_date
        const newEndDate = updatedTask.end_date
        
        // Verificar se ambas as datas estão preenchidas E são válidas
        if (newStartDate && newEndDate && newStartDate !== '' && newEndDate !== '') {
          try {
            // Converter para Date para comparação
            const startDate = new Date(newStartDate)
            const endDate = new Date(newEndDate)
            
            // Validar: data início deve ser menor ou igual à data fim
            if (startDate > endDate) {
              setError('❌ Data de início não pode ser maior que a data de fim da tarefa')
              setInvalidTasks(prev => new Set(prev).add(taskId))
            } else {
              // Limpar erro se a validação passou
              if (error?.includes('Data de início não pode ser maior')) {
                setError(null)
              }
              // Remover da lista de tarefas inválidas
              setInvalidTasks(prev => {
                const newSet = new Set(prev)
                newSet.delete(taskId)
                return newSet
              })
            }
          } catch (dateError) {
            // Ignorar erros de data durante digitação
            console.log('Data ainda sendo digitada:', dateError)
          }
        }
      }
    }
    
    // Notificação será enviada apenas no salvamento do projeto
    // para evitar duplicação
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
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
      <CardContent className="p-8">
        {/* Removido aviso offline - sempre usando dados reais */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do Projeto - Card Principal */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-blue-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <Label htmlFor="name" className="text-base font-semibold text-slate-700">Nome do Projeto *</Label>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Digite o nome do projeto"
                  required
                  className="w-full h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações Básicas - Card com Grid */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-indigo-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-slate-700">Informações Básicas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_id" className="text-sm font-medium text-slate-600">Empresa *</Label>
                  <Select value={formData.company_id} onValueChange={(value) => handleChange("company_id", value)} disabled={isLoadingCompanies}>
                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
                      <SelectValue placeholder={isLoadingCompanies ? "Carregando empresas..." : "Selecione a empresa"} />
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
                  <Label htmlFor="project_type" className="text-sm font-medium text-slate-600">Tipo de Projeto</Label>
                  <Select value={formData.project_type} onValueChange={(value) => handleChange("project_type", value)}>
                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
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
                  <Label htmlFor="category" className="text-sm font-medium text-slate-600">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Projeto</SelectItem>
                      <SelectItem value="improvement">Melhoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-slate-600">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="commercial_proposal">Proposta Comercial</SelectItem>
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
                  <Label htmlFor="priority" className="text-sm font-medium text-slate-600">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
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
            </CardContent>
          </Card>

          {/* Descrição - Card */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-purple-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <Label htmlFor="description" className="text-base font-semibold text-slate-700">Descrição do Projeto</Label>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Descreva os objetivos e detalhes do projeto..."
                  rows={3}
                  className="border-slate-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 resize-none"
                />
              </div>
            </CardContent>
          </Card>



          {/* Informações Financeiras e Temporais - Card */}
          {userRole && (
            <Card className="bg-gradient-to-br from-slate-50/80 to-emerald-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-700">Informações Financeiras e Temporais</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-4">
                  {/* Primeira linha: Orçamento (inteligente) - apenas para admin */}
                  {userRole !== 'admin_operacional' && (
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="flex items-center justify-between">
                        <span>Orçamento (R$)</span>
                        {calculatedField === 'budget' && (
                          <span className="text-xs font-normal text-blue-600 flex items-center gap-1">
                            🤖 Calculado automaticamente
                          </span>
                        )}
                        {calculatedField !== 'budget' && formData.budget && (
                          <span className="text-xs font-normal text-slate-600 flex items-center gap-1">
                            ✏️ Manual
                          </span>
                        )}
                      </Label>
                      <Input
                        id="budget"
                        type="text"
                        inputMode="decimal"
                        value={formData.budget}
                        onChange={(e) => {
                          const value = e.target.value
                          const cleanValue = value.replace(/[^\d.,]/g, '')
                          
                          const hasComma = cleanValue.includes(',')
                          const hasDot = cleanValue.includes('.')
                          let finalValue = cleanValue
                          
                          if (hasComma && hasDot) {
                            const lastComma = cleanValue.lastIndexOf(',')
                            const lastDot = cleanValue.lastIndexOf('.')
                            if (lastComma > lastDot) {
                              finalValue = cleanValue.replace(/\./g, '')
                            } else {
                              finalValue = cleanValue.replace(/,/g, '')
                            }
                          } else if (hasComma) {
                            finalValue = cleanValue
                          }
                          
                          handleChange("budget", finalValue)
                          setCalculatedField(null) // Marca como editado manualmente
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          if (value) {
                            const numericString = value.replace(/[.,]/g, '')
                            
                            if (!isNaN(Number(numericString)) && numericString.length > 0) {
                              const numValue = Number(numericString) / 100
                              const formattedValue = numValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })
                              
                              handleChange("budget", formattedValue)
                            }
                          }
                          // Calcular campo faltante após formatar
                          calculateMissingField('budget')
                        }}
                        placeholder="0,00"
                        className={`w-full h-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200 ${
                          calculatedField === 'budget' ? 'bg-blue-50 border-blue-300' : 'bg-white'
                        }`}
                      />
                      {calculatedField === 'budget' && (
                        <p className="text-xs text-blue-600 font-medium">
                          💡 Calculado: {formData.estimated_hours}h × R$ {formData.hourly_rate}/h
                        </p>
                      )}
                    </div>
                  )}

                  {/* Segunda linha: Horas Estimadas e Valor Hora Praticado lado a lado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimated_hours" className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Horas Estimadas
                        </span>
                        {calculatedField === 'estimated_hours' && (
                          <span className="text-xs font-normal text-blue-600 flex items-center gap-1">
                            🤖 Calculado
                          </span>
                        )}
                        {calculatedField !== 'estimated_hours' && formData.estimated_hours && (
                          <span className="text-xs font-normal text-slate-600 flex items-center gap-1">
                            ✏️ Manual
                          </span>
                        )}
                      </Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        min="1"
                        value={formData.estimated_hours}
                        onChange={(e) => {
                          handleChange("estimated_hours", e.target.value)
                          setCalculatedField(null) // Marca como editado manualmente
                        }}
                        onBlur={() => {
                          calculateMissingField('estimated_hours')
                        }}
                        placeholder="Ex: 100"
                        className={`w-full h-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200 ${
                          calculatedField === 'estimated_hours' ? 'bg-blue-50 border-blue-300' : 'bg-white'
                        }`}
                      />
                      {calculatedField === 'estimated_hours' && (
                        <p className="text-xs text-blue-600 font-medium">
                          💡 Calculado: R$ {formData.budget} ÷ R$ {formData.hourly_rate}/h
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate" className="flex items-center justify-between">
                        <span>Valor Hora Praticado (R$)</span>
                        {calculatedField === 'hourly_rate' && (
                          <span className="text-xs font-normal text-blue-600 flex items-center gap-1">
                            🤖 Calculado
                          </span>
                        )}
                        {calculatedField !== 'hourly_rate' && formData.hourly_rate && (
                          <span className="text-xs font-normal text-slate-600 flex items-center gap-1">
                            ✏️ Manual
                          </span>
                        )}
                      </Label>
                      <Input
                        id="hourly_rate"
                        type="text"
                        inputMode="decimal"
                        value={formData.hourly_rate}
                        onChange={(e) => {
                          const value = e.target.value
                          const cleanValue = value.replace(/[^\d.,]/g, '')
                          
                          const hasComma = cleanValue.includes(',')
                          const hasDot = cleanValue.includes('.')
                          let finalValue = cleanValue
                          
                          if (hasComma && hasDot) {
                            const lastComma = cleanValue.lastIndexOf(',')
                            const lastDot = cleanValue.lastIndexOf('.')
                            if (lastComma > lastDot) {
                              finalValue = cleanValue.replace(/\./g, '')
                            } else {
                              finalValue = cleanValue.replace(/,/g, '')
                            }
                          } else if (hasComma) {
                            finalValue = cleanValue
                          }
                          
                          handleChange("hourly_rate", finalValue)
                          setCalculatedField(null) // Marca como editado manualmente
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          if (value) {
                            const numericString = value.replace(/[.,]/g, '')
                            
                            if (!isNaN(Number(numericString)) && numericString.length > 0) {
                              const numValue = Number(numericString) / 100
                              const formattedValue = numValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })
                              
                              handleChange("hourly_rate", formattedValue)
                            }
                          }
                          // Calcular campo faltante após formatar
                          calculateMissingField('hourly_rate')
                        }}
                        placeholder="0,00"
                        className={`w-full h-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200 ${
                          calculatedField === 'hourly_rate' ? 'bg-blue-50 border-blue-300' : 'bg-white'
                        }`}
                      />
                      {calculatedField === 'hourly_rate' ? (
                        <p className="text-xs text-blue-600 font-medium">
                          💡 Calculado: R$ {formData.budget} ÷ {formData.estimated_hours}h
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Digite o valor (ex: 15000 para R$ 150,00)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Terceira linha: Campo Safra (apenas para Copersucar) */}
                  {formData.company_id === COPERSUCAR_ID && (
                    <div className="space-y-2">
                      <Label htmlFor="safra" className="text-sm font-medium text-slate-600">Safra</Label>
                      <Select value={formData.safra} onValueChange={(value) => handleChange("safra", value)}>
                        <SelectTrigger className="w-full h-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20">
                          <SelectValue placeholder="Selecione a safra" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025/26">2025/26</SelectItem>
                          <SelectItem value="2026/27">2026/27</SelectItem>
                          <SelectItem value="2027/28">2027/28</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quarta linha: Datas Previstas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Data de Início Prevista</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleChange("start_date", e.target.value)}
                        className="w-full h-10 bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">Data de Término Prevista</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleChange("end_date", e.target.value)}
                        className="w-full h-10 bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Responsáveis - Card */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-orange-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-md">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-slate-700">Responsáveis pelo Projeto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technical_responsible" className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Responsável Técnico
                  </Label>
                  <Input
                    id="technical_responsible"
                    value={formData.technical_responsible}
                    onChange={(e) => handleChange("technical_responsible", e.target.value)}
                    placeholder="Nome do responsável técnico"
                    className="w-full h-10 bg-white border-slate-300 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key_user" className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Key User
                  </Label>
                  <Input
                    id="key_user"
                    value={formData.key_user}
                    onChange={(e) => handleChange("key_user", e.target.value)}
                    placeholder="Nome do key user"
                    className="w-full h-10 bg-white border-slate-300 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Tarefas - Card Modernizado */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-cyan-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-cyan-50/50 to-blue-50/30 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-700">Configurar Tarefas (Gantt)</CardTitle>
                    <CardDescription className="text-slate-600">
                      Configure as tarefas do projeto com datas e responsáveis
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTask}
                    className="flex items-center gap-2 bg-white/80 hover:bg-white border-slate-300 hover:border-cyan-500 hover:text-cyan-600 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Tarefa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <DraggableTaskList
                  tasks={tasks}
                  onUpdateTask={updateTask}
                  onRemoveTask={removeTask}
                  onReorderTasks={reorderTasks}
                  onRefreshTasks={fetchTasks}
                  invalidTasks={invalidTasks}
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Modal de Validação de Datas */}
          {showDateValidationModal && (
            <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[9999] p-4 pb-20">
              <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl max-h-[70vh] overflow-y-auto transform translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Datas Inválidas Detectadas
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Existem {invalidTasks.size} tarefa(s) com datas inválidas. 
                  Verifique os campos destacados em vermelho nas tarefas abaixo.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    Problema encontrado:
                  </p>
                  <p className="text-sm text-red-600">
                    Data de início é maior que a data de fim em algumas tarefas.
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowDateValidationModal(false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Entendi, vou corrigir
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação - Card */}
          <Card className="bg-gradient-to-r from-slate-50/80 to-blue-50/50 border border-slate-200/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (onSuccess) {
                      onSuccess()
                    } else if (project) {
                      // Se está editando, vai para a listagem de projetos
                      router.push('/admin/projects')
                    } else {
                      // Se está criando, volta para a página anterior
                      router.back()
                    }
                  }}
                  disabled={isLoading}
                  className="px-6 py-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  {isLoading ? "Salvando..." : project ? "Atualizar Projeto" : "Criar Projeto"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </CardContent>
    </Card>
  )
}
