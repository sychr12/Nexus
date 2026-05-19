package com.sicpr.backend.memorando.dto;

public record FilterMemorandoDTO(

        String termo,
        String municipio,
        Integer ano,
        String ordem

) {
}