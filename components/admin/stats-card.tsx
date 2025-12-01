"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  // Debug: rastrear valores recebidos pelo StatsCard
  if (title.includes("Horas Consumidas")) {
    console.log("🔧 [StatsCard] Total de Horas Consumidas recebeu valor:", value)
  }
  
  // Detectar se o valor é negativo (para "Horas Restantes")
  const isNegative = title.includes("Horas Restantes") && (
    (typeof value === 'string' && value.startsWith('-')) ||
    (typeof value === 'number' && value < 0)
  )
  
  // Calcular valor absoluto para exibição
  const displayValue = typeof value === 'string' && value.startsWith('-') 
    ? value 
    : (typeof value === 'number' && value < 0 ? `-${Math.abs(value)}` : value)
  
  // Calcular horas excedidas se negativo
  const exceededHours = isNegative && typeof value === 'string' && value.startsWith('-')
    ? value.substring(1) // Remove o sinal negativo
    : null
  
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 group ${
      isNegative 
        ? 'bg-gradient-to-br from-red-50/50 to-orange-50/50 border-red-200/50' 
        : 'bg-gradient-to-br from-white to-slate-50/50'
    }`}>
      {/* Fundo decorativo com gradiente */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-all duration-500 ${
        isNegative
          ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 group-hover:from-red-500/20 group-hover:to-orange-500/20'
          : 'bg-gradient-to-br from-blue-500/5 to-indigo-500/5 group-hover:from-blue-500/10 group-hover:to-indigo-500/10'
      }`} />
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10">
        <div className="flex-1">
          {isNegative && (
            <Badge variant="destructive" className="mb-1 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Saldo Negativo
            </Badge>
          )}
          <CardTitle className={`text-sm font-medium transition-colors ${
            isNegative ? 'text-red-700 group-hover:text-red-900' : 'text-slate-600 group-hover:text-slate-900'
          }`}>
            {title}
          </CardTitle>
        </div>
        <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
          isNegative
            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 group-hover:from-red-500/30 group-hover:to-orange-500/30'
            : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 group-hover:from-blue-500/20 group-hover:to-indigo-500/20'
        }`}>
          {isNegative && title.includes("Horas Restantes") ? (
            <AlertTriangle className={`h-4 w-4 ${isNegative ? 'text-red-600' : 'text-blue-600'}`} />
          ) : (
            <Icon className={`h-4 w-4 ${isNegative ? 'text-red-600' : 'text-blue-600'}`} />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className={`text-3xl font-bold mb-1 transition-all duration-300 group-hover:scale-105 ${
          isNegative
            ? 'text-red-600'
            : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
        }`}>
          {displayValue}
        </div>
        {description && (
          <p className={`text-xs font-medium ${
            isNegative ? 'text-red-600' : 'text-slate-500'
          }`}>
            {isNegative ? 'Horas excedidas' : description}
          </p>
        )}
        {isNegative && exceededHours && (
          <p className="text-xs text-red-500 mt-1">
            Excedeu em {exceededHours} horas
          </p>
        )}
        {trend && (
          <div className="flex items-center pt-2 mt-2 border-t border-slate-100">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            }`}>
              {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-slate-400 ml-2">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
