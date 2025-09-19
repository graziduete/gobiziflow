import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Deletando configuração problemática...');
    
    const supabase = await createClient();
    
    // Deletar a configuração problemática
    const { error } = await supabase
      .from('sustentacao_empresa_config')
      .delete()
      .eq('id', '28163d9a-eb41-45df-9f31-2cafaa2d8def');
    
    if (error) {
      console.error('❌ Erro ao deletar configuração:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    console.log('✅ Configuração deletada com sucesso');
    
    return NextResponse.json({
      success: true,
      message: 'Configuração deletada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro geral',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}