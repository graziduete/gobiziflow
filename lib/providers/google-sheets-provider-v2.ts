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
          const mesChamado = Number(chamado['mês']) || 0;
          const anoChamado = Number(chamado.ano) || 0;
          return mesChamado === filters.mes && anoChamado === filters.ano;
        });
      } else if (filters.ano) {
        filteredChamados = chamados.filter((chamado: any) => {
          const anoChamado = Number(chamado.ano) || 0;
          return anoChamado === filters.ano;
        });
      }

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

  private converterDecimalParaRelogio(decimal: number): string {
    if (isNaN(decimal) || decimal < 0) return '00:00';
    
    const horas = Math.floor(decimal);
    const minutos = Math.round((decimal - horas) * 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  private somarTempos(tempo1: string, tempo2: string): string {
    const decimal1 = this.converterRelogioParaDecimal(tempo1);
    const decimal2 = this.converterRelogioParaDecimal(tempo2);
    const soma = decimal1 + decimal2;
    
    return this.converterDecimalParaRelogio(soma);
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

      // Calcular horas consumidas dos chamados com filtros
      const chamados = await this.getChamados(filters);
      const tempoTotal = chamados.reduce((total: number, chamado: any) => {
        const tempo = parseFloat(chamado.tempoAtendimento || '0');
        return total + tempo;
      }, 0);

      const horasConsumidas = tempoTotal;
      const saldo = horasContratadas - horasConsumidas;
      const percentualConsumido = horasContratadas > 0 ? (horasConsumidas / horasContratadas) * 100 : 0;

      const metricas = {
        horasContratadas,
        horasConsumidas,
        saldo,
        percentualConsumido,
        permiteSaldoNegativo,
        dataInicio,
        dataFim,
        totalChamados: chamados.length,
        chamadosResolvidos: chamados.filter((c: any) => c.status === 'Resolvido').length,
        chamadosPendentes: chamados.filter((c: any) => c.status === 'Pendente').length,
        chamadosEmAndamento: chamados.filter((c: any) => c.status === 'Em Andamento').length
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