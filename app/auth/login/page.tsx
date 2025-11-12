"use client"

import type React from "react"

import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { CookieBanner } from "@/components/cookie-banner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validação customizada
    if (!email.trim()) {
      setError("Por favor, digite seu email")
      setIsLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Por favor, digite um email válido")
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError("Por favor, digite sua senha")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Traduzir mensagens de erro comuns
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Credenciais de login inválidas")
        } else if (authError.message.includes("Email not confirmed")) {
          throw new Error("Email não confirmado")
        } else if (authError.message.includes("Too many requests")) {
          throw new Error("Muitas tentativas. Tente novamente em alguns minutos")
        } else {
          throw new Error("Erro ao fazer login. Verifique suas credenciais")
        }
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, is_client_admin, first_login_completed")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          console.error("Profile error:", profileError)
          setError("Erro ao carregar perfil do usuário")
          return
        }

        // Se não completou primeiro login, redirecionar para redefinição
        if (!profile.first_login_completed) {
          // Se é client_admin, vai para página específica
          if (profile.is_client_admin) {
            router.push("/admin/first-login")
          } else {
            // Se é usuário normal, vai para redefinição padrão
            router.push("/auth/reset-password?first_login=true")
          }
          return
        }

        // Redirecionamento baseado no role (otimizado - sem reload)
        if (profile.role === "admin" || profile.role === "admin_operacional" || profile.role === "admin_master") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden">
      {/* Fundo otimizado - Trilha do Sucesso com Foguete */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white">
        <style jsx>{`
          @keyframes confetti-explode-login {
            0% { 
              transform: translate(0, 0) rotate(0deg) scale(1); 
              opacity: 0; 
            }
            95.9% {
              transform: translate(0, 0) rotate(0deg) scale(1); 
              opacity: 0; 
            }
            96% { 
              transform: translate(0, 0) rotate(0deg) scale(1); 
              opacity: 1; 
            }
            99% { 
              transform: translate(var(--x), var(--y)) rotate(var(--rotate)) scale(0.3); 
              opacity: 1; 
            }
            100% { 
              transform: translate(var(--x), var(--y)) rotate(var(--rotate)) scale(0.3); 
              opacity: 0; 
            }
          }
          
          .confetti-piece {
            position: absolute;
            animation: confetti-explode-login cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
            border-radius: 2px;
          }
        `}</style>
        
        {/* Trilha Ondulada do Sucesso */}
        <svg 
          className="absolute w-full h-full" 
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.08 }} />
              <stop offset="50%" style={{ stopColor: '#10b981', stopOpacity: 0.08 }} />
              <stop offset="100%" style={{ stopColor: '#84cc16', stopOpacity: 0.08 }} />
            </linearGradient>
            
            <linearGradient id="milestoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.15 }} />
              <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.15 }} />
            </linearGradient>
          </defs>
          
          {/* Trilha principal ondulada */}
          <path 
            id="successPath"
            d="M 100 950 Q 200 900, 280 820 Q 350 750, 380 680 Q 410 610, 500 570 Q 600 530, 680 600 Q 750 660, 850 640 Q 950 620, 1020 550 Q 1090 480, 1180 520 Q 1270 560, 1340 480 Q 1410 400, 1500 380 Q 1590 360, 1660 300 Q 1730 240, 1820 150" 
            fill="none" 
            stroke="url(#pathGradient)" 
            strokeWidth="120" 
            strokeLinecap="round"
          />
          
          {/* Linha central pontilhada */}
          <path 
            d="M 100 950 Q 200 900, 280 820 Q 350 750, 380 680 Q 410 610, 500 570 Q 600 530, 680 600 Q 750 660, 850 640 Q 950 620, 1020 550 Q 1090 480, 1180 520 Q 1270 560, 1340 480 Q 1410 400, 1500 380 Q 1590 360, 1660 300 Q 1730 240, 1820 150" 
            fill="none" 
            stroke="url(#pathGradient)" 
            strokeWidth="4" 
            strokeLinecap="round"
            opacity="0.3"
            strokeDasharray="15,10"
          />
          
          {/* Marcos ao longo da trilha */}
          <circle cx="100" cy="950" r="18" fill="url(#milestoneGradient)" opacity="0.2">
            <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="950" r="8" fill="#3b82f6" opacity="0.3" />
          
          <circle cx="500" cy="570" r="16" fill="url(#milestoneGradient)" opacity="0.2">
            <animate attributeName="r" values="16;20;16" dur="3s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="500" cy="570" r="7" fill="#10b981" opacity="0.3" />
          
          <circle cx="1020" cy="550" r="16" fill="url(#milestoneGradient)" opacity="0.2">
            <animate attributeName="r" values="16;20;16" dur="3s" begin="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="1020" cy="550" r="7" fill="#10b981" opacity="0.3" />
          
          <circle cx="1500" cy="380" r="16" fill="url(#milestoneGradient)" opacity="0.2">
            <animate attributeName="r" values="16;20;16" dur="3s" begin="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="1500" cy="380" r="7" fill="#84cc16" opacity="0.3" />
          
          {/* Bolinha final - pulsa e brilha quando explode aos 96% */}
          <circle cx="1820" cy="150" r="22" fill="url(#milestoneGradient)">
            <animate attributeName="r" values="22;28;22" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.25;0.5;0.25" keyTimes="0;0.96;0.97;1" dur="15s" repeatCount="indefinite" />
          </circle>
          <circle cx="1820" cy="150" r="10" fill="#84cc16" opacity="0.4" />
          
          {/* Foguete percorrendo a trilha - desaparece aos 96% */}
          <g filter="drop-shadow(0 3px 8px rgba(0,0,0,0.2))">
            <g>
              <g transform="translate(-12, -12)">
                <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.5-.5 1-1.5 1-2 0-1-.5-1.5-1-2-.5-.5-1.5-1-2-1-.5 0-1.5.5-2 1z" 
                  fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" 
                  fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" 
                  fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" 
                  fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.96;1" dur="15s" repeatCount="indefinite" />
            </g>
            
            <animateMotion dur="15s" repeatCount="indefinite">
              <mpath href="#successPath"/>
            </animateMotion>
          </g>
        </svg>
        
        {/* Confetes explodindo (top: 13.9%, left: 94.8%) */}
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '4px', height: '12px', background: '#3b82f6', '--x': '-60px', '--y': '-80px', '--rotate': '420deg', animationDuration: '15s', animationDelay: '0s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '6px', height: '10px', background: '#10b981', '--x': '-80px', '--y': '-50px', '--rotate': '380deg', animationDuration: '15s', animationDelay: '0.02s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '3px', height: '14px', background: '#84cc16', '--x': '-50px', '--y': '-100px', '--rotate': '520deg', animationDuration: '15s', animationDelay: '0.05s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '5px', height: '11px', background: '#f59e0b', '--x': '0px', '--y': '-120px', '--rotate': '600deg', animationDuration: '15s', animationDelay: '0.01s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '4px', height: '13px', background: '#8b5cf6', '--x': '-10px', '--y': '-110px', '--rotate': '480deg', animationDuration: '15s', animationDelay: '0.04s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '6px', height: '9px', background: '#3b82f6', '--x': '10px', '--y': '-115px', '--rotate': '540deg', animationDuration: '15s', animationDelay: '0.07s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '5px', height: '12px', background: '#10b981', '--x': '60px', '--y': '-90px', '--rotate': '460deg', animationDuration: '15s', animationDelay: '0.03s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '3px', height: '10px', background: '#84cc16', '--x': '70px', '--y': '-60px', '--rotate': '620deg', animationDuration: '15s', animationDelay: '0.06s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '4px', height: '14px', background: '#f59e0b', '--x': '50px', '--y': '-105px', '--rotate': '390deg', animationDuration: '15s', animationDelay: '0.09s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '6px', height: '11px', background: '#8b5cf6', '--x': '90px', '--y': '-30px', '--rotate': '500deg', animationDuration: '15s', animationDelay: '0.02s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '5px', height: '13px', background: '#3b82f6', '--x': '85px', '--y': '-20px', '--rotate': '440deg', animationDuration: '15s', animationDelay: '0.05s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '4px', height: '10px', background: '#10b981', '--x': '-90px', '--y': '-40px', '--rotate': '580deg', animationDuration: '15s', animationDelay: '0.04s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '5px', height: '12px', background: '#84cc16', '--x': '-75px', '--y': '-70px', '--rotate': '360deg', animationDuration: '15s', animationDelay: '0.07s' } as React.CSSProperties}></div>
        <div className="confetti-piece" style={{ top: '13.9%', left: '94.8%', width: '3px', height: '11px', background: '#f59e0b', '--x': '-20px', '--y': '60px', '--rotate': '720deg', animationDuration: '15s', animationDelay: '0.01s' } as React.CSSProperties}></div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Logo do Sistema - GobiZi Flow */}
          <div className="flex justify-center mb-6">
            <Image
              src="/gobizi-flow-logo.png"
              alt="GobiZi Flow"
              width={200}
              height={80}
              className="object-contain"
              priority
              style={{ 
                maxWidth: '200px', 
                maxHeight: '80px', 
                width: 'auto', 
                height: 'auto'
              }}
            />
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Entrar no Sistema</CardTitle>
              <CardDescription>Digite suas credenciais para acessar o dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      title="Digite um endereço de email válido"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        title="Digite sua senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Rodapé com links para políticas */}
          <div className="relative z-10 text-center text-xs text-slate-500 space-y-2">
            <p>© 2025 GobiZi Flow. Todos os direitos reservados.</p>
            <div className="flex items-center justify-center gap-3">
              <Link 
                href="/privacy-policy" 
                className="hover:text-slate-700 underline underline-offset-2"
                target="_blank"
              >
                Política de Privacidade
              </Link>
              <span>•</span>
              <Link 
                href="/terms-of-service" 
                className="hover:text-slate-700 underline underline-offset-2"
                target="_blank"
              >
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  )
}
