"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModernLoading } from "@/components/ui/modern-loading"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  TrendingUp, 
  Plus, 
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  User,
  CreditCard,
  Eye,
  Check,
  X,
  ArrowLeft,
  FileImage,
  FileSpreadsheet
} from "lucide-react"
import Link from "next/link"
import * as XLSX from 'xlsx'
import domToImage from 'dom-to-image'

interface RevenueEntry {
  id: string
  month: number
  date: string
  invoice_number: string
  client: string
  type: string
  due_date: string
  amount: number
  tax_percentage: number
  tax_amount: number
  net_amount: number
  notes: string
  created_at: string
  updated_at: string
}

export default function ReceitasPage() {
  const [revenues, setRevenues] = useState<RevenueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Função para retornar as cores com base no tipo
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Sustentação': 'bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200',
      'Desenvolvimento': 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200',
      'Treinamento': 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200',
      'Consultoria': 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200',
      'Receitas Financeiras': 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200',
      'Outros': 'bg-gradient-to-r from-slate-500 to-gray-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200'
    }
    return colors[type] || 'bg-gradient-to-r from-slate-500 to-gray-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200'
  }
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<RevenueEntry>>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const [showAddRow, setShowAddRow] = useState(false)
  const [newRevenues, setNewRevenues] = useState<Partial<RevenueEntry>[]>([{
    month: new Date().getMonth() + 1,
    date: new Date().toLocaleDateString('pt-BR'),
    due_date: new Date().toLocaleDateString('pt-BR'),
    amount: 0,
    tax_percentage: 10,
    notes: ''
  }])
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([])

  // Carregar dados
  useEffect(() => {
    loadRevenues()
    loadCompanies()
  }, [selectedYear, selectedMonth])

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        console.log('Empresas carregadas:', data)
        setCompanies(data.data || [])
      } else {
        console.error('Erro na resposta da API de empresas:', response.status)
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const loadRevenues = async () => {
    console.log('=== Carregando receitas ===')
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear.toString())
      if (selectedMonth) params.append('month', selectedMonth.toString())
      
      console.log('Parâmetros da requisição:', params.toString())
      const url = `/api/financeiro/revenues?${params}`
      console.log('URL da requisição:', url)
      
      const response = await fetch(url)
      console.log('Status da resposta:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro na resposta:', errorText)
        throw new Error('Erro ao carregar receitas')
      }
      
      const data = await response.json()
      console.log('Dados recebidos da API:', data)
      
      if (!data.revenues || data.revenues.length === 0) {
        console.log('Nenhuma receita encontrada no banco de dados')
        setRevenues([])
        return
      }
      
      // Converter dados do banco para o formato da interface
      const formattedData: RevenueEntry[] = data.revenues.map((entry: any) => {
        console.log('Dados do banco:', entry)
        
        const amount = parseFloat(entry.amount) || 0
        const taxPercentage = parseFloat(entry.tax_percentage) || 0
        const taxAmount = parseFloat(entry.tax_amount) || 0
        const netAmount = parseFloat(entry.net_amount) || 0
        
        // Se os valores calculados estão vazios, calcular manualmente
        const calculatedTaxAmount = taxAmount || (amount * taxPercentage) / 100
        const calculatedNetAmount = netAmount || (amount - calculatedTaxAmount)
        
        console.log('Valores calculados:', { amount, taxPercentage, calculatedTaxAmount, calculatedNetAmount })
        
        return {
          id: entry.id,
          month: entry.month,
          date: new Date(entry.date).toLocaleDateString('pt-BR'),
          invoice_number: entry.invoice_number,
          client: entry.client,
          type: entry.type,
          due_date: new Date(entry.due_date).toLocaleDateString('pt-BR'),
          amount: amount,
          tax_percentage: taxPercentage,
          tax_amount: calculatedTaxAmount,
          net_amount: calculatedNetAmount,
          notes: entry.notes || '',
          created_at: entry.created_at,
          updated_at: entry.updated_at
        }
      })
      
      console.log('Dados formatados:', formattedData)
      setRevenues(formattedData)
    } catch (error) {
      console.error('Erro ao carregar receitas:', error)
      setRevenues([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  const getTotalRevenue = () => {
    return revenues.reduce((total, entry) => total + entry.net_amount, 0)
  }

  const getTotalGrossRevenue = () => {
    return revenues.reduce((total, entry) => total + entry.amount, 0)
  }

  const getTotalTaxes = () => {
    return revenues.reduce((total, entry) => total + entry.tax_amount, 0)
  }

  const getRevenueByMonth = (month: number) => {
    return revenues
      .filter(entry => entry.month === month)
      .reduce((total, entry) => total + entry.net_amount, 0)
  }

  // Funções de download
  const downloadAsPNG = async () => {
    if (revenues.length === 0) {
      alert('Não há receitas para exportar.')
      return
    }
    
    setIsDownloading(true)
    try {
      const tableElement = document.getElementById('revenues-table')
      
      if (!tableElement) {
        throw new Error('Tabela de receitas não encontrada')
      }

      const dataUrl = await domToImage.toPng(tableElement, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: tableElement.scrollWidth,
        height: tableElement.scrollHeight,
      })

      const link = document.createElement('a')
      link.download = `receitas_${selectedYear}_${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Erro ao fazer download PNG:', error)
      alert('Erro ao gerar imagem. Tente novamente.')
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadAsExcel = async () => {
    if (revenues.length === 0) {
      alert('Não há receitas para exportar.')
      return
    }
    
    setIsDownloading(true)
    try {
      
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value)
      }

      const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      }

      const getMonthName = (month: number) => {
        const months = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ]
        return months[month - 1] || ''
      }

      // Preparar dados para Excel
      const excelData = revenues.map(revenue => ({
        'Mês': getMonthName(revenue.month),
        'Data': formatDate(revenue.date),
        'NF': revenue.invoice_number,
        'Cliente': revenue.client,
        'Tipo': revenue.type,
        'Vencimento': formatDate(revenue.due_date),
        'Valor Bruto': revenue.amount,
        'Valor Bruto (R$)': formatCurrency(revenue.amount),
        '% Imposto': `${revenue.tax_percentage}%`,
        'Valor Imposto': revenue.tax_amount,
        'Valor Imposto (R$)': formatCurrency(revenue.tax_amount),
        'Valor Líquido': revenue.net_amount,
        'Valor Líquido (R$)': formatCurrency(revenue.net_amount),
        'Notas': revenue.notes || ''
      }))

      // Adicionar linha de totais
      const totalGross = revenues.reduce((sum, r) => sum + r.amount, 0)
      const totalTax = revenues.reduce((sum, r) => sum + r.tax_amount, 0)
      const totalNet = revenues.reduce((sum, r) => sum + r.net_amount, 0)

      excelData.push({
        'Mês': 'TOTAL',
        'Data': '',
        'NF': '',
        'Cliente': '',
        'Tipo': '',
        'Vencimento': '',
        'Valor Bruto': totalGross,
        'Valor Bruto (R$)': formatCurrency(totalGross),
        '% Imposto': '',
        'Valor Imposto': totalTax,
        'Valor Imposto (R$)': formatCurrency(totalTax),
        'Valor Líquido': totalNet,
        'Valor Líquido (R$)': formatCurrency(totalNet),
        'Notas': ''
      })

      // Criar workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 8 },  // Mês
        { wch: 12 }, // Data
        { wch: 15 }, // NF
        { wch: 25 }, // Cliente
        { wch: 15 }, // Tipo
        { wch: 12 }, // Vencimento
        { wch: 15 }, // Valor Bruto
        { wch: 18 }, // Valor Bruto (R$)
        { wch: 12 }, // % Imposto
        { wch: 15 }, // Valor Imposto
        { wch: 18 }, // Valor Imposto (R$)
        { wch: 15 }, // Valor Líquido
        { wch: 18 }, // Valor Líquido (R$)
        { wch: 30 }  // Notas
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Receitas')

      // Fazer download
      const fileName = `receitas_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Erro ao fazer download Excel:', error)
      console.error('Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido')
      alert(`Erro ao gerar planilha: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`)
    } finally {
      setIsDownloading(false)
    }
  }

  const months = [
    { number: 1, name: "Jan" },
    { number: 2, name: "Fev" },
    { number: 3, name: "Mar" },
    { number: 4, name: "Abr" },
    { number: 5, name: "Mai" },
    { number: 6, name: "Jun" },
    { number: 7, name: "Jul" },
    { number: 8, name: "Ago" },
    { number: 9, name: "Set" },
    { number: 10, name: "Out" },
    { number: 11, name: "Nov" },
    { number: 12, name: "Dez" }
  ]

  const handleAddRevenue = async () => {
    try {
      // Filtrar apenas receitas com dados preenchidos
      const validRevenues = newRevenues.filter(rev => 
        rev.client && rev.invoice_number && rev.amount && rev.amount > 0
      )

      if (validRevenues.length === 0) {
        return
      }

      // Converter cada receita
      const revenuesData = validRevenues.map(revenue => {
        const [day, month, year] = revenue.date!.split('/')
        const [dueDay, dueMonth, dueYear] = revenue.due_date!.split('/')
        
        return {
          month: revenue.month,
          date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
          invoice_number: revenue.invoice_number,
          client: revenue.client,
          type: revenue.type,
          due_date: `${dueYear}-${dueMonth.padStart(2, '0')}-${dueDay.padStart(2, '0')}`,
          amount: parseFloat(revenue.amount!.toString()),
          tax_percentage: parseFloat(revenue.tax_percentage!.toString()),
          notes: revenue.notes
        }
      })

      console.log('Enviando receitas:', revenuesData)

      // Enviar todas as receitas
      const promises = revenuesData.map(revenueData => 
        fetch('/api/financeiro/revenues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(revenueData)
        })
      )

      const responses = await Promise.all(promises)
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        setShowAddRow(false)
        setNewRevenues([{
          month: new Date().getMonth() + 1,
          date: new Date().toLocaleDateString('pt-BR'),
          due_date: new Date().toLocaleDateString('pt-BR'),
          amount: 0,
          tax_percentage: 10,
          notes: ''
        }])
        loadRevenues()
      } else {
        alert('Erro ao criar algumas receitas')
      }
    } catch (error) {
      console.error('Erro ao criar receitas:', error)
      alert('Erro ao criar receitas')
    }
  }

  const handleEdit = (entry: RevenueEntry) => {
    setEditingEntry(entry.id)
    setEditForm({
      month: entry.month,
      date: entry.date,
      invoice_number: entry.invoice_number,
      client: entry.client,
      type: entry.type,
      due_date: entry.due_date,
      amount: entry.amount,
      tax_percentage: entry.tax_percentage,
      notes: entry.notes
    })
  }

  const handleSaveEdit = async () => {
    if (!editingEntry) return

    try {
      // Converter data do formato brasileiro para ISO
      const [day, month, year] = editForm.date!.split('/')
      const [dueDay, dueMonth, dueYear] = editForm.due_date!.split('/')
      
      const revenueData = {
        id: editingEntry,
        month: editForm.month,
        date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
        invoice_number: editForm.invoice_number,
        client: editForm.client,
        type: editForm.type,
        due_date: `${dueYear}-${dueMonth.padStart(2, '0')}-${dueDay.padStart(2, '0')}`,
        amount: parseFloat(editForm.amount!.toString()),
        tax_percentage: parseFloat(editForm.tax_percentage!.toString()),
        notes: editForm.notes
      }

      console.log('Salvando edição:', revenueData)

      const response = await fetch('/api/financeiro/revenues', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(revenueData)
      })

      if (response.ok) {
        setEditingEntry(null)
        setEditForm({})
        loadRevenues()
      } else {
        const errorData = await response.json()
        console.error('Erro ao editar receita:', errorData)
        alert('Erro ao editar receita: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao editar receita:', error)
      alert('Erro ao editar receita')
    }
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    setEditForm({})
  }

  const handleCancelAdd = () => {
    setShowAddRow(false)
    setNewRevenues([{
      month: new Date().getMonth() + 1,
      date: new Date().toLocaleDateString('pt-BR'),
      due_date: new Date().toLocaleDateString('pt-BR'),
      amount: 0,
      tax_percentage: 10,
      notes: ''
    }])
  }

  const addNewRow = () => {
    setNewRevenues([...newRevenues, {
      month: new Date().getMonth() + 1,
      date: new Date().toLocaleDateString('pt-BR'),
      due_date: new Date().toLocaleDateString('pt-BR'),
      amount: 0,
      tax_percentage: 10,
      notes: ''
    }])
  }

  const removeRow = (index: number) => {
    if (newRevenues.length > 1) {
      setNewRevenues(newRevenues.filter((_, i) => i !== index))
    }
  }

  const updateNewRevenue = (index: number, field: string, value: any) => {
    const updated = [...newRevenues]
    updated[index] = { ...updated[index], [field]: value }
    setNewRevenues(updated)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        const response = await fetch(`/api/financeiro/revenues?id=${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          loadRevenues()
        } else {
          const errorData = await response.json()
          console.error('Erro ao excluir receita:', errorData)
          alert('Erro ao excluir receita: ' + (errorData.error || 'Erro desconhecido'))
        }
      } catch (error) {
        console.error('Erro ao excluir receita:', error)
        alert('Erro ao excluir receita')
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/financeiro" 
              className="p-2 hover:bg-green-50 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-green-600" />
            </Link>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
                Módulo de Receitas
              </h2>
              <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Controle e gestão de todas as receitas da empresa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Total Líquido</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(getTotalRevenue())}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Bruto</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(getTotalGrossRevenue())}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">Total Impostos</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(getTotalTaxes())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo por Mês */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50/50 to-green-50/30">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
            Resumo por Mês - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-4">
            {months.map(month => {
              const monthTotal = getRevenueByMonth(month.number)
              return (
                <div key={month.number} className="text-center p-2 bg-gradient-to-br from-slate-50 to-green-50/30 rounded-xl border border-slate-200 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                  <p className="text-xs font-medium text-slate-600 mb-1">{month.name}</p>
                  <p className="text-[10px] font-bold text-green-700 whitespace-nowrap">
                    {formatCurrency(monthTotal)}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>


      {/* Filtros e Ações */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50/50 to-green-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Filtros e Ações
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-20 gap-4">
            <div className="space-y-2 md:col-span-14">
              <label className="text-sm font-medium text-slate-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cliente, NF, tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium text-slate-700">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-full bg-white border-slate-300 focus:border-green-500 focus:ring-green-500">
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
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium text-slate-700">Mês</label>
              <Select value={selectedMonth?.toString() || "all"} onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}>
                <SelectTrigger className="w-full bg-white border-slate-300 focus:border-green-500 focus:ring-green-500">
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.number} value={month.number.toString()}>
                      {month.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Receitas */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-slate-50/50 to-green-50/30">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Receitas Registradas
            </CardTitle>
            <CardDescription>
              <div className="space-y-1">
                <p>{revenues.length} receita(s) encontrada(s)</p>
                <div className="flex gap-4 text-sm">
                  <span>Líquido: <span className="font-semibold text-green-700">{formatCurrency(getTotalRevenue())}</span></span>
                  <span>Bruto: <span className="font-semibold text-blue-700">{formatCurrency(getTotalGrossRevenue())}</span></span>
                  <span>Impostos: <span className="font-semibold text-red-700">{formatCurrency(getTotalTaxes())}</span></span>
                </div>
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => showAddRow ? addNewRow() : setShowAddRow(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddRow ? 'Adicionar Linha' : 'Nova Receita'}
            </Button>
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
                <DropdownMenuItem onClick={downloadAsPNG} disabled={isDownloading}>
                  <FileImage className="h-4 w-4 mr-2" />
                  Download PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsExcel} disabled={isDownloading}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table id="revenues-table">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-green-50/50 border-b-2 border-green-200">
                  <TableHead className="w-20 font-semibold text-slate-700 py-3 text-xs">Mês</TableHead>
                  <TableHead className="w-28 font-semibold text-slate-700 py-3 text-xs">Data</TableHead>
                  <TableHead className="w-24 font-semibold text-slate-700 py-3 text-xs">NF</TableHead>
                  <TableHead className="w-32 font-semibold text-slate-700 py-3 text-xs">Cliente</TableHead>
                  <TableHead className="w-28 font-semibold text-slate-700 py-3 text-xs">Tipo</TableHead>
                  <TableHead className="w-28 font-semibold text-slate-700 py-3 text-xs">Vencimento</TableHead>
                  <TableHead className="w-28 font-semibold text-slate-700 py-3 text-xs text-right">Bruto</TableHead>
                  <TableHead className="w-20 font-semibold text-slate-700 py-3 text-xs text-center">% Imp.</TableHead>
                  <TableHead className="w-28 font-semibold text-slate-700 py-3 text-xs text-right">Imposto</TableHead>
                  <TableHead className="w-28 font-semibold text-slate-700 py-3 text-xs text-right">Líquido</TableHead>
                  <TableHead className="w-32 font-semibold text-slate-700 py-3 text-xs">Notas</TableHead>
                  <TableHead className="w-24 font-semibold text-slate-700 py-3 text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Linhas de Inserção */}
                {showAddRow && newRevenues.map((revenue, index) => (
                  <TableRow key={index} className="bg-green-50/30 border-2 border-green-200">
                    <TableCell>
                      <select
                        value={revenue.month || ''}
                        onChange={(e) => updateNewRevenue(index, 'month', parseInt(e.target.value))}
                        className="w-full min-w-[80px] p-2 border border-green-300 rounded text-sm bg-white"
                      >
                        {months.map(month => (
                          <option key={month.number} value={month.number}>
                            {month.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={revenue.date || ''}
                        onChange={(e) => updateNewRevenue(index, 'date', e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="w-full min-w-[100px] p-2 border border-green-300 rounded text-sm bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={revenue.invoice_number || ''}
                        onChange={(e) => updateNewRevenue(index, 'invoice_number', e.target.value)}
                        placeholder="NF"
                        className="w-full p-2 border border-green-300 rounded text-sm bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={revenue.client || ''}
                        onChange={(e) => updateNewRevenue(index, 'client', e.target.value)}
                        className="w-full min-w-[150px] p-2 border border-green-300 rounded text-sm bg-white"
                      >
                        <option value="">Selecione o cliente</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.name}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        value={revenue.type || ''}
                        onChange={(e) => updateNewRevenue(index, 'type', e.target.value)}
                        className="w-full min-w-[150px] p-2 border border-green-300 rounded text-sm bg-white"
                      >
                        <option value="">Tipo</option>
                        <option value="Sustentação">Sustentação</option>
                        <option value="Desenvolvimento">Desenvolvimento</option>
                        <option value="Treinamento">Treinamento</option>
                        <option value="Consultoria">Consultoria</option>
                        <option value="Receitas Financeiras">Receitas Financeiras</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={revenue.due_date || ''}
                        onChange={(e) => updateNewRevenue(index, 'due_date', e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="w-full min-w-[100px] p-2 border border-green-300 rounded text-sm bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        step="0.01"
                        value={revenue.amount || ''}
                        onChange={(e) => updateNewRevenue(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-full p-2 border border-green-300 rounded text-sm text-right bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        step="0.01"
                        value={revenue.tax_percentage || ''}
                        onChange={(e) => updateNewRevenue(index, 'tax_percentage', parseFloat(e.target.value) || 0)}
                        placeholder="10"
                        className="w-full p-2 border border-green-300 rounded text-sm text-center bg-white"
                      />
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-700">
                      {formatCurrency((revenue.amount || 0) * (revenue.tax_percentage || 0) / 100)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-800">
                      {formatCurrency((revenue.amount || 0) - ((revenue.amount || 0) * (revenue.tax_percentage || 0) / 100))}
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={revenue.notes || ''}
                        onChange={(e) => updateNewRevenue(index, 'notes', e.target.value)}
                        placeholder="Notas"
                        className="w-full p-2 border border-green-300 rounded text-sm bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {newRevenues.length > 1 && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => removeRow(index)}
                            title="Remover esta linha"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <ModernLoading 
                        size="md" 
                        text="Carregando receitas..." 
                        color="green" 
                      />
                    </TableCell>
                  </TableRow>
                ) : revenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>Nenhuma receita encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  revenues
                    .filter(entry => 
                      entry.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      entry.invoice_number.includes(searchTerm) ||
                      entry.type.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .sort((a, b) => {
                      // Ordenar por mês (mais recente primeiro)
                      if (a.month !== b.month) {
                        return b.month - a.month
                      }
                      // Se o mês for o mesmo, ordenar por data
                      return new Date(b.date).getTime() - new Date(a.date).getTime()
                    })
                    .map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-gradient-to-r hover:from-green-50/30 hover:to-emerald-50/20 transition-all duration-200 border-b border-slate-100">
                        <TableCell className="font-medium text-slate-700 text-xs py-2">
                          {editingEntry === entry.id ? (
                            <select
                              value={editForm.month || ''}
                              onChange={(e) => setEditForm({...editForm, month: parseInt(e.target.value)})}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            >
                              {months.map(month => (
                                <option key={month.number} value={month.number}>
                                  {month.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Badge className="bg-gradient-to-r from-slate-500 to-gray-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
                              {months.find(m => m.number === entry.month)?.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs py-2">
                          {editingEntry === entry.id ? (
                            <input
                              type="text"
                              value={editForm.date || ''}
                              onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                              placeholder="DD/MM/AAAA"
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            />
                          ) : (
                            entry.date
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-slate-600 text-xs py-2">
                          {editingEntry === entry.id ? (
                            <input
                              type="text"
                              value={editForm.invoice_number || ''}
                              onChange={(e) => setEditForm({...editForm, invoice_number: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            />
                          ) : (
                            entry.invoice_number
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700 text-xs py-2">
                          {editingEntry === entry.id ? (
                            <input
                              type="text"
                              value={editForm.client || ''}
                              onChange={(e) => setEditForm({...editForm, client: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            />
                          ) : (
                            entry.client
                          )}
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          {editingEntry === entry.id ? (
                            <select
                              value={editForm.type || ''}
                              onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            >
                              <option value="Sustentação">Sustentação</option>
                              <option value="Desenvolvimento">Desenvolvimento</option>
                              <option value="Treinamento">Treinamento</option>
                              <option value="Consultoria">Consultoria</option>
                              <option value="Receitas Financeiras">Receitas Financeiras</option>
                              <option value="Outros">Outros</option>
                            </select>
                          ) : (
                            <Badge variant="outline" className={getTypeColor(entry.type)}>
                              {entry.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs py-2">
                          {editingEntry === entry.id ? (
                            <input
                              type="text"
                              value={editForm.due_date || ''}
                              onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}
                              placeholder="DD/MM/AAAA"
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            />
                          ) : (
                            entry.due_date
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-800 text-xs py-2">
                          {editingEntry === entry.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.amount || ''}
                              onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})}
                              className="w-full p-2 border border-slate-300 rounded text-sm text-right"
                            />
                          ) : (
                            formatCurrency(entry.amount)
                          )}
                        </TableCell>
                        <TableCell className="text-center text-slate-600 font-medium text-xs py-2">
                          {editingEntry === entry.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.tax_percentage || ''}
                              onChange={(e) => setEditForm({...editForm, tax_percentage: parseFloat(e.target.value) || 0})}
                              className="w-full p-2 border border-slate-300 rounded text-sm text-center"
                            />
                          ) : (
                            `${entry.tax_percentage}%`
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-700 text-xs py-2">
                          {formatCurrency(entry.tax_amount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-800 text-xs py-2">
                          {formatCurrency(entry.net_amount)}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs py-2">
                          {editingEntry === entry.id ? (
                            <input
                              type="text"
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            />
                          ) : (
                            entry.notes
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {editingEntry === entry.id ? (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                  onClick={() => handleEdit(entry)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                                  onClick={() => handleDelete(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação - Salvar e Cancelar */}
      {(showAddRow || editingEntry) && (
        <div className="flex justify-end gap-4">
          <Button 
            onClick={editingEntry ? handleCancelEdit : handleCancelAdd}
            variant="outline" 
            className="border-red-300 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700 px-6 py-2"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={editingEntry ? handleSaveEdit : handleAddRevenue}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
          >
            <Check className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      )}

    </div>
  )
}
