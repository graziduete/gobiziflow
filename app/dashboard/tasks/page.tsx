export default function ClientTasksPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Ícone */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-500 rounded-lg flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>
        
        {/* Texto */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Em Breve</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Estamos trabalhando em funcionalidades incríveis para gerenciar suas tarefas. 
            Em breve você terá acesso a uma experiência completa de gestão de tarefas.
          </p>
        </div>
      </div>
    </div>
  )
}
