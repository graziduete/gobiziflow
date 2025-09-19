import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Reativando configuração de empresa...');
    
    const body = await request.json();
    const { configId } = body;
    
    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID é obrigatório' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Reativar configuração específica por ID
    const { data: config, error } = await supabase
      .from('sustentacao_empresa_config')
      .update({
        status: 'ativo',
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
    
    console.log('✅ Configuração reativada:', config);
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('❌ Erro ao reativar configuração:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao reativar configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}