"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Prefs = {
  project_created: boolean
  status_changed: boolean
  due_reminder: boolean
}

export function ClientNotificationSettings() {
  const supabase = createClient()
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_notification_prefs')
        .select('project_created, status_changed, due_reminder')
        .eq('user_id', user.id)
        .single()
      if (data) setPrefs(data as Prefs)
      else setPrefs({ project_created: true, status_changed: true, due_reminder: true })
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !prefs) return
    // upsert preference
    await supabase
      .from('user_notification_prefs')
      .upsert({
        user_id: user.id,
        project_created: prefs.project_created,
        status_changed: prefs.status_changed,
        due_reminder: prefs.due_reminder,
        updated_at: new Date().toISOString()
      })
    setSaving(false)
  }

  if (!prefs) return <div>Carregando configurações...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
        <CardDescription>Gerencie quando você deseja receber notificações</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="project_created">Projeto Criado</Label>
            <p className="text-sm text-muted-foreground">Quando um novo projeto for criado para sua empresa</p>
          </div>
          <Switch id="project_created" checked={prefs.project_created} onCheckedChange={(v) => setPrefs({ ...prefs, project_created: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="status_changed">Mudança de Status</Label>
            <p className="text-sm text-muted-foreground">Quando o status de projetos for alterado</p>
          </div>
          <Switch id="status_changed" checked={prefs.status_changed} onCheckedChange={(v) => setPrefs({ ...prefs, status_changed: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="due_reminder">Lembrete de Prazo</Label>
            <p className="text-sm text-muted-foreground">Lembretes de tarefas próximas do vencimento</p>
          </div>
          <Switch id="due_reminder" checked={prefs.due_reminder} onCheckedChange={(v) => setPrefs({ ...prefs, due_reminder: v })} />
        </div>

        <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Configurações'}</Button>
      </CardContent>
    </Card>
  )
}

