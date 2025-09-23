# Guia de Configuração Google Sheets - Sustentação

## 🎯 Configuração da Planilha Oficial

### **Estrutura da Planilha Google Sheets:**

| Coluna | Nome | Descrição | Exemplo |
|--------|------|-----------|---------|
| A | Ano | Ano do chamado | 2025 |
| B | Cliente | Nome do cliente | Copersucar |
| C | # ID | ID único do chamado | 63468 |
| D | Status | Status do chamado | RESOLVED |
| E | Mês | Mês do chamado (1-12) | 7 |
| F | Data abertura | Data/hora de abertura | 26/06/2025 15:01 |
| G | Solicitante | Nome do solicitante | PATRICIA DE/RPA 04 |
| H | Assunto | Descrição do problema | Pedido de venda mapeamento... |
| I | Número RPA | Número da automação | 4 |
| J | Data resolução | Data de resolução | 30/07/2025 17:00 |
| K | Categoria | Tipo do problema | Processo |
| L | Horas | Tempo de atendimento | 2:00:00 |

## 🔧 Configuração do Sistema

### **1. Google Cloud Console:**

#### **Passo 1: Criar Projeto**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Nome sugerido: "Sustentação Dashboard"

#### **Passo 2: Ativar API**
1. Vá para "APIs & Services" > "Library"
2. Procure por "Google Sheets API"
3. Clique em "Enable"

#### **Passo 3: Criar API Key**
1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "API Key"
3. Copie a API Key gerada
4. (Opcional) Configure restrições de segurança

### **2. Configuração da Planilha:**

#### **Passo 1: Criar Planilha**
1. Acesse [Google Sheets](https://sheets.google.com/)
2. Crie nova planilha: "Sustentação - Histórico Completo"
3. Configure as colunas conforme estrutura acima

#### **Passo 2: Configurar Permissões**
1. Clique em "Share" (Compartilhar)
2. Adicione a API Key como "Viewer"
3. Ou configure como "Anyone with the link can view"

#### **Passo 3: Obter ID da Planilha**
1. Copie a URL da planilha
2. Extraia o ID: `https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit`
3. Exemplo: `1ABC123DEF456GHI789...`

### **3. Configuração do Sistema:**

#### **Variáveis de Ambiente:**
```env
# Google Sheets API
GOOGLE_SHEETS_API_KEY=SUA_API_KEY_AQUI

# Planilhas por empresa
GOOGLE_SHEETS_COPERCUSAR_ID=ID_DA_PLANILHA_COPERCUSAR
GOOGLE_SHEETS_EMPRESA_B_ID=ID_DA_PLANILHA_EMPRESA_B
```

#### **Configuração no Dashboard:**
1. Acesse Admin > Sustentação > Configuração
2. Selecione "Google Sheets" como provedor
3. Insira:
   - **ID da Planilha**: ID extraído da URL
   - **API Key**: Chave criada no Google Cloud Console

## 📊 Exemplo de Dados

### **Dados de Exemplo:**
```
Ano | Cliente    | # ID  | Status   | Mês | Data abertura      | Solicitante        | Assunto                    | Número RPA | Data resolução     | Categoria | Horas
2025 | Copersucar | 63468 | RESOLVED | 7   | 26/06/2025 15:01  | PATRICIA DE/RPA 04 | Falha na automação RPA 04  | 4          | 30/07/2025 17:00  | Bug       | 2:00:00
2025 | Copersucar | 63652 | RESOLVED | 7   | 27/06/2025 13:57  | PALOMA FERF RPA 05 | Erro no processamento RPA  | 5          | 30/07/2025 15:00  | Processo  | 0:30:00
2025 | Copersucar | 64810 | RESOLVED | 7   | 08/07/2025 10:53  | JULIA ROSA TRINDADE| Falha de processamento XML | 26         | 28/07/2025 16:00  | Solicitação| 1:00:00
```

## 🔍 Filtros Disponíveis

### **Filtros por Mês:**
- **Mês 7**: Julho (dados de exemplo)
- **Mês 8**: Agosto
- **Mês 9**: Setembro

### **Filtros por Status:**
- **RESOLVED**: Chamados resolvidos
- **OPEN**: Chamados abertos
- **PENDING**: Chamados pendentes

### **Filtros por Categoria:**
- **Bug**: Problemas técnicos
- **Processo**: Melhorias de processo
- **Solicitação**: Novas funcionalidades

## ✅ Teste de Configuração

### **1. Teste de Conexão:**
1. Acesse Admin > Sustentação
2. Clique em "Testar Conexão"
3. Verifique se retorna "✅ Conexão OK"

### **2. Teste de Dados:**
1. Acesse o dashboard de sustentação
2. Verifique se os dados aparecem corretamente
3. Teste os filtros por mês

### **3. Teste de Filtros:**
1. Filtre por mês 7 (Julho)
2. Verifique se apenas chamados de julho aparecem
3. Teste outros filtros

## 🚀 Próximos Passos

### **1. Configuração Inicial:**
- [ ] Criar API Key no Google Cloud Console
- [ ] Configurar planilha com estrutura oficial
- [ ] Testar conexão no sistema

### **2. Dados de Produção:**
- [ ] Migrar dados existentes para planilha
- [ ] Configurar processo de atualização mensal
- [ ] Treinar equipe no uso da planilha

### **3. Monitoramento:**
- [ ] Configurar alertas de erro
- [ ] Monitorar performance da API
- [ ] Backup regular dos dados

## 📞 Suporte

### **Problemas Comuns:**

#### **Erro de Permissão:**
- Verificar se API Key tem acesso à planilha
- Verificar se planilha está compartilhada

#### **Erro de Formato:**
- Verificar se colunas estão na ordem correta
- Verificar se dados estão no formato esperado

#### **Erro de Conexão:**
- Verificar se API Key está correta
- Verificar se Google Sheets API está ativada

### **Contato:**
- **Desenvolvimento**: Equipe técnica
- **Suporte**: Administrador do sistema