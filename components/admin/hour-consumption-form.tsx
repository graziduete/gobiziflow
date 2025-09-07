"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Package, Building2 } from "lucide-react"
import { HourService } from "@/lib/hour-service"
import { HourPackage, CompanyHourStats } from "@/lib/types"

interface HourConsumptionFormProps {
  projectId: string
  companyId: string
  projectName: string
  companyName: string
  onConsumptionRecorded?: () => void
}

export function HourConsumptionForm({ 
  projectId, 
  companyId, 
  projectName, 
  companyName,
  onConsumptionRecorded 
}: HourConsumptionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [hourPackages, setHourPackages] = useState<HourPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [consumedHours, setConsumedHours] = useState("")
  const [consumptionDate, setConsumptionDate] = useState("")
  const [description, setDescription] = useState("")
  
  const [companyStats, setCompanyStats] = useState<CompanyHourStats | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (isOpen) {
      fetchHourPackages()
      fetchCompanyStats()
    }
  }, [isOpen, companyId])

  const fetchHourPackages = async () => {
    try {
      const packages = await HourService.getCompanyHourPackages(companyId)
      setHourPackages(packages)
      
      // Selecionar o pacote ativo por padrão
      const activePackage = packages.find(p => p.is_current && p.status === 'active')
      if (activePackage) {
        setSelectedPackage(activePackage.id)
      }
    } catch (error) {
      console.error('Erro ao buscar pacotes de horas:', error)
      setError('Erro ao buscar pacotes de horas')
    }
  }

  const fetchCompanyStats = async () => {
    try {
      const currentDate = new Date()
      const month = (currentDate.getMonth() + 1).toString()
      const year = currentDate.getFullYear().toString()
      
      const stats = await HourService.calculateCompanyHourStats(companyId, month, year)
      if (stats) {
        stats.company_name = companyName
        setCompanyStats(stats)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas da empresa:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validações
      if (!selectedPackage) {
        throw new Error('Selecione um pacote de horas')
      }
      
      if (!consumedHours || parseInt(consumedHours) <= 0) {
        throw new Error('Digite uma quantidade válida de horas')
      }
      
      if (!consumptionDate) {
        throw new Error('Selecione uma data de consumo')
      }

      // Registrar consumo
      const success = await HourService.recordHourConsumption(
        selectedPackage,
        projectId,
        parseInt(consumedHours),
        consumptionDate,
        description,
        undefined // createdBy será preenchido automaticamente pelo Supabase
      )

      if (!success) {
        throw new Error('Erro ao registrar consumo de horas')
      }

      setSuccess('Consumo de horas registrado com sucesso!')
      
      // Limpar formulário
      setConsumedHours("")
      setConsumptionDate("")
      setDescription("")
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(null)
        if (onConsumptionRecorded) {
          onConsumptionRecorded()
        }
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const getSelectedPackageInfo = () => {
    return hourPackages.find(p => p.id === selectedPackage)
  }

  const selectedPackageInfo = getSelectedPackageInfo()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Registrar Horas
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Registrar Consumo de Horas
          </DialogTitle>
          <DialogDescription>
            Registre o consumo de horas para o projeto <strong>{projectName}</strong> da empresa <strong>{companyName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas da Empresa */}
          {companyStats && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Status das Horas - {companyName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 font-medium">Contratadas</p>
                    <p className="text-lg font-bold text-blue-700">{companyStats.contracted_hours}h</p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium">Consumidas</p>
                    <p className="text-lg font-bold text-blue-700">{companyStats.consumed_hours}h</p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium">Restantes</p>
                    <p className="text-lg font-bold text-blue-700">{companyStats.remaining_hours}h</p>
                  </div>
                </div>
                
                {companyStats.account_model === 'current_account' && (
                  <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
                    💡 <strong>Modelo Conta Corrente:</strong> {companyStats.previous_months_remaining}h restantes de meses anteriores
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Formulário de Consumo */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package">Pacote de Horas *</Label>
                <select
                  id="package"
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione um pacote</option>
                  {hourPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.contracted_hours}h - {pkg.package_type === 'monthly' ? 'Mensal' : 'Período'} 
                      {pkg.is_current ? ' (Ativo)' : ' (Inativo)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumedHours">Horas Consumidas *</Label>
                <Input
                  id="consumedHours"
                  type="number"
                  min="1"
                  value={consumedHours}
                  onChange={(e) => setConsumedHours(e.target.value)}
                  placeholder="Ex: 8"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consumptionDate">Data de Consumo *</Label>
                <Input
                  id="consumptionDate"
                  type="date"
                  value={consumptionDate}
                  onChange={(e) => setConsumptionDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Desenvolvimento da API"
                />
              </div>
            </div>

            {/* Informações do Pacote Selecionado */}
            {selectedPackageInfo && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-sm">Informações do Pacote Selecionado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tipo:</span>
                      <Badge variant="outline" className="ml-2">
                        {selectedPackageInfo.package_type === 'monthly' ? 'Mensal' : 'Período'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Modelo:</span>
                      <Badge variant="outline" className="ml-2">
                        {selectedPackageInfo.account_model === 'current_account' ? 'Conta Corrente' : 'Padrão'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Horas Contratadas:</span>
                      <span className="ml-2 font-medium">{selectedPackageInfo.contracted_hours}h</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge 
                        variant={selectedPackageInfo.status === 'active' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {selectedPackageInfo.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensagens de Erro e Sucesso */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                ✅ {success}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Consumo
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 