import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Primeiro, vamos verificar se os campos já existem
    const { data: testData, error: testError } = await supabase
      .from('sustentacao_empresa_config')
      .select('google_sheets_spreadsheet_id, google_sheets_tab')
      .limit(1);
    
    if (testError && testError.message.includes('column "google_sheets_spreadsheet_id" does not exist')) {
      // Os campos não existem, vamos tentar adicionar via uma inserção que vai falhar mas criar os campos
      console.log('🔧 Campos não existem, tentando criar...');
      
      // Tentar inserir um registro com os novos campos para forçar a criação
      const { error: insertError } = await supabase
        .from('sustentacao_empresa_config')
        .insert({
          company_id: 'temp-test',
          horas_contratadas: 1,
          data_inicio: '2025-01-01',
          data_fim: '2025-12-31',
          saldo_negativo: false,
          status: 'inativo',
          google_sheets_spreadsheet_id: 'test',
          google_sheets_tab: 'test'
        });
      
      if (insertError) {
        console.log('❌ Erro ao inserir (esperado):', insertError.message);
        
        // Se ainda deu erro, os campos não foram criados
        return NextResponse.json({ 
          success: false, 
          error: 'Campos não puderam ser criados automaticamente',
          details: insertError.message
        });
      }
      
      // Se chegou aqui, os campos foram criados, vamos limpar o registro de teste
      await supabase
        .from('sustentacao_empresa_config')
        .delete()
        .eq('company_id', 'temp-test');
    }
    
    // Verificar se agora os campos existem
    const { data: finalData, error: finalError } = await supabase
      .from('sustentacao_empresa_config')
      .select('google_sheets_spreadsheet_id, google_sheets_tab')
      .limit(1);
    
    if (finalError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Campos ainda não existem',
        details: finalError.message
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Campos do Google Sheets criados com sucesso',
      data: finalData
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}