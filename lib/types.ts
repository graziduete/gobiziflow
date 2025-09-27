export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'admin_operacional' | 'client'
  is_first_login: boolean
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  created_by: string
  created_at: string
  updated_at: string
  // Campos para pacotes de horas
  has_hour_package?: boolean
  contracted_hours?: number
  package_start_date?: string
  package_end_date?: string
  package_type?: 'monthly' | 'period'
  account_model?: 'standard' | 'current_account'
}

export interface UserCompany {
  id: string
  user_id: string
  company_id: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  priority: 'low' | 'medium' | 'high'
  start_date: string
  end_date: string
  budget: number
  company_id: string
  created_by: string
  created_at: string
  updated_at: string
  // Campos adicionais para o MVP
  type: 'Web' | 'Mobile' | 'Bot' | 'RPA'
  contracted_hours: number
  consumed_hours: number
  technical_responsible: string
  key_user: string
  completion_percentage: number
  // Novos campos adicionados
  project_type?: string
  estimated_hours?: number
}

export type ProjectStatus = 
  | 'Pré-Planning'
  | 'Revisão do Escopo'
  | 'Desenho Funcional'
  | 'Envio do Desenho Funcional'
  | 'Aguardar Validação'
  | 'Arquitetura e Estrutura'
  | 'Desenvolvimento'
  | 'Homologação com Usuário'
  | 'Aprovação do Usuário'
  | 'Preparação para Deploy'
  | 'Solicitar Aprovação para Deploy'
  | 'Deploy em Produção'
  | 'Operação Assistida'
  | 'planning'
  | 'in_progress'
  | 'homologation'
  | 'on_hold'
  | 'delayed'
  | 'completed'
  | 'cancelled'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high'
  due_date: string
  estimated_hours: number
  actual_hours: number
  project_id: string
  assigned_to: string
  created_by: string
  created_at: string
  updated_at: string
  // Campos para o Gantt
  start_date: string
  end_date: string
  dependencies?: string[] // IDs das tarefas que devem ser concluídas antes
  // Campo renomeado
  name?: string
}

export interface DashboardStats {
  total_projects: number
  ongoing_projects: number
  overdue_projects: number
  completed_projects: number
  total_contracted_hours: number
  total_consumed_hours: number
  remaining_hours: number
}

export interface GanttTask {
  id: string
  title: string
  start: string
  end: string
  progress: number
  dependencies: string[]
  resource: string
  status: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  created_at: string
}

// Novas interfaces para o sistema de pacotes de horas
export interface HourPackage {
  id: string
  company_id: string
  package_type: 'monthly' | 'period'
  contracted_hours: number
  start_date: string
  end_date?: string
  is_current: boolean
  account_model: 'standard' | 'current_account'
  status: 'active' | 'expired' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface HourConsumption {
  id: string
  hour_package_id: string
  project_id: string
  consumed_hours: number
  consumption_date: string
  month_year: string // Formato: '2025-09', '2025-10'
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

// Novas interfaces para métricas de pagamento
export interface PaymentMetric {
  id?: string
  company_id: string
  hour_package_id?: string | null // Opcional: métricas são independentes dos pacotes de horas
  metric_type: 'monthly_fixed' | 'percentage_phases' | 'installments'
  name: string
  total_value: number
  hourly_rate?: number
  total_hours?: number
  start_date: string
  end_date: string
  is_active: boolean
  // Colunas para percentuais das fases (apenas para metric_type = 'percentage_phases')
  planning_percentage?: number
  homologation_percentage?: number
  completion_percentage?: number
  created_at?: string
  updated_at?: string
}

export interface PaymentMetricDetail {
  id?: string
  payment_metric_id: string
  detail_type: 'monthly_amount' | 'phase_percentage' | 'installment_amount'
  amount: number
  percentage?: number
  phase_name?: string
  installment_number?: number
  due_date?: string
  month_year?: string
  is_paid?: boolean
  created_at?: string
  updated_at?: string
}

// Interface para cálculos de horas no dashboard
export interface CompanyHourStats {
  company_id: string
  company_name: string
  month_year: string
  contracted_hours: number
  consumed_hours: number
  previous_months_remaining: number
  total_available: number
  remaining_hours: number
  account_model: 'standard' | 'current_account'
  package_type: 'monthly' | 'period'
  is_active: boolean
  start_date?: string
  end_date?: string | null
}

export interface ProjectForecast {
  id: string
  project_id: string
  month_year: string
  forecast_amount: number
  forecast_percentage: number
  status_when_forecasted: string
  budget_amount: number
  company_id: string
  created_at: string
  updated_at: string
  // Campos relacionados para exibição
  project_name?: string
  company_name?: string
  current_status?: string
}

export interface MonthlyForecast {
  month_year: string
  total_forecast: number
  forecasts: ProjectForecast[]
  company_filter?: string
}

// Interface para filtros do dashboard
export interface DashboardFilters {
  selectedCompany?: string
  selectedMonth?: string | null
  selectedYear?: string
}

// Interface para estatísticas do dashboard
export interface DashboardStatistics {
  totalRevenue: number
  totalProjects: number
  projectsInProgress: number
  projectsDelayed: number
  projectsCompleted: number
  totalContractedHours: number
  totalConsumedHours: number
  totalRemainingHours: number
  companiesCount: number
  usersCount: number
} 