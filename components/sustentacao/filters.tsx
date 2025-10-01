'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Filter } from 'lucide-react';

interface FiltersProps {
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
}

export function SustentacaoFilters({ onFiltersChange, initialFilters = {} }: FiltersProps) {
  const [filters, setFilters] = useState({
    mes: initialFilters.mes || new Date().getMonth() + 1, // Mês atual
    ano: initialFilters.ano || new Date().getFullYear(),
    ...initialFilters
  });

  const handleFilterChange = (key: string, value: string) => {
    let processedValue = value === 'all' ? '' : value;
    
    // Converter para número se for mês ou ano
    if (key === 'mes' && processedValue !== '') {
      processedValue = parseInt(processedValue);
    } else if (key === 'ano' && processedValue !== '') {
      processedValue = parseInt(processedValue);
    }
    
    const newFilters = { ...filters, [key]: processedValue };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };


  const meses = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];


  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Filtros de Período
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-end gap-6">
          {/* Filtro por Mês */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <Label className="text-base font-semibold text-slate-700">
                Mês
              </Label>
            </div>
            <Select
              value={filters.mes.toString()}
              onValueChange={(value) => handleFilterChange('mes', value)}
            >
              <SelectTrigger className="w-40 h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {meses.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Ano */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <Label className="text-base font-semibold text-slate-700">
                Ano
              </Label>
            </div>
            <Select
              value={filters.ano.toString()}
              onValueChange={(value) => handleFilterChange('ano', value)}
            >
              <SelectTrigger className="w-24 h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200">
                <SelectValue placeholder="2025" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}