/**
 * Utilitários para formatação de horas
 */

/**
 * Converte horas decimais para formato HH:MM
 * 
 * @param decimalHours - Horas em formato decimal (ex: 33.67, 1165.5)
 * @returns String no formato "HH:MM" (ex: "33:40", "1165:30")
 * 
 * @example
 * formatDecimalToHHMM(33.67)  // "33:40"
 * formatDecimalToHHMM(8.5)    // "8:30"
 * formatDecimalToHHMM(100.25) // "100:15"
 * formatDecimalToHHMM(0)      // "0:00"
 */
export function formatDecimalToHHMM(decimalHours: number | null | undefined): string {
  // Tratar valores nulos ou inválidos
  if (decimalHours == null || isNaN(decimalHours)) {
    return "0:00"
  }

  // Garantir que não seja negativo
  const absHours = Math.abs(decimalHours)
  
  // Separar horas inteiras e decimais
  const hours = Math.floor(absHours)
  const decimalPart = absHours - hours
  
  // Converter decimal em minutos (0.67 * 60 = 40 minutos)
  const minutes = Math.round(decimalPart * 60)
  
  // Formatar minutos com zero à esquerda se necessário
  const formattedMinutes = minutes.toString().padStart(2, '0')
  
  // Adicionar sinal negativo se necessário
  const sign = decimalHours < 0 ? '-' : ''
  
  return `${sign}${hours}:${formattedMinutes}`
}

/**
 * Converte formato HH:MM para horas decimais
 * 
 * @param timeString - String no formato "HH:MM" (ex: "33:40")
 * @returns Número decimal (ex: 33.67)
 * 
 * @example
 * parseHHMMToDecimal("33:40")  // 33.6666...
 * parseHHMMToDecimal("8:30")   // 8.5
 * parseHHMMToDecimal("100:15") // 100.25
 */
export function parseHHMMToDecimal(timeString: string): number {
  if (!timeString || !timeString.includes(':')) {
    return 0
  }
  
  const [hoursStr, minutesStr] = timeString.split(':')
  const hours = parseInt(hoursStr) || 0
  const minutes = parseInt(minutesStr) || 0
  
  return hours + (minutes / 60)
}

/**
 * Formata horas decimais com sufixo "h"
 * 
 * @param decimalHours - Horas em formato decimal
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada com sufixo "h" (ex: "33.67h")
 */
export function formatDecimalHours(decimalHours: number | null | undefined, decimals: number = 2): string {
  if (decimalHours == null || isNaN(decimalHours)) {
    return "0h"
  }
  
  return `${decimalHours.toFixed(decimals)}h`
}

/**
 * Formata horas para exibição amigável no formato HH:MM com sufixo
 * 
 * @param decimalHours - Horas em formato decimal
 * @returns String formatada (ex: "33:40h", "1165:30h")
 */
export function formatHoursDisplay(decimalHours: number | null | undefined): string {
  const hhMM = formatDecimalToHHMM(decimalHours)
  return `${hhMM}h`
}

