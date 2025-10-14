"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Calculator,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  FileImage,
  FileSpreadsheet
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDREDownload } from "@/hooks/use-dre-download";
import { ModernLoading } from "@/components/ui/modern-loading";

interface DREEntry {
  id: string;
  name: string;
  type: 'revenue' | 'expense' | 'cost';
  order_index: number;
  monthlyData: Array<{
    month: number;
    amount: number;
    isProjection: boolean;
  }>;
  annualTotal: number;
  hasData: boolean;
  isCalculated?: boolean;
  level?: number; // 0 = grupo, 1 = subgrupo, 2 = item
  isSubtotal?: boolean;
  calculation?: string;
  isExpanded?: boolean;
  children?: DREEntry[];
}

interface DRETableProps {
  year: number;
  onYearChange: (year: number) => void;
  viewMode: "annual" | "quarterly";
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const quarterNames = [
  "Q1", "Q2", "Q3", "Q4"
];

// Estrutura hierárquica do DRE - Exata conforme especificado
const DRE_STRUCTURE = [
  // 1. Receita Líquida de Serviços
  { name: "1. Receita Bruta de Serviços", level: 0, type: 'item', calculated: true },
  { name: "(-) Deduções da Receita (ISS, etc.)", level: 0, type: 'item', calculated: true },
  { name: "= Receita Líquida de Serviços", level: 0, type: 'subtotal', calculated: true },
  
  // 2. Lucro Bruto
  { name: "2. (-) Custos dos Serviços Prestados", level: 0, type: 'item', calculated: true },
  { name: "= Lucro Bruto", level: 0, type: 'subtotal', calculated: true },
  
  // 3. Resultado Operacional
  { name: "3. (-) Despesas Operacionais", level: 0, type: 'subgroup', calculated: false },
  { name: "      - Administrativas", level: 1, type: 'item', calculated: false },
  { name: "      - Comerciais", level: 1, type: 'item', calculated: false },
  { name: "      - Pessoal", level: 1, type: 'item', calculated: false },
  { name: "      - Tributos e Impostos", level: 1, type: 'item', calculated: false },
  { name: "      - Outras", level: 1, type: 'item', calculated: false },
  { name: "      - RDI (Reembolsos)", level: 1, type: 'item', calculated: false },
  { name: "= Resultado Operacional", level: 0, type: 'subtotal', calculated: true },
  
  // 4. Resultado Antes do IR/CSLL
  { name: "4. (+) Receitas Financeiras", level: 0, type: 'item', calculated: false },
  { name: "   (-) Despesas Financeiras", level: 0, type: 'item', calculated: false },
  { name: "= Resultado Antes do IR/CSLL", level: 0, type: 'subtotal', calculated: true },
  
  // 5. Lucro Líquido
  { name: "5. (-) Impostos sobre o Lucro", level: 0, type: 'item', calculated: false },
  { name: "= Lucro Líquido", level: 0, type: 'subtotal', calculated: true }
];

export function DRETable({ year, onYearChange, viewMode }: DRETableProps) {
  const [dreData, setDreData] = useState<DREEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { downloadAsPNG, downloadAsExcel } = useDREDownload();

  useEffect(() => {
    fetchDREData();
  }, [year]);

  const fetchDREData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/financeiro/dre?year=${year}`);
      const data = await response.json();
      
      // Transformar dados para estrutura hierárquica
      const hierarchicalData = transformToHierarchical(data.dreData);
      setDreData(hierarchicalData);
    } catch (error) {
      console.error('Erro ao carregar dados DRE:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformToHierarchical = (flatData: DREEntry[]) => {
    const hierarchical: DREEntry[] = [];
    
    DRE_STRUCTURE.forEach((structureItem, index) => {
      
      // Buscar dados correspondentes na API
      let apiData = null;
      
      // Mapear nomes da estrutura para nomes da API
      if (structureItem.name === "1. Receita Bruta de Serviços") {
        apiData = flatData.find(item => item.name === "Receita Bruta de Serviços");
      } else if (structureItem.name === "(-) Deduções da Receita (ISS, etc.)") {
        apiData = flatData.find(item => item.name === "(-) Deduções da Receita");
      } else if (structureItem.name === "= Receita Líquida de Serviços") {
        apiData = flatData.find(item => item.name === "(=) Receita Líquida de Serviços");
      } else if (structureItem.name === "2. (-) Custos dos Serviços Prestados") {
        apiData = flatData.find(item => item.name === "(-) Custos dos Serviços Prestados");
      } else if (structureItem.name === "= Lucro Bruto") {
        apiData = flatData.find(item => item.name === "(=) Lucro Bruto");
      } else if (structureItem.name === "3. (-) Despesas Operacionais") {
        apiData = flatData.find(item => item.name === "(-) Despesas Operacionais");
        if (apiData) {
          console.log("🔍 Despesas Operacionais encontradas:", {
            name: apiData.name,
            annualTotal: apiData.annualTotal,
            monthlyData: apiData.monthlyData
          });
          
          // Debug específico para Agosto (mês 8)
          const agostoData = apiData.monthlyData.find(month => month.month === 8);
          if (agostoData) {
            console.log("🔍 AGOSTO - Valor atual:", agostoData.amount);
            console.log("🔍 AGOSTO - Deveria ser: 160 + 10 + 100 = 270");
            console.log("🔍 AGOSTO - Diferença:", agostoData.amount - 270);
            
            // Verificar valores individuais das categorias em Agosto
            const adminData = flatData.find(item => item.name === "(-) Despesas Administrativas");
            const comercialData = flatData.find(item => item.name === "(-) Despesas Comerciais");
            const pessoalData = flatData.find(item => item.name === "(-) Despesas com Pessoal");
            const tributosData = flatData.find(item => item.name === "(-) Despesas com Tributos e Impostos");
            const geraisData = flatData.find(item => item.name === "(-) Despesas Gerais");
            
            if (adminData) {
              const adminAgosto = adminData.monthlyData.find(m => m.month === 8);
              console.log("🔍 AGOSTO - Administrativas:", adminAgosto?.amount || 0);
            }
            if (comercialData) {
              const comercialAgosto = comercialData.monthlyData.find(m => m.month === 8);
              console.log("🔍 AGOSTO - Comerciais:", comercialAgosto?.amount || 0);
            }
            if (pessoalData) {
              const pessoalAgosto = pessoalData.monthlyData.find(m => m.month === 8);
              console.log("🔍 AGOSTO - Pessoal:", pessoalAgosto?.amount || 0);
            }
            if (tributosData) {
              const tributosAgosto = tributosData.monthlyData.find(m => m.month === 8);
              console.log("🔍 AGOSTO - Tributos:", tributosAgosto?.amount || 0);
            }
            if (geraisData) {
              const geraisAgosto = geraisData.monthlyData.find(m => m.month === 8);
              console.log("🔍 AGOSTO - Gerais:", geraisAgosto?.amount || 0);
            }
            
            // Debug: verificar se as categorias existem
            console.log("🔍 DEBUG - Categorias disponíveis:");
            flatData.forEach(item => {
              if (item.name.includes("Despesas")) {
                const agosto = item.monthlyData.find(m => m.month === 8);
                if (agosto && agosto.amount > 0) {
                  console.log(`🔍 ${item.name}: ${agosto.amount}`);
                }
              }
            });
            
            // Debug específico para Despesas Gerais
            console.log("🔍 DEBUG - Procurando Despesas Gerais:");
            const todasCategorias = flatData.map(item => item.name);
            console.log("🔍 Todas as categorias:", todasCategorias.filter(name => name.includes("Despesas")));
            
            // Procurar por variações do nome
            const geraisVariations = flatData.filter(item => 
              item.name.includes("Gerais") || 
              item.name.includes("Outras") ||
              item.name.includes("Outros")
            );
            console.log("🔍 Variações de Gerais/Outras:", geraisVariations.map(item => ({
              name: item.name,
              agosto: item.monthlyData.find(m => m.month === 8)?.amount || 0
            })));
          }
        }
            } else if (structureItem.name === "= Resultado Operacional") {
              // Resultado Operacional é calculado: Lucro Bruto - Despesas com Pessoal
              const lucroBruto = flatData.find(item => item.name === "(=) Lucro Bruto");
              const despesasPessoal = flatData.find(item => item.name === "(-) Despesas com Pessoal");
              
              if (lucroBruto && despesasPessoal) {
                apiData = {
                  ...lucroBruto,
                  name: "(=) Resultado Operacional",
                  monthlyData: lucroBruto.monthlyData.map((lucro, index) => ({
                    month: lucro.month,
                    amount: lucro.amount - (despesasPessoal.monthlyData[index]?.amount || 0),
                    isProjection: false
                  })),
                  annualTotal: lucroBruto.annualTotal - despesasPessoal.annualTotal,
                  hasData: true,
                  isCalculated: true
                };
                console.log("🔍 Calculando Resultado Operacional:", {
                  lucroBruto: lucroBruto.annualTotal,
                  despesasPessoal: despesasPessoal.annualTotal,
                  resultado: apiData.annualTotal
                });
              }
            } else if (structureItem.name === "= Resultado Antes do IR/CSLL") {
              // Resultado Antes do IR/CSLL é calculado: Resultado Operacional + Receitas Financeiras - Despesas Financeiras
              // Buscar o Resultado Operacional que foi calculado no frontend (não da API)
              const resultadoOperacional = hierarchical.find(item => item.name === "= Resultado Operacional");
              const receitasFinanceiras = flatData.find(item => item.name === "(+) Receitas Financeiras");
              const despesasFinanceiras = flatData.find(item => item.name === "(-) Despesas Financeiras");
              
              if (resultadoOperacional && receitasFinanceiras && despesasFinanceiras) {
                apiData = {
                  ...resultadoOperacional,
                  name: "(=) Resultado Antes do IR/CSLL",
                  monthlyData: resultadoOperacional.monthlyData.map((operacional, index) => ({
                    month: operacional.month,
                    amount: operacional.amount + (receitasFinanceiras.monthlyData[index]?.amount || 0) - (despesasFinanceiras.monthlyData[index]?.amount || 0),
                    isProjection: false
                  })),
                  annualTotal: resultadoOperacional.annualTotal + receitasFinanceiras.annualTotal - despesasFinanceiras.annualTotal,
                  hasData: true,
                  isCalculated: true
                };
                console.log("🔍 Calculando Resultado Antes do IR/CSLL:", {
                  resultadoOperacional: resultadoOperacional.annualTotal,
                  receitasFinanceiras: receitasFinanceiras.annualTotal,
                  despesasFinanceiras: despesasFinanceiras.annualTotal,
                  resultado: apiData.annualTotal
                });
              }
            } else if (structureItem.name === "= Lucro Líquido") {
              // Lucro Líquido é calculado: Resultado Antes do IR/CSLL - Impostos sobre o Lucro
              const resultadoAntesIR = hierarchical.find(item => item.name === "= Resultado Antes do IR/CSLL");
              const impostosSobreLucro = flatData.find(item => item.name === "(-) IR e CSLL");
              
              console.log("🔍 DEBUG - Lucro Líquido:");
              console.log("  - Resultado Antes do IR/CSLL encontrado:", resultadoAntesIR?.name, resultadoAntesIR?.annualTotal);
              console.log("  - Impostos sobre o Lucro encontrado:", impostosSobreLucro?.name, impostosSobreLucro?.annualTotal);
              
              if (resultadoAntesIR && impostosSobreLucro) {
                const lucroLiquidoAnual = resultadoAntesIR.annualTotal - impostosSobreLucro.annualTotal;
                console.log("  - Lucro Líquido calculado:", lucroLiquidoAnual);
                
                apiData = {
                  ...resultadoAntesIR,
                  name: "(=) Lucro Líquido",
                  monthlyData: resultadoAntesIR.monthlyData.map((antesIR, index) => ({
                    month: antesIR.month,
                    amount: antesIR.amount - (impostosSobreLucro.monthlyData[index]?.amount || 0),
                    isProjection: false
                  })),
                  annualTotal: lucroLiquidoAnual,
                  hasData: true,
                  isCalculated: true
                };
                console.log("🔍 Calculando Lucro Líquido:", {
                  resultadoAntesIR: resultadoAntesIR.annualTotal,
                  impostosSobreLucro: impostosSobreLucro.annualTotal,
                  lucroLiquido: apiData.annualTotal
                });
              } else {
                console.log("🔍 ERRO - Não foi possível calcular Lucro Líquido");
              }
      } else {
        // Para subitens das despesas operacionais, buscar dados específicos da API
        if (structureItem.name === "      - Administrativas") {
          apiData = flatData.find(item => item.name === "(-) Despesas Administrativas");
        } else if (structureItem.name === "      - Comerciais") {
          apiData = flatData.find(item => item.name === "(-) Despesas Comerciais");
        } else if (structureItem.name === "      - Pessoal") {
          apiData = flatData.find(item => item.name === "(-) Despesas com Pessoal");
        } else if (structureItem.name === "      - Tributos e Impostos") {
          apiData = flatData.find(item => item.name === "(-) Despesas com Tributos e Impostos");
        } else if (structureItem.name === "      - Outras") {
          console.log("🔍 DEBUG OUTRAS - Procurando categoria...");
          console.log("🔍 DEBUG OUTRAS - flatData disponível:", flatData.map(item => ({ name: item.name, annualTotal: item.annualTotal })));
          
          // Mapear "Outras" para "Despesas Gerais" (que é onde estão os R$ 20,00)
          apiData = flatData.find(item => item.name === "(-) Despesas Gerais");
          
          console.log("🔍 DEBUG OUTRAS - apiData encontrado:", apiData);
          
          if (apiData) {
            console.log("🔍 OUTRAS - Categoria encontrada:", apiData.name);
            console.log("🔍 OUTRAS - Dados mensais:", apiData.monthlyData);
          } else {
            console.log("🔍 OUTRAS - Categoria não encontrada. Categorias disponíveis:", 
              flatData.map(item => item.name).filter(name => name.includes("Despesas"))
            );
          }
        } else if (structureItem.name === "      - RDI (Reembolsos)") {
          // Mapear RDI para a categoria RDI
          apiData = flatData.find(item => item.name === "(-) RDI (Reembolsos)");
          
          console.log("🔍 DEBUG RDI - apiData encontrado:", apiData);
          
          if (apiData) {
            console.log("🔍 RDI - Categoria encontrada:", apiData.name);
            console.log("🔍 RDI - Dados mensais:", apiData.monthlyData);
          } else {
            console.log("🔍 RDI - Categoria não encontrada. Categorias disponíveis:", 
              flatData.map(item => item.name).filter(name => name.includes("RDI"))
            );
          }
        } else if (structureItem.name === "4. (+) Receitas Financeiras") {
          apiData = flatData.find(item => item.name === "(+) Receitas Financeiras");
        } else if (structureItem.name === "   (-) Despesas Financeiras") {
          apiData = flatData.find(item => item.name === "(-) Despesas Financeiras");
        } else {
          // Para outros itens não mapeados, não criar dados aleatórios
          apiData = null;
        }
      }

      // Criar entrada hierárquica
      const hierarchicalEntry: DREEntry = {
        id: `item-${index}`,
        name: structureItem.name,
        type: structureItem.type === 'subtotal' ? 'revenue' : 'expense',
        order_index: index,
        monthlyData: apiData?.monthlyData || Array.from({ length: 12 }, (_, i) => ({ 
          month: i + 1, 
          amount: 0, // Sem dados aleatórios - usar zero se não houver dados reais
          isProjection: false 
        })),
        annualTotal: apiData?.annualTotal || 0, // Sem dados aleatórios - usar zero se não houver dados reais
        hasData: apiData?.hasData || false, // Mostrar apenas se houver dados reais
        level: structureItem.level,
        isSubtotal: structureItem.type === 'subtotal',
        isCalculated: structureItem.calculated
      };

      hierarchical.push(hierarchicalEntry);
    });

    return hierarchical;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Função para processar dados trimestrais
  const processQuarterlyData = (monthlyData: any[]) => {
    return [
      {
        quarter: 1,
        amount: (monthlyData[0]?.amount || 0) + (monthlyData[1]?.amount || 0) + (monthlyData[2]?.amount || 0),
        months: [monthlyData[0], monthlyData[1], monthlyData[2]]
      },
      {
        quarter: 2,
        amount: (monthlyData[3]?.amount || 0) + (monthlyData[4]?.amount || 0) + (monthlyData[5]?.amount || 0),
        months: [monthlyData[3], monthlyData[4], monthlyData[5]]
      },
      {
        quarter: 3,
        amount: (monthlyData[6]?.amount || 0) + (monthlyData[7]?.amount || 0) + (monthlyData[8]?.amount || 0),
        months: [monthlyData[6], monthlyData[7], monthlyData[8]]
      },
      {
        quarter: 4,
        amount: (monthlyData[9]?.amount || 0) + (monthlyData[10]?.amount || 0) + (monthlyData[11]?.amount || 0),
        months: [monthlyData[9], monthlyData[10], monthlyData[11]]
      }
    ];
  };

  const handleDownloadPNG = async () => {
    try {
      const result = await downloadAsPNG('dre-table', { 
        format: 'png', 
        filename: `dre-${year}` 
      });
      
      if (result.success) {
        console.log('Download PNG realizado com sucesso');
      } else {
        console.error('Erro no download PNG:', result.error);
      }
    } catch (error) {
      console.error('Erro ao fazer download PNG:', error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const result = await downloadAsExcel(dreData, { 
        format: 'excel', 
        filename: `dre-${year}` 
      });
      
      if (result.success) {
        console.log('Download Excel realizado com sucesso');
      } else {
        console.error('Erro no download Excel:', result.error);
      }
    } catch (error) {
      console.error('Erro ao fazer download Excel:', error);
    }
  };

  const getRowClasses = (entry: DREEntry) => {
    const baseClasses = "transition-all duration-300";
    
    // Destacar linha de Despesas Operacionais com azul claro
    if (entry.name === "3. (-) Despesas Operacionais") {
      return `${baseClasses} bg-blue-50/50 border-l-4 border-blue-500 font-semibold`;
    }
    
    // Destacar linhas calculadas importantes (resultados)
    if (entry.isCalculated) {
      return `${baseClasses} bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-l-4 border-emerald-500 font-semibold`;
    }
    
    if (entry.isSubtotal) {
      return `${baseClasses} bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-l-4 border-emerald-500 font-semibold`;
    }
    
    if (entry.level === 0) {
      return `${baseClasses} bg-white border-l-2 border-slate-300`;
    }
    
    if (entry.level === 1) {
      return `${baseClasses} bg-slate-50/50 border-l-2 border-slate-200`;
    }
    
    return baseClasses;
  };

  const getIcon = (entry: DREEntry) => {
    if (entry.isCalculated) return Calculator;
    if (entry.isSubtotal) return TrendingUp;
    if (entry.level === 1) return Minus; // Para subitens das despesas operacionais
    return FileText;
  };

  const getTooltipContent = (entry: DREEntry) => {
    const explanations: { [key: string]: string } = {
      "1. Receita Bruta de Serviços": "Soma de todos os valores brutos (antes dos impostos) cadastrados no sistema",
      "(-) Deduções da Receita (ISS, etc.)": "Soma dos valores de impostos e taxas deduzidos das receitas",
      "= Receita Líquida de Serviços": "Receita Bruta - Deduções da Receita (valor líquido após impostos)",
      "2. (-) Custos dos Serviços Prestados": "Soma das despesas da categoria 'Serviços Prestados'",
      "= Lucro Bruto": "Receita Líquida de Serviços - Custos dos Serviços Prestados",
      "3. (-) Despesas Operacionais": "Soma total de: Administrativas + Comerciais + Pessoal + Tributos e Impostos + Outras + RDI",
      "      - Administrativas": "Soma das despesas administrativas cadastradas",
      "      - Comerciais": "Soma das despesas comerciais e de marketing",
      "      - Pessoal": "Soma das despesas relacionadas ao pessoal da empresa",
      "      - Tributos e Impostos": "Soma dos tributos e impostos operacionais (ICMS, IPI, PIS/COFINS, etc.)",
      "      - Outras": "Soma das despesas gerais e outras categorias",
      "      - RDI (Reembolsos)": "Soma dos reembolsos de despesas por prestador de serviço",
      "= Resultado Operacional": "Lucro Bruto - Despesas com Pessoal (cálculo específico)",
      "4. (+) Receitas Financeiras": "Soma das receitas do tipo 'Receitas Financeiras'",
      "   (-) Despesas Financeiras": "Soma das despesas da categoria 'Despesas Financeiras'",
      "= Resultado Antes do IR/CSLL": "Resultado Operacional + Receitas Financeiras - Despesas Financeiras",
      "5. (-) Impostos sobre o Lucro": "Valores de impostos sobre o lucro cadastrados manualmente",
      "= Lucro Líquido": "Resultado Antes do IR/CSLL - Impostos sobre o Lucro"
    }
    
    return explanations[entry.name] || "Valor calculado automaticamente com base nos dados cadastrados"
  }


  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ModernLoading 
            size="lg" 
            text="Carregando dados do DRE..." 
            color="blue" 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
          <div>
        {/* Botão de Exportar */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
          </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPNG} className="gap-2">
                <FileImage className="h-4 w-4" />
                Exportar como PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar como Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabela otimizada - largura total e posicionamento otimizado */}
        <div id="dre-table" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full -ml-2">
          {/* Container com scroll horizontal */}
        <div className="overflow-x-auto w-full">
      
          {/* Labels das colunas - sutil */}
          <div className="bg-slate-50/50 border-b border-slate-200/50">
            <div className="flex" style={{ minWidth: '1200px' }}>
              {/* Categoria */}
              <div className="w-72 text-left text-sm font-medium text-slate-500 px-1 py-2 flex-shrink-0">
                Categoria / Grupo
              </div>
              
              {/* Períodos (Meses ou Trimestres) */}
                {(viewMode === "annual" ? monthNames : quarterNames).map((period, index) => (
                <div key={period} className={`w-28 text-center text-sm font-medium text-slate-500 py-2 flex-shrink-0 ${index < (viewMode === "annual" ? monthNames.length : quarterNames.length) - 1 ? 'border-r border-slate-200' : ''}`}>
                    {viewMode === "quarterly" ? `${period} ${year}` : period}
                </div>
                ))}
              
              {/* Total */}
              <div className="w-32 text-center text-sm font-medium text-slate-500 py-2 flex-shrink-0">
                Total
              </div>
            </div>
          </div>
          
          {/* Conteúdo da tabela */}
          <div className="divide-y divide-slate-200/50" style={{ minWidth: '1200px' }}>
            
            {dreData.map((category, index) => {
              const IconComponent = getIcon(category);
              
              return (
                <div key={category.id} className={`flex py-3 transition-all duration-300 hover:bg-slate-50/50 ${getRowClasses(category)}`} style={{ minWidth: '1200px' }}>
                  {/* Coluna da categoria */}
                  <div className="w-72 flex items-center gap-1 px-1 flex-shrink-0">
                    <IconComponent className={`h-3 w-3 ${
                      category.isCalculated ? 'text-emerald-600' : 
                      category.isSubtotal ? 'text-emerald-600' :
                      category.level === 1 ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            category.isSubtotal ? 'text-emerald-800 font-semibold text-xs' :
                            category.level === 1 ? 'text-slate-600 text-xs ml-4' :
                            'text-slate-700 text-xs'
                          }`}>
                            {category.name}
                          </span>
                          <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md p-4 bg-slate-900/95 text-white border border-slate-700/50 backdrop-blur-sm">
                        <div className="space-y-2">
                          <div className="font-semibold text-emerald-400">{category.name}</div>
                          <p className="text-sm leading-relaxed text-slate-200">
                            {getTooltipContent(category)}
                          </p>
                          {category.isCalculated && (
                            <div className="flex items-center gap-2 text-xs text-emerald-300">
                              <Calculator className="w-3 h-3" />
                              Valor calculado automaticamente
                    </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    </div>
                    
                  {/* Colunas dos valores (Mensais ou Trimestrais) */}
                  {viewMode === "annual" ? (
                    category.monthlyData.map((monthData, monthIndex) => (
                      <div key={monthData.month} className={`w-28 text-center py-1 flex-shrink-0 ${monthIndex < category.monthlyData.length - 1 ? 'border-r border-slate-200' : ''}`}>
                        <div className={`text-sm font-medium transition-all duration-200 ${
                          category.isCalculated 
                            ? monthData.amount < 0 
                              ? 'text-red-600' 
                              : 'text-emerald-600'
                            : monthData.amount > 0 ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {monthData.amount !== 0 ? formatCurrency(monthData.amount) : '0,00'}
                        </div>
                        
                        {category.isCalculated && monthData.amount !== 0 && (
                          <div className="flex items-center justify-center mt-1">
                            {monthData.amount < 0 ? (
                              <AlertCircle className="h-2 w-2 text-red-600" />
                            ) : (
                              <CheckCircle className="h-2 w-2 text-emerald-600" />
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    processQuarterlyData(category.monthlyData).map((quarterData, quarterIndex) => (
                      <div key={quarterData.quarter} className={`w-28 text-center py-1 flex-shrink-0 ${quarterIndex < processQuarterlyData(category.monthlyData).length - 1 ? 'border-r border-slate-200' : ''}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`text-sm font-medium transition-all duration-200 cursor-help ${
                              category.isCalculated 
                                ? quarterData.amount < 0 
                                  ? 'text-red-600' 
                                  : 'text-emerald-600'
                                : quarterData.amount > 0 ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                              {quarterData.amount !== 0 ? formatCurrency(quarterData.amount) : '0,00'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-800 text-white text-xs">
                            <div className="space-y-1">
                              <div className="font-semibold">Q{quarterData.quarter} {year}</div>
                              {quarterData.months.map((month, index) => (
                                <div key={index}>
                                  {monthNames[quarterData.quarter * 3 - 3 + index]}: {formatCurrency(month?.amount || 0)}
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        
                        {category.isCalculated && quarterData.amount !== 0 && (
                          <div className="flex items-center justify-center mt-1">
                            {quarterData.amount < 0 ? (
                              <AlertCircle className="h-2 w-2 text-red-600" />
                            ) : (
                              <CheckCircle className="h-2 w-2 text-emerald-600" />
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* Coluna do total anual com fonte reduzida */}
                  <div className="w-32 text-center py-1 flex-shrink-0">
                    <div className={`text-sm font-bold transition-all duration-200 ${
                      category.isSubtotal ? 'bg-slate-100 px-2 py-1 rounded' : ''
                    } ${
                      category.annualTotal > 0 ? 'text-emerald-600' : 
                      category.annualTotal < 0 ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      {category.annualTotal !== 0 ? formatCurrency(category.annualTotal) : '0,00'}
                    </div>
                    
                    {category.isCalculated && category.annualTotal !== 0 && (
                      <div className="flex items-center justify-center mt-1">
                        {category.annualTotal < 0 ? (
                          <AlertCircle className="h-2 w-2 text-red-600" />
                        ) : (
                          <CheckCircle className="h-2 w-2 text-emerald-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Resultado Atual no rodapé - ocupando toda a largura da tabela */}
        <div className="mt-4">
          <div className="bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200 w-full">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-slate-600">
                Resultado Atual
              </div>
              <div className="text-lg font-bold text-emerald-600">
                {(() => {
                  // Procurar por diferentes variações do nome
                  const lucroLiquido = dreData.find(item => item.name === "(=) Lucro Líquido") ||
                                     dreData.find(item => item.name === "= Lucro Líquido") ||
                                     dreData.find(item => item.name === "Lucro Líquido");
                  console.log("🔍 DEBUG - Resultado Atual (Lucro Líquido):", lucroLiquido?.name, lucroLiquido?.annualTotal);
                  return formatCurrency(lucroLiquido?.annualTotal || 0);
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
