"use client"
import React from "react"
import { createPortal } from "react-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Clock, TrendingUp, Users, Maximize2, Minimize2, Download, FileImage, FileText, Circle, PlayCircle, PauseCircle, CheckCircle, AlertTriangle, ZoomIn, ZoomOut, RotateCcw, ClipboardList, CheckCircle2 } from "lucide-react"
import { useGanttDownload } from "@/hooks/use-gantt-download"

interface Task {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  responsible: string
  description?: string
  delay_justification?: string
  original_end_date?: string
  actual_end_date?: string
  actual_start_date?: string
  predicted_end_date?: string
  delay_created_at?: string
  delay_created_by?: string
  order?: number
}

interface GanttChartProps {
  tasks: Task[]; 
  projectStartDate?: string; 
  projectEndDate?: string;
  defaultExpanded?: boolean;
  projectName?: string;
  hideControls?: boolean; // Nova prop para esconder ícones de controle
}

export function GanttChart({ tasks, projectStartDate, projectEndDate, defaultExpanded = false, projectName, hideControls = false }: GanttChartProps) {
  // Estado para controlar a expansão da tela
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  // Evitar hydration mismatch ao destacar mês atual
  const [currentYM, setCurrentYM] = React.useState<{ y: number; m: number } | null>(null)
  
  // Estado para controlar o nível de zoom (50%, 75%, 100%, 125%, 150%)
  const [zoomLevel, setZoomLevel] = React.useState(100)
  
  // Estado para controlar o modo de visualização (planejado vs real)
  const [viewMode, setViewMode] = React.useState<'planned' | 'actual'>('planned')
  // Estado para controlar transição (evita tooltips piscando)
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  
  // Função para trocar de modo com transição suave
  const handleViewModeChange = React.useCallback((newMode: 'planned' | 'actual') => {
    if (newMode === viewMode) return
    setIsTransitioning(true)
    setViewMode(newMode)
    setTimeout(() => setIsTransitioning(false), 150)
  }, [viewMode])
  
  // Largura base de uma semana (120px padrão × zoom)
  const weekWidth = React.useMemo(() => {
    return 120 * (zoomLevel / 100)
  }, [zoomLevel])
  
  // Funções de zoom
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 150)) // Máximo 150%
  }
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50)) // Mínimo 50%
  }
  
  const resetZoom = () => {
    setZoomLevel(100)
  }
  
  // Hook para download
  const { downloadAsImage } = useGanttDownload()

  // Funções de download
  const handleDownloadPNG = async () => {
    const elementId = isExpanded ? 'gantt-chart-content-expanded' : 'gantt-chart-content'
    const result = await downloadAsImage(elementId, {
      format: 'png',
      filename: `cronograma-${projectName || 'projeto'}-${new Date().toISOString().split('T')[0]}`
    })
    
    if (!result.success) {
      alert('Erro ao fazer download: ' + result.error)
    }
  }

  const handleDownloadPDF = async () => {
    const elementId = isExpanded ? 'gantt-chart-content-expanded' : 'gantt-chart-content'
    const result = await downloadAsImage(elementId, {
      format: 'pdf',
      filename: `cronograma-${projectName || 'projeto'}-${new Date().toISOString().split('T')[0]}`
    })
    
    if (!result.success) {
      alert('Erro ao fazer download: ' + result.error)
    }
  }

  // Bloquear scroll da página quando expandido
  React.useEffect(() => {
    if (isExpanded) {
      // Bloquear scroll da página completamente
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      // Restaurar scroll da página
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }

    // Cleanup: restaurar scroll quando componente for desmontado
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [isExpanded])

  // Definir mês/ano atual apenas no cliente
  React.useEffect(() => {
    const now = new Date()
    setCurrentYM({ y: now.getFullYear(), m: now.getMonth() })
  }, [])

  // Função helper para obter as datas corretas baseado no modo de visualização
  const getTaskDates = React.useCallback((task: Task) => {
    if (viewMode === 'planned') {
      // Modo Planejado: usa baseline original
      return {
        startDate: task.start_date,
        endDate: task.end_date
      }
    } else {
      // Modo Real: usa datas reais ou previstas
      const startDate = task.actual_start_date || task.start_date
      const endDate = task.actual_end_date || task.predicted_end_date || task.end_date
      
      // DEBUG: Verificar datas no modo Real
      if (task.name.includes('Definição')) {
        console.log(`📅 getTaskDates [REAL] "${task.name}":`, {
          actual_start_date: task.actual_start_date,
          start_date: task.start_date,
          actual_end_date: task.actual_end_date,
          predicted_end_date: task.predicted_end_date,
          end_date: task.end_date,
          '→ startDate USADO': startDate,
          '→ endDate USADO': endDate
        })
      }
      
      return {
        startDate,
        endDate
      }
    }
  }, [viewMode])

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
          // IMPORTANTE: Timeline SEMPRE usa datas PLANEJADAS como referência
          // Isso garante que a numeração das semanas seja consistente entre modos Planejado e Real
          // Apenas as barras de tarefas mudam de posição no modo Real
          const taskDates = validTasks.flatMap(task => {
            // SEMPRE usar datas planejadas para calcular a timeline
            return [
            new Date(task.start_date), 
            new Date(task.end_date)
            ]
          }).filter(date => !isNaN(date.getTime()))
          
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
  }, [tasks]) // Timeline sempre baseada nas datas planejadas, independente do viewMode

  // Calcular posição da linha da data atual
  const currentDateLinePosition = React.useMemo(() => {
    try {
      const today = new Date()
      const todayTime = today.getTime()
      
      // Encontrar a semana que contém a data atual
      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i]
        const weekStartTime = week.start.getTime()
        const weekEndTime = week.end.getTime()
        
        if (todayTime >= weekStartTime && todayTime <= weekEndTime) {
          // Calcular a posição dentro da semana (0 = início, 1 = fim)
          const weekDuration = weekEndTime - weekStartTime
          const daysFromStart = todayTime - weekStartTime
          const positionInWeek = daysFromStart / weekDuration
          
          // Retornar posição: índice da semana + posição dentro da semana
          return i + positionInWeek
        }
      }
      
      // Se não encontrou, retornar null (não mostrar linha)
      return null
    } catch (error) {
      console.error("Erro ao calcular posição da linha da data atual:", error)
      return null
    }
  }, [weeks])

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
    // DEBUG: Verificar se função está sendo chamada no modo Real
    if (task.name.includes('Definição')) {
      console.log(`🎨 getTaskBarStyle CHAMADO [${viewMode.toUpperCase()}] "${task.name}"`, {
        'task.start_date': task.start_date,
        'task.end_date': task.end_date,
        'weeks.length': weeks.length
      })
    }
    
    if (!task.start_date || !task.end_date || weeks.length === 0) {
      if (task.name.includes('Definição')) {
        console.log(`❌ getTaskBarStyle RETORNOU VAZIO - Motivo:`, {
          'start_date existe?': !!task.start_date,
          'end_date existe?': !!task.end_date,
          'weeks.length > 0?': weeks.length > 0
        })
      }
      return {}
    }
    
    try {
      // Obter as datas corretas baseado no modo de visualização
      const { startDate, endDate } = getTaskDates(task)
      const taskStart = new Date(startDate)
      const taskEnd = new Date(endDate)
      
      if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) return {}
      
      // Encontrar a primeira e última semana do projeto
      const projectStart = weeks[0]?.start
      const projectEnd = weeks[weeks.length - 1]?.end
      
      if (!projectStart || !projectEnd) return {}
      
      // DEBUG: Log para verificar posicionamento
      if (task.name.includes('Definição')) {
        console.log(`🔍 [${viewMode.toUpperCase()}] "${task.name}":`, {
          viewMode,
          startDate,
          endDate,
          taskStart: taskStart.toLocaleDateString('pt-BR'),
          projectStart: projectStart.toLocaleDateString('pt-BR'),
          'weeks[0]': weeks[0]
        })
      }
      
      // Calcular posição em pixels baseada em dias exatos
      const totalProjectDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
      if (totalProjectDays <= 0) return {}
      
      // Calcular posição da tarefa em relação ao projeto
      const taskStartOffset = Math.max(0, (taskStart.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
      const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
      
      // Usar largura dinâmica baseada no zoom
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
  }, [weeks, weekWidth, getTaskDates])

  // CORREÇÃO: Função para obter cor baseada no status real da tarefa
  const getTaskColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'não iniciado':
      case 'not_started':
        return 'from-slate-400 via-slate-300 to-slate-500'
      case 'em andamento':
      case 'in_progress':
        return 'from-blue-500 via-cyan-400 to-blue-600'
      case 'concluído':
      case 'completed':
        return 'from-emerald-500 via-green-400 to-emerald-600'
      case 'concluído com atraso':
      case 'completed_delayed':
        return 'from-orange-500 via-orange-400 to-orange-600'
      case 'atrasado':
      case 'delayed':
        return 'from-red-500 via-orange-400 to-red-600'
      case 'pausado':
      case 'on_hold':
        return 'from-violet-500 via-violet-400 to-fuchsia-600'
      default:
        return 'from-blue-500 via-cyan-400 to-blue-600'
    }
  }

  // NOVO: Calcular segmentos da barra no modo Real (passado/presente/futuro)
  const getTaskSegments = React.useCallback((task: Task) => {
    // DEBUG: Verificar se função está sendo chamada
    if (task.name.includes('Definição')) {
      console.log(`🧩 getTaskSegments CHAMADO [${viewMode.toUpperCase()}] "${task.name}"`, {
        viewMode,
        'task.start_date': task.start_date,
        'task.end_date': task.end_date,
        'weeks.length': weeks.length
      })
    }
    
    if (viewMode === 'planned' || !task.start_date || !task.end_date || weeks.length === 0) {
      if (task.name.includes('Definição') && viewMode !== 'planned') {
        console.log(`❌ getTaskSegments RETORNOU NULL - Motivo:`, {
          'viewMode !== planned?': viewMode !== 'planned',
          'start_date existe?': !!task.start_date,
          'end_date existe?': !!task.end_date,
          'weeks.length > 0?': weeks.length > 0
        })
      }
      return null // Modo planejado usa barra única
    }

    try {
      const { startDate, endDate } = getTaskDates(task)
      
      // FIX: Adicionar T12:00:00 para evitar problemas de timezone
      const taskStart = new Date(startDate + 'T12:00:00')
      const taskEnd = new Date(endDate + 'T12:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const projectStart = weeks[0]?.start
      const projectEnd = weeks[weeks.length - 1]?.end
      
      // DEBUG: Verificar datas e posicionamento
      if (task.name.includes('Definição')) {
        console.log(`📍 getTaskSegments CALCULANDO "${task.name}":`, {
          startDate,
          endDate,
          'taskStart': taskStart.toLocaleDateString('pt-BR'),
          'projectStart': projectStart?.toLocaleDateString('pt-BR'),
          'weeks[0]': weeks[0],
          'segments serão calculados': true
        })
      }
      
      if (!projectStart || !projectEnd) return null

      const totalProjectDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
      if (totalProjectDays <= 0) return null

      const totalWeeksWidth = weeks.length * weekWidth
      const baseLeft = 280

      // Helper para calcular pixels
      const calculatePixels = (date: Date) => {
        const offset = Math.max(0, (date.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
        return baseLeft + (offset / totalProjectDays) * totalWeeksWidth
      }

      const segments = []
      const minSegmentWidth = Math.max(weekWidth / 7, 8)
      const getSegmentWidth = (left: number, right: number) => {
        const rawWidth = Math.max(right - left, 0)
        return rawWidth < minSegmentWidth ? minSegmentWidth : rawWidth
      }

      // Se a tarefa já terminou (tem actual_end_date)
      if (task.actual_end_date) {
        const actualEnd = new Date(task.actual_end_date + 'T12:00:00')
        const planned = new Date(task.end_date + 'T12:00:00')
        
        // Barra única mostrando período executado
        const leftPx = calculatePixels(taskStart)
        const rightPx = calculatePixels(actualEnd)
        const widthPx = getSegmentWidth(leftPx, rightPx)
        
        segments.push({
          type: 'completed',
          left: `${leftPx}px`,
          width: `${widthPx}px`,
          color: task.status === 'completed_delayed' ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          opacity: 'opacity-90'
        })
      } 
      // Se está em andamento
      else if (task.status === 'in_progress' || task.status === 'delayed') {
        const plannedEnd = new Date(task.end_date + 'T12:00:00')
        
        // Segmento 1: Do início até o fim planejado (ou hoje, o que vier primeiro)
        const segment1End = today < plannedEnd ? today : plannedEnd
        const leftPx1 = calculatePixels(taskStart)
        const rightPx1 = calculatePixels(segment1End)
        const widthPx1 = getSegmentWidth(leftPx1, rightPx1)
        
        if (widthPx1 > 0) {
          segments.push({
            type: 'executed',
            left: `${leftPx1}px`,
            width: `${widthPx1}px`,
            color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
            opacity: 'opacity-80'
          })
        }

        // Segmento 2: Do fim planejado até hoje (período atrasado) - se passou do prazo
        if (today > plannedEnd) {
          const leftPx2 = calculatePixels(plannedEnd)
          const rightPx2 = calculatePixels(today)
          const widthPx2 = getSegmentWidth(leftPx2, rightPx2)
          
          if (widthPx2 > 0) {
            segments.push({
              type: 'delayed',
              left: `${leftPx2}px`,
              width: `${widthPx2}px`,
              color: 'bg-gradient-to-r from-red-500 to-red-600',
              opacity: 'opacity-90',
              pulse: true
            })
          }
        }

        // Segmento 3: De hoje até a previsão de término (futuro)
        const leftPx3 = calculatePixels(today)
        const rightPx3 = calculatePixels(taskEnd)
        const widthPx3 = getSegmentWidth(leftPx3, rightPx3)
        
        if (widthPx3 > 0) {
          segments.push({
            type: 'predicted',
            left: `${leftPx3}px`,
            width: `${widthPx3}px`,
            color: 'bg-slate-300',
            opacity: 'opacity-50',
            dashed: true
          })
        }
      }
      // Se não iniciou ainda
      else {
        const leftPx = calculatePixels(taskStart)
        const rightPx = calculatePixels(taskEnd)
        const widthPx = getSegmentWidth(leftPx, rightPx)
        
        segments.push({
          type: 'notstarted',
          left: `${leftPx}px`,
          width: `${widthPx}px`,
          color: 'bg-slate-200',
          opacity: 'opacity-40',
          dashed: true
        })
      }

      if (segments.length === 0) return null
      
      // CORREÇÃO: Converter posições absolutas para relativas ao primeiro segmento
      // O container terá left=containerLeft, então os segmentos internos devem ser relativos
      const firstSegmentLeft = parseFloat(segments[0].left)
      const adjustedSegments = segments.map(seg => ({
        ...seg,
        left: `${parseFloat(seg.left) - firstSegmentLeft}px`
      }))
      
      // Retornar segmentos ajustados + posição do container
      return {
        containerLeft: `${firstSegmentLeft}px`,
        segments: adjustedSegments
      }
    } catch (error) {
      console.error("Erro ao calcular segmentos:", error)
      return null
    }
  }, [viewMode, weeks, weekWidth, getTaskDates])

  // Função para calcular progresso baseado no status
  const getTaskProgress = (task: Task) => {
    switch (task.status.toLowerCase()) {
      case 'não iniciado':
      case 'not_started':
        return 0
      case 'em andamento':
      case 'in_progress':
        return 60 // Progresso médio para tarefas em andamento
      case 'concluído':
      case 'completed':
        return 100
      case 'concluído com atraso':
      case 'completed_delayed':
        return 100 // Concluído mas com atraso
      case 'atrasado':
      case 'delayed':
        return 80 // Progresso alto mas atrasado
      case 'pausado':
      case 'on_hold':
        return 30 // Progresso baixo para tarefas pausadas
      case 'commercial_proposal':
        return 0 // Proposta comercial ainda não aprovada
      default:
        return 0
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
      case 'concluído com atraso':
      case 'completed_delayed':
        return 'Concluído com Atraso'
      case 'atrasado':
      case 'delayed':
        return 'Atrasado'
      case 'pausado':
      case 'on_hold':
        return 'Pausado'
      case 'commercial_proposal':
        return 'Proposta Comercial'
      default:
        return status
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'não iniciado':
      case 'not_started':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'em andamento':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'concluído':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'concluído com atraso':
      case 'completed_delayed':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'atrasado':
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pausado':
      case 'on_hold':
        return 'bg-violet-100 text-violet-800 border-violet-200'
      case 'commercial_proposal':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  // Cor do farol (ponto) de status
  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'não iniciado':
      case 'not_started':
        return 'bg-slate-500'
      case 'em andamento':
      case 'in_progress':
        return 'bg-blue-500'
      case 'concluído':
      case 'completed':
        return 'bg-emerald-500'
      case 'concluído com atraso':
      case 'completed_delayed':
        return 'bg-orange-500'
      case 'atrasado':
      case 'delayed':
        return 'bg-red-500'
      case 'pausado':
      case 'on_hold':
        return 'bg-violet-500'
      default:
        return 'bg-slate-400'
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
  if (isExpanded && typeof document !== 'undefined') {
    return createPortal(
      <div 
        className="fixed inset-0 bg-white" 
        style={{ 
          zIndex: 999999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <Card className="h-full border-0 shadow-none bg-white flex flex-col">
          <CardHeader className="sticky top-0 z-[1] bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg ring-1 ring-white/50">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight">Visualização Gantt</div>
                  <div className="text-sm font-normal text-slate-600 mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/60 border border-slate-200 text-slate-700">
                      <Clock className="w-3.5 h-3.5" /> {validTasks.length} tarefa{validTasks.length !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/60 border border-slate-200 text-slate-700">
                      <Calendar className="w-3.5 h-3.5" /> {weeks.length} semanas
                    </span>
                  </div>
                </div>
              </CardTitle>
              
              {/* Botões de ação */}
              {!hideControls && (
                <div className="flex items-center gap-2 bg-white/60 border border-slate-200 rounded-lg p-1.5 shadow-sm">
                  {/* Toggle de Visualização */}
                  <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-1">
                    <Button
                      type="button"
                      variant={viewMode === 'planned' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 px-3 flex items-center gap-1.5"
                      onClick={() => handleViewModeChange('planned')}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Planejado
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === 'actual' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 px-3 flex items-center gap-1.5"
                      onClick={() => handleViewModeChange('actual')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Real
                    </Button>
                  </div>
                  
                  {/* Controles de Zoom */}
                  <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-1">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      className="p-2 hover:scale-105 transition-transform disabled:opacity-50"
                      onClick={zoomOut}
                      disabled={zoomLevel <= 50}
                      title="Diminuir zoom"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Resetar zoom (100%)"
                    >
                      {zoomLevel}%
                    </button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      className="p-2 hover:scale-105 transition-transform disabled:opacity-50"
                      onClick={zoomIn}
                      disabled={zoomLevel >= 150}
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Botão de download */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="p-2 hover:scale-105 transition-transform">
                        <Download className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[999999] w-56">
                      <DropdownMenuItem onClick={handleDownloadPNG} className="gap-3 p-3">
                        <FileImage className="w-4 h-4 text-blue-600" />
                        <div className="flex flex-col">
                          <span className="font-medium">Baixar como PNG</span>
                          <span className="text-xs text-slate-500">Imagem de alta qualidade</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadPDF} className="gap-3 p-3">
                        <FileText className="w-4 h-4 text-red-600" />
                        <div className="flex flex-col">
                          <span className="font-medium">Baixar como PDF</span>
                          <span className="text-xs text-slate-500">Documento para impressão</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Botão para colapsar */}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 rounded-lg text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Colapsar visualização (Esc)"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="overflow-x-auto">
              <div id="gantt-chart-content-expanded" className="min-w-[900px]">
                {/* Cabeçalho dos meses (gradiente, separadores e realce do mês atual) */}
                <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, ${weekWidth}px)` }}>
                  <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-200 border-r border-slate-300" />
                  {Object.values(monthsWithWeeks).map((month, monthIndex) => {
                    const isCurrentMonth = (() => {
                      try {
                        if (!currentYM) return false
                        const [monthName, yearStr] = month.name.split(' de ')
                        const date = new Date(`${monthName} 1, ${yearStr}`)
                        return date.getMonth() === currentYM.m && date.getFullYear() === currentYM.y
                      } catch { return false }
                    })()
                    return (
                      <div
                        key={monthIndex}
                        className={`relative h-12 flex items-center justify-center text-white text-[11px] tracking-wide uppercase font-semibold shadow-md transition-colors duration-200 ${isCurrentMonth ? 'ring-2 ring-white/50' : ''}`}
                        style={{
                          gridColumn: `${month.startIndex + 2} / span ${month.weekCount}`,
                          background: 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 60%, #1e40af 100%)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.06)'
                        }}
                        aria-label={`Mês ${month.name}`}
                        title={month.name}
                      >
                        {/* Overlay de brilho sutil */}
                        <div className="absolute inset-0 bg-white/5" />
                        {/* Separador à direita de cada mês */}
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20" />
                        {/* Texto com leve sombra para contraste */}
                        <span className="relative drop-shadow-sm text-center leading-tight">
                          {month.name.toUpperCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Cabeçalho das semanas */}
                <div className="grid" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, ${weekWidth}px)` }}>
                  <div className="h-18 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border-r border-slate-300 flex items-center justify-center shadow-sm">
                    <div className="text-center">
                      <div className="font-bold text-slate-800 text-xs tracking-wide uppercase">TAREFAS</div>
                      <div className="text-[10px] text-slate-600 mt-1 font-medium">{projectName || 'Projeto'}</div>
                    </div>
                  </div>
                  {weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="h-18 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border-r border-slate-300 flex flex-col items-center justify-center p-2 shadow-sm hover:from-slate-200 hover:to-slate-100 transition-all duration-200 group"
                    >
                      <div className="font-bold text-slate-800 text-[11px] group-hover:text-blue-700 transition-colors">Semana {week.weekNumber}</div>
                      <div className="text-[10px] text-slate-600 mt-1 font-mono group-hover:text-blue-600 transition-colors">
                        {week.start.getDate().toString().padStart(2, '0')}/{week.start.getMonth() + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Container das tarefas com posicionamento relativo para a linha */}
                <div className="relative">
                  {/* Linha da data atual */}
                  {currentDateLinePosition !== null && (
                    <div 
                      className="absolute w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 z-10 pointer-events-none rounded-full"
                      style={{
                        left: `calc(280px + ${currentDateLinePosition * weekWidth}px)`,
                        top: '0px',
                        height: `${validTasks.length * 80}px`, // Altura baseada no número de tarefas
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.4), 0 0 16px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <div className="absolute -top-3 -left-2 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg"></div>
                      <div className="absolute -bottom-3 -left-2 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg"></div>
                    </div>
                  )}

                {/* Tarefas com barras contínuas */}
                {validTasks.map((task, taskIndex) => {
                  const hasDelayJustification = task.delay_justification && task.status === 'completed_delayed'
                  
                  return (
                    <div
                      key={task.id}
                      data-task-id={task.id}
                      className={`grid hover:bg-slate-50 transition-colors duration-200 relative ${hasDelayJustification ? 'bg-orange-50/30' : ''}`}
                      style={{ gridTemplateColumns: `280px repeat(${weeks.length}, ${weekWidth}px)` }}
                    >
                    {/* Informações da tarefa */}
                    <div className="h-20 border-r border-slate-200 bg-white px-3 py-2.5 flex flex-col justify-center">
                      <div className="flex items-start gap-2">
                        {/* Farol de status */}
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(task.status)} ring-2 ring-white flex-shrink-0 mt-1.5`} title={getStatusText(task.status)} />
                        <div className="font-semibold text-slate-900 text-[13px] leading-snug tracking-tight flex-1" data-task-title={task.name}>
                          {task.name}
                          {/* Ícone de alerta para tarefas com justificativa */}
                          {hasDelayJustification && (
                            <AlertTriangle className="inline-block w-3.5 h-3.5 text-orange-500 ml-1 align-middle" />
                          )}
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate" data-task-assignee={task.responsible}>{task.responsible}</span>
                      </div>
                    </div>

                    {/* Células do calendário */}
                    {weeks.map((week, weekIndex) => (
                      <div
                        key={weekIndex}
                        className="h-20 border-r border-slate-200 relative bg-white hover:bg-slate-50/50 transition-colors duration-200"
                      />
                    ))}

                    {/* V2: Barras com segmentos no modo Real */}
                    {(() => {
                      const segmentData = getTaskSegments(task)
                      
                      if (segmentData) {
                        // Modo Real: Renderizar segmentos divididos com tooltip rico
                        return (
                          <div className="absolute top-6 bottom-6 group" style={{ left: segmentData.containerLeft, right: 0 }}>
                            {/* Segmentos visuais */}
                            {segmentData.segments.map((segment: any, segIdx: number) => (
                              <div
                                key={`segment-${segIdx}`}
                                className={`absolute top-0 bottom-0 rounded-lg ${segment.color} ${segment.opacity} shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${segment.dashed ? 'border-2 border-dashed border-slate-400' : ''} ${segment.pulse ? 'animate-pulse' : ''}`}
                                style={{ left: segment.left, width: segment.width, position: 'absolute' }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            ))}
                            
                            {/* Tooltip Rico (único para todos os segmentos) */}
                            <div
                              className={`pointer-events-none absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 ${isTransitioning ? '!opacity-0 !hidden' : ''}`}
                              style={{ left: 'clamp(64px, 50%, calc(100% - 64px))', transform: 'translateX(-50%)' }}
                            >
                              <div className="min-w-[280px] max-w-[320px] px-4 py-3 rounded-xl border border-slate-300 bg-white shadow-xl">
                                <div className="text-xs font-bold text-slate-900 mb-2">{task.name}</div>
                                
                                {/* Planejado (Baseline) */}
                                <div className="mb-2 pb-2 border-b border-slate-200">
                                  <div className="text-[10px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-600" /> PLANEJADO (Baseline)
                                  </div>
                                  <div className="text-[10px] text-slate-600 space-y-0.5">
                                    <div>Início: {new Date(task.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                    <div>Término: {new Date(task.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                    <div className="text-blue-600 font-medium">Duração: {Math.ceil((new Date(task.end_date).getTime() - new Date(task.start_date).getTime()) / (24 * 60 * 60 * 1000))} dias</div>
                                  </div>
                                </div>
                                
                                {/* Realizado */}
                                <div className="mb-2 pb-2 border-b border-slate-200">
                                  <div className="text-[10px] font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> REALIZADO
                                  </div>
                                  <div className="text-[10px] text-slate-600 space-y-0.5">
                                    <div>Início: {task.actual_start_date ? new Date(task.actual_start_date + 'T12:00:00').toLocaleDateString('pt-BR') : new Date(task.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} {task.actual_start_date ? '✓' : '(planejado)'}</div>
                                    <div>Término: {task.actual_end_date ? new Date(task.actual_end_date + 'T12:00:00').toLocaleDateString('pt-BR') + ' ✓' : 'Em andamento'}</div>
                                    {!task.actual_end_date && (
                                      <div className="text-emerald-600 font-medium">
                                        Executado até hoje: {Math.ceil((new Date().getTime() - new Date(task.actual_start_date || task.start_date).getTime()) / (24 * 60 * 60 * 1000))} dias
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Previsão (se não terminou) */}
                                {!task.actual_end_date && (task.predicted_end_date || task.end_date) && (
                                  <div className="mb-2 pb-2 border-b border-slate-200">
                                    <div className="text-[10px] font-semibold text-blue-700 mb-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-blue-600" /> PREVISÃO DE TÉRMINO
                                    </div>
                                    <div className="text-[10px] text-slate-600 space-y-0.5">
                                      <div>Data: {new Date((task.predicted_end_date || task.end_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                      <div className="text-blue-600 font-medium">
                                        Faltam: {Math.ceil((new Date(task.predicted_end_date || task.end_date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} dias
                                      </div>
                                      <div className="text-slate-500">
                                        Duração total: {Math.ceil((new Date(task.predicted_end_date || task.end_date).getTime() - new Date(task.actual_start_date || task.start_date).getTime()) / (24 * 60 * 60 * 1000))} dias
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Análise */}
                                <div className="mb-1">
                                  <div className="text-[10px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-slate-600" /> ANÁLISE
                                  </div>
                                  <div className="text-[10px] text-slate-600 space-y-0.5">
                                    {(() => {
                                      const plannedEnd = new Date(task.end_date)
                                      const actualOrPredicted = new Date(task.actual_end_date || task.predicted_end_date || task.end_date)
                                      const deviation = Math.ceil((actualOrPredicted.getTime() - plannedEnd.getTime()) / (24 * 60 * 60 * 1000))
                                      
                                      return (
                                        <>
                                          <div className={`font-medium ${deviation > 0 ? 'text-red-600' : deviation < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                                            {deviation > 0 ? '🔴' : deviation < 0 ? '🟢' : '⚪'} Desvio: {deviation > 0 ? '+' : ''}{deviation} dias
                                          </div>
                                          <div>Status: {getStatusText(task.status)}</div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </div>
                                
                                {/* Responsável */}
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {task.responsible}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      
                      // Modo Planejado: Barra única (original)
                      return task.start_date && task.end_date && (
                      <div className="absolute top-6 bottom-6 group" style={getTaskBarStyle(task)}>
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${getTaskColor(task.status)} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl border border-white/20 hover:border-white/40 hover:scale-[1.02] backdrop-blur-sm`}
                          data-progress-bar="true"
                          data-start-date={task.start_date}
                          data-end-date={task.end_date}
                          data-progress={getTaskProgress(task)}
                        >
                          {/* Efeito de brilho interno */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Indicador de progresso sutil */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
                            <div 
                              className="h-full bg-white/40 transition-all duration-500 ease-out"
                              style={{ width: `${getTaskProgress(task)}%` }}
                            />
                          </div>
                        </div>

                        {/* Tooltip moderno - fora da barra para aparecer acima */}
                        <div className={`pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] ${isTransitioning ? '!opacity-0 !hidden' : ''}`}>
                          <div className="min-w-[220px] max-w-[280px] px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-xl">
                            <div className="text-[11px] font-semibold text-slate-900 line-clamp-1">{task.name}</div>
                            <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                              <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {task.responsible}</div>
                              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(task.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} - {new Date(task.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-600">{getStatusText(task.status)}</div>
                            {task.status === 'completed_delayed' && (
                              <div className="mt-2 pt-2 border-t border-orange-200">
                                <div className="text-[10px] font-medium text-orange-600 mb-1">Justificativa de Atraso:</div>
                                {task.delay_justification && (
                                  <div className="text-[10px] text-slate-600 mb-2 line-clamp-2">{task.delay_justification}</div>
                                )}
                                <div className="text-[10px] text-slate-500">
                                  <div><strong>Data planejada:</strong> {task.original_end_date ? new Date(task.original_end_date + 'T12:00:00').toLocaleDateString('pt-BR') : (task.end_date ? new Date(task.end_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A')}</div>
                                  <div className="mt-1"><strong>Data real:</strong> {task.actual_end_date ? new Date(task.actual_end_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      )
                    })()}

                    {/* Linha separadora entre tarefas (exceto na última) */}
                    {taskIndex < validTasks.length - 1 && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
                        style={{ gridColumn: `1 / span ${weeks.length + 1}` }}
                      />
                    )}
                  </div>
                  )
                })}
                </div> {/* Fechar container das tarefas */}
              </div>
            </div>

            {/* Legenda */}
            <div className="mt-4 mx-3 mb-3 p-4 bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-2xl border border-slate-200/50 shadow-sm">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                Legenda de Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[{
                  status: 'Não Iniciado',
                  color: 'from-slate-400 to-slate-500',
                  bgColor: 'bg-slate-100',
                  Icon: Circle
                },{
                  status: 'Em Andamento',
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'bg-blue-100',
                  Icon: PlayCircle
                },{
                  status: 'Concluído',
                  color: 'from-emerald-500 to-emerald-600',
                  bgColor: 'bg-emerald-100',
                  Icon: CheckCircle
                },{
                  status: 'Concluído com Atraso',
                  color: 'from-orange-500 to-orange-600',
                  bgColor: 'bg-orange-100',
                  Icon: CheckCircle
                },{
                  status: 'Atrasado',
                  color: 'from-red-500 to-red-600',
                  bgColor: 'bg-red-100',
                  Icon: AlertTriangle
                },{
                  status: 'Pausado',
                  color: 'from-violet-500 to-fuchsia-600',
                  bgColor: 'bg-violet-100',
                  Icon: PauseCircle
                }].map((item, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 ${item.bgColor} rounded-xl border border-white/50 hover:shadow-md transition-all duration-200 group`}>
                    <div className={`w-4 h-4 bg-gradient-to-r ${item.color} rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200`}></div>
                    <div className="flex items-center gap-2">
                      <item.Icon className="w-4 h-4 text-slate-700/80" />
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{item.status}</span>
                    </div>
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
    <Card className="mt-6 border-0 shadow-xl bg-white overflow-visible transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg ring-1 ring-white/50">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Visualização Gantt</div>
              <div className="text-sm font-normal text-slate-600 mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/60 border border-slate-200 text-slate-700">
                  <Clock className="w-3.5 h-3.5" /> {validTasks.length} tarefa{validTasks.length !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/60 border border-slate-200 text-slate-700">
                  <Calendar className="w-3.5 h-3.5" /> {weeks.length} semanas
                </span>
              </div>
            </div>
          </CardTitle>
          
          {/* Botões de ação */}
          {!hideControls && (
            <div className="flex items-center gap-2 bg-white/60 border border-slate-200 rounded-lg p-1.5 shadow-sm">
              {/* Toggle de Visualização */}
              <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-1">
                <Button
                  type="button"
                  variant={viewMode === 'planned' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-3 flex items-center gap-1.5"
                  onClick={() => handleViewModeChange('planned')}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Planejado
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'actual' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-3 flex items-center gap-1.5"
                  onClick={() => handleViewModeChange('actual')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Real
                </Button>
              </div>
              
              {/* Controles de Zoom */}
              <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-1">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="p-2 hover:scale-105 transition-transform disabled:opacity-50"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 50}
                  title="Diminuir zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Resetar zoom (100%)"
                >
                  {zoomLevel}%
                </button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="p-2 hover:scale-105 transition-transform disabled:opacity-50"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 150}
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Botão de download */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2 hover:scale-105 transition-transform">
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleDownloadPNG} className="gap-3 p-3">
                    <FileImage className="w-4 h-4 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Baixar como PNG</span>
                      <span className="text-xs text-slate-500">Imagem de alta qualidade</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPDF} className="gap-3 p-3">
                    <FileText className="w-4 h-4 text-red-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Baixar como PDF</span>
                      <span className="text-xs text-slate-500">Documento para impressão</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Botão para expandir */}
              <button
                onClick={() => setIsExpanded(true)}
                className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                title="Expandir visualização (F11)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div id="gantt-chart-content" className="min-w-[900px]">
            {/* Cabeçalho dos meses (gradiente, separadores e realce do mês atual) */}
            <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, ${weekWidth}px)` }}>
              <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-200 border-r border-slate-300" />
              {Object.values(monthsWithWeeks).map((month, monthIndex) => {
                const isCurrentMonth = (() => {
                  try {
                    if (!currentYM) return false
                    const [monthName, yearStr] = month.name.split(' de ')
                    const date = new Date(`${monthName} 1, ${yearStr}`)
                    return date.getMonth() === currentYM.m && date.getFullYear() === currentYM.y
                  } catch { return false }
                })()
                return (
                  <div
                    key={monthIndex}
                    className={`relative h-12 flex items-center justify-center text-white text-[11px] tracking-wide uppercase font-semibold shadow-md transition-colors duration-200 ${isCurrentMonth ? 'ring-2 ring-white/50' : ''}`}
                    style={{
                      gridColumn: `${month.startIndex + 2} / span ${month.weekCount}`,
                      background: 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 60%, #1e40af 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.06)'
                    }}
                    aria-label={`Mês ${month.name}`}
                    title={month.name}
                  >
                    {/* Overlay de brilho sutil */}
                    <div className="absolute inset-0 bg-white/5" />
                    {/* Separador à direita de cada mês */}
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20" />
                    {/* Texto com leve sombra para contraste */}
                    <span className="relative drop-shadow-sm text-center leading-tight">
                      {month.name.toUpperCase()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Cabeçalho das semanas */}
            <div className="grid" style={{ gridTemplateColumns: `280px repeat(${weeks.length}, ${weekWidth}px)` }}>
              <div className="h-18 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border-r border-slate-300 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <div className="font-bold text-slate-800 text-xs tracking-wide uppercase">TAREFAS</div>
                  <div className="text-[10px] text-slate-600 mt-1 font-medium">{projectName || 'Projeto'}</div>
                </div>
              </div>
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="h-18 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border-r border-slate-300 flex flex-col items-center justify-center p-2 shadow-sm hover:from-slate-200 hover:to-slate-100 transition-all duration-200 group"
                >
                  <div className="font-bold text-slate-800 text-[11px] group-hover:text-blue-700 transition-colors">Semana {week.weekNumber}</div>
                  <div className="text-[10px] text-slate-600 mt-1 font-mono group-hover:text-blue-600 transition-colors">
                    {week.start.getDate().toString().padStart(2, '0')}/{week.start.getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Container das tarefas com posicionamento relativo para a linha */}
            <div className="relative">
              {/* Linha da data atual */}
              {currentDateLinePosition !== null && (
                <div 
                  className="absolute w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 z-10 pointer-events-none rounded-full"
                  style={{
                    left: `calc(280px + ${currentDateLinePosition * weekWidth}px)`,
                    top: '0px',
                    height: `${validTasks.length * 80}px`, // Altura baseada no número de tarefas
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.4), 0 0 16px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <div className="absolute -top-3 -left-2 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg"></div>
                  <div className="absolute -bottom-3 -left-2 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg"></div>
                </div>
              )}

            {/* Tarefas com barras contínuas */}
            {validTasks.map((task, taskIndex) => {
              const hasDelayJustification = task.delay_justification && task.status === 'completed_delayed'
              
              return (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  className={`grid hover:bg-slate-50 transition-colors duration-200 relative ${hasDelayJustification ? 'bg-orange-50/30' : ''}`}
                  style={{ gridTemplateColumns: `280px repeat(${weeks.length}, ${weekWidth}px)` }}
                >
                {/* Informações da tarefa */}
                <div className="h-20 border-r border-slate-200 bg-white px-3 py-2.5 flex flex-col justify-center">
                  <div className="flex items-start gap-2">
                    {/* Farol de status */}
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(task.status)} ring-2 ring-white flex-shrink-0 mt-1.5`} title={getStatusText(task.status)} />
                        <div className="font-semibold text-slate-900 text-[13px] leading-snug tracking-tight flex-1" data-task-title={task.name}>
                          {task.name}
                          {/* Ícone de alerta para tarefas com justificativa */}
                          {hasDelayJustification && (
                            <AlertTriangle className="inline-block w-3.5 h-3.5 text-orange-500 ml-1 align-middle" />
                          )}
                        </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate" data-task-assignee={task.responsible}>{task.responsible}</span>
                  </div>
                </div>

                {/* Células do calendário */}
                {weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="h-20 border-r border-slate-200 relative bg-white hover:bg-slate-50/50 transition-colors duration-200"
                  />
                ))}

                {/* V2: Barras com segmentos no modo Real (View Expandida) */}
                {(() => {
                  const segmentData = getTaskSegments(task)
                  
                  if (segmentData) {
                    // Modo Real: Renderizar segmentos divididos com tooltip rico
                    return (
                      <div className="absolute top-6 bottom-6 group" style={{ left: segmentData.containerLeft, right: 0 }}>
                        {/* Segmentos visuais */}
                        {segmentData.segments.map((segment: any, segIdx: number) => (
                          <div
                            key={`segment-exp-${segIdx}`}
                            className={`absolute top-0 bottom-0 rounded-lg ${segment.color} ${segment.opacity} shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${segment.dashed ? 'border-2 border-dashed border-slate-400' : ''} ${segment.pulse ? 'animate-pulse' : ''}`}
                            style={{ left: segment.left, width: segment.width, position: 'absolute' }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        ))}
                        
                        {/* Tooltip Rico (único para todos os segmentos) */}
                            <div
                              className={`pointer-events-none absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 ${isTransitioning ? '!opacity-0 !hidden' : ''}`}
                              style={{ left: 'clamp(64px, 50%, calc(100% - 64px))', transform: 'translateX(-50%)' }}
                            >
                          <div className="min-w-[280px] max-w-[320px] px-4 py-3 rounded-xl border border-slate-300 bg-white shadow-xl">
                            <div className="text-xs font-bold text-slate-900 mb-2">{task.name}</div>
                            
                            {/* Planejado (Baseline) */}
                            <div className="mb-2 pb-2 border-b border-slate-200">
                              <div className="text-[10px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-600" /> PLANEJADO (Baseline)
                              </div>
                              <div className="text-[10px] text-slate-600 space-y-0.5">
                                <div>Início: {new Date(task.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                <div>Término: {new Date(task.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                <div className="text-blue-600 font-medium">Duração: {Math.ceil((new Date(task.end_date).getTime() - new Date(task.start_date).getTime()) / (24 * 60 * 60 * 1000))} dias</div>
                              </div>
                            </div>
                            
                            {/* Realizado */}
                            <div className="mb-2 pb-2 border-b border-slate-200">
                              <div className="text-[10px] font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> REALIZADO
                              </div>
                              <div className="text-[10px] text-slate-600 space-y-0.5">
                                <div>Início: {task.actual_start_date ? new Date(task.actual_start_date + 'T12:00:00').toLocaleDateString('pt-BR') : new Date(task.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} {task.actual_start_date ? '✓' : '(planejado)'}</div>
                                <div>Término: {task.actual_end_date ? new Date(task.actual_end_date + 'T12:00:00').toLocaleDateString('pt-BR') + ' ✓' : 'Em andamento'}</div>
                                {!task.actual_end_date && (
                                  <div className="text-emerald-600 font-medium">
                                    Executado até hoje: {Math.ceil((new Date().getTime() - new Date(task.actual_start_date || task.start_date).getTime()) / (24 * 60 * 60 * 1000))} dias
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Previsão (se não terminou) */}
                            {!task.actual_end_date && (task.predicted_end_date || task.end_date) && (
                              <div className="mb-2 pb-2 border-b border-slate-200">
                                <div className="text-[10px] font-semibold text-blue-700 mb-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-blue-600" /> PREVISÃO DE TÉRMINO
                                </div>
                                <div className="text-[10px] text-slate-600 space-y-0.5">
                                  <div>Data: {new Date((task.predicted_end_date || task.end_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                  <div className="text-blue-600 font-medium">
                                    Faltam: {Math.ceil((new Date(task.predicted_end_date || task.end_date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} dias
                                  </div>
                                  <div className="text-slate-500">
                                    Duração total: {Math.ceil((new Date(task.predicted_end_date || task.end_date).getTime() - new Date(task.actual_start_date || task.start_date).getTime()) / (24 * 60 * 60 * 1000))} dias
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Análise */}
                            <div className="mb-1">
                              <div className="text-[10px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-slate-600" /> ANÁLISE
                              </div>
                              <div className="text-[10px] text-slate-600 space-y-0.5">
                                {(() => {
                                  const plannedEnd = new Date(task.end_date)
                                  const actualOrPredicted = new Date(task.actual_end_date || task.predicted_end_date || task.end_date)
                                  const deviation = Math.ceil((actualOrPredicted.getTime() - plannedEnd.getTime()) / (24 * 60 * 60 * 1000))
                                  
                                  return (
                                    <>
                                      <div className={`font-medium ${deviation > 0 ? 'text-red-600' : deviation < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                                        {deviation > 0 ? '🔴' : deviation < 0 ? '🟢' : '⚪'} Desvio: {deviation > 0 ? '+' : ''}{deviation} dias
                                      </div>
                                      <div>Status: {getStatusText(task.status)}</div>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                            
                            {/* Responsável */}
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {task.responsible}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  // Modo Planejado: Barra única (original)
                  return task.start_date && task.end_date && (
                  <div className="absolute top-6 bottom-6 group" style={getTaskBarStyle(task)}>
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${getTaskColor(task.status)} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl border border-white/20 hover:border-white/40 hover:scale-[1.02] backdrop-blur-sm`}
                      title={`${task.name}: ${task.start_date} a ${task.end_date}`}
                      data-progress-bar="true"
                      data-start-date={task.start_date}
                      data-end-date={task.end_date}
                      data-progress={getTaskProgress(task)}
                    >
                      {/* Efeito de brilho interno */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      
                      {/* Indicador de progresso sutil */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
                        <div 
                          className="h-full bg-white/40 transition-all duration-500 ease-out"
                          style={{ width: `${getTaskProgress(task)}%` }}
                        />
                      </div>
                    </div>

                    {/* Tooltip moderno - fora da barra para aparecer acima */}
                    <div className={`pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] ${isTransitioning ? '!opacity-0 !hidden' : ''}`}>
                      <div className="min-w-[220px] max-w-[280px] px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-xl">
                        <div className="text-[11px] font-semibold text-slate-900 line-clamp-1">{task.name}</div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                          <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {task.responsible}</div>
                          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(task.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} - {new Date(task.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(task.status)}`}></div>
                          {getStatusText(task.status)}
                        </div>
                        {task.status === 'completed_delayed' && (
                          <div className="mt-2 pt-2 border-t border-orange-200">
                            <div className="text-[10px] font-medium text-orange-600 mb-1">Justificativa de Atraso:</div>
                            {task.delay_justification && (
                              <div className="text-[10px] text-slate-600 mb-2 line-clamp-2">{task.delay_justification}</div>
                            )}
                            <div className="text-[10px] text-slate-500">
                              <div><strong>Data planejada:</strong> {task.original_end_date ? new Date(task.original_end_date + 'T12:00:00').toLocaleDateString('pt-BR') : (task.end_date ? new Date(task.end_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A')}</div>
                              <div className="mt-1"><strong>Data real:</strong> {task.actual_end_date ? new Date(task.actual_end_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })()}

                {/* Linha separadora entre tarefas (exceto na última) */}
                {taskIndex < validTasks.length - 1 && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
                    style={{ gridColumn: `1 / span ${weeks.length + 1}` }}
                  />
                )}
              </div>
              )
            })}
            </div> {/* Fechar container das tarefas */}
          </div>
        </div>

        {/* Legenda (compacta) */}
        <div className="mt-4 mx-3 mb-3 p-4 bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-2xl border border-slate-200/50 shadow-sm">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-3 text-sm">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Legenda de Status
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[{
              status: 'Não Iniciado',
              color: 'from-slate-400 to-slate-500',
              bgColor: 'bg-slate-100',
              Icon: Circle
            },{
              status: 'Em Andamento',
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-100',
              Icon: PlayCircle
            },{
              status: 'Concluído',
              color: 'from-emerald-500 to-emerald-600',
              bgColor: 'bg-emerald-100',
              Icon: CheckCircle
            },{
              status: 'Concluído com Atraso',
              color: 'from-orange-500 to-orange-600',
              bgColor: 'bg-orange-100',
              Icon: CheckCircle
            },{
              status: 'Atrasado',
              color: 'from-red-500 to-red-600',
              bgColor: 'bg-red-100',
              Icon: AlertTriangle
            },{
              status: 'Pausado',
              color: 'from-violet-500 to-fuchsia-600',
              bgColor: 'bg-violet-100',
              Icon: PauseCircle
            }].map((item, index) => (
              <div key={index} className={`flex items-center gap-3 p-3 ${item.bgColor} rounded-xl border border-white/50 hover:shadow-md transition-all duration-200 group`}>
                <div className={`w-4 h-4 bg-gradient-to-r ${item.color} rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200`}></div>
                <div className="flex items-center gap-2">
                  <item.Icon className="w-4 h-4 text-slate-700/80" />
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 