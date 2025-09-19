// Implementação OAuth 2.0 para Ellevo
export class EllevoOAuth2 {
  private clientId: string;
  private clientSecret: string;
  private subdomain: string;
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: {
    clientId: string;
    clientSecret: string;
    subdomain: string;
  }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.subdomain = config.subdomain;
    this.baseUrl = `https://${subdomain}.ellevo.com/api/v1`;
  }

  /**
   * Passo 1: Obter código de acesso
   */
  async getAccessCode(): Promise<string> {
    try {
      console.log('🔐 Obtendo código de acesso...');
      
      const response = await fetch(`${this.baseUrl}/Auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.clientId,
          clientSecret: this.clientSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter código: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Código de acesso obtido');
      
      return data.accessCode;
    } catch (error) {
      console.error('❌ Erro ao obter código de acesso:', error);
      throw error;
    }
  }

  /**
   * Passo 2: Trocar código por token
   */
  async getAccessToken(accessCode: string): Promise<string> {
    try {
      console.log('🎫 Obtendo token de acesso...');
      
      const response = await fetch(`${this.baseUrl}/Auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode: accessCode
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter token: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Calcular expiração (assumindo 1 hora, ajustar conforme documentação)
      this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      
      console.log('✅ Token de acesso obtido');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      throw error;
    }
  }

  /**
   * Verifica se o token ainda é válido
   */
  private isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    
    // Renovar 5 minutos antes da expiração
    const bufferTime = 5 * 60 * 1000; // 5 minutos
    return new Date() < new Date(this.tokenExpiry.getTime() - bufferTime);
  }

  /**
   * Obtém token válido (renova se necessário)
   */
  async getValidToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    console.log('🔄 Token expirado, renovando...');
    const accessCode = await this.getAccessCode();
    return await this.getAccessToken(accessCode);
  }

  /**
   * Faz requisição autenticada
   */
  async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }

    return response;
  }

  /**
   * Testa a conexão OAuth
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticatedRequest('/ticket/ticket-list?date=1');
      return true;
    } catch (error) {
      console.error('❌ Erro no teste OAuth:', error);
      return false;
    }
  }

  /**
   * Busca chamados usando OAuth
   */
  async getChamados(filters: any = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('date', '30');
      params.append('service', 'ABRIRCHAMADOPARARPA-638739843601');
      
      const response = await this.authenticatedRequest(`/ticket/ticket-list?${params}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao buscar chamados:', error);
      throw error;
    }
  }
}