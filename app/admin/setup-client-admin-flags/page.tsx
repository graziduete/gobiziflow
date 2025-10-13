"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function SetupClientAdminFlagsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const executeScript = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-client-admin-flags', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch (error) {
      setResult({ success: false, message: 'Erro ao executar script' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Setup - Flags de Client Admin</CardTitle>
          <CardDescription>
            Execute este script para adicionar as colunas necessárias na tabela profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Este script irá adicionar as seguintes colunas na tabela profiles:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><code>is_client_admin</code> - BOOLEAN para identificar client admins</li>
              <li><code>first_login_completed</code> - BOOLEAN para controlar primeiro login</li>
            </ul>
          </div>

          <Button 
            onClick={executeScript} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              'Executar Script'
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              result.success 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
