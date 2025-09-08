"use client"

import { createClient } from "@/lib/supabase/client"

export interface ProjectDocument {
  id: string
  project_id: string
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  uploaded_by: string
  uploaded_at: string
  description?: string | null
}

export class ProjectDocsService {
  private static supabase = createClient()
  private static readonly bucket = "project-documents"

  static async list(projectId: string): Promise<ProjectDocument[]> {
    const { data, error } = await this.supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false })

    if (error) throw error
    return (data as ProjectDocument[]) || []
  }

  static async getSignedUrl(storagePath: string, expiresIn = 60 * 60) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, expiresIn)
    if (error) throw error
    return data.signedUrl
  }

  static async upload(projectId: string, file: File, userId: string) {
    const safeName = file.name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${projectId}/${crypto.randomUUID()}-${safeName}`
    const { error: upErr } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined })
    if (upErr) throw upErr

    const { error: insErr, data } = await this.supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type || null,
        file_size: file.size,
        storage_path: key,
        uploaded_by: userId,
      })
      .select("*")
      .single()
    if (insErr) throw insErr
    return data as ProjectDocument
  }

  static async remove(doc: ProjectDocument) {
    const { error: delObjErr } = await this.supabase.storage
      .from(this.bucket)
      .remove([doc.storage_path])
    if (delObjErr) throw delObjErr

    const { error: delRowErr } = await this.supabase
      .from("project_documents")
      .delete()
      .eq("id", doc.id)
    if (delRowErr) throw delRowErr
  }
}

