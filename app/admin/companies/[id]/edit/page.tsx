import { createClient } from "@/lib/supabase/server"
import { CompanyForm } from "@/components/admin/company-form"
import { notFound } from "next/navigation"

interface EditCompanyPageProps {
  params: {
    id: string
  }
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const supabase = await createClient()

  const { data: company } = await supabase.from("companies").select("*").eq("id", params.id).single()

  if (!company) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Editar Empresa</h2>
        <p className="text-muted-foreground">Atualize as informações da empresa</p>
      </div>

      <div className="flex justify-center">
        <CompanyForm company={company} />
      </div>
    </div>
  )
}
