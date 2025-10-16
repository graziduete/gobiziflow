/**
 * Função utilitária para calcular o progresso real de um projeto
 * baseado no status das tasks
 */

export interface TaskForProgress {
  status: string
}

/**
 * Calcula o progresso de um projeto baseado no status das tasks
 * 
 * Regras:
 * - Cada task representa uma porcentagem igual do projeto
 * - Concluído/Concluído com Atraso = 100% da task
 * - Em Andamento = 50% da task
 * - Pausado/Atrasado = 25% da task
 * - Não Iniciado/Cancelado = 0% da task
 * 
 * @param tasks - Array de tasks do projeto
 * @returns Progresso em porcentagem (0-100)
 */
export function calculateProjectProgress(tasks: TaskForProgress[]): number {
  if (!tasks || tasks.length === 0) return 0
  
  const taskValue = 100 / tasks.length // Cada task vale X% do projeto
  let totalProgress = 0
  
  tasks.forEach(task => {
    const normalizedStatus = task.status.toLowerCase().trim()
    
    switch(normalizedStatus) {
      // Tasks concluídas = 100% do valor
      case 'completed':
      case 'concluído':
      case 'completed_delayed':
      case 'concluído com atraso':
        totalProgress += taskValue * 1.0
        break
      
      // Tasks em andamento = 50% do valor
      case 'in_progress':
      case 'em andamento':
        totalProgress += taskValue * 0.5
        break
      
      // Tasks pausadas ou atrasadas = 25% do valor
      case 'on_hold':
      case 'pausado':
      case 'delayed':
      case 'atrasado':
        totalProgress += taskValue * 0.25
        break
      
      // Tasks não iniciadas ou canceladas = 0%
      case 'not_started':
      case 'não iniciado':
      case 'cancelled':
      case 'cancelado':
      default:
        totalProgress += 0
        break
    }
  })
  
  return Math.round(totalProgress)
}

/**
 * Retorna uma descrição textual do progresso
 */
export function getProgressDescription(progress: number): string {
  if (progress === 0) return 'Não iniciado'
  if (progress < 25) return 'Iniciando'
  if (progress < 50) return 'Em desenvolvimento'
  if (progress < 75) return 'Em progresso'
  if (progress < 100) return 'Quase concluído'
  return 'Concluído'
}

/**
 * Retorna estatísticas detalhadas do progresso
 */
export function getProgressStats(tasks: TaskForProgress[]) {
  const total = tasks.length
  const completed = tasks.filter(t => 
    ['completed', 'concluído', 'completed_delayed', 'concluído com atraso']
      .includes(t.status.toLowerCase().trim())
  ).length
  const inProgress = tasks.filter(t => 
    ['in_progress', 'em andamento'].includes(t.status.toLowerCase().trim())
  ).length
  const notStarted = tasks.filter(t => 
    ['not_started', 'não iniciado'].includes(t.status.toLowerCase().trim())
  ).length
  const onHold = tasks.filter(t => 
    ['on_hold', 'pausado'].includes(t.status.toLowerCase().trim())
  ).length
  const delayed = tasks.filter(t => 
    ['delayed', 'atrasado'].includes(t.status.toLowerCase().trim())
  ).length
  
  return {
    total,
    completed,
    inProgress,
    notStarted,
    onHold,
    delayed,
    progress: calculateProjectProgress(tasks)
  }
}

