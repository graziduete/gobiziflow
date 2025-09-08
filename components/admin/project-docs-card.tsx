"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ProjectDocsService, ProjectDocument } from "@/lib/services/project-docs.service"

interface ProjectDocsCardProps {
  projectId: string
  userId: string
}

export function ProjectDocsCard({ projectId, userId }: ProjectDocsCardProps) {
  const [docs, setDocs] = useState<ProjectDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<ProjectDocument | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const list = await ProjectDocsService.list(projectId)
      setDocs(list)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [projectId])

  const handleUpload = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const files = evt.target.files
    if (!files || files.length === 0) return
    setIsLoading(true)
    try {
      for (const file of Array.from(files)) {
        await ProjectDocsService.upload(projectId, file, userId)
      }
      await load()
    } finally {
      setIsLoading(false)
      evt.target.value = ""
    }
  }

  const handleDownload = async (doc: ProjectDocument) => {
    const url = await ProjectDocsService.getSignedUrl(doc.storage_path)
    window.open(url, "_blank")
  }

  const confirmDelete = async () => {
    if (!docToDelete) return
    setIsLoading(true)
    try {
      await ProjectDocsService.remove(docToDelete)
      await load()
    } finally {
      setIsLoading(false)
      setDeleteOpen(false)
      setDocToDelete(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documentos do Projeto</CardTitle>
          <div>
            <Button asChild variant="outline">
              <label className="cursor-pointer">
                Enviar arquivos
                <input type="file" className="hidden" multiple onChange={handleUpload} />
              </label>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {(!isLoading && docs.length === 0) && (
          <p className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</p>
        )}
        <div className="divide-y">
          {docs.map((d) => (
            <div key={d.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{d.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(d.uploaded_at).toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDownload(d)}>Baixar</Button>
                <Button size="sm" variant="destructive" onClick={() => { setDocToDelete(d); setDeleteOpen(true); }}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Dialog de confirmação */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{docToDelete?.file_name}"? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

