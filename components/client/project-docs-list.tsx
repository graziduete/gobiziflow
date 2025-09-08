"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ProjectDocsService } from "@/lib/services/project-docs.service"
import { Download, FileArchive, FileImage, FileQuestion, FileSpreadsheet, FileText, Loader2, Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ProjectDocsListProps {
  projectId: string
}

interface ProjectDocument {
  id: string
  project_id: string
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  uploaded_by: string
  uploaded_at: string
  description: string | null
  profiles: {
    full_name: string | null
  } | null
}

export function ProjectDocsList({ projectId }: ProjectDocsListProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const docs = await ProjectDocsService.list(projectId)
      setDocuments(docs)
    } catch {
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDownload = async (doc: ProjectDocument) => {
    try {
      const url = await ProjectDocsService.getSignedUrl(doc.storage_path)
      if (url) window.open(url, "_blank")
      else throw new Error("Link de download indisponível")
    } catch (err: any) {
      toast({
        title: "Erro ao baixar",
        description: err?.message || "Não foi possível gerar o link do arquivo.",
        variant: "destructive",
      })
    }
  }

  const handleView = async (doc: ProjectDocument) => {
    try {
      const url = await ProjectDocsService.getSignedUrl(doc.storage_path)
      if (url) window.open(url, "_blank")
      else throw new Error("Link de visualização indisponível")
    } catch (err: any) {
      toast({
        title: "Erro ao visualizar",
        description: err?.message || "Não foi possível abrir o arquivo.",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("image")) return <FileImage className="w-5 h-5 text-blue-500" />
    if (fileType?.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />
    if (fileType?.includes("spreadsheet") || fileType?.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-green-500" />
    if (fileType?.includes("document") || fileType?.includes("word")) return <FileText className="w-5 h-5 text-purple-500" />
    if (fileType?.includes("zip") || fileType?.includes("rar")) return <FileArchive className="w-5 h-5 text-gray-500" />
    return <FileQuestion className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number | null) => {
    if (bytes === 0) return "0 Bytes"
    if (bytes === null || bytes === undefined) return "—"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos do Projeto</CardTitle>
        <CardDescription>Visualize e baixe os arquivos anexados a este projeto.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Carregando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum documento disponível.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(doc.file_type || '')}
                  <div>
                    <p className="font-medium text-gray-800">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(doc.uploaded_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      <span className="mx-1">•</span>
                      {formatFileSize(doc.file_size)}
                      {doc.profiles?.full_name && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Por: {doc.profiles.full_name}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                    <Eye className="w-4 h-4 mr-2" /> Visualizar
                  </Button>
                  <Button variant="default" size="sm" onClick={() => handleDownload(doc)}>
                    <Download className="w-4 h-4 mr-2" /> Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

