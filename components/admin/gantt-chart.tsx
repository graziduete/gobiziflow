"use client"
import React from "react"
import { createPortal } from "react-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, TrendingUp, Users, Maximize2, Minimize2 } from "lucide-react"

interface Task {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  responsible: string
  description?: string
}

interface GanttChartProps {
  tasks: Task[]; 
  projectStartDate?: string; 
  projectEndDate?: string;
  defaultExpanded?: boolean;
  projectName?: string;
}

export function GanttChart({ tasks, projectStartDate, projectEndDate, defaultExpanded = false, projectName }: GanttChartProps) {
  // Estado para controlar a expansão da tela
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  // Bloquear scroll da página quando expandido
  React.useEffect(() => {
    if (isExpanded) {
      // Bloquear scroll da página
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurar scroll da página
      document.body.style.overflow = 'unset'
    }

    // Cleanup: restaurar scroll quando componente for desmontado
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isExpanded])

  // Função para calcular semanas corretamente por mês/ano
  const weeks = React.useMemo(() => {
    try {
      let start: Date, end: Date
      
      if (tasks.length > 0) {
        // Usar datas das tarefas para determinar o período real do projeto
        const validTasks = tasks.filter(task => task.start_date && task.end_date)
        if (validTasks.length === 0) {
          // Se não há tarefas válidas, usar período padrão
          const today = new Date()
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
          start = new Date(today.getFullYear(), today.getMonth(), 1)
          end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0)
        } else {
          // Calcular período real baseado nas tarefas
          const taskDates = validTasks.flatMap(task => [
            new Date(task.start_date), 
            new Date(task.end_date)
          ]).filter(date => !isNaN(date.getTime()))
          
          if (taskDates.length === 0) {
            const today = new Date()
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
            start = new Date(today.getFullYear(), today.getMonth(), 1)
            end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0)
          } else {
            // Encontrar a data mais antiga e mais recente das tarefas
            start = new Date(Math.min(...taskDates.map(d => d.getTime())))
            end = new Date(Math.max(...taskDates.map(d => d.getTime())))
            
            // Ajustar para começar no primeiro dia da semana que contém a data mais antiga
            const firstDayOfWeek = start.getDay()
            start.setDate(start.getDate() - firstDayOfWeek)
            
            // Ajustar para terminar no último dia da semana que contém a data mais recente
            const lastDayOfWeek = end.getDay()
            end.setDate(end.getDate() + (6 - lastDayOfWeek))
          }
        }
      } else {
        // Se não há tarefas, usar período padrão
        const today = new Date()
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0)
      }
      
      // Validações de segurança
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn("Datas inválidas detectadas, usando datas padrão")
        const today = new Date()
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0)
      }
      
      if (start > end) {
        console.warn("Data inicial maior que data final, invertendo")
        const temp = start
        start = new Date(end)
        end = new Date(temp)
      }
      
      // Limitar período máximo
      const maxDays = 365 // Máximo 1 ano
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      if (daysDiff > maxDays) {
        console.warn("Período muito longo detectado, limitando a 1 ano")
        end.setTime(start.getTime() + (maxDays * 24 * 60 * 60 * 1000))
      }
      
      const weeksArray = []
      let current = new Date(start)
      
      let weekCount = 0
      const maxWeeks = 52
      
      while (current <= end && weekCount < maxWeeks) {
        const weekStart = new Date(current)
        const weekEnd = new Date(current)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        weeksArray.push({
          start: weekStart,
          end: weekEnd,
          weekNumber: weekCount + 1,
          month: weekStart.getMonth(),
          year: weekStart.getFullYear()
        })
        
        weekCount++
        current.setDate(current.getDate() + 7)
        
        if (weekCount > maxWeeks) break
      }
      
      if (weekCount >= maxWeeks) {
        console.warn("Número máximo de semanas atingido, limitando resultado")
      }
      
      return weeksArray
    } catch (error) {
      console.error("Erro ao gerar semanas:", error)
      const today = new Date()
      return [
        {
          start: today,
          end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
          weekNumber: 1,
          month: today.getMonth(),
          year: today.getFullYear()
        }
      ]
    }
  }, [tasks])

  // Agrupar semanas por mês
  const monthsWithWeeks = React.useMemo(() => {
    try {
      const months: Record<string, { name: string; startIndex: number; weekCount: number }> = {}
      
      weeks.forEach((week, index) => {
        const monthKey = `${week.year}-${week.month}`
        const monthName = week.start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        
        if (!months[monthKey]) {
          months[monthKey] = {
            name: monthName,
            startIndex: index,
            weekCount: 1
          }
        } else {
          months[monthKey].weekCount++
        }
      })
      
      return months
    } catch (error) {
      console.error("Erro ao agrupar semanas por mês:", error)
      return {}
    }
  }, [weeks])

  // SOLUÇÃO DEFINITIVA: Calcular posição das barras em pixels com posicionamento correto
  const getTaskBarStyle = React.useCallback((task: Task) => {
    if (!task.start_date || !task.end_date || weeks.length === 0) return {}
    
    try {
      const taskStart = new Date(task.start_date)
      const taskEnd = new Date(task.end_date)
      
      if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) return {}
      
      // Encontrar a primeira e última semana do projeto
      const projectStart = weeks[0]?.start
      const projectEnd = weeks[weeks.length - 1]?.end
      
      if (!projectStart || !projectEnd) return {}
      
      // Calcular posição em pixels baseada em dias exatos
      const totalProjectDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
      if (totalProjectDays <= 0) return {}
      
      // Calcular posição da tarefa em relação ao projeto
      const taskStartOffset = Math.max(0, (taskStart.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
      const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
      
      // Calcular largura de cada semana (mais flexível)
      const weekWidth = 120 // Largura mais generosa para cada semana
      const totalWeeksWidth = weeks.length * weekWidth
      
      // Calcular posição e largura em pixels com posicionamento correto
      const leftPixels = 280 + (taskStartOffset / totalProjectDays) * totalWeeksWidth
      const widthPixels = (taskDuration / totalProjectDays) * totalWeeksWidth
      
      return { 
        left: `${leftPixels}px`, 
        width: `${widthPixels}px`,
        position: 'absolute' as const
      }
    } catch (error) {
      console.error("Erro ao calcular estilo da barra:", error)
      return {}
    }
  }, [weeks])

  // CORREÇÃO: Função para obter cor baseada no status real da tarefa
  const getTaskColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'não iniciado':
      case 'not_started':
        return 'from-amber-400 to-amber-500'
      case 'em andamento':
      case 'in_progress':
        return 'from-blue-500 to-blue-600'
      case 'concluído':
      case 'completed':
        return 'from-emerald-500 to-emerald-600'
      case 'atrasado':
      case 'delayed':
        return 'from-red-500 to-red-600'
      case 'pausado':
      case 'on_hold':
        return 'from-slate-500 to-slate-600'
      default:
        return 'from-blue-500 to-blue-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'não iniciado':
      case 'not_started':
        return 'Não Iniciado'
      case 'em andamento':
      case 'in_progress':
        return 'Em Andamento'
      case 'concluído':
      case 'completed':
        return 'Concluído'
      case 'atrasado':
      case 'delayed':
        return 'Atrasado'
      case 'pausado':
      case 'on_hold':
        return 'Pausado'
      default:
        return status
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'não iniciado':
      case 'not_started':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'em andamento':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'concluído':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'atrasado':
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pausado':
      case 'on_hold':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  // Filtrar tarefas válidas
  const validTasks = React.useMemo(() => {
    try {
      return tasks.filter(task => {
        if (!task.start_date || !task.end_date) return false
        const start = new Date(task.start_date)
        const end = new Date(task.end_date)
        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end
      }).slice(0, 50)
    } catch (error) {
      console.error("Erro ao filtrar tarefas:", error)
      return []
    }
  }, [tasks])

  if (weeks.length === 0 || weeks.length > 52) {
    return (
      <Card className="mt-6 border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-700">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Visualização Gantt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-600">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
              <Calendar className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Período muito longo</h3>
            <p className="text-slate-500">O período selecionado é muito longo. Limite a 1 ano para melhor visualização.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (validTasks.length === 0) {
    return (
      <Card className="mt-6 border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-700">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Visualização Gantt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-600">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
              <Calendar className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa válida configurada</h3>
            <p className="text-slate-500">Adicione tarefas com datas válidas para visualizar o cronograma.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar Gantt expandido em um portal para ficar acima de tudo
  if (isExpanded) {
    return createPortal(
      <div className="fixed inset-0 bg-white z-[999999]">
        <Card className="h-full border-0 shadow-none bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Visualização Gantt</div>
                  <div className="text-sm font-normal text-slate-600 mt-1">
                    Cronograma do projeto • {validTasks.length} tarefa{validTasks.length !== 1 ? 's' : ''} • {weeks.length} semanas
                  </div>
                </div>
              </CardTitle>
              
              {/* Botão para expandir/colapsar */}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 hover:text-gray-700 transition-all duration-200"
                title="Colapsar visualização"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Cabeçalho dos meses (altura/tipografia reduzidas) */}
                <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, 120px)` }}>
                  <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-200 border-r border-slate-300"></div>
                  {Object.values(monthsWithWeeks).map((month, monthIndex) => (
                    <div
                      key={monthIndex}
                      className="h-12 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold text-white text-xs shadow-lg"
                      style={{
                        gridColumn: `${month.startIndex + 2} / span ${month.weekCount}`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {month.name.toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Cabeçalho das semanas */}
                <div className="grid" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, 120px)` }}>
                  <div className="h-18 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-slate-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-semibold text-slate-700 text-xs">TAREFAS</div>
                      <div className="text-[10px] text-slate-500 mt-1">{projectName || 'Projeto'}</div>
                    </div>
                  </div>
                  {weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="h-18 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col items-center justify-center p-1.5"
                    >
                      <div className="font-semibold text-slate-700 text-[11px]">Semana {week.weekNumber}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {week.start.getDate().toString().padStart(2, '0')}/{week.start.getMonth() + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tarefas com barras contínuas */}
                {validTasks.map((task, taskIndex) => (
                  <div
                    key={task.id}
                    className="grid hover:bg-slate-50 transition-colors duration-200 relative"
                    style={{ gridTemplateColumns: `280px repeat(${weeks.length}, 120px)` }}
                  >
                    {/* Informações da tarefa */}
                    <div className="h-20 border-r border-slate-200 bg-white p-3 flex flex-col justify-center">
                      <div className="font-semibold text-slate-800 text-sm leading-tight mb-2">
                        {task.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-600">{task.responsible}</span>
                        <Badge className={`text-xs px-1.5 py-0.5 border ${getStatusBadgeColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </Badge>
                      </div>
                    </div>

                    {/* Células do calendário */}
                    {weeks.map((week, weekIndex) => (
                      <div
                        key={weekIndex}
                        className="h-20 border-r border-slate-200 relative bg-white"
                      />
                    ))}

                    {/* SOLUÇÃO DEFINITIVA: Barra contínua posicionada absolutamente */}
                    {task.start_date && task.end_date && (
                      <div
                        className={`absolute top-7 bottom-7 bg-gradient-to-r ${getTaskColor(task.status)} shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group rounded-md`}
                        style={getTaskBarStyle(task)}
                        title={`${task.name}: ${task.start_date} a ${task.end_date}`}
                      >
                        <div className="px-2 py-1 text-white font-medium text-xs leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="font-bold">{task.name}</div>
                          <div className="text-xs opacity-90">{task.responsible}</div>
                        </div>
                      </div>
                    )}

                    {/* Linha separadora entre tarefas (exceto na última) */}
                    {taskIndex < validTasks.length - 1 && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
                        style={{ gridColumn: `1 / span ${weeks.length + 1}` }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Legenda */}
            <div className="mt-3 mx-3 mb-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-2.5 flex items-center gap-2 text-xs">
                <div className="p-0.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                Legenda de Status
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                {[
                  { status: 'Não Iniciado', color: 'from-amber-400 to-amber-500' },
                  { status: 'Em Andamento', color: 'from-blue-500 to-blue-600' },
                  { status: 'Concluído', color: 'from-emerald-500 to-emerald-600' },
                  { status: 'Atrasado', color: 'from-red-500 to-red-600' },
                  { status: 'Pausado', color: 'from-slate-500 to-slate-600' }
                ].map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 bg-gradient-to-r ${item.color} rounded-full`}></div>
                  <span className="text-[12px] font-medium text-slate-700">{item.status}</span>
                </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>,
      document.body
    )
  }

  // Renderizar Gantt normal quando não expandido
  return (
    <Card className="mt-6 border-0 shadow-xl bg-white overflow-hidden transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold">Visualização Gantt</div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                Cronograma do projeto • {validTasks.length} tarefa{validTasks.length !== 1 ? 's' : ''} • {weeks.length} semanas
              </div>
            </div>
          </CardTitle>
          
          {/* Botão para expandir/colapsar */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 hover:text-gray-700 transition-all duration-200"
            title="Expandir visualização"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Cabeçalho dos meses (altura/tipografia reduzidas) */}
            <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, 120px)` }}>
              <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-200 border-r border-slate-300"></div>
              {Object.values(monthsWithWeeks).map((month, monthIndex) => (
                <div
                  key={monthIndex}
                  className="h-12 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold text-white text-xs shadow-lg"
                  style={{
                    gridColumn: `${month.startIndex + 2} / span ${month.weekCount}`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {month.name.toUpperCase()}
                </div>
              ))}
            </div>

            {/* Cabeçalho das semanas */}
            <div className="grid" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, 120px)` }}>
              <div className="h-18 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-slate-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-semibold text-slate-700 text-xs">TAREFAS</div>
                  <div className="text-[10px] text-slate-500 mt-1">{projectName || 'Projeto'}</div>
                </div>
              </div>
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="h-18 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col items-center justify-center p-1.5"
                >
                  <div className="font-semibold text-slate-700 text-[11px]">Semana {week.weekNumber}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {week.start.getDate().toString().padStart(2, '0')}/{week.start.getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Tarefas com barras contínuas */}
            {validTasks.map((task, taskIndex) => (
              <div
                key={task.id}
                className="grid hover:bg-slate-50 transition-colors duration-200 relative"
                style={{ gridTemplateColumns: `280px repeat(${weeks.length}, 120px)` }}
              >
                {/* Informações da tarefa */}
                <div className="h-20 border-r border-slate-200 bg-white p-3 flex flex-col justify-center">
                  <div className="font-semibold text-slate-800 text-sm leading-tight mb-2">
                    {task.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-600">{task.responsible}</span>
                    <Badge className={`text-xs px-1.5 py-0.5 border ${getStatusBadgeColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </Badge>
                  </div>
                </div>

                {/* Células do calendário */}
                {weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="h-20 border-r border-slate-200 relative bg-white"
                  />
                ))}

                {/* SOLUÇÃO DEFINITIVA: Barra contínua posicionada absolutamente */}
                {task.start_date && task.end_date && (
                  <div
                    className={`absolute top-6 bottom-6 bg-gradient-to-r ${getTaskColor(task.status)} shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group rounded-md`}
                    style={getTaskBarStyle(task)}
                    title={`${task.name}: ${task.start_date} a ${task.end_date}`}
                  >
                    <div className="px-2 py-1 text-white font-medium text-xs leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="font-bold">{task.name}</div>
                      <div className="text-xs opacity-90">{task.responsible}</div>
                    </div>
                  </div>
                )}

                {/* Linha separadora entre tarefas (exceto na última) */}
                {taskIndex < validTasks.length - 1 && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
                    style={{ gridColumn: `1 / span ${weeks.length + 1}` }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legenda (compacta) */}
        <div className="mt-3 mx-3 mb-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
          <h4 className="font-medium text-slate-800 mb-2.5 flex items-center gap-2 text-xs">
            <div className="p-0.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            Legenda de Status
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {[
              { status: 'Não Iniciado', color: 'from-amber-400 to-amber-500' },
              { status: 'Em Andamento', color: 'from-blue-500 to-blue-600' },
              { status: 'Concluído', color: 'from-emerald-500 to-emerald-600' },
              { status: 'Atrasado', color: 'from-red-500 to-red-600' },
              { status: 'Pausado', color: 'from-slate-500 to-slate-600' }
            ].map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 bg-gradient-to-r ${item.color} rounded-full`}></div>
              <span className="text-[12px] font-medium text-slate-700">{item.status}</span>
            </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 