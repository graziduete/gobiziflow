import { createClient } from '@/lib/supabase/client'
import { Project, ProjectStatus, DashboardStats } from '@/lib/types'

export class ProjectService {
  private supabase = createClient()

  async getAllProjects() {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          companies (name, logo_url),
          profiles!projects_created_by_fkey (full_name),
          profiles!projects_technical_responsible_fkey (full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
      throw error
    }
  }

  async getProjectsByCompany(companyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          companies (name, logo_url),
          profiles!projects_created_by_fkey (full_name),
          profiles!projects_technical_responsible_fkey (full_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar projetos da empresa:', error)
      throw error
    }
  }

  async getProjectById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          companies (*),
          profiles!projects_created_by_fkey (*),
          profiles!projects_technical_responsible_fkey (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar projeto:', error)
      throw error
    }
  }

  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      throw error
    }
  }

  async updateProject(id: string, updates: Partial<Project>) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
      throw error
    }
  }

  async deleteProject(id: string) {
    try {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
      throw error
    }
  }

  async getProjectsByStatus(status: ProjectStatus) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          companies (name, logo_url),
          profiles!projects_created_by_fkey (full_name)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar projetos por status:', error)
      throw error
    }
  }

  async getProjectsByType(type: Project['type']) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          companies (name, logo_url),
          profiles!projects_created_by_fkey (full_name)
        `)
        .eq('type', type)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar projetos por tipo:', error)
      throw error
    }
  }

  async getProjectsByResponsible(responsibleId: string) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          companies (name, logo_url),
          profiles!projects_created_by_fkey (full_name)
        `)
        .eq('technical_responsible', responsibleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar projetos por responsável:', error)
      throw error
    }
  }

  async getDashboardStats(companyId?: string): Promise<DashboardStats> {
    try {
      let query = this.supabase.from('projects').select('*')
      
      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data: projects, error } = await query

      if (error) throw error

      const now = new Date()
      const totalProjects = projects?.length || 0
      
      const ongoingProjects = projects?.filter(p => 
        p.status !== 'Operação Assistida' && 
        new Date(p.end_date) >= now
      ).length || 0

      const overdueProjects = projects?.filter(p => 
        p.status !== 'Operação Assistida' && 
        new Date(p.end_date) < now
      ).length || 0

      const completedProjects = projects?.filter(p => 
        p.status === 'Operação Assistida'
      ).length || 0

      const totalContractedHours = projects?.reduce((sum, p) => sum + (p.contracted_hours || 0), 0) || 0
      const totalConsumedHours = projects?.reduce((sum, p) => sum + (p.consumed_hours || 0), 0) || 0
      const remainingHours = totalContractedHours - totalConsumedHours

      return {
        total_projects: totalProjects,
        ongoing_projects: ongoingProjects,
        overdue_projects: overdueProjects,
        completed_projects: completedProjects,
        total_contracted_hours: totalContractedHours,
        total_consumed_hours: totalConsumedHours,
        remaining_hours: remainingHours,
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error)
      throw error
    }
  }

  async updateProjectProgress(id: string, consumedHours: number, completionPercentage: number) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .update({
          consumed_hours: consumedHours,
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar progresso do projeto:', error)
      throw error
    }
  }

  async getProjectsByDateRange(startDate: string, endDate: string, companyId?: string) {
    try {
      let query = this.supabase
        .from('projects')
        .select(`
          *,
          companies (name, logo_url),
          profiles!projects_created_by_fkey (full_name)
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date')

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar projetos por período:', error)
      throw error
    }
  }
}

export const projectService = new ProjectService() 