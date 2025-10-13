import { createClient } from '@supabase/supabase-js'
import { User } from '@/lib/types'
import { sendEmail, emailTemplates } from '@/lib/email-server'

export class UserService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async getAllUsers() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          user_companies (
            company_id,
            companies (name)
          )
        `)
        .order('full_name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }
  }

  async getUserById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          user_companies (
            company_id,
            companies (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      throw error
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('🚀 [UserService] Iniciando criação de usuário:', { email: userData.email, role: userData.role })
      
      // Gerar senha aleatória
      const password = this.generateRandomPassword()
      console.log('🔑 [UserService] Senha gerada')
      
      // Criar usuário no auth usando service role
      console.log('👤 [UserService] Criando usuário no auth...')
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
        },
      })

      if (authError) {
        console.error('❌ [UserService] Erro ao criar usuário no auth:', authError)
        if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
          throw new Error('Este e-mail já está cadastrado no sistema')
        }
        throw authError
      }
      
      console.log('✅ [UserService] Usuário criado no auth:', authData.user?.id)

      if (authData.user) {
        // Aguardar um pouco para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Buscar o perfil criado pelo trigger
        console.log('🔍 [UserService] Buscando perfil criado pelo trigger...')
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        
        console.log('📊 [UserService] Resultado da busca do perfil:', { profile: !!profile, error: profileError })

        let finalProfile = profile

        if (profileError) {
          console.log('⚠️ [UserService] Trigger não funcionou, criando perfil manualmente...')
          // Se o trigger não funcionou, criar manualmente
          const { data: newProfile, error: createError } = await this.supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: userData.email,
              full_name: userData.full_name,
              role: userData.role,
              is_first_login: true,
              first_login_completed: false, // Flag para primeiro login
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ [UserService] Erro ao criar perfil manualmente:', createError)
            throw createError
          }
          console.log('✅ [UserService] Perfil criado manualmente:', newProfile?.id)
          finalProfile = newProfile
        }

        // Enviar email com a senha apenas uma vez
        console.log('📧 [UserService] Enviando email de boas-vindas...')
        await this.sendPasswordEmail(userData.email, password, userData.full_name)
        console.log('✅ [UserService] Email enviado com sucesso')

        console.log('🎉 [UserService] Usuário criado com sucesso!')
        return { user: finalProfile, password }
      }

      throw new Error('Falha ao criar usuário')
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      throw error
    }
  }

  async updateUser(id: string, updates: Partial<User>) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
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
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  }

  async deleteUser(id: string) {
    try {
      // Deletar perfil
      const { error: profileError } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (profileError) throw profileError

      // Deletar usuário do auth (requer admin)
      const { error: authError } = await this.supabase.auth.admin.deleteUser(id)
      
      if (authError) throw authError

      return true
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      throw error
    }
  }

  async getUsersByCompany(companyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_companies')
        .select(`
          user_id,
          profiles (*)
        `)
        .eq('company_id', companyId)

      if (error) throw error
      return data?.map((item: any) => item.profiles) || []
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error)
      throw error
    }
  }

  async getUsersByRole(role: 'admin' | 'client') {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('role', role)
        .order('full_name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar usuários por role:', error)
      throw error
    }
  }

  async resetUserPassword(userId: string) {
    try {
      const { data: user } = await this.getUserById(userId)
      if (!user) throw new Error('Usuário não encontrado')

      // Gerar nova senha
      const newPassword = this.generateRandomPassword()

      // Atualizar senha no auth
      const { error: authError } = await this.supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      })

      if (authError) throw authError

      // Marcar como primeiro login
      await this.updateUser(userId, { is_first_login: true })

      // Enviar email com nova senha
      await this.sendPasswordEmail(user.email, newPassword, user.full_name)

      return { success: true, password: newPassword }
    } catch (error) {
      console.error('Erro ao resetar senha do usuário:', error)
      throw error
    }
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  private async sendPasswordEmail(email: string, password: string, fullName: string) {
    try {
      console.log(`📧 [UserService] Enviando email de credenciais para ${email}`)
      
      const emailTemplate = emailTemplates.newUserCredentials({
        fullName,
        email,
        password,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        companyName: undefined // Para admin_master não há empresa associada
      })
      
      const result = await sendEmail({
        to: email,
        ...emailTemplate
      })
      
      if (result.success) {
        console.log(`✅ [UserService] Email enviado com sucesso para ${email}`)
      } else {
        console.error(`❌ [UserService] Falha ao enviar email para ${email}:`, result.error)
      }
      
      return result
    } catch (error) {
      console.error('❌ [UserService] Erro ao enviar email:', error)
      // Não vamos falhar a criação do usuário por causa do email
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  async updateUserRole(userId: string, newRole: 'admin' | 'client') {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar role do usuário:', error)
      throw error
    }
  }

  async getUsersWithProjects() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          projects_created:projects!projects_created_by_fkey (id, name, status),
          projects_assigned:projects!projects_technical_responsible_fkey (id, name, status)
        `)
        .order('full_name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar usuários com projetos:', error)
      throw error
    }
  }
}

export const userService = new UserService() 