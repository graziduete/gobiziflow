"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Search, Clock, TrendingUp, AlertTriangle, CheckCircle, FileText, RefreshCw, Wifi, WifiOff, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getMockSustentacaoData } from "@/lib/data/mock-sustentacao";
import { SustentacaoFilters } from "./filters";

// Função para converter decimal para formato HH:MM
const converterDecimalParaRelogio = (decimal: number): string => {
  if (isNaN(decimal) || decimal < 0) return '00:00';
  
  const horas = Math.floor(decimal);
  const minutos = Math.round((decimal - horas) * 60);
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
};


export function SustentacaoDashboard({ companyId, useV2 = false }: { companyId: string; useV2?: boolean }) {
  const [chamados, setChamados] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({
    mes: new Date().getMonth() + 1, // Mês atual
    ano: new Date().getFullYear()
  });
  
  // Estados para atualização em tempo real
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filtros da listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadSustentacaoData();
  }, [companyId, filters]);

  // Forçar atualização quando chamados mudarem
  useEffect(() => {
    if (chamados.length > 0) {
      setForceUpdate(prev => prev + 1);
    }
  }, [chamados]);

  // Configurar atualização automática
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        console.log('🔄 Atualização automática em andamento...');
        loadSustentacaoData(true); // Atualização silenciosa
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [autoRefresh, refreshInterval, companyId, filters]);

  // Limpar intervalo ao desmontar componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadSustentacaoData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const isCopersucar = companyId === 'copersucar';
      
      // Tentar usar Google Sheets se configurado
      console.log('🔄 Carregando dados do Google Sheets...', filters);
      
      const apiEndpoint = useV2 ? 'http://localhost:3000/api/sustentacao/chamados-v2' : 'http://localhost:3000/api/sustentacao/chamados';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          filters
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMetricas(data.metricas);
        setCategorias(data.categorias);
        setChamados(data.chamados);
        console.log('✅ Dados do Google Sheets carregados!', {
          chamados: data.chamados.length,
          metricas: data.metricas,
          primeirosChamados: data.chamados.slice(0, 3).map((c: any) => c.idEllevo)
        });
        return;
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na API:', errorData);
        console.error('❌ Status:', response.status);
        console.error('❌ Response:', response);
      }
      
      // Fallback para dados mockados
      console.log('🔄 Carregando dados mockados (fallback)...', filters);
      
      const mockData = getMockSustentacaoData(companyId, filters);

      setMetricas({
        horasContratadas: mockData.horasContratadas,
        horasConsumidas: mockData.horasConsumidas,
        horasRestantes: mockData.horasRestantes,
        saldoProximoMes: mockData.saldoProximoMes
      });

      setCategorias(mockData.chamadosPorCategoria);
      setChamados(mockData.chamados);
      
      console.log('✅ Dados mockados carregados!');
    } catch (error) {
      console.error('Erro ao carregar dados de sustentação:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
      setLastUpdate(new Date());
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Calcular categorias baseado nos chamados filtrados
  const calcularCategorias = (chamadosList: any[]) => {
    const categoriaCount: { [key: string]: number } = {};
    
    chamadosList.forEach(chamado => {
      const cat = chamado.categoria;
      categoriaCount[cat] = (categoriaCount[cat] || 0) + 1;
    });
    
    const cores: { [key: string]: string } = {
      'Bug': 'bg-red-500',
      'Bugs': 'bg-red-500',
      'Processo': 'bg-blue-500',
      'Solicitação': 'bg-green-500',
      'Ajuste': 'bg-yellow-500',
      'Falha Sistêmica': 'bg-purple-500',
      'Falha Sistema': 'bg-purple-500'
    };
    
    return Object.entries(categoriaCount).map(([nome, quantidade]) => ({
      nome,
      quantidade,
      cor: cores[nome] || 'bg-gray-500'
    }));
  };

  // Filtrar chamados baseado nos filtros da listagem
  const filteredChamados = chamados.filter(chamado => {
    // Filtro por busca (ID ou assunto)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesId = chamado.idEllevo?.toString().toLowerCase().includes(searchLower);
      const matchesAssunto = chamado.assunto?.toLowerCase().includes(searchLower);
      if (!matchesId && !matchesAssunto) return false;
    }

    // Filtro por categoria
    if (filterCategoria !== 'all') {
      // Mapear valores do filtro para valores reais
      const categoriaMap: { [key: string]: string[] } = {
        'Bugs': ['Bug', 'Bugs'],
        'Processo': ['Processo'],
        'Solicitação': ['Solicitação'],
        'Ajuste': ['Ajuste'],
        'Falha Sistêmica': ['Falha Sistêmica', 'Falha Sistema']
      };
      
      const categoriasValidas = categoriaMap[filterCategoria] || [filterCategoria];
      if (!categoriasValidas.includes(chamado.categoria)) return false;
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      // Mapear valores do filtro para valores reais
           const statusMap: { [key: string]: string[] } = {
             'Resolvido': ['Resolvido', 'RESOLVED'],
             'Não iniciado': ['Não iniciado'],
             'Em andamento': ['Em andamento'],
             'Aguardando': ['Aguardando']
           };
      
      const statusValidos = statusMap[filterStatus] || [filterStatus];
      if (!statusValidos.includes(chamado.status)) return false;
    }

    return true;
  });

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 40) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados de sustentação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles de atualização */}
      <div className="flex items-center justify-end space-x-4">
        {/* Status da última atualização */}
        {lastUpdate && (
          <div className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        )}
        
        {/* Indicador de atualização */}
        {isRefreshing && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Atualizando...</span>
          </div>
        )}
        
        {/* Controle de atualização automática */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
          </button>
          
          {/* Botão de atualização manual */}
          <button
            onClick={() => loadSustentacaoData(false)}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros de Sustentação */}
      <SustentacaoFilters 
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Linha separadora */}
      <div className="border-t border-gray-200"></div>

      {/* Cards de métricas principais - seguindo identidade visual do sistema */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Horas Contratadas</p>
                <p className="text-2xl font-bold text-gray-900">{metricas?.horasContratadas || '00:00'}</p>
                <p className="text-xs text-gray-500">Horas</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Horas Consumidas</p>
                <p className="text-2xl font-bold text-gray-900">{metricas?.horasConsumidas || 0}</p>
                <p className="text-xs text-gray-500">Horas utilizadas</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Horas Restantes</p>
                <p className="text-2xl font-bold text-gray-900">{metricas?.horasRestantes || 0}</p>
                <p className="text-xs text-gray-500">Horas disponíveis</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-600">Saldo Acumulado</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm p-4">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">Como funciona o Saldo Acumulado:</p>
                          <div className="text-xs space-y-1">
                            <p><strong>Regra:</strong> Saldo do mês atual + saldos de todos os meses anteriores dentro do período de vigência.</p>
                            <div className="mt-2 space-y-1">
                              <p><strong>Exemplo 1 (Saldo Positivo):</strong></p>
                              <p>• Setembro: 25:30 contratadas - 21:20 consumidas = +4:10</p>
                              <p>• Outubro: 25:30 + 4:10 = 29:40 disponíveis</p>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p><strong>Exemplo 2 (Saldo Negativo):</strong></p>
                              <p>• Setembro: 25:30 contratadas - 30:30 consumidas = -5:00</p>
                              <p>• Outubro: 25:30 - 5:00 = 20:30 disponíveis</p>
                            </div>
                            <p className="mt-2 text-gray-500"><strong>Nota:</strong> Considera apenas meses dentro do período de vigência do contrato.</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metricas?.saldoAcumulado || '00:00'}</p>
                <p className="text-xs text-gray-500">Horas disponíveis</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chamados por categoria - seguindo identidade visual */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">Chamados por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {calcularCategorias(filteredChamados).map((categoria, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${categoria.cor}`}></div>
                <p className="text-sm font-medium text-gray-900">{categoria.nome}</p>
                <p className="text-lg font-bold text-gray-900">{categoria.quantidade}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de chamados - seguindo identidade visual */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">Lista de Chamados</CardTitle>
          <div className="flex space-x-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por assunto ou id" 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os categoria</SelectItem>
                <SelectItem value="Bugs">Bug</SelectItem>
                <SelectItem value="Processo">Processo</SelectItem>
                <SelectItem value="Solicitação">Solicitação</SelectItem>
                <SelectItem value="Ajuste">Ajuste</SelectItem>
                <SelectItem value="Falha Sistêmica">Falha Sistêmica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Não iniciado">Não iniciado</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Resolvido">Resolvido</SelectItem>
                <SelectItem value="Aguardando">Aguardando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="font-semibold text-gray-900">Id Ellevo</TableHead>
                <TableHead className="font-semibold text-gray-900">Qual automação</TableHead>
                <TableHead className="font-semibold text-gray-900">Assunto</TableHead>
                <TableHead className="font-semibold text-gray-900">Categoria</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Solicitante</TableHead>
                <TableHead className="font-semibold text-gray-900">Data da Abertura</TableHead>
                <TableHead className="font-semibold text-gray-900">Data da resolução</TableHead>
                <TableHead className="font-semibold text-gray-900">Tempo de Atendimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChamados.map((chamado, index) => (
                <TableRow key={index} className="border-gray-200 hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-gray-900">{chamado.idEllevo}</TableCell>
                  <TableCell className="text-gray-700">{chamado.automacao}</TableCell>
                  <TableCell className="text-gray-700">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {truncateText(chamado.assunto)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{chamado.assunto}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${
                        chamado.categoria === 'Bug' || chamado.categoria === 'Bugs' ? 'border-red-200 text-red-700 bg-red-50' :
                        chamado.categoria === 'Processo' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        chamado.categoria === 'Solicitação' ? 'border-green-200 text-green-700 bg-green-50' :
                        chamado.categoria === 'Ajuste' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                        chamado.categoria === 'Falha Sistêmica' || chamado.categoria === 'Falha Sistema' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                        'border-gray-200 text-gray-700 bg-gray-50'
                      }`}
                    >
                      {chamado.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`${
                        chamado.status === 'Resolvido' ? 'border-green-200 text-green-700 bg-green-50' :
                        chamado.status === 'Resolvido' || chamado.status === 'RESOLVED' ? 'border-green-200 text-green-700 bg-green-50' :
                        chamado.status === 'Não iniciado' ? 'border-gray-200 text-gray-700 bg-gray-50' :
                        'border-yellow-200 text-yellow-700 bg-yellow-50'
                      }`}
                    >
                      {chamado.status === 'RESOLVED' ? 'Resolvido' : chamado.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">{chamado.solicitante}</TableCell>
                  <TableCell className="text-gray-700">{chamado.dataAbertura}</TableCell>
                  <TableCell className="text-gray-700">{chamado.dataResolucao}</TableCell>
                  <TableCell className="text-gray-700 text-center">
                    {chamado.tempoAtendimento || '00:00:00'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}