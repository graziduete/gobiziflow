import React from 'react';

interface ModernLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  color?: 'blue' | 'green' | 'red' | 'purple';
}

export function ModernLoading({ 
  size = 'md', 
  text = "Carregando...", 
  color = 'blue' 
}: ModernLoadingProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  };

  const colorGradients = {
    blue: {
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
      shadow: 'rgba(6, 182, 212, 0.8)',
      gradientId: 'lightning-gradient-blue'
    },
    green: {
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      shadow: 'rgba(16, 185, 129, 0.8)',
      gradientId: 'lightning-gradient-green'
    },
    red: {
      gradient: 'from-red-500 via-rose-500 to-pink-500',
      shadow: 'rgba(239, 68, 68, 0.8)',
      gradientId: 'lightning-gradient-red'
    },
    purple: {
      gradient: 'from-purple-500 via-violet-500 to-indigo-500',
      shadow: 'rgba(139, 92, 246, 0.8)',
      gradientId: 'lightning-gradient-purple'
    }
  };

  const currentColor = colorGradients[color];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animação de raio moderna */}
      <div className={`relative ${sizeClasses[size]} mx-auto`}>
        {/* Raio animado */}
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
          <path 
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
            className="animate-pulse"
            style={{
              stroke: `url(#${currentColor.gradientId})`,
              strokeWidth: 0.5,
              fill: `url(#${currentColor.gradientId})`,
              filter: `drop-shadow(0 0 8px ${currentColor.shadow})`
            }}
          />
          <defs>
            <linearGradient id={currentColor.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color === 'blue' ? '#06b6d4' : color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : '#8b5cf6'} />
              <stop offset="50%" stopColor={color === 'blue' ? '#3b82f6' : color === 'green' ? '#22c55e' : color === 'red' ? '#f43f5e' : '#7c3aed'} />
              <stop offset="100%" stopColor={color === 'blue' ? '#6366f1' : color === 'green' ? '#14b8a6' : color === 'red' ? '#ec4899' : '#6366f1'} />
            </linearGradient>
          </defs>
        </svg>
        {/* Círculo pulsante ao fundo */}
        <div className="absolute inset-0 -z-10 animate-ping opacity-20">
          <div className={`w-full h-full rounded-full bg-gradient-to-r ${currentColor.gradient}`}></div>
        </div>
      </div>
      
      {/* Texto */}
      <div className="text-center">
        <p className="text-slate-600 font-medium">{text}</p>
      </div>
    </div>
  );
}

