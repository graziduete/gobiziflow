import { CompanyForm } from "@/components/admin/company-form"

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nova Empresa</h2>
        <p className="text-muted-foreground">Cadastre uma nova empresa no sistema</p>
      </div>

      <div className="w-full">
        <CompanyForm />
      </div>
    </div>
  )
}
