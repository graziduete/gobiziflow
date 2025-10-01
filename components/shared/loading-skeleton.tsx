import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {/* Animação de raio moderna */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Raio animado */}
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <path 
              d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
              className="animate-pulse"
              style={{
                stroke: 'url(#lightning-gradient-dashboard)',
                strokeWidth: 0.5,
                fill: 'url(#lightning-gradient-dashboard)',
                filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.9))'
              }}
            />
            <defs>
              <linearGradient id="lightning-gradient-dashboard" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          {/* Círculo pulsante ao fundo */}
          <div className="absolute inset-0 -z-10 animate-ping opacity-20">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
          </div>
        </div>
        <p className="text-xl font-bold text-slate-900 mb-2">Carregando dashboard...</p>
        <p className="text-sm text-slate-500">Preparando seus dados</p>
      </div>
    </div>
  )
}

export function ProjectsLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {/* Animação de raio moderna */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Raio animado */}
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <path 
              d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
              className="animate-pulse"
              style={{
                stroke: 'url(#lightning-gradient-projects)',
                strokeWidth: 0.5,
                fill: 'url(#lightning-gradient-projects)',
                filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.9))'
              }}
            />
            <defs>
              <linearGradient id="lightning-gradient-projects" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          {/* Círculo pulsante ao fundo */}
          <div className="absolute inset-0 -z-10 animate-ping opacity-20">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
          </div>
        </div>
        <p className="text-xl font-bold text-slate-900 mb-2">Carregando projetos...</p>
        <p className="text-sm text-slate-500">Preparando seus dados</p>
      </div>
    </div>
  )
}