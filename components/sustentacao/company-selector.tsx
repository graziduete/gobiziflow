"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, Clock, AlertCircle, Settings, Edit } from "lucide-react";
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
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
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecionar Empresa</h2>
        <p className="text-gray-600">Escolha a empresa para visualizar os dados de sustentação</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto">
        {companies.map((company) => (
          <Card 
            key={company.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedCompanyId === company.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => {
              // Clique no card vai para o dashboard da empresa específica
              onCompanySelect(company.id);
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                </div>
                       {company.sustentacaoConfig ? (
                         isConfigExpired(company.sustentacaoConfig.dataFim || '') ? (
                           <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                             <AlertCircle className="h-3 w-3 mr-1" />
                             Expirado
                           </Badge>
                         ) : company.sustentacaoConfig.status === 'inativo' ? (
                           <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
                             <AlertCircle className="h-3 w-3 mr-1" />
                             Inativo
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                             <CheckCircle className="h-3 w-3 mr-1" />
                             Configurado
                           </Badge>
                         )
                       ) : (
                         <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                           <AlertCircle className="h-3 w-3 mr-1" />
                           Não Configurado
                         </Badge>
                       )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {company.sustentacaoConfig ? (
                <div className="space-y-2">
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Horas Contratadas:</span>
                           <span className="font-medium">{converterDecimalParaRelogio(company.sustentacaoConfig.horasContratadas)}</span>
                         </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Período:</span>
                    <span className="text-xs text-gray-500">
                      {company.sustentacaoConfig.dataInicio && company.sustentacaoConfig.dataFim
                        ? `${new Date(company.sustentacaoConfig.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(company.sustentacaoConfig.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`
                        : 'Não definido'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Última Atualização:</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatLastSync(company.sustentacaoConfig.lastSync)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Nenhuma configuração
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Configure para usar
                  </p>
                </div>
              )}
              
              {/* Botões de ação */}
              <div className="mt-6 pt-4 border-t space-y-3">
                {company.sustentacaoConfig ? (
                  <>
                    {company.sustentacaoConfig.status === 'inativo' ? (
                      <Button
                        variant="outline"
                        size="default"
                        className="w-full h-10"
                        onClick={(e) => {
                          e.stopPropagation(); // Para a propagação do evento
                          window.location.href = `/admin/sustentacao/configuracao/${company.id}`;
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Reativar Configuração
                      </Button>
                    ) : (
                      <div className={isClientView ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2"}>
                        {!isClientView && (
                        <Button
                          variant="outline"
                          size="default"
                          className="h-10"
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
                          className="h-10"
                          onClick={(e) => {
                            e.stopPropagation(); // Para a propagação do evento
                            onCompanySelect(company.id);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Visualizar Dashboard
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full h-10"
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