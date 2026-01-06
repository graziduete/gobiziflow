"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Search, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, FileText, RefreshCw, Wifi, WifiOff, Info, Filter, Download } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { getMockSustentacaoData } from "@/lib/data/mock-sustentacao";
import { SustentacaoFilters } from "./filters";
import * as XLSX from 'xlsx';

// Função para converter decimal para formato HH:MM
const converterDecimalParaRelogio = (decimal: number): string => {
  if (isNaN(decimal) || decimal < 0) return '00:00';
  
  const horas = Math.floor(decimal);
  const minutos = Math.round((decimal - horas) * 60);
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
};


export function SustentacaoDashboard({ 
  companyId, 
  useV2 = false, 
  companyName,
  isClientView = false 
}: { 
  companyId: string; 
  useV2?: boolean;
  companyName?: string;
  isClientView?: boolean;
}) {
  const [chamados, setChamados] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [chamadosMesAnterior, setChamadosMesAnterior] = useState<any[]>([]); // Para comparação
  const [forceUpdate, setForceUpdate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState<boolean | null>(null); // null = verificando, true = tem config, false = não tem
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

  // Função para calcular mês anterior
  const getMesAnterior = (mes: number, ano: number) => {
    if (mes === 1) {
      return { mes: 12, ano: ano - 1 }
    }
    return { mes: mes - 1, ano }
  };

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
      
      // Usar URL relativa para evitar problemas de CORS
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiEndpoint = useV2 ? `${baseUrl}/api/sustentacao/chamados-v2` : `${baseUrl}/api/sustentacao/chamados`;
      
      console.log('🔧 [DEBUG] Dashboard config:', {
        useV2,
        companyId,
        apiEndpoint,
        filters
      });
      
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
        setHasConfig(true);
        console.log('✅ Dados do Google Sheets carregados!', {
          chamados: data.chamados.length,
          metricas: data.metricas,
          primeirosChamados: data.chamados.slice(0, 3).map((c: any) => c.idEllevo)
        });
        
        // Buscar dados do mês anterior para comparação (não bloqueia a UI)
        const mesAnterior = getMesAnterior(filters.mes, filters.ano);
        fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, filters: mesAnterior })
        })
          .then(res => res.ok ? res.json() : null)
          .then(dataAnterior => {
            if (dataAnterior?.chamados) {
              setChamadosMesAnterior(dataAnterior.chamados);
              console.log('✅ Dados do mês anterior carregados para comparação');
            }
          })
          .catch(err => console.log('⚠️ Não foi possível carregar mês anterior:', err));
        
        return;
      } else {
        const errorData = await response.json();
        
        // Verificar se é erro de configuração não encontrada
        if (response.status === 404 || 
            (errorData.message && errorData.message.includes('não possui configuração'))) {
          console.log('⚠️ Empresa não possui configuração de sustentação');
          setHasConfig(false);
          return;
        }
        
        // Para outros erros, logar detalhes
        console.error('❌ Erro na API:', errorData);
        console.error('❌ Status:', response.status);
      }
      
      // Fallback para dados mockados apenas se não for erro de configuração
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
      setHasConfig(true); // Dados mockados disponíveis
      
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

  const handleFilterChange = (key: string, value: string) => {
    let processedValue: string | number = value === 'all' ? '' : value;
    
    // Converter para número se for mês ou ano
    if (key === 'mes' && processedValue !== '') {
      processedValue = parseInt(processedValue as string);
    } else if (key === 'ano' && processedValue !== '') {
      processedValue = parseInt(processedValue as string);
    }
    
    const newFilters = { ...filters, [key]: processedValue };
    setFilters(newFilters);
  };

  // Definição de ordem fixa das categorias (por criticidade)
  const ORDEM_CATEGORIAS = [
    { 
      nome: 'Bug', 
      alias: ['Bug', 'Bugs'], 
      cor: 'bg-red-500',
      corTexto: 'text-red-600',
      corFundo: 'from-red-50 to-red-100',
      emoji: '🔴',
      descricao: 'Problemas críticos que afetam funcionalidades'
    },
    { 
      nome: 'Ajuste', 
      alias: ['Ajuste'], 
      cor: 'bg-yellow-500',
      corTexto: 'text-yellow-600',
      corFundo: 'from-yellow-50 to-yellow-100',
      emoji: '🟡',
      descricao: 'Ajustes e correções finas'
    },
    { 
      nome: 'Falha Sistêmica', 
      alias: ['Falha Sistêmica', 'Falha Sistemica', 'Falha Sistema'], // COM e SEM acento
      cor: 'bg-purple-500',
      corTexto: 'text-purple-600',
      corFundo: 'from-purple-50 to-purple-100',
      emoji: '🟣',
      descricao: 'Falhas estruturais do sistema'
    },
    { 
      nome: 'Solicitação', 
      alias: ['Solicitação'], 
      cor: 'bg-green-500',
      corTexto: 'text-green-600',
      corFundo: 'from-green-50 to-green-100',
      emoji: '🟢',
      descricao: 'Novas funcionalidades e melhorias'
    },
    { 
      nome: 'Processo', 
      alias: ['Processo'], 
      cor: 'bg-blue-500',
      corTexto: 'text-blue-600',
      corFundo: 'from-blue-50 to-blue-100',
      emoji: '🔵',
      descricao: 'Mudanças de processo e fluxo'
    }
  ];

  // Calcular variação entre mês atual e anterior
  const calcularVariacao = (quantidadeAtual: number, quantidadeAnterior: number, tipoCategoria: 'problema' | 'neutro') => {
    if (quantidadeAnterior === 0 && quantidadeAtual === 0) {
      return null; // Ambos zero, sem variação relevante
    }
    
    if (quantidadeAnterior === 0 && quantidadeAtual > 0) {
      return { 
        percentual: 100, 
        tendencia: 'up' as const, 
        diferenca: quantidadeAtual,
        novo: true 
      };
    }
    
    const diferenca = quantidadeAtual - quantidadeAnterior;
    const percentual = Math.round((diferenca / quantidadeAnterior) * 100);
    
    let tendencia: 'up' | 'down' | 'stable' = 'stable';
    if (diferenca > 0) tendencia = 'up';
    else if (diferenca < 0) tendencia = 'down';
    
    // Determinar se é bom ou ruim baseado no tipo
    let colorClass = 'text-gray-500';
    if (tendencia !== 'stable') {
      if (tipoCategoria === 'problema') {
        // Bug, Ajuste, Falha: aumentar é ruim, diminuir é bom
        colorClass = tendencia === 'up' ? 'text-red-600' : 'text-green-600';
      } else {
        // Solicitação, Processo: neutro (azul)
        colorClass = 'text-blue-600';
      }
    }
    
    return {
      percentual: Math.abs(percentual),
      tendencia,
      diferenca,
      colorClass,
      novo: false
    };
  };

  // Calcular categorias baseado nos chamados filtrados COM ORDEM FIXA E COMPARAÇÃO
  const calcularCategorias = (chamadosList: any[], chamadosMesAnteriorList: any[] = []) => {
    // Contar chamados por categoria (mês atual)
    const categoriaCount: { [key: string]: number } = {};
    chamadosList.forEach(chamado => {
      const cat = chamado.categoria;
      categoriaCount[cat] = (categoriaCount[cat] || 0) + 1;
    });
    
    // Contar chamados por categoria (mês anterior)
    const categoriaCountAnterior: { [key: string]: number } = {};
    chamadosMesAnteriorList.forEach(chamado => {
      const cat = chamado.categoria;
      categoriaCountAnterior[cat] = (categoriaCountAnterior[cat] || 0) + 1;
    });
    
    // Retornar na ordem fixa definida com comparação
    return ORDEM_CATEGORIAS.map(catConfig => {
      // Somar quantidade de todos os alias (mês atual)
      const quantidade = catConfig.alias.reduce((total, alias) => {
        return total + (categoriaCount[alias] || 0);
      }, 0);
      
      // Somar quantidade de todos os alias (mês anterior)
      const quantidadeAnterior = catConfig.alias.reduce((total, alias) => {
        return total + (categoriaCountAnterior[alias] || 0);
      }, 0);
      
      // Determinar se é problema ou neutro
      const tipoCategoria = ['Bug', 'Ajuste', 'Falha Sistêmica'].includes(catConfig.nome) ? 'problema' : 'neutro';
      
      // Calcular variação
      const variacao = calcularVariacao(quantidade, quantidadeAnterior, tipoCategoria);
      
      return {
        nome: catConfig.nome,
        quantidade,
        quantidadeAnterior,
        cor: catConfig.cor,
        corTexto: catConfig.corTexto,
        corFundo: catConfig.corFundo,
        emoji: catConfig.emoji,
        descricao: catConfig.descricao,
        temChamados: quantidade > 0,
        variacao
      };
    });
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
      // Mapear valores do filtro para valores reais (incluindo com/sem acento)
      const categoriaMap: { [key: string]: string[] } = {
        'Bugs': ['Bug', 'Bugs'],
        'Processo': ['Processo'],
        'Solicitação': ['Solicitação', 'Solicitacao'], // COM e SEM acento
        'Ajuste': ['Ajuste'],
        'Falha Sistêmica': ['Falha Sistêmica', 'Falha Sistemica', 'Falha Sistema'] // COM e SEM acento
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

  // Função para exportar chamados para Excel
  const handleExportToExcel = useCallback(() => {
    if (filteredChamados.length === 0) {
      alert('Não há chamados para exportar.');
      return;
    }

    // Preparar dados para exportação
    const exportData = filteredChamados.map(chamado => {
      return {
        'ID Ellevo': chamado.idEllevo || 'Não informado',
        'Automação': chamado.automacao || 'Não informado',
        'Assunto': chamado.assunto || 'Não informado',
        'Categoria': chamado.categoria || 'Não informado',
        'Status': chamado.status === 'RESOLVED' ? 'Resolvido' : chamado.status || 'Não informado',
        'Solicitante': chamado.solicitante || 'Não informado',
        'Data Abertura': chamado.dataAbertura || 'Não informado',
        'Data Resolução': chamado.dataResolucao || 'Não informado',
        'Tempo Atendimento': chamado.tempoAtendimento || '00:00:00'
      };
    });

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // ID Ellevo
      { wch: 20 }, // Automação
      { wch: 50 }, // Assunto
      { wch: 18 }, // Categoria
      { wch: 18 }, // Status
      { wch: 25 }, // Solicitante
      { wch: 15 }, // Data Abertura
      { wch: 15 }, // Data Resolução
      { wch: 18 }  // Tempo Atendimento
    ];

    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Chamados');

    // Gerar nome do arquivo com mês e ano
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = meses[filters.mes - 1] || 'Mês';
    const nomeEmpresa = companyName || 'Empresa';
    const fileName = `Chamados_${nomeEmpresa}_${nomeMes}_${filters.ano}.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
  }, [filteredChamados, filters, companyName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          {/* Animação de raio moderna */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Raio animado */}
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
              <path 
                d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                className="animate-pulse"
                style={{
                  stroke: 'url(#lightning-gradient-sustentacao)',
                  strokeWidth: 0.5,
                  fill: 'url(#lightning-gradient-sustentacao)',
                  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
                }}
              />
              <defs>
                <linearGradient id="lightning-gradient-sustentacao" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            {/* Círculo pulsante ao fundo */}
            <div className="absolute inset-0 -z-10 animate-ping opacity-20">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-700 mb-1">Carregando dados de sustentação...</p>
          <p className="text-sm text-slate-500">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Mostrar mensagem se não há configuração
  if (hasConfig === false) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl max-w-2xl w-full">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="bg-amber-50 border border-amber-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Sustentação não configurada
              </h3>
              <p className="text-lg text-slate-600 mb-2">
                Sua empresa ainda não possui uma planilha de sustentação configurada.
              </p>
              <p className="text-base text-slate-500 mb-8">
                Entre em contato com o administrador para configurar a sustentação da sua empresa.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">Informação:</strong> O dashboard de sustentação precisa de uma planilha do Google Sheets configurada para exibir dados de horas contratadas, consumidas e chamados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card unificado com filtros e controles */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {/* Lado esquerdo - Título */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Filtros e Controles
              </CardTitle>
            </div>
            
            {/* Lado direito - Controles Auto e Atualizar */}
            <div className="flex items-center gap-4">
              {/* Status da última atualização */}
              {lastUpdate && (
                <div className="text-sm text-slate-500">
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
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  autoRefresh 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-md' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
              </button>
              
              {/* Botão de atualização manual */}
              <button
                onClick={() => loadSustentacaoData(false)}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros de Período - linha separada */}
          <div className="flex items-center justify-end gap-6">
            {/* Filtro por Mês */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <Label className="text-sm font-semibold text-slate-700">
                Mês
              </Label>
              <Select
                value={filters.mes.toString()}
                onValueChange={(value) => handleFilterChange('mes', value)}
              >
                <SelectTrigger className="w-32 h-8 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Ano */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <Label className="text-sm font-semibold text-slate-700">
                Ano
              </Label>
              <Select
                value={filters.ano.toString()}
                onValueChange={(value) => handleFilterChange('ano', value)}
              >
                <SelectTrigger className="w-20 h-8 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200">
                  <SelectValue placeholder="2025" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de métricas principais - design modernizado */}
      <div className="grid grid-cols-4 gap-6">
        {/* Horas Contratadas */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-semibold text-slate-700">Horas Contratadas</p>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  {metricas?.horasContratadas || '00:00'}
                </p>
                <p className="text-xs text-slate-500 font-medium">Horas totais</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
            {/* Barra de progresso sutil */}
            <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-full"></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Horas Consumidas */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-700">Horas Consumidas</p>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-700 to-teal-800 bg-clip-text text-transparent">
                  {metricas?.horasConsumidas || 0}
                </p>
                <p className="text-xs text-slate-500 font-medium">Horas utilizadas</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
            {/* Barra de progresso sutil */}
            <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full w-full"></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Horas Restantes */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-semibold text-slate-700">Horas Restantes</p>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-700 to-red-800 bg-clip-text text-transparent">
                  {metricas?.horasRestantes || 0}
                </p>
                <p className="text-xs text-slate-500 font-medium">Horas disponíveis</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
            {/* Barra de progresso sutil */}
            <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full w-full"></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Saldo Acumulado */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                    <Clock className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Saldo Acumulado</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm p-4 bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm text-slate-800">Como funciona o Saldo Acumulado:</p>
                          <div className="text-xs space-y-1 text-slate-600">
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
                            <p className="mt-2 text-slate-500"><strong>Nota:</strong> Considera apenas meses dentro do período de vigência do contrato.</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-700 to-fuchsia-800 bg-clip-text text-transparent">
                  {metricas?.saldoAcumulado || '00:00'}
                </p>
                <p className="text-xs text-slate-500 font-medium">Horas disponíveis</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
            {/* Barra de progresso sutil */}
            <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chamados por categoria - design modernizado COM ORDEM FIXA */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                Chamados por Categoria
              </CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-help">
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs bg-slate-800 border-slate-700">
                  <p className="text-sm text-white">
                    <strong>Ordem por criticidade:</strong> Bug → Ajuste → Falha Sistêmica → Solicitação → Processo
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Clique em uma categoria para filtrar a lista abaixo
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-6">
            {calcularCategorias(filteredChamados, chamadosMesAnterior).map((categoria, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      onClick={() => {
                        if (categoria.temChamados) {
                          const categoriaNormalizada = categoria.nome === 'Bug' ? 'Bugs' : categoria.nome;
                          
                          // Toggle: se já está filtrado nessa categoria, volta para "all"
                          if (filterCategoria === categoriaNormalizada) {
                            setFilterCategoria('all');
                          } else {
                            setFilterCategoria(categoriaNormalizada);
                            // Scroll suave até a lista
                            setTimeout(() => {
                              const listaElement = document.querySelector('[data-lista-chamados]');
                              if (listaElement) {
                                listaElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }
                        }
                      }}
                      className={`text-center p-6 rounded-xl transition-all duration-300 relative ${
                        categoria.temChamados 
                          ? `bg-white/80 backdrop-blur-sm hover:shadow-lg hover:scale-105 cursor-pointer ${
                              // Borda colorida quando ATIVO
                              (filterCategoria === categoria.nome || (categoria.nome === 'Bug' && filterCategoria === 'Bugs'))
                                ? `border-3 ${categoria.cor.replace('bg-', 'border-')} shadow-xl scale-105`
                                : `border-2 ${categoria.cor.replace('bg-', 'border-')}/30 hover:${categoria.cor.replace('bg-', 'border-')}/60`
                            }` 
                          : 'bg-slate-50/40 border-2 border-slate-100/50 opacity-50 cursor-default'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-xl border-2 ${
                        categoria.temChamados 
                          ? `${categoria.cor.replace('bg-', 'border-')} bg-white` 
                          : 'bg-slate-100 border-slate-300'
                      }`}>
                        {categoria.temChamados && <span>{categoria.emoji}</span>}
                      </div>
                      <p className={`text-sm font-semibold mb-2 ${
                        categoria.temChamados ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {categoria.nome}
                      </p>
                      <p className={`text-2xl font-bold ${
                        categoria.temChamados 
                          ? 'text-slate-700' 
                          : 'text-slate-300'
                      }`}>
                        {categoria.quantidade}
                      </p>
                      
                      {/* Indicador de variação vs mês anterior */}
                      {categoria.variacao && !categoria.variacao.novo && (
                        <div className={`flex items-center justify-center gap-1 text-xs font-semibold mt-1 ${categoria.variacao.colorClass}`}>
                          {categoria.variacao.tendencia === 'up' && <TrendingUp className="w-3 h-3" />}
                          {categoria.variacao.tendencia === 'down' && <TrendingDown className="w-3 h-3" />}
                          {categoria.variacao.tendencia === 'stable' && <Minus className="w-3 h-3" />}
                          <span>
                            {categoria.variacao.tendencia === 'up' ? '+' : ''}
                            {categoria.variacao.tendencia === 'down' ? '-' : ''}
                            {categoria.variacao.percentual}%
                          </span>
                        </div>
                      )}
                      
                      {/* Badge "Novo" para primeira aparição */}
                      {categoria.variacao?.novo && (
                        <div className="flex items-center justify-center gap-1 text-xs font-semibold mt-1 text-blue-600">
                          <span className="inline-flex items-center gap-1">
                            ✨ Novo
                          </span>
                        </div>
                      )}
                      
                      {categoria.temChamados && (
                        <p className="text-xs mt-2">
                          {(filterCategoria === categoria.nome || (categoria.nome === 'Bug' && filterCategoria === 'Bugs')) ? (
                            <span className="font-bold text-slate-700">
                              ✓ Filtrado - Clique para mostrar todos
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              Clique para filtrar
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-700">
                    <div className="text-sm">
                      <p className="font-semibold text-white flex items-center gap-1">
                        {categoria.emoji} {categoria.nome}
                      </p>
                      <p className="text-slate-300 text-xs mt-1">{categoria.descricao}</p>
                      {categoria.temChamados ? (
                        <>
                          <p className="text-xs text-green-400 mt-1 font-medium">
                            ✓ {categoria.quantidade} chamado{categoria.quantidade !== 1 ? 's' : ''} neste período
                          </p>
                          {categoria.variacao && !categoria.variacao.novo && (
                            <p className={`text-xs mt-1 font-medium ${categoria.variacao.colorClass.replace('text-', 'text-')}`}>
                              {categoria.variacao.tendencia === 'up' ? '↗' : categoria.variacao.tendencia === 'down' ? '↘' : '→'} 
                              {' '}{categoria.variacao.tendencia === 'up' ? '+' : categoria.variacao.tendencia === 'down' ? '-' : ''}
                              {categoria.variacao.percentual}% vs mês anterior ({categoria.quantidadeAnterior} chamados)
                            </p>
                          )}
                          {categoria.variacao?.novo && (
                            <p className="text-xs mt-1 font-medium text-blue-400">
                              ✨ Primeira vez aparecendo (mês anterior: 0)
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-slate-400 mt-1">
                            Nenhum chamado neste período 🎉
                          </p>
                          {categoria.quantidadeAnterior > 0 && (
                            <p className="text-xs text-green-400 mt-1 font-medium">
                              ✓ Melhoria! Mês anterior: {categoria.quantidadeAnterior} chamados
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de chamados - design modernizado */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl" data-lista-chamados>
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Lista de Chamados
            </CardTitle>
          </div>
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por assunto ou ID" 
                className="pl-10 h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-48 h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="Bugs">🔴 Bug</SelectItem>
                <SelectItem value="Ajuste">🟡 Ajuste</SelectItem>
                <SelectItem value="Falha Sistêmica">🟣 Falha Sistêmica</SelectItem>
                <SelectItem value="Solicitação">🟢 Solicitação</SelectItem>
                <SelectItem value="Processo">🔵 Processo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 h-10 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200">
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
            <button
              onClick={handleExportToExcel}
              disabled={filteredChamados.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200/60 overflow-hidden">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200">
                  <TableHead className="font-semibold text-slate-700 w-20 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      ID Ellevo
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-24 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      Automação
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-48 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Assunto
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-28 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Categoria
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-24 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-40 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      Solicitante
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-32 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                      Data Abertura
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-32 py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                      Data Resolução
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-28 text-center py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Tempo Atendimento
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChamados.map((chamado, index) => (
                  <TableRow key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-200 group">
                    <TableCell className="font-medium text-slate-900 w-20 py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="font-mono text-sm">{chamado.idEllevo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 w-24 py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm">{chamado.automacao}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 min-w-48 py-4 px-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help group">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-sm truncate">
                                {truncateText(chamado.assunto)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl">
                            <p className="text-sm text-slate-800">{chamado.assunto}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="w-28 py-4 px-4">
                      <Badge 
                        variant="outline" 
                        className={`${
                          chamado.categoria === 'Bug' || chamado.categoria === 'Bugs' ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-sm border-0' :
                          chamado.categoria === 'Processo' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm border-0' :
                          chamado.categoria === 'Solicitação' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm border-0' :
                          chamado.categoria === 'Ajuste' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-sm border-0' :
                          chamado.categoria === 'Falha Sistêmica' || chamado.categoria === 'Falha Sistema' ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm border-0' :
                          'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm border-0'
                        }`}
                      >
                        {chamado.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-24 py-4 px-4">
                      <Badge 
                        variant="outline"
                        className={`${
                          chamado.status === 'Resolvido' || chamado.status === 'RESOLVED' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm border-0' :
                          chamado.status === 'Não iniciado' ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm border-0' :
                          chamado.status === 'Em andamento' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm border-0' :
                          chamado.status === 'Aguardando' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm border-0' :
                          'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-sm border-0'
                        }`}
                      >
                        {chamado.status === 'RESOLVED' ? 'Resolvido' : chamado.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700 w-40 py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                        <span className="text-sm truncate">{chamado.solicitante}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 w-32 py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                        <span className="text-sm">{chamado.dataAbertura}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 w-32 py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
                        <span className="text-sm">{chamado.dataResolucao}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 text-center w-28 py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-mono">{chamado.tempoAtendimento || '00:00:00'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}