"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bell, Search, Filter, RefreshCw, ArrowLeft, Sparkles, FileText, Calendar, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface NotificationLog {
  id: string
  responsavel_id: string
  email: string
  type: 'project_assigned' | 'deadline_warning' | 'deadline_urgent' | 'task_overdue'
  subject: string
  message: string
  project_id?: string
  task_id?: string
  sent_at: string
  status: 'sent' | 'failed' | 'pending'
  responsaveis: {
    nome: string
  }
  projects?: {
    name: string
  }
}

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
  }, [currentPage, statusFilter, typeFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Obter dados do usuário logado para aplicar filtros
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_client_admin')
        .eq('id', user.id)
        .single()

      let query = supabase
        .from('notification_logs')
        .select(`
          *,
          responsaveis!inner(nome, tenant_id),
          projects(name, tenant_id)
        `)
        .order('sent_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      // Aplicar filtros baseados no role
      if (profile?.is_client_admin) {
        // Client Admin: apenas logs de responsáveis e projetos do seu tenant
        const { data: clientAdmin } = await supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          // Filtrar por responsáveis do tenant
          query = query.eq('responsaveis.tenant_id', clientAdmin.company_id)
        } else {
          // Se não encontrar client_admin, não mostrar nenhum log
          query = query.eq('responsaveis.tenant_id', '00000000-0000-0000-0000-000000000000') // UUID inválido
        }
      } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        // Admin Normal/Operacional: apenas logs de responsáveis sem tenant_id
        query = query.is('responsaveis.tenant_id', null)
      }
      // Admin Master vê tudo (sem filtro)

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }

      if (typeFilter !== "all") {
        query = query.eq('type', typeFilter)
      }

      console.log('🔍 [NotificationLogs] Executando query com filtros:', {
        userRole: profile?.role,
        isClientAdmin: profile?.is_client_admin,
        statusFilter,
        typeFilter
      })

      const { data, error, count } = await query

      if (error) {
        console.error('🔍 [NotificationLogs] Erro na query:', error)
        throw error
      }

      console.log('🔍 [NotificationLogs] Query executada com sucesso:', {
        logsCount: data?.length || 0,
        totalCount: count
      })

      setLogs(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de notificação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      'project_assigned': 'Projeto Atribuído',
      'deadline_warning': 'Aviso de Prazo',
      'deadline_urgent': 'Prazo Urgente',
      'task_overdue': 'Tarefa Atrasada'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'project_assigned': 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm',
      'deadline_warning': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm',
      'deadline_urgent': 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm',
      'task_overdue': 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-sm'
    }
    return colors[type as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-sm'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'sent': 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm',
      'failed': 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-sm',
      'pending': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm'
    }
    return colors[status as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-sm'
  }

  const filteredLogs = logs.filter(log => 
    log.responsaveis.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/notifications"
              className="absolute top-4 left-4 text-blue-600 hover:text-blue-700 text-lg font-medium p-1 rounded-md hover:bg-blue-50 transition-colors"
              title="Voltar para notificações"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-4 ml-12">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Logs de Notificações
                </h2>
                <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Histórico de notificações enviadas para responsáveis
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <Button 
                onClick={fetchLogs} 
                disabled={loading} 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold text-slate-700">Filtros de Busca</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-600">
            Filtre os logs de notificações por diferentes critérios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, email ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-500" />
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                Tipo
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="project_assigned">Projeto Atribuído</SelectItem>
                  <SelectItem value="deadline_warning">Aviso de Prazo</SelectItem>
                  <SelectItem value="deadline_urgent">Prazo Urgente</SelectItem>
                  <SelectItem value="task_overdue">Tarefa Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-500" />
                Ações
              </label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setTypeFilter("all")
                }}
                className="w-full h-10 border-slate-300 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold text-slate-700">Histórico de Notificações</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-600">
            {filteredLogs.length} notificação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <p className="text-slate-600 font-medium">Carregando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bell className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-2">Nenhum log encontrado</p>
              <p className="text-slate-500 text-sm">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Nenhuma notificação foi enviada ainda"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="font-semibold text-slate-700">Responsável</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Notificação</TableHead>
                    <TableHead className="font-semibold text-slate-700">Projeto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Enviado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          {log.responsaveis.nome}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{log.email}</TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(log.type)} font-medium`}>
                          {getTypeLabel(log.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md flex items-center justify-center">
                              <MessageSquare className="w-3 h-3 text-slate-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-700 font-medium text-sm leading-tight truncate" title={log.subject}>
                              {log.subject}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {log.projects?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(log.status)} font-medium`}>
                          {log.status === 'sent' ? 'Enviado' : 
                           log.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(log.sent_at).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                Anterior
              </Button>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-slate-700">
                  Página {currentPage} de {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                Última
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
