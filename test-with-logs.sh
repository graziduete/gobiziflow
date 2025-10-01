#!/bin/bash

echo "🔍 Testando cron job e mostrando logs..."
echo ""
echo "Execute este comando em um terminal separado para ver os logs:"
echo "npm run dev | grep -E '(📅|✅|❌|⚠️|🔔|📧)'"
echo ""
echo "Aguardando 3 segundos..."
sleep 3

echo "🚀 Executando cron job..."
curl -X POST http://localhost:3000/api/cron/deadline-monitor

echo ""
echo ""
echo "✅ Teste concluído!"
echo ""
echo "Agora verifique:"
echo "1. Os logs no terminal do servidor"
echo "2. O sino de notificações"
echo "3. Os emails recebidos"
