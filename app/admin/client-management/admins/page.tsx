"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, UserCog, Building2, Mail, Users } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useConfirmation } from "@/components/ui/confirmation-dialog"

interface Company {
  id: string
  type: "PJ" | "PF"
  corporate_name?: string
  full_name?: string
  licenses_quantity: number
}

interface Admin {
  id: string
  company_id: string
  full_name: string
  email: string
  status: "active" | "inactive"
  created_at: string
  companies?: Company
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { confirm, ConfirmationModal } = useConfirmation()

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("client_admins")
        .select(`
          *,
          companies:client_companies(
            id,
            type,
            corporate_name,
            full_name,
            licenses_quantity
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error("Erro ao buscar administradores:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar administradores",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAdmin = (admin: Admin) => {
    confirm({
      title: "Excluir Administrador",
      description: `Tem certeza que deseja excluir o administrador "${admin.full_name}"? Esta ação não pode ser desfeita e o administrador perderá o acesso ao sistema.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "destructive",
      icon: <Trash2 className="h-6 w-6" />,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/client-admins/${admin.id}/delete`, {
            method: "DELETE",
          })

          const result = await response.json()

          if (!response.ok || !result.success) {
            throw new Error(result.error || "Erro ao excluir administrador")
          }

          toast({
            title: "Sucesso",
            description: "Administrador excluído com sucesso"
          })

          fetchAdmins()
        } catch (error) {
          console.error("Erro ao excluir administrador:", error)
          toast({
            title: "Erro",
            description: "Falha ao excluir administrador",
            variant: "destructive"
          })
        }
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCompanyName = (admin: Admin) => {
    if (admin.companies) {
      return admin.companies.type === "PJ" 
        ? admin.companies.corporate_name 
        : admin.companies.full_name
    }
    return "Empresa não encontrada"
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
          <h1 className="text-3xl font-bold tracking-tight">Administradores de Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie os administradores das empresas clientes
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
          <Link href="/admin/client-management/admins/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Administrador
          </Link>
        </Button>
      </div>

      {/* Lista de Administradores */}
      <div className="space-y-4">
        {admins.length === 0 ? (
          <Card className="p-8 text-center">
            <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum administrador cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando o primeiro administrador para uma empresa cliente
            </p>
            <Button asChild>
              <Link href="/admin/client-management/admins/new">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Administrador
              </Link>
            </Button>
          </Card>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    {/* Informações do Administrador */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserCog className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{admin.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{admin.email}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {admin.companies?.type}
                      </Badge>
                    </div>

                    {/* Informações da Empresa */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>
                        <strong>Empresa:</strong> {getCompanyName(admin)}
                      </span>
                    </div>

                    {/* Informações de Licenças */}
                    {admin.companies && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          <strong>Licenças contratadas:</strong> {admin.companies.licenses_quantity}
                        </span>
                      </div>
                    )}

                    {/* Status e Data */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(admin.status)}
                        <span className="text-xs text-muted-foreground">
                          Cadastrado em: {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/client-management/admins/${admin.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAdmin(admin)}
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
