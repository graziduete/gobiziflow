import { Chamado, Categoria, Metricas } from '@/lib/types/sustentacao';
import { GoogleSheetsProviderInterface } from './sustentacao-provider.interface';

export class GoogleSheetsProvider implements GoogleSheetsProviderInterface {
  private apiKey: string;
  private spreadsheetId: string;
  private baseUrl: string;

  constructor({ spreadsheetId, apiKey }: { spreadsheetId?: string; apiKey: string }) {
    if (!apiKey) {
      throw new Error('Google Sheets API Key is missing.');
    }
    if (!spreadsheetId) {
      console.warn('Google Sheets Spreadsheet ID is missing. Using default from environment.');
      this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    } else {
      this.spreadsheetId = spreadsheetId;
    }

    this.apiKey = apiKey;
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

    console.log('🔧 Configuração Google Sheets:', {
      hasApiKey: !!this.apiKey,
      hasSpreadsheetId: !!this.spreadsheetId,
      spreadsheetId: this.spreadsheetId ? `${this.spreadsheetId.substring(0, 10)}...` : 'N/A'
    });
  }

  /**
   * Busca chamados do Google Sheets com retry automático
   */
  async getChamados(filters: any = {}): Promise<Chamado[]> {
    try {
      console.log('📊 Buscando chamados do Google Sheets...', filters);

      const range = 'Página1!A:L';

      console.log('📋 Usando planilha:', {
        spreadsheetId: this.spreadsheetId ? `${this.spreadsheetId.substring(0, 10)}...` : 'padrão',
        range
      });

      // Buscar dados da planilha com retry automático
      let response;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          response = await fetch(
            `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`
          );

          if (response.ok) {
            break; // Sucesso, sair do loop
          }

          throw new Error(`Erro na API Google Sheets: ${response.status}`);
        } catch (error) {
          if (attempts < maxAttempts - 1) {
            console.log(`⚠️ Erro na tentativa ${attempts + 1}/${maxAttempts}, aguardando 2s...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos para evitar 429
          } else {
            throw error; // Re-lançar o erro após todas as tentativas
          }
        }
        attempts++;
      }

      if (!response || !response.ok) {
        throw new Error('Falha ao buscar dados da planilha após várias tentativas.');
      }

      const data = await response.json();
      const rows = data.values;

      if (!rows || rows.length === 0) {
        console.log('✅ Nenhuma linha encontrada na planilha.');
        return [];
      }

      console.log(`✅ ${rows.length} linhas encontradas na planilha`);

      const headers = rows[0];
      const chamados = rows.slice(1).map((row: string[]) => {
        const chamado: any = {};
        headers.forEach((header: string, index: number) => {
          chamado[header.toLowerCase().replace(/\s/g, '')] = row[index];
        });
        
        // Mapear campos para o formato esperado pelo frontend
        chamado.idEllevo = chamado['#id'];
        chamado.automacao = chamado.númerorpa;
        chamado.dataAbertura = chamado.dataabertura;
        chamado.dataResolucao = chamado.dataresolução;
        chamado.tempoAtendimento = chamado.horas;
        
        return chamado as Chamado;
      });

      console.log(`✅ ${chamados.length} chamados processados`);

      // Aplicar filtros
      let filteredChamados = chamados;

      if (filters.mes && filters.ano) {
        filteredChamados = filteredChamados.filter((chamado: Chamado) => {
          const mesChamado = parseInt(chamado.mês) || 0;
          const anoChamado = parseInt(chamado.ano) || 0;
          return mesChamado === filters.mes && anoChamado === filters.ano;
        });
        console.log(`🔍 Filtrado por mês ${filters.mes}: ${filteredChamados.length} chamados`);
      }

      if (filters.ano && !filters.mes) {
        filteredChamados = filteredChamados.filter((chamado: Chamado) => {
          const anoChamado = parseInt(chamado.ano) || 0;
          return anoChamado === filters.ano;
        });
        console.log(`🔍 Filtrado por ano ${filters.ano}: ${filteredChamados.length} chamados`);
      }

      return filteredChamados;
    } catch (error) {
      console.error('❌ Erro ao buscar chamados do Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Busca métricas de sustentação
   */
  async getMetricas(filters: any = {}): Promise<Metricas> {
    try {
      console.log('📊 Buscando métricas do Google Sheets...', filters);

      // Buscar configuração ativa da empresa
      let horasContratadas = 40; // Valor padrão como fallback
      let permiteSaldoNegativo = false; // Valor padrão como fallback
      let dataInicio = null; // Data de início do contrato
      let dataFim = null; // Data de fim do contrato

      try {
        // Buscar configuração ativa da empresa
        // O companyId pode estar em filters.companyId ou ser passado separadamente
        const companyId = filters.companyId || filters.company_id;
        if (companyId) {
          console.log('🔍 Buscando configuração para companyId:', companyId);
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flow.gobi-zi.com';
          const configResponse = await fetch(`${baseUrl}/api/sustentacao/config-empresa?companyId=${companyId}`);
          if (configResponse.ok) {
            const configData = await configResponse.json();
            if (configData.success && configData.data) {
              horasContratadas = configData.data.horas_contratadas;
              permiteSaldoNegativo = configData.data.saldo_negativo;
              dataInicio = new Date(configData.data.data_inicio);
              dataFim = new Date(configData.data.data_fim);
              console.log('✅ Usando configuração da empresa:', {
                horasContratadas,
                permiteSaldoNegativo,
                dataInicio: dataInicio.toLocaleDateString('pt-BR'),
                dataFim: dataFim.toLocaleDateString('pt-BR')
              });
            } else {
              console.log('⚠️ Nenhuma configuração ativa encontrada para a empresa');
            }
          } else {
            console.log('⚠️ Erro na API de configuração:', configResponse.status);
          }
        } else {
          console.log('⚠️ CompanyId não encontrado nos filtros:', filters);
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar configuração, usando valor padrão:', error);
      }

      // Calcular horas consumidas dos chamados com filtros
      const chamados = await this.getChamados(filters);
      const tempoTotal = chamados.reduce((total: string, chamado: any) => {
        return this.somarTempos(total, chamado.horas || '00:00');
      }, '00:00');

      const chamadosAtivos = chamados.filter((c: any) => c.status === 'Ativo').length;

      const horasConsumidasDecimal = this.converterRelogioParaDecimal(tempoTotal);
      const horasRestantesDecimal = horasContratadas - horasConsumidasDecimal;

      // Lógica para Saldo Acumulado (considerando período de vigência)
      let saldoAcumuladoMesesAnteriores = 0;
      const hoje = new Date();
      const mesAtual = filters.mes || hoje.getMonth() + 1;
      const anoAtual = filters.ano || hoje.getFullYear();

      console.log('📅 Período de vigência do contrato:', {
        dataInicio: dataInicio?.toLocaleDateString('pt-BR'),
        dataFim: dataFim?.toLocaleDateString('pt-BR'),
        mesInicioContrato: dataInicio?.getMonth(),
        anoInicioContrato: dataInicio?.getFullYear(),
        mesAtual,
        anoAtual
      });

      if (dataInicio && dataFim) {
        for (let ano = dataInicio.getFullYear(); ano <= anoAtual; ano++) {
          const mesInicialLoop = (ano === dataInicio.getFullYear()) ? dataInicio.getMonth() + 1 : 1;
          const mesFinalLoop = (ano === anoAtual) ? mesAtual - 1 : 12;

          for (let mes = mesInicialLoop; mes <= mesFinalLoop; mes++) {
            // Verificar se o mês/ano está dentro do período de vigência
            const dataReferencia = new Date(ano, mes - 1, 1);
            if (dataReferencia < dataInicio || dataReferencia > dataFim) {
              console.log(`⏭️ Mês ${mes} fora do período de vigência, pulando...`);
              continue;
            }

            const chamadosMesAnterior = await this.getChamados({ mes, ano });
            const tempoTotalMesAnterior = chamadosMesAnterior.reduce((total: string, chamado: any) => {
              return this.somarTempos(total, chamado.horas || '00:00');
            }, '00:00');
            const horasConsumidasMesAnteriorDecimal = this.converterRelogioParaDecimal(tempoTotalMesAnterior);

            let saldoMesAnterior = horasContratadas - horasConsumidasMesAnteriorDecimal;
            if (!permiteSaldoNegativo && saldoMesAnterior < 0) {
              saldoMesAnterior = 0;
            }
            saldoAcumuladoMesesAnteriores += saldoMesAnterior;
          }
        }
      } else {
        console.log('⚠️ Período de vigência não encontrado, usando cálculo padrão');
        // Se não houver data de início/fim, calcular saldo acumulado de todos os meses anteriores ao atual
        for (let ano = 2023; ano <= anoAtual; ano++) { // Começa de um ano razoável
          const mesInicialLoop = (ano === 2023) ? 1 : 1;
          const mesFinalLoop = (ano === anoAtual) ? mesAtual - 1 : 12;

          for (let mes = mesInicialLoop; mes <= mesFinalLoop; mes++) {
            const chamadosMesAnterior = await this.getChamados({ mes, ano });
            const tempoTotalMesAnterior = chamadosMesAnterior.reduce((total: string, chamado: any) => {
              return this.somarTempos(total, chamado.horas || '00:00');
            }, '00:00');
            const horasConsumidasMesAnteriorDecimal = this.converterRelogioParaDecimal(tempoTotalMesAnterior);

            let saldoMesAnterior = horasContratadas - horasConsumidasMesAnteriorDecimal;
            if (!permiteSaldoNegativo && saldoMesAnterior < 0) {
              saldoMesAnterior = 0;
            }
            saldoAcumuladoMesesAnteriores += saldoMesAnterior;
          }
        }
      }

      let saldoMesAtualDecimal = horasContratadas - horasConsumidasDecimal;
      if (!permiteSaldoNegativo && saldoMesAtualDecimal < 0) {
        saldoMesAtualDecimal = 0;
      }

      let saldoFinalProximoMes = horasContratadas + saldoAcumuladoMesesAnteriores;

      if (!permiteSaldoNegativo) {
        saldoFinalProximoMes = Math.max(0, saldoFinalProximoMes);
        console.log('⚠️ Saldo negativo não permitido, usando apenas horas contratadas:', horasContratadas);
      }

      console.log('✅ Saldo negativo permitido - cálculo final:', {
        horasContratadasProximoMes: horasContratadas,
        saldoAcumuladoMesesAnteriores,
        saldoMesAtual: saldoMesAtualDecimal,
        saldoFinalProximoMes
      });

      return {
        horasContratadas: this.converterDecimalParaHoras(horasContratadas),
        horasConsumidas: tempoTotal,
        horasRestantes: this.converterDecimalParaHoras(horasRestantesDecimal),
        saldoProximoMes: this.converterDecimalParaHoras(saldoMesAtualDecimal), // Mostra o saldo do mês atual
        saldoAcumulado: this.converterDecimalParaHoras(saldoAcumuladoMesesAnteriores + saldoMesAtualDecimal), // Saldo acumulado
        chamadosAtivos,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar métricas do Google Sheets:', error);
      throw error;
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
        nome: categoria,
        quantidade: chamados.filter((c: any) => c.categoria === categoria).length,
        cor: this.getCorCategoria(categoria)
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar chamados por categoria do Google Sheets:', error);
      throw error;
    }
  }

  private getCorCategoria(categoria: string): string {
    switch (categoria) {
      case 'Bugs':
        return 'bg-red-500';
      case 'Processo':
        return 'bg-blue-500';
      case 'Solicitação':
        return 'bg-green-500';
      case 'Ajuste':
        return 'bg-yellow-500';
      case 'Falha Sistêmica':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  }

  private converterRelogioParaDecimal(tempo: string): number {
    if (!tempo || tempo === '00:00') return 0;
    const [horas, minutos] = tempo.split(':').map(Number);
    return horas + minutos / 60;
  }

  private converterDecimalParaHoras(decimal: number): string {
    if (isNaN(decimal)) return '00:00';
    const sinal = decimal < 0 ? '-' : '';
    const absDecimal = Math.abs(decimal);
    const horas = Math.floor(absDecimal);
    const minutos = Math.round((absDecimal - horas) * 60);
    return `${sinal}${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  private somarTempos(tempo1: string, tempo2: string): string {
    const decimal1 = this.converterRelogioParaDecimal(tempo1);
    const decimal2 = this.converterRelogioParaDecimal(tempo2);
    const somaDecimal = decimal1 + decimal2;
    return this.converterDecimalParaHoras(somaDecimal);
  }
}