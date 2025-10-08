"use client"

import { useCallback } from 'react'
import * as domtoimage from 'dom-to-image'
import * as XLSX from 'xlsx'

interface DownloadOptions {
  format: 'png' | 'excel'
  filename?: string
}

export function useDREDownload() {
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

  // Função para capturar o DRE
  const captureDRE = useCallback(async (element: HTMLElement) => {
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
      console.error('Erro ao capturar DRE:', error)
      throw error
    }
  }, [])

  // Função para criar header
  const createHeader = useCallback(async (width: number, title: string = 'DRE - Demonstrativo de Resultados do Exercício') => {
    const headerCanvas = document.createElement('canvas')
    const headerHeight = 80
    headerCanvas.width = width
    headerCanvas.height = headerHeight
    
    const ctx = headerCanvas.getContext('2d')
    if (!ctx) throw new Error('Erro ao criar contexto do canvas')
    
    // Fundo branco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, headerHeight)
    
    // Logo
    try {
      const logo = await loadLogo()
      const logoHeight = 50
      const logoWidth = (logo.width * logoHeight) / logo.height
      ctx.drawImage(logo, 15, 8, logoWidth, logoHeight)
    } catch (logoError) {
      console.error('Erro ao adicionar logo:', logoError)
      // Fallback com texto
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('GobiZi', 15, 30)
      ctx.fillStyle = '#10b981'
      ctx.fillText('Flow', 60, 30)
    }
    
    // Título do DRE
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(title, width / 2, 35)
    
    // Data
    const currentDate = new Date().toLocaleDateString('pt-BR')
    ctx.fillStyle = '#64748b'
    ctx.font = '13px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`Gerado em: ${currentDate}`, width - 15, 60)
    
    return headerCanvas
  }, [loadLogo])

  // Função para exportar como PNG
  const downloadAsPNG = useCallback(async (
    elementId: string, 
    options: DownloadOptions = { format: 'png' }
  ) => {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Elemento do DRE não encontrado')
      }

      // Aguardar para garantir que todos os estilos sejam aplicados
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capturar DRE
      const dreCanvas = await captureDRE(element)
      
      const filename = options.filename || `dre-${new Date().toISOString().split('T')[0]}`
      
      // Criar canvas final
      const finalCanvas = document.createElement('canvas')
      const finalWidth = dreCanvas.width
      const finalHeight = dreCanvas.height + 80
      
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
      
      // DRE
      finalCtx.drawImage(dreCanvas, 0, 80, dreCanvas.width, dreCanvas.height)
      
      // Download
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = finalCanvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      return { success: true }
      
    } catch (error) {
      console.error('Erro ao fazer download do DRE como PNG:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }, [captureDRE, createHeader])

  // Função para exportar como Excel
  const downloadAsExcel = useCallback(async (
    dreData: any[],
    options: DownloadOptions = { format: 'excel' }
  ) => {
    try {
      const filename = options.filename || `dre-${new Date().toISOString().split('T')[0]}`

      // Preparar dados para Excel
      const excelData = dreData.map(item => {
        const row: any = {
          'Categoria / Grupo': item.name,
          'Janeiro': item.monthlyData[0]?.amount || 0,
          'Fevereiro': item.monthlyData[1]?.amount || 0,
          'Março': item.monthlyData[2]?.amount || 0,
          'Abril': item.monthlyData[3]?.amount || 0,
          'Maio': item.monthlyData[4]?.amount || 0,
          'Junho': item.monthlyData[5]?.amount || 0,
          'Julho': item.monthlyData[6]?.amount || 0,
          'Agosto': item.monthlyData[7]?.amount || 0,
          'Setembro': item.monthlyData[8]?.amount || 0,
          'Outubro': item.monthlyData[9]?.amount || 0,
          'Novembro': item.monthlyData[10]?.amount || 0,
          'Dezembro': item.monthlyData[11]?.amount || 0,
          'Total Anual': item.annualTotal || 0
        }
        return row
      })

      // Criar workbook
      const wb = XLSX.utils.book_new()
      
      // Criar worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Definir larguras das colunas
      const colWidths = [
        { wch: 40 }, // Categoria
        ...Array(12).fill({ wch: 12 }), // Meses
        { wch: 15 }  // Total
      ]
      ws['!cols'] = colWidths
      
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'DRE')
      
      // Download
      XLSX.writeFile(wb, `${filename}.xlsx`)
      
      return { success: true }
      
    } catch (error) {
      console.error('Erro ao fazer download do DRE como Excel:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }, [])

  return {
    downloadAsPNG,
    downloadAsExcel
  }
}

