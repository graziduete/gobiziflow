"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Clock, Building2, Key, Upload } from "lucide-react";
import { SustentacaoService } from "@/lib/services/sustentacao/sustentacao.service";
import { SustentacaoProviderFactory } from "@/lib/providers/sustentacao-provider.factory";

interface ConfigFormProps {
  companyId: string;
  onConfigSaved?: () => void;
}

export function ConfigForm({ companyId, onConfigSaved }: ConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Estados para diferentes tipos de provedor
  const [providerType, setProviderType] = useState<'ellevo' | 'planilha' | 'outro'>('ellevo');
  const [horasContratadas, setHorasContratadas] = useState(0);
  
  // Configurações específicas do Ellevo
  const [ellevoConfig, setEllevoConfig] = useState({
    subdomain: '',
    token: '',
    clienteEllevo: '',
    useOAuth: false,
    clientId: '',
    clientSecret: ''
  });
  
  // Configurações específicas da Planilha
  const [planilhaConfig, setPlanilhaConfig] = useState({
    filePath: '',
    sheetName: 'Chamados'
  });

  const sustentacaoService = new SustentacaoService();

  useEffect(() => {
    loadExistingConfig();
  }, [companyId]);

  const loadExistingConfig = async () => {
    try {
      const config = await sustentacaoService.getConfigByCompany(companyId);
      if (config) {
        setProviderType(config.providerType);
        setHorasContratadas(config.horasContratadas);
        
        if (config.providerType === 'ellevo') {
          setEllevoConfig({ ...ellevoConfig, ...config.config });
        } else if (config.providerType === 'planilha') {
          setPlanilhaConfig({ ...planilhaConfig, ...config.config });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      let config: any;
      
      if (providerType === 'ellevo') {
        config = {
          subdomain: ellevoConfig.subdomain,
          token: ellevoConfig.token,
          clienteEllevo: ellevoConfig.clienteEllevo,
          useOAuth: ellevoConfig.useOAuth,
          clientId: ellevoConfig.clientId,
          clientSecret: ellevoConfig.clientSecret
        };
      } else if (providerType === 'planilha') {
        config = {
          filePath: planilhaConfig.filePath,
          sheetName: planilhaConfig.sheetName
        };
      }

      await sustentacaoService.saveConfig({
        companyId,
        providerType,
        config,
        horasContratadas,
        ativo: true
      });

      onConfigSaved?.();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      let config: any;
      
      if (providerType === 'ellevo') {
        config = {
          subdomain: ellevoConfig.subdomain,
          token: ellevoConfig.token,
          clienteEllevo: ellevoConfig.clienteEllevo,
          horasContratadas
        };
      } else if (providerType === 'planilha') {
        config = {
          filePath: planilhaConfig.filePath,
          sheetName: planilhaConfig.sheetName
        };
      }

      const provider = SustentacaoProviderFactory.create(providerType, config);
      const success = await provider.testConnection();
      
      setTestResult({
        success,
        message: success 
          ? 'Conexão testada com sucesso!' 
          : 'Falha na conexão. Verifique as credenciais.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Configuração de Sustentação</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Provedor */}
          <div className="space-y-2">
            <Label>Tipo de Integração</Label>
            <Select value={providerType} onValueChange={(value: any) => setProviderType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ellevo">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Ellevo (API)</span>
                  </div>
                </SelectItem>
                <SelectItem value="planilha">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span>Planilha (Excel/CSV)</span>
                  </div>
                </SelectItem>
                <SelectItem value="outro">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Outro Sistema</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horas Contratadas */}
          <div className="space-y-2">
            <Label>Horas Contratadas</Label>
            <Input
              type="number"
              value={horasContratadas}
              onChange={(e) => setHorasContratadas(Number(e.target.value))}
              placeholder="Ex: 40"
            />
          </div>

          {/* Configurações específicas por tipo */}
          <Tabs value={providerType} onValueChange={(value: any) => setProviderType(value)}>
            <TabsList>
              <TabsTrigger value="ellevo">Ellevo</TabsTrigger>
              <TabsTrigger value="planilha">Planilha</TabsTrigger>
              <TabsTrigger value="outro">Outro</TabsTrigger>
            </TabsList>

            <TabsContent value="ellevo" className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-2">Configuração Ellevo</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Configure as credenciais para acessar a API do Ellevo. 
                  As credenciais devem ser obtidas no Ellevo Next do cliente.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subdomínio</Label>
                    <Input
                      value={ellevoConfig.subdomain}
                      onChange={(e) => setEllevoConfig({ ...ellevoConfig, subdomain: e.target.value })}
                      placeholder="Ex: copersucar"
                    />
                    <p className="text-xs text-gray-500">
                      Subdomínio do Ellevo (ex: https://copersucar.ellevo.com)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Token de Acesso</Label>
                    <Input
                      type="password"
                      value={ellevoConfig.token}
                      onChange={(e) => setEllevoConfig({ ...ellevoConfig, token: e.target.value })}
                      placeholder="Bearer token ou Client ID"
                    />
                    <p className="text-xs text-gray-500">
                      Token Bearer ou Client ID (obtido no Ellevo Next)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Código do Cliente (Opcional)</Label>
                    <Input
                      value={ellevoConfig.clienteEllevo}
                      onChange={(e) => setEllevoConfig({ ...ellevoConfig, clienteEllevo: e.target.value })}
                      placeholder="Ex: COP001"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="planilha" className="space-y-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-900 mb-2">Configuração Google Sheets</h4>
                <p className="text-sm text-green-700 mb-4">
                  Configure a integração com Google Sheets para dados de sustentação.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ID da Planilha</Label>
                    <Input
                      value={planilhaConfig.filePath}
                      onChange={(e) => setPlanilhaConfig({ ...planilhaConfig, filePath: e.target.value })}
                      placeholder="1ABC123DEF456GHI789..."
                    />
                    <p className="text-xs text-gray-500">
                      ID da planilha Google Sheets (extraído da URL)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>API Key do Google</Label>
                    <Input
                      type="password"
                      value={planilhaConfig.sheetName}
                      onChange={(e) => setPlanilhaConfig({ ...planilhaConfig, sheetName: e.target.value })}
                      placeholder="AIzaSyABC123..."
                    />
                    <p className="text-xs text-gray-500">
                      API Key do Google Cloud Console
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Como obter:</h5>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Acesse Google Cloud Console</li>
                      <li>2. Ative Google Sheets API</li>
                      <li>3. Crie uma API Key</li>
                      <li>4. Configure restrições (opcional)</li>
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outro" className="space-y-4">
              <div className="p-4 border rounded-lg bg-orange-50">
                <h4 className="font-medium text-orange-900 mb-2">Outro Sistema</h4>
                <p className="text-sm text-orange-700">
                  Configuração para outros sistemas será implementada em breve.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Resultado do teste */}
          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                  {testResult.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex space-x-4">
            <Button
              onClick={handleTestConnection}
              disabled={testing || loading}
              variant="outline"
            >
              {testing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={loading || testing}
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}