import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const { configId } = params;
    
    if (!configId) {
      return NextResponse.json(
        { error: 'ID da configuração é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: config, error } = await supabase
      .from('sustentacao_empresa_config')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .eq('id', configId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('❌ Erro ao buscar configuração:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}