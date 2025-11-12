"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar, BarChart3 } from "lucide-react"

interface Task {
  id: string
  name: string
  status: string
  end_date?: string | null
  actual_end_date?: string | null
}

interface TaskMetricsCardProps {
  tasks: Task[]
}

export function TaskMetricsCard({ tasks }: TaskMetricsCardProps) {
  // Calcular métricas de desempenho das tarefas (memoizado para performance)
  const taskMetrics = useMemo(() => {
    // Tarefas concluídas (completed ou completed_delayed)
    const completedTasks = tasks.filter(t => 
      (t.status === 'completed' || t.status === 'completed_delayed') && 
      t.end_date && 
      t.actual_end_date
    )
    
    // Tarefas em andamento OU atrasadas (delayed)
    const inProgressTasks = tasks.filter(t => 
      (t.status === 'in_progress' || t.status === 'delayed') && 
      t.end_date
    )
    
    if (completedTasks.length === 0 && inProgressTasks.length === 0) {
      return null
    }

    let onTime = 0
    let completedDelayed = 0
    let inProgressDelayed = 0
    let early = 0
    let hasLongDelays = false
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    // Processar tarefas concluídas
    completedTasks.forEach(task => {
      const planned = new Date(task.end_date + 'T12:00:00')
      const actual = new Date(task.actual_end_date! + 'T12:00:00')
      const diffTime = actual.getTime() - planned.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (task.status === 'completed_delayed') {
        completedDelayed++
        if (diffDays > 30) hasLongDelays = true
      } else if (diffDays === 0) {
        onTime++
      } else if (diffDays > 0) {
        completedDelayed++ // Mesmo se status é 'completed', se atrasou conta aqui
        if (diffDays > 30) hasLongDelays = true
      } else {
        early++
      }
    })

    // Processar tarefas em andamento ou com status "delayed"
    inProgressTasks.forEach(task => {
      const planned = new Date(task.end_date + 'T12:00:00')
      
      // Se status é "delayed" OU se passou do prazo
      if (task.status === 'delayed' || today > planned) {
        inProgressDelayed++
        const diffTime = today.getTime() - planned.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays > 30) hasLongDelays = true
      }
    })

    const totalAnalyzed = completedTasks.length + inProgressDelayed
    
    return {
      total: completedTasks.length,
      onTime,
      completedDelayed,
      inProgressDelayed,
      early,
      hasLongDelays,
      onTimePercentage: totalAnalyzed > 0 ? Math.round((onTime / totalAnalyzed) * 100) : 0,
      completedDelayedPercentage: totalAnalyzed > 0 ? Math.round((completedDelayed / totalAnalyzed) * 100) : 0,
      inProgressDelayedPercentage: totalAnalyzed > 0 ? Math.round((inProgressDelayed / totalAnalyzed) * 100) : 0,
      earlyPercentage: totalAnalyzed > 0 ? Math.round((early / totalAnalyzed) * 100) : 0
    }
  }, [tasks])

  // Se não há métricas, não mostrar o card
  if (!taskMetrics) return null

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-slate-700">Resumo de Desempenho</CardTitle>
          <Badge variant="outline" className="ml-auto text-xs bg-white/50">
            {taskMetrics.total} {taskMetrics.total === 1 ? 'tarefa analisada' : 'tarefas analisadas'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* No Prazo */}
          <div className="bg-white/70 rounded-lg p-3 border border-green-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                {taskMetrics.onTimePercentage}%
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">{taskMetrics.onTime}</div>
            <div className="text-xs text-gray-600">No Prazo</div>
          </div>
          
          {/* Concluído com Atraso */}
          <div className="bg-white/70 rounded-lg p-3 border border-orange-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                {taskMetrics.completedDelayedPercentage}%
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{taskMetrics.completedDelayed}</div>
            <div className="text-xs text-gray-600">Concl. Atrasado</div>
          </div>
          
          {/* Em Atraso */}
          <div className="bg-white/70 rounded-lg p-3 border border-red-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                {taskMetrics.inProgressDelayedPercentage}%
              </span>
            </div>
            <div className="text-2xl font-bold text-red-600">{taskMetrics.inProgressDelayed}</div>
            <div className="text-xs text-gray-600">Em Atraso</div>
          </div>
          
          {/* Adiantadas */}
          <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {taskMetrics.earlyPercentage}%
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{taskMetrics.early}</div>
            <div className="text-xs text-gray-600">Adiantadas</div>
          </div>
        </div>
        
        {/* Alerta Contextual para Projetos Complexos */}
        {taskMetrics.hasLongDelays && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-900 mb-1">
                  ⚠️ Projeto Complexo Detectado
                </p>
                <p className="text-xs text-amber-800 mb-2">
                  Este projeto possui tarefas com longos períodos de espera ou múltiplos bloqueios externos.
                </p>
                <p className="text-[10px] text-amber-700">
                  💡 <strong>Recomendação:</strong> Documente os impedimentos em cada tarefa usando 
                  <strong> "Justificativa de Atraso"</strong> para manter histórico claro dos bloqueios, 
                  esperas de aprovações e problemas de infraestrutura.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

