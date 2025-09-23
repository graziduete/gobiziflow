// Método para calcular métricas (mesma lógica do provider original)
export async function getMetricasV2(provider: any, filters: any) {
  try {
    const chamados = await provider.getChamados(filters);
    
    // Buscar configuração da empresa (horas contratadas, etc.)
    let horasContratadas = 40; // Valor padrão
    let permiteSaldoNegativo = false;
    let dataInicio = new Date();
    let dataFim = new Date();

    try {
      // Buscar configuração ativa da empresa diretamente do banco
      const companyId = filters.companyId || filters.company_id;
      if (companyId) {
        console.log('🔍 Buscando configuração para companyId:', companyId);
        
        // Importar o Supabase diretamente
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = createClient();
        
        const { data: configData, error } = await supabase
          .from('sustentacao_empresa_config')
          .select(`
            *,
            companies (
              id,
              name
            )
          `)
          .eq('company_id', companyId)
          .eq('status', 'ativo')
          .single();
          
        if (configData && !error) {
          // Converter horas contratadas de decimal para formato HH:MM se necessário
          const horasContratadasConfig = configData.horas_contratadas;
          if (typeof horasContratadasConfig === 'string' && horasContratadasConfig.includes(':')) {
            // Já está no formato HH:MM
            horasContratadas = provider.converterRelogioParaDecimal(horasContratadasConfig);
          } else {
            // Está em decimal, usar diretamente
            horasContratadas = parseFloat(horasContratadasConfig);
          }
          permiteSaldoNegativo = configData.saldo_negativo;
          dataInicio = new Date(configData.data_inicio);
          dataFim = new Date(configData.data_fim);
          console.log('✅ Usando configuração da empresa:', {
            horasContratadasOriginal: configData.horas_contratadas,
            horasContratadasConvertida: horasContratadas,
            permiteSaldoNegativo,
            dataInicio: dataInicio.toLocaleDateString('pt-BR'),
            dataFim: dataFim.toLocaleDateString('pt-BR')
          });
        } else {
          console.log('⚠️ Nenhuma configuração ativa encontrada para a empresa:', error);
        }
      } else {
        console.log('⚠️ CompanyId não encontrado nos filtros:', filters);
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar configuração, usando valor padrão:', error);
    }

    // Calcular métricas
    const tempoTotal = chamados.reduce((total: string, chamado: any) => {
      return provider.somarTempos(total, chamado.horas || '00:00');
    }, '00:00');

    const horasConsumidas = provider.converterRelogioParaDecimal(tempoTotal);
    const horasRestantes = Math.max(0, horasContratadas - horasConsumidas);
    
    // Calcular saldo acumulado (mesma lógica do provider original)
    let saldoAcumulado = 0;
    
    try {
      // Buscar dados de meses anteriores
      const mesAtual = filters.mes || new Date().getMonth() + 1;
      const anoAtual = filters.ano || new Date().getFullYear();
      
      // Buscar dados de todos os meses anteriores dentro do período de vigência
      for (let mes = 1; mes < mesAtual; mes++) {
        const chamadosMesAnterior = await provider.getChamados({ 
          ...filters, 
          mes, 
          ano: anoAtual 
        });
        
        const tempoTotalMesAnterior = chamadosMesAnterior.reduce((total: string, chamado: any) => {
          return provider.somarTempos(total, chamado.horas || '00:00');
        }, '00:00');
        
        const horasConsumidasMesAnterior = provider.converterRelogioParaDecimal(tempoTotalMesAnterior);
        const saldoMesAnterior = horasContratadas - horasConsumidasMesAnterior;
        
        // Verificar se o mês está dentro do período de vigência
        const dataMesAnterior = new Date(anoAtual, mes - 1, 1);
        if (dataMesAnterior >= dataInicio && dataMesAnterior <= dataFim) {
          saldoAcumulado += saldoMesAnterior;
        }
      }
      
      // Aplicar regra de saldo negativo se não permitido
      if (!permiteSaldoNegativo && saldoAcumulado < 0) {
        saldoAcumulado = 0;
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao calcular saldo acumulado:', error);
    }

    const saldoFinalProximoMes = horasContratadas + saldoAcumulado;

    return {
      horasContratadas: provider.converterDecimalParaRelogio(horasContratadas),
      horasConsumidas: provider.converterDecimalParaRelogio(horasConsumidas),
      horasRestantes: provider.converterDecimalParaRelogio(horasRestantes),
      saldoAcumulado: provider.converterDecimalParaRelogio(saldoAcumulado),
      saldoProximoMes: provider.converterDecimalParaRelogio(saldoFinalProximoMes)
    };

  } catch (error: any) {
    console.error('❌ Erro ao calcular métricas:', error.message);
    throw error;
  }
}