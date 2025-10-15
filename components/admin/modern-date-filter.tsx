"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface ModernDateFilterProps {
  onDateChange: (month: number, year: number) => void
  onCompanyChange: (companyId: string) => void
  companies: any[]
  selectedCompany: string
}

export function ModernDateFilter({ onDateChange, onCompanyChange, companies, selectedCompany }: ModernDateFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ]

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)

  const handleMonthChange = (month: string) => {
    const monthNum = Number.parseInt(month)
    setSelectedMonth(monthNum)
    onDateChange(monthNum, selectedYear)
  }

  const handleYearChange = (year: string) => {
    const yearNum = Number.parseInt(year)
    setSelectedYear(yearNum)
    onDateChange(selectedMonth, yearNum)
  }

  return (
    <div className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-6 shadow-md mb-6">
      {/* Círculo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl" />
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
              Filtros do Dashboard
            </h3>
            <p className="text-sm text-slate-600">Filtre por empresa, período e visualize dados específicos</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Empresa
              </label>
              <Select value={selectedCompany} onValueChange={onCompanyChange}>
                <SelectTrigger className="w-48 h-10 bg-white/80 backdrop-blur-sm border-slate-200 hover:border-blue-300 focus:border-blue-500 transition-all shadow-sm">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                Mês
              </label>
              <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-40 h-10 bg-white/80 backdrop-blur-sm border-slate-200 hover:border-indigo-300 focus:border-indigo-500 transition-all shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value?.toString() || "null"} value={month.value?.toString() || "null"}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Ano
              </label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-32 h-10 bg-white/80 backdrop-blur-sm border-slate-200 hover:border-purple-300 focus:border-purple-500 transition-all shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
