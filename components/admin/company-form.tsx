"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Upload, X, Image as ImageIcon, Edit3, Clock, Calendar, Package, Plus, History, RefreshCw, Building2 } from "lucide-react"
import { PaymentMetric } from "@/lib/types"
import { PaymentMetricService } from "@/lib/payment-metric-service"

interface CompanyFormProps {
  company?: {
    id: string
    name: string
    description?: string
    logo_url?: string
    website?: string
    contact_email?: string
    contact_phone?: string
    address?: string
    has_hour_package?: boolean
    contracted_hours?: number
    package_start_date?: string
    package_end_date?: string
    package_type?: 'monthly' | 'period'
    account_model?: 'standard' | 'current_account'
  }
  onSuccess?: () => void
}

interface HourPackage {
  id: string
  package_type: 'monthly' | 'period'
  contracted_hours: number
  start_date: string
  end_date?: string
  is_current: boolean
  account_model: 'standard' | 'current_account'
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
  notes?: string
}

export function CompanyForm({ company, onSuccess }: CompanyFormProps) {
    const [formData, setFormData] = useState({
    name: company?.name || "",
    description: company?.description || "",
    logo_url: company?.logo_url || "",
    website: company?.website || "",
    contact_email: company?.contact_email || "",
    contact_phone: company?.contact_phone || "",
    address: company?.address || "",
    has_hour_package: company?.has_hour_package || false,
    contracted_hours: company?.contracted_hours || undefined,
    package_start_date: company?.package_start_date || "",
    package_end_date: company?.package_end_date || "",
    package_type: company?.package_type || 'period' as 'monthly' | 'period',
    account_model: company?.account_model || 'standard' as 'standard' | 'current_account',
    // Novos campos para métricas de pagamento
    metric_type: '' as 'monthly_fixed' | 'percentage_phases' | 'installments' | '',
    metric_name: '',
    metric_total_value: 0,
    metric_hourly_rate: 0,
    metric_total_hours: 0,
    phase_planning: 20,
    phase_homologation: 30,
    phase_completion: 50,
    installments_count: 2,
    installment_value: 0,
  } as {
    name: string
    description: string
    logo_url: string
    website: string
    contact_email: string
    contact_phone: string
    address: string
    has_hour_package: boolean
    contracted_hours: number | undefined
    package_start_date: string
    package_end_date: string
    package_type: 'monthly' | 'period'
    account_model: 'standard' | 'current_account'
    // Novos campos para métricas de pagamento
    metric_type: 'monthly_fixed' | 'percentage_phases' | 'installments' | ''
    metric_name: string
    metric_total_value: number
    metric_hourly_rate: number
    metric_total_hours: number
    phase_planning: number
    phase_homologation: number
    phase_completion: number
    installments_count: number
    installment_value: number
  })


  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>(company?.logo_url || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hourPackages, setHourPackages] = useState<HourPackage[]>([])
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetric[]>([])
  // Guarda a métrica que está sendo editada (para atualizar em vez de criar outra)
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null)
  // Parcelas com valores distintos (somente para metric_type = 'installments')
  const [installments, setInstallments] = useState<Array<{ installment_number: number; amount: number; due_date?: string }>>([])
  const [isNewPackageDialogOpen, setIsNewPackageDialogOpen] = useState(false)
  const [deleteMetricDialog, setDeleteMetricDialog] = useState<{
    isOpen: boolean
    metricId: string | null
    metricName: string
  }>({
    isOpen: false,
    metricId: null,
    metricName: ''
  })
  const [newPackageData, setNewPackageData] = useState({
    package_type: 'period' as 'monthly' | 'period',
    contracted_hours: '',
    start_date: '',
    end_date: '',
    account_model: 'standard' as 'standard' | 'current_account',
    notes: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Função para calcular valor mensal automaticamente
  const calculateMonthlyAmount = () => {
    if (!formData.metric_total_value || !formData.package_start_date || !formData.package_end_date) return 0
    
    const startDate = new Date(formData.package_start_date + 'T00:00:00')
    const endDate = new Date(formData.package_end_date + 'T00:00:00')
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0
    
    const monthsCount = (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) + 1
    )
    
    // formData.metric_total_value está em centavos, então dividimos por 100 para obter o valor real
    return (formData.metric_total_value / 100) / monthsCount
  }

  // Função para calcular total de horas contratadas automaticamente
  const calculateTotalHours = () => {
    if (!formData.metric_total_value || !formData.metric_hourly_rate) return 0
    
    // Ambos os valores estão em centavos, então dividimos por 100 antes da divisão
    const totalValue = formData.metric_total_value / 100
    const hourlyRate = formData.metric_hourly_rate / 100
    
    if (hourlyRate === 0) return 0
    
    // Calcula e arredonda para o inteiro mais próximo
    return Math.round(totalValue / hourlyRate)
  }

  // Buscar pacotes de horas existentes
  useEffect(() => {
    if (company?.id) {
      fetchHourPackages()
      fetchPaymentMetrics()
    }
  }, [company?.id])

  const fetchHourPackages = async () => {
    if (!company?.id) return
    
    try {
      const { data, error } = await supabase
        .from('hour_packages')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar pacotes:', error.message)
        setHourPackages([])
        return
      }

      setHourPackages(data || [])
    } catch (error: any) {
      console.error('Erro ao buscar pacotes:', error?.message || 'Erro desconhecido')
      setHourPackages([])
    }
  }

  const fetchPaymentMetrics = async () => {
    if (!company?.id) return
    
    try {
      console.log('🔍 Buscando métricas para empresa:', company.id)
      
      const { data, error } = await supabase
        .from('payment_metrics')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar métricas:', error.message)
        setPaymentMetrics([])
        return
      }

      console.log('📊 Métricas encontradas:', data)
      
      // Verificar se há métricas com datas incorretas
      if (data && data.length > 0) {
        data.forEach((metric: any, index: number) => {
          console.log(`📅 Métrica ${index + 1}:`, {
            id: metric.id,
            name: metric.name,
            start_date: metric.start_date,
            end_date: metric.end_date,
            created_at: metric.created_at
          })
        })
      }

      setPaymentMetrics(data || [])
      
      // Verificar se há inconsistência de datas e corrigir se necessário (apenas se houver pacote de horas)
      if (data && data.length > 0 && company && formData.has_hour_package) {
        await checkAndFixMetricDates(data)
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar métricas:', error?.message || 'Erro desconhecido')
      setPaymentMetrics([])
    }
  }

  const checkAndFixMetricDates = async (metrics: any[]) => {
    try {
      console.log('🔍 Verificando consistência de datas das métricas...')
      
      // Só verificar se a empresa tem pacote de horas
      if (!formData.has_hour_package) {
        console.log('📦 Empresa sem pacote de horas, pulando verificação de datas')
        return
      }
      
      // Buscar as datas corretas do pacote de horas ativo
      const { data: packageData, error: packageError } = await supabase
        .from('hour_packages')
        .select('start_date, end_date')
        .eq('company_id', company?.id)
        .eq('is_current', true)
        .single()

      if (packageError || !packageData) {
        console.log('📦 Nenhum pacote ativo encontrado, pulando verificação de datas')
        return
      }

      console.log('📦 Datas do pacote ativo:', packageData)

      // Verificar se alguma métrica tem datas inconsistentes
      for (const metric of metrics) {
        const metricStartDate = metric.start_date
        const metricEndDate = metric.end_date
        const packageStartDate = packageData.start_date
        const packageEndDate = packageData.end_date

        if (metricStartDate !== packageStartDate || metricEndDate !== packageEndDate) {
          console.log('⚠️ Métrica com datas inconsistentes encontrada:', {
            metricId: metric.id,
            metricName: metric.name,
            metricDates: { start: metricStartDate, end: metricEndDate },
            packageDates: { start: packageStartDate, end: packageEndDate }
          })

          // Atualizar a métrica com as datas corretas
          const { error: updateError } = await supabase
            .from('payment_metrics')
            .update({
              start_date: packageStartDate,
              end_date: packageEndDate,
              updated_at: new Date().toISOString()
            })
            .eq('id', metric.id)

          if (updateError) {
            console.error('❌ Erro ao corrigir datas da métrica:', updateError)
          } else {
            console.log('✅ Datas da métrica corrigidas:', metric.id)
          }
        }
      }

      // Recarregar métricas após correção (sem chamar checkAndFixMetricDates novamente)
      setTimeout(async () => {
        const { data: updatedData, error } = await supabase
          .from('payment_metrics')
          .select('*')
          .eq('company_id', company?.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (!error && updatedData) {
          setPaymentMetrics(updatedData)
          console.log('✅ Métricas atualizadas após correção')
        }
      }, 1000)
      
    } catch (error: any) {
      console.error('❌ Erro ao verificar datas das métricas:', error)
    }
  }

  const handleEditMetric = async (metric: PaymentMetric) => {
    // Preencher o formulário com os dados da métrica para edição
    // IMPORTANTE: Usar as datas do pacote de horas da empresa, não da métrica
    setFormData(prev => ({
      ...prev,
      metric_type: metric.metric_type,
      metric_name: metric.name,
      metric_total_value: Math.round((metric.total_value || 0) * 100), // Converter para centavos
      metric_hourly_rate: Math.round((metric.hourly_rate || 0) * 100), // Converter para centavos
      metric_total_hours: metric.total_hours || 0,
      // Manter as datas do pacote de horas da empresa (não alterar)
      // package_start_date e package_end_date permanecem inalterados
    }))
    setEditingMetricId(metric.id || null)

    // Carregar detalhes de parcelas quando for metric_type = 'installments'
    try {
      if (metric.metric_type === 'installments' && metric.id) {
        const details = await PaymentMetricService.getMetricDetails(metric.id)
        const installmentDetails = (details || [])
          .filter((d: any) => d.detail_type === 'installment' || d.detail_type === 'monthly_amount')
          .sort((a: any, b: any) => (a.installment_number || 0) - (b.installment_number || 0))
          .map((d: any, idx: number) => ({
            installment_number: d.installment_number || idx + 1,
            amount: (() => {
              const raw = d.value ?? d.amount ?? 0
              const num = typeof raw === 'string' ? parseFloat(raw) : Number(raw)
              if (!isFinite(num) || isNaN(num)) return 0
              return Math.round(num * 100) // reais -> centavos
            })(),
            due_date: d.due_date || undefined
          }))

        if (installmentDetails.length > 0) {
          setInstallments(installmentDetails)
        } else if ((metric.total_hours || 0) > 0) {
          // Fallback: se não há detalhes salvos (RLS ou métrica antiga),
          // pré-popular linhas vazias para edição com base em total_hours
          const placeholders = Array.from({ length: metric.total_hours || 0 }).map((_, idx) => ({
            installment_number: idx + 1,
            amount: 0,
            due_date: undefined as string | undefined
          }))
          setInstallments(placeholders)
        } else {
          setInstallments([])
        }
      }
    } catch (err) {
      console.error('Erro ao carregar parcelas da métrica:', err)
    }
  }

  const handleDeleteMetric = async (metricId: string, metricName: string) => {
    setDeleteMetricDialog({
      isOpen: true,
      metricId,
      metricName
    })
  }

  const confirmDeleteMetric = async () => {
    if (!deleteMetricDialog.metricId) return
    
    try {
      const success = await PaymentMetricService.deleteMetric(deleteMetricDialog.metricId)
      
      if (success) {
        // Recarregar métricas
        await fetchPaymentMetrics()
        setError(null)
        // Fechar dialog
        setDeleteMetricDialog({
          isOpen: false,
          metricId: null,
          metricName: ''
        })
      } else {
        setError('Erro ao excluir métrica')
      }
    } catch (error: any) {
      console.error('Erro ao excluir métrica:', error)
      setError(error.message || 'Erro ao excluir métrica')
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, etc.)')
        return
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }

      setLogoFile(file)
      setError(null)
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview("")
    setFormData(prev => ({ ...prev, logo_url: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return formData.logo_url

    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `company-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, logoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      throw new Error('Falha no upload da logo')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let logoUrl = formData.logo_url

      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('Usuário não autenticado')
      }

      const convertMonthToDate = (monthString: string, isEndDate: boolean = false): string | null => {
        if (!monthString) return null
        const [year, month] = monthString.split('-')
        if (year && month) {
          if (isEndDate) {
            // Para data de fim, retornar o último dia do mês
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
            return `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
          } else {
            // Para data de início, retornar o primeiro dia do mês
            return `${year}-${month}-01`
          }
        }
        return null
      }

      const companyData = {
        name: formData.name,
        description: formData.description || null,
        logo_url: logoUrl || null,
        website: formData.website || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        address: formData.address || null,
        has_hour_package: formData.has_hour_package,
        contracted_hours: formData.has_hour_package ? formData.contracted_hours : null,
        package_start_date: formData.has_hour_package ? convertMonthToDate(formData.package_start_date, false) : null,
        package_end_date: formData.has_hour_package ? convertMonthToDate(formData.package_end_date, true) : null,
        package_type: formData.has_hour_package ? formData.package_type : null,
        account_model: formData.has_hour_package ? formData.account_model : null,
        created_by: user.data.user.id,
      }

      let result
      if (company) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id)

        if (error) throw error
        result = { data: { id: company.id } }
      } else {
        // Criar nova empresa
        const { data, error } = await supabase
          .from('companies')
          .insert([companyData])
          .select('id')
          .single()

        if (error) throw error
        result = { data }
      }

      // Se for uma nova empresa com pacote de horas, criar o primeiro pacote
      if (!company && formData.has_hour_package && result.data?.id) {
        const packageData = {
          company_id: result.data.id,
          package_type: formData.package_type,
          contracted_hours: formData.contracted_hours || 0,
          start_date: convertMonthToDate(formData.package_start_date, false) || new Date().toISOString().split('T')[0],
          end_date: formData.package_type === 'period' ? convertMonthToDate(formData.package_end_date, true) : null,
          account_model: formData.account_model,
          notes: 'Pacote inicial criado com a empresa',
          is_current: true
        }

        const { error: packageError } = await supabase
          .from('hour_packages')
          .insert([packageData])

        if (packageError) {
          console.error('Erro ao criar pacote inicial:', packageError)
          // Não falha a criação da empresa se o pacote der erro
        }
      }

      // Criar métricas de pagamento se configuradas (independente do pacote de horas)
      console.log('🔍 Verificando se deve criar métrica:', {
        hasMetricType: !!formData.metric_type,
        metricType: formData.metric_type,
        hasCompanyId: !!result.data?.id,
        companyId: result.data?.id,
        hasHourPackage: formData.has_hour_package
      })
      
      if (formData.metric_type && result.data?.id) {
        try {
          // Usar a função convertMonthToDate já definida no escopo superior

          // Preparar dados da métrica baseado no tipo
          // NOTA: Métrica de pagamento é independente do pacote de horas
          let metricData: any = {
            company_id: result.data.id,
            hour_package_id: null, // Sempre null - métricas são independentes
            metric_type: formData.metric_type,
            name: formData.metric_name || (
              formData.metric_type === 'monthly_fixed' ? 'Parcelas Mensais' :
              formData.metric_type === 'percentage_phases' ? 'Percentual por Fases' :
              'Parcelado'
            ),
            start_date: formData.has_hour_package 
              ? (convertMonthToDate(formData.package_start_date, false) || new Date().toISOString().split('T')[0])
              : (formData.package_start_date ? convertMonthToDate(formData.package_start_date, false) : new Date().toISOString().split('T')[0]),
            end_date: formData.has_hour_package
              ? (convertMonthToDate(formData.package_end_date, true) || new Date().toISOString().split('T')[0])
              : (formData.package_end_date ? convertMonthToDate(formData.package_end_date, true) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]), // 1 ano a partir de hoje
            is_active: true
          }
          // Se estamos editando uma métrica existente, passar o id para atualizar
          if (editingMetricId) {
            metricData.id = editingMetricId
          }
          
          console.log('📅 Datas da métrica:', {
            package_start_date: formData.package_start_date,
            package_end_date: formData.package_end_date,
            metric_start_date: metricData.start_date,
            metric_end_date: metricData.end_date
          })

          console.log('🏢 ID da empresa criada:', result.data.id)
          console.log('💰 Criando métrica de pagamento independente do pacote de horas')

          // Adicionar campos específicos baseado no tipo de métrica
          if (formData.metric_type === 'monthly_fixed') {
            // Para parcelas fixas mensais: precisa de valor total, valor da hora e total de horas
            metricData.total_value = formData.metric_total_value || 0 // Manter em centavos
            metricData.hourly_rate = formData.metric_hourly_rate || 0 // Manter em centavos
            metricData.total_hours = calculateTotalHours() || 0
          } else if (formData.metric_type === 'percentage_phases') {
            // Para percentual por fases: incluir os percentuais na métrica principal
            metricData.total_value = 0 // Será calculado dinamicamente baseado nos projetos
            metricData.hourly_rate = 0 // Não aplicável para este tipo
            metricData.total_hours = 0 // Será calculado dinamicamente baseado nos projetos
            // Incluir percentuais das fases
            metricData.planning_percentage = formData.phase_planning || 0
            metricData.homologation_percentage = formData.phase_homologation || 0
            metricData.completion_percentage = formData.phase_completion || 0
          } else if (formData.metric_type === 'installments') {
            // Parcelas com valores distintos
            metricData.total_value = totalInstallmentsValue || 0
            metricData.hourly_rate = 0
            metricData.total_hours = installments.length // usamos como quantidade de parcelas
          }

          console.log('🔧 Dados da métrica preparados:', metricData)
          console.log('📊 Valores dos campos:', {
            company_id: metricData.company_id,
            metric_type: metricData.metric_type,
            name: metricData.name,
            start_date: metricData.start_date,
            end_date: metricData.end_date,
            total_value: metricData.total_value,
            hourly_rate: metricData.hourly_rate,
            total_hours: metricData.total_hours,
            planning_percentage: metricData.planning_percentage,
            homologation_percentage: metricData.homologation_percentage,
            completion_percentage: metricData.completion_percentage
          })

          // Validar dados obrigatórios
          if (!metricData.company_id) {
            throw new Error('ID da empresa é obrigatório')
          }
          if (!metricData.metric_type) {
            throw new Error('Tipo de métrica é obrigatório')
          }
          if (!metricData.name) {
            throw new Error('Nome da métrica é obrigatório')
          }
          if (!metricData.start_date) {
            throw new Error('Data de início é obrigatória')
          }
          if (!metricData.end_date) {
            throw new Error('Data de fim é obrigatória')
          }

          console.log('✅ Validações passaram, criando métrica...')
          console.log('🚀 Enviando para PaymentMetricService:', metricData)
          
          const createdMetric = await PaymentMetricService.createOrUpdateMetric(metricData)
          
          console.log('📊 Resultado da criação:', createdMetric)
          
          if (createdMetric) {
            if (formData.metric_type === 'monthly_fixed') {
              // Gerar parcelas mensais automaticamente
              console.log('📅 Gerando parcelas mensais:', {
                metricId: createdMetric.id,
                totalValue: formData.metric_total_value || 0,
                startDate: metricData.start_date,
                endDate: metricData.end_date
              })
              
              const installmentsResult = await PaymentMetricService.generateMonthlyInstallments(
                createdMetric.id!,
                formData.metric_total_value || 0, // Manter em centavos
                metricData.start_date,
                metricData.end_date
              )
              
              console.log('📊 Resultado das parcelas:', installmentsResult)
            } else if (formData.metric_type === 'percentage_phases') {
              // Percentuais das fases já foram salvos na tabela payment_metrics
              console.log('✅ Percentuais das fases salvos na métrica principal:', {
                metricId: createdMetric.id,
                planning: formData.phase_planning || 0,
                homologation: formData.phase_homologation || 0,
                completion: formData.phase_completion || 0
              })
            } else if (formData.metric_type === 'installments') {
              // Criar detalhes para cada parcela com valor distinto
              // value deve ser NUMERIC > 0 (em reais). Nosso estado guarda centavos.
              const details = installments
                .map((it) => ({
                  detail_type: 'installment',
                  value: (it.amount || 0) > 0 ? (it.amount / 100) : 0, // converter centavos -> decimal
                  installment_number: it.installment_number,
                  due_date: it.due_date || undefined,
                  status: 'pending'
                }))
                .filter((d) => d.value > 0)
              // Upsert por número de parcela: atualiza se existir, cria se não
              const ok = await PaymentMetricService.upsertInstallmentDetails(createdMetric.id!, details as any)
              // Recarregar métricas imediatamente para refletir período atualizado (min/max vencimentos)
              if (ok) {
                await fetchPaymentMetrics()
              }
            }
          }
        } catch (error) {
          console.error('❌ Erro ao criar métricas de pagamento:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            details: error
          })
          // Não falha a criação da empresa se as métricas derem erro
        }
      }

      // Recarregar métricas se for uma empresa existente
      if (company?.id) {
        // Aguardar um pouco para garantir que a métrica foi criada
        setTimeout(async () => {
          await fetchPaymentMetrics()
        }, 1000)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/companies')
      }
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error)
      setError(error.message || 'Erro ao salvar empresa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Garante numeração sequencial ao trocar para o tipo 'installments'
  useEffect(() => {
    if (formData.metric_type !== 'installments') return
    setInstallments((prev) => prev.map((it, idx) => ({ ...it, installment_number: idx + 1 })))
  }, [formData.metric_type])

  const totalInstallmentsValue = installments.reduce((sum, it) => sum + (it.amount || 0), 0)

  const handleNewPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company?.id) return

    try {
      // Desativar pacote atual se for mensal
      if (newPackageData.package_type === 'monthly') {
        await supabase
          .from('hour_packages')
          .update({ is_current: false })
          .eq('company_id', company.id)
          .eq('is_current', true)
      }

      const packageData = {
        company_id: company.id,
        package_type: newPackageData.package_type,
                                        contracted_hours: parseInt(newPackageData.contracted_hours.toString()),
        start_date: newPackageData.start_date,
        end_date: newPackageData.package_type === 'period' ? newPackageData.end_date : null,
        account_model: newPackageData.account_model,
        notes: newPackageData.notes || null,
        is_current: true
      }

      const { error } = await supabase
        .from('hour_packages')
        .insert([packageData])

      if (error) throw error

      // Limpar formulário e fechar dialog
      setNewPackageData({
        package_type: 'period',
        contracted_hours: '',
        start_date: '',
        end_date: '',
        account_model: 'standard',
        notes: ''
      })
      setIsNewPackageDialogOpen(false)
      fetchHourPackages()
    } catch (error: any) {
      console.error('Erro ao criar pacote:', error)
      setError(error.message || 'Erro ao criar pacote')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPackageTypeText = (type: string) => {
    return type === 'monthly' ? 'Mensal' : 'Período'
  }

  const getAccountModelText = (model: string) => {
    return model === 'current_account' ? 'Conta Corrente' : 'Padrão'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    
    // Garantir que a data seja interpretada corretamente
    const date = new Date(dateString + 'T00:00:00')
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error('❌ Data inválida:', dateString)
      return dateString
    }
    
    console.log('🔍 formatDate - Input:', dateString, 'Output:', date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    }))
    
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="contact_email">Email de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  placeholder="contato@empresa.com"
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Descrição da empresa"
                rows={3}
              />
            </div>

            {/* Logo Upload Section */}
            <div className="space-y-4">
              <Label>Logo da Empresa</Label>
              
              {/* Logo Preview */}
              {logoPreview && (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Preview do logo" 
                      className="w-20 h-20 object-contain rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={removeLogo}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Preview do Logo</p>
                    <p className="text-xs text-gray-500">
                      {logoFile ? logoFile.name : 'Logo atual'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Alterar
                  </Button>
                </div>
              )}

              {/* Upload Input */}
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {logoPreview ? "Alterar Logo" : "Upload Logo"}
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeLogo}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Remover
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://www.empresa.com"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Endereço completo da empresa"
                />
              </div>
            </div>

            {/* Seção de Métricas de Pagamento - Independente do pacote de horas */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Métricas de Pagamento
                  </h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Como esta empresa será faturada?
                        </DialogTitle>
                      </DialogHeader>
                      <div className="text-sm text-gray-700 space-y-2">
                        <p>Configure a forma de pagamento independente do pacote de horas.</p>
                        <p>A empresa pode trabalhar sob demanda ou com pacote de horas.</p>
                        <p className="text-xs text-gray-500 mt-3">
                          <strong>Exemplo:</strong> Uma empresa pode ter métricas de pagamento (como parcelas mensais) sem necessariamente ter um pacote de horas contratado.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                  
                  <div className="space-y-4">
                    {/* Tipo de Métrica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="metric_type">
                          Tipo de Métrica de Pagamento
                        </Label>
                        <Select
                          value={formData.metric_type}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            metric_type: value as 'monthly_fixed' | 'percentage_phases' | 'installments'
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly_fixed">Parcelas Fixas Mensais</SelectItem>
                            <SelectItem value="percentage_phases">Contrato Percentual por Fases</SelectItem>
                            <SelectItem value="installments">Parcelado (N parcelas)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="metric_name">
                          Nome da Métrica
                        </Label>
                        <Input
                          id="metric_name"
                          placeholder="Ex: Pacote Mensal Copersucar 2024-2025"
                          value={formData.metric_name}
                          onChange={(e) => setFormData({
                            ...formData,
                            metric_name: e.target.value
                          })}
                        />
                      </div>
                    </div>

                    {/* Configuração específica baseada no tipo */}
                    {formData.metric_type === 'monthly_fixed' && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="font-medium text-gray-800">
                            Configuração de Parcelas Mensais
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Valor Total do Contrato</Label>
                            <Input
                              type="text"
                              placeholder="R$ 0,00"
                              value={formData.metric_total_value > 0 ? 
                                `R$ ${(formData.metric_total_value / 100).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}` : ''
                              }
                              onChange={(e) => {
                                let inputValue = e.target.value
                                
                                // Remove tudo exceto números
                                let numbersOnly = inputValue.replace(/\D/g, '')
                                
                                // Se não tem números, limpa
                                if (numbersOnly === '') {
                                  setFormData({
                                    ...formData,
                                    metric_total_value: 0
                                  })
                                  return
                                }
                                
                                // Converte para número (já está em centavos)
                                const numericValue = parseInt(numbersOnly)
                                
                                if (!isNaN(numericValue)) {
                                  setFormData({
                                    ...formData,
                                    metric_total_value: numericValue
                                  })
                                }
                              }}
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              Digite apenas números (ex: 27263200 = R$ 272.632,00)
                            </p>
                          </div>
                          <div>
                            <Label>Valor da Hora</Label>
                            <Input
                              type="text"
                              placeholder="R$ 0,00"
                              value={formData.metric_hourly_rate > 0 ? 
                                `R$ ${(formData.metric_hourly_rate / 100).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}` : ''
                              }
                              onChange={(e) => {
                                let inputValue = e.target.value
                                
                                // Remove tudo exceto números
                                let numbersOnly = inputValue.replace(/\D/g, '')
                                
                                // Se não tem números, limpa
                                if (numbersOnly === '') {
                                  setFormData({
                                    ...formData,
                                    metric_hourly_rate: 0
                                  })
                                  return
                                }
                                
                                // Converte para número (já está em centavos)
                                const numericValue = parseInt(numbersOnly)
                                
                                if (!isNaN(numericValue)) {
                                  setFormData({
                                    ...formData,
                                    metric_hourly_rate: numericValue
                                  })
                                }
                              }}
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              Digite apenas números (ex: 20900 = R$ 209,00)
                            </p>
                          </div>
                          <div>
                            <Label>Total de Horas Contratadas</Label>
                            <Input
                              type="text"
                              placeholder="Calculado automaticamente"
                              value={calculateTotalHours() > 0 ? calculateTotalHours().toLocaleString('pt-BR') : ''}
                              readOnly
                              className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              Calculado automaticamente: Valor Total ÷ Valor da Hora
                            </p>
                          </div>
                        </div>
                        
                        {/* Cálculo automático */}
                        {formData.metric_total_value && formData.package_start_date && formData.package_end_date && (
                          <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">Valor Mensal Calculado</span>
                            </div>
                            <div className="text-lg font-semibold text-gray-800">
                              R$ {calculateMonthlyAmount().toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {formData.metric_type === 'percentage_phases' && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <h4 className="font-medium text-gray-800">
                            Configuração de Fases Percentuais
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Planejamento (%)</Label>
                              <Input
                                type="number"
                                placeholder="20"
                                value={formData.phase_planning || ''}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  phase_planning: parseInt(e.target.value) || 0
                                })}
                              />
                            </div>
                            <div>
                              <Label>Homologação (%)</Label>
                              <Input
                                type="number"
                                placeholder="30"
                                value={formData.phase_homologation || ''}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  phase_homologation: parseInt(e.target.value) || 0
                                })}
                              />
                            </div>
                            <div>
                              <Label>Conclusão (%)</Label>
                              <Input
                                type="number"
                                placeholder="50"
                                value={formData.phase_completion || ''}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  phase_completion: parseInt(e.target.value) || 0
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.metric_type === 'installments' && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <h4 className="font-medium text-gray-800">
                            Configuração de Parcelas
                          </h4>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {installments.length === 0 && (
                              <div className="text-sm text-gray-600 italic">Nenhuma parcela configurada</div>
                            )}
                            {installments.map((it, idx) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-2">
                                  <Label>Parcela</Label>
                                  <Input readOnly className="bg-gray-50" value={it.installment_number} />
                                </div>
                                <div className="md:col-span-5">
                                  <Label>Valor</Label>
                                  <Input
                                    type="text"
                                    placeholder="R$ 0,00"
                                    value={it.amount ? `R$ ${(it.amount/100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                                    onChange={(e) => {
                                      const num = e.target.value.replace(/\D/g, '')
                                      setInstallments((prev) => prev.map((p, pIdx) => pIdx === idx ? { ...p, amount: num ? parseInt(num) : 0 } : p))
                                    }}
                                  />
                                </div>
                                <div className="md:col-span-5">
                                  <Label>Vencimento</Label>
                                  <Input
                                    type="date"
                                    value={it.due_date || ''}
                                    onChange={(e) => setInstallments((prev) => prev.map((p, pIdx) => pIdx === idx ? { ...p, due_date: e.target.value } : p))}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-gray-700 font-medium">
                              Valor total: R$ {(totalInstallmentsValue/100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setInstallments((prev) => [...prev, { installment_number: prev.length + 1, amount: 0 }])}>Adicionar parcela</Button>
                              {installments.length > 1 && (
                                <Button type="button" variant="outline" size="sm" onClick={() => setInstallments((prev) => prev.slice(0, -1))}>Remover última</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Métricas Salvas - Mostrar para empresas existentes com métricas */}
              {company?.id && paymentMetrics.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3 text-gray-800">Métricas de Pagamento Configuradas</h4>
                  <div className="space-y-3">
                    {paymentMetrics.map((metric) => (
                      <Card key={metric.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="font-medium text-gray-800">
                                  {metric.name}
                                </span>
                                <Badge className="bg-green-100 text-green-800">
                                  {metric.metric_type === 'monthly_fixed' ? 'Parcelas Mensais' : 
                                   metric.metric_type === 'percentage_phases' ? 'Percentual por Fases' : 
                                   'Parcelado'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(metric.start_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    {metric.end_date && ` até ${new Date(metric.end_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
                                  </span>
                                </div>
                                
                                {/* Exibir dados baseado no tipo de métrica */}
                                {metric.metric_type === 'monthly_fixed' && (
                                  <>
                                    {metric.total_value > 0 && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <span>Valor Total: R$ {(metric.total_value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {metric.hourly_rate && metric.hourly_rate > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>Valor da Hora: R$ {(metric.hourly_rate / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {metric.total_hours && metric.total_hours > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        <span>Total de Horas: {metric.total_hours.toLocaleString('pt-BR')}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {metric.metric_type === 'percentage_phases' && (
                                  <>
                                    {metric.planning_percentage && metric.planning_percentage > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span>Planejamento: {metric.planning_percentage}%</span>
                                      </div>
                                    )}
                                    {metric.homologation_percentage && metric.homologation_percentage > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <span>Homologação: {metric.homologation_percentage}%</span>
                                      </div>
                                    )}
                                    {metric.completion_percentage && metric.completion_percentage > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span>Conclusão: {metric.completion_percentage}%</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {metric.metric_type === 'installments' && (
                                  <>
                                    {metric.total_value > 0 && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <span>Valor Total: R$ {(metric.total_value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4" />
                                      <span>Parcelado em {metric.total_hours || 0} parcelas</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMetric(metric)}
                                className="flex items-center gap-2"
                              >
                                <Edit3 className="w-4 h-4" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteMetric(metric.id!, metric.name)}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

            {/* Pacote de Horas Section */}
            <div className="space-y-6 p-6 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Pacote de Horas</Label>
                  <p className="text-sm text-gray-600">
                    Esta empresa contratou um pacote de horas?
                  </p>
                </div>
                <Switch
                  checked={formData.has_hour_package}
                  onCheckedChange={(checked) => handleChange("has_hour_package", checked)}
                />
              </div>

              {/* Modal para Configurar Pacote - só abre quando toggle = true */}
              {formData.has_hour_package && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Configurar Pacote</Label>
                      <p className="text-xs text-gray-600">
                        {company?.id 
                          ? 'Configure um novo pacote de horas para esta empresa'
                          : 'Configure os detalhes do pacote de horas'
                        }
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNewPackageDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      {company?.id ? 'Novo Pacote' : 'Configurar'}
                    </Button>
                  </div>

                  {/* Status do Pacote Configurado - só mostra para NOVAS empresas */}
                  {!company?.id && formData.contracted_hours && formData.package_start_date && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-green-800">
                        <Package className="w-4 h-4" />
                        <span className="font-medium text-sm">Pacote Configurado</span>
                      </div>
                      <div className="mt-2 text-xs text-green-700 space-y-1">
                        <p><strong>Tipo:</strong> {formData.package_type === 'monthly' ? 'Mensal' : 'Período'}</p>
                        <p><strong>Horas:</strong> {formData.contracted_hours} horas</p>
                        <p><strong>Modelo:</strong> {formData.account_model === 'standard' ? 'Padrão' : 'Conta Corrente'}</p>
                        <p><strong>Período:</strong> {formData.package_start_date && (formData.package_type === 'monthly' || formData.package_end_date)
                          ? formData.package_type === 'monthly'
                            ? `${formData.package_start_date} (renovação mensal)`
                            : `${formData.package_start_date} até ${formData.package_end_date}`
                          : "Período não definido"
                        }</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal para Configurar Pacote */}
              <Dialog open={isNewPackageDialogOpen} onOpenChange={setIsNewPackageDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Configurar Pacote de Horas
                    </DialogTitle>
                    <DialogDescription>
                      Configure os detalhes do pacote de horas contratado por esta empresa
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Tipo de Contratação */}
                    <div className="space-y-2">
                      <Label htmlFor="package_type">Tipo de Contratação *</Label>
                      <Select 
                        value={formData.package_type} 
                        onValueChange={(value: 'monthly' | 'period') => 
                          handleChange("package_type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de contratação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="period">Período</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {formData.package_type === 'monthly' 
                          ? 'Horas renovam todo mês automaticamente'
                          : formData.package_type === 'period'
                          ? 'Horas para período específico com data de início e término'
                          : 'Selecione o tipo de contratação'
                        }
                      </p>
                    </div>

                    {/* Modelo de Conta */}
                    <div className="space-y-2">
                      <Label htmlFor="account_model">Modelo de Conta *</Label>
                      <Select 
                        value={formData.account_model} 
                        onValueChange={(value: 'standard' | 'current_account') => 
                          handleChange("account_model", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modelo de conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Padrão</SelectItem>
                          <SelectItem value="current_account">Conta Corrente</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {formData.account_model === 'current_account'
                          ? 'Horas acumulam e podem ser usadas em meses futuros'
                          : formData.account_model === 'standard'
                          ? 'Horas expiram no final do período/mês'
                          : 'Selecione o modelo de conta'
                        }
                      </p>
                    </div>

                    {/* Quantidade de Horas */}
                    <div className="space-y-2">
                      <Label htmlFor="contracted_hours" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Quantidade de Horas Contratadas *
                      </Label>
                      <Input
                        id="contracted_hours"
                        type="number"
                        min="1"
                        value={formData.contracted_hours || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "") {
                            handleChange("contracted_hours", 0)
                          } else {
                            const numValue = parseInt(value)
                            if (!isNaN(numValue) && numValue >= 0) {
                              handleChange("contracted_hours", numValue)
                            }
                          }
                        }}
                        placeholder="Ex: 1300"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Digite a quantidade total de horas contratadas pela empresa
                      </p>
                    </div>

                    {/* Datas do Pacote */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="package_start_date" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Data de Início do Pacote *
                        </Label>
                        <Input
                          id="package_start_date"
                          type="month"
                          value={formData.package_start_date}
                          onChange={(e) => handleChange("package_start_date", e.target.value)}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Mês e ano de início da vigência
                        </p>
                      </div>

                      {formData.package_type === 'period' && (
                        <div className="space-y-2">
                          <Label htmlFor="package_end_date" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Data de Término do Pacote *
                          </Label>
                          <Input
                            id="package_end_date"
                            type="month"
                            value={formData.package_end_date}
                            onChange={(e) => handleChange("package_end_date", e.target.value)}
                            required
                          />
                          <p className="text-xs text-gray-500">
                            Mês e ano de término da vigência
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Resumo do Pacote */}
                    {(formData.package_type && formData.contracted_hours && formData.package_start_date) && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="font-medium text-blue-800 mb-2">Resumo do Pacote</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          <p><strong>Tipo:</strong> {formData.package_type === 'monthly' ? 'Mensal' : 'Período'}</p>
                          <p><strong>Horas:</strong> {formData.contracted_hours} horas</p>
                          <p><strong>Modelo:</strong> {formData.account_model === 'standard' ? 'Padrão' : 'Conta Corrente'}</p>
                          <p><strong>Período:</strong> {formData.package_start_date && (formData.package_type === 'monthly' || formData.package_end_date)
                            ? formData.package_type === 'monthly'
                              ? `${formData.package_start_date} (renovação mensal)`
                              : `${formData.package_start_date} até ${formData.package_end_date}`
                            : "Período não definido"
                          }</p>
                        </div>
                      </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="button"
                        onClick={async () => {
                          // Validar campos obrigatórios
                          if (!formData.contracted_hours || !formData.package_start_date || 
                              (formData.package_type === 'period' && !formData.package_end_date)) {
                            setError('Preencha todos os campos obrigatórios do pacote de horas')
                            return
                          }
                          
                          try {
                            // Se for edição de empresa existente, criar o novo pacote
                            if (company?.id) {
                              // 1. Inativar todos os pacotes ativos da empresa
                              const { data: activePackages } = await supabase
                                .from('hour_packages')
                                .select('id')
                                .eq('company_id', company.id)
                                .eq('is_current', true)
                                
                              if (activePackages && activePackages.length > 0) {
                                const packageIds = activePackages.map((p: { id: string }) => p.id)
                                await supabase
                                  .from('hour_packages')
                                  .update({ 
                                    is_current: false, 
                                    status: 'expired' 
                                  })
                                  .in('id', packageIds)
                              }
                              
                              // 2. Criar o novo pacote na tabela hour_packages
                              const convertMonthToDate = (monthString: string, isEndDate: boolean = false): string | null => {
                                if (!monthString) return null
                                const [year, month] = monthString.split('-')
                                if (year && month) {
                                  if (isEndDate) {
                                    // Para data de fim, retornar o último dia do mês
                                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
                                    return `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
                                  } else {
                                    // Para data de início, retornar o primeiro dia do mês
                                    return `${year}-${month}-01`
                                  }
                                }
                                return null
                              }
                              
                              const newPackageData = {
                                company_id: company.id,
                                package_type: formData.package_type,
                                contracted_hours: parseInt(formData.contracted_hours?.toString() || '0') || 0,
                                start_date: convertMonthToDate(formData.package_start_date, false) || new Date().toISOString().split('T')[0],
                                end_date: formData.package_type === 'period' ? convertMonthToDate(formData.package_end_date, true) : null,
                                account_model: formData.account_model,
                                notes: 'Novo pacote configurado',
                                is_current: true,
                                status: 'active'
                              }
                              
                              const { error: packageError } = await supabase
                                .from('hour_packages')
                                .insert([newPackageData])
                                
                              if (packageError) {
                                throw new Error(`Erro ao criar novo pacote: ${packageError.message}`)
                              }
                              
                              // 3. Atualizar a tabela companies com as novas datas do pacote
                              console.log('🔄 Atualizando tabela companies com:', {
                                package_start_date: newPackageData.start_date,
                                package_end_date: newPackageData.end_date,
                                package_type: newPackageData.package_type,
                                account_model: newPackageData.account_model,
                                contracted_hours: newPackageData.contracted_hours.toString()
                              })
                              
                              const { error: companyUpdateError } = await supabase
                                .from('companies')
                                .update({
                                  package_start_date: newPackageData.start_date,
                                  package_end_date: newPackageData.end_date,
                                  package_type: newPackageData.package_type,
                                  account_model: newPackageData.account_model,
                                  contracted_hours: newPackageData.contracted_hours.toString()
                                })
                                .eq('id', company.id)
                              
                              if (companyUpdateError) {
                                console.error('❌ Erro ao atualizar empresa:', companyUpdateError)
                                // Não falha se a atualização da empresa der erro
                              } else {
                                console.log('✅ Tabela companies atualizada com sucesso!')
                                
                                // 4. Recarregar dados da empresa para atualizar o formData
                                const { data: updatedCompany, error: fetchError } = await supabase
                                  .from('companies')
                                  .select('*')
                                  .eq('id', company.id)
                                  .single()
                                
                                if (fetchError) {
                                  console.error('❌ Erro ao buscar empresa atualizada:', fetchError)
                                } else {
                                  console.log('🔄 Empresa atualizada:', updatedCompany)
                                  // Atualizar o formData com os novos dados
                                  setFormData(prev => ({
                                    ...prev,
                                    package_start_date: updatedCompany.package_start_date || '',
                                    package_end_date: updatedCompany.package_end_date || '',
                                    package_type: updatedCompany.package_type || 'period',
                                    account_model: updatedCompany.account_model || 'standard',
                                    contracted_hours: updatedCompany.contracted_hours?.toString() || ''
                                  }))
                                }
                              }
                              
                              // 5. Atualizar a interface para mostrar as mudanças
                              await fetchHourPackages()
                              
                              // 6. Forçar atualização dos dados da empresa para garantir sincronização
                              if (company?.id) {
                                const { data: refreshedCompany, error: refreshError } = await supabase
                                  .from('companies')
                                  .select('*')
                                  .eq('id', company.id)
                                  .single()
                                
                                if (!refreshError && refreshedCompany) {
                                  console.log('🔄 Dados da empresa recarregados:', refreshedCompany)
                                  // Atualizar o formData com os dados mais recentes
                                  setFormData(prev => ({
                                    ...prev,
                                    package_start_date: refreshedCompany.package_start_date || '',
                                    package_end_date: refreshedCompany.package_end_date || '',
                                    package_type: refreshedCompany.package_type || 'period',
                                    account_model: refreshedCompany.account_model || 'standard',
                                    contracted_hours: refreshedCompany.contracted_hours?.toString() || ''
                                  }))
                                }
                              }
                              
                              // 7. Marcar que tem pacote de horas
                              handleChange("has_hour_package", true)
                              setError(null)
                              
                              // 8. Fechar o modal
                              setIsNewPackageDialogOpen(false)
                              
                              console.log('✅ Novo pacote criado com sucesso!')
                            } else {
                              // Se for nova empresa, salvar dados do pacote no estado local
                              // O pacote será criado quando a empresa for salva
                              
                              // 1. Marcar que tem pacote de horas
                              handleChange("has_hour_package", true)
                              
                              // 2. Validar e converter datas
                              const convertMonthToDate = (monthString: string, isEndDate: boolean = false): string | null => {
                                if (!monthString) return null
                                const [year, month] = monthString.split('-')
                                if (year && month) {
                                  if (isEndDate) {
                                    // Para data de fim, retornar o último dia do mês
                                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
                                    return `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
                                  } else {
                                    // Para data de início, retornar o primeiro dia do mês
                                    return `${year}-${month}-01`
                                  }
                                }
                                return null
                              }
                              
                              // 3. Atualizar campos do formulário com dados do pacote
                              // Os campos já estão preenchidos no formData, não precisamos atualizar novamente
                              // Apenas confirmar que o pacote foi configurado
                              
                              // 4. Limpar erro e fechar modal
                              setError(null)
                              setIsNewPackageDialogOpen(false)
                              
                              console.log('✅ Dados do pacote salvos no formulário para nova empresa!')
                            }
                          } catch (error) {
                            console.error('Erro ao configurar pacote:', error)
                            setError(`Erro ao configurar pacote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
                          }
                        }} 
                        className="flex-1"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        {company?.id ? 'Salvar Novo Pacote' : 'Salvar Pacote'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsNewPackageDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Popup de Confirmação de Exclusão de Métrica */}
            <Dialog open={deleteMetricDialog.isOpen} onOpenChange={(open) => {
              if (!open) {
                setDeleteMetricDialog({
                  isOpen: false,
                  metricId: null,
                  metricName: ''
                })
              }
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Confirmar Exclusão
                  </DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                  <p className="text-gray-700 mb-4">
                    Tem certeza que deseja excluir a métrica de pagamento <strong>"{deleteMetricDialog.metricName}"</strong>?
                  </p>
                  <p className="text-sm text-gray-500">
                    Esta ação não pode ser desfeita e removerá todos os detalhes associados a esta métrica.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteMetricDialog({
                      isOpen: false,
                      metricId: null,
                      metricName: ''
                    })}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmDeleteMetric}
                    className="flex-1"
                  >
                    Excluir Métrica
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Seção de Pacotes de Horas - Opcional */}
            {formData.has_hour_package && (
              <Card className="w-full">
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Pacotes de Horas
                    </CardTitle>
                    <CardDescription>
                      {company?.id 
                        ? `Pacotes contratados por ${company.name}`
                        : 'Configure o primeiro pacote de horas para esta empresa'
                      }
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Para empresas novas - Botão para configurar primeiro pacote */}
                    {!company?.id && hourPackages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-800">Nenhum pacote configurado</span>
                          </div>
                          <p className="text-sm text-blue-600 mb-4">
                            Esta empresa ainda não possui pacotes de horas. Configure o primeiro pacote após salvar a empresa.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            disabled
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Configurar Primeiro Pacote
                          </Button>
                          <p className="text-xs text-blue-500 mt-2">
                            Disponível após salvar a empresa
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pacotes Ativos */}
                    {hourPackages.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Pacotes Ativos</h4>
                        {hourPackages.filter(p => p.is_current).map((pkg) => (
                        <Card key={pkg.id} className="border-l-4 border-l-blue-500 mb-3">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">
                                    {pkg.contracted_hours} horas - {getPackageTypeText(pkg.package_type)}
                                  </span>
                                  <Badge className={getStatusColor(pkg.status)}>
                                    {pkg.status === 'active' ? 'Ativo' : pkg.status === 'expired' ? 'Expirado' : 'Cancelado'}
                                  </Badge>
                                </div>
                                
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {formatDate(pkg.start_date)}
                                      {pkg.end_date && ` até ${formatDate(pkg.end_date)}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Modelo: {getAccountModelText(pkg.account_model)}</span>
                                  </div>
                                </div>

                                {pkg.notes && (
                                  <p className="text-sm text-gray-500 italic">"{pkg.notes}"</p>
                                )}
                              </div>

                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                  {pkg.contracted_hours}
                                </div>
                                <div className="text-sm text-gray-500">horas contratadas</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        ))}
                        
                        {hourPackages.filter(p => p.is_current).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>Nenhum pacote ativo encontrado</p>
                            {!company?.id && (
                              <p className="text-sm">Configure o pacote de horas acima e salve a empresa</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Histórico de Pacotes */}
                    {company?.id && hourPackages.filter(p => !p.is_current).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Histórico de Pacotes</h4>
                        {hourPackages.filter(p => !p.is_current).map((pkg) => (
                          <Card key={pkg.id} className="border-l-4 border-l-gray-300 mb-3">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-600" />
                                    <span className="font-medium">
                                      {pkg.contracted_hours} horas - {getPackageTypeText(pkg.package_type)}
                                    </span>
                                    <Badge className={getStatusColor(pkg.status)}>
                                      {pkg.status === 'active' ? 'Ativo' : pkg.status === 'expired' ? 'Expirado' : 'Cancelado'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      <span>
                                        {formatDate(pkg.start_date)}
                                        {pkg.end_date && ` até ${formatDate(pkg.end_date)}`}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Criado em {new Date(pkg.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-sm text-gray-500">
                                    {pkg.contracted_hours} horas
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões de Ação - Movidos para após o histórico */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                {isLoading ? "Salvando..." : company ? "Atualizar Empresa" : "Criar Empresa"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => (onSuccess ? onSuccess() : router.back())}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
        </form>
    </div>
  )
}
