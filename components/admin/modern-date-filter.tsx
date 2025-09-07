"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface ModernDateFilterProps {
  onDateChange: (month: number | null, year: number) => void
  onCompanyChange: (companyId: string) => void
  companies: any[]
  selectedCompany: string
}

export function ModernDateFilter({ onDateChange, onCompanyChange, companies, selectedCompany }: ModernDateFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const months = [
    { value: null, label: "Todos os meses" },
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
    if (month === "null") {
      setSelectedMonth(null)
      onDateChange(null, selectedYear)
    } else {
      const monthNum = Number.parseInt(month)
      setSelectedMonth(monthNum)
      onDateChange(monthNum, selectedYear)
    }
  }

  const handleYearChange = (year: string) => {
    const yearNum = Number.parseInt(year)
    setSelectedYear(yearNum)
    onDateChange(selectedMonth, yearNum)
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filtros do Dashboard</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Filtre por empresa, período e visualize dados específicos</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Empresa</label>
              <Select value={selectedCompany} onValueChange={onCompanyChange}>
                <SelectTrigger className="w-44 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Mês</label>
              <Select value={selectedMonth?.toString() || "null"} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-36 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-28 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
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
