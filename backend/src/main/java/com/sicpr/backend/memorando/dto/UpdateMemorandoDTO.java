package com.sicpr.backend.memorando.dto;

public record UpdateMemorandoDTO(

        String numero,
        String descricao,
        String data,          // dd/MM/yyyy — opcional; null = não altera
        String unloc,
        String municipio,     // opcional; null = não altera
        String memoEntrada

) {
}