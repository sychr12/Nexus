package com.sicpr.backend.memorando.dto;

public record MemorandoResponseDTO(

        Long id,
        String numero,
        String descricao,
        String unloc,
        String municipio,
        String memoEntrada,
        String dataEmissao,
        String usuario,
        String criadoEm      // ISO-8601 — útil para o histórico no front

) {
}