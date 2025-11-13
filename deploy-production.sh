#!/bin/bash

# Script para fazer deploy na Vercel após push
# Uso: ./deploy-production.sh "mensagem do commit"

echo "🚀 GobiZi Flow - Deploy para Produção"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se tem alterações
if [ -z "$(git status --porcelain)" ]; then 
  echo "✅ Sem alterações para commitar"
else
  echo "📝 Alterações detectadas, criando commit..."
  git add -A
  
  if [ -z "$1" ]; then
    echo "❌ Erro: Mensagem de commit é obrigatória!"
    echo "Uso: ./deploy-production.sh \"sua mensagem\""
    exit 1
  fi
  
  git commit -m "$1"
  echo "✅ Commit criado"
fi

# Push para GitHub
echo "📤 Fazendo push para GitHub..."
git push origin main

if [ $? -eq 0 ]; then
  echo "✅ Push realizado com sucesso!"
  
  # Disparar deploy na Vercel via hook
  echo "🔄 Disparando deploy na Vercel..."
  RESPONSE=$(curl -s -X POST https://api.vercel.com/v1/integrations/deploy/prj_JM7wIM7OM0b1Q3b3ScVhIoxNJuLF/Aty8PpFaZb)
  
  if echo "$RESPONSE" | grep -q "PENDING"; then
    echo "✅ Deploy disparado na Vercel!"
    echo "📊 Aguarde 2-3 minutos e verifique: https://vercel.com/graziduete-9673s-projects/gobiziflow/deployments"
  else
    echo "⚠️ Resposta da Vercel: $RESPONSE"
  fi
else
  echo "❌ Erro ao fazer push!"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Processo concluído!"

