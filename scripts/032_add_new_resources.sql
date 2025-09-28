-- =============================================================================
-- Script: Adicionar Novos Recursos aos Templates
-- Descrição: Adiciona os novos recursos solicitados pelo usuário
-- Data: $(date)
-- =============================================================================

-- Adicionar novos recursos à tabela templates_recursos
INSERT INTO templates_recursos (nome, taxa_hora_padrao, descricao) VALUES
('Analista de Dados', 105.00, 'Análise e ciência de dados'),
('Desenvolvedor RPA', 115.00, 'Automação de processos robóticos'),
('Engenheiro de Software', 140.00, 'Engenharia de software e arquitetura')
ON CONFLICT (nome) DO NOTHING;

-- Verificar se os recursos foram inseridos
SELECT 
    nome,
    taxa_hora_padrao,
    descricao,
    ativo,
    created_at
FROM templates_recursos 
WHERE nome IN ('Analista de Dados', 'Desenvolvedor RPA', 'Engenheiro de Software')
ORDER BY nome;
