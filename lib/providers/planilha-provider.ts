import { SustentacaoProvider } from './sustentacao-provider.interface';
import { 
  Chamado, 
  Metricas, 
  Categoria, 
  SustentacaoFilters, 
  SyncResult,
  PlanilhaConfig
} from '@/lib/types/sustentacao';

export class PlanilhaProvider implements SustentacaoProvider {
  private config: PlanilhaConfig;

  constructor(config: PlanilhaConfig) {
    this.config = config;
  }

  /**
   * Busca chamados da planilha
   */
  async getChamados(filters: SustentacaoFilters = {}): Promise<Chamado[]> {
    try {
      // Por enquanto, retornar dados mockados
      // Depois implementar leitura de planilha Excel/CSV
      return [
        {
          id: 'PL-001',
          titulo: 'Problema na planilha',
          categoria: 'Bugs',
          status: 'Não iniciado',
          solicitante: 'Usuário Planilha',
          dataAbertura: new Date().toLocaleDateString('pt-BR'),
          tempoAtendimento: '00:00',
          horasConsumidas: 0,
          metadata: {
            source: 'planilha',
            filePath: this.config.filePath
          }
        }
      ];
    } catch (error) {
      console.error('Erro ao buscar chamados da planilha:', error);
      return [];
    }
  }

  /**
   * Busca métricas calculadas
   */
  async getMetricas(): Promise<Metricas> {
    try {
      const chamados = await this.getChamados();
      
      const horasConsumidas = chamados.reduce((total, chamado) => {
        return total + (chamado.horasConsumidas || 0);
      }, 0);

      const chamadosAtivos = chamados.filter(c => 
        !['Concluído', 'Cancelado', 'Fechado'].includes(c.status)
      ).length;

      return {
        horasContratadas: 50, // Mock - depois virá da configuração
        horasConsumidas: Math.round(horasConsumidas * 100) / 100,
        horasRestantes: Math.max(0, 50 - horasConsumidas),
        saldoProximoMes: Math.max(0, 50 - horasConsumidas),
        chamadosAtivos
      };
    } catch (error) {
      console.error('Erro ao calcular métricas da planilha:', error);
      return {
        horasContratadas: 50,
        horasConsumidas: 0,
        horasRestantes: 50,
        saldoProximoMes: 50,
        chamadosAtivos: 0
      };
    }
  }

  /**
   * Busca chamados agrupados por categoria
   */
  async getChamadosPorCategoria(): Promise<Categoria[]> {
    try {
      const chamados = await this.getChamados();
      const categorias = ['Bugs', 'Processo', 'Solicitação', 'Ajuste', 'Falha Sistêmica'];
      
      return categorias.map(categoria => ({
        nome: categoria,
        quantidade: chamados.filter(c => c.categoria === categoria).length,
        cor: this.getCorCategoria(categoria)
      }));
    } catch (error) {
      console.error('Erro ao buscar categorias da planilha:', error);
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
   * Testa conexão com planilha
   */
  async testConnection(): Promise<boolean> {
    try {
      // Verificar se o arquivo da planilha existe
      // Por enquanto, sempre retorna true
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão com planilha:', error);
      return false;
    }
  }

  /**
   * Sincroniza dados da planilha
   */
  async syncData(): Promise<SyncResult> {
    try {
      const chamados = await this.getChamados();
      const horasSincronizadas = chamados.reduce((total, c) => total + (c.horasConsumidas || 0), 0);

      return {
        success: true,
        chamadosSincronizados: chamados.length,
        horasSincronizadas,
        errors: [],
        lastSync: new Date()
      };
    } catch (error) {
      console.error('Erro na sincronização da planilha:', error);
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
  getConfig(): PlanilhaConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  async updateConfig(config: Partial<PlanilhaConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
  }
}