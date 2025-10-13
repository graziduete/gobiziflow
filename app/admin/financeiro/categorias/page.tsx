"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X,
  Building2,
  Laptop,
  Car,
  Briefcase,
  Receipt,
  Banknote,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  // Novos ícones para categorias específicas
  FileText,
  Calculator,
  Plane,
  Monitor,
  Megaphone,
  CreditCard,
  Users,
  Wrench,
  FileSpreadsheet,
  ClipboardList,
  Gift,
  Cog,
  DollarSign,
  Shield,
  Zap,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ModernLoading } from "@/components/ui/modern-loading"

// Interface para categorias
interface Category {
  id: string
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Interface para subcategorias
interface Subcategory {
  id: string
  category_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Categorias pré-definidas alinhadas com o DRE
const predefinedCategories = [
  {
    name: "Despesas Administrativas",
    description: "Despesas relacionadas à administração da empresa",
    color: "blue",
    icon: "ClipboardList",
    dreRule: "Parte das Despesas Operacionais"
  },
  {
    name: "Despesas Comerciais",
    description: "Despesas relacionadas às atividades comerciais",
    color: "green",
    icon: "Megaphone",
    dreRule: "Parte das Despesas Operacionais"
  },
  {
    name: "Serviços Prestados",
    description: "Custos dos serviços prestados pela empresa",
    color: "purple",
    icon: "Cog",
    dreRule: "Custos dos Serviços Prestados (DRE linha 2)"
  },
  {
    name: "RDI (Reembolsos)",
    description: "Reembolsos de Despesas Indiretas",
    color: "orange",
    icon: "FileSpreadsheet",
    dreRule: "Parte dos Custos dos Serviços Prestados"
  },
  {
    name: "Despesas Gerais",
    description: "Despesas gerais da empresa",
    color: "indigo",
    icon: "FileText",
    dreRule: "Parte das Despesas Operacionais"
  },
  {
    name: "Despesas com Pessoal",
    description: "Despesas relacionadas ao pessoal da empresa",
    color: "pink",
    icon: "Users",
    dreRule: "Parte das Despesas Operacionais"
  },
  {
    name: "Despesas Financeiras",
    description: "Despesas financeiras e juros",
    color: "red",
    icon: "CreditCard",
    dreRule: "Despesas Financeiras (DRE linha 4)"
  },
  {
    name: "Despesas com Tributos e Impostos",
    description: "Impostos, taxas e tributos",
    color: "yellow",
    icon: "Calculator",
    dreRule: "Impostos sobre o Lucro (DRE linha 5)"
  }
]

// Cores disponíveis para categorias
const availableColors = [
  { value: "blue", label: "Azul", class: "text-blue-600" },
  { value: "green", label: "Verde", class: "text-green-600" },
  { value: "orange", label: "Laranja", class: "text-orange-600" },
  { value: "purple", label: "Roxo", class: "text-purple-600" },
  { value: "red", label: "Vermelho", class: "text-red-600" },
  { value: "indigo", label: "Índigo", class: "text-indigo-600" },
  { value: "pink", label: "Rosa", class: "text-pink-600" },
  { value: "yellow", label: "Amarelo", class: "text-yellow-600" }
]

// Ícones disponíveis para categorias
const availableIcons = [
  // Categorias principais específicas
  { value: "FileText", label: "Outras Despesas Diversas", component: FileText },
  { value: "Calculator", label: "Tributárias", component: Calculator },
  { value: "Plane", label: "Viagens e Representação", component: Plane },
  { value: "Monitor", label: "Tecnologia", component: Monitor },
  { value: "Megaphone", label: "Comercial e Marketing", component: Megaphone },
  { value: "CreditCard", label: "Financeiras", component: CreditCard },
  { value: "Users", label: "Despesas com Pessoal", component: Users },
  { value: "Wrench", label: "Infraestrutura e Operações", component: Wrench },
  { value: "FileSpreadsheet", label: "RDI", component: FileSpreadsheet },
  { value: "ClipboardList", label: "Administrativa", component: ClipboardList },
  { value: "Gift", label: "Benefícios", component: Gift },
  { value: "Cog", label: "Operacional", component: Cog },
  
  // Ícones genéricos
  { value: "Building2", label: "Escritório", component: Building2 },
  { value: "Laptop", label: "Software", component: Laptop },
  { value: "Car", label: "Transporte", component: Car },
  { value: "Briefcase", label: "Profissionais", component: Briefcase },
  { value: "Receipt", label: "Recibo", component: Receipt },
  { value: "Banknote", label: "Dinheiro", component: Banknote },
  { value: "DollarSign", label: "Dólar", component: DollarSign },
  { value: "Shield", label: "Escudo", component: Shield },
  { value: "Zap", label: "Raio", component: Zap },
  { value: "Settings", label: "Configurações", component: Settings }
]

export default function CategoriasPage() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState<{
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showSubcategoryForm, setShowSubcategoryForm] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastLoadTime, setLastLoadTime] = useState<number>(0)
  
  // Estados do formulário de categoria
  const [categoryForm, setCategoryForm] = useState({
    selectedCategory: "",
    description: "",
    color: "blue",
    icon: "Building2",
    is_active: true
  })
  
  // Estados do formulário de subcategoria
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    description: "",
    is_active: true
  })

  // Função para buscar categorias do banco
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/financeiro/categories')
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  // Função para buscar subcategorias do banco
  const fetchSubcategories = async () => {
    try {
      const response = await fetch('/api/financeiro/subcategories')
      const data = await response.json()
      if (data.subcategories) {
        setSubcategories(data.subcategories)
      }
    } catch (error) {
      console.error('Erro ao buscar subcategorias:', error)
    }
  }

  // Função otimizada para recarregar dados (com cache de 5 segundos)
  const refreshData = async (force = false) => {
    const now = Date.now()
    const timeSinceLastLoad = now - lastLoadTime
    
    // Se não for forçado e foi carregado recentemente (menos de 5 segundos), não recarregar
    if (!force && timeSinceLastLoad < 5000) {
      console.log(`⏭️ Pulando recarregamento (último carregamento há ${timeSinceLastLoad}ms)`)
      return
    }
    
    console.log('🔄 Recarregando dados...')
    await Promise.all([fetchCategories(), fetchSubcategories()])
    setLastLoadTime(now)
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Carregando dados das categorias...')
        const startTime = Date.now()
        
        // Carregar categorias e subcategorias em paralelo (método otimizado)
        const [categoriesResponse, subcategoriesResponse] = await Promise.all([
          fetch('/api/financeiro/categories'),
          fetch('/api/financeiro/subcategories')
        ])
        
        const [categoriesData, subcategoriesData] = await Promise.all([
          categoriesResponse.json(),
          subcategoriesResponse.json()
        ])
        
        const loadTime = Date.now() - startTime
        console.log(`✅ Dados carregados em ${loadTime}ms`)
        
        if (categoriesData.categories) {
          setCategories(categoriesData.categories)
        }
        
        if (subcategoriesData.subcategories) {
          setSubcategories(subcategoriesData.subcategories)
        }
        
        setLastLoadTime(Date.now())
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Funções para categorias
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setCategoryForm({
      selectedCategory: "",
      description: "",
      color: "blue",
      icon: "Building2",
      is_active: true
    })
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      selectedCategory: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      is_active: category.is_active
    })
    setShowCategoryForm(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.selectedCategory.trim()) return
    
    // Prevenir múltiplos cliques
    if (isSavingCategory) return
    
    // Buscar os dados da categoria pré-definida
    const selectedPredefinedCategory = predefinedCategories.find(
      cat => cat.name === categoryForm.selectedCategory
    )

    if (!selectedPredefinedCategory) {
      console.error('Categoria pré-definida não encontrada')
      return
    }

    setIsSavingCategory(true)
    
    try {
      const method = editingCategory ? 'PUT' : 'POST'
      const dataToSend = editingCategory 
        ? { 
            id: editingCategory.id, 
            name: selectedPredefinedCategory.name,
            description: categoryForm.description || selectedPredefinedCategory.description,
            color: selectedPredefinedCategory.color,
            icon: selectedPredefinedCategory.icon,
            is_active: categoryForm.is_active
          }
        : {
            name: selectedPredefinedCategory.name,
            description: categoryForm.description || selectedPredefinedCategory.description,
            color: selectedPredefinedCategory.color,
            icon: selectedPredefinedCategory.icon,
            is_active: categoryForm.is_active
          }

      // Converter camelCase para snake_case antes de enviar
      const dataToSendSnakeCase = {
        name: dataToSend.name,
        description: dataToSend.description,
        color: dataToSend.color,
        icon: dataToSend.icon,
        is_active: dataToSend.is_active,
        ...(editingCategory && { id: dataToSend.id })
      }
      
      console.log('Dados sendo enviados:', dataToSendSnakeCase)

      const response = await fetch('/api/financeiro/categories', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSendSnakeCase)
      })

      console.log('Status da resposta:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Categoria salva com sucesso:', result)
        // Recarregar dados após salvar (forçado)
        await refreshData(true)
        setShowCategoryForm(false)
        setEditingCategory(null)
        setCategoryForm({
          selectedCategory: "",
          description: "",
          color: "blue",
          icon: "Building2",
          is_active: true
        })
      } else {
        const errorData = await response.json()
        console.error('Erro ao salvar categoria:', errorData)
        console.error('Status:', response.status)
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    const categoryName = category?.name || 'esta categoria'
    
    showConfirmation({
      title: "Deletar Categoria",
      description: `Tem certeza que deseja deletar a categoria "${categoryName}"? Todas as subcategorias associadas também serão removidas.`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/financeiro/categories?id=${categoryId}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            // Recarregar dados após deletar (forçado)
            await refreshData(true)
          } else {
            console.error('Erro ao deletar categoria')
          }
        } catch (error) {
          console.error('Erro ao deletar categoria:', error)
        }
      }
    })
  }

  // Funções para subcategorias
  const handleCreateSubcategory = (categoryId: string) => {
    setEditingSubcategory(null)
    setSubcategoryForm({
      name: "",
      description: "",
      is_active: true
    })
    setShowSubcategoryForm(categoryId)
  }

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory)
    setSubcategoryForm({
      name: subcategory.name,
      description: subcategory.description || "",
      is_active: subcategory.is_active
    })
    setShowSubcategoryForm(subcategory.category_id)
  }

  const handleSaveSubcategory = async () => {
    if (!subcategoryForm.name.trim()) return
    
    // Prevenir múltiplos cliques
    if (isSavingSubcategory) return
    
    setIsSavingSubcategory(true)

    try {
      const method = editingSubcategory ? 'PUT' : 'POST'
      const dataToSend = editingSubcategory 
        ? { id: editingSubcategory.id, ...subcategoryForm }
        : { category_id: showSubcategoryForm, ...subcategoryForm }

      // Converter camelCase para snake_case antes de enviar
      const dataToSendSnakeCase = {
        name: dataToSend.name,
        description: dataToSend.description,
        is_active: dataToSend.is_active,
        ...(editingSubcategory ? { id: (dataToSend as any).id } : { category_id: (dataToSend as any).category_id })
      }

      console.log('Dados da subcategoria sendo enviados:', dataToSendSnakeCase)

      const response = await fetch('/api/financeiro/subcategories', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSendSnakeCase)
      })

      if (response.ok) {
        // Recarregar dados após salvar (forçado)
        await refreshData(true)
        setShowSubcategoryForm(null)
        setEditingSubcategory(null)
        setSubcategoryForm({
          name: "",
          description: "",
          is_active: true
        })
      } else {
        console.error('Erro ao salvar subcategoria')
      }
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error)
    } finally {
      setIsSavingSubcategory(false)
    }
  }

  const handleDeleteSubcategory = (subcategoryId: string) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId)
    const subcategoryName = subcategory?.name || 'esta subcategoria'
    
    showConfirmation({
      title: "Deletar Subcategoria",
      description: `Tem certeza que deseja deletar a subcategoria "${subcategoryName}"?`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/financeiro/subcategories?id=${subcategoryId}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            // Recarregar dados após deletar (forçado)
            await refreshData(true)
          } else {
            console.error('Erro ao deletar subcategoria')
          }
        } catch (error) {
          console.error('Erro ao deletar subcategoria:', error)
        }
      }
    })
  }

  // Função para obter subcategorias de uma categoria
  const getSubcategoriesByCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId)
  }

  // Função para obter ícone
  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find(i => i.value === iconName)
    return icon ? icon.component : Building2
  }

  // Filtrar categorias
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/financeiro" 
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-purple-600" />
            </Link>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-violet-900 bg-clip-text text-transparent">
                Gestão de Categorias
              </h2>
              <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                Gerencie categorias e subcategorias de despesas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Ações */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_8px_40px_-12px_rgba(15,23,42,0.25)] transition-all duration-300 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-violet-900 bg-clip-text text-transparent">
              Filtros e Ações
            </CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleCreateCategory}
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={(() => {
                const availableCategories = predefinedCategories.filter(predefinedCategory => 
                  !categories.some(existingCategory => 
                    existingCategory.name === predefinedCategory.name
                  )
                );
                return availableCategories.length === 0;
              })()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
              {(() => {
                const availableCategories = predefinedCategories.filter(predefinedCategory => 
                  !categories.some(existingCategory => 
                    existingCategory.name === predefinedCategory.name
                  )
                );
                return availableCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                    {availableCategories.length}
                  </Badge>
                );
              })()}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Buscar categorias..."
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Progresso das categorias */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-purple-500 rounded">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-purple-900">
                    Progresso das Categorias
                  </div>
                  <div className="text-xs text-purple-700">
                    {categories.length} de {predefinedCategories.length} categorias criadas
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(categories.length / predefinedCategories.length) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-purple-900">
                  {Math.round((categories.length / predefinedCategories.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ModernLoading 
              size="lg" 
              text="Carregando categorias..." 
              color="purple" 
            />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm 
                  ? `Nenhuma categoria corresponde à busca "${searchTerm}"`
                  : "Comece criando sua primeira categoria pré-definida"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={handleCreateCategory}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          </div>
        ) : (
          filteredCategories.map((category) => {
          const IconComponent = getIconComponent(category.icon)
          const isExpanded = expandedCategories.has(category.id)
          const categorySubcategories = getSubcategoriesByCategory(category.id)
          
          return (
            <Card key={category.id} className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_8px_40px_-12px_rgba(15,23,42,0.25)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] transition-all duration-300 rounded-2xl group">
              <CardHeader className="pb-4 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 group/btn"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-600 group-hover/btn:text-slate-800 transition-colors" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover/btn:text-slate-800 transition-colors" />
                      )}
                    </button>
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-${category.color}-500/10 to-${category.color}-600/10 group-hover:from-${category.color}-500/20 group-hover:to-${category.color}-600/20 transition-all duration-300 shadow-sm`}>
                      <IconComponent className={`h-6 w-6 ${availableColors.find(c => c.value === category.color)?.class || 'text-slate-600'}`} />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent group-hover:from-slate-700 group-hover:via-slate-600 group-hover:to-slate-500 transition-all duration-300">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-600 font-medium">
                        {category.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs bg-slate-50/80 border-slate-200 text-slate-600">
                      {categorySubcategories.length} subcategorias
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="border-slate-300 hover:border-red-400 hover:bg-red-50 text-slate-700 hover:text-red-700 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0 p-6">
                  <div className="space-y-4">
                    {/* Lista de subcategorias */}
                    {categorySubcategories.map((subcategory) => (
                      <div key={subcategory.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40 hover:bg-white/80 hover:shadow-sm transition-all duration-200 group/subcategory">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-br from-${category.color}-400 to-${category.color}-500 shadow-sm`} />
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-800 group-hover/subcategory:text-slate-900 transition-colors">
                              {subcategory.name}
                            </div>
                            {subcategory.description && (
                              <div className="text-sm text-slate-600 group-hover/subcategory:text-slate-700 transition-colors">
                                {subcategory.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSubcategory(subcategory)}
                            className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            className="border-slate-300 hover:border-red-400 hover:bg-red-50 text-slate-700 hover:text-red-700 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Botão para adicionar subcategoria */}
                    <button
                      onClick={() => handleCreateSubcategory(category.id)}
                      className="w-full p-4 border-2 border-dashed border-slate-300/60 rounded-xl text-slate-500 hover:text-slate-700 hover:border-slate-400/80 hover:bg-slate-50/50 transition-all duration-200 flex items-center justify-center gap-3 group/add-btn"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 group-hover/add-btn:bg-slate-200 transition-colors duration-200">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Adicionar subcategoria</span>
                    </button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
          })
        )}
      </div>

      {/* Modal de Categoria */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="categorySelect">Selecionar Categoria</Label>
                <select
                  id="categorySelect"
                  value={categoryForm.selectedCategory}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, selectedCategory: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecione uma categoria...</option>
                  {(() => {
                    const availableCategories = predefinedCategories.filter(predefinedCategory => {
                      // Filtrar categorias que já existem no banco (apenas ao criar nova categoria)
                      if (!editingCategory) {
                        return !categories.some(existingCategory => 
                          existingCategory.name === predefinedCategory.name
                        );
                      }
                      // Ao editar, mostrar todas as categorias (incluindo a atual)
                      return true;
                    });

                    if (availableCategories.length === 0 && !editingCategory) {
                      return (
                        <option value="" disabled>
                          Todas as categorias pré-definidas já foram criadas
                        </option>
                      );
                    }

                    return availableCategories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ));
                  })()}
                </select>
                {categoryForm.selectedCategory && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-md border">
                    <div className="text-sm text-slate-600">
                      <strong>Descrição:</strong> {predefinedCategories.find(cat => cat.name === categoryForm.selectedCategory)?.description}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Descrição Personalizada (Opcional)</Label>
                <Textarea
                  id="description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Adicione uma descrição personalizada (opcional)..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Se deixado em branco, será usada a descrição padrão da categoria.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="isActive">Categoria ativa</Label>
              </div>
            </CardContent>
            <CardContent className="flex justify-end gap-2 pt-0">
              <Button variant="outline" onClick={() => setShowCategoryForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCategory}
                disabled={isSavingCategory || !categoryForm.selectedCategory.trim()}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500"
              >
                {isSavingCategory ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Subcategoria */}
      {showSubcategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subName">Nome da Subcategoria</Label>
                <Input
                  id="subName"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Aluguel do Escritório"
                />
              </div>
              
              <div>
                <Label htmlFor="subDescription">Descrição</Label>
                <Textarea
                  id="subDescription"
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva a subcategoria..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="subIsActive"
                  checked={subcategoryForm.is_active}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="subIsActive">Subcategoria ativa</Label>
              </div>
            </CardContent>
            <CardContent className="flex justify-end gap-2 pt-0">
              <Button variant="outline" onClick={() => setShowSubcategoryForm(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveSubcategory}
                disabled={isSavingSubcategory || !subcategoryForm.name.trim()}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500"
              >
                {isSavingSubcategory ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Dialog de Confirmação */}
      {confirmationData && (
        <ConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          title={confirmationData.title}
          description={confirmationData.description}
          onConfirm={() => {
            confirmationData.onConfirm()
            setShowConfirmation(false)
            setConfirmationData(null)
          }}
        />
      )}
    </div>
  )
}
