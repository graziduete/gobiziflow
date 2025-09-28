"use client"

import { useCallback } from 'react'
import jsPDF from 'jspdf'

interface EstimativaData {
  nome_projeto: string
  meses_previstos: number
  status: string
  percentual_imposto: number
  observacoes?: string
  total_estimado: number
  total_com_impostos: number
  created_at: string
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

interface DownloadOptions {
  filename?: string
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

  // Função principal de download
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
    downloadEstimativaPDF
  }
}
