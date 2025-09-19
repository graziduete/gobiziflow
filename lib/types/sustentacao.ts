// Tipos para o módulo de Sustentação

export interface Chamado {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  solicitante: string;
  dataAbertura: string;
  dataResolucao?: string;
  tempoAtendimento: string;
  automacao?: string;
  idEllevo?: number;
  horasConsumidas?: number;
  descricao?: string;
  responsavel?: string;
  metadata?: Record<string, any>;
}

export interface Metricas {
  horasContratadas: number;
  horasConsumidas: number;
  horasRestantes: number;
  saldoProximoMes: number;
  chamadosAtivos: number;
}

export interface Categoria {
  nome: string;
  quantidade: number;
  cor: string;
}

export interface SustentacaoConfig {
  id: string;
  companyId: string;
  providerType: 'ellevo' | 'planilha' | 'outro';
  config: EllevoConfig | PlanilhaConfig | OutroConfig;
  horasContratadas: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EllevoConfig {
  subdomain: string;
  clientId: string;
  clientSecret: string;
  clienteEllevo?: string;
  lastSync?: string;
}

export interface PlanilhaConfig {
  filePath: string;
  sheetName?: string;
  lastSync?: string;
}

export interface OutroConfig {
  apiUrl: string;
  credentials: Record<string, any>;
  lastSync?: string;
}

// Tipos específicos da API Ellevo
export interface EllevoTicket {
  sequenceNumber: number;
  title: string;
  description: string;
  openingDate: string;
  closingDate?: string;
  dueDate?: string;
  status: EllevoStatus;
  requestType: string;
  service: string;
  responsible: string;
  requester: string;
  customer: string;
  proceedingsCount: number;
  stage: string;
  formsResponse?: EllevoFormResponse[];
}

export interface EllevoFormResponse {
  referenceCode: string;
  fieldsValues: Record<string, any>;
}

export interface EllevoStatus {
  notStarted: 'notStarted';
  inProgress: 'inProgress';
  waiting: 'waiting';
  concluded: 'concluded';
}

export interface EllevoApiResponse {
  ticketCount: number;
  integrationApiTicketListItems: EllevoTicket[];
}

export interface EllevoAuthResponse {
  accessCode: string;
}

export interface EllevoTokenResponse {
  access_token: string;
}

// Tipos para filtros
export interface SustentacaoFilters {
  date?: number; // dias para trás
  service?: string;
  subService?: boolean;
  offset?: number;
  generator?: string;
  status?: string;
  categoria?: string;
}

// Tipos para sincronização
export interface SyncResult {
  success: boolean;
  chamadosSincronizados: number;
  horasSincronizadas: number;
  errors: string[];
  lastSync: Date;
}

// Tipos para cache
export interface ChamadoCache {
  id: string;
  sustentacaoConfigId: string;
  externalId: string;
  titulo: string;
  categoria: string;
  status: string;
  solicitante: string;
  responsavel?: string;
  dataAbertura: Date;
  dataResolucao?: Date;
  tempoAtendimento: number; // em minutos
  horasConsumidas: number;
  automacao?: string;
  descricao?: string;
  metadata: Record<string, any>;
  cachedAt: Date;
}

// Tipos para métricas
export interface MetricasCache {
  id: string;
  sustentacaoConfigId: string;
  periodo: Date; // primeiro dia do mês
  horasContratadas: number;
  horasConsumidas: number;
  horasRestantes: number;
  saldoProximoMes: number;
  chamadosAtivos: number;
  chamadosPorCategoria: Record<string, number>;
  calculatedAt: Date;
}