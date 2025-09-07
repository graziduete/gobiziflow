'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { DashboardService } from '@/lib/dashboard-service'

interface ExpectedValueCardProps {
  selectedMonth: string // Formato: YYYY-MM
}

export function ExpectedValueCard({ selectedMonth }: ExpectedValueCardProps) {
  const [expectedData, setExpectedData] = useState<{
    totalExpected: number
    breakdown: Array<{
      companyId: string
      companyName: string
      metricType: string
      expectedValue: number
      details: string
    }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedMonth) {
      fetchExpectedValue()
    }
  }, [selectedMonth])

  const fetchExpectedValue = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await DashboardService.getExpectedValueForMonth(selectedMonth)
      setExpectedData(data)
    } catch (err) {
      console.error('❌ Erro ao buscar valor previsto:', err)
      setError('Erro ao calcular valor previsto')
    } finally {
      setLoading(false)
    }
  }

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const getMetricTypeColor = (metricType: string) => {
    switch (metricType) {
      case 'Parcelas Mensais':
        return 'bg-blue-100 text-blue-800'
      case 'Percentual por Fases':
        return 'bg-green-100 text-green-800'
      case 'Parcelado':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Previsto para este mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Calculando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Previsto para este mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">❌ {error}</p>
            <button 
              onClick={fetchExpectedValue}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Previsto para {formatMonthYear(selectedMonth)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Valor Total */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              R$ {(expectedData?.totalExpected || 0 / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Total esperado para o mês
            </p>
          </div>

          {/* Breakdown */}
          {expectedData?.breakdown && expectedData.breakdown.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Detalhamento por empresa:</h4>
              <div className="space-y-2">
                {expectedData.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{item.companyName}</span>
                        <Badge className={getMetricTypeColor(item.metricType)}>
                          {item.metricType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.details}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        R$ {item.expectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {(!expectedData?.breakdown || expectedData.breakdown.length === 0) && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">
                Nenhuma métrica ativa encontrada para {formatMonthYear(selectedMonth)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}