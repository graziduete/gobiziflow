"use client"

import { useCallback } from 'react'
import * as domtoimage from 'dom-to-image'
import jsPDF from 'jspdf'

interface DownloadOptions {
  format: 'png' | 'pdf'
  filename?: string
}

export function useGanttDownload() {
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
      // Usar a mesma logo da tela de login
      img.src = '/gobizi-flow-logo.png'
    })
  }, [])

  // Função simples para capturar o cronograma
  const captureGantt = useCallback(async (element: HTMLElement) => {
    try {
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Erro ao criar contexto do canvas')

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise<HTMLCanvasElement>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          resolve(canvas)
        }
        img.onerror = reject
        img.src = dataUrl
      })

    } catch (error) {
      console.error('Erro ao capturar cronograma:', error)
      throw error
    }
  }, [])

  // Função para criar header simples
  const createHeader = useCallback(async (width: number) => {
    const headerCanvas = document.createElement('canvas')
    const headerHeight = 60
    headerCanvas.width = width
    headerCanvas.height = headerHeight
    
    const ctx = headerCanvas.getContext('2d')
    if (!ctx) throw new Error('Erro ao criar contexto do canvas')
    
    // Fundo branco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, headerHeight)
    
    // Logo original da GobiZi (mesma da tela de login)
    try {
      const logo = await loadLogo()
      console.log('Adicionando logo ao PNG:', logo.width, 'x', logo.height)
      
      // Calcular dimensões proporcionais corretas (baseadas na logo original)
      const logoHeight = 50
      const logoWidth = (logo.width * logoHeight) / logo.height // Proporção correta
      
      ctx.drawImage(logo, 15, 8, logoWidth, logoHeight)
      console.log('Logo adicionada ao PNG com sucesso - dimensões:', logoWidth, 'x', logoHeight)
    } catch (logoError) {
      console.error('Erro ao adicionar logo ao PNG:', logoError)
      // Fallback com texto estilizado
      ctx.fillStyle = '#3b82f6' // Azul
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('GobiZi', 15, 30)
      ctx.fillStyle = '#10b981' // Verde
      ctx.fillText('Flow', 60, 30)
    }
    
    // Data posicionada mais à direita
    const currentDate = new Date().toLocaleDateString('pt-BR')
    ctx.fillStyle = '#64748b'
    ctx.font = '13px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`Gerado em: ${currentDate}`, width - 15, 35)
    
    return headerCanvas
  }, [loadLogo])

  // Função principal de download
  const downloadAsImage = useCallback(async (
    elementId: string, 
    options: DownloadOptions = { format: 'png' }
  ) => {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Elemento do Gantt chart não encontrado')
      }

      // Capturar cronograma
      const ganttCanvas = await captureGantt(element)
      
      const filename = options.filename || `gantt-chart-${new Date().toISOString().split('T')[0]}`
      
      if (options.format === 'png') {
        // Criar canvas final
        const finalCanvas = document.createElement('canvas')
        const finalWidth = ganttCanvas.width
        const finalHeight = ganttCanvas.height + 60
        
        finalCanvas.width = finalWidth
        finalCanvas.height = finalHeight
        
        const finalCtx = finalCanvas.getContext('2d')
        if (!finalCtx) throw new Error('Erro ao criar contexto do canvas final')
        
        // Fundo branco
        finalCtx.fillStyle = '#ffffff'
        finalCtx.fillRect(0, 0, finalWidth, finalHeight)
        
        // Header
        const headerCanvas = await createHeader(finalWidth)
        finalCtx.drawImage(headerCanvas, 0, 0)
        
        // Cronograma
        finalCtx.drawImage(ganttCanvas, 0, 60, ganttCanvas.width, ganttCanvas.height)
        
        // Download
        const link = document.createElement('a')
        link.download = `${filename}.png`
        link.href = finalCanvas.toDataURL('image/png', 1.0)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        return { success: true }
        
      } else if (options.format === 'pdf') {
        // Criar PDF
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        })
        
        // Logo original da GobiZi (mesma da tela de login)
        try {
          const logo = await loadLogo()
          console.log('Adicionando logo ao PDF:', logo.width, 'x', logo.height)
          
          // Criar canvas temporário para converter logo para dataURL
          const logoCanvas = document.createElement('canvas')
          const logoCtx = logoCanvas.getContext('2d')
          if (!logoCtx) throw new Error('Erro ao criar contexto do canvas da logo')
          
          // Dimensões proporcionais da logo original (200x80)
          const logoCanvasWidth = 200
          const logoCanvasHeight = 80
          logoCanvas.width = logoCanvasWidth
          logoCanvas.height = logoCanvasHeight
          
          // Desenhar logo no canvas mantendo proporção original
          logoCtx.drawImage(logo, 0, 0, logoCanvasWidth, logoCanvasHeight)
          
          // Converter canvas para dataURL
          const logoDataUrl = logoCanvas.toDataURL('image/png', 1.0)
          
          // Dimensões para o PDF (proporção mantida) - Reduzidas para não atrapalhar o cronograma
          const logoWidth = 30 // mm
          const logoHeight = 12 // mm (proporção 2.5:1 mantida)
          
          // Adicionar logo ao PDF
          pdf.addImage(logoDataUrl, 'PNG', 15, 8, logoWidth, logoHeight)
          console.log('Logo adicionada ao PDF com sucesso')
        } catch (logoError) {
          console.error('Erro ao adicionar logo ao PDF:', logoError)
          // Fallback com texto estilizado
          pdf.setFontSize(16)
          pdf.setTextColor(59, 130, 246) // Azul
          pdf.text('GobiZi', 20, 18)
          pdf.setTextColor(16, 185, 129) // Verde
          pdf.text('Flow', 45, 18)
          pdf.setTextColor(0, 0, 0) // Volta ao preto
        }
        
        // Data posicionada mais à direita (ajustada para logo menor)
        const currentDate = new Date().toLocaleDateString('pt-BR')
        pdf.setFontSize(9)
        pdf.setTextColor(100, 116, 139) // Cinza
        pdf.text(`Gerado em: ${currentDate}`, 240, 18)
        
        // Cronograma
        const imgData = ganttCanvas.toDataURL('image/png', 1.0)
        const pageWidth = 280
        const pageHeight = 180
        const imgWidth = pageWidth - 20
        const imgHeight = (ganttCanvas.height * imgWidth) / ganttCanvas.width
        
        pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, Math.min(imgHeight, pageHeight - 30))
        
        // Download
        pdf.save(`${filename}.pdf`)
        
        return { success: true }
      }
      
      return { success: false, error: 'Formato não suportado' }
      
    } catch (error) {
      console.error('Erro ao fazer download do Gantt chart:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }, [captureGantt, createHeader])

  return {
    downloadAsImage
  }
}