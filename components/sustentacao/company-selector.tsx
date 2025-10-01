"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, Clock, AlertCircle, Settings, Edit, Sparkles, BarChart3, Calendar, Zap } from "lucide-react";
import { EmpresaConfigForm } from "./empresa-config-form";

interface Company {
  id: string;
  name: string;
  hasEllevoIntegration: boolean;
  sustentacaoConfig?: {
    id: string;
    horasContratadas: number;
    dataInicio?: string;
    dataFim?: string;
    lastSync?: string;
    status?: string;
  };
}

interface CompanySelectorProps {
  onCompanySelect: (companyId: string) => void;
  selectedCompanyId?: string;
  showConfig?: boolean;
  onConfigSaved?: () => void;
  isClientView?: boolean; // Nova prop para indicar se é visualização do cliente
  userCompanyId?: string; // ID da empresa do usuário para filtrar apenas ela
}

export function CompanySelector({ onCompanySelect, selectedCompanyId, showConfig, onConfigSaved, isClientView = false, userCompanyId }: CompanySelectorProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuringCompany, setConfiguringCompany] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  // Função para converter decimal para formato de relógio
  const converterDecimalParaRelogio = (decimal: number): string => {
    const horas = Math.floor(decimal);
    const minutos = Math.round((decimal - horas) * 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  };

  // Função para verificar se configuração está expirada
  const isConfigExpired = (dataFim: string): boolean => {
    const hoje = new Date();
    const fim = new Date(dataFim + 'T00:00:00');
    return fim < hoje;
  };


  useEffect(() => {
    // Cache de 30 segundos para evitar requisições desnecessárias
    const now = Date.now();
    if (now - lastLoadTime > 30000 || companies.length === 0) {
      loadCompanies();
    }
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      // Fazer requisições em paralelo para melhor performance
      const [companiesResponse, configsResponse] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/sustentacao/config-empresa/all')
      ]);
      
      const [companiesResult, configsResult] = await Promise.all([
        companiesResponse.json(),
        configsResponse.json()
      ]);
      
      if (companiesResult.success) {
        const allConfigs = configsResult.success ? configsResult.data : [];
        
        // Mapear empresas com configurações (pegar a mais recente de cada empresa)
        let companiesToProcess = companiesResult.data;
        
        // Se for visualização do cliente, filtrar apenas a empresa do usuário
        if (isClientView && userCompanyId) {
          companiesToProcess = companiesResult.data.filter((company: any) => company.id === userCompanyId);
          console.log('🔍 Modo cliente: filtrando apenas empresa do usuário:', userCompanyId);
        }
        
        const companiesWithConfig = companiesToProcess.map((company: any) => {
          const companyConfigs = allConfigs.filter((c: any) => c.company_id === company.id);
          // Pegar a configuração mais recente (primeira da lista ordenada por created_at DESC)
          const config = companyConfigs.length > 0 ? companyConfigs[0] : null;
          return {
            id: company.id,
            name: company.name,
            hasEllevoIntegration: false, // Por enquanto sempre false
            sustentacaoConfig: config ? {
              id: config.id,
              horasContratadas: config.horas_contratadas,
              dataInicio: config.data_inicio,
              dataFim: config.data_fim,
              lastSync: config.updated_at,
              status: config.status
            } : undefined
          };
        });
        
        setCompanies(companiesWithConfig);
        setLastLoadTime(Date.now());
      } else {
        console.error('Erro ao carregar empresas:', companiesResult.error);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return "Nunca sincronizado";
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Agora mesmo";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

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
                  stroke: 'url(#lightning-gradient)',
                  strokeWidth: 0.5,
                  fill: 'url(#lightning-gradient)',
                  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
                }}
              />
              <defs>
                <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          <p className="text-lg font-semibold text-slate-700 mb-1">Carregando empresas...</p>
          <p className="text-sm text-slate-500">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Se estiver configurando uma empresa, mostrar o formulário
  if (configuringCompany) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurar Sustentação</h2>
            <p className="text-gray-600">Configure a integração para {companies.find(c => c.id === configuringCompany)?.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setConfiguringCompany(null)}
          >
            ← Voltar
          </Button>
        </div>
        <EmpresaConfigForm 
          companyId={configuringCompany} 
          onConfigSaved={() => {
            setConfiguringCompany(null);
            onConfigSaved?.();
            loadCompanies(); // Recarregar dados
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto">
        {companies.map((company) => (
          <Card 
            key={company.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg ${
              selectedCompanyId === company.id 
                ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50/80 to-indigo-50/50' 
                : 'hover:bg-gradient-to-br hover:from-slate-50/50 hover:to-blue-50/30'
            }`}
            onClick={() => {
              // Clique no card vai para o dashboard da empresa específica
              onCompanySelect(company.id);
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
                    <Building2 className="h-5 w-5 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-800">{company.name}</CardTitle>
                </div>
                {company.sustentacaoConfig ? (
                  isConfigExpired(company.sustentacaoConfig.dataFim || '') ? (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-sm font-medium">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Expirado
                    </Badge>
                  ) : company.sustentacaoConfig.status === 'inativo' ? (
                    <Badge className="bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-sm font-medium">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  ) : (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configurado
                    </Badge>
                  )
                ) : (
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm font-medium">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Não Configurado
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {company.sustentacaoConfig ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md">
                        <Clock className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-slate-600 font-medium">Horas Contratadas:</span>
                    </div>
                    <span className="font-semibold text-slate-800">{converterDecimalParaRelogio(company.sustentacaoConfig.horasContratadas)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-md">
                        <Calendar className="h-3 w-3 text-indigo-600" />
                      </div>
                      <span className="text-slate-600 font-medium">Período:</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {company.sustentacaoConfig.dataInicio && company.sustentacaoConfig.dataFim
                        ? `${new Date(company.sustentacaoConfig.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(company.sustentacaoConfig.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`
                        : 'Não definido'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gradient-to-br from-green-100 to-green-200 rounded-md">
                        <Zap className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-slate-600 font-medium">Última Atualização:</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {formatLastSync(company.sustentacaoConfig.lastSync)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    Nenhuma configuração
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure para usar
                  </p>
                </div>
              )}
              
              {/* Botões de ação */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 space-y-3">
                {company.sustentacaoConfig ? (
                  <>
                    {company.sustentacaoConfig.status === 'inativo' ? (
                      <Button
                        variant="outline"
                        size="default"
                        className="w-full h-10 border-slate-300 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation(); // Para a propagação do evento
                          window.location.href = `/admin/sustentacao/configuracao/${company.id}`;
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Reativar Configuração
                      </Button>
                    ) : (
                      <div className={isClientView ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2"}>
                        {!isClientView && (
                        <Button
                          variant="outline"
                          size="default"
                          className="h-10 border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation(); // Para a propagação do evento
                            window.location.href = `/admin/sustentacao/configuracao/${company.id}`;
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="default"
                          className="h-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation(); // Para a propagação do evento
                            onCompanySelect(company.id);
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Visualizar Dashboard
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full h-10 border-slate-300 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation(); // Para a propagação do evento
                      setConfiguringCompany(company.id);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}