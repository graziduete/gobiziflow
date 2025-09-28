"use client"

import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  isLoading = false
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Processando..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook para facilitar o uso
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    title: string
    description: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
  } | null>(null)

  const showConfirmation = (config: {
    title: string
    description: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
  }) => {
    setConfig(config)
    setIsOpen(true)
  }

  const hideConfirmation = () => {
    setIsOpen(false)
    setConfig(null)
  }

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: config ? (
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={hideConfirmation}
        onConfirm={config.onConfirm}
        title={config.title}
        description={config.description}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        variant={config.variant}
      />
    ) : null
  }
}