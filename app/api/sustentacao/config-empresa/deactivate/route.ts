import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Inativando configuração de empresa...');
    
    const body = await request.json();
    console.log('📝 Body recebido:', body);
    const { configId } = body;
    
    if (!configId) {
      console.log('❌ ConfigId não fornecido');
      return NextResponse.json(
        { error: 'Config ID é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log('🔧 ConfigId recebido:', configId);
    
    const supabase = await createClient();
    
    // Primeiro, verificar se a configuração existe e está ativa
    const { data: existingConfig, error: fetchError } = await supabase
      .from('sustentacao_empresa_config')
      .select('id, status, company_id')
      .eq('id', configId)
      .single();
    
    if (fetchError) {
      throw new Error(`Configuração não encontrada: ${fetchError.message}`);
    }
    
    if (existingConfig.status !== 'ativo') {
      throw new Error(`Configuração não está ativa (status atual: ${existingConfig.status})`);
    }
    
    // Inativar configuração específica por ID
    const { data: config, error } = await supabase
      .from('sustentacao_empresa_config')
      .update({
        status: 'inativo',
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Configuração inativada:', config);
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('❌ Erro ao inativar configuração:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao inativar configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}