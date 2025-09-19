import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Buscando todas as configurações...');
    
    const supabase = await createClient();
    
    // Buscar todas as configurações de todas as empresas
    const { data: configs, error } = await supabase
      .from('sustentacao_empresa_config')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ ${configs?.length || 0} configurações encontradas`);
    
    return NextResponse.json({
      success: true,
      data: configs || []
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar configurações',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}