import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/types'

export class AuthService {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Buscar perfil do usuário
      if (data.user) {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        return { user: data.user, profile, session: data.session }
      }

      return { user: null, profile: null, session: null }
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  async signUp(email: string, password: string, fullName: string, role: 'admin' | 'client' = 'client') {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Criar perfil do usuário
        const { error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
            is_first_login: true,
          })

        if (profileError) throw profileError
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      throw error
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro no logout:', error)
      throw error
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error) throw error

      if (user) {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        return { user, profile }
      }

      return { user: null, profile: null }
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error)
      return { user: null, profile: null }
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      return null
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      throw error
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      throw error
    }
  }

  async updateProfile(updates: Partial<User>) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      throw error
    }
  }

  async markFirstLoginComplete() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await this.supabase
        .from('profiles')
        .update({ is_first_login: false })
        .eq('id', user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao marcar primeiro login:', error)
      throw error
    }
  }
}

export const authService = new AuthService() 