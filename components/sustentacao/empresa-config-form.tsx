"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Save, Settings, Info, CheckCircle, XCircle, Building2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface EmpresaConfigFormProps {
  companyId: string;
  configId?: string;
  onConfigSaved: () => void;
}

// ID da Copersucar (empresa que usa hardcoded)
const COPERSUCAR_ID = '443a6a0e-768f-48e4-a9ea-0cd972375a30';

export function EmpresaConfigForm({ companyId, configId, onConfigSaved }: EmpresaConfigFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId);
  const [horasContratadas, setHorasContratadas] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [saldoNegativo, setSaldoNegativo] = useState(false);
  const [googleSheetsSpreadsheetId, setGoogleSheetsSpreadsheetId] = useState('');
  const [googleSheetsTab, setGoogleSheetsTab] = useState('Página1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verificar se é a Copersucar (usa hardcoded)
  const isCopersucar = selectedCompanyId === COPERSUCAR_ID;

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

  // Carregar empresas disponíveis
  useEffect(() => {
    loadCompanies();
  }, []);

  // Atualizar empresa selecionada quando companyId muda
  useEffect(() => {
    console.log('🔧 Atualizando empresa selecionada para:', companyId);
    setSelectedCompanyId(companyId);
  }, [companyId]);

  // Carregar configuração existente se configId for fornecido
  useEffect(() => {
    console.log('🔧 EmpresaConfigForm - configId:', configId, 'companyId:', companyId);
    if (configId) {
      loadExistingConfig();
    } else {
      // Limpar campos para nova configuração
      console.log('🔧 Limpando campos para nova configuração');
      setHorasContratadas("");
      setDataInicio("");
      setDataFim("");
      setSaldoNegativo(false);
    }
  }, [configId]);

  const loadCompanies = async () => {
    try {
      // Buscar empresas do banco de dados
      const response = await fetch('/api/companies');
      if (response.ok) {
        const result = await response.json();
        setCompanies(result.data || []);
      } else {
        // Fallback para dados mockados
        setCompanies([
          { id: 'copersucar', name: 'Copersucar' },
          { id: 'empresa2', name: 'Empresa ABC' },
          { id: 'empresa3', name: 'Empresa XYZ' }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      // Fallback para dados mockados
      setCompanies([
        { id: 'copersucar', name: 'Copersucar' },
        { id: 'empresa2', name: 'Empresa ABC' },
        { id: 'empresa3', name: 'Empresa XYZ' }
      ]);
    }
  };

  const loadExistingConfig = async () => {
    try {
      // Se temos configId, buscar configuração específica
      if (configId) {
        console.log('🔧 Carregando configuração específica:', configId);
        const response = await fetch(`/api/sustentacao/config-empresa/${configId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const config = result.data;
            console.log('🔧 Configuração carregada:', config);
            setHorasContratadas(converterDecimalParaRelogio(config.horas_contratadas || 0));
            setDataInicio(config.data_inicio || '');
            setDataFim(config.data_fim || '');
            setSaldoNegativo(config.saldo_negativo || false);
          }
        }
      } else {
        // Buscar configuração ativa da empresa
        console.log('🔧 Carregando configuração ativa da empresa:', companyId);
        const response = await fetch(`/api/sustentacao/config-empresa?companyId=${companyId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const config = result.data;
            console.log('🔧 Configuração ativa carregada:', config);
            setHorasContratadas(converterDecimalParaRelogio(config.horas_contratadas || 0));
            setDataInicio(config.data_inicio || '');
            setDataFim(config.data_fim || '');
            setSaldoNegativo(config.saldo_negativo || false);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração existente:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validações
      if (!selectedCompanyId) {
        throw new Error('Selecione uma empresa');
      }
      if (!horasContratadas) {
        throw new Error('Horas contratadas é obrigatório');
      }
      if (!validarFormatoRelogio(horasContratadas)) {
        throw new Error('Horas contratadas deve estar no formato HH:MM (ex: 90:30)');
      }
      if (converterRelogioParaDecimal(horasContratadas) <= 0) {
        throw new Error('Horas contratadas deve ser maior que zero');
      }
      if (!dataInicio) {
        throw new Error('Data de início é obrigatória');
      }
      if (!dataFim) {
        throw new Error('Data de fim é obrigatória');
      }
      if (new Date(dataFim) <= new Date(dataInicio)) {
        throw new Error('Data de fim deve ser posterior à data de início');
      }

      console.log('💾 Salvando configuração de empresa:', {
        companyId: selectedCompanyId,
        horasContratadas,
        dataInicio,
        dataFim,
        saldoNegativo
      });

      // Determinar se é criação ou edição
      const isEdit = !!configId; // Se configId está definido, é edição
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit 
        ? `/api/sustentacao/config-empresa?configId=${configId}`
        : '/api/sustentacao/config-empresa';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          horasContratadas: converterRelogioParaDecimal(horasContratadas),
          dataInicio,
          dataFim,
          saldoNegativo,
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Se não for Copersucar e tiver dados do Google Sheets, salvar configuração da planilha
        if (!isCopersucar && googleSheetsSpreadsheetId) {
          try {
            const googleSheetsResponse = await fetch('/api/sustentacao/google-sheets-config', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                companyId: selectedCompanyId,
                spreadsheetId: googleSheetsSpreadsheetId,
                tabName: googleSheetsTab
              })
            });

            const googleSheetsResult = await googleSheetsResponse.json();
            
            if (googleSheetsResult.success) {
              console.log('✅ Configuração do Google Sheets salva:', googleSheetsResult.data);
            } else {
              console.warn('⚠️ Erro ao salvar configuração do Google Sheets:', googleSheetsResult.error);
            }
          } catch (error) {
            console.warn('⚠️ Erro ao salvar configuração do Google Sheets:', error);
          }
        }

        setSuccess(true);
        console.log('✅ Configuração salva:', result.data);
        
        // Aguardar um pouco e chamar callback
        setTimeout(() => {
          onConfigSaved();
        }, 1500);
      } else {
        throw new Error(result.error || 'Erro ao salvar configuração');
      }

    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const formatHoras = (value: string) => {
    // Converter para formato HH:MM se necessário
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    const horas = Math.floor(num);
    const minutos = Math.round((num - horas) * 60);
    return `${horas}:${minutos.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Informações sobre a configuração */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Configuração de Sustentação:</strong> Configure as horas contratadas e o período de vigência. 
          O sistema calculará automaticamente os saldos mensais.
        </AlertDescription>
      </Alert>

      {/* Formulário de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuração da Empresa</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Empresa */}
          <div className="space-y-2">
            <Label htmlFor="empresa" className="text-sm font-medium">
              Empresa
            </Label>
            <Select 
              value={selectedCompanyId} 
              onValueChange={setSelectedCompanyId}
              disabled={!!companyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>{company.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horas Contratadas */}
          <div className="space-y-2">
            <Label htmlFor="horasContratadas" className="text-sm font-medium">
              Horas Contratadas por Mês
            </Label>
            <Input
              id="horasContratadas"
              type="text"
              value={horasContratadas}
              onChange={(e) => {
                let valor = e.target.value;
                // Permitir apenas números e dois pontos
                valor = valor.replace(/[^\d:]/g, '');
                // Limitar a 5 caracteres (HH:MM)
                if (valor.length <= 5) {
                  setHorasContratadas(valor);
                }
              }}
              placeholder="90:30"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Formato: HH:MM (ex: 90:30 para 90 horas e 30 minutos)
            </p>
          </div>

          {/* Período de Vigência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio" className="text-sm font-medium">
                Data de Início
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataFim" className="text-sm font-medium">
                Data de Fim
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Saldo Negativo */}
          <div className="space-y-2">
            <Label htmlFor="saldoNegativo" className="text-sm font-medium">
              Permitir Saldo Negativo
            </Label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="saldoNegativo"
                checked={saldoNegativo}
                onChange={(e) => setSaldoNegativo(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">
                {saldoNegativo ? 'Sim' : 'Não'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {saldoNegativo 
                ? 'Permite que o saldo seja negativo (ex: -5h para próximo mês)'
                : 'Saldo nunca será negativo (mínimo 0h para próximo mês)'
              }
            </p>
          </div>

          {/* Configuração do Google Sheets - Apenas para empresas que não sejam Copersucar */}
          {!isCopersucar && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Configuração do Google Sheets</h4>
              </div>
              <p className="text-sm text-blue-700">
                Configure a planilha do Google Sheets para esta empresa. A Copersucar usa configuração automática.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleSheetsSpreadsheetId" className="text-sm font-medium text-gray-700">
                    ID da Planilha do Google Sheets
                  </Label>
                  <Input
                    id="googleSheetsSpreadsheetId"
                    type="text"
                    value={googleSheetsSpreadsheetId}
                    onChange={(e) => setGoogleSheetsSpreadsheetId(e.target.value)}
                    placeholder="Ex: 1lJjoUifFO43gTHBrRkM3V_K13O1hV1Bz5Br7e0IIQtE"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    ID encontrado na URL da planilha (parte após /d/)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="googleSheetsTab" className="text-sm font-medium text-gray-700">
                    Nome da Aba
                  </Label>
                  <Input
                    id="googleSheetsTab"
                    type="text"
                    value={googleSheetsTab}
                    onChange={(e) => setGoogleSheetsTab(e.target.value)}
                    placeholder="Ex: Página1"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Nome da aba da planilha (padrão: Página1)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Explicação da Lógica */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Como Funciona:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Período:</strong> {dataInicio && dataFim ? `${dataInicio} até ${dataFim}` : 'Defina o período'}</li>
              <li>• <strong>Horas Mensais:</strong> {horasContratadas || '0'}h por mês</li>
              <li>• <strong>Saldo:</strong> Horas Contratadas + Saldo Anterior - Horas Consumidas</li>
              <li>• <strong>Próximo Mês:</strong> Saldo atual {saldoNegativo ? '(pode ser negativo)' : '(mínimo 0h)'}</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Limpar formulário
                setHorasContratadas("");
                setDataInicio("");
                setDataFim("");
                setSaldoNegativo(false);
                setGoogleSheetsSpreadsheetId("");
                setGoogleSheetsTab("Página1");
                setError(null);
                setSuccess(false);
              }}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>

          {/* Mensagens de Erro/Sucesso */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Configuração salva com sucesso! Redirecionando...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}