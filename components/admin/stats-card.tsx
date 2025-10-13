"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

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
  
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-slate-50/50 group">
      {/* Fundo decorativo com gradiente */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl transition-all duration-500 group-hover:from-blue-500/10 group-hover:to-indigo-500/10" />
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-300 group-hover:scale-110">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-105">
          {value}
        </div>
        {description && (
          <p className="text-xs text-slate-500 font-medium">{description}</p>
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
