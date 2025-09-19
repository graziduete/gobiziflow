'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

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

  const clearFilters = () => {
    const clearedFilters = {
      mes: new Date().getMonth() + 1, // Mês atual
      ano: new Date().getFullYear()
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
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
    <div className="flex justify-end items-center gap-6 mb-4">
      {/* Filtro por Mês */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Mês
        </Label>
        <Select
          value={filters.mes.toString()}
          onValueChange={(value) => handleFilterChange('mes', value)}
        >
          <SelectTrigger className="w-40 h-9 border-gray-300">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {meses.map((mes) => (
              <SelectItem key={mes.value} value={mes.value}>
                {mes.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por Ano */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Ano
        </Label>
        <Select
          value={filters.ano.toString()}
          onValueChange={(value) => handleFilterChange('ano', value)}
        >
          <SelectTrigger className="w-24 h-9 border-gray-300">
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
  );
}