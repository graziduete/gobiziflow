# Estrutura da Planilha Unificada - Sustentação

## 📊 Estrutura Otimizada

### Planilha: "Sustentação - Histórico Completo"

| Coluna | Nome na Planilha | Campo Dashboard | Tipo | Descrição | Exemplo |
|--------|------------------|-----------------|------|-----------|---------|
| A | Ano | ano | Número | Ano do chamado | 2025 |
| B | Cliente | cliente | Texto | Nome do cliente | Copersucar |
| C | # ID | idEllevo | Texto | ID único do chamado | 63468, 63652, 64810 |
| D | Status | status | Lista | Status do chamado | RESOLVED, OPEN, PENDING |
| E | Mês | mes | Número | Mês do chamado (1-12) | 7 (Julho) |
| F | Data abertura | dataAbertura | Data | Data/hora de abertura | 26/06/2025 15:01 |
| G | Solicitante | solicitante | Texto | Nome do solicitante | PATRICIA DE/RPA 04 |
| H | Assunto | assunto | Texto | Descrição do problema | Pedido de venda mapeamento... |
| I | Número RPA | automacao | Texto | Número da automação | 4, 5, 26, 9.1 |
| J | Data resolução | dataResolucao | Data | Data de resolução | 30/07/2025 17: |
| K | Categoria | categoria | Lista | Tipo do problema | Processo, Bug, Solicitação |
| L | Horas | tempoAtendimento | Tempo | Tempo de atendimento | 2:00:00, 0:30:00 |

## 🔍 Filtros Disponíveis

### 1. Filtro por Mês:
- **Mês atual**: E = 8 (Agosto)
- **Mês anterior**: E = 7 (Julho)
- **Últimos 3 meses**: E >= 6

### 2. Filtro por Cliente:
- **Copersucar**: B = "Copersucar"
- **Empresa B**: B = "Empresa B"

### 3. Filtro por Status:
- **Ativos**: D = "OPEN" ou "PENDING"
- **Resolvidos**: D = "RESOLVED"

### 4. Filtro por Categoria:
- **Bugs**: I = "Bug"
- **Processos**: I = "Processo"

## 📈 Vantagens da Estrutura Unificada

### 1. Análise Temporal:
- Comparar performance entre meses
- Identificar tendências
- Calcular médias mensais

### 2. Relatórios Avançados:
- Chamados por mês
- Tempo médio de resolução
- Categorias mais frequentes

### 3. Manutenção Simples:
- Uma planilha para gerenciar
- Backup único
- Configuração única no sistema

## 🔄 Processo de Atualização

### Mensal:
1. Adicionar novos chamados na planilha
2. Manter estrutura das colunas
3. Sistema filtra automaticamente por mês

### Trimestral:
1. Revisar categorias
2. Atualizar responsáveis
3. Ajustar configurações