'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DelayJustificationModalProps {
  isOpen: boolean
  onClose: () => void
  task: {
    id: string
    name: string
    end_date: string
  }
  onSuccess: () => void
}

export function DelayJustificationModal({ isOpen, onClose, task, onSuccess }: DelayJustificationModalProps) {
  const [justification, setJustification] = useState('')
  const [actualEndDate, setActualEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preencher data real com data atual quando modal abrir
  useEffect(() => {
    if (isOpen) {
      // Usar data local para evitar problemas de timezone
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      setActualEndDate(`${year}-${month}-${day}`)
      setJustification('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    // Validações
    if (!justification.trim()) {
      setError('A justificativa é obrigatória')
      return
    }

    if (!actualEndDate) {
      setError('A data real de conclusão é obrigatória')
      return
    }

    if (actualEndDate <= task.end_date) {
      setError('A data real deve ser posterior à data planejada')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Atualizar a task com os dados de atraso
      console.log('🔍 [DelayModal] Salvando dados:', {
        taskId: task.id,
        justification: justification.trim(),
        originalEndDate: task.end_date,
        actualEndDate: actualEndDate,
        userId: user.id
      })


      // Verificar se a task existe no banco primeiro
      const { data: existingTask, error: checkError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', task.id)
        .single()

      let updateData, updateError

      if (existingTask) {
        // Task existe - fazer UPDATE
        console.log('🔍 [DelayModal] Task existe no banco, fazendo UPDATE')
        const result = await supabase
          .from('tasks')
          .update({
            status: 'completed_delayed',
            delay_justification: justification.trim(),
            original_end_date: task.end_date,
            actual_end_date: actualEndDate,
            delay_created_at: new Date().toISOString(),
            delay_created_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
          .select('*')
        
        updateData = result.data
        updateError = result.error
      } else {
        // Task não existe - mas só pode fazer INSERT se tiver project_id
        if (!task.project_id) {
          throw new Error('Task não possui project_id. Salve o projeto primeiro antes de adicionar justificativa.')
        }
        
        console.log('🔍 [DelayModal] Task não existe no banco, fazendo INSERT')
        const result = await supabase
          .from('tasks')
          .insert({
            id: task.id,
            name: task.name,
            description: task.description,
            start_date: task.start_date,
            end_date: task.end_date,
            status: 'completed_delayed',
            responsible: task.responsible,
            project_id: task.project_id,
            created_by: user.id,
            delay_justification: justification.trim(),
            original_end_date: task.end_date,
            actual_end_date: actualEndDate,
            delay_created_at: new Date().toISOString(),
            delay_created_by: user.id
          })
          .select('*')
        
        updateData = result.data
        updateError = result.error
      }

      console.log('🔍 [DelayModal] Resultado da atualização:', { updateData, updateError })

      if (updateError) {
        console.error('❌ [DelayModal] Erro na atualização:', updateError)
        throw updateError
      }

      console.log('✅ [DelayModal] Dados salvos com sucesso!')
      console.log('🔍 [DelayModal] Dados retornados:', updateData)
      
      // Verificar se realmente foi atualizado
      if (updateData && updateData.length > 0) {
        console.log('✅ [DelayModal] Tarefa atualizada:', updateData[0])
      } else {
        console.error('❌ [DelayModal] Nenhum dado retornado na atualização!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar justificativa:', error)
      setError(error.message || 'Erro ao salvar justificativa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setJustification('')
    setActualEndDate('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-5 h-5" />
            Justificar Atraso na Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da tarefa */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{task.name}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Data planejada: {task.end_date}</span>
              </div>
            </div>
          </div>

          {/* Data planejada (desabilitada) */}
          <div className="space-y-2">
            <Label htmlFor="original_end_date" className="text-sm font-medium">
              Data de Fim Planejada (Original)
            </Label>
            <Input
              id="original_end_date"
              type="date"
              value={task.end_date}
              disabled
              className="bg-gray-100 text-gray-500"
            />
          </div>

          {/* Data real de conclusão */}
          <div className="space-y-2">
            <Label htmlFor="actual_end_date" className="text-sm font-medium">
              Data Real de Conclusão *
            </Label>
            <Input
              id="actual_end_date"
              type="date"
              value={actualEndDate}
              onChange={(e) => setActualEndDate(e.target.value)}
              min={task.end_date}
              required
              className={error && !actualEndDate ? 'border-red-500' : ''}
            />
            {error && !actualEndDate && (
              <p className="text-sm text-red-600">Data real é obrigatória</p>
            )}
          </div>

          {/* Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="justification" className="text-sm font-medium">
              Justificativa do Atraso *
            </Label>
            <Textarea
              id="justification"
              placeholder="Descreva o motivo do atraso na conclusão desta tarefa..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              required
              className={error && !justification.trim() ? 'border-red-500' : ''}
            />
            {error && !justification.trim() && (
              <p className="text-sm text-red-600">Justificativa é obrigatória</p>
            )}
          </div>

          {/* Mensagem de erro geral */}
          {error && (justification.trim() || actualEndDate) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Aviso */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-orange-800 font-medium">
                  Registro de Atraso
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Esta informação será registrada permanentemente e ficará visível para todos os usuários com acesso à tarefa.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !justification.trim() || !actualEndDate}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Salvando...' : 'Registrar Atraso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
