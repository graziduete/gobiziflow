// Mock data for testing the frontend without database
export const mockUsers = [
  {
    id: "admin-user-1",
    email: "admin@test.com",
    full_name: "Admin Teste",
    role: "admin",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "client-user-1",
    email: "cliente@test.com",
    full_name: "Cliente Teste",
    role: "client",
    created_at: "2024-01-01T00:00:00Z",
  },
]

export const mockCompanies = [
  {
    id: "company-1",
    name: "TechCorp Solutions",
    description: "Empresa de tecnologia especializada em desenvolvimento de software",
    website: "https://techcorp.com",
    phone: "(11) 99999-0001",
    email: "contato@techcorp.com",
    address: "Av. Paulista, 1000 - São Paulo, SP",
    created_by: "admin-user-1",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "company-2",
    name: "Digital Marketing Pro",
    description: "Agência de marketing digital e publicidade online",
    website: "https://digitalmarketing.com",
    phone: "(11) 99999-0002",
    email: "contato@digitalmarketing.com",
    address: "Rua Augusta, 500 - São Paulo, SP",
    created_by: "admin-user-1",
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "company-3",
    name: "E-commerce Plus",
    description: "Plataforma de e-commerce e soluções para vendas online",
    website: "https://ecommerceplus.com",
    phone: "(11) 99999-0003",
    email: "contato@ecommerceplus.com",
    address: "Rua Oscar Freire, 200 - São Paulo, SP",
    created_by: "admin-user-1",
    created_at: "2024-01-03T00:00:00Z",
  },
]

export const mockUserCompanies = [
  { user_id: "admin-user-1", company_id: "company-1" },
  { user_id: "admin-user-1", company_id: "company-2" },
  { user_id: "admin-user-1", company_id: "company-3" },
  { user_id: "client-user-1", company_id: "company-1" },
]

export const mockProjects = [
  {
    id: "project-1",
    name: "Sistema CRM",
    description: "Desenvolvimento de sistema de gestão de relacionamento com clientes",
    status: "in_progress",
    priority: "high",
    start_date: "2024-01-15T00:00:00Z",
    end_date: "2024-06-15T00:00:00Z",
    budget: 150000,
    company_id: "company-1",
    created_by: "admin-user-1",
    created_at: "2024-01-15T00:00:00Z",
    companies: { name: "TechCorp Solutions" },
  },
  {
    id: "project-2",
    name: "Campanha de Marketing",
    description: "Campanha digital para lançamento de novo produto",
    status: "planning",
    priority: "medium",
    start_date: "2024-02-01T00:00:00Z",
    end_date: "2024-04-01T00:00:00Z",
    budget: 75000,
    company_id: "company-2",
    created_by: "admin-user-1",
    created_at: "2024-01-20T00:00:00Z",
    companies: { name: "Digital Marketing Pro" },
  },
  {
    id: "project-3",
    name: "Migração E-commerce",
    description: "Migração da plataforma de e-commerce para nova tecnologia",
    status: "completed",
    priority: "urgent",
    start_date: "2023-10-01T00:00:00Z",
    end_date: "2023-12-31T00:00:00Z",
    budget: 200000,
    company_id: "company-3",
    created_by: "admin-user-1",
    created_at: "2023-10-01T00:00:00Z",
    companies: { name: "E-commerce Plus" },
  },
  {
    id: "project-4",
    name: "App Mobile",
    description: "Desenvolvimento de aplicativo mobile para iOS e Android",
    status: "in_progress",
    priority: "high",
    start_date: "2024-02-15T00:00:00Z",
    end_date: "2024-08-15T00:00:00Z",
    budget: 120000,
    company_id: "company-1",
    created_by: "admin-user-1",
    created_at: "2024-02-15T00:00:00Z",
    companies: { name: "TechCorp Solutions" },
  },
  {
    id: "project-5",
    name: "SEO Optimization",
    description: "Otimização de SEO para melhorar ranking nos buscadores",
    status: "on_hold",
    priority: "low",
    start_date: "2024-03-01T00:00:00Z",
    end_date: "2024-05-01T00:00:00Z",
    budget: 30000,
    company_id: "company-2",
    created_by: "admin-user-1",
    created_at: "2024-02-25T00:00:00Z",
    companies: { name: "Digital Marketing Pro" },
  },
]

export const mockTasks = [
  {
    id: "task-1",
    title: "Análise de Requisitos",
    description: "Levantar e documentar todos os requisitos do sistema CRM",
    status: "completed",
    priority: "high",
    due_date: "2024-02-01T00:00:00Z",
    estimated_hours: 40,
    actual_hours: 35,
    project_id: "project-1",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-01-15T00:00:00Z",
    projects: {
      name: "Sistema CRM",
      companies: { name: "TechCorp Solutions" },
    },
  },
  {
    id: "task-2",
    title: "Design da Interface",
    description: "Criar mockups e protótipos da interface do usuário",
    status: "in_progress",
    priority: "high",
    due_date: "2024-03-15T00:00:00Z",
    estimated_hours: 60,
    actual_hours: 25,
    project_id: "project-1",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-02-01T00:00:00Z",
    projects: {
      name: "Sistema CRM",
      companies: { name: "TechCorp Solutions" },
    },
  },
  {
    id: "task-3",
    title: "Desenvolvimento Backend",
    description: "Implementar APIs e lógica de negócio do sistema",
    status: "todo",
    priority: "high",
    due_date: "2024-05-01T00:00:00Z",
    estimated_hours: 120,
    actual_hours: 0,
    project_id: "project-1",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-02-15T00:00:00Z",
    projects: {
      name: "Sistema CRM",
      companies: { name: "TechCorp Solutions" },
    },
  },
  {
    id: "task-4",
    title: "Estratégia de Conteúdo",
    description: "Definir estratégia de conteúdo para redes sociais",
    status: "review",
    priority: "medium",
    due_date: "2024-02-20T00:00:00Z",
    estimated_hours: 20,
    actual_hours: 18,
    project_id: "project-2",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-02-01T00:00:00Z",
    projects: {
      name: "Campanha de Marketing",
      companies: { name: "Digital Marketing Pro" },
    },
  },
  {
    id: "task-5",
    title: "Criação de Anúncios",
    description: "Desenvolver peças publicitárias para Google Ads e Facebook",
    status: "todo",
    priority: "medium",
    due_date: "2024-03-01T00:00:00Z",
    estimated_hours: 30,
    actual_hours: 0,
    project_id: "project-2",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-02-10T00:00:00Z",
    projects: {
      name: "Campanha de Marketing",
      companies: { name: "Digital Marketing Pro" },
    },
  },
  {
    id: "task-6",
    title: "Testes de Performance",
    description: "Realizar testes de carga e performance da nova plataforma",
    status: "completed",
    priority: "urgent",
    due_date: "2023-12-15T00:00:00Z",
    estimated_hours: 25,
    actual_hours: 30,
    project_id: "project-3",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2023-12-01T00:00:00Z",
    projects: {
      name: "Migração E-commerce",
      companies: { name: "E-commerce Plus" },
    },
  },
  {
    id: "task-7",
    title: "Desenvolvimento iOS",
    description: "Implementar versão nativa para iOS do aplicativo",
    status: "in_progress",
    priority: "high",
    due_date: "2024-06-01T00:00:00Z",
    estimated_hours: 80,
    actual_hours: 20,
    project_id: "project-4",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-02-15T00:00:00Z",
    projects: {
      name: "App Mobile",
      companies: { name: "TechCorp Solutions" },
    },
  },
  {
    id: "task-8",
    title: "Desenvolvimento Android",
    description: "Implementar versão nativa para Android do aplicativo",
    status: "todo",
    priority: "high",
    due_date: "2024-07-01T00:00:00Z",
    estimated_hours: 80,
    actual_hours: 0,
    project_id: "project-4",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-02-20T00:00:00Z",
    projects: {
      name: "App Mobile",
      companies: { name: "TechCorp Solutions" },
    },
  },
  {
    id: "task-9",
    title: "Auditoria SEO",
    description: "Realizar auditoria completa do site atual",
    status: "todo",
    priority: "low",
    due_date: "2024-03-15T00:00:00Z",
    estimated_hours: 15,
    actual_hours: 0,
    project_id: "project-5",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-02-25T00:00:00Z",
    projects: {
      name: "SEO Optimization",
      companies: { name: "Digital Marketing Pro" },
    },
  },
  {
    id: "task-10",
    title: "Implementação de Tags",
    description: "Implementar tags de tracking e analytics",
    status: "todo",
    priority: "low",
    due_date: "2024-04-01T00:00:00Z",
    estimated_hours: 10,
    actual_hours: 0,
    project_id: "project-5",
    assigned_to: "client-user-1",
    created_by: "admin-user-1",
    created_at: "2024-03-01T00:00:00Z",
    projects: {
      name: "SEO Optimization",
      companies: { name: "Digital Marketing Pro" },
    },
  },
]

// Mock authentication state
export let currentMockUser: (typeof mockUsers)[0] | null = null

export const mockAuth = {
  login: (email: string, password: string) => {
    const user = mockUsers.find((u) => u.email === email)
    if (user && password === "123456") {
      currentMockUser = user
      return { success: true, user }
    }
    return { success: false, error: "Credenciais inválidas" }
  },

  logout: () => {
    currentMockUser = null
  },

  getCurrentUser: () => currentMockUser,

  isAdmin: () => currentMockUser?.role === "admin",

  isClient: () => currentMockUser?.role === "client",
}

// Helper functions to get filtered data
export const getMockDataForUser = (userId: string) => {
  const userCompanies = mockUserCompanies.filter((uc) => uc.user_id === userId).map((uc) => uc.company_id)

  const companies = mockCompanies.filter((c) => userCompanies.includes(c.id))
  const projects = mockProjects.filter((p) => userCompanies.includes(p.company_id))
  const tasks = mockTasks.filter((t) => t.assigned_to === userId)

  return { companies, projects, tasks }
}

export const getAllMockData = () => ({
  users: mockUsers,
  companies: mockCompanies,
  projects: mockProjects,
  tasks: mockTasks,
  userCompanies: mockUserCompanies,
})
