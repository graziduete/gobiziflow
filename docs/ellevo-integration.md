# Integração Ellevo - Copersucar

## Configuração Atual

### Serviço Principal
- **Nome**: Abrir Chamado para RPA
- **Código**: `ABRIRCHAMADOPARARPA-638739843601`
- **URL**: `https://copersucar.ellevo.com/api/v1/ticket/ticket-list?date=30&&service=ABRIRCHAMADOPARARPA-638739843601`

### Credenciais
- **Subdomínio**: `copersucar`
- **Token**: Bearer Token (configurado)
- **Horas Contratadas**: 40h

### Endpoints Utilizados
1. **Lista de Chamados**: `/api/v1/ticket/ticket-list`
2. **Chamado Específico**: `/api/v1/ticket/ticket-list/{id}`
3. **Upload de Anexos**: `/api/v1/ticket/attachment/upload`

### Parâmetros Padrão
- **date**: 30 (últimos 30 dias)
- **service**: ABRIRCHAMADOPARARPA-638739843601
- **subService**: false
- **offset**: 0

## Arquivos de Configuração

### `lib/config/ellevo-copersucar.ts`
Contém todas as configurações específicas da Copersucar:
- Credenciais de autenticação
- URLs dos endpoints
- Parâmetros padrão

### `lib/providers/ellevo-provider.ts`
Provider principal que implementa a integração:
- Autenticação com token Bearer
- Busca de chamados
- Mapeamento de dados
- Teste de conexão

### `lib/services/ellevo-test.service.ts`
Serviço de teste para validação:
- Teste de conexão
- Busca de chamados
- Busca de chamado específico

## Páginas de Teste

### `/admin/sustentacao/test`
Página dedicada para testar a integração:
- Teste de conexão
- Busca de chamados
- Validação de dados
- Debug de erros

## Estrutura de Dados

### Chamado (Ticket)
```typescript
interface Chamado {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  solicitante: string;
  responsavel?: string;
  dataAbertura: string;
  dataResolucao?: string;
  tempoAtendimento: string;
  automacao?: string;
  idEllevo?: number;
  descricao?: string;
  horasConsumidas?: number;
  metadata?: any;
}
```

### Métricas
```typescript
interface Metricas {
  horasContratadas: number;
  horasConsumidas: number;
  horasRestantes: number;
  saldoProximoMes: number;
  chamadosAtivos?: number;
}
```

## Como Testar

1. **Acesse a página de teste**: `/admin/sustentacao/test`
2. **Teste a conexão**: Clique em "Testar Conexão"
3. **Busque chamados**: Clique em "Buscar Chamados"
4. **Valide os dados**: Verifique a estrutura retornada
5. **Teste chamado específico**: Use um ID real do sistema

## Logs e Debug

Todos os logs são exibidos no console do navegador:
- 🔍 Busca de dados
- ✅ Sucesso
- ❌ Erros
- 📊 Status das requisições

## Próximos Passos

1. **Validar dados reais** da API
2. **Ajustar mapeamento** se necessário
3. **Implementar cache** para performance
4. **Adicionar sincronização** automática
5. **Expandir para outros clientes**