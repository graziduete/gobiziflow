import { NextRequest, NextResponse } from 'next/server';
import { localCache } from '@/lib/cache/local-cache';

export async function GET() {
  try {
    // Retornar estatísticas do cache
    const stats = localCache.stats();
    
    return NextResponse.json({
      success: true,
      stats,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do cache:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas do cache' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Limpar cache
    localCache.clear();
    
    return NextResponse.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar cache' },
      { status: 500 }
    );
  }
}


