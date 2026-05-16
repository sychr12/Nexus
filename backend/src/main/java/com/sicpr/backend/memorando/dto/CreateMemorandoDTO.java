package com.sicpr.backend.memorando.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateMemorandoDTO(

        @NotBlank
        String numero,

        // Descrição curta do memorando (opcional)
        String descricao,

        @NotBlank
        String data,

        @NotBlank
        String unloc,

        // Município por extenso — se não informado, derivado do unloc no service
        String municipio,

        String memoEntrada

) {
}