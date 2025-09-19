// API para gerenciar histórico mensal de saldos
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Buscando saldo mensal...');
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const ano = searchParams.get('ano');
    const mes = searchParams.get('mes');
    
    const supabase = await createClient();
    
    if (!companyId || !ano || !mes) {
      // Listar todos os saldos
      const { data: saldos, error } = await supabase
        .from('sustentacao_saldo_mensal')
        .select(`
          *,
          sustentacao_empresa_config (
            id,
            horas_contratadas,
            saldo_negativo,
            data_inicio,
            data_fim
          )
        `)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        data: saldos || []
      });
    }
    
    // Buscar saldo mensal específico
    const { data: saldo, error } = await supabase
      .from('sustentacao_saldo_mensal')
      .select(`
        *,
        sustentacao_empresa_config (
          id,
          horas_contratadas,
          saldo_negativo,
          data_inicio,
          data_fim
        )
      `)
      .eq('company_id', companyId)
      .eq('ano', parseInt(ano))
      .eq('mes', parseInt(mes))
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: saldo || null
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar saldo mensal:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar saldo mensal',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Criando saldo mensal...');
    
    const body = await request.json();
    const { 
      companyId,
      configId,
      ano,
      mes,
      horasContratadas,
      horasConsumidas = 0,
      saldoAnterior = 0
    } = body;
    
    if (!companyId || !configId || !ano || !mes || !horasContratadas) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: companyId, configId, ano, mes, horasContratadas' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Verificar se já existe saldo para este mês
    const { data: existingSaldo } = await supabase
      .from('sustentacao_saldo_mensal')
      .select('id')
      .eq('company_id', companyId)
      .eq('ano', parseInt(ano))
      .eq('mes', parseInt(mes))
      .single();
    
    if (existingSaldo) {
      return NextResponse.json(
        { error: 'Já existe saldo para este mês' },
        { status: 400 }
      );
    }
    
    // Calcular saldos
    const horasContratadasNum = parseFloat(horasContratadas);
    const horasConsumidasNum = parseFloat(horasConsumidas);
    const saldoAnteriorNum = parseFloat(saldoAnterior);
    
    const saldoMes = horasContratadasNum + saldoAnteriorNum - horasConsumidasNum;
    const saldoAcumulado = saldoMes; // Para o primeiro mês, saldo acumulado = saldo do mês
    
    // Criar saldo mensal
    const { data: saldo, error } = await supabase
      .from('sustentacao_saldo_mensal')
      .insert({
        company_id: companyId,
        config_id: configId,
        ano: parseInt(ano),
        mes: parseInt(mes),
        horas_contratadas: horasContratadasNum,
        horas_consumidas: horasConsumidasNum,
        saldo_mes: saldoMes,
        saldo_anterior: saldoAnteriorNum,
        saldo_acumulado: saldoAcumulado,
        status: 'ativo'
      })
      .select(`
        *,
        sustentacao_empresa_config (
          id,
          horas_contratadas,
          saldo_negativo,
          data_inicio,
          data_fim
        )
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Saldo mensal criado:', saldo);
    
    return NextResponse.json({
      success: true,
      data: saldo
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar saldo mensal:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao criar saldo mensal',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Atualizando saldo mensal...');
    
    const body = await request.json();
    const { 
      saldoId,
      horasConsumidas,
      status = 'ativo'
    } = body;
    
    if (!saldoId) {
      return NextResponse.json(
        { error: 'saldoId é obrigatório' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Buscar saldo atual
    const { data: currentSaldo, error: fetchError } = await supabase
      .from('sustentacao_saldo_mensal')
      .select('*')
      .eq('id', saldoId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Recalcular saldos
    const horasConsumidasNum = parseFloat(horasConsumidas) || currentSaldo.horas_consumidas;
    const saldoMes = currentSaldo.horas_contratadas + currentSaldo.saldo_anterior - horasConsumidasNum;
    
    // Atualizar saldo mensal
    const { data: saldo, error } = await supabase
      .from('sustentacao_saldo_mensal')
      .update({
        horas_consumidas: horasConsumidasNum,
        saldo_mes: saldoMes,
        saldo_acumulado: saldoMes, // Simplificado para este exemplo
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', saldoId)
      .select(`
        *,
        sustentacao_empresa_config (
          id,
          horas_contratadas,
          saldo_negativo,
          data_inicio,
          data_fim
        )
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Saldo mensal atualizado:', saldo);
    
    return NextResponse.json({
      success: true,
      data: saldo
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar saldo mensal:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao atualizar saldo mensal',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Endpoint para buscar histórico de uma empresa
export async function PATCH(request: NextRequest) {
  try {
    console.log('📈 Buscando histórico de saldos...');
    
    const body = await request.json();
    const { companyId, anoInicio, anoFim } = body;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId é obrigatório' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    let query = supabase
      .from('sustentacao_saldo_mensal')
      .select(`
        *,
        sustentacao_empresa_config (
          id,
          horas_contratadas,
          saldo_negativo,
          data_inicio,
          data_fim
        )
      `)
      .eq('company_id', companyId)
      .order('ano', { ascending: true })
      .order('mes', { ascending: true });
    
    if (anoInicio) {
      query = query.gte('ano', parseInt(anoInicio));
    }
    
    if (anoFim) {
      query = query.lte('ano', parseInt(anoFim));
    }
    
    const { data: historico, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: historico || []
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar histórico',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}