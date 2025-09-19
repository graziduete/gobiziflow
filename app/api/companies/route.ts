// API para listar empresas
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 Buscando empresas...');
    
    const supabase = await createClient();
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: companies || []
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar empresas',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}