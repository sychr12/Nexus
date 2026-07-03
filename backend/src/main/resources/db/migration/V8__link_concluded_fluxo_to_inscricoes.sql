ALTER TABLE IF EXISTS inscricoes
    ADD COLUMN IF NOT EXISTS origem VARCHAR(40);

ALTER TABLE IF EXISTS inscricoes
    ADD COLUMN IF NOT EXISTS processo_fluxo_id VARCHAR(40);

ALTER TABLE IF EXISTS inscricoes
    ADD COLUMN IF NOT EXISTS lancado_em TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS ux_inscricoes_processo_fluxo_id
    ON inscricoes (processo_fluxo_id);
