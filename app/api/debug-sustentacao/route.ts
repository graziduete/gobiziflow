import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    // Verificar se há configuração ativa
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
    
    return NextResponse.json({
      success: true,
      companyId,
      configFound: !!configData,
      configData: configData || null,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}