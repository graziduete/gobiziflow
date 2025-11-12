import { Metadata } from "next"
import Link from "next/link"
import { FileCheck, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Scale, Shield } from "lucide-react"
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
              <h2 className="text-xl font-semibold text-slate-800">Bem-vindo ao GobiZi Flow! 🚀</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Estes Termos de Uso estabelecem as regras para o uso da plataforma <strong>GobiZi Flow</strong>. 
              Ao criar uma conta e usar nossos serviços, você concorda com estes termos. 
              Por favor, leia com atenção! 📝
            </p>
          </section>

          {/* Definições */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">1. Definições</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Para facilitar a compreensão:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>"Plataforma"</strong> ou <strong>"Serviço"</strong>: Refere-se ao GobiZi Flow e todas as suas funcionalidades</li>
                <li><strong>"Usuário"</strong>: Você, a pessoa que acessa e utiliza a plataforma</li>
                <li><strong>"Empresa"</strong>: A organização que contratou o serviço e gerencia os usuários</li>
                <li><strong>"Administrador"</strong>: Usuário com permissões de gerenciamento da empresa</li>
                <li><strong>"Dados"</strong>: Todas as informações inseridas, armazenadas e processadas na plataforma</li>
              </ul>
            </div>
          </section>

          {/* Aceite */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">2. Aceite dos Termos</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Ao usar o GobiZi Flow, você confirma que:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>✅ Leu, compreendeu e concorda com estes Termos de Uso</li>
                <li>✅ Leu e concorda com nossa Política de Privacidade</li>
                <li>✅ Tem capacidade legal para celebrar este acordo (maior de 18 anos)</li>
                <li>✅ Tem autorização da sua empresa para usar a plataforma</li>
              </ul>
              <p className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <strong>⚠️ Importante:</strong> Se você não concorda com estes termos, 
                não deve usar a plataforma.
              </p>
            </div>
          </section>

          {/* Descrição do Serviço */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">3. O que é o GobiZi Flow?</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>O GobiZi Flow é uma plataforma SaaS (Software as a Service) para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>📊 Gestão de projetos e cronogramas</li>
                <li>📋 Controle de tarefas e dependências</li>
                <li>📈 Visualização de Gantt Charts</li>
                <li>📁 Gerenciamento de documentos</li>
                <li>👥 Colaboração entre equipes</li>
                <li>📊 Relatórios e métricas de desempenho</li>
              </ul>
              <p className="mt-4">
                O serviço é fornecido "como está" e estamos sempre trabalhando para melhorá-lo! 🚀
              </p>
            </div>
          </section>

          {/* Conta e Acesso */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">4. Conta e Acesso</h2>
            </div>
            <div className="space-y-4 text-slate-600">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">4.1. Criação de Conta</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Contas são criadas pelo administrador da sua empresa</li>
                  <li>Você deve fornecer informações verdadeiras e atualizadas</li>
                  <li>Cada usuário deve ter uma conta individual (não compartilhar credenciais)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">4.2. Segurança da Conta</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Você é responsável por manter sua senha segura</li>
                  <li>Não compartilhe suas credenciais com terceiros</li>
                  <li>Notifique imediatamente sobre qualquer uso não autorizado</li>
                  <li>Use senhas fortes (mínimo 8 caracteres, com letras e números)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">4.3. Suspensão e Encerramento</h3>
                <p>Podemos suspender ou encerrar sua conta se:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Você violar estes Termos de Uso</li>
                  <li>Houver atividade fraudulenta ou maliciosa</li>
                  <li>Sua empresa encerrar o contrato com o GobiZi Flow</li>
                  <li>Por solicitação do administrador da sua empresa</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Uso Permitido */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-800">5. Uso Permitido ✅</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Você PODE usar a plataforma para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-emerald-700">
                <li>✅ Gerenciar projetos e tarefas da sua empresa</li>
                <li>✅ Colaborar com membros da equipe</li>
                <li>✅ Armazenar documentos relacionados aos projetos</li>
                <li>✅ Gerar relatórios e análises de desempenho</li>
                <li>✅ Acessar recursos conforme seu nível de permissão</li>
              </ul>
            </div>
          </section>

          {/* Uso Proibido */}
          <section className="bg-red-50 p-6 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-slate-800">6. Uso Proibido ❌</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Você NÃO PODE usar a plataforma para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-red-700">
                <li>❌ Violar leis, regulamentos ou direitos de terceiros</li>
                <li>❌ Tentar acessar dados de outras empresas (burlar o RLS)</li>
                <li>❌ Realizar engenharia reversa, descompilar ou modificar o código</li>
                <li>❌ Enviar vírus, malware ou código malicioso</li>
                <li>❌ Fazer scraping, mining ou extração automatizada de dados</li>
                <li>❌ Sobrecarregar a infraestrutura (ataques DDoS)</li>
                <li>❌ Revender, sublicenciar ou redistribuir o serviço</li>
                <li>❌ Armazenar conteúdo ilegal, ofensivo ou inapropriado</li>
                <li>❌ Usar para spam, phishing ou atividades fraudulentas</li>
              </ul>
            </div>
          </section>

          {/* Propriedade Intelectual */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">7. Propriedade Intelectual</h2>
            </div>
            <div className="space-y-4 text-slate-600">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">7.1. Nossa Propriedade</h3>
                <p>
                  O GobiZi Flow, incluindo seu código-fonte, design, logotipos, marca e documentação, 
                  são propriedade exclusiva da GobiZi Flow Tecnologia Ltda. e protegidos por leis de 
                  direitos autorais e propriedade intelectual.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">7.2. Seus Dados</h3>
                <p>
                  Você mantém todos os direitos sobre os dados que insere na plataforma (projetos, tarefas, 
                  documentos, etc.). Nós apenas processamos esses dados para fornecer o serviço.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">7.3. Licença de Uso</h3>
                <p>
                  Concedemos a você uma licença limitada, não exclusiva, intransferível e revogável 
                  para acessar e usar a plataforma, conforme estes termos.
                </p>
              </div>
            </div>
          </section>

          {/* Disponibilidade */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-semibold text-slate-800">8. Disponibilidade e Manutenção</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>
                Nos esforçamos para manter a plataforma disponível 24/7, mas podem ocorrer:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>🔧 Manutenções programadas (notificaremos com antecedência)</li>
                <li>⚠️ Indisponibilidades temporárias por problemas técnicos</li>
                <li>🔄 Atualizações e melhorias do sistema</li>
              </ul>
              <p className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <strong>⚠️ Importante:</strong> Não garantimos disponibilidade ininterrupta. 
                Recomendamos manter backups dos seus dados críticos.
              </p>
            </div>
          </section>

          {/* Limitação de Responsabilidade */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-semibold text-slate-800">9. Limitação de Responsabilidade</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>Na extensão máxima permitida por lei:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Não nos responsabilizamos por perda de dados causada por uso inadequado</li>
                <li>Não garantimos que o serviço atenderá todas as suas necessidades específicas</li>
                <li>Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais</li>
                <li>Nossa responsabilidade é limitada ao valor pago pela sua empresa nos últimos 12 meses</li>
              </ul>
            </div>
          </section>

          {/* Indenização */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">10. Indenização</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Você concorda em nos indenizar e isentar de responsabilidade por quaisquer reclamações, 
              perdas, danos ou despesas (incluindo honorários advocatícios) decorrentes de:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-600 mt-3">
              <li>Seu uso indevido da plataforma</li>
              <li>Violação destes Termos de Uso</li>
              <li>Violação de direitos de terceiros</li>
              <li>Conteúdo ilegal ou inapropriado que você armazene na plataforma</li>
            </ul>
          </section>

          {/* Modificações */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">11. Modificações dos Termos</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Podemos atualizar estes Termos de Uso periodicamente. Quando houver alterações significativas, 
              notificaremos você por e-mail ou através de um aviso na plataforma. O uso continuado 
              do serviço após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* Lei Aplicável */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">12. Lei Aplicável e Foro</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
              Qualquer disputa será submetida ao foro da comarca de <strong>[Cidade/Estado]</strong>, 
              com exclusão de qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          {/* Contato */}
          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">13. Dúvidas?</h2>
            </div>
            <div className="space-y-3 text-slate-600">
              <p>
                Se tiver dúvidas sobre estes Termos de Uso, entre em contato:
              </p>
              <div className="space-y-2 mt-4">
                <p><strong>📧 E-mail:</strong> contato@gobiziflow.com</p>
                <p><strong>🏢 Empresa:</strong> GobiZi Flow Tecnologia Ltda.</p>
                <p><strong>📄 CNPJ:</strong> [Inserir CNPJ]</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t text-center">
            <p className="text-sm text-slate-500">
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

