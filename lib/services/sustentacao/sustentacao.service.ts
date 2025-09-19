import { createClient } from '@/lib/supabase/client';
import { SustentacaoProviderFactory } from '@/lib/providers/sustentacao-provider.factory';
import { SustentacaoProvider } from '@/lib/providers/sustentacao-provider.interface';
import { 
  SustentacaoConfig, 
  Chamado, 
  Metricas, 
  Categoria, 
  SustentacaoFilters,
  SyncResult 
} from '@/lib/types/sustentacao';

export class SustentacaoService {
  private supabase = createClient();

  /**
   * Busca configuração de sustentação por empresa
   */
  async getConfigByCompany(companyId: string): Promise<SustentacaoConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('sustentacao_config')
        .select('*')
        .eq('company_id', companyId)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar configuração:', error);
        return null;
      }

      return this.mapDbConfigToSustentacaoConfig(data);
    } catch (error) {
      console.error('Erro ao buscar configuração de sustentação:', error);
      return null;
    }
  }

  /**
   * Cria ou atualiza configuração de sustentação
   */
  async saveConfig(config: Omit<SustentacaoConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SustentacaoConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('sustentacao_config')
        .upsert({
          company_id: config.companyId,
          provider_type: config.providerType,
          config: config.config,
          horas_contratadas: config.horasContratadas,
          ativo: config.ativo
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar configuração:', error);
        return null;
      }

      return this.mapDbConfigToSustentacaoConfig(data);
    } catch (error) {
      console.error('Erro ao salvar configuração de sustentação:', error);
      return null;
    }
  }

  /**
   * Cria provedor baseado na configuração da empresa
   */
  async createProvider(companyId: string): Promise<SustentacaoProvider | null> {
    try {
      const config = await this.getConfigByCompany(companyId);
      
      if (!config) {
        console.warn(`Nenhuma configuração encontrada para empresa ${companyId}`);
        return null;
      }

      return SustentacaoProviderFactory.create(config.providerType, config.config);
    } catch (error) {
      console.error('Erro ao criar provedor:', error);
      return null;
    }
  }

  /**
   * Busca chamados de uma empresa
   */
  async getChamados(companyId: string, filters?: SustentacaoFilters): Promise<Chamado[]> {
    try {
      const provider = await this.createProvider(companyId);
      
      if (!provider) {
        return [];
      }

      return await provider.getChamados(filters);
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      return [];
    }
  }

  /**
   * Busca métricas de uma empresa
   */
  async getMetricas(companyId: string): Promise<Metricas | null> {
    try {
      const provider = await this.createProvider(companyId);
      
      if (!provider) {
        return null;
      }

      return await provider.getMetricas();
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return null;
    }
  }

  /**
   * Busca categorias de uma empresa
   */
  async getCategorias(companyId: string): Promise<Categoria[]> {
    try {
      const provider = await this.createProvider(companyId);
      
      if (!provider) {
        return [];
      }

      return await provider.getChamadosPorCategoria();
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  }

  /**
   * Testa conexão de uma empresa
   */
  async testConnection(companyId: string): Promise<boolean> {
    try {
      const provider = await this.createProvider(companyId);
      
      if (!provider) {
        return false;
      }

      return await provider.testConnection();
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Sincroniza dados de uma empresa
   */
  async syncData(companyId: string): Promise<SyncResult> {
    try {
      const provider = await this.createProvider(companyId);
      
      if (!provider) {
        return {
          success: false,
          chamadosSincronizados: 0,
          horasSincronizadas: 0,
          errors: ['Provedor não encontrado'],
          lastSync: new Date()
        };
      }

      const result = await provider.syncData();
      
      // Salvar histórico de sincronização
      await this.saveSyncHistory(companyId, result);

      return result;
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
   * Salva histórico de sincronização
   */
  private async saveSyncHistory(companyId: string, result: SyncResult): Promise<void> {
    try {
      const config = await this.getConfigByCompany(companyId);
      
      if (!config) return;

      await this.supabase
        .from('sustentacao_sync_history')
        .insert({
          sustentacao_config_id: config.id,
          sync_type: config.providerType,
          status: result.success ? 'success' : 'error',
          chamados_sincronizados: result.chamadosSincronizados,
          horas_sincronizadas: result.horasSincronizadas,
          error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
          completed_at: result.lastSync
        });
    } catch (error) {
      console.error('Erro ao salvar histórico de sincronização:', error);
    }
  }

  /**
   * Busca histórico de sincronizações
   */
  async getSyncHistory(companyId: string, limit: number = 10): Promise<any[]> {
    try {
      const config = await this.getConfigByCompany(companyId);
      
      if (!config) return [];

      const { data, error } = await this.supabase
        .from('sustentacao_sync_history')
        .select('*')
        .eq('sustentacao_config_id', config.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de sincronização:', error);
      return [];
    }
  }

  /**
   * Mapeia configuração do banco para interface
   */
  private mapDbConfigToSustentacaoConfig(dbConfig: any): SustentacaoConfig {
    return {
      id: dbConfig.id,
      companyId: dbConfig.company_id,
      providerType: dbConfig.provider_type,
      config: dbConfig.config,
      horasContratadas: dbConfig.horas_contratadas,
      ativo: dbConfig.ativo,
      createdAt: new Date(dbConfig.created_at),
      updatedAt: new Date(dbConfig.updated_at)
    };
  }
}