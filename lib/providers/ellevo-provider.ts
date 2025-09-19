import { SustentacaoProvider } from './sustentacao-provider.interface';
import { 
  Chamado, 
  Metricas, 
  Categoria, 
  SustentacaoFilters, 
  SyncResult,
  EllevoConfig,
  EllevoApiResponse,
  EllevoTicket,
  EllevoAuthResponse,
  EllevoTokenResponse
} from '@/lib/types/sustentacao';

export class EllevoProvider implements SustentacaoProvider {
  private config: EllevoConfig;
  private baseUrl: string;
  private accessToken?: string;

  constructor(config: EllevoConfig) {
    this.config = config;
    this.baseUrl = `https://${config.subdomain}.ellevo.com/api/v1`;
  }

  /**
   * Autentica e obtém token de acesso via OAuth 2.0
   */
  private async authenticate(): Promise<string> {
    try {
      // Se já temos um token válido, retorna ele
      if (this.accessToken) {
        return this.accessToken;
      }

      // OAuth 2.0 é obrigatório para segurança
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Client ID e Client Secret são obrigatórios para OAuth 2.0');
      }

      // Passo 1: Obter código de acesso
      const authResponse = await fetch(`${this.baseUrl}/Auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret
        })
      });

      if (!authResponse.ok) {
        throw new Error(`Erro na autenticação OAuth: ${authResponse.status}`);
      }

      const authData: EllevoAuthResponse = await authResponse.json();

      // Passo 2: Trocar código por token
      const tokenResponse = await fetch(`${this.baseUrl}/Auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode: authData.accessCode
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Erro ao obter token OAuth: ${tokenResponse.status}`);
      }

      const tokenData: EllevoTokenResponse = await tokenResponse.json();
      this.accessToken = tokenData.access_token;

      return this.accessToken;
    } catch (error) {
      console.error('Erro na autenticação OAuth Ellevo:', error);
      throw new Error('Falha na autenticação OAuth com Ellevo');
    }
  }

  /**
   * Faz requisição autenticada para a API Ellevo
   */
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.authenticate();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API Ellevo: ${response.status} - ${response.statusText}`);
    }

    return response;
  }

  /**
   * Busca chamados da API Ellevo
   */
  async getChamados(filters: SustentacaoFilters = {}): Promise<Chamado[]> {
    try {
      // Construir query parameters
      const params = new URLSearchParams();
      
      // Parâmetros padrão baseados no Postman da Copersucar
      if (this.config.subdomain === 'copersucar') {
        params.append('date', '30'); // últimos 30 dias
        params.append('service', 'ABRIRCHAMADOPARARPA-638739843601'); // serviço específico
      } else {
        // Para outros clientes, usar filtros personalizados
        if (filters.date) params.append('date', filters.date.toString());
        if (filters.service) params.append('service', filters.service);
      }
      
      if (filters.subService !== undefined) params.append('subService', filters.subService.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.generator) params.append('generator', filters.generator);

      const endpoint = `/ticket/ticket-list?${params}`;
      console.log('🔍 Buscando chamados do Ellevo:', `${this.baseUrl}${endpoint}`);
      
      const response = await this.makeAuthenticatedRequest(endpoint);
      const data: EllevoApiResponse = await response.json();

      console.log('✅ Dados recebidos do Ellevo:', data);

      // Mapear dados do Ellevo para nossa interface
      return data.integrationApiTicketListItems?.map(this.mapEllevoTicketToChamado) || [];
    } catch (error) {
      console.error('❌ Erro ao buscar chamados do Ellevo:', error);
      return [];
    }
  }

  /**
   * Mapeia ticket do Ellevo para nossa interface Chamado
   */
  private mapEllevoTicketToChamado(ticket: EllevoTicket): Chamado {
    return {
      id: ticket.sequenceNumber.toString(),
      titulo: ticket.title,
      categoria: this.mapearCategoria(ticket.requestType),
      status: this.mapearStatus(ticket.status),
      solicitante: ticket.requester,
      responsavel: ticket.responsible,
      dataAbertura: this.formatarData(ticket.openingDate),
      dataResolucao: ticket.closingDate ? this.formatarData(ticket.closingDate) : undefined,
      tempoAtendimento: this.calcularTempoAtendimento(ticket.openingDate, ticket.closingDate),
      automacao: ticket.service,
      idEllevo: ticket.sequenceNumber,
      descricao: ticket.description,
      horasConsumidas: this.estimarHorasConsumidas(ticket),
      metadata: {
        proceedingsCount: ticket.proceedingsCount,
        stage: ticket.stage,
        customer: ticket.customer,
        dueDate: ticket.dueDate,
        formsResponse: ticket.formsResponse
      }
    };
  }

  /**
   * Mapeia categoria do Ellevo para nossa categorização
   */
  private mapearCategoria(requestType: string): string {
    const mapeamento: Record<string, string> = {
      'bug': 'Bugs',
      'melhoria': 'Melhoria',
      'processo': 'Processo',
      'solicitacao': 'Solicitação',
      'ajustes': 'Ajuste',
      'falha_sistemica': 'Falha Sistêmica',
      'correcao': 'Bugs',
      'melhoria_sistema': 'Melhoria',
      'processo_negocio': 'Processo',
      'solicitacao_usuario': 'Solicitação',
      'ajuste_configuracao': 'Ajuste',
      'falha_critica': 'Falha Sistêmica'
    };
    
    return mapeamento[requestType?.toLowerCase()] || 'Outros';
  }

  /**
   * Mapeia status do Ellevo para nossa nomenclatura
   */
  private mapearStatus(status: any): string {
    const mapeamento: Record<string, string> = {
      'notStarted': 'Não iniciado',
      'inProgress': 'Em andamento',
      'waiting': 'Aguardando',
      'concluded': 'Concluído',
      'cancelled': 'Cancelado',
      'paused': 'Pausado'
    };
    
    return mapeamento[status] || status?.toString() || 'Desconhecido';
  }

  /**
   * Formata data para o padrão brasileiro
   */
  private formatarData(data: string): string {
    if (!data) return '-';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  }

  /**
   * Calcula tempo de atendimento em formato HH:MM
   */
  private calcularTempoAtendimento(dataAbertura: string, dataResolucao?: string): string {
    if (!dataResolucao) return '00:00';
    
    try {
      const inicio = new Date(dataAbertura);
      const fim = new Date(dataResolucao);
      const diff = fim.getTime() - inicio.getTime();
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    } catch {
      return '00:00';
    }
  }

  /**
   * Estima horas consumidas baseado no tempo de atendimento
   */
  private estimarHorasConsumidas(ticket: EllevoTicket): number {
    if (!ticket.closingDate) return 0;
    
    try {
      const inicio = new Date(ticket.openingDate);
      const fim = new Date(ticket.closingDate);
      const diff = fim.getTime() - inicio.getTime();
      const horas = diff / (1000 * 60 * 60);
      
      // Limitar a um máximo de 8 horas por chamado
      return Math.min(horas, 8);
    } catch {
      return 0;
    }
  }

  /**
   * Busca métricas calculadas
   */
  async getMetricas(): Promise<Metricas> {
    try {
      const chamados = await this.getChamados({ date: 30 }); // últimos 30 dias
      
      const horasConsumidas = chamados.reduce((total, chamado) => {
        return total + (chamado.horasConsumidas || 0);
      }, 0);

      const chamadosAtivos = chamados.filter(c => 
        !['Concluído', 'Cancelado', 'Fechado'].includes(c.status)
      ).length;

      return {
        horasContratadas: this.config.horasContratadas || 0,
        horasConsumidas: Math.round(horasConsumidas * 100) / 100,
        horasRestantes: Math.max(0, (this.config.horasContratadas || 0) - horasConsumidas),
        saldoProximoMes: Math.max(0, (this.config.horasContratadas || 0) - horasConsumidas),
        chamadosAtivos
      };
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return {
        horasContratadas: this.config.horasContratadas || 0,
        horasConsumidas: 0,
        horasRestantes: this.config.horasContratadas || 0,
        saldoProximoMes: this.config.horasContratadas || 0,
        chamadosAtivos: 0
      };
    }
  }

  /**
   * Busca chamados agrupados por categoria
   */
  async getChamadosPorCategoria(): Promise<Categoria[]> {
    try {
      const chamados = await this.getChamados({ date: 30 });
      const categorias = ['Bugs', 'Processo', 'Solicitação', 'Ajuste', 'Falha Sistêmica'];
      
      return categorias.map(categoria => ({
        nome: categoria,
        quantidade: chamados.filter(c => c.categoria === categoria).length,
        cor: this.getCorCategoria(categoria)
      }));
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  }

  /**
   * Retorna cor para categoria
   */
  private getCorCategoria(categoria: string): string {
    const cores: Record<string, string> = {
      'Bugs': 'bg-red-500',
      'Processo': 'bg-blue-500',
      'Solicitação': 'bg-green-500',
      'Ajuste': 'bg-yellow-500',
      'Falha Sistêmica': 'bg-purple-500'
    };
    return cores[categoria] || 'bg-gray-500';
  }

  /**
   * Testa conexão com Ellevo
   */
  async testConnection(): Promise<boolean> {
    try {
      // Para a Copersucar, usar o serviço específico
      if (this.config.subdomain === 'copersucar') {
        await this.makeAuthenticatedRequest('/ticket/ticket-list?date=1&service=ABRIRCHAMADOPARARPA-638739843601');
      } else {
        await this.makeAuthenticatedRequest('/ticket/ticket-list?date=1');
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao testar conexão Ellevo:', error);
      return false;
    }
  }

  /**
   * Sincroniza dados do Ellevo
   */
  async syncData(): Promise<SyncResult> {
    try {
      const chamados = await this.getChamados({ date: 90 }); // últimos 90 dias
      const horasSincronizadas = chamados.reduce((total, c) => total + (c.horasConsumidas || 0), 0);

      return {
        success: true,
        chamadosSincronizados: chamados.length,
        horasSincronizadas,
        errors: [],
        lastSync: new Date()
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return {
        success: false,
        chamadosSincronizados: 0,
        horasSincronizadas: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        lastSync: new Date()
      };
    }
  }

  /**
   * Retorna configuração atual
   */
  getConfig(): EllevoConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  async updateConfig(config: Partial<EllevoConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    // Limpar token para forçar nova autenticação
    this.accessToken = undefined;
  }
}