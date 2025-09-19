"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Clock, Key, Shield } from "lucide-react";
import { EllevoOAuth2 } from "@/lib/auth/ellevo-oauth";
import { validateOAuthConfig } from "@/lib/config/ellevo-oauth-config";

export default function OAuthTestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    subdomain: 'copersucar'
  });

  const testOAuthFlow = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('🔐 Iniciando teste OAuth 2.0...');
      
      // Validar configuração
      if (!config.clientId || !config.clientSecret) {
        throw new Error('Client ID e Client Secret são obrigatórios');
      }

      // Criar instância OAuth
      const oauth = new EllevoOAuth2({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        subdomain: config.subdomain
      });

      console.log('📡 Testando conexão OAuth...');
      
      // Testar conexão
      const isConnected = await oauth.testConnection();
      
      if (isConnected) {
        console.log('✅ Conexão OAuth bem-sucedida!');
        
        // Buscar alguns chamados para validar
        const chamados = await oauth.getChamados();
        
        setResult({
          success: true,
          message: `OAuth 2.0 funcionando! ${chamados.ticketCount || 0} chamados encontrados.`,
          data: chamados
        });
      } else {
        setResult({
          success: false,
          message: 'Falha na conexão OAuth 2.0'
        });
      }
    } catch (error) {
      console.error('❌ Erro no teste OAuth:', error);
      setResult({
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teste OAuth 2.0 - Ellevo</h1>
        <p className="text-gray-600">Teste seguro com OAuth 2.0</p>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>✅ OAuth 2.0 é mais seguro:</strong> Tokens temporários, escopo limitado e revogação automática.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Configuração OAuth 2.0</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                type="text"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                placeholder="Seu Client ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={config.clientSecret}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                placeholder="Seu Client Secret"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomínio</Label>
            <Input
              id="subdomain"
              type="text"
              value={config.subdomain}
              onChange={(e) => setConfig({ ...config, subdomain: e.target.value })}
              placeholder="copersucar"
            />
          </div>
          
          <Button
            onClick={testOAuthFlow}
            disabled={testing || !config.clientId || !config.clientSecret}
            className="w-full"
            size="lg"
          >
            {testing ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Testando OAuth 2.0...
              </>
            ) : (
              <>
                <Key className="h-5 w-5 mr-2" />
                Testar OAuth 2.0
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {result?.data && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Dados Recebidos via OAuth:</h4>
              <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded border">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vantagens do OAuth 2.0</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">✅ Segurança</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Tokens temporários</li>
                <li>• Escopo limitado</li>
                <li>• Revogação automática</li>
                <li>• Auditoria completa</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">🔧 Flexibilidade</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Múltiplos ambientes</li>
                <li>• Renovação automática</li>
                <li>• Permissões granulares</li>
                <li>• Padrão da indústria</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}