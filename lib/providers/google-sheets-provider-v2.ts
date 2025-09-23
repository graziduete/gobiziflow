import { google } from 'googleapis';

export class GoogleSheetsProviderV2 {
  private apiKey: string;
  private spreadsheetId: string;
  private tabName: string;

  constructor(spreadsheetId: string, tabName: string = 'Página1') {
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || '';
    this.spreadsheetId = spreadsheetId;
    this.tabName = tabName;
  }

  // Método para testar conexão
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('❌ API Key não configurada');
        return false;
      }

      if (!this.spreadsheetId) {
        console.error('❌ Spreadsheet ID não configurado');
        return false;
      }

      const sheets = google.sheets({ version: 'v4', auth: this.apiKey });
      const range = `${this.tabName}!A1`;
      
      await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      console.log('✅ Conexão com Google Sheets testada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      return false;
    }
  }

  // Método para buscar dados da planilha específica
  async getChamados(filters: any) {
    try {
      if (!this.apiKey) {
        throw new Error('GOOGLE_SHEETS_API_KEY não configurado');
      }

      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID não configurado');
      }

      // Adicionar delay para evitar 429 (Too Many Requests)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const sheets = google.sheets({ version: 'v4', auth: this.apiKey });
      const range = `${this.tabName}!A:L`;
      
      console.log(`🔍 Buscando dados da planilha: ${this.spreadsheetId}, aba: ${this.tabName}`);
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('⚠️ Nenhum dado encontrado na planilha');
        return [];
      }

      // Processar dados replicando a lógica da V1 (manter diacríticos, remover somente espaços)
      const rawHeaders = rows[0] as string[];
      const dataRows = rows.slice(1);

      const normV1 = (h: string) => h.toLowerCase().replace(/\s/g, '');
      const headers = rawHeaders.map(normV1);
      console.log('🧭 [V2] Cabeçalhos (modo V1):', headers);

      const chamados = dataRows.map((row: any[]) => {
        const rowObj: Record<string, any> = {};
        headers.forEach((key: string, index: number) => {
          rowObj[key] = row[index] ?? '';
        });

        // Mapear exatamente como a V1
        const idEllevo = rowObj['#id'] ?? rowObj['id'] ?? '';
        const automacao = rowObj['númerorpa'] ?? rowObj['numerorpa'] ?? rowObj['rpa'] ?? '';
        const assunto = rowObj['assunto'] ?? '';
        const categoria = rowObj['categoria'] ?? '';
        const status = rowObj['status'] ?? '';
        const solicitante = rowObj['solicitante'] ?? '';
        const tempoAtendimento = rowObj['horas'] ?? rowObj['tempodeatendimento'] ?? '';

        const dataAberturaRaw = rowObj['dataabertura'] ?? rowObj['datadaabertura'] ?? '';
        const dataResolucaoRaw = rowObj['dataresolução'] ?? rowObj['dataresolucao'] ?? '';

        const parseDate = (value: any) => {
          if (!value) return '';
          const d = new Date(value);
          if (!isNaN(d.getTime())) return d.toISOString();
          // Tentar formato dd/mm/yyyy
          const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value));
          if (m) {
            const iso = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).toISOString();
            return iso;
          }
          return String(value);
        };

        const dataAberturaISO = parseDate(dataAberturaRaw);
        const dataResolucaoISO = parseDate(dataResolucaoRaw);

        // Derivar mês/ano se existirem colunas especificas, senão da data
        const mesSheet = rowObj['mês'] ?? rowObj['mes'];
        const anoSheet = rowObj['ano'];
        let mes = Number(mesSheet) || undefined;
        let ano = Number(anoSheet) || undefined;
        if ((!mes || !ano) && dataAberturaISO) {
          const d = new Date(dataAberturaISO);
          if (!mes) mes = d.getMonth() + 1;
          if (!ano) ano = d.getFullYear();
        }

        return {
          idEllevo: idEllevo,
          automacao,
          assunto,
          categoria,
          status,
          solicitante,
          tempoAtendimento,
          dataAbertura: dataAberturaISO,
          dataResolucao: dataResolucaoISO,
          'mês': mes,
          ano
        } as any;
      });

      // Aplicar filtros
      let filteredChamados = chamados;

      if (filters.mes && filters.ano) {
        filteredChamados = chamados.filter((chamado: any) => {
          const mesChamado = Number(chamado['mês']);
          const anoChamado = Number(chamado.ano);
          // Se não houver mês/ano definidos na linha, mantemos o item (não descartamos)
          if (!mesChamado || !anoChamado) return true;
          return mesChamado === Number(filters.mes) && anoChamado === Number(filters.ano);
        });

        // Fallback: se não houver resultados para o mês, mostrar do ano todo
        if (filteredChamados.length === 0) {
          filteredChamados = chamados.filter((chamado: any) => {
            const anoChamado = Number(chamado.ano);
            return !!anoChamado && anoChamado === Number(filters.ano);
          });
        }
      } else if (filters.ano) {
        filteredChamados = chamados.filter((chamado: any) => {
          const anoChamado = Number(chamado.ano) || 0;
          return anoChamado === filters.ano;
        });
      }

      console.log('🧪 [V2] Totais', {
        totalLido: (rows?.length ?? 0) - 1,
        totalProcessado: chamados.length,
        totalFiltrado: filteredChamados.length,
        exemplo: filteredChamados[0]
      });

      console.log(`✅ ${filteredChamados.length} chamados encontrados para os filtros aplicados`);
      return filteredChamados;

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados da planilha:', error.message);
      
      // Retry logic para 429 (Too Many Requests)
      if (error.message.includes('429')) {
        console.log('⏳ Aguardando 5 segundos antes de tentar novamente...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.getChamados(filters);
      }
      
      throw error;
    }
  }

  // Métodos auxiliares (copiados do provider original)
  private converterRelogioParaDecimal(tempo: string): number {
    if (!tempo || typeof tempo !== 'string') return 0;
    
    const partes = tempo.split(':');
    if (partes.length !== 2) return 0;
    
    const horas = parseInt(partes[0]) || 0;
    const minutos = parseInt(partes[1]) || 0;
    
    return horas + (minutos / 60);
  }

  private converterDecimalParaHoras(decimal: number): string {
    if (isNaN(decimal) || decimal < 0) return '00:00';
    
    const horas = Math.floor(decimal);
    const minutos = Math.round((decimal - horas) * 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  private somarTempos(tempo1: string, tempo2: string): string {
    const decimal1 = this.converterRelogioParaDecimal(tempo1);
    const decimal2 = this.converterRelogioParaDecimal(tempo2);
    const soma = decimal1 + decimal2;
    
    return this.converterDecimalParaHoras(soma);
  }

  // Método para buscar métricas
  async getMetricas(filters: any = {}): Promise<any> {
    try {
      console.log('📊 [V2] Buscando métricas do Google Sheets...', filters);

      // Buscar configuração ativa da empresa
      let horasContratadas = 40; // Valor padrão como fallback
      let permiteSaldoNegativo = false; // Valor padrão como fallback
      let dataInicio = null; // Data de início do contrato
      let dataFim = null; // Data de fim do contrato

      try {
        // Buscar configuração ativa da empresa
        const companyId = filters.companyId || filters.company_id;
        if (companyId) {
          console.log('🔍 [V2] Buscando configuração para companyId:', companyId);
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flow.gobi-zi.com';
          const configResponse = await fetch(`${baseUrl}/api/sustentacao/config-empresa?companyId=${companyId}`);
          if (configResponse.ok) {
            const configData = await configResponse.json();
            if (configData.success && configData.data) {
              horasContratadas = configData.data.horas_contratadas;
              permiteSaldoNegativo = configData.data.saldo_negativo;
              dataInicio = new Date(configData.data.data_inicio);
              dataFim = new Date(configData.data.data_fim);
              console.log('✅ [V2] Usando configuração da empresa:', {
                horasContratadas,
                permiteSaldoNegativo,
                dataInicio: dataInicio.toLocaleDateString('pt-BR'),
                dataFim: dataFim.toLocaleDateString('pt-BR')
              });
            } else {
              console.log('⚠️ [V2] Nenhuma configuração ativa encontrada para a empresa');
            }
          } else {
            console.log('⚠️ [V2] Erro na API de configuração:', configResponse.status);
          }
        } else {
          console.log('⚠️ [V2] CompanyId não encontrado nos filtros:', filters);
        }
      } catch (error) {
        console.log('⚠️ [V2] Erro ao buscar configuração, usando valor padrão:', error);
      }

      // Calcular horas consumidas dos chamados com filtros (replicar V1)
      const chamados = await this.getChamados(filters);
      const tempoTotal = chamados.reduce((total: string, chamado: any) => {
        return this.somarTempos(total, chamado.tempoAtendimento || '00:00');
      }, '00:00');

      const chamadosAtivos = chamados.filter((c: any) => c.status === 'Ativo').length;

      const horasConsumidasDecimal = this.converterRelogioParaDecimal(tempoTotal);
      const horasRestantesDecimal = horasContratadas - horasConsumidasDecimal;

      // Lógica para Saldo Acumulado (considerando período de vigência)
      let saldoAcumuladoMesesAnteriores = 0;
      const hoje = new Date();
      const mesAtual = filters.mes || hoje.getMonth() + 1;
      const anoAtual = filters.ano || hoje.getFullYear();

      console.log('📅 [V2] Período de vigência do contrato:', {
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
              console.log(`⏭️ [V2] Mês ${mes} fora do período de vigência, pulando...`);
              continue;
            }

            const chamadosMesAnterior = await this.getChamados({ mes, ano });
            const tempoTotalMesAnterior = chamadosMesAnterior.reduce((total: string, chamado: any) => {
              return this.somarTempos(total, chamado.tempoAtendimento || '00:00');
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
        console.log('⚠️ [V2] Período de vigência não encontrado, usando cálculo padrão');
        // Se não houver data de início/fim, calcular saldo acumulado de todos os meses anteriores ao atual
        for (let ano = 2023; ano <= anoAtual; ano++) { // Começa de um ano razoável
          const mesInicialLoop = (ano === 2023) ? 1 : 1;
          const mesFinalLoop = (ano === anoAtual) ? mesAtual - 1 : 12;

          for (let mes = mesInicialLoop; mes <= mesFinalLoop; mes++) {
            const chamadosMesAnterior = await this.getChamados({ mes, ano });
            const tempoTotalMesAnterior = chamadosMesAnterior.reduce((total: string, chamado: any) => {
              return this.somarTempos(total, chamado.tempoAtendimento || '00:00');
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
        console.log('⚠️ [V2] Saldo negativo não permitido, usando apenas horas contratadas:', horasContratadas);
      }

      console.log('✅ [V2] Saldo negativo permitido - cálculo final:', {
        horasContratadasProximoMes: horasContratadas,
        saldoAcumuladoMesesAnteriores,
        saldoMesAtual: saldoMesAtualDecimal,
        saldoFinalProximoMes
      });

      const metricas = {
        horasContratadas: this.converterDecimalParaHoras(horasContratadas),
        horasConsumidas: tempoTotal,
        horasRestantes: this.converterDecimalParaHoras(horasRestantesDecimal),
        saldoProximoMes: this.converterDecimalParaHoras(saldoMesAtualDecimal), // Mostra o saldo do mês atual
        saldoAcumulado: this.converterDecimalParaHoras(saldoAcumuladoMesesAnteriores + saldoMesAtualDecimal), // Saldo acumulado
        chamadosAtivos,
      };

      console.log('✅ [V2] Métricas calculadas:', metricas);
      return metricas;
    } catch (error) {
      console.error('❌ [V2] Erro ao buscar métricas:', error);
      throw error;
    }
  }

  // Método para buscar chamados por categoria
  async getChamadosPorCategoria(filters: any = {}): Promise<any[]> {
    try {
      console.log('📊 [V2] Buscando chamados por categoria...', filters);
      
      const chamados = await this.getChamados(filters);
      
      // Agrupar por categoria
      const categoriasMap = new Map();
      
      chamados.forEach((chamado: any) => {
        const categoria = chamado.categoria || 'Sem Categoria';
        if (!categoriasMap.has(categoria)) {
          categoriasMap.set(categoria, {
            categoria,
            total: 0,
            resolvidos: 0,
            pendentes: 0,
            emAndamento: 0,
            tempoTotal: 0
          });
        }
        
        const cat = categoriasMap.get(categoria);
        cat.total++;
        cat.tempoTotal += parseFloat(chamado.tempoAtendimento || '0');
        
        if (chamado.status === 'Resolvido') cat.resolvidos++;
        else if (chamado.status === 'Pendente') cat.pendentes++;
        else if (chamado.status === 'Em Andamento') cat.emAndamento++;
      });
      
      const categorias = Array.from(categoriasMap.values());
      console.log('✅ [V2] Categorias calculadas:', categorias.length);
      return categorias;
    } catch (error) {
      console.error('❌ [V2] Erro ao buscar categorias:', error);
      throw error;
    }
  }
}