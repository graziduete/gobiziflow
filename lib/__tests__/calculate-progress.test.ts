/**
 * Testes para a função de cálculo de progresso
 */

import { calculateProjectProgress, getProgressStats } from '../calculate-progress'

describe('calculateProjectProgress', () => {
  test('projeto sem tasks deve retornar 0%', () => {
    expect(calculateProjectProgress([])).toBe(0)
  })

  test('10 tasks não iniciadas = 0%', () => {
    const tasks = Array(10).fill({ status: 'not_started' })
    expect(calculateProjectProgress(tasks)).toBe(0)
  })

  test('10 tasks, 5 concluídas = 50%', () => {
    const tasks = [
      ...Array(5).fill({ status: 'completed' }),
      ...Array(5).fill({ status: 'not_started' })
    ]
    expect(calculateProjectProgress(tasks)).toBe(50)
  })

  test('10 tasks, 2 em andamento = 10% (2 tasks × 50%)', () => {
    const tasks = [
      ...Array(2).fill({ status: 'in_progress' }),
      ...Array(8).fill({ status: 'not_started' })
    ]
    expect(calculateProjectProgress(tasks)).toBe(10)
  })

  test('10 tasks, 4 concluídas + 2 em andamento + 4 não iniciadas = 50%', () => {
    const tasks = [
      ...Array(4).fill({ status: 'completed' }),
      ...Array(2).fill({ status: 'in_progress' }),
      ...Array(4).fill({ status: 'not_started' })
    ]
    // 4 × 10% = 40% + 2 × 5% = 10% = 50%
    expect(calculateProjectProgress(tasks)).toBe(50)
  })

  test('10 tasks, todas concluídas = 100%', () => {
    const tasks = Array(10).fill({ status: 'completed' })
    expect(calculateProjectProgress(tasks)).toBe(100)
  })

  test('tasks com atraso justificado contam como 100%', () => {
    const tasks = [
      ...Array(5).fill({ status: 'completed_delayed' }),
      ...Array(5).fill({ status: 'not_started' })
    ]
    expect(calculateProjectProgress(tasks)).toBe(50)
  })

  test('tasks pausadas contam 25%', () => {
    const tasks = [
      ...Array(4).fill({ status: 'on_hold' }),
      ...Array(6).fill({ status: 'not_started' })
    ]
    // 4 × 10% × 0.25 = 10%
    expect(calculateProjectProgress(tasks)).toBe(10)
  })

  test('status em português funciona corretamente', () => {
    const tasks = [
      { status: 'concluído' },
      { status: 'em andamento' },
      { status: 'não iniciado' }
    ]
    // 1/3 × 100% + 1/3 × 50% + 1/3 × 0% = 33.33% + 16.67% = 50%
    expect(calculateProjectProgress(tasks)).toBe(50)
  })
})

describe('getProgressStats', () => {
  test('deve retornar estatísticas corretas', () => {
    const tasks = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'in_progress' },
      { status: 'not_started' },
      { status: 'on_hold' }
    ]
    
    const stats = getProgressStats(tasks)
    
    expect(stats.total).toBe(5)
    expect(stats.completed).toBe(2)
    expect(stats.inProgress).toBe(1)
    expect(stats.notStarted).toBe(1)
    expect(stats.onHold).toBe(1)
    expect(stats.progress).toBe(50) // 2×20% + 1×10% + 1×5% = 55% arredondado
  })
})

