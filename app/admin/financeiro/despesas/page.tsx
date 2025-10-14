"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import useDebounce from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModernLoading } from "@/components/ui/modern-loading"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDREDownload } from "@/hooks/use-dre-download"
import { 
  FileText, 
  Plus, 
  Building2, 
  Laptop, 
  Car, 
  Briefcase, 
  Receipt,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Banknote,
  Folder,
  DollarSign,
  ChevronDown,
  ChevronRight,
  // Ícones para categorias específicas
  Calculator,
  Plane,
  Monitor,
  Megaphone,
  CreditCard,
  Users,
  Wrench,
  FileSpreadsheet,
  ClipboardList,
  Gift,
  Cog,
  Shield,
  Zap,
  Settings,
  ArrowLeft,
  FileImage
} from "lucide-react"
import Link from "next/link"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

// Interfaces para os dados do banco
interface Category {
  id: string
  name: string
  description: string
  color: string
  icon: string
  order_index: number
  is_active: boolean
  expense_subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  category_id: string
  name: string
  description: string
  is_active: boolean
}

interface ExpenseEntry {
  id: string
  subcategory_id: string
  year: number
  month: number
  amount: number
  is_projection: boolean
  expense_subcategories: Subcategory & {
    expense_categories: {
      name: string
      color: string
      icon: string
    }
  }
}

const months = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
]

// Interface para os dados de despesas
interface ExpenseData {
  [categoryKey: string]: {
    [subcategory: string]: {
      [month: string]: number
    }
  }
}

export default function DespesasPage() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState<{
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const debouncedEditValue = useDebounce(editValue, 800) // 800ms de delay
  const [loading, setLoading] = useState(true)
  const [lastLoadTime, setLastLoadTime] = useState<number>(0)
  // Controle de categorias e subcategorias ocultas no relatório
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<Set<string>>(new Set())
  const [hiddenSubcategoryIds, setHiddenSubcategoryIds] = useState<Set<string>>(new Set())
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Hook para download
  const { downloadAsPNG: downloadPNG, downloadAsExcel: downloadExcel } = useDREDownload()

  // Funções específicas para despesas
  const handleDownloadPNG = async () => {
    if (expenseEntries.length === 0) {
      alert('Não há despesas para exportar.')
      return
    }
    
    setIsDownloading(true)
    try {
      await downloadPNG('expenses-table', { 
        format: 'png', 
        filename: `despesas-${selectedYear}-${new Date().toISOString().split('T')[0]}` 
      })
    } catch (error) {
      console.error('Erro ao fazer download PNG:', error)
      alert('Erro ao gerar imagem. Tente novamente.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (expenseEntries.length === 0) {
      alert('Não há despesas para exportar.')
      return
    }
    
    setIsDownloading(true)
    try {
      // Preparar dados no formato do DRE para reutilizar a função
      const expensesData = categories.map(category => {
        // Dados da categoria principal
        const categoryMonthlyData = Array.from({ length: 12 }, (_, index) => {
          const month = (index + 1).toString()
          return {
            month: index + 1,
            amount: getCategoryMonthTotal(category.id, month)
          }
        })
        
        const categoryAnnualTotal = categoryMonthlyData.reduce((sum, month) => sum + month.amount, 0)
        
        // Dados das subcategorias
        const categorySubcategories = category.expense_subcategories
        const subcategoriesData = categorySubcategories.map(subcategory => {
          const subcategoryMonthlyData = Array.from({ length: 12 }, (_, index) => {
            const month = (index + 1).toString()
            return {
              month: index + 1,
              amount: getSubcategoryTotal(subcategory.id, month)
            }
          })
          
          const subcategoryAnnualTotal = subcategoryMonthlyData.reduce((sum, month) => sum + month.amount, 0)
          
          return {
            name: `  ${subcategory.name}`, // Indentação para mostrar hierarquia
            monthlyData: subcategoryMonthlyData,
            annualTotal: subcategoryAnnualTotal
          }
        })
        
        return {
          name: category.name,
          monthlyData: categoryMonthlyData,
          annualTotal: categoryAnnualTotal,
          subcategories: subcategoriesData
        }
      })

      // Achatar os dados para incluir categorias e subcategorias
      const flattenedData = expensesData.flatMap(category => [
        {
          name: category.name,
          monthlyData: category.monthlyData,
          annualTotal: category.annualTotal
        },
        ...category.subcategories
      ])

      await downloadExcel(flattenedData, { 
        format: 'excel', 
        filename: `despesas-${selectedYear}-${new Date().toISOString().split('T')[0]}` 
      })
    } catch (error) {
      console.error('Erro ao fazer download Excel:', error)
      alert('Erro ao gerar planilha. Tente novamente.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Função para obter o componente de ícone
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      // Ícones genéricos
      Building2,
      Laptop,
      Car,
      Briefcase,
      Receipt,
      Banknote,
      Folder,
      FileText,
      DollarSign,
      // Ícones para categorias específicas
      Calculator,
      Plane,
      Monitor,
      Megaphone,
      CreditCard,
      Users,
      Wrench,
      FileSpreadsheet,
      ClipboardList,
      Gift,
      Cog,
      Shield,
      Zap,
      Settings
    }
    return iconMap[iconName] || Folder
  }

  // Função para obter a classe de cor da categoria
  const getCategoryColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-400',
      'green': 'bg-green-400',
      'red': 'bg-red-400',
      'purple': 'bg-purple-400',
      'orange': 'bg-orange-400',
      'yellow': 'bg-yellow-400',
      'pink': 'bg-pink-400',
      'indigo': 'bg-indigo-400',
      'cyan': 'bg-cyan-400',
      'emerald': 'bg-emerald-400',
      'lime': 'bg-lime-400',
      'amber': 'bg-amber-400',
      'rose': 'bg-rose-400',
      'violet': 'bg-violet-400',
      'fuchsia': 'bg-fuchsia-400',
      'teal': 'bg-teal-400'
    }
    return colorMap[color] || 'bg-slate-400'
  }

  // Verificar se uma categoria tem qualquer valor lançado
  const hasCategoryValues = (categoryId: string): boolean => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return false
    return category.expense_subcategories.some(sub => hasSubcategoryValues(sub.id))
  }

  // Verificar se uma categoria tem subcategorias ativas (não ocultas)
  const hasActiveSubcategories = (categoryId: string): boolean => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return false
    return category.expense_subcategories.some(sub => !hiddenSubcategoryIds.has(sub.id))
  }

  // Verificar se uma categoria deve aparecer no modal (está oculta OU não tem subcategorias ativas)
  const shouldShowInModal = (categoryId: string): boolean => {
    return hiddenCategoryIds.has(categoryId) || !hasActiveSubcategories(categoryId)
  }

  // Verificar se uma subcategoria deve aparecer no modal (está oculta)
  const shouldShowSubcategoryInModal = (subcategoryId: string): boolean => {
    return hiddenSubcategoryIds.has(subcategoryId)
  }

  // Verificar se uma categoria tem subcategorias excluídas (estava no relatório mas perdeu subcategorias)
  const hasExcludedSubcategories = (categoryId: string): boolean => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return false
    
    // Se a categoria não está oculta mas não tem subcategorias ativas,
    // significa que as subcategorias foram excluídas da tabela
    return !hiddenCategoryIds.has(categoryId) && !hasActiveSubcategories(categoryId)
  }

  // Contar categorias e subcategorias que precisam de atenção
  const getCategoriesNeedingAttention = () => {
    const hiddenCategories = categories.filter(cat => shouldShowInModal(cat.id)).length
    const hiddenSubcategories = categories
      .flatMap(cat => cat.expense_subcategories)
      .filter(sub => shouldShowSubcategoryInModal(sub.id)).length
    return hiddenCategories + hiddenSubcategories
  }

  // Remover categoria do relatório (apenas oculta, não apaga do banco)
  const removeCategoryFromReport = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    if (hasCategoryValues(categoryId)) {
      showConfirmation({
        title: "Não é possível remover",
        description: "Não é possível remover do relatório uma categoria com valores lançados.",
        confirmText: "Entendi",
        cancelText: "",
        variant: "default",
        onConfirm: () => {}
      })
      return
    }

    showConfirmation({
      title: "Remover do Relatório",
      description: `Tem certeza que deseja remover a categoria "${category.name}" do relatório de despesas?\n\nA categoria não será excluída do sistema, apenas ocultada desta visualização.`,
      confirmText: "Remover",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: () => {
        const next = new Set(hiddenCategoryIds)
        next.add(categoryId)
        setHiddenCategoryIds(next)
        try {
          localStorage.setItem('expense_report_hidden_categories', JSON.stringify(Array.from(next)))
        } catch {}
      }
    })
  }

  // Re-adicionar categoria ao relatório
  const addCategoryToReport = (categoryId: string) => {
    const next = new Set(hiddenCategoryIds)
    next.delete(categoryId)
    setHiddenCategoryIds(next)
    try {
      localStorage.setItem('expense_report_hidden_categories', JSON.stringify(Array.from(next)))
    } catch {}
  }

  // Re-adicionar subcategoria ao relatório
  const addSubcategoryToReport = (subcategoryId: string) => {
    const next = new Set(hiddenSubcategoryIds)
    next.delete(subcategoryId)
    setHiddenSubcategoryIds(next)
    try {
      localStorage.setItem('expense_report_hidden_subcategories', JSON.stringify(Array.from(next)))
    } catch {}
  }

  // Função para buscar categorias do banco
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/financeiro/categories')
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  // Função para buscar entradas de despesas do banco
  const fetchExpenseEntries = async () => {
    try {
      console.log('Buscando entradas para o ano:', selectedYear)
      const response = await fetch(`/api/financeiro/entries?year=${selectedYear}`)
      const data = await response.json()
      console.log('Entradas carregadas:', data.entries)
      if (data.entries) {
        setExpenseEntries(data.entries)
      }
    } catch (error) {
      console.error('Erro ao buscar entradas:', error)
    }
  }

  // Função otimizada para recarregar dados (com cache de 5 segundos)
  const refreshData = async (force = false) => {
    const now = Date.now()
    const timeSinceLastLoad = now - lastLoadTime
    
    // Se não for forçado e foi carregado recentemente (menos de 5 segundos), não recarregar
    if (!force && timeSinceLastLoad < 5000) {
      console.log(`⏭️ Pulando recarregamento (último carregamento há ${timeSinceLastLoad}ms)`)
      return
    }
    
    console.log('🔄 Recarregando dados de despesas...')
    await Promise.all([fetchCategories(), fetchExpenseEntries()])
    setLastLoadTime(now)
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      console.log('🔄 Carregando dados de despesas para o ano:', selectedYear)
      const startTime = Date.now()
      
      try {
        // Carregar categorias e entradas em paralelo (método otimizado)
        const [categoriesResponse, entriesResponse] = await Promise.all([
          fetch('/api/financeiro/categories'),
          fetch(`/api/financeiro/entries?year=${selectedYear}`)
        ])
        
        const [categoriesData, entriesData] = await Promise.all([
          categoriesResponse.json(),
          entriesResponse.json()
        ])
        
        const loadTime = Date.now() - startTime
        console.log(`✅ Dados carregados em ${loadTime}ms`)
        
        if (categoriesData.categories) {
          setCategories(categoriesData.categories)
        }
        
        if (entriesData.entries) {
          setExpenseEntries(entriesData.entries)
        }
        
        setLastLoadTime(Date.now())
        
        // Carregar categorias e subcategorias ocultas do localStorage
        try {
          const hiddenCats = localStorage.getItem('expense_report_hidden_categories')
          if (hiddenCats) {
            const parsed: string[] = JSON.parse(hiddenCats)
            setHiddenCategoryIds(new Set(parsed))
          }
          
          const hiddenSubs = localStorage.getItem('expense_report_hidden_subcategories')
          if (hiddenSubs) {
            const parsed: string[] = JSON.parse(hiddenSubs)
            setHiddenSubcategoryIds(new Set(parsed))
          }
        } catch {}
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [selectedYear])

  // Auto-save quando o valor debounced mudar (apenas se o campo ainda estiver aberto)
  useEffect(() => {
    if (editingCell && debouncedEditValue !== null && debouncedEditValue !== undefined) {
      const lastHyphenIndex = editingCell.lastIndexOf('-')
      const subcategoryId = editingCell.substring(0, lastHyphenIndex)
      const month = editingCell.substring(lastHyphenIndex + 1)
      const currentValueInTable = getCellValue(subcategoryId, month)
      
      // Converter o valor debounced para número (considerando vírgula)
      const numericDebouncedValue = parseFloat(debouncedEditValue.replace(',', '.')) || 0

      console.log('🔍 DEBUG DEBOUNCE:', {
        editingCell,
        debouncedEditValue,
        editValue,
        subcategoryId,
        month,
        currentValueInTable,
        numericDebouncedValue,
        willUpdate: numericDebouncedValue !== currentValueInTable,
        debouncedEqualsEdit: debouncedEditValue === editValue
      })

      // Só salvar se o valor debounced for diferente do valor atual na tabela
      // E se o valor debounced for igual ao valor sendo editado (para evitar duplicação)
      if (numericDebouncedValue !== currentValueInTable && debouncedEditValue === editValue) {
        console.log('Auto-save (debounced):', { subcategoryId, month, value: numericDebouncedValue })
        updateCellValue(subcategoryId, month, numericDebouncedValue)
      } else {
        console.log('🚫 DEBOUNCE BLOQUEADO:', {
          reason: numericDebouncedValue === currentValueInTable ? 'valor_igual' : 'debounced_diferente_edit'
        })
      }
    }
  }, [debouncedEditValue, editingCell, editValue])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }


  // Função para obter o valor de uma célula
  const getCellValue = (subcategoryId: string, month: string): number => {
    const entry = expenseEntries.find(
      e => e.subcategory_id === subcategoryId && e.month === parseInt(month)
    )
    const value = entry?.amount || 0
    return value
  }

  // Função para validar UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // Função para atualizar o valor de uma célula
  const updateCellValue = async (subcategoryId: string, month: string, value: number) => {
    try {
      console.log('🚀 UPDATE CELL VALUE INICIADO:', { subcategoryId, month, value })
      
      // Validar UUID
      if (!isValidUUID(subcategoryId)) {
        console.error('UUID inválido:', subcategoryId)
        return
      }

      // Verificar se é mês futuro (projeção)
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1 // getMonth() retorna 0-11
      const isProjection = selectedYear > currentYear || 
                          (selectedYear === currentYear && parseInt(month) > currentMonth)

      const dataToSend = {
        subcategory_id: subcategoryId,
        year: selectedYear,
        month: parseInt(month),
        amount: value,
        is_projection: isProjection
      }
      
      console.log('📤 ENVIANDO PARA API:', dataToSend)
      console.log('É projeção?', isProjection, '(Ano atual:', currentYear, 'Mês atual:', currentMonth, ')')
      console.log('JSON stringify:', JSON.stringify(dataToSend))
      
      const response = await fetch('/api/financeiro/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      })

      console.log('Status da resposta:', response.status)
      console.log('Headers da resposta:', response.headers)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ RESPOSTA DA API:', result)
        
        // Atualizar apenas o estado local em vez de recarregar tudo
        setExpenseEntries(prevEntries => {
          console.log('🔄 ATUALIZANDO ESTADO LOCAL:', {
            subcategoryId,
            month,
            value,
            prevEntriesCount: prevEntries.length
          })
          
          const existingEntryIndex = prevEntries.findIndex(
            entry => entry.subcategory_id === subcategoryId && entry.month === parseInt(month)
          )
          
          console.log('🔍 ENTRY INDEX ENCONTRADO:', existingEntryIndex)
          
          if (existingEntryIndex >= 0) {
            // Atualizar entrada existente
            console.log('✏️ ATUALIZANDO ENTRADA EXISTENTE:', {
              index: existingEntryIndex,
              oldValue: prevEntries[existingEntryIndex].amount,
              newValue: value
            })
            
            const updatedEntries = [...prevEntries]
            updatedEntries[existingEntryIndex] = {
              ...updatedEntries[existingEntryIndex],
              amount: value
            }
            return updatedEntries
          } else if (value > 0) {
            // Adicionar nova entrada apenas se o valor for maior que zero
            console.log('➕ ADICIONANDO NOVA ENTRADA:', {
              subcategoryId,
              month,
              value
            })
            
            return [...prevEntries, {
              id: result.entry?.id || `temp-${Date.now()}`,
              subcategory_id: subcategoryId,
              year: selectedYear,
              month: parseInt(month),
              amount: value,
              is_projection: isProjection,
              expense_subcategories: {
                id: subcategoryId,
                category_id: '',
                name: '',
                description: '',
                is_active: true,
                expense_categories: {
                  name: '',
                  color: '',
                  icon: ''
                }
              }
            }]
          } else {
            // Se o valor for zero, não adicionar nova entrada
            console.log('⏭️ VALOR ZERO - NÃO ADICIONANDO ENTRADA')
            return prevEntries
          }
        })
      } else {
        console.log('Resposta não OK, tentando obter erro...')
        const errorText = await response.text()
        console.log('Texto da resposta de erro:', errorText)
        
        try {
          const errorData = JSON.parse(errorText)
          console.error('Erro ao salvar valor (JSON):', errorData)
        } catch (parseError) {
          console.error('Erro ao salvar valor (texto):', errorText)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar valor (catch):', error)
    }
  }

  // Função para iniciar a edição de uma célula
  const startEditing = (subcategoryId: string, month: string) => {
    const cellId = `${subcategoryId}-${month}`
    const currentValue = getCellValue(subcategoryId, month)
    
    console.log('🎯 INICIANDO EDIÇÃO:', { 
      subcategoryId, 
      month, 
      currentValue, 
      cellId,
      currentEditingCell: editingCell,
      previousEditValue: editValue
    })
    
    // Se estava editando outra célula, limpar o estado anterior
    if (editingCell && editingCell !== cellId) {
      console.log('🔄 MUDANDO DE CÉLULA - Limpando estado anterior')
      setEditingCell(null)
      setEditValue('')
    }
    
    setEditingCell(cellId)
    // Mostrar valor formatado para edição (com vírgula como separador decimal)
    const formattedValue = currentValue > 0 ? currentValue.toFixed(2).replace('.', ',') : ''
    setEditValue(formattedValue)
    
    console.log('✅ EDIÇÃO INICIADA:', {
      cellId,
      formattedValue,
      currentValue
    })
  }

  // Função para salvar a edição
  const saveEdit = async () => {
    if (!editingCell) return
    
    // Usar lastIndexOf para pegar o último hífen (UUIDs têm hífens internos)
    const lastHyphenIndex = editingCell.lastIndexOf('-')
    const subcategoryId = editingCell.substring(0, lastHyphenIndex)
    const month = editingCell.substring(lastHyphenIndex + 1)
    
    // Converter valor com vírgula para número
    const rawValue = editValue.replace(',', '.')
    const value = parseFloat(rawValue) || 0
    
    console.log('Salvando edição (manual):', { subcategoryId, month, value, editingCell })
    
    // Salvar imediatamente quando Enter é pressionado
    await updateCellValue(subcategoryId, month, value)
    setEditingCell(null)
    setEditValue("")
  }

  // Função para cancelar a edição
  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  // Função para obter o total de uma categoria para um mês específico
  const getCategoryMonthTotal = (categoryId: string, month: string): number => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return 0

    const visibleSubcategories = category.expense_subcategories
      .filter(sub => !hiddenSubcategoryIds.has(sub.id)) // Considerar apenas subcategorias visíveis
    
    const total = visibleSubcategories.reduce((total, sub) => {
      const cellValue = getCellValue(sub.id, month)
      return total + cellValue
    }, 0)
    
    return total
  }

  // Função para calcular o total de uma categoria (soma de todos os meses)
  const getCategoryTotal = (categoryId: string): number => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return 0
    
    let total = 0
    // Somar todos os meses da categoria
    months.forEach((_, monthIndex) => {
      const month = (monthIndex + 1).toString()
      total += getCategoryMonthTotal(categoryId, month)
    })
    return total
  }

  // Função para calcular o total de um mês
  const getMonthTotal = (month: string): number => {
    let total = 0
    categories
      .filter(category => !hiddenCategoryIds.has(category.id)) // Considerar apenas categorias visíveis
      .forEach(category => {
        total += getCategoryMonthTotal(category.id, month)
      })
    return total
  }

  // Função para calcular o total geral
  const getGrandTotal = (): number => {
    let total = 0
    months.forEach((_, monthIndex) => {
      const month = (monthIndex + 1).toString()
      total += getMonthTotal(month)
    })
    return total
  }

  // Função para formatar valor monetário
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Função para ocultar uma subcategoria do relatório (não deleta do banco)
  const hideSubcategoryFromReport = (subcategoryId: string) => {
    const subcategory = categories
      .flatMap(cat => cat.expense_subcategories)
      .find(sub => sub.id === subcategoryId)
    
    if (!subcategory) return

    // Bloquear ocultação se houver lançamentos
    if (hasSubcategoryValues(subcategoryId)) {
      showConfirmation({
        title: "Não é possível ocultar",
        description: "Não é possível ocultar uma subcategoria que possui valores lançados.",
        confirmText: "Entendi",
        cancelText: "",
        variant: "default",
        onConfirm: () => {}
      })
      return
    }

    showConfirmation({
      title: "Ocultar Subcategoria",
      description: `Tem certeza que deseja ocultar a subcategoria "${subcategory.name}" do relatório?\n\nA subcategoria não será excluída do sistema, apenas oculta desta visualização.`,
      confirmText: "Ocultar",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: () => {
        const next = new Set(hiddenSubcategoryIds)
        next.add(subcategoryId)
        setHiddenSubcategoryIds(next)
        try {
          localStorage.setItem('expense_report_hidden_subcategories', JSON.stringify(Array.from(next)))
        } catch {}
      }
    })
  }

  // Função para verificar se uma subcategoria tem valores
  const hasSubcategoryValues = (subcategoryId: string): boolean => {
    return expenseEntries.some(entry => 
      entry.subcategory_id === subcategoryId && entry.amount > 0
    )
  }

  // Função para obter o total de uma subcategoria para um mês específico
  const getSubcategoryTotal = (subcategoryId: string, month: string): number => {
    return expenseEntries
      .filter(entry => entry.subcategory_id === subcategoryId && entry.month === parseInt(month))
      .reduce((total, entry) => total + entry.amount, 0)
  }


  return (
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/financeiro" 
              className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-red-600" />
            </Link>
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-red-900 to-pink-900 bg-clip-text text-transparent">
                Módulo de Despesas
              </h2>
              <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Gerencie e visualize todas as despesas da empresa mês a mês
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Ações */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-slate-50/50 to-red-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-pink-900 bg-clip-text text-transparent">
              Filtros e Ações
            </CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Exportando...' : 'Exportar'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadPNG} disabled={isDownloading}>
                  <FileImage className="h-4 w-4 mr-2" />
                  Download PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadExcel} disabled={isDownloading}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
            {/* Campo de busca temporariamente escondido */}
            <div className="md:col-span-7 space-y-2 hidden">
              <label className="text-sm font-medium text-slate-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar despesa..."
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-10 space-y-2">
              <label className="text-sm font-medium text-slate-700">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-full bg-white border-slate-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Despesas Mês a Mês */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-slate-50/50 to-red-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-pink-900 bg-clip-text text-transparent">
              Despesas por Categoria ({selectedYear})
            </CardTitle>
          </div>
          <CardDescription>
            Visão detalhada das despesas por categoria e mês.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto w-full">
            <div style={{ minWidth: '1400px', width: '100%' }}>
            <Table id="expenses-table" className="w-full" style={{ minWidth: '1400px' }}>
              <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-red-50/50 border-b-2 border-red-200">
                          <TableHead className="w-[180px] font-semibold text-slate-700 px-2 py-3 text-xs">Categoria</TableHead>
                          {months.map((month, index) => (
                            <TableHead key={month} className={`text-center font-semibold text-slate-700 px-1 py-3 w-20 text-xs ${index < months.length - 1 ? 'border-r border-slate-200' : ''}`}>{month}</TableHead>
                          ))}
                          <TableHead className="text-right font-semibold text-slate-700 px-2 py-3 w-24 text-xs">Total</TableHead>
                        </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-12">
                      <ModernLoading 
                        size="lg" 
                        text="Carregando Despesas" 
                        color="red" 
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {categories
                      .filter((category) => !hiddenCategoryIds.has(category.id))
                      .map((category) => {
                    const isExpanded = expandedCategories.has(category.id)
                    const IconComponent = getIconComponent(category.icon)
                    
                    return (
                      <React.Fragment key={category.id}>
                        {/* Categoria Principal */}
                        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 font-semibold text-slate-800 border-b-2 border-slate-200 hover:from-red-50/30 hover:to-pink-50/20 transition-all duration-200">
                          <TableCell className="font-bold text-slate-900 py-1.5 px-2 w-[180px]">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleCategory(category.id)}
                                className="p-1 hover:bg-slate-200 rounded-md transition-colors duration-200"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-slate-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-600" />
                                )}
                              </button>
                              <div className={`h-3 w-3 bg-gradient-to-br ${
                                category.name.includes('Tributos') || category.color === 'white' || category.color === 'yellow'
                                  ? 'from-yellow-400 to-amber-600' 
                                  : `from-${category.color}-400 to-${category.color}-600`
                              } rounded-full shadow-sm hover:scale-125 transition-all duration-200`}></div>
                              {category.name}
                              <Badge variant="outline" className="ml-2 text-xs bg-slate-100 text-slate-600 border-slate-300 px-1.5 py-0.5">
                                {category.expense_subcategories.length}
                              </Badge>
                              <button
                                onClick={() => removeCategoryFromReport(category.id)}
                                className="ml-2 p-1 hover:bg-red-100 rounded-md transition-colors duration-200 text-slate-400 hover:text-red-600 group"
                                title="Remover categoria do relatório"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                          {months.map((_, monthIndex) => {
                            const month = (monthIndex + 1).toString()
                            return (
                              <TableCell key={month} className={`text-center font-semibold text-slate-800 py-1.5 px-1 text-xs w-20 ${monthIndex < months.length - 1 ? 'border-r border-slate-200' : ''}`}>
                                {formatCurrency(getCategoryMonthTotal(category.id, month))}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-right font-bold text-slate-900 py-1.5 px-2 text-xs w-24">
                            {formatCurrency(getCategoryTotal(category.id))}
                          </TableCell>
                        </TableRow>
                      
                      {/* Subcategorias - Só mostra se expandida e não oculta */}
                      {isExpanded && (
                        <>
                          {category.expense_subcategories
                            .filter(sub => !hiddenSubcategoryIds.has(sub.id))
                            .map((subcategory, index) => (
                            <TableRow key={`${category.id}-${subcategory.id}`} className="bg-white/30 hover:bg-slate-50/70 transition-colors border-l-4 border-slate-200 animate-in slide-in-from-top-2 duration-200 group">
                              <TableCell className="font-medium text-slate-700 pl-8 py-1 px-2 w-[180px]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getCategoryColorClass(category.color)}`} />
                                    {subcategory.name}
                                    {hasSubcategoryValues(subcategory.id) && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Possui dados lançados" />
                                    )}
                                  </div>
                                  <button
                                    onClick={() => hideSubcategoryFromReport(subcategory.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-md transition-all duration-200 text-red-500 hover:text-red-700"
                                    title="Ocultar subcategoria do relatório"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </TableCell>
                              {months.map((_, monthIndex) => {
                                const month = (monthIndex + 1).toString()
                                const cellId = `${subcategory.id}-${month}`
                                const isEditing = editingCell === cellId
                                const value = getCellValue(subcategory.id, month)
                                
                                return (
                                  <TableCell key={`${category.id}-${subcategory.id}-${month}`} className={`text-center text-slate-600 py-1 px-1 w-10 ${monthIndex < months.length - 1 ? 'border-r border-slate-200' : ''}`}>
                                    {isEditing ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) => {
                                            // Remover formatação para cálculo
                                            const rawValue = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.')
                                            setEditValue(rawValue)
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit()
                                            if (e.key === 'Escape') cancelEdit()
                                          }}
                                          onBlur={saveEdit}
                                          onFocus={(e) => {
                                            // Mostrar valor sem formatação para edição
                                            const rawValue = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.')
                                            e.target.value = rawValue
                                          }}
                                          placeholder="0,00"
                                          className="w-16 px-1 py-0.5 text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                          autoFocus
                                        />
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => startEditing(subcategory.id, month)}
                                        className="w-full py-0.5 px-1 hover:bg-slate-100 rounded transition-colors duration-200 text-xs min-h-[20px]"
                                        title="Clique para editar"
                                      >
                                        {formatCurrency(value)}
                                      </button>
                                    )}
                                  </TableCell>
                                )
                              })}
                              <TableCell className="text-right font-medium text-slate-700 py-1 px-2 text-xs">
                                {formatCurrency(
                                  months.reduce((total, _, monthIndex) => {
                                    const month = (monthIndex + 1).toString()
                                    return total + getCellValue(subcategory.id, month)
                                  }, 0)
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  )
                    })}
                    
                        {/* Linha de Total Geral */}
                        <TableRow className="bg-gradient-to-r from-red-50 to-pink-50 font-bold text-slate-900 border-t-4 border-red-200">
                          <TableCell className="font-bold text-base py-2 px-2 flex items-center gap-2 w-[180px]">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            Total Geral
                          </TableCell>
                          {months.map((_, monthIndex) => {
                            const month = (monthIndex + 1).toString()
                            return (
                              <TableCell key={`total-${month}`} className={`text-center text-sm font-bold text-red-700 py-2 px-1 w-20 ${monthIndex < months.length - 1 ? 'border-r border-slate-200' : ''}`}>
                                {formatCurrency(getMonthTotal(month))}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-right text-sm font-bold text-red-800 py-2 px-2 w-24">
                            {formatCurrency(getGrandTotal())}
                          </TableCell>
                        </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar categorias ao relatório */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Gerenciar Categorias e Subcategorias</h3>
                <button
                  onClick={() => setShowAddCategoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-1">Categorias e subcategorias ocultas do relatório. Clique para re-incluir no relatório de despesas.</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Categorias Ocultas */}
                {categories.filter(cat => shouldShowInModal(cat.id)).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Categorias Ocultas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categories
                        .filter(cat => shouldShowInModal(cat.id))
                        .map(cat => {
                          const Icon = getIconComponent(cat.icon)
                          const isHidden = hiddenCategoryIds.has(cat.id)
                          const hasExcludedSubs = hasExcludedSubcategories(cat.id)
                          const hasNoSubcategories = !hasActiveSubcategories(cat.id)
                          
                          return (
                            <button
                              key={`cat-${cat.id}`}
                              onClick={() => {
                                addCategoryToReport(cat.id)
                                setShowAddCategoryModal(false)
                              }}
                              className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 text-left ${
                                hasExcludedSubs
                                  ? 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300'
                                  : hasNoSubcategories 
                                  ? 'border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300'
                                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <Icon className={`h-6 w-6 text-${cat.color}-600`} />
                              <div>
                                <div className="font-medium text-slate-900">{cat.name}</div>
                                <div className="text-sm text-slate-600">
                                  {cat.expense_subcategories.length} subcategorias
                                  {isHidden && (
                                    <span className="ml-2 text-blue-600 font-medium">Clique para re-incluir</span>
                                  )}
                                  {hasExcludedSubs && (
                                    <span className="ml-2 text-red-600 font-medium">🚨 Subcategorias excluídas da tabela</span>
                                  )}
                                  {hasNoSubcategories && !hasExcludedSubs && (
                                    <span className="ml-2 text-orange-600 font-medium">⚠️ Sem subcategorias ativas</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Subcategorias Ocultas */}
                {categories.flatMap(cat => cat.expense_subcategories).filter(sub => shouldShowSubcategoryInModal(sub.id)).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Subcategorias Ocultas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categories
                        .flatMap(cat => cat.expense_subcategories)
                        .filter(sub => shouldShowSubcategoryInModal(sub.id))
                        .map(sub => {
                          const parentCategory = categories.find(cat => 
                            cat.expense_subcategories.some(s => s.id === sub.id)
                          )
                          const Icon = parentCategory ? getIconComponent(parentCategory.icon) : FileText
                          
                          return (
                            <button
                              key={`sub-${sub.id}`}
                              onClick={() => {
                                addSubcategoryToReport(sub.id)
                                setShowAddCategoryModal(false)
                              }}
                              className="flex items-center gap-3 p-4 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all duration-200 text-left"
                            >
                              <Icon className={`h-6 w-6 text-${parentCategory?.color || 'green'}-600`} />
                              <div>
                                <div className="font-medium text-slate-900">{sub.name}</div>
                                <div className="text-sm text-slate-600">
                                  {parentCategory?.name} • Clique para re-incluir
                                </div>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Estado Vazio */}
                {categories.filter(cat => shouldShowInModal(cat.id)).length === 0 && 
                 categories.flatMap(cat => cat.expense_subcategories).filter(sub => shouldShowSubcategoryInModal(sub.id)).length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>Nenhuma categoria ou subcategoria oculta.</p>
                    <p className="text-sm">Todas as categorias e subcategorias estão visíveis no relatório.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="border-slate-300 hover:border-slate-400"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Confirmação */}
      {confirmationData && (
        <ConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          title={confirmationData.title}
          description={confirmationData.description}
          onConfirm={() => {
            confirmationData.onConfirm()
            setShowConfirmation(false)
            setConfirmationData(null)
          }}
        />
      )}
    </div>
  )
}
