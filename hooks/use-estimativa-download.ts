"use client"

import { useCallback } from 'react'
import jsPDF from 'jspdf'

interface EstimativaData {
  nome_projeto: string
  meses_previstos?: number
  status: string
  percentual_imposto: number
  observacoes?: string
  total_estimado?: number
  total_com_impostos?: number
  created_at: string
  tipo?: string
  valor_hora?: number
  percentual_gordura?: number
  profiles?: {
    full_name: string
    email: string
  }
}

interface RecursoEstimativa {
  id: string
  nome_recurso: string
  taxa_hora: number
  total_horas: number
  total_custo: number
  alocacoes: { semana: number; horas: number; custo_semanal: number }[]
}

interface TarefaEstimativa {
  id: string
  funcionalidade: string
  quantidade: number
  tecnologia_id: string
  complexidade_id: string
  tipo_tarefa_id: string
  fator_aplicado: number
  total_base: number
  total_com_gordura: number
  tecnologias?: { nome: string }
  complexidades?: { nome: string }
  tipos_tarefa?: { nome: string }
}

interface DownloadOptions {
  filename?: string
  clientVersion?: boolean // Nova opção para versão do cliente
}

export function useEstimativaDownload() {
  // Função para carregar logo
  const loadLogo = useCallback((): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        console.log('Logo carregada com sucesso:', img.width, 'x', img.height)
        resolve(img)
      }
      img.onerror = (error) => {
        console.error('Erro ao carregar logo:', error)
        reject(new Error('Erro ao carregar logo'))
      }
      img.src = '/gobizi-flow-logo.png'
    })
  }, [])

  // Função para formatar moeda
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }, [])

  // Função para formatar data
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Função para criar header do PDF
  const createPDFHeader = useCallback(async (pdf: jsPDF) => {
    try {
      const logo = await loadLogo()
      
      // Calcular proporção correta da logo (baseada na logo original)
      const logoAspectRatio = logo.width / logo.height
      const logoHeight = 15 // mm - menor
      const logoWidth = logoHeight * logoAspectRatio
      
      // Criar canvas temporário para converter logo para dataURL
      const logoCanvas = document.createElement('canvas')
      const logoCtx = logoCanvas.getContext('2d')
      if (!logoCtx) throw new Error('Erro ao criar contexto do canvas da logo')
      
      // Dimensões do canvas baseadas na proporção da logo
      logoCanvas.width = logo.width
      logoCanvas.height = logo.height
      
      // Desenhar logo no canvas mantendo proporção original
      logoCtx.drawImage(logo, 0, 0, logo.width, logo.height)
      
      // Converter canvas para dataURL
      const logoDataUrl = logoCanvas.toDataURL('image/png', 1.0)
      
      // Adicionar logo ao PDF com proporção correta
      pdf.addImage(logoDataUrl, 'PNG', 15, 12, logoWidth, logoHeight)
      
    } catch (logoError) {
      console.error('Erro ao adicionar logo ao PDF:', logoError)
      // Fallback com texto estilizado mais elegante
      pdf.setFontSize(18)
      pdf.setTextColor(59, 130, 246) // Azul
      pdf.text('GobiZi', 20, 20)
      pdf.setTextColor(16, 185, 129) // Verde
      pdf.text('Flow', 50, 20)
      pdf.setTextColor(0, 0, 0) // Volta ao preto
    }
    
    // Data de geração com estilo mais elegante
    const currentDate = new Date().toLocaleDateString('pt-BR')
    pdf.setFontSize(11)
    pdf.setTextColor(100, 116, 139) // Cinza
    pdf.text(`Gerado em: ${currentDate}`, 150, 20)
    
    // Linha decorativa
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(0.5)
    pdf.line(15, 35, 195, 35)
  }, [loadLogo])

  // Função para criar card de informações do projeto
  const createProjectInfo = useCallback((pdf: jsPDF, estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Card principal com sombra sutil
    pdf.setFillColor(255, 255, 255) // Branco
    pdf.setDrawColor(226, 232, 240) // Cinza claro
    pdf.setLineWidth(0.5)
    pdf.roundedRect(15, currentY, 180, 85, 3, 3, 'FD') // Fill + Draw com cantos arredondados
    
    // Título do card
    pdf.setFontSize(18)
    pdf.setTextColor(15, 23, 42) // Cinza escuro
    pdf.text('INFORMAÇÕES DO PROJETO', 25, currentY + 12)
    
    // Linha decorativa
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(1)
    pdf.line(25, currentY + 15, 50, currentY + 15)
    currentY += 25
    
    // Grid de informações em 2 colunas
    const leftCol = 25
    const rightCol = 105
    const rowHeight = 12
    
    // Nome do projeto (destaque)
    pdf.setFontSize(16)
    pdf.setTextColor(59, 130, 246) // Azul
    pdf.text('Nome do Projeto', leftCol, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(estimativa.nome_projeto, leftCol, currentY + 6)
    currentY += 15
    
    // Status com badge
    pdf.setFillColor(59, 130, 246)
    pdf.roundedRect(leftCol, currentY - 2, 40, 6, 2, 2, 'F')
    pdf.setFontSize(9)
    pdf.setTextColor(255, 255, 255)
    pdf.text(estimativa.status.replace('_', ' ').toUpperCase(), leftCol + 2, currentY + 2)
    
    // Duração
    pdf.setFontSize(11)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Duração:', rightCol, currentY)
    pdf.setTextColor(15, 23, 42)
    pdf.text(`${estimativa.meses_previstos} meses`, rightCol + 20, currentY)
    currentY += 10
    
    // Impostos
    pdf.setTextColor(100, 116, 139)
    pdf.text('Impostos:', rightCol, currentY)
    pdf.setTextColor(15, 23, 42)
    pdf.text(`${estimativa.percentual_imposto}%`, rightCol + 20, currentY)
    currentY += 10
    
    // Data de criação
    pdf.setTextColor(100, 116, 139)
    pdf.text('Criado em:', rightCol, currentY)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatDate(estimativa.created_at), rightCol + 20, currentY)
    currentY += 10
    
    // Criado por
    if (estimativa.profiles?.full_name) {
      pdf.setTextColor(100, 116, 139)
      pdf.text('Criado por:', rightCol, currentY)
      pdf.setTextColor(15, 23, 42)
      pdf.text(estimativa.profiles.full_name, rightCol + 20, currentY)
      currentY += 10
    }
    
    // Observações em card separado se existir
    if (estimativa.observacoes) {
      currentY += 5
      pdf.setFillColor(248, 250, 252) // Cinza muito claro
      pdf.setDrawColor(226, 232, 240)
      pdf.roundedRect(15, currentY, 180, 25, 3, 3, 'FD')
      
      pdf.setFontSize(11)
      pdf.setTextColor(100, 116, 139)
      pdf.text('Observações:', 25, currentY + 8)
      
      const maxWidth = 160
      const lines = pdf.splitTextToSize(estimativa.observacoes, maxWidth)
      pdf.setFontSize(10)
      pdf.setTextColor(15, 23, 42)
      lines.forEach((line: string, index: number) => {
        pdf.text(line, 25, currentY + 15 + (index * 4))
      })
      
      currentY += 30
    }
    
    return currentY + 20
  }, [formatDate])

  // Função para criar card de resumo financeiro
  const createFinancialSummary = useCallback((pdf: jsPDF, estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Card principal com gradiente sutil
    pdf.setFillColor(255, 255, 255) // Branco
    pdf.setDrawColor(16, 185, 129) // Verde
    pdf.setLineWidth(1)
    pdf.roundedRect(15, currentY, 180, 60, 3, 3, 'FD')
    
    // Título do card
    pdf.setFontSize(18)
    pdf.setTextColor(15, 23, 42)
    pdf.text('RESUMO FINANCEIRO', 25, currentY + 12)
    
    // Linha decorativa verde
    pdf.setDrawColor(16, 185, 129)
    pdf.setLineWidth(1)
    pdf.line(25, currentY + 15, 50, currentY + 15)
    currentY += 25
    
    // Subtotal
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Subtotal (sem impostos):', 25, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatCurrency(estimativa.total_estimado), 150, currentY)
    currentY += 12
    
    // Impostos
    const impostos = estimativa.total_estimado * estimativa.percentual_imposto / 100
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text(`Impostos (${estimativa.percentual_imposto}%):`, 25, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatCurrency(impostos), 150, currentY)
    currentY += 12
    
    // Linha separadora elegante
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.5)
    pdf.line(25, currentY, 170, currentY)
    currentY += 8
    
    // Total destacado
    pdf.setFillColor(16, 185, 129) // Verde
    pdf.roundedRect(15, currentY - 2, 180, 8, 2, 2, 'F')
    
    pdf.setFontSize(16)
    pdf.setTextColor(255, 255, 255) // Branco
    pdf.text('TOTAL GERAL:', 20, currentY + 4)
    pdf.text(formatCurrency(estimativa.total_com_impostos), 150, currentY + 4)
    
    return currentY + 20
  }, [formatCurrency])

  // Função para criar card de recursos
  const createResourcesSection = useCallback((pdf: jsPDF, recursos: RecursoEstimativa[], yPosition: number) => {
    let currentY = yPosition
    
    // Card principal
    pdf.setFillColor(255, 255, 255) // Branco
    pdf.setDrawColor(226, 232, 240) // Cinza claro
    pdf.setLineWidth(0.5)
    pdf.roundedRect(15, currentY, 180, 40 + (recursos.length * 12), 3, 3, 'FD')
    
    // Título do card
    pdf.setFontSize(18)
    pdf.setTextColor(15, 23, 42)
    pdf.text('RECURSOS DA ESTIMATIVA', 25, currentY + 12)
    
    // Linha decorativa
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(1)
    pdf.line(25, currentY + 15, 50, currentY + 15)
    currentY += 25
    
    if (recursos.length === 0) {
      pdf.setFontSize(12)
      pdf.setTextColor(100, 116, 139)
      pdf.text('Nenhum recurso encontrado', 25, currentY)
      return currentY + 20
    }
    
    // Cabeçalho da tabela moderno
    pdf.setFillColor(59, 130, 246) // Azul
    pdf.roundedRect(20, currentY, 170, 12, 2, 2, 'F')
    
    pdf.setFontSize(12)
    pdf.setTextColor(255, 255, 255) // Branco
    pdf.text('Recurso', 25, currentY + 8)
    pdf.text('Taxa/hora', 80, currentY + 8)
    pdf.text('Horas', 130, currentY + 8)
    pdf.text('Custo', 160, currentY + 8)
    
    currentY += 15
    
    // Dados dos recursos com design moderno
    recursos.forEach((recurso, index) => {
      // Alternar cor de fundo sutil
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252) // Cinza muito claro
        pdf.roundedRect(20, currentY - 2, 170, 10, 1, 1, 'F')
      }
      
      pdf.setFontSize(11)
      pdf.setTextColor(15, 23, 42)
      
      // Nome do recurso
      const nomeRecurso = recurso.nome_recurso.length > 25 
        ? recurso.nome_recurso.substring(0, 25) + '...'
        : recurso.nome_recurso
      pdf.text(nomeRecurso, 25, currentY + 6)
      
      // Taxa por hora
      pdf.setTextColor(100, 116, 139)
      pdf.text(formatCurrency(recurso.taxa_hora), 80, currentY + 6)
      
      // Total de horas
      pdf.setTextColor(15, 23, 42)
      pdf.text(`${recurso.total_horas.toFixed(1)}h`, 130, currentY + 6)
      
      // Total de custo (destaque)
      pdf.setTextColor(16, 185, 129) // Verde
      pdf.text(formatCurrency(recurso.total_custo), 160, currentY + 6)
      
      currentY += 12
    })
    
    return currentY + 20
  }, [formatCurrency])

  // Função para criar card de tarefas
  const createTasksSection = useCallback((pdf: jsPDF, tarefas: TarefaEstimativa[], estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Card principal
    pdf.setFillColor(255, 255, 255) // Branco
    pdf.setDrawColor(226, 232, 240) // Cinza claro
    pdf.setLineWidth(0.5)
    pdf.roundedRect(15, currentY, 180, 40 + (tarefas.length * 12), 3, 3, 'FD')
    
    // Título do card
    pdf.setFontSize(18)
    pdf.setTextColor(15, 23, 42)
    pdf.text('TAREFAS DO PROJETO', 25, currentY + 12)
    
    // Linha decorativa
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(1)
    pdf.line(25, currentY + 15, 50, currentY + 15)
    currentY += 25
    
    if (tarefas.length === 0) {
      pdf.setFontSize(12)
      pdf.setTextColor(100, 116, 139)
      pdf.text('Nenhuma tarefa encontrada', 25, currentY)
      return currentY + 20
    }
    
    // Cabeçalho da tabela moderno
    pdf.setFillColor(59, 130, 246) // Azul
    pdf.roundedRect(20, currentY, 170, 12, 2, 2, 'F')
    
    pdf.setFontSize(10)
    pdf.setTextColor(255, 255, 255) // Branco
    pdf.text('Funcionalidade', 25, currentY + 8)
    pdf.text('Qtd', 80, currentY + 8)
    pdf.text('Tecnologia', 95, currentY + 8)
    pdf.text('Complex.', 130, currentY + 8)
    pdf.text('Tipo', 150, currentY + 8)
    pdf.text('Fator', 165, currentY + 8)
    
    currentY += 15
    
    // Dados das tarefas com design moderno
    tarefas.forEach((tarefa, index) => {
      // Alternar cor de fundo sutil
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252) // Cinza muito claro
        pdf.roundedRect(20, currentY - 2, 170, 10, 1, 1, 'F')
      }
      
      pdf.setFontSize(9)
      pdf.setTextColor(15, 23, 42)
      
      // Funcionalidade (truncar se muito longa)
      const funcionalidade = tarefa.funcionalidade.length > 20 
        ? tarefa.funcionalidade.substring(0, 20) + '...'
        : tarefa.funcionalidade
      pdf.text(funcionalidade, 25, currentY + 6)
      
      // Quantidade
      pdf.text(tarefa.quantidade.toString(), 80, currentY + 6)
      
      // Tecnologia
      const tecnologia = tarefa.tecnologias?.nome || tarefa.tecnologia_id
      const tecnologiaNome = tecnologia.length > 8 
        ? tecnologia.substring(0, 8) + '...'
        : tecnologia
      pdf.text(tecnologiaNome, 95, currentY + 6)
      
      // Complexidade
      const complexidade = tarefa.complexidades?.nome || tarefa.complexidade_id
      const complexidadeNome = complexidade.length > 6 
        ? complexidade.substring(0, 6) + '...'
        : complexidade
      pdf.text(complexidadeNome, 130, currentY + 6)
      
      // Tipo
      const tipo = tarefa.tipos_tarefa?.nome || tarefa.tipo_tarefa_id
      const tipoNome = tipo.length > 6 
        ? tipo.substring(0, 6) + '...'
        : tipo
      pdf.text(tipoNome, 150, currentY + 6)
      
      // Fator
      pdf.text(tarefa.fator_aplicado.toString(), 165, currentY + 6)
      
      currentY += 12
    })
    
    return currentY + 20
  }, [])


  // Função para criar resumo de tarefas
  const createTasksSummary = useCallback((pdf: jsPDF, tarefas: TarefaEstimativa[], estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Calcular totais
    const totalObjetos = tarefas.reduce((sum, t) => sum + t.quantidade, 0)
    const totalHoras = tarefas.reduce((sum, t) => sum + t.total_com_gordura, 0)
    const subtotalHoras = tarefas.reduce((sum, t) => sum + t.total_base, 0)
    const totalEstimado = tarefas.reduce((sum, t) => sum + (t.total_com_gordura * (estimativa.valor_hora || 0)), 0)
    const impostos = totalEstimado * estimativa.percentual_imposto / 100
    const totalComImpostos = totalEstimado + impostos
    
    // Card principal com gradiente sutil
    pdf.setFillColor(255, 255, 255) // Branco
    pdf.setDrawColor(16, 185, 129) // Verde
    pdf.setLineWidth(1)
    pdf.roundedRect(15, currentY, 180, 80, 3, 3, 'FD')
    
    // Título do card
    pdf.setFontSize(18)
    pdf.setTextColor(15, 23, 42)
    pdf.text('RESUMO DA ESTIMATIVA', 25, currentY + 12)
    
    // Linha decorativa verde
    pdf.setDrawColor(16, 185, 129)
    pdf.setLineWidth(1)
    pdf.line(25, currentY + 15, 50, currentY + 15)
    currentY += 25
    
    // Métricas de horas
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Total Base:', 25, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(59, 130, 246) // Azul
    pdf.text(`${subtotalHoras.toFixed(1)}h`, 150, currentY)
    currentY += 12
    
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text(`Com Gordura (${estimativa.percentual_gordura || 0}%):`, 25, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(16, 185, 129) // Verde
    pdf.text(`${totalHoras.toFixed(1)}h`, 150, currentY)
    currentY += 12
    
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Valor Hora:', 25, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatCurrency(estimativa.valor_hora || 0), 150, currentY)
    currentY += 15
    
    // Linha separadora
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.5)
    pdf.line(25, currentY, 170, currentY)
    currentY += 8
    
    // Resumo financeiro
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Subtotal:', 25, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatCurrency(totalEstimado), 150, currentY)
    currentY += 12
    
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text(`Impostos (${estimativa.percentual_imposto}%):`, 25, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatCurrency(impostos), 150, currentY)
    currentY += 12
    
    // Total destacado
    pdf.setFillColor(16, 185, 129) // Verde
    pdf.roundedRect(15, currentY - 2, 180, 8, 2, 2, 'F')
    
    pdf.setFontSize(16)
    pdf.setTextColor(255, 255, 255) // Branco
    pdf.text('TOTAL GERAL:', 20, currentY + 4)
    pdf.text(formatCurrency(totalComImpostos), 150, currentY + 4)
    
    return currentY + 20
  }, [formatCurrency])


  // Função para criar informações do projeto para tarefas
  const createProjectInfoTarefas = useCallback((pdf: jsPDF, estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Card principal com sombra sutil
    pdf.setFillColor(255, 255, 255) // Branco
    pdf.setDrawColor(226, 232, 240) // Cinza claro
    pdf.setLineWidth(0.5)
    pdf.roundedRect(15, currentY, 180, 70, 3, 3, 'FD') // Fill + Draw com cantos arredondados
    
    // Título do card
    pdf.setFontSize(18)
    pdf.setTextColor(15, 23, 42) // Cinza escuro
    pdf.text('INFORMAÇÕES DO PROJETO', 25, currentY + 12)
    
    // Linha decorativa
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(1)
    pdf.line(25, currentY + 15, 50, currentY + 15)
    currentY += 25
    
    // Grid de informações em 2 colunas
    const leftCol = 25
    const rightCol = 105
    const rowHeight = 12
    
    // Nome do projeto (destaque)
    pdf.setFontSize(16)
    pdf.setTextColor(59, 130, 246) // Azul
    pdf.text('Nome do Projeto', leftCol, currentY)
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(estimativa.nome_projeto, leftCol, currentY + 6)
    currentY += 15
    
    // Status com badge
    pdf.setFillColor(59, 130, 246)
    pdf.roundedRect(leftCol, currentY - 2, 40, 6, 2, 2, 'F')
    pdf.setFontSize(9)
    pdf.setTextColor(255, 255, 255)
    pdf.text(estimativa.status.replace('_', ' ').toUpperCase(), leftCol + 2, currentY + 2)
    
    // Valor Hora
    pdf.setFontSize(11)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Valor Hora:', rightCol, currentY)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatCurrency(estimativa.valor_hora || 0), rightCol + 20, currentY)
    currentY += 10
    
    // Gordura
    pdf.setTextColor(100, 116, 139)
    pdf.text('Gordura:', rightCol, currentY)
    pdf.setTextColor(15, 23, 42)
    pdf.text(`${estimativa.percentual_gordura || 0}%`, rightCol + 20, currentY)
    currentY += 10
    
    // Data de criação
    pdf.setTextColor(100, 116, 139)
    pdf.text('Criado em:', rightCol, currentY)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatDate(estimativa.created_at), rightCol + 20, currentY)
    currentY += 10
    
    // Criado por
    if (estimativa.profiles?.full_name) {
      pdf.setTextColor(100, 116, 139)
      pdf.text('Criado por:', rightCol, currentY)
      pdf.setTextColor(15, 23, 42)
      pdf.text(estimativa.profiles.full_name, rightCol + 20, currentY)
      currentY += 10
    }
    
    // Observações em card separado se existir
    if (estimativa.observacoes) {
      currentY += 5
      pdf.setFillColor(248, 250, 252) // Cinza muito claro
      pdf.setDrawColor(226, 232, 240)
      pdf.roundedRect(15, currentY, 180, 25, 3, 3, 'FD')
      
      pdf.setFontSize(11)
      pdf.setTextColor(100, 116, 139)
      pdf.text('Observações:', 25, currentY + 8)
      
      const maxWidth = 160
      const lines = pdf.splitTextToSize(estimativa.observacoes, maxWidth)
      pdf.setFontSize(10)
      pdf.setTextColor(15, 23, 42)
      lines.forEach((line: string, index: number) => {
        pdf.text(line, 25, currentY + 15 + (index * 4))
      })
      
      currentY += 30
    }
    
    return currentY + 20
  }, [formatDate])

  // Função para criar informações do projeto para tarefas (versão cliente)
  const createProjectInfoTarefasCliente = useCallback((pdf: jsPDF, estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Card principal compacto
    pdf.setFillColor(255, 255, 255)
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(15, currentY, 260, 25, 3, 3, 'FD')
    
    // Título compacto
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text('INFORMAÇÕES DO PROJETO', 20, currentY + 8)
    
    // Linha decorativa
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(1)
    pdf.line(20, currentY + 10, 45, currentY + 10)
    currentY += 15
    
    // Layout horizontal compacto
    const leftCol = 20
    const middleCol = 120
    const rightCol = 200
    
    // Nome do projeto
    pdf.setFontSize(12)
    pdf.setTextColor(59, 130, 246)
    pdf.text('Projeto:', leftCol, currentY)
    pdf.setFontSize(11)
    pdf.setTextColor(15, 23, 42)
    pdf.text(estimativa.nome_projeto, leftCol + 20, currentY)
    
    // Status
    pdf.setFillColor(59, 130, 246)
    pdf.roundedRect(middleCol, currentY - 3, 35, 6, 2, 2, 'F')
    pdf.setFontSize(8)
    pdf.setTextColor(255, 255, 255)
    pdf.text(estimativa.status.replace('_', ' ').toUpperCase(), middleCol + 2, currentY + 1)
    
    // Data
    pdf.setFontSize(9)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Criado em:', rightCol, currentY)
    pdf.setTextColor(15, 23, 42)
    pdf.text(formatDate(estimativa.created_at), rightCol + 20, currentY)
    
    return currentY + 5
  }, [formatDate])

  // Função para criar card de tarefas (versão cliente)
  const createTasksSectionCliente = useCallback((pdf: jsPDF, tarefas: TarefaEstimativa[], estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Card principal compacto
    pdf.setFillColor(255, 255, 255)
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.5)
    const cardHeight = 20 + (tarefas.length * 7) + 8 // 20 (título) + (tarefas * 7) + 8 (margem)
    pdf.roundedRect(15, currentY, 260, cardHeight, 3, 3, 'FD')
    
    // Título compacto
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text('FUNCIONALIDADES DO PROJETO', 20, currentY + 8)
    
    // Linha decorativa
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(1)
    pdf.line(20, currentY + 10, 45, currentY + 10)
    currentY += 15
    
    if (tarefas.length === 0) {
      pdf.setFontSize(10)
      pdf.setTextColor(100, 116, 139)
      pdf.text('Nenhuma funcionalidade encontrada', 20, currentY)
      return currentY + 15
    }
    
    // Cabeçalho da tabela compacto
    pdf.setFillColor(59, 130, 246)
    pdf.roundedRect(20, currentY, 250, 8, 2, 2, 'F')
    
    pdf.setFontSize(10)
    pdf.setTextColor(255, 255, 255)
    pdf.text('Funcionalidade', 25, currentY + 5)
    pdf.text('Estimativa', 150, currentY + 5)
    pdf.text('Valor', 220, currentY + 5)
    
    currentY += 10
    
    // Dados das tarefas compactos
    tarefas.forEach((tarefa, index) => {
      // Alternar cor de fundo
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(20, currentY - 1, 250, 6, 1, 1, 'F')
      }
      
      pdf.setFontSize(9)
      pdf.setTextColor(15, 23, 42)
      
      // Funcionalidade (limitada)
      const funcionalidade = tarefa.funcionalidade.length > 50 
        ? tarefa.funcionalidade.substring(0, 50) + '...'
        : tarefa.funcionalidade
      pdf.text(funcionalidade, 25, currentY + 3)
      
      // Estimativa
      pdf.setTextColor(16, 185, 129)
      pdf.text(`${tarefa.total_com_gordura.toFixed(1)}h`, 150, currentY + 3)
      
      // Valor
      const valorTotal = tarefa.total_com_gordura * (estimativa.valor_hora || 0)
      pdf.setTextColor(15, 23, 42)
      pdf.text(formatCurrency(valorTotal), 220, currentY + 3)
      
      currentY += 7
    })
    
    return currentY + 5
  }, [formatCurrency])

  // Função para criar resumo de tarefas (versão cliente)
  const createTasksSummaryCliente = useCallback((pdf: jsPDF, tarefas: TarefaEstimativa[], estimativa: EstimativaData, yPosition: number) => {
    let currentY = yPosition
    
    // Calcular totais
    const totalHoras = tarefas.reduce((sum, t) => sum + t.total_com_gordura, 0)
    const totalEstimado = tarefas.reduce((sum, t) => sum + (t.total_com_gordura * (estimativa.valor_hora || 0)), 0)
    const impostos = totalEstimado * estimativa.percentual_imposto / 100
    const totalComImpostos = totalEstimado + impostos
    
    // Card principal compacto
    pdf.setFillColor(255, 255, 255)
    pdf.setDrawColor(16, 185, 129)
    pdf.setLineWidth(1)
    pdf.roundedRect(15, currentY, 260, 25, 3, 3, 'FD')
    
    // Título compacto
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text('RESUMO DA ESTIMATIVA', 20, currentY + 8)
    
    // Linha decorativa
    pdf.setDrawColor(16, 185, 129)
    pdf.setLineWidth(1)
    pdf.line(20, currentY + 10, 45, currentY + 10)
    currentY += 15
    
    // Layout simplificado - apenas total geral
    const leftCol = 20
    const rightCol = 200
    
    // Estimativa total (horas)
    pdf.setFontSize(12)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Estimativa Total:', leftCol, currentY)
    pdf.setTextColor(16, 185, 129)
    pdf.text(`${totalHoras.toFixed(1)}h`, leftCol + 30, currentY)
    
    currentY += 8
    
    // Total geral destacado
    pdf.setFillColor(16, 185, 129)
    pdf.roundedRect(15, currentY - 2, 260, 8, 2, 2, 'F')
    
    pdf.setFontSize(14)
    pdf.setTextColor(255, 255, 255)
    pdf.text('TOTAL GERAL:', 20, currentY + 4)
    pdf.text(formatCurrency(totalComImpostos), 200, currentY + 4)
    
    return currentY + 5
  }, [formatCurrency])


  // Função para download de PDF de tarefas
  const downloadTarefasPDF = useCallback(async (
    estimativa: EstimativaData,
    tarefas: TarefaEstimativa[],
    options: DownloadOptions = {}
  ) => {
    try {
      // Criar PDF
      const pdf = new jsPDF({
        orientation: options.clientVersion ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Header
      await createPDFHeader(pdf)
      
      let currentY = options.clientVersion ? 25 : 45
      
      // Informações do projeto (adaptado para tarefas)
      if (options.clientVersion) {
        currentY = createProjectInfoTarefasCliente(pdf, estimativa, currentY)
      } else {
        currentY = createProjectInfoTarefas(pdf, estimativa, currentY)
      }
      
      // Tarefas
      if (options.clientVersion) {
        currentY = createTasksSectionCliente(pdf, tarefas, estimativa, currentY)
      } else {
        currentY = createTasksSection(pdf, tarefas, estimativa, currentY)
      }
      
      // Verificar se precisa de nova página antes do resumo
      const maxHeight = options.clientVersion ? 140 : 180
      if (currentY > maxHeight) {
        pdf.addPage()
        currentY = 25
      }
      
      // Resumo da estimativa
      if (options.clientVersion) {
        currentY = createTasksSummaryCliente(pdf, tarefas, estimativa, currentY)
      } else {
        currentY = createTasksSummary(pdf, tarefas, estimativa, currentY)
      }
      
      // Footer elegante em todas as páginas
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        
        // Linha decorativa
        pdf.setDrawColor(226, 232, 240)
        pdf.setLineWidth(0.5)
        const lineY = options.clientVersion ? 180 : 280
        const lineEndX = options.clientVersion ? 280 : 195
        pdf.line(15, lineY, lineEndX, lineY)
        
        // Footer com design moderno
        pdf.setFontSize(8)
        pdf.setTextColor(100, 116, 139)
        const footerY = options.clientVersion ? 185 : 285
        pdf.text('Este documento foi gerado automaticamente pelo sistema GobiZi Flow', 15, footerY)
        
        // Número da página com estilo
        pdf.setFillColor(59, 130, 246)
        const pageRectY = options.clientVersion ? 175 : 275
        const pageRectX = options.clientVersion ? 240 : 150
        pdf.roundedRect(pageRectX, pageRectY, 40, 8, 2, 2, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(8)
        const pageTextY = options.clientVersion ? 180 : 280
        const pageTextX = options.clientVersion ? 245 : 155
        pdf.text(`Página ${i} de ${pageCount}`, pageTextX, pageTextY)
      }
      
      // Download
      const filename = options.filename || 
        (options.clientVersion 
          ? `proposta-comercial-${estimativa.nome_projeto.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`
          : `estimativa-tarefas-${estimativa.nome_projeto.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`
        )
      pdf.save(`${filename}.pdf`)
      
      return { success: true }
      
    } catch (error) {
      console.error('Erro ao gerar PDF da estimativa de tarefas:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }, [createPDFHeader, createProjectInfoTarefas, createProjectInfoTarefasCliente, createTasksSection, createTasksSectionCliente, createTasksSummary, createTasksSummaryCliente])

  // Função principal de download (recursos)
  const downloadEstimativaPDF = useCallback(async (
    estimativa: EstimativaData,
    recursos: RecursoEstimativa[],
    options: DownloadOptions = {}
  ) => {
    try {
      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Header
      await createPDFHeader(pdf)
      
      let currentY = 45
      
      // Informações do projeto
      currentY = createProjectInfo(pdf, estimativa, currentY)
      
      // Resumo financeiro
      currentY = createFinancialSummary(pdf, estimativa, currentY)
      
      // Verificar se precisa de nova página antes dos recursos
      if (currentY > 180) {
        pdf.addPage()
        currentY = 25
      }
      
      // Recursos
      currentY = createResourcesSection(pdf, recursos, currentY)
      
      // Footer elegante em todas as páginas
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        
        // Linha decorativa
        pdf.setDrawColor(226, 232, 240)
        pdf.setLineWidth(0.5)
        pdf.line(15, 280, 195, 280)
        
        // Footer com design moderno
        pdf.setFontSize(9)
        pdf.setTextColor(100, 116, 139)
        pdf.text('Este documento foi gerado automaticamente pelo sistema GobiZi Flow', 15, 285)
        
        // Número da página com estilo
        pdf.setFillColor(59, 130, 246)
        pdf.roundedRect(150, 275, 40, 8, 2, 2, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(8)
        pdf.text(`Página ${i} de ${pageCount}`, 155, 280)
      }
      
      // Download
      const filename = options.filename || `estimativa-${estimativa.nome_projeto.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`
      pdf.save(`${filename}.pdf`)
      
      return { success: true }
      
    } catch (error) {
      console.error('Erro ao gerar PDF da estimativa:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }, [createPDFHeader, createProjectInfo, createFinancialSummary, createResourcesSection])

  return {
    downloadEstimativaPDF,
    downloadTarefasPDF
  }
}
