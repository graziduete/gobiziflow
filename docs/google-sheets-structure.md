# Estrutura da Planilha Google Sheets - Sustentação

## 📊 Padrão de Colunas (Mensal)

### Planilha: "Sustentação - [MÊS/ANO]"
Exemplo: "Sustentação - Setembro 2025"

| Coluna | Nome | Tipo | Descrição |
|--------|------|------|-----------|
| A | ID | Texto | ID único do chamado |
| B | Data Abertura | Data | Data de abertura do chamado |
| C | Assunto | Texto | Título/assunto do chamado |
| D | Categoria | Lista | Bug, Processo, Solicitação, Ajuste, Falha Sistêmica |
| E | Status | Lista | Não iniciado, Em andamento, Concluído, Aguardando |
| F | Solicitante | Texto | Nome do solicitante |
| G | Responsável | Texto | Nome do responsável |
| H | Automação | Texto | Sistema/automação afetada |
| I | Data Resolução | Data | Data de resolução (opcional) |
| J | Tempo Atendimento | Texto | Formato HH:MM |
| K | Horas Consumidas | Número | Horas trabalhadas |
| L | Observações | Texto | Notas adicionais |

## 🔄 Processo Mensal

### 1. Criação da Planilha:
- Copiar template do mês anterior
- Renomear para novo mês/ano
- Limpar dados antigos
- Manter estrutura de colunas

### 2. Configuração no Sistema:
- Atualizar URL da planilha
- Testar conexão
- Validar dados

### 3. Automação (Futuro):
- Webhook para atualizações
- Sincronização automática
- Notificações de mudanças

## 📋 Template de Planilha

### Aba 1: "Chamados"
- Dados dos chamados conforme estrutura acima

### Aba 2: "Configuração"
- Horas contratadas do mês
- Metas e objetivos
- Configurações do sistema

### Aba 3: "Métricas"
- Cálculos automáticos
- Gráficos e dashboards
- Relatórios consolidados