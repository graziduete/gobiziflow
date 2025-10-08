"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Calendar, Settings, ArrowLeft } from "lucide-react";
import { DRETable } from "@/components/admin/dre-table";
import Link from "next/link";

export default function DREPage() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [viewMode, setViewMode] = useState<"annual" | "quarterly">("annual");

  const years = Array.from({ length: 5 }, (_, i) => 2025 + i);

  return (
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/financeiro" 
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-blue-600" />
              </Link>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  DRE - Demonstrativo de Resultados
                </h2>
                <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Gestão financeira anual e trimestral
                </p>
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-4">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-20 h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "annual" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("annual")}
                  className={`h-8 px-3 ${viewMode === "annual" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-transparent"
                  }`}
                >
                  Anual
                </Button>
                <Button
                  variant={viewMode === "quarterly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("quarterly")}
                  className={`h-8 px-3 ${viewMode === "quarterly" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-transparent"
                  }`}
                >
                  Trimestral
                </Button>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Tabela DRE Funcional */}
      <DRETable 
        year={selectedYear} 
        onYearChange={setSelectedYear}
        viewMode={viewMode}
      />
    </div>
  );
}
