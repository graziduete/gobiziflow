import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || new Date().getFullYear().toString()

    console.log(`=== API DRE - Buscando dados para o ano ${year} ===`)

    // Obter dados do usuário logado para filtro de tenant
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()

    let tenantId = null

    // Determinar tenant_id baseado no perfil do usuário
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      tenantId = clientAdmin?.company_id || null
    }
    // Admin Master/Normal/Operacional: tenantId = null (já definido)

    console.log(`🔍 DRE - Tenant ID determinado: ${tenantId} (Role: ${profile?.role}, IsClientAdmin: ${profile?.is_client_admin})`)

    // Buscar categorias ordenadas
    const { data: categories, error: categoriesError } = await supabase
      .from("financial_categories")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true })

    if (categoriesError) {
      console.error("Erro ao buscar categorias:", categoriesError)
      return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 })
    }

    // Buscar entradas do ano
    const { data: entries, error: entriesError } = await supabase
      .from("financial_entries")
      .select("*")
      .eq("year", parseInt(year))

    if (entriesError) {
      console.error("Erro ao buscar entradas:", entriesError)
      return NextResponse.json({ error: "Erro ao buscar entradas" }, { status: 500 })
    }

    // Buscar receitas do ano com filtro de tenant
    let revenuesQuery = supabase
      .from("revenue_entries")
      .select("*")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)

    // Aplicar filtro de tenant
    if (profile?.is_client_admin) {
      revenuesQuery = revenuesQuery.eq('tenant_id', tenantId)
    } else {
      revenuesQuery = revenuesQuery.is('tenant_id', null)
    }

    const { data: revenues, error: revenuesError } = await revenuesQuery

    console.log(`🔍 Debug DRE - Query receitas:`, {
      year,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      tenantId,
      userRole: profile?.role,
      isClientAdmin: profile?.is_client_admin,
      revenuesCount: revenues?.length || 0,
      revenues: revenues?.map(r => ({ id: r.id, type: r.type, month: r.month, amount: r.amount, date: r.date, tenant_id: r.tenant_id }))
    })

    if (revenuesError) {
      console.error("Erro ao buscar receitas:", revenuesError)
      return NextResponse.json({ error: "Erro ao buscar receitas" }, { status: 500 })
    }

    // Buscar despesas do ano com filtro de tenant
    let expenseEntriesQuery = supabase
      .from("expense_entries")
      .select(`
        *,
        expense_subcategories (
          *,
          expense_categories (name, color, icon)
        )
      `)
      .eq("year", parseInt(year))

    // Aplicar filtro de tenant
    if (profile?.is_client_admin) {
      expenseEntriesQuery = expenseEntriesQuery.eq('tenant_id', tenantId)
    } else {
      expenseEntriesQuery = expenseEntriesQuery.is('tenant_id', null)
    }

    const { data: expenseEntries, error: expenseEntriesError } = await expenseEntriesQuery

    if (expenseEntriesError) {
      console.error("Erro ao buscar despesas:", expenseEntriesError)
      return NextResponse.json({ error: "Erro ao buscar despesas" }, { status: 500 })
    }

    // Buscar categorias de despesas para identificar "Serviços Prestados"
    const { data: expenseCategories, error: expenseCategoriesError } = await supabase
      .from("expense_categories")
      .select("*")
      .in("name", ["Serviços Prestados"])

    if (expenseCategoriesError) {
      console.error("Erro ao buscar categorias de despesas:", expenseCategoriesError)
      return NextResponse.json({ error: "Erro ao buscar categorias de despesas" }, { status: 500 })
    }

    console.log(`📊 DRE - Resumo dos dados encontrados:`)
    console.log(`  - Tenant ID: ${tenantId}`)
    console.log(`  - Role: ${profile?.role}`)
    console.log(`  - Receitas encontradas: ${revenues?.length || 0}`)
    console.log(`  - Despesas encontradas: ${expenseEntries?.length || 0}`)
    console.log(`  - Categorias DRE: ${categories?.length || 0}`)
    console.log(`  - Categorias de despesas (Serviços Prestados): ${expenseCategories?.length || 0}`)

    // Calcular receita bruta por mês
    const revenueByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const monthRevenues = revenues?.filter(revenue => revenue.month === month) || []
      const totalAmount = monthRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount), 0)
      
      return {
        month,
        amount: totalAmount,
        isProjection: false // Por enquanto, consideramos todos como dados reais
      }
    })

    // Calcular deduções (impostos) por mês
    const deductionsByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const monthRevenues = revenues?.filter(revenue => revenue.month === month) || []
      const totalTaxAmount = monthRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.tax_amount), 0)
      
      return {
        month,
        amount: totalTaxAmount,
        isProjection: false
      }
    })

    // Calcular receita líquida por mês (receita bruta - deduções)
    const netRevenueByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const monthRevenues = revenues?.filter(revenue => revenue.month === month) || []
      const totalAmount = monthRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount), 0)
      const totalTaxAmount = monthRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.tax_amount), 0)
      const netAmount = totalAmount - totalTaxAmount
      
      return {
        month,
        amount: netAmount,
        isProjection: false
      }
    })

    // Calcular total anual de receitas
    const annualRevenueTotal = revenues?.reduce((sum, revenue) => sum + parseFloat(revenue.amount), 0) || 0

    // Calcular total anual de deduções (impostos)
    const annualDeductionsTotal = revenues?.reduce((sum, revenue) => sum + parseFloat(revenue.tax_amount), 0) || 0

    // Calcular total anual de receita líquida
    const annualNetRevenueTotal = annualRevenueTotal - annualDeductionsTotal

    // Calcular custos dos serviços prestados por mês (categoria "Serviços Prestados")
    const serviceCostsByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      // Filtrar despesas da categoria "Serviços Prestados" para o mês
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isServiceExpense = entry.expense_subcategories?.expense_categories?.name === "Serviços Prestados"
        
        return isCorrectMonth && isServiceExpense
      }) || []
      
      const totalCosts = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalCosts,
        isProjection: false
      }
    })

    // Calcular total anual de custos dos serviços
    const annualServiceCostsTotal = expenseEntries?.filter(entry => {
      const isServiceExpense = entry.expense_subcategories?.expense_categories?.name === "Serviços Prestados"
      
      return isServiceExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular lucro bruto por mês (Receita Líquida - Custos dos Serviços)
    const grossProfitByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const netRevenue = netRevenueByMonth[index].amount
      const serviceCosts = serviceCostsByMonth[index].amount
      const grossProfit = netRevenue - serviceCosts // Pode ser negativo (prejuízo)
      
      return {
        month,
        amount: grossProfit,
        isProjection: false
      }
    })

    // Calcular total anual de lucro bruto (pode ser negativo)
    const annualGrossProfitTotal = annualNetRevenueTotal - annualServiceCostsTotal

    // Calcular despesas operacionais por mês (soma de todas as categorias operacionais)
    const operationalExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      // Filtrar despesas das categorias operacionais para o mês
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const categoryName = entry.expense_subcategories?.expense_categories?.name
        const isOperationalExpense = [
          "Despesas Administrativas",
          "Despesas Comerciais", 
          "Despesas com Pessoal",
          "Despesas com Tributos e Impostos",
          "Despesas Gerais",
          "Despesas com Marketing",
          "RDI (Reembolsos)"
        ].includes(categoryName)
        
        return isCorrectMonth && isOperationalExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      // Debug específico para Agosto (mês 8)
      if (month === 8) {
        console.log("🔍 Debug Agosto - Despesas Operacionais:", {
          month,
          totalExpenses,
          expenses: monthExpenses.map(exp => ({
            category: exp.expense_subcategories?.expense_categories?.name,
            amount: parseFloat(exp.amount),
            subcategory: exp.expense_subcategories?.name
          }))
        });
      }
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas operacionais
    const annualOperationalExpensesTotal = expenseEntries?.filter(entry => {
      const categoryName = entry.expense_subcategories?.expense_categories?.name
      const isOperationalExpense = [
        "Despesas Administrativas",
        "Despesas Comerciais", 
        "Despesas com Pessoal",
        "Despesas com Tributos e Impostos",
        "Despesas Gerais",
        "Despesas com Marketing",
        "RDI (Reembolsos)"
      ].includes(categoryName)
      
      if (isOperationalExpense) {
        console.log("🔍 Despesa Operacional encontrada:", {
          category: categoryName,
          amount: parseFloat(entry.amount),
          month: entry.month
        });
      }
      
      return isOperationalExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular despesas administrativas por mês
    const administrativeExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isAdministrativeExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Administrativas"
        
        return isCorrectMonth && isAdministrativeExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas administrativas
    const annualAdministrativeExpensesTotal = expenseEntries?.filter(entry => {
      const isAdministrativeExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Administrativas"
      
      return isAdministrativeExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular despesas comerciais por mês
    const commercialExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isCommercialExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Comerciais"
        
        return isCorrectMonth && isCommercialExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas comerciais
    const annualCommercialExpensesTotal = expenseEntries?.filter(entry => {
      const isCommercialExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Comerciais"
      
      return isCommercialExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular despesas com pessoal por mês
    const personnelExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isPersonnelExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas com Pessoal"
        
        return isCorrectMonth && isPersonnelExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas com pessoal
    const annualPersonnelExpensesTotal = expenseEntries?.filter(entry => {
      const isPersonnelExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas com Pessoal"
      
      return isPersonnelExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular despesas gerais por mês
    const generalExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isGeneralExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Gerais"
        
        return isCorrectMonth && isGeneralExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular despesas com marketing por mês
    const marketingExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isMarketingExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas com Marketing"
        
        return isCorrectMonth && isMarketingExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas com marketing
    const annualMarketingExpensesTotal = expenseEntries?.filter(entry => 
      entry.expense_subcategories?.expense_categories?.name === "Despesas com Marketing"
    ).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    console.log("🔍 MARKETING - Total anual:", annualMarketingExpensesTotal);
    console.log("🔍 MARKETING - Dados mensais:", marketingExpensesByMonth.map(m => ({ month: m.month, amount: m.amount })));

    // Calcular despesas com tributos e impostos por mês
    const tributosImpostosByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isTributosImpostos = entry.expense_subcategories?.expense_categories?.name === "Despesas com Tributos e Impostos"
        
        return isCorrectMonth && isTributosImpostos
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas com tributos e impostos
    const annualTributosImpostosTotal = expenseEntries?.filter(entry => {
      const isTributosImpostos = entry.expense_subcategories?.expense_categories?.name === "Despesas com Tributos e Impostos"
      
      return isTributosImpostos
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular total anual de despesas gerais
    const annualGeneralExpensesTotal = expenseEntries?.filter(entry => {
      const isGeneralExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Gerais"
      
      return isGeneralExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular despesas RDI por mês
    const rdiExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isRdiExpense = entry.expense_subcategories?.expense_categories?.name === "RDI (Reembolsos)"
        
        return isCorrectMonth && isRdiExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas RDI
    const annualRdiExpensesTotal = expenseEntries?.filter(entry => {
      const isRdiExpense = entry.expense_subcategories?.expense_categories?.name === "RDI (Reembolsos)"
      
      return isRdiExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Calcular receitas financeiras por mês
    const financialRevenuesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const monthFinancialRevenues = revenues?.filter(revenue => 
        revenue.month === month && revenue.type === "Receitas Financeiras"
      ) || []
      const totalAmount = monthFinancialRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount), 0)
      
      // Debug log para outubro
      if (month === 10) {
        console.log(`🔍 Debug Outubro - Receitas Financeiras:`, {
          monthFinancialRevenues,
          totalAmount,
          allRevenues: revenues?.filter(r => r.month === 10)
        })
      }
      
      return {
        month,
        amount: totalAmount,
        isProjection: false
      }
    })

    // Calcular total anual de receitas financeiras
    const annualFinancialRevenuesTotal = revenues?.filter(revenue => 
      revenue.type === "Receitas Financeiras"
    ).reduce((sum, revenue) => sum + parseFloat(revenue.amount), 0) || 0

    // Calcular despesas financeiras por mês
    const financialExpensesByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      
      const monthExpenses = expenseEntries?.filter(entry => {
        const isCorrectMonth = entry.month === month
        const isFinancialExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Financeiras"
        
        return isCorrectMonth && isFinancialExpense
      }) || []
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      
      return {
        month,
        amount: totalExpenses,
        isProjection: false
      }
    })

    // Calcular total anual de despesas financeiras
    const annualFinancialExpensesTotal = expenseEntries?.filter(entry => {
      const isFinancialExpense = entry.expense_subcategories?.expense_categories?.name === "Despesas Financeiras"
      
      return isFinancialExpense
    }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0

    // Debug log
    console.log(`🔍 Debug Receitas Financeiras:`, {
      allRevenues: revenues?.map(r => ({ type: r.type, month: r.month, amount: r.amount })),
      financialRevenues: revenues?.filter(r => r.type === "Receitas Financeiras"),
      annualTotal: annualFinancialRevenuesTotal,
      financialRevenuesByMonth: financialRevenuesByMonth
    })

    console.log(`Total anual de receitas: ${annualRevenueTotal}`)
    console.log(`Total anual de deduções: ${annualDeductionsTotal}`)
    console.log(`Total anual de receita líquida: ${annualNetRevenueTotal}`)
    console.log(`Total anual de custos dos serviços: ${annualServiceCostsTotal}`)
    console.log(`Total anual de lucro bruto: ${annualGrossProfitTotal}`)
    console.log(`Total anual de despesas operacionais: ${annualOperationalExpensesTotal}`)
    console.log(`Total anual de despesas administrativas: ${annualAdministrativeExpensesTotal}`)
    console.log(`Total anual de despesas comerciais: ${annualCommercialExpensesTotal}`)
    console.log(`Total anual de despesas com pessoal: ${annualPersonnelExpensesTotal}`)
    console.log(`Total anual de despesas com tributos e impostos: ${annualTributosImpostosTotal}`)
    console.log(`Total anual de despesas gerais: ${annualGeneralExpensesTotal}`)
    console.log(`Total anual de despesas RDI: ${annualRdiExpensesTotal}`)
    console.log(`Total anual de receitas financeiras: ${annualFinancialRevenuesTotal}`)
    console.log(`Total anual de despesas financeiras: ${annualFinancialExpensesTotal}`)


    // Processar dados para DRE
    const dreData = categories.map(category => {
      const categoryEntries = entries.filter(entry => entry.category_id === category.id)
      
      // Se for a categoria "Receita Bruta de Serviços", usar dados das receitas
      if (category.name === "Receita Bruta de Serviços") {
        return {
          ...category,
          monthlyData: revenueByMonth,
          annualTotal: annualRevenueTotal,
          hasData: annualRevenueTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Deduções da Receita", usar dados dos impostos
      if (category.name === "(-) Deduções da Receita") {
        return {
          ...category,
          monthlyData: deductionsByMonth,
          annualTotal: annualDeductionsTotal,
          hasData: annualDeductionsTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(=) Receita Líquida de Serviços", usar dados líquidos
      if (category.name === "(=) Receita Líquida de Serviços") {
        return {
          ...category,
          monthlyData: netRevenueByMonth,
          annualTotal: annualNetRevenueTotal,
          hasData: annualNetRevenueTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Custos dos Serviços Prestados", usar dados das despesas
      if (category.name === "(-) Custos dos Serviços Prestados") {
        return {
          ...category,
          monthlyData: serviceCostsByMonth,
          annualTotal: annualServiceCostsTotal,
          hasData: annualServiceCostsTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(=) Lucro Bruto", usar dados calculados
      if (category.name === "(=) Lucro Bruto") {
        return {
          ...category,
          monthlyData: grossProfitByMonth,
          annualTotal: annualGrossProfitTotal,
          hasData: annualGrossProfitTotal !== 0, // Pode ser negativo, então verifica se é diferente de zero
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Despesas Operacionais", usar dados das despesas operacionais (soma de todas as categorias)
      if (category.name === "(-) Despesas Operacionais") {
        console.log("🔍 Calculando Despesas Operacionais:", {
          annualTotal: annualOperationalExpensesTotal,
          monthlyData: operationalExpensesByMonth,
          categoryName: category.name
        });
        return {
          ...category,
          monthlyData: operationalExpensesByMonth,
          annualTotal: annualOperationalExpensesTotal,
          hasData: annualOperationalExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Despesas Administrativas", usar dados das despesas administrativas
      if (category.name === "(-) Despesas Administrativas") {
        return {
          ...category,
          monthlyData: administrativeExpensesByMonth,
          annualTotal: annualAdministrativeExpensesTotal,
          hasData: annualAdministrativeExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Despesas Comerciais", usar dados das despesas comerciais
      if (category.name === "(-) Despesas Comerciais") {
        return {
          ...category,
          monthlyData: commercialExpensesByMonth,
          annualTotal: annualCommercialExpensesTotal,
          hasData: annualCommercialExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Despesas com Pessoal", usar dados das despesas com pessoal
      if (category.name === "(-) Despesas com Pessoal") {
        return {
          ...category,
          monthlyData: personnelExpensesByMonth,
          annualTotal: annualPersonnelExpensesTotal,
          hasData: annualPersonnelExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Despesas com Tributos e Impostos", usar dados das despesas com tributos e impostos
      if (category.name === "(-) Despesas com Tributos e Impostos") {
        return {
          ...category,
          monthlyData: tributosImpostosByMonth,
          annualTotal: annualTributosImpostosTotal,
          hasData: annualTributosImpostosTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Despesas Gerais", usar dados das despesas gerais
      if (category.name === "(-) Despesas Gerais") {
        return {
          ...category,
          monthlyData: generalExpensesByMonth,
          annualTotal: annualGeneralExpensesTotal,
          hasData: annualGeneralExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }

      // Se for a categoria "(-) Despesas com Marketing", usar dados das despesas com marketing
      if (category.name === "(-) Despesas com Marketing") {
        return {
          ...category,
          monthlyData: marketingExpensesByMonth,
          annualTotal: annualMarketingExpensesTotal,
          hasData: annualMarketingExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }

      // Se for a categoria "(-) RDI (Reembolsos)", usar dados das despesas RDI
      if (category.name === "(-) RDI (Reembolsos)") {
        return {
          ...category,
          monthlyData: rdiExpensesByMonth,
          annualTotal: annualRdiExpensesTotal,
          hasData: annualRdiExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(+) Receitas Financeiras", usar dados das receitas financeiras
      if (category.name === "(+) Receitas Financeiras") {
        return {
          ...category,
          monthlyData: financialRevenuesByMonth,
          annualTotal: annualFinancialRevenuesTotal,
          hasData: annualFinancialRevenuesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Se for a categoria "(-) Despesas Financeiras", usar dados das despesas financeiras
      if (category.name === "(-) Despesas Financeiras") {
        return {
          ...category,
          monthlyData: financialExpensesByMonth,
          annualTotal: annualFinancialExpensesTotal,
          hasData: annualFinancialExpensesTotal > 0,
          isCalculated: true // Marca que é calculado automaticamente
        }
      }
      
      // Para outras categorias, usar dados das entradas manuais
      const monthlyData = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1
        const entry = categoryEntries.find(e => e.month === month)
        return {
          month,
          amount: entry ? parseFloat(entry.amount) : 0,
          isProjection: entry ? entry.is_projection : false
        }
      })

      // Calcular total anual
      const annualTotal = categoryEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0)

      return {
        ...category,
        monthlyData,
        annualTotal,
        hasData: categoryEntries.length > 0,
        isCalculated: false
      }
    })

    return NextResponse.json({ 
      dreData, 
      year: parseInt(year),
      totalCategories: categories.length,
      categoriesWithData: dreData.filter(item => item.hasData).length,
      revenueData: {
        totalRevenue: annualRevenueTotal,
        totalDeductions: annualDeductionsTotal,
        netRevenue: annualNetRevenueTotal,
        revenueCount: revenues?.length || 0
      },
      expenseData: {
        totalServiceCosts: annualServiceCostsTotal,
        expenseCount: expenseEntries?.length || 0
      },
      calculatedData: {
        grossProfit: annualGrossProfitTotal,
        isProfit: annualGrossProfitTotal > 0
      }
    })
  } catch (error) {
    console.error("Erro na API do DRE:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
