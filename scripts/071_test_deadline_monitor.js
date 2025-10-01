// Script para testar o monitor de prazos manualmente
// Execute este script para simular o cron job

const testDeadlineMonitor = async () => {
  try {
    console.log('🔍 Testando monitor de prazos...')
    
    // Chamar a API do cron job
    const response = await fetch('http://localhost:3000/api/cron/deadline-monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Parâmetros opcionais para teste
        testMode: true
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Monitor executado com sucesso:', result)
    } else {
      console.error('❌ Erro no monitor:', result)
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar monitor:', error)
  }
}

// Executar o teste
testDeadlineMonitor()
