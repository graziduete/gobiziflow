"use client";

import { useState } from 'react';

export default function PublicTestV2Page() {
  const [horasContratadas, setHorasContratadas] = useState(40);
  const [saldoNegativo, setSaldoNegativo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      console.log('💾 Salvando configuração V2 (PUBLIC TEST):', {
        companyId: 'copersucar-uuid',
        horasContratadas,
        saldoNegativo
      });

      const response = await fetch('/api/test-v2-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'copersucar-uuid',
          horasContratadas: Number(horasContratadas),
          saldoNegativo
        })
      });

      const result = await response.json();
      setResult(result);
      
      if (result.success) {
        setSuccess(true);
        console.log('✅ Configuração salva:', result.data);
      } else {
        throw new Error(result.error || 'Erro ao salvar configuração');
      }

    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/test-v2-config?companyId=copersucar-uuid');
      const result = await response.json();
      
      setResult(result);
      console.log('🧪 Resultado do teste:', result);

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Teste V2 Config - Copersucar</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Horas Contratadas</label>
              <input
                type="number"
                value={horasContratadas}
                onChange={(e) => setHorasContratadas(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Saldo Negativo</label>
              <input
                type="checkbox"
                checked={saldoNegativo}
                onChange={(e) => setSaldoNegativo(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">{saldoNegativo ? 'Sim' : 'Não'}</span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={handleTest}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
              >
                Testar
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800">
                ✅ Configuração salva com sucesso!
              </div>
            )}

            {result && (
              <div className="p-3 bg-gray-100 rounded">
                <h3 className="font-medium mb-2">Resultado:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}