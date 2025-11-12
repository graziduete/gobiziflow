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
              <h2 className="text-xl font-semibold text-slate-800">Introdução</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Olá! 👋 Bem-vindo à Política de Privacidade do <strong>GobiZi Flow</strong>. 
              Nós levamos sua privacidade muito a sério e queremos que você entenda exatamente 
              como coletamos, usamos e protegemos seus dados. Esta política está em conformidade 
              com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</strong>.
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
                <h3 className="font-semibold text-slate-700 mb-2">📧 Dados de Cadastro:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nome completo</li>
                  <li>E-mail corporativo</li>
                  <li>Cargo e função</li>
                  <li>Empresa/Organização</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">📊 Dados de Uso da Plataforma:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Projetos criados e gerenciados</li>
                  <li>Tarefas e cronogramas</li>
                  <li>Documentos e arquivos enviados</li>
                  <li>Comentários e justificativas</li>
                  <li>Logs de acesso e atividades</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">🔐 Dados Técnicos:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Endereço IP</li>
                  <li>Tipo de navegador e dispositivo</li>
                  <li>Data e hora de acesso</li>
                  <li>Cookies e tokens de sessão</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Como Usamos */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">2. Como usamos seus dados?</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Usamos seus dados exclusivamente para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Fornecer o serviço:</strong> Autenticação, gestão de projetos, cronogramas e documentos</li>
                <li><strong>Melhorar a plataforma:</strong> Análise de uso para identificar melhorias e bugs</li>
                <li><strong>Comunicação:</strong> Notificações sobre projetos, atualizações e suporte técnico</li>
                <li><strong>Segurança:</strong> Prevenção de fraudes, acessos não autorizados e proteção de dados</li>
                <li><strong>Conformidade legal:</strong> Cumprimento de obrigações legais e regulatórias</li>
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
              <p>
                <strong>NÃO vendemos seus dados</strong> para terceiros. Compartilhamos apenas quando estritamente necessário:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Com sua empresa:</strong> Administradores da sua organização podem acessar dados de projetos da empresa</li>
                <li><strong>Provedores de infraestrutura:</strong> Supabase (banco de dados e autenticação) e Vercel (hospedagem)</li>
                <li><strong>Por obrigação legal:</strong> Quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
              <h2 className="text-xl font-semibold text-slate-800">4. Cookies e Tecnologias Similares</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Utilizamos cookies para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cookies Essenciais:</strong> Autenticação e funcionamento básico da plataforma</li>
                <li><strong>Cookies de Desempenho:</strong> Análise de uso e identificação de problemas técnicos</li>
                <li><strong>Cookies de Preferências:</strong> Lembrar suas configurações (tema, idioma, etc.)</li>
              </ul>
              <p className="mt-4">
                Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
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
              <p>Você tem os seguintes direitos sobre seus dados pessoais:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>✅ <strong>Confirmação e Acesso:</strong> Saber se processamos seus dados e solicitar cópia</li>
                <li>✅ <strong>Correção:</strong> Atualizar dados incompletos, incorretos ou desatualizados</li>
                <li>✅ <strong>Anonimização ou Exclusão:</strong> Solicitar remoção de dados desnecessários</li>
                <li>✅ <strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li>✅ <strong>Eliminação:</strong> Excluir dados tratados com seu consentimento</li>
                <li>✅ <strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
                <li>✅ <strong>Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
              </ul>
              <p className="mt-4 font-medium">
                Para exercer seus direitos, entre em contato conosco através do e-mail abaixo.
              </p>
            </div>
          </section>

          {/* Retenção */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">6. Por quanto tempo guardamos seus dados?</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Dados de conta:</strong> Enquanto sua conta estiver ativa</li>
                <li><strong>Dados de projetos:</strong> Conforme definido pelo administrador da empresa</li>
                <li><strong>Logs de acesso:</strong> 12 meses (fins de segurança)</li>
                <li><strong>Dados fiscais:</strong> 5 anos (obrigação legal)</li>
              </ul>
              <p className="mt-4">
                Após o período de retenção, os dados são anonimizados ou excluídos de forma segura.
              </p>
            </div>
          </section>

          {/* Segurança */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">7. Como protegemos seus dados?</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Implementamos medidas de segurança robustas:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>🔐 Criptografia SSL/TLS em todas as comunicações</li>
                <li>🔐 Senhas com hash e salt (bcrypt)</li>
                <li>🔐 Row Level Security (RLS) no banco de dados</li>
                <li>🔐 Autenticação de múltiplos fatores (quando disponível)</li>
                <li>🔐 Monitoramento e logs de acesso</li>
                <li>🔐 Backups automáticos e redundância</li>
              </ul>
            </div>
          </section>

          {/* Alterações */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">8. Alterações nesta Política</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Podemos atualizar esta política periodicamente. Quando houver mudanças significativas, 
              notificaremos você por e-mail ou através de um aviso na plataforma. A data da última 
              atualização está sempre indicada no topo desta página.
            </p>
          </section>

          {/* Contato */}
          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">9. Entre em Contato</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>
                Dúvidas sobre esta política ou quer exercer seus direitos? Entre em contato:
              </p>
              <div className="space-y-2 mt-4">
                <p><strong>📧 E-mail:</strong> privacidade@gobiziflow.com</p>
                <p><strong>📍 Controlador de Dados:</strong> GobiZi Flow Tecnologia Ltda.</p>
                <p><strong>🛡️ DPO (Encarregado de Dados):</strong> dpo@gobiziflow.com</p>
              </div>
              <p className="mt-4 text-sm">
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
            <p className="text-sm text-slate-500">
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
