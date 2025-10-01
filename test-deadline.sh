#!/bin/bash

echo "🔍 Testando alertas de prazo..."
echo ""

echo "1. Testando alerta em 3 dias..."
curl -X POST http://localhost:3000/api/cron/deadline-monitor
echo ""
echo ""

echo "2. Aguardando 2 segundos..."
sleep 2

echo "3. Testando novamente..."
curl -X POST http://localhost:3000/api/cron/deadline-monitor
echo ""
echo ""

echo "✅ Teste concluído! Verifique:"
echo "   - Sino de notificações"
echo "   - Email recebido"
echo "   - Logs em /admin/notifications/logs"
