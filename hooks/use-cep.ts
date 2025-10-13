import { useState, useCallback } from 'react'

interface CepData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

interface UseCepReturn {
  cepData: CepData | null
  isLoading: boolean
  error: string | null
  fetchCep: (cep: string) => Promise<void>
  clearCep: () => void
}

export function useCep(): UseCepReturn {
  const [cepData, setCepData] = useState<CepData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCep = useCallback(async (cep: string) => {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '')
    
    // Verifica se o CEP tem 8 dígitos
    if (cleanCep.length !== 8) {
      setError('CEP deve ter 8 dígitos')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP')
      }

      const data = await response.json()

      if (data.erro) {
        setError('CEP não encontrado')
        setCepData(null)
      } else {
        setCepData(data)
        setError(null)
      }
    } catch (err) {
      setError('Erro ao consultar CEP. Tente novamente.')
      setCepData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearCep = useCallback(() => {
    setCepData(null)
    setError(null)
  }, [])

  return {
    cepData,
    isLoading,
    error,
    fetchCep,
    clearCep
  }
}
