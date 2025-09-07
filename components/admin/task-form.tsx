"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface TaskFormProps {
  projectId: string
  task?: {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    estimated_hours?: number
    actual_hours?: number
    assigned_to?: string
  }
  onSuccess?: () => void
}

export function TaskForm({ projectId, task, onSuccess }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
    estimated_hours: task?.estimated_hours?.toString() || "",
    actual_hours: task?.actual_hours?.toString() || "",
    assigned_to: task?.assigned_to || "unassigned",
  })
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name")
      if (data) setUsers(data)
    }

    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuário não autenticado")

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours ? Number.parseFloat(formData.estimated_hours) : null,
        actual_hours: formData.actual_hours ? Number.parseFloat(formData.actual_hours) : null,
        assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
        project_id: projectId,
        created_by: user.id,
      }

      let result
      if (task?.id) {
        // Update existing task
        result = await supabase.from("tasks").update(taskData).eq("id", task.id).select().single()
      } else {
        // Create new task
        result = await supabase.from("tasks").insert([taskData]).select().single()
      }

      if (result.error) throw result.error

      if (taskData.assigned_to && !task?.id) {
        try {
          await fetch("/api/notifications/task-assigned", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              taskId: result.data.id,
              assignedToId: taskData.assigned_to,
              assignedById: user.id,
            }),
          })
        } catch (notificationError) {
          console.error("Failed to send notification:", notificationError)
          // Don't fail the task creation if notification fails
        }
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</CardTitle>
        <CardDescription>
          {task ? "Atualize as informações da tarefa" : "Preencha os dados para criar uma nova tarefa"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Tarefa *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Título da tarefa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descrição da tarefa"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Responsável</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => handleChange("assigned_to", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Não atribuído</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Horas Estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => handleChange("estimated_hours", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_hours">Horas Reais</Label>
              <Input
                id="actual_hours"
                type="number"
                step="0.5"
                value={formData.actual_hours}
                onChange={(e) => handleChange("actual_hours", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : task ? "Atualizar" : "Criar Tarefa"}
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
