"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function FirstLoginPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Buscar perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        setMessage({ type: 'error', text: 'Erro ao carregar perfil do usuário' })
        return
      }

      setProfile(profile)

      // Se não é client_admin ou já completou o primeiro login, redirecionar
      if (!profile.is_client_admin || profile.first_login_completed) {
        router.push('/admin')
        return
      }

    } catch (error) {
      console.error('Erro ao verificar status do usuário:', error)
      setMessage({ type: 'error', text: 'Erro ao verificar status do usuário' })
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Validar senhas
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'As senhas não coincidem' })
        setLoading(false)
        return
      }

      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' })
        setLoading(false)
        return
      }

      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (authError) {
        setMessage({ type: 'error', text: `Erro ao atualizar senha: ${authError.message}` })
        setLoading(false)
        return
      }

      // Marcar primeiro login como completado
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          first_login_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        setMessage({ type: 'error', text: `Erro ao atualizar perfil: ${profileError.message}` })
        setLoading(false)
        return
      }

      setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Redirecionando...' })
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/admin')
      }, 2000)

    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      setMessage({ type: 'error', text: 'Erro inesperado ao alterar senha' })
    } finally {
      setLoading(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bem-vindo!</CardTitle>
          <CardDescription>
            Olá <strong>{profile.full_name}</strong>, você precisa definir sua senha de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Digite sua nova senha"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirme sua nova senha"
                required
                minLength={6}
              />
            </div>

            {message && (
              <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <AlertDescription className="flex items-center space-x-2">
                  {message.type === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <span className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                    {message.text}
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Definir Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
