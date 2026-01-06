"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, Info } from "lucide-react"
import { formatDecimalToHHMM } from "@/lib/utils/hours"
import { translateStatus } from "@/lib/utils/status-translation"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  excessDetails?: {
    exceededBy: number
    contractedHours: number
    totalConsumed: number
    totalProjects: number
    topConsumingProjects: Array<{
      projectId: string
      projectName: string
      consumedHours: number
      estimatedHours: number
      status: string
      cumulativeHours: number
      isExceedingProject?: boolean
    }>
  }
}

export function StatsCard({ title, value, description, icon: Icon, trend, excessDetails }: StatsCardProps) {
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
        {isNegative && excessDetails && excessDetails.topConsumingProjects.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-2 pt-2 border-t border-red-200/50">
                  <div className="flex items-center gap-1 text-xs text-red-600 cursor-help hover:text-red-700">
                    <Info className="h-3 w-3" />
                    <span className="font-medium">Ver o que está excedendo</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md p-4 bg-white border border-red-200 shadow-xl">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">
                      Excesso de {formatDecimalToHHMM(excessDetails.exceededBy)}
                    </p>
                    <p className="text-xs text-slate-600 mb-1">
                      Contratadas: {formatDecimalToHHMM(excessDetails.contractedHours)} | 
                      Consumidas: {formatDecimalToHHMM(excessDetails.totalConsumed)}
                    </p>
                    <p className="text-xs font-medium text-red-600 mt-2 mb-3">
                      Projetos que estão causando o excesso:
                    </p>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {excessDetails.topConsumingProjects.map((project, index) => {
                      const isExceeding = project.isExceedingProject
                      const isLastItem = index === excessDetails.topConsumingProjects.length - 1
                      
                      return (
                        <div 
                          key={project.projectId} 
                          className={`flex items-start justify-between gap-2 p-2 rounded border ${
                            isExceeding 
                              ? 'bg-red-50 border-red-300' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-xs font-semibold truncate ${
                                isExceeding ? 'text-red-800' : 'text-slate-800'
                              }`}>
                                {index + 1}. {project.projectName}
                              </p>
                              {isExceeding && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                  Ultrapassou
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mb-0.5">
                              Consumiu: {formatDecimalToHHMM(project.consumedHours)}
                              {project.estimatedHours > 0 && (
                                <span className="ml-1 text-slate-500">
                                  (estimadas: {formatDecimalToHHMM(project.estimatedHours)})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {isLastItem ? (
                                <span className="font-semibold text-slate-700">
                                  Total acumulado: {formatDecimalToHHMM(project.cumulativeHours)}
                                </span>
                              ) : (
                                <>
                                  Acumulado até aqui: {formatDecimalToHHMM(project.cumulativeHours)}
                                  {isExceeding && (
                                    <span className="ml-1 text-red-600 font-medium">
                                      (limite: {formatDecimalToHHMM(excessDetails.contractedHours)})
                                    </span>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {translateStatus(project.status)}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
