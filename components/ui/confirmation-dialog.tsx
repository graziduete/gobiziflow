"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Trash2, UserX, Building2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
  icon?: React.ReactNode
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  icon,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          iconBg: "bg-gradient-to-br from-red-500 to-pink-600",
          iconColor: "text-white",
          confirmButton: "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg",
          borderColor: "border-red-200/50",
        }
      case "warning":
        return {
          iconBg: "bg-gradient-to-br from-orange-500 to-yellow-600",
          iconColor: "text-white",
          confirmButton: "bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white shadow-md hover:shadow-lg",
          borderColor: "border-orange-200/50",
        }
      default:
        return {
          iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
          iconColor: "text-white",
          confirmButton: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg",
          borderColor: "border-blue-200/50",
        }
    }
  }

  const getDefaultIcon = () => {
    switch (variant) {
      case "destructive":
        return <Trash2 className="h-6 w-6" />
      case "warning":
        return <AlertTriangle className="h-6 w-6" />
      default:
        return <CheckCircle className="h-6 w-6" />
    }
  }

  const styles = getVariantStyles()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] rounded-2xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl shadow-lg", styles.iconBg)}>
              {icon || getDefaultIcon()}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base text-slate-600 leading-relaxed pl-16">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200 px-6"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className={cn("px-6 transition-all duration-200", styles.confirmButton)}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook personalizado para facilitar o uso
export function useConfirmation() {
  const [open, setOpen] = React.useState(false)
  const [config, setConfig] = React.useState<{
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive" | "warning"
    icon?: React.ReactNode
    onConfirm: () => void
    onCancel?: () => void
  }>()

  const confirm = React.useCallback((options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive" | "warning"
    icon?: React.ReactNode
    onConfirm: () => void
    onCancel?: () => void
  }) => {
    setConfig(options)
    setOpen(true)
  }, [])

  const ConfirmationModal = React.useCallback(() => {
    if (!config) return null

    return (
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        {...config}
      />
    )
  }, [open, config])

  return { confirm, ConfirmationModal }
}