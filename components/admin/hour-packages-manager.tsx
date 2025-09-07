"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Plus, Clock, Calendar, History, Package, RefreshCw } from "lucide-react"

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

interface HourConsumption {
  id: string
  consumed_hours: number
  consumption_date: string
  description?: string
  project_id?: string
}

interface HourPackagesManagerProps {
  companyId: string
  companyName: string
}

export function HourPackagesManager({ companyId, companyName }: HourPackagesManagerProps) {
  const [packages, setPackages] = useState<HourPackage[]>([])
  const [consumptions, setConsumptions] = useState<HourConsumption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPackage, setCurrentPackage] = useState<HourPackage | null>(null)
  const [formData, setFormData] = useState({
    package_type: 'period' as 'monthly' | 'period',
    contracted_hours: '',
    start_date: '',
    end_date: '',
    account_model: 'standard' as 'standard' | 'current_account',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPackages()
    fetchConsumptions()
  }, [companyId])

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('hour_packages')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error)
    }
  }

  const fetchConsumptions = async () => {
    try {
      const { data, error } = await supabase
        .from('hour_consumption')
        .select('*')
        .in('hour_package_id', packages.map(p => p.id))
        .order('consumption_date', { ascending: false })

      if (error) throw error
      setConsumptions(data || [])
    } catch (error) {
      console.error('Erro ao buscar consumos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Desativar pacote atual se for mensal
      if (formData.package_type === 'monthly') {
        await supabase
          .from('hour_packages')
          .update({ is_current: false })
          .eq('company_id', companyId)
          .eq('is_current', true)
      }

      const packageData = {
        company_id: companyId,
        package_type: formData.package_type,
        contracted_hours: parseInt(formData.contracted_hours),
        start_date: formData.start_date,
        end_date: formData.package_type === 'period' ? formData.end_date : null,
        account_model: formData.account_model,
        notes: formData.notes || null,
        is_current: true
      }

      const { error } = await supabase
        .from('hour_packages')
        .insert([packageData])

      if (error) throw error

      // Limpar formulário e fechar dialog
      setFormData({
        package_type: 'period',
        contracted_hours: '',
        start_date: '',
        end_date: '',
        account_model: 'standard',
        notes: ''
      })
      setIsDialogOpen(false)
      fetchPackages()
    } catch (error: any) {
      console.error('Erro ao criar pacote:', error)
    } finally {
      setIsLoading(false)
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

  const calculateRemainingHours = (package: HourPackage) => {
    const consumed = consumptions
      .filter(c => c.hour_package_id === package.id)
      .reduce((sum, c) => sum + c.consumed_hours, 0)
    return package.contracted_hours - consumed
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header com botão para novo pacote */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Pacotes de Horas - {companyName}</h3>
          <p className="text-sm text-gray-600">Gerencie os pacotes de horas contratados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Pacote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Pacote de Horas</DialogTitle>
              <DialogDescription>
                Configure um novo pacote de horas para {companyName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="package_type">Tipo de Contratação</Label>
                <Select 
                  value={formData.package_type} 
                  onValueChange={(value: 'monthly' | 'period') => 
                    setFormData(prev => ({ ...prev, package_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="period">Período</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contracted_hours">Horas Contratadas</Label>
                <Input
                  id="contracted_hours"
                  type="number"
                  min="1"
                  value={formData.contracted_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, contracted_hours: e.target.value }))}
                  placeholder="Ex: 100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="month"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>

              {formData.package_type === 'period' && (
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="month"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="account_model">Modelo de Conta</Label>
                <Select 
                  value={formData.account_model} 
                  onValueChange={(value: 'standard' | 'current_account') => 
                    setFormData(prev => ({ ...prev, account_model: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Padrão</SelectItem>
                    <SelectItem value="current_account">Conta Corrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o pacote"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Criando..." : "Criar Pacote"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Pacotes Ativos */}
      <div className="space-y-4">
        <h4 className="font-medium">Pacotes Ativos</h4>
        {packages.filter(p => p.is_current).map((pkg) => (
          <Card key={pkg.id} className="border-l-4 border-l-blue-500">
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
                    {calculateRemainingHours(pkg)}
                  </div>
                  <div className="text-sm text-gray-500">horas restantes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Histórico de Pacotes */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          Histórico de Pacotes
        </h4>
        {packages.filter(p => !p.is_current).map((pkg) => (
          <Card key={pkg.id} className="border-l-4 border-l-gray-300">
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
                    {calculateRemainingHours(pkg)} restantes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botão de Refresh */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => { fetchPackages(); fetchConsumptions(); }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar Dados
        </Button>
      </div>
    </div>
  )
} 