import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Buscando histórico de configurações...');
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID é obrigatório' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Buscar todas as configurações da empresa (ativas e inativas)
    const { data: configs, error } = await supabase
      .from('sustentacao_empresa_config')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ ${configs?.length || 0} configurações encontradas no histórico`);
    
    return NextResponse.json({
      success: true,
      data: configs || []
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de configurações:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar histórico de configurações',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}