import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Verifique seu Email</CardTitle>
              <CardDescription>
                Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/auth/login">Voltar ao Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
