// Dados mockados para desenvolvimento enquanto aguarda autorização OAuth
export const MOCK_SUSTENTACAO_DATA = {
  copersucar: {
    horasContratadas: 40,
    horasConsumidas: 3.5,
    horasRestantes: 36.5,
    saldoProximoMes: 36.5,
    chamadosPorCategoria: [
      { categoria: 'Bugs', quantidade: 1, cor: 'bg-red-500' },
      { categoria: 'Processo', quantidade: 1, cor: 'bg-blue-500' },
      { categoria: 'Solicitação', quantidade: 1, cor: 'bg-green-500' },
      { categoria: 'Ajuste', quantidade: 0, cor: 'bg-yellow-500' },
      { categoria: 'Falha Sistêmica', quantidade: 0, cor: 'bg-purple-500' }
    ],
    chamados: [
      {
        idEllevo: 63468,
        automacao: 'RPA 4',
        assunto: 'Falha na automação RPA 04',
        categoria: 'Bug',
        status: 'Resolvido',
        solicitante: 'PATRICIA DE ARRUDA',
        dataAbertura: '26/06/2025 15:01',
        dataResolucao: '30/07/2025 17:00',
        tempoAtendimento: '2:00:00',
        mes: 7,
        ano: 2025,
        cliente: 'Copersucar',
        horasConsumidas: 2.0
      },
      {
        idEllevo: 63652,
        automacao: 'RPA 5',
        assunto: 'Erro no processamento RPA 05',
        categoria: 'Processo',
        status: 'Resolvido',
        solicitante: 'PALOMA FERREIRA DA SILVA',
        dataAbertura: '27/06/2025 13:57',
        dataResolucao: '30/07/2025 15:00',
        tempoAtendimento: '0:30:00',
        mes: 7,
        ano: 2025,
        cliente: 'Copersucar',
        horasConsumidas: 0.5
      },
      {
        idEllevo: 64810,
        automacao: 'RPA 26',
        assunto: 'Falha de processamento - XML divergentes',
        categoria: 'Solicitação',
        status: 'Resolvido',
        solicitante: 'JULIA ROSA TRINDADE',
        dataAbertura: '08/07/2025 10:53',
        dataResolucao: '28/07/2025 16:00',
        tempoAtendimento: '1:00:00',
        mes: 7,
        ano: 2025,
        cliente: 'Copersucar',
        horasConsumidas: 1.0
      },
      {
        idEllevo: 71584,
        automacao: 'RPA 3.3',
        assunto: 'Falha de processamento - Arquivo bloqueado',
        categoria: 'Bug',
        status: 'Resolvido',
        solicitante: 'MARCELO DA SILVA RAMOS',
        dataAbertura: '28/08/2025 09:59',
        dataResolucao: '30/08/2025 14:00',
        tempoAtendimento: '0:30:00',
        mes: 9,
        ano: 2025,
        cliente: 'Copersucar',
        horasConsumidas: 0.5
      }
    ]
  },
  
  empresaB: {
    horasContratadas: 50,
    horasConsumidas: 10,
    horasRestantes: 40,
    saldoProximoMes: 40,
    chamadosPorCategoria: [
      { categoria: 'Bugs', quantidade: 0, cor: 'bg-red-500' },
      { categoria: 'Processo', quantidade: 0, cor: 'bg-blue-500' },
      { categoria: 'Solicitação', quantidade: 0, cor: 'bg-green-500' },
      { categoria: 'Ajuste', quantidade: 0, cor: 'bg-yellow-500' },
      { categoria: 'Falha Sistêmica', quantidade: 0, cor: 'bg-purple-500' }
    ],
    chamados: [
      {
        idEllevo: null,
        automacao: 'Sistema ABC',
        assunto: 'Chamado via planilha',
        categoria: 'Bug',
        status: 'Não iniciado',
        solicitante: 'Usuário Planilha',
        dataAbertura: '11/09/2025',
        dataResolucao: '-',
        tempoAtendimento: '00:00'
      }
    ]
  }
};

// Função para obter dados mockados com filtros
export function getMockSustentacaoData(companyId: string, filters: any = {}) {
  const baseData = MOCK_SUSTENTACAO_DATA[companyId as keyof typeof MOCK_SUSTENTACAO_DATA] || MOCK_SUSTENTACAO_DATA.empresaB;
  
  // Aplicar filtros nos dados mockados
  let filteredChamados = [...baseData.chamados];
  
  // Filtro por mês (simulado)
  if (filters.mes) {
    const mesAtual = parseInt(filters.mes);
    // Simular que todos os chamados mockados são do mês atual
    filteredChamados = filteredChamados.filter(() => {
      // Para teste, mostrar todos os chamados mockados quando filtro por mês atual
      return true;
    });
  }
  
  // Filtro por status
  if (filters.status) {
    filteredChamados = filteredChamados.filter(chamado => 
      chamado.status.toLowerCase().includes(filters.status.toLowerCase())
    );
  }
  
  // Filtro por categoria
  if (filters.categoria) {
    filteredChamados = filteredChamados.filter(chamado => 
      chamado.categoria === filters.categoria
    );
  }
  
  // Recalcular métricas baseadas nos chamados filtrados
  const horasConsumidas = filteredChamados.reduce((total, chamado) => {
    const tempo = chamado.tempoAtendimento || '00:00';
    const [horas, minutos] = tempo.split(':').map(Number);
    return total + horas + (minutos / 60);
  }, 0);
  
  return {
    ...baseData,
    chamados: filteredChamados,
    horasConsumidas: Math.round(horasConsumidas * 100) / 100,
    horasRestantes: Math.max(0, baseData.horasContratadas - horasConsumidas),
    saldoProximoMes: Math.max(0, baseData.horasContratadas - horasConsumidas)
  };
}