INSERT INTO carteiras_digitais (
    registro,
    cpf,
    nome,
    propriedade,
    unloc,
    inicio,
    validade,
    endereco,
    atividade1,
    atividade2,
    georef,
    pdf_conteudo,
    foto1,
    foto2,
    foto3,
    usuario,
    criado_em,
    atualizado_em
)
SELECT
    legacy.registro,
    legacy.cpf,
    legacy.nome,
    legacy.propriedade,
    legacy.unloc,
    CASE WHEN legacy.inicio_atividade IS NULL THEN NULL ELSE LEFT(CAST(legacy.inicio_atividade AS VARCHAR), 10) END,
    CASE WHEN legacy.validade IS NULL THEN NULL ELSE LEFT(CAST(legacy.validade AS VARCHAR), 10) END,
    legacy.endereco,
    legacy.atividade_primaria,
    legacy.atividade_secundaria,
    legacy.georeferenciamento,
    legacy.pdf_conteudo,
    (SELECT foto.conteudo FROM carteira_fotos foto WHERE foto.carteira_id = legacy.id AND foto.ordem = 1 FETCH FIRST 1 ROW ONLY),
    (SELECT foto.conteudo FROM carteira_fotos foto WHERE foto.carteira_id = legacy.id AND foto.ordem = 2 FETCH FIRST 1 ROW ONLY),
    (SELECT foto.conteudo FROM carteira_fotos foto WHERE foto.carteira_id = legacy.id AND foto.ordem = 3 FETCH FIRST 1 ROW ONLY),
    legacy.usuario,
    legacy.created_at,
    legacy.updated_at
FROM carteira_digital legacy
WHERE NOT EXISTS (
    SELECT 1
    FROM carteiras_digitais current
    WHERE current.registro = legacy.registro
);

DROP TABLE IF EXISTS carteira_fotos;
DROP TABLE IF EXISTS carteira_digital;

CREATE INDEX IF NOT EXISTS idx_users_status_unidade
    ON users (status, unidade_local);
CREATE INDEX IF NOT EXISTS idx_users_ultimo_login
    ON users (ultimo_login);
CREATE INDEX IF NOT EXISTS idx_fluxo_processos_unidade_situacao
    ON fluxo_processos (unidade_local, situacao, criado_em);
CREATE INDEX IF NOT EXISTS idx_fluxo_processos_atualizado
    ON fluxo_processos (atualizado_em);
CREATE INDEX IF NOT EXISTS idx_inscricoes_municipio_criado
    ON inscricoes (municipio, criado_em);
CREATE INDEX IF NOT EXISTS idx_memorandos_unloc_criado
    ON memorandos (unloc, criado_em);
CREATE INDEX IF NOT EXISTS idx_carteiras_digitais_unloc_criado
    ON carteiras_digitais (unloc, criado_em);
