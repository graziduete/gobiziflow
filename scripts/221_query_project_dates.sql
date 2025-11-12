-- =====================================================
-- Query: Consultar datas planejadas do projeto
-- =====================================================
-- ID: c1c8c44e-399f-40b1-bbc3-b6af8b7f3d60
-- Data: 2025-11-12
-- =====================================================

SELECT 
  id,
  name AS "Nome do Projeto",
  start_date AS "Data Início Planejada",
  end_date AS "Data Fim Planejada",
  predicted_start_date AS "Data Início Prevista",
  predicted_end_date AS "Data Fim Prevista",
  actual_start_date AS "Data Início Real",
  actual_end_date AS "Data Fim Real",
  status AS "Status",
  created_at AS "Criado em"
FROM projects
WHERE id = 'c1c8c44e-399f-40b1-bbc3-b6af8b7f3d60';

-- =====================================================
-- LEGENDA DAS DATAS:
-- =====================================================
-- start_date / end_date = PLANEJADO (Baseline original)
-- predicted_start_date / predicted_end_date = PREVISTO (Projeção atual)
-- actual_start_date / actual_end_date = REAL (O que realmente aconteceu)
-- =====================================================

