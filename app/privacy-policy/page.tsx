import { Metadata } from "next"
import Link from "next/link"
import { Shield, ArrowLeft, Cookie, Database, Lock, Users, FileText, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Política de Privacidade | GobiZi Flow",
  description: "Política de Privacidade do GobiZi Flow - Como coletamos, usamos e protegemos seus dados",
}

export default function PrivacyPolicyPage() {
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Política de Privacidade</h1>
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
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">Olá! 👋</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Queremos ser transparentes sobre como cuidamos dos seus dados no <strong>GobiZi Flow</strong>. 
              Esta política está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</strong>.
            </p>
          </section>

          {/* Dados Coletados */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">1. Quais dados coletamos?</h2>
            </div>
            <div className="space-y-4 text-slate-600">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Dados de cadastro:</h3>
                <p className="text-sm">Nome, e-mail, cargo, empresa e perfil de acesso.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Dados de uso:</h3>
                <p className="text-sm">Projetos, tarefas, documentos, comentários e atividades na plataforma.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Dados técnicos:</h3>
                <p className="text-sm">Endereço IP, navegador, data e hora de acesso para garantir a segurança.</p>
              </div>
            </div>
          </section>

          {/* Como Usamos */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">2. Como usamos seus dados?</h2>
            </div>
            <div className="text-slate-600 space-y-2">
              <p>Usamos seus dados para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Fornecer e melhorar a plataforma</li>
                <li>Garantir a segurança e prevenir fraudes</li>
                <li>Enviar notificações importantes sobre seus projetos</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </div>
          </section>

          {/* Compartilhamento */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">3. Compartilhamos seus dados?</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p className="font-semibold text-slate-700">
                NÃO vendemos seus dados. Nunca.
              </p>
              <p className="text-sm">Compartilhamos apenas quando necessário:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Com administradores da sua empresa (para gestão de projetos)</li>
                <li>Com nossos provedores de infraestrutura (Supabase e Vercel)</li>
                <li>Quando exigido por lei</li>
              </ul>
              <p className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                <strong>🔒 Isolamento de Dados:</strong> Garantimos que cada empresa tenha acesso apenas 
                aos seus próprios dados. Suas informações estão isoladas e protegidas por múltiplas camadas 
                de segurança.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Cookie className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">4. Sobre Cookies</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p className="text-sm">
                Usamos apenas <strong>cookies essenciais</strong> para autenticação e segurança. 
                Eles são necessários para o funcionamento da plataforma e não rastreiam seu comportamento.
              </p>
            </div>
          </section>

          {/* Direitos LGPD */}
          <section className="bg-gradient-to-br from-blue-50 to-emerald-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">5. Seus Direitos (LGPD)</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p className="text-sm">Você pode solicitar a qualquer momento:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li><strong>Confirmação e acesso:</strong> Saber quais dados temos sobre você</li>
                <li><strong>Correção:</strong> Atualizar dados incorretos</li>
                <li><strong>Exclusão:</strong> Deletar seus dados (quando aplicável)</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Retirar consentimento</li>
              </ul>
              <p className="mt-4 font-medium text-sm">
                Para exercer seus direitos, entre em contato através do e-mail abaixo.
              </p>
            </div>
          </section>

          {/* Retenção */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">6. Por quanto tempo guardamos seus dados?</h2>
            </div>
            <div className="text-slate-600">
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Dados de conta: Enquanto sua conta estiver ativa</li>
                <li>Dados de projetos: Conforme definido pela sua empresa</li>
                <li>Logs de segurança: 12 meses</li>
                <li>Dados fiscais: 5 anos (obrigação legal)</li>
              </ul>
            </div>
          </section>

          {/* Segurança */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">7. Como protegemos seus dados?</h2>
            </div>
            <div className="text-slate-600">
              <p className="text-sm mb-3">Implementamos medidas de segurança robustas:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Criptografia em todas as comunicações</li>
                <li>Armazenamento seguro de senhas</li>
                <li>Controle rigoroso de acesso aos dados</li>
                <li>Monitoramento contínuo de atividades suspeitas</li>
                <li>Backups automáticos e redundância</li>
                <li>Atualizações regulares de segurança</li>
              </ul>
            </div>
          </section>

          {/* Alterações */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">8. Alterações nesta Política</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Podemos atualizar esta política periodicamente. Mudanças importantes serão comunicadas 
              por e-mail ou através de um aviso na plataforma.
            </p>
          </section>

          {/* Contato */}
          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">9. Entre em Contato</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p className="text-sm">Dúvidas sobre privacidade ou quer exercer seus direitos?</p>
              <div className="space-y-2 mt-4 text-sm">
                <p><strong>📧 E-mail:</strong> privacidade@gobiziflow.com</p>
                <p><strong>🛡️ Encarregado de Dados (DPO):</strong> dpo@gobiziflow.com</p>
              </div>
              <p className="mt-4 text-xs">
                <strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong>{" "}
                <a 
                  href="https://www.gov.br/anpd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  www.gov.br/anpd
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t text-center">
            <p className="text-xs text-slate-500">
              Esta política está em conformidade com a{" "}
              <strong>Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</strong>
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
