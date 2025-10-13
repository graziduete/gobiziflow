import { createClient } from '@/lib/supabase/client'
import { Company } from '@/lib/types'

export class CompanyService {
  private supabase = createClient()

  async getAllCompanies() {
    try {
      // Obter dados do usuário logado
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar perfil do usuário
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role, is_client_admin')
        .eq('id', user.id)
        .single()

      let query = this.supabase
        .from('companies')
        .select('*')
        .order('name')

      // Se for Client Admin, filtrar por tenant_id
      if (profile?.is_client_admin) {
        const { data: clientAdmin } = await this.supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('tenant_id', clientAdmin.company_id)
        }
      } 
      // Se for Admin Normal, filtrar apenas empresas sem tenant_id (criadas por Admin Master/Normal)
      else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      throw error
    }
  }

  async getCompanyById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar empresa:', error)
      throw error
    }
  }

  async createCompany(companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      throw error
    }
  }

  async updateCompany(id: string, updates: Partial<Company>) {
    try {
      const { data, error } = await this.supabase
        .from('companies')
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
      console.error('Erro ao atualizar empresa:', error)
      throw error
    }
  }

  async deleteCompany(id: string) {
    try {
      const { error } = await this.supabase
        .from('companies')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar empresa:', error)
      throw error
    }
  }

  async uploadLogo(companyId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${companyId}-${Date.now()}.${fileExt}`

      const { data, error } = await this.supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Gerar URL pública
      const { data: { publicUrl } } = this.supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName)

      // Atualizar empresa com a URL do logo
      await this.updateCompany(companyId, { logo_url: publicUrl })

      return publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error)
      throw error
    }
  }

  async getCompaniesByUser(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_companies')
        .select(`
          company_id,
          companies (*)
        `)
        .eq('user_id', userId)

      if (error) throw error
      return data?.map(item => item.companies) || []
    } catch (error) {
      console.error('Erro ao buscar empresas do usuário:', error)
      throw error
    }
  }

  async addUserToCompany(userId: string, companyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_companies')
        .insert({
          user_id: userId,
          company_id: companyId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao adicionar usuário à empresa:', error)
      throw error
    }
  }

  async removeUserFromCompany(userId: string, companyId: string) {
    try {
      const { error } = await this.supabase
        .from('user_companies')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao remover usuário da empresa:', error)
      throw error
    }
  }
}

export const companyService = new CompanyService() 