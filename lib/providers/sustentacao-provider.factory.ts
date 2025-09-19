import { SustentacaoProvider } from './sustentacao-provider.interface';
import { EllevoProvider } from './ellevo-provider';
import { PlanilhaProvider } from './planilha-provider';
import { GoogleSheetsProvider } from './google-sheets-provider';
import { EllevoConfig, PlanilhaConfig, OutroConfig } from '@/lib/types/sustentacao';

export class SustentacaoProviderFactory {
  /**
   * Cria um provedor baseado no tipo e configuração
   */
  static create(providerType: string, config: any): SustentacaoProvider {
    switch (providerType.toLowerCase()) {
      case 'ellevo':
        return new EllevoProvider(config as EllevoConfig);
      
      case 'planilha':
        return new PlanilhaProvider(config as PlanilhaConfig);
      
      case 'google-sheets':
        return new GoogleSheetsProvider(config);
      
      case 'outro':
        // Por enquanto, retorna um provedor de planilha como fallback
        // Depois pode ser implementado um provedor genérico
        return new PlanilhaProvider(config as PlanilhaConfig);
      
      default:
        throw new Error(`Tipo de provedor não suportado: ${providerType}`);
    }
  }

  /**
   * Lista os tipos de provedores disponíveis
   */
  static getAvailableProviders(): string[] {
    return ['ellevo', 'planilha', 'google-sheets', 'outro'];
  }

  /**
   * Valida configuração para um tipo de provedor
   */
  static validateConfig(providerType: string, config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (providerType.toLowerCase()) {
      case 'ellevo':
        if (!config.subdomain) errors.push('Subdomain é obrigatório para Ellevo');
        if (!config.token) errors.push('Token é obrigatório para Ellevo');
        break;
      
      case 'planilha':
        if (!config.filePath) errors.push('Caminho do arquivo é obrigatório para Planilha');
        break;
      
      case 'google-sheets':
        if (!config.spreadsheetId) errors.push('ID da planilha é obrigatório para Google Sheets');
        if (!config.apiKey) errors.push('API Key é obrigatória para Google Sheets');
        break;
      
      case 'outro':
        if (!config.apiUrl) errors.push('URL da API é obrigatória para outros provedores');
        break;
      
      default:
        errors.push(`Tipo de provedor não suportado: ${providerType}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Cria configuração padrão para um tipo de provedor
   */
  static getDefaultConfig(providerType: string): any {
    switch (providerType.toLowerCase()) {
      case 'ellevo':
        return {
          subdomain: '',
          token: '',
          clienteEllevo: '',
          horasContratadas: 0
        };
      
      case 'planilha':
        return {
          filePath: '',
          sheetName: 'Chamados',
          horasContratadas: 0
        };
      
      case 'google-sheets':
        return {
          spreadsheetId: '',
          apiKey: '',
          sheetName: 'Chamados',
          configSheetName: 'Configuração',
          horasContratadas: 0
        };
      
      case 'outro':
        return {
          apiUrl: '',
          credentials: {},
          horasContratadas: 0
        };
      
      default:
        return {};
    }
  }
}