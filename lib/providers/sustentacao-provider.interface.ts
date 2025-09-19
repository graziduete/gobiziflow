import { Chamado, Metricas, Categoria, SustentacaoFilters, SyncResult } from '@/lib/types/sustentacao';

export interface SustentacaoProvider {
  /**
   * Busca chamados com filtros opcionais
   */
  getChamados(filters?: SustentacaoFilters): Promise<Chamado[]>;

  /**
   * Busca métricas calculadas
   */
  getMetricas(): Promise<Metricas>;

  /**
   * Busca chamados agrupados por categoria
   */
  getChamadosPorCategoria(): Promise<Categoria[]>;

  /**
   * Testa a conexão com o provedor
   */
  testConnection(): Promise<boolean>;

  /**
   * Sincroniza dados do provedor
   */
  syncData(): Promise<SyncResult>;

  /**
   * Busca configuração do provedor
   */
  getConfig(): any;

  /**
   * Atualiza configuração do provedor
   */
  updateConfig(config: any): Promise<void>;
}