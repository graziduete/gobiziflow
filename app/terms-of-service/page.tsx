import { Metadata } from "next"
import Link from "next/link"
import { FileCheck, ArrowLeft, CheckCircle, XCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Termos de Uso | GobiZi Flow",
  description: "Termos de Uso do GobiZi Flow - Regras e condições para uso da plataforma",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Termos de Uso</h1>
              <p className="text-sm text-slate-500">Última atualização: 12 de novembro de 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border p-8 space-y-8">
          
          {/* Introdução */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">Bem-vindo! 🚀</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Estes termos estabelecem as regras para uso do <strong>GobiZi Flow</strong>. 
              Ao usar a plataforma, você concorda com estes termos.
            </p>
          </section>

          {/* Aceite */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">1. Aceite dos Termos</h2>
            </div>
            <div className="text-slate-600 text-sm">
              <p>Ao usar o GobiZi Flow, você confirma que:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Tem mais de 18 anos</li>
                <li>Tem autorização da sua empresa</li>
                <li>Concorda com estes termos e nossa Política de Privacidade</li>
              </ul>
            </div>
          </section>

          {/* Descrição do Serviço */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">2. O que é o GobiZi Flow?</h2>
            </div>
            <div className="text-slate-600 text-sm">
              <p>Plataforma para gestão de projetos, incluindo:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Projetos e cronogramas</li>
                <li>Tarefas e dependências</li>
                <li>Gráficos Gantt</li>
                <li>Documentos e colaboração</li>
              </ul>
            </div>
          </section>

          {/* Conta e Segurança */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">3. Sua Conta</h2>
            </div>
            <div className="text-slate-600 text-sm space-y-3">
              <div>
                <p className="font-semibold text-slate-700 mb-1">Criação:</p>
                <p>Contas são criadas pelo administrador da sua empresa. Você deve fornecer informações verdadeiras.</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-700 mb-1">Segurança:</p>
                <p>Você é responsável por manter sua senha segura. Não compartilhe suas credenciais.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Suspensão:</p>
                <p>Podemos suspender sua conta em caso de violação destes termos ou atividades fraudulentas.</p>
              </div>
            </div>
          </section>

          {/* Uso Permitido */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-800">4. Uso Permitido ✅</h2>
            </div>
            <div className="text-slate-600 text-sm">
              <p>Você pode usar a plataforma para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-emerald-700">
                <li>Gerenciar projetos e tarefas da sua empresa</li>
                <li>Colaborar com sua equipe</li>
                <li>Armazenar documentos relacionados aos projetos</li>
                <li>Gerar relatórios e análises</li>
              </ul>
            </div>
          </section>

          {/* Uso Proibido */}
          <section className="bg-red-50 p-6 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-slate-800">5. Uso Proibido ❌</h2>
            </div>
            <div className="text-slate-600 text-sm">
              <p className="mb-2">Você NÃO pode:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-red-700">
                <li>Violar leis ou direitos de terceiros</li>
                <li>Tentar acessar dados de outras empresas</li>
                <li>Enviar vírus ou código malicioso</li>
                <li>Fazer scraping ou extração automatizada</li>
                <li>Sobrecarregar a infraestrutura</li>
                <li>Revender ou redistribuir o serviço</li>
                <li>Armazenar conteúdo ilegal ou ofensivo</li>
              </ul>
            </div>
          </section>

          {/* Propriedade */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">6. Propriedade e Dados</h2>
            </div>
            <div className="text-slate-600 text-sm space-y-2">
              <p><strong>Nossa propriedade:</strong> O código, design e marca do GobiZi Flow são protegidos por leis de propriedade intelectual.</p>
              <p><strong>Seus dados:</strong> Você mantém todos os direitos sobre seus dados (projetos, tarefas, documentos).</p>
            </div>
          </section>

          {/* Disponibilidade */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">7. Disponibilidade</h2>
            </div>
            <p className="text-slate-600 text-sm">
              Nos esforçamos para manter a plataforma disponível 24/7, mas podem ocorrer manutenções programadas 
              ou indisponibilidades temporárias. Não garantimos disponibilidade ininterrupta.
            </p>
          </section>

          {/* Limitação de Responsabilidade */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">8. Limitação de Responsabilidade</h2>
            </div>
            <div className="text-slate-600 text-sm">
              <p>Na extensão máxima permitida por lei:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Não nos responsabilizamos por perda de dados causada por uso inadequado</li>
                <li>Não garantimos que o serviço atenderá todas as suas necessidades específicas</li>
                <li>Nossa responsabilidade é limitada ao valor pago pela sua empresa nos últimos 12 meses</li>
              </ul>
            </div>
          </section>

          {/* Modificações */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">9. Modificações dos Termos</h2>
            </div>
            <p className="text-slate-600 text-sm">
              Podemos atualizar estes termos periodicamente. Mudanças importantes serão comunicadas por e-mail. 
              O uso continuado após as alterações constitui aceitação.
            </p>
          </section>

          {/* Lei Aplicável */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">10. Lei Aplicável</h2>
            </div>
            <p className="text-slate-600 text-sm">
              Estes termos são regidos pelas leis da República Federativa do Brasil.
            </p>
          </section>

          {/* Contato */}
          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">11. Dúvidas?</h2>
            </div>
            <div className="text-slate-600 text-sm">
              <p className="mb-3">Entre em contato:</p>
              <p><strong>📧 E-mail:</strong> projetos@gobi.consulting</p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t text-center">
            <p className="text-xs text-slate-500">
              Ao usar o GobiZi Flow, você concorda com estes Termos de Uso e nossa Política de Privacidade.
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link href="/auth/login">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
