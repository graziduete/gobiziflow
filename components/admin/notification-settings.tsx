"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Settings = {
  notify_project_created: boolean
  notify_status_changed: boolean
}

export function NotificationSettings() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('settings')
        .select('notify_project_created, notify_status_changed')
        .eq('id', 1)
        .single()
      if (data) setSettings(data as Settings)
    }
    load()
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    await supabase
      .from('settings')
      .update({
        notify_project_created: settings.notify_project_created,
        notify_status_changed: settings.notify_status_changed,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
    setSaving(false)
  }

  if (!settings) return <div>Carregando configurações...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
        <CardDescription>Controla as notificações exibidas no sino (in-app)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_project_created">Notificação de Projeto Criado</Label>
              <p className="text-sm text-muted-foreground">Gerar notificação quando um projeto for criado</p>
            </div>
            <Switch
              id="notify_project_created"
              checked={!!settings.notify_project_created}
              onCheckedChange={(checked) => setSettings((prev) => prev ? { ...prev, notify_project_created: checked } : prev)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_status_changed">Notificação de Mudança de Status</Label>
              <p className="text-sm text-muted-foreground">Gerar notificação quando o status de um projeto mudar</p>
            </div>
            <Switch
              id="notify_status_changed"
              checked={!!settings.notify_status_changed}
              onCheckedChange={(checked) => setSettings((prev) => prev ? { ...prev, notify_status_changed: checked } : prev)}
            />
          </div>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  )
}
