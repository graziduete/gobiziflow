"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, AlertTriangle } from "lucide-react"

interface DelayJustificationCompleteModalProps {
  isOpen: boolean
  taskName: string
  plannedEndDate: string
  actualEndDate: string
  delayDays: number
  onConfirm: (justification: string) => void
  onCancel: () => void
}

export function DelayJustificationCompleteModal({
  isOpen,
  taskName,
  plannedEndDate,
  actualEndDate,
  delayDays,
  onConfirm,
  onCancel
}: DelayJustificationCompleteModalProps) {
  const [justification, setJustification] = useState("")

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!justification.trim()) {
      alert("Por favor, preencha a justificativa do atraso.")
      return
    }
    onConfirm(justification)
    setJustification("") // Limpar após confirmar
  }

  const handleCancel = () => {
    setJustification("")
    onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl transform scale-100 transition-transform duration-300 animate-in fade-in zoom-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-full">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tarefa Concluída com Atraso
          </h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-700">
            A tarefa <span className="font-semibold">"{taskName}"</span> foi concluída com atraso.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Data Fim Planejada:</p>
                <p className="font-semibold text-gray-900">
                  {new Date(plannedEndDate + 'T12:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Data Fim Real:</p>
                <p className="font-semibold text-orange-600">
                  {new Date(actualEndDate + 'T12:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-orange-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <p className="font-bold text-orange-600">
                  Atraso: +{delayDays} {delayDays === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delay_justification" className="text-sm font-medium text-gray-900">
              Justificativa do Atraso <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="delay_justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique o motivo do atraso desta tarefa..."
              className="min-h-[100px] border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Esta justificativa será salva junto com o registro de atraso.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">ℹ️ O que acontecerá:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Status será alterado para "Concluído com Atraso"</li>
              <li>Justificativa será registrada</li>
              <li>Data e responsável serão salvos automaticamente</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="px-6 py-2 border-gray-300 hover:border-gray-400"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium"
          >
            Confirmar e Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}

