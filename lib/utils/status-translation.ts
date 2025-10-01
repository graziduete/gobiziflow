/**
 * Traduz códigos de status do inglês para português
 */
export function translateStatus(status: string): string {
  const translations: { [key: string]: string } = {
    // Status de projetos
    'planning': 'Planejamento',
    'not_started': 'Não Iniciado',
    'in_progress': 'Em Andamento',
    'homologation': 'Homologação',
    'on_hold': 'Pausado',
    'delayed': 'Atrasado',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'commercial_proposal': 'Proposta Comercial',
    
    // Status de tarefas
    'todo': 'A Fazer',
    'review': 'Em Revisão',
  }
  
  return translations[status] || status
}

/**
 * Traduz uma mensagem de notificação substituindo status em inglês por português
 */
export function translateNotificationMessage(message: string): string {
  if (!message) return message
  
  // Padrão: "De: status_old Para: status_new"
  const pattern = /De:\s*(\w+)\s*Para:\s*(\w+)/i
  const match = message.match(pattern)
  
  if (match) {
    const [, oldStatus, newStatus] = match
    const translatedOld = translateStatus(oldStatus)
    const translatedNew = translateStatus(newStatus)
    return message.replace(pattern, `De: ${translatedOld} Para: ${translatedNew}`)
  }
  
  // Se não encontrar o padrão, retorna a mensagem original
  return message
}

/**
 * Formata uma data considerando o timezone do Brasil (UTC-3)
 * Tratamento especial para datas no formato YYYY-MM-DD que vêm do banco
 */
export function formatDateBrazil(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Se a data está no formato YYYY-MM-DD (sem hora), interpretar como UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Adicionar 'T00:00:00' para forçar interpretação como UTC
      const dateUTC = new Date(dateString + 'T00:00:00Z')
      
      if (isNaN(dateUTC.getTime())) {
        return ''
      }
      
      // Formatar usando o timezone UTC para evitar conversão automática
      return new Intl.DateTimeFormat('pt-BR', { 
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(dateUTC)
    }
    
    // Para outros formatos de data (com hora/timestamp)
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      return ''
    }
    
    // Ajustar para timezone do Brasil (UTC-3)
    const brazilOffset = -3 * 60 // UTC-3 em minutos
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
    const brazilTime = new Date(utc + (brazilOffset * 60000))
    
    return brazilTime.toLocaleDateString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return ''
  }
}
