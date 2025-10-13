import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, UserCog, UserPlus, Plus, DollarSign, ArrowLeft, Info, Users, List } from "lucide-react";
import Link from "next/link";

export default function ClientManagementPage() {
  // Dados mock para o dashboard (serão substituídos por dados reais)
  const dashboardData = {
    totalCompanies: 12,
    activeAdmins: 15,
    totalClients: 150,
    monthlyRevenue: "45.000,00",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <UserCog className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                Administrar Clientes
              </h1>
              <p className="text-slate-600 mt-1">
                Gestão de empresas clientes e seus administradores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard das Empresas */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_8px_40px_-12px_rgba(15,23,42,0.25)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] transition-all duration-300 rounded-2xl group">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:via-pink-600 group-hover:to-purple-800 transition-all duration-300">
            <Building2 className="h-5 w-5" />
            Visão Geral das Empresas Clientes
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 font-medium">
            Estatísticas e ações rápidas para as empresas clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Empresas</p>
                  <p className="text-2xl font-bold">{dashboardData.totalCompanies}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Admins Ativos</p>
                  <p className="text-2xl font-bold">{dashboardData.activeAdmins}</p>
                </div>
                <UserPlus className="h-8 w-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Clientes</p>
                  <p className="text-2xl font-bold">{dashboardData.totalClients}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Receita Mensal</p>
                  <p className="text-2xl font-bold">R$ {dashboardData.monthlyRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-200" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seções de Gestão */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_8px_40px_-12px_rgba(15,23,42,0.25)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] transition-all duration-300 rounded-2xl group">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-indigo-600 group-hover:to-blue-800 transition-all duration-300">
                  Cadastrar Nova Empresa Cliente
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 font-medium">
                  Adicionar uma nova empresa que será gerenciada no sistema.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200 group/btn">
                <Link href="/admin/client-management/companies">
                  <List className="mr-2 h-4 w-4" />
                  Gerenciar Empresas
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              Ao cadastrar uma nova empresa, você poderá associar administradores e clientes a ela.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_8px_40px_-12px_rgba(15,23,42,0.25)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] transition-all duration-300 rounded-2xl group">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:via-pink-600 group-hover:to-purple-800 transition-all duration-300">
                  Cadastrar Novo Administrador de Empresa
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 font-medium">
                  Crie um novo usuário com perfil de administrador para uma empresa cliente.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200 group/btn">
                <Link href="/admin/client-management/admins">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Admins
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-700 flex items-start gap-3">
              <Info className="h-4 w-4 text-purple-600 mt-0.5" />
              Este administrador terá acesso completo aos dados da empresa selecionada.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}