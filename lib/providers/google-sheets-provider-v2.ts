import { SustentacaoProvider } from './sustentacao-provider.interface';
import { Chamado, Metricas, Categoria } from '@/lib/types/sustentacao';
import { createClient } from '@/lib/supabase/server';

export class GoogleSheetsProviderV2 implements SustentacaoProvider {
  private spreadsheetId: string;
  private apiKey: string;
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  private companyId: string;

  constructor(config: {
    spreadsheetId: string;
    apiKey: string;
    companyId: string;
  }) {
    this.spreadsheetId = config.spreadsheetId;
    this.apiKey = config.apiKey;
    this.companyId = config.companyId;
  }

  /**
   * Busca configuração da empresa no banco
   */
  private async getCompanyConfig(): Promise<{
    id: string;
    horasContratadas: number;
    dataInicio: string;
    dataFim: string;
    saldoNegativo: boolean;
  } | null> {
    try {
      const supabase = await createClient();
      
      const { data: config, error } = await supabase
        .from('sustentacao_empresa_config')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !config) {
        console.log('⚠️ Nenhuma configuração encontrada para a empresa:', this.companyId);
        return null;
      }

      return {
        id: config.id,
        horasContratadas: config.horas_contratadas,
        dataInicio: config.data_inicio,
        dataFim: config.data_fim,
        saldoNegativo: config.saldo_negativo
      };
    } catch (error) {
      console.error('❌ Erro ao buscar configuração da empresa:', error);
      return null;
    }
  }

  /**
   * Verifica se o período está dentro do contrato
   */
  private isPeriodWithinContract(config: any, mes: number, ano: number): boolean {
    if (!config) return false;
    
    try {
      const dataInicio = new Date(config.dataInicio);
      const dataFim = new Date(config.dataFim);
      const dataAtual = new Date(ano, mes - 1, 1);
      
      return dataAtual >= dataInicio && dataAtual <= dataFim;
    } catch {
      return false;
    }
  }

  /**
   * Calcula saldo acumulado até o mês atual
   */
  private async calculateAccumulatedBalance(config: any, mes: number, ano: number): Promise<number> {
    try {
      const supabase = await createClient();
      
      // Buscar histórico de saldos até o mês anterior
      const { data: saldos, error } = await supabase
        .from('sustentacao_saldo_mensal')
        .select('saldo_acumulado')
        .eq('company_id', this.companyId)
        .lt('ano', ano)
        .or(`ano.eq.${ano},mes.lt.${mes}`)
        .order('ano', { ascending: true })
        .order('mes', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar saldos acumulados:', error);
        return 0;
      }

      // Se não há histórico, começar com 0
      if (!saldos || saldos.length === 0) {
        return 0;
      }

      // Retornar o último saldo acumulado
      const ultimoSaldo = saldos[saldos.length - 1];
      return ultimoSaldo.saldo_acumulado || 0;
    } catch (error) {
      console.error('❌ Erro ao calcular saldo acumulado:', error);
      return 0;
    }
  }

  /**
   * Salva saldo mensal no banco
   */
  private async saveMonthlyBalance(
    config: any,
    mes: number,
    ano: number,
    horasConsumidas: number,
    saldoAcumulado: number
  ): Promise<void> {
    try {
      console.log('💾 Iniciando salvamento do saldo mensal...');
      
      const saldoMes = config.horasContratadas - horasConsumidas;
      
      console.log('💾 Dados para salvar:', {
        companyId: this.companyId,
        configId: config.id,
        ano,
        mes,
        horasContratadas: config.horasContratadas,
        horasConsumidas,
        saldoAnterior: saldoAcumulado - saldoMes
      });
      
      // Usar Supabase diretamente
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('sustentacao_saldo_mensal')
        .upsert({
          company_id: this.companyId,
          config_id: config.id,
          ano,
          mes,
          horas_contratadas: config.horasContratadas,
          horas_consumidas: horasConsumidas,
          saldo_mes: saldoMes,
          saldo_acumulado: saldoAcumulado,
          status: 'ativo'
        }, {
          onConflict: 'company_id,ano,mes'
        });

      if (error) {
        console.error('❌ Erro ao salvar saldo mensal:', error);
      } else {
        console.log('✅ Saldo mensal salvo com sucesso:', data);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar saldo mensal:', error);
    }
  }

  /**
   * Busca chamados da planilha Google Sheets com filtros
   */
  async getChamados(filters: any = {}): Promise<Chamado[]> {
    try {
      console.log('📊 [V2] Buscando chamados do Google Sheets...', filters);
      
      // Buscar dados da planilha com retry automático
      let response;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          response = await fetch(
            `${this.baseUrl}/${this.spreadsheetId}/values/A:L?key=${this.apiKey}`
          );
          
          if (response.ok) {
            break;
          }
          
          if (response.status === 403 && attempts < maxAttempts - 1) {
            console.log(`⚠️ Erro 403, tentativa ${attempts + 1}/${maxAttempts}, aguardando 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            continue;
          }
          
          throw new Error(`Erro na API Google Sheets: ${response.status}`);
        } catch (error) {
          if (attempts < maxAttempts - 1) {
            console.log(`⚠️ Erro na tentativa ${attempts + 1}/${maxAttempts}, aguardando 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            continue;
          }
          throw error;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Erro na API Google Sheets após ${maxAttempts} tentativas: ${response?.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      console.log(`✅ ${rows.length} linhas encontradas na planilha`);

      // Pular cabeçalho (linha 1) e converter dados da planilha
      let chamados = rows.slice(1).map((row: any[], index: number) => ({
        idEllevo: row[2] || `PL-${index + 1}`,
        automacao: `RPA ${row[8]}` || 'Não especificado',
        assunto: row[7] || 'Sem assunto',
        categoria: this.mapearCategoria(row[10]),
        status: this.mapearStatus(row[3]),
        solicitante: row[6] || 'Não informado',
        dataAbertura: this.formatarData(row[5]),
        dataResolucao: row[9] ? this.formatarData(row[9]) : undefined,
        tempoAtendimento: this.formatarTempo(row[11]),
        mes: parseInt(row[4]) || 0,
        ano: parseInt(row[0]) || 0,
        cliente: row[1] || '',
        horasConsumidas: this.converterHorasParaDecimal(row[11]),
        metadata: {
          planilha: this.spreadsheetId,
          linha: index + 2
        }
      }));

      console.log(`✅ ${chamados.length} chamados processados`);

      // Aplicar filtros
      if (filters.mes) {
        chamados = chamados.filter(c => c.mes === parseInt(filters.mes));
        console.log(`🔍 Filtrado por mês ${filters.mes}: ${chamados.length} chamados`);
      }

      if (filters.ano) {
        chamados = chamados.filter(c => c.ano === parseInt(filters.ano));
        console.log(`🔍 Filtrado por ano ${filters.ano}: ${chamados.length} chamados`);
      }

      if (filters.cliente) {
        chamados = chamados.filter(c => 
          c.cliente.toLowerCase().includes(filters.cliente.toLowerCase())
        );
        console.log(`🔍 Filtrado por cliente ${filters.cliente}: ${chamados.length} chamados`);
      }

      if (filters.status) {
        chamados = chamados.filter(c => c.status === filters.status);
        console.log(`🔍 Filtrado por status ${filters.status}: ${chamados.length} chamados`);
      }

      if (filters.categoria) {
        chamados = chamados.filter(c => c.categoria === filters.categoria);
        console.log(`🔍 Filtrado por categoria ${filters.categoria}: ${chamados.length} chamados`);
      }

      return chamados;
    } catch (error) {
      console.error('❌ Erro ao buscar chamados do Google Sheets:', error);
      return [];
    }
  }

  /**
   * Busca métricas da planilha com nova lógica de cálculo
   */
  async getMetricas(filters: any = {}): Promise<Metricas> {
    try {
      console.log('📊 [V2] Buscando métricas com nova lógica...', filters);
      
      // Buscar configuração da empresa
      const config = await this.getCompanyConfig();
      
      if (!config) {
        console.log('⚠️ Nenhuma configuração encontrada, usando valores padrão');
        return {
          horasContratadas: 0,
          horasConsumidas: '00:00',
          horasRestantes: '00:00',
          saldoProximoMes: '00:00',
          chamadosAtivos: 0
        };
      }

      const mes = parseInt(filters.mes) || new Date().getMonth() + 1;
      const ano = parseInt(filters.ano) || new Date().getFullYear();

      // Verificar se o período está dentro do contrato
      if (!this.isPeriodWithinContract(config, mes, ano)) {
        console.log('⚠️ Período fora do contrato, retornando valores zerados');
        return {
          horasContratadas: 0,
          horasConsumidas: '00:00',
          horasRestantes: '00:00',
          saldoProximoMes: '00:00',
          chamadosAtivos: 0
        };
      }

      // Calcular horas consumidas dos chamados
      const chamados = await this.getChamados(filters);
      const tempoTotal = chamados.reduce((total, chamado) => {
        return this.somarTempos(total, chamado.tempoAtendimento || '00:00');
      }, '00:00');

      const horasConsumidasDecimal = this.converterHorasParaDecimal(tempoTotal);
      const saldoMes = config.horasContratadas - horasConsumidasDecimal;
      
      // Calcular saldo acumulado
      const saldoAnterior = await this.calculateAccumulatedBalance(config, mes, ano);
      const saldoAcumulado = saldoAnterior + saldoMes;
      
      // Salvar saldo mensal no banco
      console.log('💾 Salvando saldo mensal:', { mes, ano, horasConsumidasDecimal, saldoAcumulado });
      await this.saveMonthlyBalance(config, mes, ano, horasConsumidasDecimal, saldoAcumulado);

      const chamadosAtivos = chamados.filter(c => 
        !['RESOLVED', 'Resolvido', 'Concluído', 'Cancelado', 'Fechado'].includes(c.status)
      ).length;

      // Calcular saldo para próximo mês
      let saldoProximoMes = saldoAcumulado;
      if (!config.saldoNegativo && saldoProximoMes < 0) {
        saldoProximoMes = 0; // Não permite saldo negativo
      }

      console.log('📊 [V2] Métricas calculadas:', {
        horasContratadas: config.horasContratadas,
        horasConsumidas: horasConsumidasDecimal,
        saldoMes,
        saldoAcumulado,
        saldoProximoMes
      });

      return {
        horasContratadas: config.horasContratadas,
        horasConsumidas: tempoTotal,
        horasRestantes: this.converterDecimalParaHoras(Math.max(0, saldoMes)),
        saldoProximoMes: this.converterDecimalParaHoras(Math.max(0, saldoProximoMes)),
        chamadosAtivos
      };
    } catch (error) {
      console.error('❌ Erro ao buscar métricas:', error);
      return {
        horasContratadas: 0,
        horasConsumidas: '00:00',
        horasRestantes: '00:00',
        saldoProximoMes: '00:00',
        chamadosAtivos: 0
      };
    }
  }

  /**
   * Busca chamados agrupados por categoria com filtros
   */
  async getChamadosPorCategoria(filters: any = {}): Promise<Categoria[]> {
    try {
      const chamados = await this.getChamados(filters);
      const categorias = ['Bugs', 'Processo', 'Solicitação', 'Ajuste', 'Falha Sistêmica'];
      
      return categorias.map(categoria => ({
        categoria: categoria,
        quantidade: chamados.filter(c => c.categoria === categoria).length,
        cor: this.getCorCategoria(categoria)
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return [];
    }
  }

  /**
   * Testa conexão com Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(
            `${this.baseUrl}/${this.spreadsheetId}?key=${this.apiKey}`
          );
          
          if (response.ok) {
            return true;
          }
          
          if (response.status === 403 && attempts < maxAttempts - 1) {
            console.log(`⚠️ Erro 403 no testConnection, tentativa ${attempts + 1}/${maxAttempts}, aguardando 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            continue;
          }
          
          return false;
        } catch (error) {
          if (attempts < maxAttempts - 1) {
            console.log(`⚠️ Erro no testConnection tentativa ${attempts + 1}/${maxAttempts}, aguardando 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            continue;
          }
          throw error;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao testar conexão Google Sheets:', error);
      return false;
    }
  }

  // Métodos auxiliares (copiados do provider original)
  private mapearCategoria(categoria: string): string {
    const mapeamento: Record<string, string> = {
      'processo': 'Processo',
      'bug': 'Bugs',
      'solicitação': 'Solicitação',
      'solicitacao': 'Solicitação',
      'ajuste': 'Ajuste',
      'falha sistêmica': 'Falha Sistêmica',
      'falha_sistemica': 'Falha Sistêmica',
      'falha sistema': 'Falha Sistêmica'
    };
    return mapeamento[categoria?.toLowerCase()] || categoria || 'Outros';
  }

  private mapearStatus(status: string): string {
    const mapeamento: Record<string, string> = {
      'resolved': 'Resolvido',
      'open': 'Aberto',
      'pending': 'Pendente',
      'closed': 'Fechado',
      'nao_iniciado': 'Não iniciado',
      'em_andamento': 'Em andamento',
      'concluido': 'Concluído',
      'aguardando': 'Aguardando'
    };
    return mapeamento[status?.toLowerCase()] || status || 'Não iniciado';
  }

  private formatarData(data: string): string {
    if (!data) return '-';
    try {
      if (data.includes('/') && data.split('/').length === 3) {
        const [dia, mes, ano] = data.split('/');
        const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        if (!isNaN(dataObj.getTime())) {
          return dataObj.toLocaleDateString('pt-BR');
        }
      }
      return data;
    } catch {
      return data;
    }
  }

  private formatarTempo(tempo: string): string {
    if (!tempo) return '00:00';
    try {
      if (tempo.includes(':') && tempo.split(':').length === 3) {
        const [horas, minutos] = tempo.split(':');
        return `${horas}:${minutos}`;
      }
      return tempo;
    } catch {
      return '00:00';
    }
  }

  private converterHorasParaDecimal(tempo: string): number {
    if (!tempo) return 0;
    try {
      const partes = tempo.split(':');
      if (partes.length >= 2) {
        const horas = parseInt(partes[0]) || 0;
        const minutos = parseInt(partes[1]) || 0;
        const segundos = partes[2] ? parseInt(partes[2]) || 0 : 0;
        return horas + (minutos / 60) + (segundos / 3600);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private somarTempos(tempo1: string, tempo2: string): string {
    try {
      const [h1, m1] = tempo1.split(':').map(Number);
      const [h2, m2] = tempo2.split(':').map(Number);
      
      let totalMinutos = (h1 * 60 + m1) + (h2 * 60 + m2);
      
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    } catch {
      return '00:00';
    }
  }

  private converterDecimalParaHoras(horasDecimais: number): string {
    try {
      const horas = Math.floor(horasDecimais);
      const minutos = Math.round((horasDecimais - horas) * 60);
      
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    } catch {
      return '00:00';
    }
  }

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

  updateSpreadsheetId(newSpreadsheetId: string): void {
    this.spreadsheetId = newSpreadsheetId;
    console.log('📊 [V2] Planilha atualizada para:', newSpreadsheetId);
  }

  getSpreadsheetInfo(): { id: string; url: string } {
    return {
      id: this.spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`
    };
  }
}