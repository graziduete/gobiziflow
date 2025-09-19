"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { History, Calendar, Clock, Settings, Plus, CheckCircle, XCircle, Edit, Trash2, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmpresaConfigForm } from "./empresa-config-form";

interface ConfigHistory {
  id: string;
  company_id: string;
  horas_contratadas: number;
  data_inicio: string;
  data_fim: string;
  saldo_negativo: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  companies: {
    id: string;
    name: string;
  };
}

interface ConfigHistoryProps {
  companyId: string;
  onNewConfig: () => void;
  onEditConfig?: (configId: string) => void;
  onDeactivateConfig?: (configId: string) => void;
  onReactivateConfig?: (configId: string) => void;
  onDeleteConfig?: (configId: string) => void;
}

export function ConfigHistory({ 
  companyId, 
  onNewConfig, 
  onEditConfig, 
  onDeactivateConfig, 
  onReactivateConfig, 
  onDeleteConfig 
}: ConfigHistoryProps) {
  const [configs, setConfigs] = useState<ConfigHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<ConfigHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewConfigModalOpen, setIsNewConfigModalOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [companyId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sustentacao/config-empresa/historico?companyId=${companyId}`);
      const result = await response.json();

      if (result.success) {
        setConfigs(result.data);
      } else {
        setError(result.error || 'Erro ao carregar histórico');
      }
    } catch (err: any) {
      setError('Erro ao carregar histórico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const converterDecimalParaRelogio = (decimal: number): string => {
    const horas = Math.floor(decimal);
    const minutos = Math.round((decimal - horas) * 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  };

  const formatarData = (data: string): string => {
    try {
      // Se a data já tem formato ISO completo, usar diretamente
      if (data.includes('T') || data.includes('Z')) {
        return new Date(data).toLocaleDateString('pt-BR');
      }
      // Se é apenas data (YYYY-MM-DD), adicionar horário
      return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', data, error);
      return 'Data inválida';
    }
  };

  const isExpired = (dataFim: string): boolean => {
    const hoje = new Date();
    const fim = new Date(dataFim + 'T00:00:00');
    return fim < hoje;
  };

  const isActive = (status: string, dataFim: string): boolean => {
    return status === 'ativo' && !isExpired(dataFim);
  };

  const getConfigStatus = (status: string, dataFim: string): { label: string; color: string; bgColor: string } => {
    if (isExpired(dataFim)) {
      return { label: 'Expirado', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' };
    }
    if (status === 'ativo') {
      return { label: 'Ativo', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' };
    }
    return { label: 'Inativo', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' };
  };

  const handleEditConfig = (config: ConfigHistory) => {
    setEditingConfig(config);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingConfig(null);
  };

  const handleConfigSaved = () => {
    handleModalClose();
    loadHistory(); // Recarregar histórico
  };

  const handleNewConfig = () => {
    setIsNewConfigModalOpen(true);
  };

  const handleNewConfigModalClose = () => {
    setIsNewConfigModalOpen(false);
  };

  const handleNewConfigSaved = () => {
    handleNewConfigModalClose();
    loadHistory(); // Recarregar histórico
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Histórico de Configurações</h3>
        </div>
        <Button
          onClick={handleNewConfig}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma configuração encontrada</p>
            <p className="text-sm text-gray-500 mt-1">
              Clique em "Nova Configuração" para criar a primeira
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <Card 
              key={config.id} 
              className={`transition-all duration-200 ${
                isActive(config.status, config.data_fim) 
                  ? 'ring-2 ring-green-200 bg-green-50' 
                  : isExpired(config.data_fim)
                  ? 'ring-2 ring-red-200 bg-red-50'
                  : 'ring-1 ring-gray-200'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">
                      {converterDecimalParaRelogio(config.horas_contratadas)} por mês
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const status = getConfigStatus(config.status, config.data_fim);
                      return (
                        <Badge variant="outline" className={`${status.bgColor} ${status.color}`}>
                          {status.label === 'Expirado' ? (
                            <XCircle className="h-3 w-3 mr-1" />
                          ) : status.label === 'Ativo' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : null}
                          {status.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Período:</span>
                    <span className="font-medium">
                      {formatarData(config.data_inicio)} - {formatarData(config.data_fim)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Criado em:</span>
                    <span>{formatarData(config.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Saldo Negativo:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      config.saldo_negativo 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {config.saldo_negativo ? 'Permitido' : 'Não Permitido'}
                    </span>
                  </div>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  {!isExpired(config.data_fim) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditConfig(config)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Configuração expirada - apenas visualização
                    </div>
                  )}
                  
                  {config.status === 'ativo' && !isExpired(config.data_fim) && onDeactivateConfig && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeactivateConfig(config.id)}
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Inativar
                    </Button>
                  )}
                  
                  {config.status === 'inativo' && onReactivateConfig && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReactivateConfig(config.id)}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Reativar
                    </Button>
                  )}
                  
                  {onDeleteConfig && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteConfig(config.id)}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Configuração</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <EmpresaConfigForm 
              companyId={editingConfig.company_id}
              configId={editingConfig.id}
              onConfigSaved={handleConfigSaved}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Configuração */}
      <Dialog open={isNewConfigModalOpen} onOpenChange={setIsNewConfigModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Configuração</DialogTitle>
          </DialogHeader>
          <EmpresaConfigForm 
            companyId={companyId}
            onConfigSaved={handleNewConfigSaved}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}