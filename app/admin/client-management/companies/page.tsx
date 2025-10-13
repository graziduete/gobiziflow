"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, Building2, MapPin } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useConfirmation } from "@/components/ui/confirmation-dialog"

interface Company {
  id: string
  type: "PJ" | "PF"
  corporate_name?: string
  full_name?: string
  cnpj?: string
  cpf?: string
  email: string
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  plan_type: "teste_7_dias" | "plano_pro"
  licenses_quantity: number
  price_per_license: number
  total_value: number
  card_number: string
  card_name: string
  card_expiry: string
  card_cvv: string
  created_at: string
  status: "active" | "inactive" | "trial"
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { confirm, ConfirmationModal } = useConfirmation()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("client_companies")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error("Erro ao buscar empresas:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar empresas clientes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCompany = (company: Company) => {
    const companyName = company.type === "PJ" ? company.corporate_name : company.full_name
    
    confirm({
      title: "Excluir Empresa",
      description: `Tem certeza que deseja excluir a empresa "${companyName}"? Esta ação não pode ser desfeita e todos os dados associados serão removidos permanentemente.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "destructive",
      icon: <Building2 className="h-6 w-6" />,
      onConfirm: async () => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from("client_companies")
            .delete()
            .eq("id", company.id)

          if (error) throw error

          toast({
            title: "Sucesso",
            description: "Empresa excluída com sucesso"
          })

          fetchCompanies()
        } catch (error) {
          console.error("Erro ao excluir empresa:", error)
          toast({
            title: "Erro",
            description: "Falha ao excluir empresa",
            variant: "destructive"
          })
        }
      }
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getPlanTypeLabel = (planType: string) => {
    switch (planType) {
      case "teste_7_dias":
        return "Teste 7 dias"
      case "plano_pro":
        return "Plano Pro"
      default:
        return planType
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "trial":
        return <Badge className="bg-blue-100 text-blue-800">Teste</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie as empresas clientes e seus planos contratados
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
          <Link href="/admin/client-management/companies/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Link>
        </Button>
      </div>

      {/* Lista de Empresas */}
      <div className="space-y-4">
        {companies.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando sua primeira empresa cliente
            </p>
            <Button asChild>
              <Link href="/admin/client-management/companies/new">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Empresa
              </Link>
            </Button>
          </Card>
        ) : (
          companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    {/* Informações Básicas */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {company.type === "PJ" ? company.corporate_name : company.full_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{company.email}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {company.type}
                      </Badge>
                    </div>

                    {/* Endereço */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {company.street}, {company.number} - {company.neighborhood}, {company.city}/{company.state}
                      </span>
                    </div>

                    {/* Informações do Plano */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Plano</p>
                        <p className="text-sm text-muted-foreground">
                          {getPlanTypeLabel(company.plan_type)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Licenças</p>
                        <p className="text-sm text-muted-foreground">
                          {company.licenses_quantity} x {formatCurrency(company.price_per_license)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Valor Total</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(company.total_value)}
                        </p>
                      </div>
                    </div>

                    {/* Status e Data */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(company.status)}
                        <span className="text-xs text-muted-foreground">
                          Cadastrado em: {new Date(company.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/client-management/companies/${company.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCompany(company)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmationModal />
    </div>
  )
}