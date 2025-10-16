'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DelayJustificationModal } from '@/components/admin/delay-justification-modal'

export function TestDelayModal() {
  const [isOpen, setIsOpen] = useState(false)

  const testTask = {
    id: 'test-task-123',
    name: 'Tarefa de Teste',
    end_date: '2025-01-10'
  }

  const handleSuccess = () => {
    console.log('✅ Justificativa salva com sucesso!')
    setIsOpen(false)
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Teste do Modal de Justificativa</h2>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal de Justificativa
      </Button>
      
      <DelayJustificationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        task={testTask}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
