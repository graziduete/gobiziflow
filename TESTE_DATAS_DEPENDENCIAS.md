# 🧪 Guia de Testes: Sistema de Datas Reais e Dependências

## 📋 Pré-requisitos
- Servidor rodando em http://localhost:3000
- Acesso ao painel admin
- Projeto de teste criado

---

## ✅ Cenário 1: Tarefa Independente - Início no Prazo

**Objetivo**: Testar o cálculo automático quando uma tarefa inicia conforme planejado.

**Passos**:
1. Criar uma tarefa:
   - Nome: "Tarefa A - Independente"
   - Data Início Planejada: **Data de hoje**
   - Data Fim Planejada: **3 dias a partir de hoje**
   - Dependency: "Independente"
   - Status: "Não Iniciado"

2. Mudar status para "Em Andamento"

**Resultado Esperado**:
- ✅ Data Início Real = Data de hoje
- ✅ Data Fim Prevista = 3 dias a partir de hoje (mesma duração)
- ✅ Data Fim Real = vazio

3. Mudar status para "Concluído"

**Resultado Esperado**:
- ✅ Data Fim Real = Data de hoje

---

## ⏰ Cenário 2: Tarefa com Atraso no Início

**Objetivo**: Testar o cálculo quando tarefa inicia com atraso.

**Passos**:
1. Criar uma tarefa:
   - Nome: "Tarefa B - Com Atraso"
   - Data Início Planejada: **5 dias atrás**
   - Data Fim Planejada: **3 dias atrás** (duração de 2 dias)
   - Status: "Não Iniciado"

2. Mudar status para "Em Andamento" HOJE

**Resultado Esperado**:
- ✅ Data Início Real = Data de hoje (5 dias de atraso!)
- ✅ Data Fim Prevista = Hoje + 2 dias (mantém duração planejada)
- ✅ Atraso visível: planejado 5 dias atrás, real hoje

---

## 🔗 Cenário 3: Dependências - Fluxo Normal

**Objetivo**: Testar dependências quando tudo ocorre conforme planejado.

**Passos**:
1. Criar Tarefa A:
   - Nome: "Tarefa A - Predecessora"
   - Data Início: Hoje
   - Data Fim: Hoje + 2 dias
   - Dependency: "Independente"

2. Criar Tarefa B:
   - Nome: "Tarefa B - Depende de A"
   - Data Início: Hoje + 2 dias
   - Data Fim: Hoje + 4 dias
   - Clicar no ícone 🔗 de dependência
   - Selecionar "Aguardar término de outra tarefa"
   - Escolher "Tarefa A"

**Resultado Esperado**:
- ✅ Badge azul "Depende de Tarefa A" aparece
- ✅ Ícone de cadeado (🔒) porque A não foi concluída

3. Mudar status de Tarefa B para "Em Andamento"

**Resultado Esperado**:
- ❌ ALERTA: "Não é possível iniciar esta tarefa!"
- ❌ Status NÃO muda (fica em "Não Iniciado")

4. Mudar status de Tarefa A para "Concluído"

**Resultado Esperado**:
- ✅ Badge de Tarefa B muda para verde com ícone desbloqueado (🔓)
- ✅ Tooltip mostra "✓ Pode iniciar"

5. Mudar status de Tarefa B para "Em Andamento"

**Resultado Esperado**:
- ✅ Status muda para "Em Andamento" (sem alerta!)
- ✅ Data Início Real preenchida
- ✅ Data Fim Prevista calculada

---

## 📊 Cenário 4: Dependências com Atraso

**Objetivo**: Testar cascata de atrasos.

**Passos**:
1. Criar Tarefa A:
   - Data Início Planejada: 10 dias atrás
   - Data Fim Planejada: 8 dias atrás (duração 2 dias)
   - Iniciar HOJE (8 dias de atraso!)

2. Criar Tarefa B (depende de A):
   - Data Início Planejada: 8 dias atrás
   - Data Fim Planejada: 6 dias atrás

3. Concluir Tarefa A hoje

4. Iniciar Tarefa B hoje

**Resultado Esperado**:
- ✅ Tarefa A: 
  - Início Real = Hoje (8 dias de atraso)
  - Fim Prevista = Hoje + 2 dias
  - Fim Real = Hoje
- ✅ Tarefa B:
  - Início Real = Hoje (8 dias de atraso também!)
  - Fim Prevista = Calculada mantendo duração
  - Visível o impacto do atraso em cascata

---

## 🎨 Cenário 5: Visual e UX

**Verificações**:
- ✅ Colunas "Data Início Real", "Data Fim Prevista", "Data Fim Real" visíveis
- ✅ Background colorido nos headers: azul, âmbar, verde
- ✅ Datas reais são read-only (não editáveis)
- ✅ Ícones nos campos de data
- ✅ Badges de dependência visíveis e coloridos
- ✅ Botão 🔗 com badge de contador quando tem dependência
- ✅ Modal de dependências abre ao clicar no botão
- ✅ Modal mostra informações da predecessora
- ✅ Tooltips funcionam em todos os elementos

---

## 🐛 Casos de Borda para Testar

### Remover Dependência
1. Criar tarefa com dependência
2. Abrir modal e mudar para "Independente"
3. ✅ Badge deve sumir
4. ✅ Deve poder iniciar tarefa sem restrições

### Múltiplas Tarefas em Cadeia
1. Criar Tarefa A, B e C
2. B depende de A
3. C depende de B
4. ✅ Testar cascata: só pode iniciar B após A, só pode iniciar C após B

### Editar Datas Planejadas
1. Criar tarefa e iniciar
2. Editar Data Início Planejada ou Data Fim Planejada
3. ✅ Datas reais NÃO devem mudar
4. ✅ Duração prevista deve recalcular se tarefa ainda em andamento

---

## 📝 Checklist Final

- [ ] Cenário 1 completado
- [ ] Cenário 2 completado
- [ ] Cenário 3 completado
- [ ] Cenário 4 completado
- [ ] Cenário 5 verificado
- [ ] Casos de borda testados
- [ ] Interface bonita e funcional
- [ ] Nenhum erro no console
- [ ] Dados salvos corretamente no banco

---

## 🎯 Relatório de Bugs

Se encontrar algum problema, anote aqui:

**Bug 1:**
- Descrição: 
- Passos para reproduzir:
- Comportamento esperado:
- Comportamento atual:

---

## ✨ Melhorias Sugeridas (Opcional)

Se tiver ideias de melhorias durante os testes, anote aqui!

