"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Building2, Clock, Calendar, History, Plus } from "lucide-react";
import { ConfigHistory } from "@/components/sustentacao/config-history";
import { EmpresaConfigForm } from "@/components/sustentacao/empresa-config-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface CompanyConfig {
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

export default function ConfiguracaoEmpresa() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true); // Sempre mostrar histórico
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  
  // Estados para modal de confirmação
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default' as 'default' | 'destructive'
  });

  // Formulário
  const [horasContratadas, setHorasContratadas] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [saldoNegativo, setSaldoNegativo] = useState(false);

  // Funções utilitárias para conversão de horas
  const converterDecimalParaRelogio = (decimal: number): string => {
    const horas = Math.floor(decimal);
    const minutos = Math.round((decimal - horas) * 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  };

  const converterRelogioParaDecimal = (relogio: string): number => {
    if (!relogio || !relogio.includes(':')) {
      return 0;
    }
    const [horas, minutos] = relogio.split(':').map(Number);
    return horas + (minutos / 60);
  };

  const validarFormatoRelogio = (valor: string): boolean => {
    const regex = /^(\d{1,2}):([0-5]\d)$/;
    return regex.test(valor);
  };

  // Função helper para mostrar modal de confirmação
  const showConfirmation = (
    title: string,
    description: string,
    onConfirm: () => void,
    variant: 'default' | 'destructive' = 'default'
  ) => {
    setConfirmationDialog({
      open: true,
      title,
      description,
      onConfirm,
      variant
    });
  };

  const isConfigExpired = (dataFim: string): boolean => {
    const hoje = new Date();
    const fim = new Date(dataFim + 'T00:00:00');
    return fim < hoje;
  };

  useEffect(() => {
    if (companyId) {
      loadConfig();
    }
  }, [companyId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sustentacao/config-empresa?companyId=${companyId}`);
      const result = await response.json();

      if (result.success) {
        if (result.data) {
          // Há configuração ativa
          const configData = result.data;
          setConfig(configData);
          // Converter decimal para formato de relógio
          setHorasContratadas(converterDecimalParaRelogio(configData.horas_contratadas || 0));
          setDataInicio(configData.data_inicio || "");
          setDataFim(configData.data_fim || "");
          setSaldoNegativo(configData.saldo_negativo || false);
        } else {
          // Não há configuração ativa
          setConfig(null);
          setHorasContratadas("");
          setDataInicio("");
          setDataFim("");
          setSaldoNegativo(false);
        }
      } else {
        setError("Erro ao carregar configuração: " + (result.error || "Erro desconhecido"));
      }
    } catch (err: any) {
      setError("Erro ao carregar configuração: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!horasContratadas || !dataInicio || !dataFim) {
      setError("Todos os campos são obrigatórios.");
      setSaving(false);
      return;
    }

    // Validar formato de relógio (HH:MM)
    if (!validarFormatoRelogio(horasContratadas)) {
      setError("Horas Contratadas deve estar no formato HH:MM (ex: 90:30).");
      setSaving(false);
      return;
    }

    // Converter formato de relógio para decimal
    const horas = converterRelogioParaDecimal(horasContratadas);
    if (horas <= 0) {
      setError("Horas Contratadas deve ser maior que zero.");
      setSaving(false);
      return;
    }

    try {
      const configData = {
        companyId,
        horasContratadas: horas,
        dataInicio,
        dataFim,
        saldoNegativo
      };

      const response = await fetch('/api/sustentacao/config-empresa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar configuração.');
      }

      setSuccess('Configuração atualizada com sucesso!');
      setConfig(result.data);
      
      // Redirecionar para tela de seleção após 2 segundos
      setTimeout(() => {
        router.push('/admin/sustentacao');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar configuração.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Tem certeza que deseja inativar esta configuração? Ela não será mais usada para cálculos.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/sustentacao/config-empresa/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao inativar configuração.');
      }

      setSuccess('Configuração inativada com sucesso!');
      setConfig(result.data);
      
      // Recarregar dados após 2 segundos
      setTimeout(() => {
        loadConfig();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao inativar configuração.');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirm('Tem certeza que deseja reativar esta configuração? Ela voltará a ser usada para cálculos.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/sustentacao/config-empresa/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao reativar configuração.');
      }

      setSuccess('Configuração reativada com sucesso!');
      setConfig(result.data);
      
      // Recarregar dados após 2 segundos
      setTimeout(() => {
        loadConfig();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reativar configuração.');
    } finally {
      setSaving(false);
    }
  };

  // Funções para callbacks do histórico


  const handleDeactivateConfig = async (configId: string) => {
    showConfirmation(
      'Inativar Configuração',
      'Tem certeza que deseja inativar esta configuração? Ela não será mais usada para cálculos.',
      async () => {
        try {
          setSaving(true);
          setError(null);

          const response = await fetch('/api/sustentacao/config-empresa/deactivate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ configId }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Erro ao inativar configuração.');
          }

          setSuccess('Configuração inativada com sucesso!');
          await loadConfig(); // Recarregar dados
        } catch (err: any) {
          setError(err.message || 'Erro ao inativar configuração.');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleReactivateConfig = async (configId: string) => {
    showConfirmation(
      'Reativar Configuração',
      'Tem certeza que deseja reativar esta configuração? Ela voltará a ser usada para cálculos.',
      async () => {
        try {
          setSaving(true);
          setError(null);

          const response = await fetch('/api/sustentacao/config-empresa/reactivate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ configId }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Erro ao reativar configuração.');
          }

          setSuccess('Configuração reativada com sucesso!');
          await loadConfig(); // Recarregar dados
        } catch (err: any) {
          setError(err.message || 'Erro ao reativar configuração.');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleDeleteConfig = async (configId: string) => {
    showConfirmation(
      'Excluir Configuração',
      'Tem certeza que deseja excluir esta configuração? Esta ação não pode ser desfeita.',
      async () => {
        try {
          setSaving(true);
          setError(null);

          const response = await fetch('/api/sustentacao/config-empresa', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ configId }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Erro ao excluir configuração.');
          }

          setSuccess('Configuração excluída com sucesso!');
          await loadConfig(); // Recarregar dados
        } catch (err: any) {
          setError(err.message || 'Erro ao excluir configuração.');
        } finally {
          setSaving(false);
        }
      },
      'destructive'
    );
  };

  const handleDelete = async () => {
    showConfirmation(
      'Excluir Configuração',
      'Tem certeza que deseja excluir esta configuração? Esta ação não pode ser desfeita.',
      async () => {
        try {
          setSaving(true);
          setError(null);

          const response = await fetch('/api/sustentacao/config-empresa', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ configId: config?.id }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Erro ao excluir configuração.');
          }

          setSuccess('Configuração excluída com sucesso!');
          await loadConfig(); // Recarregar dados
          
          // Voltar para a lista após 2 segundos
          setTimeout(() => {
            router.push('/admin/sustentacao');
          }, 2000);
        } catch (err: any) {
          setError(err.message || 'Erro ao excluir configuração.');
        } finally {
          setSaving(false);
        }
      },
      'destructive'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configuração...</p>
        </div>
      </div>
    );
  }

  // Remover a verificação que impede a renderização quando config é null
  // A página deve sempre mostrar o histórico, mesmo sem configuração ativa

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuração de Sustentação</h2>
          <p className="text-gray-600">Configure as horas contratadas e período de vigência</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/sustentacao')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Informações da Empresa */}
      {config ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>{config.companies.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Criado em:</span>
                <span>{new Date(config.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Última atualização:</span>
                <span>{new Date(config.updated_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isConfigExpired(config.data_fim) 
                    ? 'bg-red-100 text-red-800' 
                    : config.status === 'ativo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isConfigExpired(config.data_fim) ? 'Expirado' : config.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              <span>Nenhuma configuração ativa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Esta empresa não possui configuração ativa de sustentação.</p>
              <p className="text-sm text-gray-500">Use o botão "Nova Configuração" abaixo para criar uma nova configuração.</p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Histórico de Configurações */}
      {showHistory && (
        <Card>
          <CardContent className="pt-6">
            <ConfigHistory 
              companyId={companyId}
              onNewConfig={() => {
                setShowNewConfigForm(true);
                setEditingConfigId(null);
              }}
              onEditConfig={(configId) => {
                setEditingConfigId(configId);
                setShowNewConfigForm(true);
              }}
              onDeactivateConfig={handleDeactivateConfig}
              onReactivateConfig={handleReactivateConfig}
              onDeleteConfig={handleDeleteConfig}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, open }))}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        onConfirm={confirmationDialog.onConfirm}
        variant={confirmationDialog.variant}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}