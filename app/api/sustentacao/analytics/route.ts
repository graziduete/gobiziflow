import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsProviderV2 } from '@/lib/providers/google-sheets-provider-v2';
import { localCache, createCacheKey } from '@/lib/cache/local-cache';

// ID da Copersucar
const COPERSUCAR_ID = '443a6a0e-768f-48e4-a9ea-0cd972375a30';

// Função para calcular período safra
function getSafraPeriod(safra: string): { start: Date; end: Date } | null {
  const match = safra.match(/(\d{4})\/(\d{2,4})/);
  if (!match) return null;
  
  const startYear = parseInt(match[1]);
  const endYearShort = parseInt(match[2]);
  const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
  
  return {
    start: new Date(startYear, 3, 1), // 01/04
    end: new Date(endYear, 2, 31) // 31/03
  };
}

// Função para obter meses do período (safra ou calendário)
function getMonthsInPeriod(periodType: 'safra' | 'calendar', periodValue: string | number): Array<{ month: number; year: number; label: string }> {
  const months: Array<{ month: number; year: number; label: string }> = [];
  
  if (periodType === 'safra') {
    const safraPeriod = getSafraPeriod(periodValue as string);
    if (!safraPeriod) return [];
    
    const current = new Date(safraPeriod.start);
    const end = new Date(safraPeriod.end);
    
    while (current <= end) {
      months.push({
        month: current.getMonth() + 1,
        year: current.getFullYear(),
        label: current.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      });
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Calendário: 12 meses do ano
    const year = typeof periodValue === 'number' ? periodValue : parseInt(periodValue);
    for (let month = 1; month <= 12; month++) {
      const date = new Date(year, month - 1, 1);
      months.push({
        month,
        year,
        label: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      });
    }
  }
  
  return months;
}

// Função para verificar se uma data está no período
function isDateInPeriod(date: Date, periodType: 'safra' | 'calendar', periodValue: string | number): boolean {
  if (periodType === 'safra') {
    const safraPeriod = getSafraPeriod(periodValue as string);
    if (!safraPeriod) return false;
    return date >= safraPeriod.start && date <= safraPeriod.end;
  } else {
    const year = typeof periodValue === 'number' ? periodValue : parseInt(periodValue);
    return date.getFullYear() === year;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companyId = body.companyId;
    const periodType = body.periodType || 'calendar'; // 'safra' ou 'calendar'
    const periodValue = body.periodValue; // safra string (ex: "2025/26") ou ano number (ex: 2025)
    const monthsToShow = body.monthsToShow ?? 6; // Quantos meses mostrar (últimos N meses). undefined = todos os meses

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📊 [Analytics] Buscando dados históricos de sustentação...', {
      companyId,
      periodType,
      periodValue,
      monthsToShow
    });

    // Criar chave de cache
    const cacheKey = createCacheKey('sustentacao-analytics', {
      companyId,
      periodType,
      periodValue,
      monthsToShow
    });

    // Tentar buscar do cache primeiro (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const cachedData = localCache.get(cacheKey);
      if (cachedData) {
        console.log('🚀 [Analytics] Retornando dados do cache local');
        return NextResponse.json({
          ...cachedData,
          cached: true
        });
      }
    }

    // Verificar configuração
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração Google Sheets não encontrada' },
        { status: 500 }
      );
    }

    // Buscar configuração da empresa
    let spreadsheetId: string;
    let tabName: string = 'Página1';

    if (companyId === COPERSUCAR_ID) {
      spreadsheetId = process.env.GOOGLE_SHEETS_COPERCUSAR_ID || '';
      if (!spreadsheetId) {
        return NextResponse.json(
          { success: false, error: 'Configuração Copersucar não encontrada' },
          { status: 500 }
        );
      }
    } else {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      
      const { data: config, error } = await supabase
        .from('sustentacao_google_sheets_config')
        .select('spreadsheet_id, tab_name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (error || !config) {
        return NextResponse.json(
          { success: false, error: 'Configuração Google Sheets não encontrada para empresa' },
          { status: 500 }
        );
      }

      spreadsheetId = config.spreadsheet_id;
      tabName = config.tab_name || 'Página1';
    }

    // Criar provider
    const provider = new GoogleSheetsProviderV2(spreadsheetId, tabName);

    // Buscar TODOS os chamados da planilha (sem filtro de mês/ano)
    // Isso evita múltiplas requisições
    console.log('📊 [Analytics] Buscando todos os chamados da planilha...');
    const allChamados = await provider.getChamados({}); // Sem filtros para pegar tudo

    console.log(`📊 [Analytics] Total de chamados encontrados: ${allChamados.length}`);

    // Obter meses do período
    const monthsInPeriod = getMonthsInPeriod(periodType, periodValue);
    
    // Para safra (Copersucar), mostrar TODOS os meses da safra
    // Para calendário, mostrar os últimos N meses (ou todos se monthsToShow for undefined)
    const monthsToDisplay = periodType === 'safra' || monthsToShow === undefined
      ? monthsInPeriod  // Todos os meses do período
      : monthsInPeriod.slice(-monthsToShow); // Últimos N meses

    // Agrupar dados por mês e categoria
    const dataByMonth: Map<string, {
      month: number;
      year: number;
      label: string;
      chamadosByCategoria: Map<string, number>;
      totalChamados: number;
      horasConsumidas: number;
    }> = new Map();

    // Inicializar estrutura para cada mês
    monthsToDisplay.forEach(({ month, year, label }) => {
      const key = `${year}-${month}`;
      dataByMonth.set(key, {
        month,
        year,
        label,
        chamadosByCategoria: new Map(),
        totalChamados: 0,
        horasConsumidas: 0
      });
    });

    // Processar chamados
    const categoriasSet = new Set<string>();
    
    allChamados.forEach((chamado: any) => {
      if (!chamado.dataAbertura) return;

      const dataAbertura = new Date(chamado.dataAbertura);
      
      // Verificar se a data é válida
      if (isNaN(dataAbertura.getTime())) {
        console.warn('⚠️ [Analytics] Data de abertura inválida:', chamado.dataAbertura);
        return;
      }
      
      // Verificar se está no período
      if (!isDateInPeriod(dataAbertura, periodType, periodValue)) {
        return;
      }

      const month = dataAbertura.getMonth() + 1;
      const year = dataAbertura.getFullYear();
      const key = `${year}-${month}`;

      const monthData = dataByMonth.get(key);
      if (!monthData) {
        // Mês não está no período a ser exibido (últimos N meses)
        return;
      }

      // Contar chamado
      monthData.totalChamados++;

      // Agrupar por categoria
      const categoria = chamado.categoria || 'Sem categoria';
      categoriasSet.add(categoria);
      const currentCount = monthData.chamadosByCategoria.get(categoria) || 0;
      monthData.chamadosByCategoria.set(categoria, currentCount + 1);

      // Somar horas (converter de HH:MM para decimal)
      // O provider retorna tanto 'tempoAtendimento' quanto 'horas', usar o que estiver disponível
      const tempoAtendimento = chamado.tempoAtendimento || chamado.horas || '';
      
      if (tempoAtendimento) {
        let horas = 0;
        const tempoStr = tempoAtendimento.toString().trim();
        
        // Verificar se está no formato HH:MM
        if (tempoStr.includes(':')) {
          const partes = tempoStr.split(':');
          const horasParte = parseInt(partes[0]) || 0;
          const minutosParte = parseInt(partes[1]) || 0;
          const segundosParte = partes.length >= 3 ? (parseInt(partes[2]) || 0) : 0;
          horas = horasParte + (minutosParte / 60) + (segundosParte / 3600);
        } else {
          // Tentar como decimal
          horas = parseFloat(tempoStr.replace(',', '.')) || 0;
        }
        
        if (horas > 0) {
          monthData.horasConsumidas += horas;
        }
      }
    });
    
    // Log para debug
    console.log('📊 [Analytics] Dados agregados por mês:', 
      Array.from(dataByMonth.entries()).map(([key, data]) => ({
        mes: key,
        totalChamados: data.totalChamados,
        horasConsumidas: data.horasConsumidas.toFixed(2)
      }))
    );

    // Buscar configuração da empresa para horas contratadas
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data: configs } = await supabase
      .from('sustentacao_empresa_config')
      .select('horas_contratadas, data_fim')
      .eq('company_id', companyId)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

    // Verificar se alguma configuração ativa não está expirada
    const today = new Date().toISOString().split('T')[0];
    const activeConfig = configs?.find(config => 
      !config.data_fim || config.data_fim >= today
    );

    const horasContratadasMensais = activeConfig?.horas_contratadas 
      ? parseFloat(activeConfig.horas_contratadas.toString()) 
      : 40;

    // Calcular saldo acumulado
    let saldoAcumulado = 0;
    const saldoByMonth: Array<{ month: number; year: number; label: string; saldo: number }> = [];

    monthsToDisplay.forEach(({ month, year, label }) => {
      const key = `${year}-${month}`;
      const monthData = dataByMonth.get(key);
      if (!monthData) return;

      saldoAcumulado += horasContratadasMensais - monthData.horasConsumidas;
      saldoByMonth.push({
        month,
        year,
        label,
        saldo: saldoAcumulado
      });
    });

    // Preparar dados para gráficos
    const categorias = Array.from(categoriasSet).sort();
    
    // Dados para gráfico de evolução por categoria
    const evolucaoPorCategoria = categorias.map(categoria => ({
      categoria,
      data: monthsToDisplay.map(({ month, year, label }) => {
        const key = `${year}-${month}`;
        const monthData = dataByMonth.get(key);
        return {
          month,
          year,
          label,
          quantidade: monthData?.chamadosByCategoria.get(categoria) || 0
        };
      })
    }));

    // Dados para gráfico de horas
    const horasData = monthsToDisplay.map(({ month, year, label }) => {
      const key = `${year}-${month}`;
      const monthData = dataByMonth.get(key);
      return {
        month,
        year,
        label,
        contratadas: horasContratadasMensais,
        consumidas: monthData?.horasConsumidas || 0
      };
    });

    // Dados para gráfico de saldo acumulado
    const saldoData = saldoByMonth;

    const responseData = {
      success: true,
      periodType,
      periodValue,
      meses: monthsToDisplay,
      categorias,
      evolucaoPorCategoria,
      horasData,
      saldoData,
      loadTime: Date.now()
    };

    // Salvar no cache (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      localCache.set(cacheKey, responseData);
      console.log(`⏱️ [Analytics] Dados carregados e salvos no cache`);
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ [Analytics] Erro ao buscar dados:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar dados de analytics',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

