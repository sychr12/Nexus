ALTER TABLE IF EXISTS carteiras_digitais
    ALTER COLUMN cpf TYPE VARCHAR(512);

ALTER TABLE IF EXISTS carteiras_digitais
    ADD COLUMN IF NOT EXISTS cpf_hash VARCHAR(64);

ALTER TABLE IF EXISTS fluxo_processos
    ALTER COLUMN cpf TYPE VARCHAR(512);

ALTER TABLE IF EXISTS fluxo_processos
    ADD COLUMN IF NOT EXISTS cpf_hash VARCHAR(64);

ALTER TABLE IF EXISTS inscricoes
    ALTER COLUMN cpf TYPE VARCHAR(512);

ALTER TABLE IF EXISTS inscricoes
    ADD COLUMN IF NOT EXISTS cpf_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_carteiras_digitais_cpf_hash
    ON carteiras_digitais (cpf_hash);

CREATE INDEX IF NOT EXISTS idx_fluxo_processos_cpf_hash
    ON fluxo_processos (cpf_hash);

CREATE INDEX IF NOT EXISTS idx_inscricoes_cpf_hash
    ON inscricoes (cpf_hash);
