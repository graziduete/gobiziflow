-- Script para criar schema de estimativas por tarefa
-- Baseado na planilha de matriz tecnologia x complexidade

-- Tabela de tecnologias
CREATE TABLE IF NOT EXISTS tecnologias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de complexidades
CREATE TABLE IF NOT EXISTS complexidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(10) UNIQUE NOT NULL, -- MB, MB+, B, B+, M, M+, A, A+, MA, MA+
  nome VARCHAR(50) NOT NULL, -- Muito Baixa, Muito Baixa+, etc.
  ordem INTEGER NOT NULL, -- Para ordenação
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tipos de tarefa
CREATE TABLE IF NOT EXISTS tipos_tarefa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) UNIQUE NOT NULL, -- NOVO, ALTERAÇÃO, BALIZADOR
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fatores de estimativa (matriz tecnologia x complexidade x tipo)
CREATE TABLE IF NOT EXISTS fatores_estimativa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tecnologia_id UUID REFERENCES tecnologias(id) ON DELETE CASCADE NOT NULL,
  complexidade_id UUID REFERENCES complexidades(id) ON DELETE CASCADE NOT NULL,
  tipo_tarefa_id UUID REFERENCES tipos_tarefa(id) ON DELETE CASCADE NOT NULL,
  fator_novo DECIMAL(10,2) NOT NULL,
  fator_alteracao DECIMAL(10,2) NOT NULL,
  balizador DECIMAL(10,2) DEFAULT 1.4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tecnologia_id, complexidade_id, tipo_tarefa_id)
);

-- Tabela de tarefas da estimativa
CREATE TABLE IF NOT EXISTS tarefas_estimativa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimativa_id UUID REFERENCES estimativas(id) ON DELETE CASCADE NOT NULL,
  funcionalidade TEXT NOT NULL,
  tecnologia_id UUID REFERENCES tecnologias(id) ON DELETE CASCADE NOT NULL,
  complexidade_id UUID REFERENCES complexidades(id) ON DELETE CASCADE NOT NULL,
  tipo_tarefa_id UUID REFERENCES tipos_tarefa(id) ON DELETE CASCADE NOT NULL,
  quantidade INTEGER DEFAULT 1 NOT NULL,
  nota_descricao TEXT,
  fator_aplicado DECIMAL(10,2) NOT NULL,
  total_base DECIMAL(10,2) NOT NULL,
  total_com_gordura DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tecnologias
INSERT INTO tecnologias (nome) VALUES 
('VBA'),
('Access'),
('Stored Procedures'),
('PowerShell'),
('UIPATH'),
('AA'),
('ARP'),
('BP'),
('AutoIt'),
('.NET'),
('SQL')
ON CONFLICT (nome) DO NOTHING;

-- Inserir complexidades
INSERT INTO complexidades (codigo, nome, ordem) VALUES 
('MB', 'Muito Baixa', 1),
('MB+', 'Muito Baixa+', 2),
('B', 'Baixa', 3),
('B+', 'Baixa+', 4),
('M', 'Média', 5),
('M+', 'Média+', 6),
('A', 'Alta', 7),
('A+', 'Alta+', 8),
('MA', 'Muito Alta', 9),
('MA+', 'Muito Alta+', 10)
ON CONFLICT (codigo) DO NOTHING;

-- Inserir tipos de tarefa
INSERT INTO tipos_tarefa (nome) VALUES 
('NOVO'),
('ALTERAÇÃO'),
('BALIZADOR')
ON CONFLICT (nome) DO NOTHING;

-- Inserir fatores de estimativa baseados na planilha
-- VBA
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END,
  CASE c.codigo
    WHEN 'MB' THEN 0.7
    WHEN 'MB+' THEN 0.84
    WHEN 'B' THEN 1.4
    WHEN 'B+' THEN 1.68
    WHEN 'M' THEN 2.8
    WHEN 'M+' THEN 3.36
    WHEN 'A' THEN 5.6
    WHEN 'A+' THEN 6.72
    WHEN 'MA' THEN 11.2
    WHEN 'MA+' THEN 12.6
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'VBA' AND tt.nome = 'NOVO';

-- Access
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END,
  CASE c.codigo
    WHEN 'MB' THEN 0.7
    WHEN 'MB+' THEN 0.84
    WHEN 'B' THEN 1.4
    WHEN 'B+' THEN 1.68
    WHEN 'M' THEN 2.8
    WHEN 'M+' THEN 3.36
    WHEN 'A' THEN 5.6
    WHEN 'A+' THEN 6.72
    WHEN 'MA' THEN 11.2
    WHEN 'MA+' THEN 12.6
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'Access' AND tt.nome = 'NOVO';

-- Stored Procedures
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 67.2
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 60.48
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'Stored Procedures' AND tt.nome = 'NOVO';

-- PowerShell
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'PowerShell' AND tt.nome = 'NOVO';

-- UIPATH
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'UIPATH' AND tt.nome = 'NOVO';

-- AA (Automation Anywhere)
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'AA' AND tt.nome = 'NOVO';

-- ARP
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'ARP' AND tt.nome = 'NOVO';

-- BP (Blue Prism)
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'BP' AND tt.nome = 'NOVO';

-- AutoIt
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'AutoIt' AND tt.nome = 'NOVO';

-- .NET
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = '.NET' AND tt.nome = 'NOVO';

-- SQL
INSERT INTO fatores_estimativa (tecnologia_id, complexidade_id, tipo_tarefa_id, fator_novo, fator_alteracao) 
SELECT t.id, c.id, tt.id, 
  CASE c.codigo
    WHEN 'MB' THEN 2.8
    WHEN 'MB+' THEN 3.36
    WHEN 'B' THEN 5.6
    WHEN 'B+' THEN 6.72
    WHEN 'M' THEN 11.2
    WHEN 'M+' THEN 13.44
    WHEN 'A' THEN 22.4
    WHEN 'A+' THEN 26.88
    WHEN 'MA' THEN 44.8
    WHEN 'MA+' THEN 53.76
  END,
  CASE c.codigo
    WHEN 'MB' THEN 1.4
    WHEN 'MB+' THEN 1.68
    WHEN 'B' THEN 2.8
    WHEN 'B+' THEN 3.36
    WHEN 'M' THEN 5.6
    WHEN 'M+' THEN 6.72
    WHEN 'A' THEN 11.2
    WHEN 'A+' THEN 13.44
    WHEN 'MA' THEN 22.4
    WHEN 'MA+' THEN 26.88
  END
FROM tecnologias t, complexidades c, tipos_tarefa tt
WHERE t.nome = 'SQL' AND tt.nome = 'NOVO';

-- RLS para as novas tabelas
ALTER TABLE tecnologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE complexidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatores_estimativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_estimativa ENABLE ROW LEVEL SECURITY;

-- Policies para permitir acesso autenticado
CREATE POLICY "Allow authenticated users to read tecnologias"
ON tecnologias FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read complexidades"
ON complexidades FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read tipos_tarefa"
ON tipos_tarefa FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read fatores_estimativa"
ON fatores_estimativa FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage tarefas_estimativa"
ON tarefas_estimativa FOR ALL
USING (auth.role() = 'authenticated');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tarefas_estimativa_estimativa_id ON tarefas_estimativa(estimativa_id);
CREATE INDEX IF NOT EXISTS idx_fatores_estimativa_tecnologia_complexidade ON fatores_estimativa(tecnologia_id, complexidade_id);
