import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { projectId, status } = await request.json();
    
    if (!projectId || !status) {
      return NextResponse.json({ error: 'Project ID and status are required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Tentar atualizar o projeto
    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      project: {
        id: data.id,
        name: data.name,
        status: data.status,
        updated_at: data.updated_at
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}