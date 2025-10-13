import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { sql } = body
    
    if (!sql) {
      return NextResponse.json({ error: "SQL é obrigatório" }, { status: 400 })
    }
    
    console.log("Executando SQL:", sql)
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error("Erro ao executar SQL:", error)
      return NextResponse.json({ error: "Erro ao executar SQL", details: error }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Erro na API execute-sql:", error)
    return NextResponse.json({ error: "Erro interno do servidor", details: error }, { status: 500 })
  }
}
